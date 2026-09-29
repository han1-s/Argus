require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const crypto = require('crypto');
const os = require('os');
const mysqlStore = require('../database/mysql');

const TERMS_VERSION = '2026-09-v1';
const PORT = Number(process.env.PORT || 3000);
const HOST = process.env.HOST || '0.0.0.0';
const OFFLINE_TIMEOUT_MS = Number(process.env.OFFLINE_TIMEOUT_MS || 45000);
const OFFLINE_CHECK_INTERVAL_MS = Number(process.env.OFFLINE_CHECK_INTERVAL_MS || 10000);
const app = express();
const server = http.createServer(app);
const io = new Server(server);
let db;
const sessions = new Map();

function id() { return crypto.randomUUID(); }
function safeUser(user) { return { id: user.id, name: user.name, email: user.email, webConsent: Boolean(user.webConsent), termsVersion: user.termsVersion || null }; }
function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) { return { salt, hash: crypto.scryptSync(password, salt, 64).toString('hex') }; }
function cookie(name, value, maxAge) { return `${name}=${encodeURIComponent(value)}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${maxAge}`; }
function sessionToken(req) { const t = (req.headers.cookie || '').match(/(?:^|;\s*)argus_session=([^;]+)/)?.[1]; return t ? decodeURIComponent(t) : null; }
function resolveSession(token) { if (!token) return null; const cached=sessions.get(token); if(cached)return cached; const digest=crypto.createHash('sha256').update(token).digest('hex'); const stored=(db.sessions||[]).find(s=>s.tokenHash===digest&&Date.parse(s.expiresAt)>Date.now()); if(stored)sessions.set(token,stored.userId); return stored?.userId||null; }
function auth(req, res, next) {
  const userId = resolveSession(sessionToken(req)); const user = db.users.find(u => u.id === userId);
  if (!user) return res.status(401).json({ error: 'Sessão expirada. Entre novamente.' });
  req.user = user; next();
}
function addEvent(machine, type, message) {
  db.events.unshift({ id: id(), machineId: machine.id, machineName: machine.name, type, message, at: new Date().toISOString() });
  db.events.length = Math.min(db.events.length, 500);
}
function publicMachine(machine) { const { token, ...visible } = machine; return visible; }
function clamp(value) { const n = Number(value); return Number.isFinite(n) ? Math.max(0, Math.min(100, n)) : 0; }
function ownerForMachine(machineId) { const machine = db.machines.find(m => m.id === machineId); return machine && db.users.find(u => u.id === machine.userId); }
const APP_NAMES = { chrome:'Google Chrome', msedge:'Microsoft Edge', firefox:'Mozilla Firefox', code:'Visual Studio Code', devenv:'Visual Studio', winword:'Microsoft Word', excel:'Microsoft Excel', powerpnt:'Microsoft PowerPoint', outlook:'Microsoft Outlook', teams:'Microsoft Teams', discord:'Discord', slack:'Slack', zoom:'Zoom Workplace', spotify:'Spotify', notepad:'Bloco de Notas', notepadplusplus:'Notepad++', explorer:'Explorador de Arquivos', vlc:'VLC media player', obs64:'OBS Studio', brave:'Brave', opera:'Opera', msaccess:'Microsoft Access', onedrive:'Microsoft OneDrive' };
function friendlyAppName(processName) { const key = String(processName || '').toLowerCase().replace(/\.exe$/, ''); return APP_NAMES[key] || key.replace(/[-_]+/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) || 'Aplicação sem identificação'; }
function updateApplicationSnapshot(machine, processes, now) {
  const previousSeen = Date.parse(machine.lastSeen);
  const elapsed = Number.isFinite(previousSeen) ? Math.max(0, Math.min(60, Math.floor((Date.parse(now) - previousSeen) / 1000))) : 0;
  const history = Array.isArray(machine.apps) ? machine.apps : [];
  for (const app of history) if (!app.processName) { app.processName = String(app.name || ''); app.name = friendlyAppName(app.processName); app.status = 'not_observed'; app.durationSeconds = 0; app.occurrences = 0; app.lastSeenAt = machine.lastSeen || now; app.timeType = 'estimativa por amostras do agente'; }
  const active = new Map(history.filter(a => a.status === 'running').map(a => [String(a.processName || a.name).toLowerCase(), a]));
  const detected = new Set();
  for (const item of Array.isArray(processes) ? processes.slice(0, 25) : []) {
    const processName = String(item.processName || item.name || '').replace(/\.exe$/i, '').slice(0, 100);
    const key = processName.toLowerCase(); if (!key || detected.has(key)) continue; detected.add(key);
    let app = history.find(a => String(a.processName || a.name).toLowerCase() === key);
    const isNewSession = !active.has(key) || active.get(key).status !== 'running';
    if (!app) { app = { processName, name: friendlyAppName(processName), durationSeconds: 0, occurrences: 0, firstSeenAt: now, lastSeenAt: now, status: 'running', cpu: 0, memory: 0, timeType: 'estimativa por amostras do agente' }; history.push(app); }
    app.processName = processName; app.name = friendlyAppName(processName); app.status = 'running'; app.cpu = Number.isFinite(Number(item.cpu)) ? Number(item.cpu) : null; app.memory = Number(item.memory) || 0;
    app.durationSeconds = Math.max(0, Number(app.durationSeconds) || 0) + (isNewSession ? 0 : elapsed);
    app.occurrences = Math.max(0, Number(app.occurrences) || 0) + (isNewSession ? 1 : 0);
    if (isNewSession) app.firstSeenAt = now;
    app.lastSeenAt = now;
    if (isNewSession) addEvent(machine, 'application', `Aplicação identificada: ${app.name}`);
  }
  for (const app of history) if (app.status === 'running' && !detected.has(String(app.processName || app.name).toLowerCase())) app.status = 'not_observed';
  machine.apps = history.sort((a,b) => Date.parse(b.lastSeenAt) - Date.parse(a.lastSeenAt)).slice(0, 100);
}
function applicationSummary(machines) {
  const grouped = new Map();
  for (const machine of machines) for (const app of machine.apps || []) {
    const key = String(app.processName || app.name).toLowerCase();
    const item = grouped.get(key) || { name: app.name, processName: app.processName, durationSeconds: 0, occurrences: 0, machineIds: new Set(), runningMachines: 0, lastSeenAt: app.lastSeenAt };
    item.durationSeconds += Number(app.durationSeconds) || 0; item.occurrences += Number(app.occurrences) || 0; item.machineIds.add(machine.id);
    if (machine.status === 'online' && app.status === 'running') item.runningMachines++;
    if (Date.parse(app.lastSeenAt) > Date.parse(item.lastSeenAt)) item.lastSeenAt = app.lastSeenAt;
    grouped.set(key, item);
  }
  return [...grouped.values()].map(({machineIds,...a}) => ({...a, machineCount:machineIds.size})).sort((a,b) => b.durationSeconds-a.durationSeconds).slice(0,50);
}
function webSummary(userId, days = 30) {
  const machines = new Map(db.machines.filter(m => m.userId === userId).map(m => [m.id, m.name]));
  const since = Date.now() - days * 86400000;
  const grouped = new Map();
  for (const entry of db.webActivity) {
    const machineName = machines.get(entry.machineId); if (!machineName || Date.parse(entry.at) < since) continue;
    const key = `${entry.machineId}:${entry.domain}`;
    const item = grouped.get(key) || { machineId: entry.machineId, machineName, domain: entry.domain, durationSeconds: 0, visits: 0, lastSeen: entry.at };
    item.durationSeconds += entry.durationSeconds; item.visits += 1;
    if (Date.parse(entry.at) > Date.parse(item.lastSeen)) item.lastSeen = entry.at;
    grouped.set(key, item);
  }
  return [...grouped.values()].sort((a,b) => b.durationSeconds - a.durationSeconds).slice(0, 200);
}
function validDomain(value) {
  const domain = String(value || '').trim().toLowerCase().replace(/\.$/, '');
  if (domain.length > 253 || domain.length < 4 || domain.includes('/') || domain.includes(':') || domain === 'localhost') return null;
  if (!/^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/.test(domain)) return null;
  return domain;
}
async function issueSession(user, res) { const token = crypto.randomBytes(32).toString('hex'); const createdAt=new Date(); const expiresAt=new Date(createdAt.getTime()+7*86400000); db.sessions.push({tokenHash:crypto.createHash('sha256').update(token).digest('hex'),userId:user.id,createdAt:createdAt.toISOString(),expiresAt:expiresAt.toISOString()}); await save(); sessions.set(token,user.id); res.setHeader('Set-Cookie', cookie('argus_session', token, 60 * 60 * 24 * 7)); }
async function save() { await mysqlStore.save(db); }

app.use(express.json({ limit: '256kb' }));
app.use(express.static(require('path').join(__dirname, '..', 'frontend')));
app.get('/downloads/argus-agent.js', (req,res) => res.sendFile(require('path').join(__dirname, '..', 'agent', 'agent.js')));
app.get('/downloads/argus-control.ps1', (req,res) => res.download(require('path').join(__dirname, '..', 'scripts', 'argus-control.ps1'), 'argus-control.ps1'));
function agentCommandDownload(req, res) {
  const host = String(req.query.server || '').trim(); const code = String(req.query.code || '').trim().toUpperCase();
  if (!/^https?:\/\/(?:[a-zA-Z0-9.-]+|\[[a-fA-F0-9:]+\])(?::[0-9]{1,5})?$/.test(host) || !/^ARG-[A-F0-9]{4}-[A-F0-9]{4}$/.test(code)) return res.status(400).send('Endereço do servidor ou código temporário inválido. Gere um novo pareamento no painel.');
  const content = `@echo off\r\nsetlocal\r\ncd /d "%~dp0"\r\nset "ARGUS_SERVER_URL=${host}"\r\nset "ARGUS_PAIR_CODE=${code}"\r\nset "ARGUS_AGENT_ONLY=1"\r\nset "ARGUS_HELPER_PATH=%~dp0argus-control.ps1"\r\nif not exist "%ARGUS_HELPER_PATH%" (\r\n  echo Baixando componentes de suporte do ARGUS...\r\n  powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "Invoke-WebRequest -Uri ($env:ARGUS_SERVER_URL + '/downloads/argus-control.ps1') -OutFile $env:ARGUS_HELPER_PATH"\r\n  if errorlevel 1 (echo Nao foi possivel baixar o suporte. Confira a rede e tente novamente.& pause & exit /b 1)\r\n)\r\npowershell.exe -NoProfile -ExecutionPolicy Bypass -File "%ARGUS_HELPER_PATH%"\r\n`;
  res.setHeader('Content-Type', 'application/octet-stream'); res.setHeader('Content-Disposition', 'attachment; filename="ARGUS.cmd"'); res.send(content);
}
app.get('/downloads/ARGUS.cmd', agentCommandDownload);
app.get('/api/legal/terms', (req,res) => res.json({ version: TERMS_VERSION, url: '/terms.html' }));

app.post('/api/auth/signup', async (req, res, next) => {
  try {
    const name = String(req.body.name || '').trim(); const email = String(req.body.email || '').trim().toLowerCase(); const password = String(req.body.password || '');
    if (name.length < 2 || !/^\S+@\S+\.\S+$/.test(email) || password.length < 10) return res.status(400).json({ error: 'Informe nome, e-mail válido e senha com pelo menos 10 caracteres.' });
    if (req.body.termsAccepted !== true || req.body.termsVersion !== TERMS_VERSION) return res.status(400).json({ error: 'Leia e aceite os termos atuais antes de criar a conta.' });
    if (db.users.some(u => u.email === email)) return res.status(409).json({ error: 'Este e-mail já possui uma conta.' });
    const now = new Date().toISOString(); const credentials = hashPassword(password);
    const user = { id: id(), name, email, ...credentials, createdAt: now, termsVersion: TERMS_VERSION, termsAcceptedAt: now, webConsent: req.body.webConsent === true };
    db.users.push(user); db.termAcceptances.push({ userId: user.id, version: TERMS_VERSION, acceptedAt: now, webConsent: user.webConsent }); await save(); await issueSession(user, res);
    res.status(201).json({ user: safeUser(user) });
  } catch (e) { next(e); }
});
app.post('/api/auth/login', async (req, res, next) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase(); const password = String(req.body.password || ''); const user = db.users.find(u => u.email === email);
    const candidate = user && crypto.scryptSync(password, user.salt, 64);
    if (!user || !crypto.timingSafeEqual(candidate, Buffer.from(user.hash, 'hex'))) return res.status(401).json({ error: 'E-mail ou senha incorretos.' });
    if (req.body.termsAccepted !== true || req.body.termsVersion !== TERMS_VERSION) return res.status(428).json({ error: 'Leia e aceite a versão atual dos termos para continuar.' });
    const now = new Date().toISOString(); user.termsVersion = TERMS_VERSION; user.termsAcceptedAt = now;
    if (Object.prototype.hasOwnProperty.call(req.body, 'webConsent')) user.webConsent = req.body.webConsent === true;
    db.termAcceptances.push({ userId: user.id, version: TERMS_VERSION, acceptedAt: now, webConsent: user.webConsent });
    if (!user.webConsent) { db.webActivity = db.webActivity.filter(w => !db.machines.some(m => m.userId === user.id && m.id === w.machineId)); await mysqlStore.acknowledgeConsentRevocation(user.id); }
    await save(); await issueSession(user, res); res.json({ user: safeUser(user) });
  } catch (e) { next(e); }
});
app.post('/api/auth/logout', async (req, res, next) => { try { const token=sessionToken(req); if(token){sessions.delete(token);const digest=crypto.createHash('sha256').update(token).digest('hex');db.sessions=db.sessions.filter(s=>s.tokenHash!==digest);await save();}res.setHeader('Set-Cookie',cookie('argus_session','',0));res.json({ok:true});}catch(e){next(e);} });
app.get('/api/auth/me', auth, (req,res) => res.json({ user: safeUser(req.user) }));

app.post('/api/pairings', auth, async (req, res, next) => {
  try {
    const code = `ARG-${crypto.randomBytes(2).toString('hex').toUpperCase()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
    db.pairings = db.pairings.filter(p => p.expiresAt > Date.now()); db.pairings.push({ code, userId: req.user.id, expiresAt: Date.now() + 900000 }); await save();
    res.status(201).json({ code, expiresIn: 900 });
  } catch (e) { next(e); }
});
app.post('/api/agent/connect', async (req, res, next) => {
  try {
    const code = String(req.body.code || '').toUpperCase().trim(); const index = db.pairings.findIndex(p => p.code === code && p.expiresAt > Date.now());
    if (index < 0) return res.status(400).json({ error: 'Código inválido ou expirado. Gere um novo no dashboard.' });
    const pairing = db.pairings.splice(index, 1)[0]; const name = String(req.body.name || 'Computador').slice(0,80);
    let machine = db.machines.find(m => m.userId === pairing.userId && m.name.toLowerCase() === name.toLowerCase());
    const token = crypto.randomBytes(32).toString('hex'); const now = new Date().toISOString();
    if (!machine) { machine = { id: id(), userId: pairing.userId, name, status: 'online', createdAt: now, firstSeenAt: now, metrics: {}, apps: [], lastSeen: now, token, webActivity: 'Extensão de navegação ainda não conectada.' }; db.machines.push(machine); addEvent(machine,'connected','Novo computador conectado'); }
    else { machine.token = token; machine.status = 'online'; machine.lastSeen = now; }
    await save(); io.to(`user:${pairing.userId}`).emit('update'); res.json({ token, machineId: machine.id, serverTime: now });
  } catch(e) { next(e); }
});
app.post('/api/agent/heartbeat', async (req, res, next) => {
  try {
    const token = String(req.headers.authorization || '').replace(/^Bearer\s+/i, ''); const machine = db.machines.find(m => m.token && m.token === token);
    if (!machine) return res.status(401).json({ error: 'Agente não autorizado. Conecte usando um novo código.' });
    const body = req.body || {}; const previousStatus = machine.status;
    machine.name = String(body.name || machine.name).slice(0,80); machine.userName = String(body.userName || 'Não informado').slice(0,100);
    machine.os = String(body.os || 'Sistema desconhecido').slice(0,120); machine.arch = String(body.arch || '').slice(0,30); machine.uptime = Number(body.uptime) || 0;
    machine.metrics = { cpu: clamp(body.metrics?.cpu), ram: clamp(body.metrics?.ram), disk: clamp(body.metrics?.disk), memoryUsed: Number(body.metrics?.memoryUsed) || 0, memoryTotal: Number(body.metrics?.memoryTotal) || 0 };
    const heartbeatAt = new Date().toISOString(); updateApplicationSnapshot(machine, body.apps, heartbeatAt); machine.lastSeen = heartbeatAt; machine.status = 'online';
    if (previousStatus !== 'online') addEvent(machine,'connected','Computador voltou a ficar online');
    if ((machine.metrics.cpu >= 85 || machine.metrics.ram >= 90) && !db.alerts.some(a => a.machineId === machine.id && a.open && a.kind === (machine.metrics.cpu >= 85 ? 'cpu' : 'ram'))) {
      const kind = machine.metrics.cpu >= 85 ? 'cpu' : 'ram'; const alert = { id:id(),machineId:machine.id,machineName:machine.name,kind,message:kind === 'cpu' ? 'CPU acima de 85%' : 'RAM acima de 90%',at:machine.lastSeen,open:true }; db.alerts.unshift(alert); addEvent(machine,'alert',alert.message);
    }
    const owner = ownerForMachine(machine.id);
    if (owner?.webConsent && Array.isArray(body.navigation)) {
      const grouped = new Map();
      for (const item of body.navigation.slice(0,40)) { const domain = validDomain(item.domain); const seconds = Math.floor(Number(item.durationSeconds)); if (!domain || !Number.isFinite(seconds) || seconds < 1 || seconds > 60) continue; grouped.set(domain,(grouped.get(domain)||0)+seconds); }
      for (const [domain,durationSeconds] of grouped) db.webActivity.unshift({ id:id(),machineId:machine.id,domain,durationSeconds:Math.min(60,durationSeconds),at:machine.lastSeen });
      db.webActivity.length = Math.min(db.webActivity.length,5000);
      if (grouped.size) machine.webActivity = 'Extensão instalada; domínios e tempo em aba ativa.';
    } else if (!owner?.webConsent) machine.webActivity = 'Coleta desativada: consentimento não concedido.';
    await save(); io.to(`user:${machine.userId}`).emit('update'); res.json({ ok:true,serverTime:machine.lastSeen,webCollection:!!owner?.webConsent });
  } catch(e) { next(e); }
});

app.get('/api/dashboard', auth, (req,res) => {
  const machines = db.machines.filter(m => m.userId === req.user.id).map(publicMachine); const online = machines.filter(m => m.status === 'online').length;
  const machineIds = new Set(machines.map(m => m.id)); const alerts = db.alerts.filter(a => a.open && machineIds.has(a.machineId));
  res.json({ summary:{total:machines.length,online,offline:machines.length-online,users:new Set(machines.filter(m=>m.status==='online').map(m=>m.userName).filter(Boolean)).size,alerts:alerts.length},machines,applications:applicationSummary(machines),events:db.events.filter(e=>machineIds.has(e.machineId)).slice(0,30),alerts:alerts.slice(0,20),webActivity:webSummary(req.user.id) });
});
app.get('/api/machines/:id', auth, (req,res) => {
  const machine = db.machines.find(m => m.id === req.params.id && m.userId === req.user.id); if (!machine) return res.status(404).json({error:'Computador não encontrado.'});
  res.json({ machine:publicMachine(machine),events:db.events.filter(e=>e.machineId===machine.id).slice(0,100),webActivity:webSummary(req.user.id).filter(w=>w.machineId===machine.id) });
});
app.get('/api/reports', auth, (req,res) => {
  const days = Math.min(30,Math.max(1,Number(req.query.days)||7)); const since=Date.now()-days*86400000; const machines=db.machines.filter(m=>m.userId===req.user.id); const ids=new Set(machines.map(m=>m.id));
  res.json({days,machines:machines.map(publicMachine),events:db.events.filter(e=>ids.has(e.machineId)&&Date.parse(e.at)>=since),alerts:db.alerts.filter(a=>ids.has(a.machineId)&&Date.parse(a.at)>=since),webActivity:webSummary(req.user.id,days)});
});
app.get('/api/config', auth, (req,res) => { const nets=os.networkInterfaces(); const ips=Object.values(nets).flat().filter(x=>x&&x.family==='IPv4'&&!x.internal).map(x=>x.address); res.json({ips,port:PORT}); });
app.get('/api/privacy/export', auth, (req,res) => { const machines=db.machines.filter(m=>m.userId===req.user.id); const ids=new Set(machines.map(m=>m.id)); res.json({user:safeUser(req.user),machines:machines.map(publicMachine),events:db.events.filter(e=>ids.has(e.machineId)),alerts:db.alerts.filter(a=>ids.has(a.machineId)),webActivity:db.webActivity.filter(w=>ids.has(w.machineId)),terms:db.termAcceptances.filter(t=>t.userId===req.user.id)}); });
app.post('/api/privacy/web-consent', auth, async (req,res,next) => {
  try { req.user.webConsent=req.body.enabled===true; const consentAt=new Date().toISOString(); db.termAcceptances.push({userId:req.user.id,version:TERMS_VERSION,acceptedAt:consentAt,webConsent:req.user.webConsent}); if(!req.user.webConsent){db.webActivity=db.webActivity.filter(w=>!db.machines.some(m=>m.userId===req.user.id&&m.id===w.machineId));await mysqlStore.acknowledgeConsentRevocation(req.user.id);} await save(); io.to(`user:${req.user.id}`).emit('update'); res.json({webConsent:req.user.webConsent}); }
  catch(e){next(e);}
});
app.post('/api/privacy/delete-account', auth, async (req,res,next) => {
  try { const userId=req.user.id; await mysqlStore.deleteUser(userId); db.users=db.users.filter(u=>u.id!==userId); const machines=db.machines.filter(m=>m.userId===userId);const ids=new Set(machines.map(m=>m.id));db.machines=db.machines.filter(m=>m.userId!==userId);db.events=db.events.filter(e=>!ids.has(e.machineId));db.alerts=db.alerts.filter(a=>!ids.has(a.machineId));db.webActivity=db.webActivity.filter(w=>!ids.has(w.machineId));db.pairings=db.pairings.filter(p=>p.userId!==userId);db.termAcceptances=db.termAcceptances.filter(t=>t.userId!==userId);for(const [token,owner] of sessions)if(owner===userId)sessions.delete(token);res.setHeader('Set-Cookie',cookie('argus_session','',0));res.json({ok:true}); }
  catch(e){next(e);}
});
app.post('/api/alerts/:id/ack', auth, async (req,res,next) => { try { const a=db.alerts.find(x=>x.id===req.params.id&&db.machines.some(m=>m.id===x.machineId&&m.userId===req.user.id));if(!a)return res.status(404).json({error:'Alerta não encontrado.'});a.open=false;await save();io.to(`user:${req.user.id}`).emit('update');res.json({ok:true});}catch(e){next(e);} });

io.use((socket,next)=>{const raw=socket.handshake.headers.cookie?.match(/(?:^|;\s*)argus_session=([^;]+)/)?.[1];let token;try{token=raw&&decodeURIComponent(raw);}catch{}const userId=resolveSession(token);if(!userId)return next(new Error('unauthorized'));socket.userId=userId;next();});
io.on('connection',socket=>socket.join(`user:${socket.userId}`));
setInterval(async()=>{if(!db)return;let changed=false;for(const machine of db.machines)if(machine.status!=='offline'&&Date.now()-Date.parse(machine.lastSeen)>OFFLINE_TIMEOUT_MS){machine.status='offline';for(const app of machine.apps||[])if(app.status==='running')app.status='not_observed';addEvent(machine,'offline',`Conexão perdida — sem heartbeat há ${Math.round(OFFLINE_TIMEOUT_MS/1000)} segundos`);db.alerts.unshift({id:id(),machineId:machine.id,machineName:machine.name,kind:'offline',message:'Conexão perdida',at:new Date().toISOString(),open:true});changed=true;}if(changed){try{await save();for(const user of db.users)io.to(`user:${user.id}`).emit('update');}catch(e){console.error('Falha ao salvar status offline:',e.message);}}},OFFLINE_CHECK_INTERVAL_MS).unref();

app.use((err,req,res,next)=>{console.error(err);if(!res.headersSent)res.status(500).json({error:'Erro interno do ARGUS. Verifique o log do backend.'});});

async function start(){
  try{db=await mysqlStore.initialize();db.sessions=db.sessions||[];const cleanup=setInterval(async()=>{db.pairings=db.pairings.filter(p=>p.expiresAt>Date.now());db.sessions=db.sessions.filter(s=>Date.parse(s.expiresAt)>Date.now());db.webActivity=db.webActivity.filter(w=>Date.parse(w.at)>Date.now()-90*86400000);await mysqlStore.prune().catch(e=>console.error('Falha na limpeza de retenção:',e.message));},3600000);cleanup.unref();server.listen(PORT,HOST,()=>console.log(`ARGUS backend inicializado em http://localhost:${PORT} (LAN: http://<IP-do-administrador>:${PORT})`));}
  catch(error){await mysqlStore.close().catch(()=>{});console.error('Não foi possível iniciar o ARGUS. Confira o MySQL local e as variáveis do arquivo .env.');console.error(error.message);process.exitCode=1;}
}
start();
process.on('SIGINT',async()=>{await mysqlStore.close().catch(()=>{});process.exit(0);});
