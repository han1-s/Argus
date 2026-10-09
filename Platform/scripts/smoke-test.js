// Full HTTP and agent smoke test. The MySQL adapter is replaced with an in-memory store,
// so this exercises the application flow without modifying a developer's real database.
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const net = require('node:net');
const { spawn, execFileSync } = require('node:child_process');
const Module = require('node:module');

const db = { users: [], machines: [], pairings: [], events: [], alerts: [], webActivity: [], termAcceptances: [], sessions: [] };
const resetCodes = new Map();
const store = {
  initialize: async () => db,
  refreshUsers: async () => {},
  findSessionUser: async tokenHash => {
    const session = db.sessions.find(row => row.tokenHash === tokenHash && Date.parse(row.expiresAt) > Date.now());
    const user = session && db.users.find(row => row.id === session.userId);
    return user ? { id: user.id, name: user.name, email: user.email, webConsent: Boolean(user.webConsent), termsVersion: user.termsVersion || null } : null;
  },
  createSession: async session => { db.sessions.push(session); },
  deleteSession: async tokenHash => { db.sessions = db.sessions.filter(row => row.tokenHash !== tokenHash); },
  createPasswordReset: async email => { if (!db.users.some(user => user.email === email)) return null; resetCodes.set(email, '123456'); return '123456'; },
  completePasswordReset: async (email, code, password) => {
    if (resetCodes.get(email) !== code) return null;
    const user = db.users.find(entry => entry.email === email);
    if (!user) return null;
    user.salt = crypto.randomBytes(16).toString('hex'); user.hash = crypto.scryptSync(password, user.salt, 64).toString('hex');
    db.sessions = db.sessions.filter(session => session.userId !== user.id); resetCodes.delete(email); return user.id;
  },
  save: async () => {},
  acknowledgeConsentRevocation: async () => {},
  deleteUser: async userId => {
    const machineIds = new Set(db.machines.filter(m => m.userId === userId).map(m => m.id));
    for (const key of ['users','machines','pairings','termAcceptances','sessions']) db[key] = db[key].filter(row => row.userId !== userId && row.id !== userId);
    db.events = db.events.filter(row => !machineIds.has(row.machineId)); db.alerts = db.alerts.filter(row => !machineIds.has(row.machineId)); db.webActivity = db.webActivity.filter(row => !machineIds.has(row.machineId));
  },
  prune: async () => {}, close: async () => {}
};
const backendPath = path.resolve(__dirname, '..', 'backend', 'server.js');
for (const relativePath of ['backend/server.js','agent/agent.js','agent/setup.js','frontend/app.js','browser-extension/background.js','browser-extension/popup.js']) {
  execFileSync(process.execPath, ['--check',path.resolve(__dirname,'..',relativePath)], { stdio:'pipe' });
}
const originalLoad = Module._load;
Module._load = function(request, parent, isMain) {
  if (parent?.filename === backendPath && request === '../database/mysql') return store;
  return originalLoad.call(this, request, parent, isMain);
};

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
async function availablePort() {
  const probe = net.createServer(); await new Promise(resolve => probe.listen(0, '127.0.0.1', resolve));
  const port = probe.address().port; await new Promise(resolve => probe.close(resolve)); return port;
}
async function waitFor(fn, label, timeout = 15000) {
  const until = Date.now() + timeout; let last;
  while (Date.now() < until) { try { const value = await fn(); if (value) return value; } catch (error) { last = error; } await delay(300); }
  throw new Error(`Timeout esperando ${label}${last ? `: ${last.message}` : ''}`);
}
async function responseJson(url, options) { const response = await fetch(url, options); return { response, body: await response.json().catch(() => ({})) }; }
function launchAgent(folder) {
  const child = spawn(process.execPath, ['agent.js'], { cwd: folder, windowsHide: true, stdio: ['ignore','pipe','pipe'] });
  child.stdout.on('data', chunk => process.stdout.write(`[agent] ${chunk}`)); child.stderr.on('data', chunk => process.stderr.write(`[agent] ${chunk}`));
  return child;
}
function launchSetup(folder, port, bridgePort) {
  const child = spawn(process.execPath, ['setup.js'], { cwd: folder, env:{...process.env,ARGUS_SETUP_PORT:String(port),ARGUS_AGENT_BRIDGE_PORT:String(bridgePort),COMPUTERNAME:'ARGUS-SMOKE-PC'}, windowsHide: true, stdio: ['ignore','pipe','pipe'] });
  child.stdout.on('data', chunk => process.stdout.write(`[setup] ${chunk}`)); child.stderr.on('data', chunk => process.stderr.write(`[setup] ${chunk}`));
  return child;
}
async function stopAgent(child) {
  if (!child || child.exitCode !== null) return;
  child.kill('SIGINT'); await Promise.race([new Promise(resolve => child.once('exit', resolve)), delay(3000)]);
  if (child.exitCode === null) child.kill('SIGKILL');
}
async function stopSetup(child) {
  if (!child || child.exitCode !== null) return;
  child.kill('SIGTERM'); await Promise.race([new Promise(resolve => child.once('exit', resolve)), delay(1500)]);
  if (child.exitCode === null) child.kill('SIGKILL');
}
async function removeSmokeDirectory(folder) {
  for (let attempt = 0; attempt < 12; attempt += 1) {
    try { await fs.promises.rm(folder, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 }); return; }
    catch (error) {
      if (!['EPERM', 'EBUSY', 'ENOTEMPTY'].includes(error.code) || attempt === 11) throw error;
      await delay(250);
    }
  }
}

(async () => {
  let agent; let setup; let agentDir;
  try {
    process.env.PORT = String(await availablePort()); process.env.HOST = '127.0.0.1';
    process.env.OFFLINE_TIMEOUT_MS = '4000'; process.env.OFFLINE_CHECK_INTERVAL_MS = '250';
    const base = `http://127.0.0.1:${process.env.PORT}`;
    require(backendPath);
    await waitFor(async () => (await fetch(`${base}/api/legal/terms`)).ok, 'backend iniciar');
    assert.equal((await fetch(`${base}/api/dashboard`)).status, 401, 'dashboard requires an authenticated session');
    const terms = await (await fetch(`${base}/terms.html`)).text(); assert.match(terms, /LGPD/);
      assert.equal((await fetch(`${base}/downloads/ARGUS.cmd`)).status, 400, 'installer rejects missing server address');
    assert.equal((await fetch(`${base}/downloads/argus-agent.js`)).status, 200, 'agent package is downloadable');
    assert.equal((await fetch(`${base}/downloads/argus-foreground-watcher.ps1`)).status, 200, 'foreground watcher is downloadable');
    const email = `argus-smoke-${crypto.randomUUID()}@example.test`;
    const invalid = await responseJson(`${base}/api/auth/signup`, { method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:'Smoke Admin',email,password:'ValidPass123'}) });
    assert.equal(invalid.response.status, 400, 'signup must require an explicit terms acceptance');
    const signup = await responseJson(`${base}/api/auth/signup`, { method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:'Smoke Admin',email,password:'ValidPass123',termsAccepted:true,termsVersion:'2026-09-v1',webConsent:true}) });
    assert.equal(signup.response.status, 201); const cookie = signup.response.headers.get('set-cookie')?.split(';')[0]; assert.ok(cookie, 'login cookie returned');
    assert.equal((await responseJson(`${base}/api/auth/signup`, { method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:'Smoke Admin',email,password:'ValidPass123',termsAccepted:true,termsVersion:'2026-09-v1'}) })).response.status, 409, 'duplicate accounts are rejected');
    assert.equal((await responseJson(`${base}/api/auth/login`, { method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email,password:'wrong-password',termsVersion:'2026-09-v1',termsAccepted:true}) })).response.status, 401, 'incorrect credentials are rejected');
    const rejectedLogin = await responseJson(`${base}/api/auth/login`, { method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email,password:'ValidPass123',termsVersion:'2026-09-v1',termsAccepted:false}) });
    assert.equal(rejectedLogin.response.status, 428, 'login must require explicit terms confirmation');
    const successfulLogin = await responseJson(`${base}/api/auth/login`, { method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email,password:'ValidPass123',termsVersion:'2026-09-v1',termsAccepted:true}) });
    assert.equal(successfulLogin.response.status,200,'accepted terms allow login');
    const externalSessionToken = crypto.randomBytes(32).toString('hex');
    const externalSessionHash = crypto.createHash('sha256').update(externalSessionToken).digest('hex');
    db.sessions.push({ tokenHash:externalSessionHash, userId:db.users[0].id, createdAt:new Date().toISOString(), expiresAt:new Date(Date.now()+60000).toISOString() });
    const externalCookie = `argus_session=${externalSessionToken}`;
    assert.equal((await responseJson(`${base}/api/auth/me`,{headers:{Cookie:externalCookie}})).response.status,200,'Platform accepts a live session created by another ARGUS backend');
    assert.equal((await responseJson(`${base}/api/auth/logout`,{method:'POST',headers:{Cookie:externalCookie}})).response.status,200);
    assert.equal(db.sessions.some(session=>session.tokenHash===externalSessionHash),false,'Platform logout removes a shared MySQL session');
    assert.equal((await responseJson(`${base}/api/auth/me`,{headers:{Cookie:externalCookie}})).response.status,401,'revoked shared sessions are rejected on the next request');
    const resetEmail = `argus-reset-${crypto.randomUUID()}@example.test`;
    const resetSignup = await responseJson(`${base}/api/auth/signup`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:'Reset Test',email:resetEmail,password:'BeforeReset123',termsAccepted:true,termsVersion:'2026-09-v1'})});
    assert.equal(resetSignup.response.status,201);
    const recovery = await responseJson(`${base}/api/auth/forgot-password`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:resetEmail})});
    assert.equal(recovery.response.status,200); assert.equal(recovery.body.simulatedEmail.code,'123456','simulated email exposes a usable demo code');
    const wrongReset = await responseJson(`${base}/api/auth/reset-password`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:resetEmail,code:'000000',password:'AfterReset123'})});
    assert.equal(wrongReset.response.status,400,'invalid reset code is rejected');
    const shortReset = await responseJson(`${base}/api/auth/reset-password`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:resetEmail,code:recovery.body.simulatedEmail.code,password:'Short1234'})});
    assert.equal(shortReset.response.status,400,'password reset keeps the 10-character account password minimum');
    const completedReset = await responseJson(`${base}/api/auth/reset-password`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:resetEmail,code:recovery.body.simulatedEmail.code,password:'AfterReset123'})});
    assert.equal(completedReset.response.status,200,'valid reset code changes the account password');
    assert.equal((await responseJson(`${base}/api/auth/login`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:resetEmail,password:'BeforeReset123',termsAccepted:true,termsVersion:'2026-09-v1'})})).response.status,401,'old password is invalid after reset');
    assert.equal((await responseJson(`${base}/api/auth/login`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:resetEmail,password:'AfterReset123',termsAccepted:true,termsVersion:'2026-09-v1'})})).response.status,200,'replacement password authenticates');
    const networkConfig = await responseJson(`${base}/api/config`, { headers:{Cookie:cookie} }); assert.equal(networkConfig.response.status,200); assert.equal(networkConfig.body.port,Number(process.env.PORT));
    assert.equal((await fetch(`${base}/downloads/ARGUS.cmd?server=${encodeURIComponent(base)}&code=ARG-AB12-CD34`)).status,400,'installer refuses an embedded pairing code');
    assert.equal((await fetch(`${base}/downloads/ARGUS.cmd?server=${encodeURIComponent('http://127.0.0.1:99999')}`)).status,400,'installer rejects out-of-range server ports');
    const setupCommandResponse = await fetch(`${base}/downloads/ARGUS.cmd?server=${encodeURIComponent(base)}`);
    assert.equal(setupCommandResponse.status,200,'pairing flow provides a downloadable ARGUS command');
    const setupCommand = await setupCommandResponse.text(); assert.match(setupCommand,/ARGUS_AGENT_ONLY=1/); assert.match(setupCommand,/ARGUS_INSTALL_ONLY=1/); assert.doesNotMatch(setupCommand,/ARGUS_PAIR_CODE|ARG-[A-F0-9]{4}-[A-F0-9]{4}/); assert.match(setupCommand,new RegExp(base.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')));
    assert.equal((await fetch(`${base}/downloads/argus-setup.js`)).status,200,'local setup assistant is downloadable');
    const controlScript = await fetch(`${base}/downloads/argus-control.ps1`); assert.equal(controlScript.status,200); const controlText=await controlScript.text(); assert.match(controlText,/function Install-Agent/); assert.match(controlText,/ARGUS_INSTALL_ONLY/); assert.match(controlText,/setup.js/); assert.match(controlText,/foreground-watcher\.ps1/); assert.match(controlText,/127\.0\.0\.1:43173/); assert.match(controlText,/SAIBA MAIS/); assert.match(controlText,/5\. Saiba mais/); assert.match(controlText,/7\. Saiba mais/);
    if (process.platform === 'win32') {
      const scriptPath = path.resolve(__dirname, 'argus-control.ps1').replace(/'/g, "''");
      execFileSync('powershell.exe', ['-NoProfile','-Command',`$source = [System.IO.File]::ReadAllText('${scriptPath}'); [void][scriptblock]::Create($source)`], { stdio:'pipe' });
      const watcherPath = path.resolve(__dirname, '..', 'agent', 'foreground-watcher.ps1');
      const watcherSample = execFileSync('powershell.exe', ['-NoProfile','-ExecutionPolicy','Bypass','-File',watcherPath,'-Once'], { encoding:'utf8', timeout:10000 }).trim();
      assert.match(watcherSample,/^(FOCUS\t\d+\t.+|IDLE)$/,'foreground watcher reports the current app or idle state');
    }
    agentDir = fs.mkdtempSync(path.join(os.tmpdir(),'argus-agent-smoke-')); fs.copyFileSync(path.resolve(__dirname,'..','agent','agent.js'),path.join(agentDir,'agent.js')); fs.copyFileSync(path.resolve(__dirname,'..','agent','setup.js'),path.join(agentDir,'setup.js')); fs.copyFileSync(path.resolve(__dirname,'..','agent','foreground-watcher.ps1'),path.join(agentDir,'foreground-watcher.ps1'));
    let setupPort=await availablePort(); const bridgePort=await availablePort(); let setupBase=`http://127.0.0.1:${setupPort}`; setup=launchSetup(agentDir,setupPort,bridgePort);
    const setupPage=await waitFor(async()=>{const response=await fetch(setupBase);return response.ok?response:null;},'assistente local abrir');
    const setupHtml=await setupPage.text(); assert.match(setupHtml,/Endereço LAN do servidor ARGUS/); assert.match(setupHtml,/Nome deste computador/); assert.match(setupHtml,/Código de conexão/); assert.doesNotMatch(setupHtml,/E-mail da conta ARGUS|Senha da conta ARGUS/);
    assert.match(setupHtml,/Cancelar instalação/);
    assert.equal((await fetch(`${setupBase}/api/cancel`,{method:'POST'})).status,200,'setup can be canceled');
    await waitFor(async()=>setup.exitCode!==null,'assistente encerrar após cancelamento'); assert.equal(db.pairings.length,0); assert.equal(fs.existsSync(path.join(agentDir,'config.json')),false,'canceling setup does not create an agent config');
    setupPort=await availablePort(); setupBase=`http://127.0.0.1:${setupPort}`; setup=launchSetup(agentDir,setupPort,bridgePort);
    await waitFor(async()=>{const response=await fetch(setupBase);return response.ok?response:null;},'assistente local reabrir após cancelamento');
    const badSetup=await responseJson(`${setupBase}/api/setup`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({serverUrl:base,deviceName:'ARGUS-SMOKE-PC',email,password:'ValidPass123',termsAccepted:false})}); assert.equal(badSetup.response.status,400,'setup requires terms acceptance');
    const badSetupCode=await responseJson(`${setupBase}/api/setup`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({serverUrl:base,deviceName:'ARGUS-SMOKE-PC',pairingCode:'ARG-0000-0000',termsAccepted:true})}); assert.equal(badSetupCode.response.status,400,'setup rejects invalid pairing codes'); assert.equal(db.pairings.length,0,'invalid code cannot create a connection');
    const pairing=await responseJson(`${base}/api/pairings`,{method:'POST',headers:{Cookie:cookie,'Content-Type':'application/json'},body:'{}'}); assert.equal(pairing.response.status,201,'authenticated dashboard generates a pairing code'); assert.match(pairing.body.code,/^ARG-[A-F0-9]{4}-[A-F0-9]{4}$/);
    const configured=await responseJson(`${setupBase}/api/setup`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({serverUrl:base,deviceName:'ARGUS-SMOKE-PC',pairingCode:pairing.body.code,termsAccepted:true})});
    assert.equal(configured.response.status,200,'local setup assistant connects using only the one-time pairing code');
    await waitFor(async()=>setup.exitCode!==null,'assistente local encerrar após configurar');
    const config=JSON.parse(fs.readFileSync(path.join(agentDir,'config.json'),'utf8'));
    assert.equal(config.deviceName,'ARGUS-SMOKE-PC'); assert.ok(config.deviceToken); assert.ok(config.bridgeKey); assert.ok(!JSON.stringify(config).includes('ValidPass123'),'admin password is not persisted in the agent config');
    const connected={body:{token:config.deviceToken,machineId:db.machines[0].id}};
    assert.equal((await responseJson(`${base}/api/agent/connect`, { method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({code:pairing.body.code,name:'ARGUS-REPLAY-PC'}) })).response.status,400,'dashboard-generated pairing code is single-use');
    agent=launchAgent(agentDir);
    const live = await waitFor(async()=>{const {body}=await responseJson(`${base}/api/dashboard`,{headers:{Cookie:cookie}});return body.machines?.[0]?.status==='online'&&body.machines[0].metrics?.memoryTotal?body:null;},'agente enviar métricas reais');
    assert.equal(live.machines[0].name,'ARGUS-SMOKE-PC','agent preserves the configured device name');
    assert.ok(live.machines[0].metrics.cpu >= 0 && live.machines[0].metrics.cpu <= 100); assert.ok(live.machines[0].apps.length > 0,'agent reports local processes');
    await stopAgent(agent); agent=null;
    const reportDate=new Date().toISOString().slice(0,10);
    const appHeartbeat = (apps,foregroundUsage=[],foregroundApp=null,batchId=crypto.randomUUID()) => responseJson(`${base}/api/agent/heartbeat`, { method:'POST',headers:{Authorization:`Bearer ${connected.body.token}`,'Content-Type':'application/json'},body:JSON.stringify({name:'ARGUS-SMOKE-PC',userName:'smoke',os:'Windows_NT test',metrics:{cpu:5,ram:8,disk:10},apps,foregroundTelemetryAvailable:true,foregroundApp,foregroundBatchId:batchId,foregroundUsage}) });
    const smokeApp = [{name:'argus-smoke-app',processName:'argus-smoke-app',cpu:null,memory:12}];
    const firstFocusBatch=crypto.randomUUID();
    assert.equal((await appHeartbeat(smokeApp,[{processName:'argus-smoke-app',date:reportDate,durationMilliseconds:0,occurrences:1}],'argus-smoke-app',firstFocusBatch)).response.status,200);
    await delay(1200);
    db.machines[0].apps.find(app=>app.processName==='argus-smoke-app').durationSeconds=900;
    db.machines[0].apps.find(app=>app.processName==='argus-smoke-app').occurrences=99;
    const durationFocusBatch=crypto.randomUUID();
    const measuredDelta=[{processName:'argus-smoke-app',date:reportDate,durationMilliseconds:1234,occurrences:0}];
    assert.equal((await appHeartbeat(smokeApp,measuredDelta,'argus-smoke-app',durationFocusBatch)).response.status,200);
    assert.equal((await appHeartbeat(smokeApp,measuredDelta,'argus-smoke-app',durationFocusBatch)).response.status,200,'replayed foreground batch is idempotent');
    let appDashboard = (await responseJson(`${base}/api/dashboard`,{headers:{Cookie:cookie}})).body;
    let appRecord = appDashboard.machines[0].apps.find(a=>a.processName==='argus-smoke-app');
    assert.equal(appRecord.name,'Argus Smoke App','process name is presented as a friendly application name');
    assert.equal(appRecord.foregroundOccurrences,1,'foreground transition records one observed app session');
    assert.equal(appRecord.foregroundDurationMilliseconds,1234,'application duration uses measured foreground milliseconds');
    assert.equal(appRecord.durationSeconds,0,'legacy heartbeat estimates are not retained as actual usage');
    assert.equal(appRecord.occurrences,0,'legacy process-session counts are not reported as foreground transitions');
    assert.equal(appDashboard.applications.find(a=>a.processName==='argus-smoke-app').durationMilliseconds,1234,'application overview aggregates observed foreground use');
    assert.equal(appDashboard.applications.find(a=>a.processName==='argus-smoke-app').machineCount,1,'dashboard aggregates application use by machine');
    const namedProcessSamples = ['msedge','winword','idea64','telegram','vlc','explorer','svchost'].map(processName => ({ name: processName, processName, cpu: 0, memory: 0 }));
    assert.equal((await appHeartbeat(namedProcessSamples)).response.status,200);
    appDashboard = (await responseJson(`${base}/api/dashboard`,{headers:{Cookie:cookie}})).body;
    const knownNames = new Map(appDashboard.machines[0].apps.map(app => [app.processName, app.name]));
    for (const [processName, friendlyName] of [['msedge','Microsoft Edge'],['winword','Microsoft Word'],['idea64','IntelliJ IDEA'],['telegram','Telegram'],['vlc','VLC media player'],['explorer','Explorador de Arquivos'],['svchost','Host de Serviço do Windows']]) {
      assert.equal(knownNames.get(processName),friendlyName,`${processName} is presented with its product name`);
    }
    assert.equal((await appHeartbeat([])).response.status,200);
    appDashboard = (await responseJson(`${base}/api/dashboard`,{headers:{Cookie:cookie}})).body;
    assert.equal(appDashboard.machines[0].apps.find(a=>a.processName==='argus-smoke-app').status,'not_observed','missing process samples are not mislabeled as confirmed exits');
    assert.equal((await appHeartbeat(smokeApp,[{processName:'argus-smoke-app',date:reportDate,durationMilliseconds:0,occurrences:1}],'argus-smoke-app')).response.status,200);
    appDashboard = (await responseJson(`${base}/api/dashboard`,{headers:{Cookie:cookie}})).body;
    assert.equal(appDashboard.machines[0].apps.find(a=>a.processName==='argus-smoke-app').foregroundOccurrences,2,'a later foreground reappearance is counted separately');
    const secondPairing=await responseJson(`${base}/api/pairings`,{method:'POST',headers:{Cookie:cookie,'Content-Type':'application/json'},body:'{}'});assert.equal(secondPairing.response.status,201);
    const secondConnection=await responseJson(`${base}/api/agent/connect`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({code:secondPairing.body.code,name:'ARGUS-SMOKE-SECOND-PC'})});assert.equal(secondConnection.response.status,200);
    const secondHeartbeat=(apps,foregroundUsage=[],batchId=crypto.randomUUID())=>responseJson(`${base}/api/agent/heartbeat`,{method:'POST',headers:{Authorization:`Bearer ${secondConnection.body.token}`,'Content-Type':'application/json'},body:JSON.stringify({name:'ARGUS-SMOKE-SECOND-PC',metrics:{cpu:3,ram:7,disk:11},apps,foregroundTelemetryAvailable:true,foregroundApp:'isolated-report-app',foregroundBatchId:batchId,foregroundUsage})});
    const otherApp=[{name:'isolated-report-app',processName:'isolated-report-app',cpu:1,memory:8}];
    assert.equal((await secondHeartbeat(otherApp,[{processName:'isolated-report-app',date:reportDate,durationMilliseconds:0,occurrences:1}])).response.status,200);await delay(1200);assert.equal((await secondHeartbeat(otherApp,[{processName:'isolated-report-app',date:reportDate,durationMilliseconds:1200,occurrences:0}])).response.status,200);
    const machineDetail = await responseJson(`${base}/api/machines/${connected.body.machineId}?days=7`,{headers:{Cookie:cookie}}); assert.equal(machineDetail.response.status,200); assert.equal(machineDetail.body.machine.name,'ARGUS-SMOKE-PC');
    assert.equal(machineDetail.body.applicationReport.days,7);assert.ok(machineDetail.body.applicationReport.totalMilliseconds>=1234);assert.ok(machineDetail.body.applicationReport.daily.some(day=>day.durationMilliseconds>0));assert.equal(machineDetail.body.applicationReport.measurementSupported,true);
    assert.equal(machineDetail.body.applicationReport.applications.find(app=>app.processName==='argus-smoke-app').durationMilliseconds,1234);assert.ok(!machineDetail.body.applicationReport.applications.some(app=>app.processName==='isolated-report-app'),'computer report excludes applications from other computers');
    const todayReport=await responseJson(`${base}/api/machines/${connected.body.machineId}?days=1`,{headers:{Cookie:cookie}});assert.equal(todayReport.body.applicationReport.days,1);
    const monthReport=await responseJson(`${base}/api/machines/${connected.body.machineId}?days=30`,{headers:{Cookie:cookie}});assert.equal(monthReport.body.applicationReport.days,30);
    const secondDetail=await responseJson(`${base}/api/machines/${secondConnection.body.machineId}?days=7`,{headers:{Cookie:cookie}});assert.ok(secondDetail.body.applicationReport.applications.some(app=>app.processName==='isolated-report-app'));assert.ok(!secondDetail.body.applicationReport.applications.some(app=>app.processName==='argus-smoke-app'),'second computer report contains only its own application history');
    const watcherUnavailable=await responseJson(`${base}/api/agent/heartbeat`,{method:'POST',headers:{Authorization:`Bearer ${secondConnection.body.token}`,'Content-Type':'application/json'},body:JSON.stringify({name:'ARGUS-SMOKE-SECOND-PC',metrics:{cpu:1,ram:1,disk:1},apps:otherApp,foregroundTelemetryAvailable:false,foregroundApp:null})});assert.equal(watcherUnavailable.response.status,200);
    const historicalMeasurement=await responseJson(`${base}/api/machines/${secondConnection.body.machineId}?days=7`,{headers:{Cookie:cookie}});assert.equal(historicalMeasurement.body.applicationReport.measurementSupported,false);assert.equal(historicalMeasurement.body.applicationReport.hasMeasuredData,true);assert.ok(historicalMeasurement.body.applicationReport.totalMilliseconds>=1200,'previously measured data remains available without substituting process estimates');
    assert.equal((await responseJson(`${base}/api/machines/not-owned`,{headers:{Cookie:cookie}})).response.status,404,'unknown machine details are not exposed');
    const alertHeartbeat = await responseJson(`${base}/api/agent/heartbeat`,{method:'POST',headers:{Authorization:`Bearer ${connected.body.token}`,'Content-Type':'application/json'},body:JSON.stringify({metrics:{cpu:90,ram:20,disk:10},apps:[]})}); assert.equal(alertHeartbeat.response.status,200);
    let alertDashboard = (await responseJson(`${base}/api/dashboard`,{headers:{Cookie:cookie}})).body; const cpuAlert=alertDashboard.alerts.find(a=>a.kind==='cpu'); assert.ok(cpuAlert,'high CPU creates a CPU alert');
    const acknowledged = await responseJson(`${base}/api/alerts/${cpuAlert.id}/ack`,{method:'POST',headers:{Cookie:cookie,'Content-Type':'application/json'},body:'{}'}); assert.equal(acknowledged.response.status,200);
    alertDashboard = (await responseJson(`${base}/api/dashboard`,{headers:{Cookie:cookie}})).body; assert.ok(!alertDashboard.alerts.some(a=>a.kind==='cpu'),'acknowledged CPU alerts leave the active summary');
    assert.equal((await responseJson(`${base}/api/reports?days=999`,{headers:{Cookie:cookie}})).body.days,30,'reports cap the period to 30 days');
    assert.equal((await responseJson(`${base}/api/reports?days=0`,{headers:{Cookie:cookie}})).body.days,7,'invalid report periods use the default');
    agent=launchAgent(agentDir);
    await waitFor(async()=>{const preflight=await fetch(`http://127.0.0.1:${config.bridgePort}/navigation`,{method:'OPTIONS',headers:{Origin:'chrome-extension://abcdefghijklmnopabcdefghijklmnop','Access-Control-Request-Method':'POST','Access-Control-Request-Headers':'content-type,x-argus-bridge-key'}});return preflight.status===204;},'ponte local do agente voltar a escutar');
    const origin='chrome-extension://abcdefghijklmnopabcdefghijklmnop';
    const preflight=await fetch(`http://127.0.0.1:${config.bridgePort}/navigation`,{method:'OPTIONS',headers:{Origin:origin,'Access-Control-Request-Method':'POST','Access-Control-Request-Headers':'content-type,x-argus-bridge-key'}});
    assert.equal(preflight.status,204,'extension bridge preflight');
    assert.equal((await fetch(`http://127.0.0.1:${config.bridgePort}/navigation`,{method:'POST',headers:{Origin:'https://example.test','Content-Type':'application/json','X-Argus-Bridge-Key':config.bridgeKey},body:'{}'})).status,403,'browser bridge rejects non-extension origins');
    assert.equal((await fetch(`http://127.0.0.1:${config.bridgePort}/navigation`,{method:'POST',headers:{Origin:origin,'Content-Type':'application/json','X-Argus-Bridge-Key':'wrong'},body:'{}'})).status,401,'browser bridge rejects an invalid key');
    const invalidNavigation = await waitFor(async()=>{const response=await fetch(`http://127.0.0.1:${config.bridgePort}/navigation`,{method:'POST',headers:{Origin:origin,'Content-Type':'application/json','X-Argus-Bridge-Key':config.bridgeKey},body:JSON.stringify({domain:'not a domain',durationSeconds:27})});return response.status===400?response:null;},'agente aplicar consentimento antes de validar domínio');
    assert.equal(invalidNavigation.status,400,'browser bridge validates submitted domains');
    const submitNavigation=()=>fetch(`http://127.0.0.1:${config.bridgePort}/navigation`,{method:'POST',headers:{Origin:origin,'Content-Type':'application/json','X-Argus-Bridge-Key':config.bridgeKey},body:JSON.stringify({domain:'github.com',durationSeconds:27})});
    const authorizedNavigation = await waitFor(async()=>{const response=await submitNavigation();return response.status===202?response:null;},'agente receber a autorização de coleta web');
    assert.equal(authorizedNavigation.status,202,'authorized extension can submit domain-only activity');
    const withWeb = await waitFor(async()=>{const {body}=await responseJson(`${base}/api/dashboard`,{headers:{Cookie:cookie}});return body.webActivity?.some(w=>w.domain==='github.com')?body:null;},'navegação ser persistida pelo backend');
    assert.equal(withWeb.webActivity.find(w=>w.domain==='github.com').durationSeconds,27);
    const report=await responseJson(`${base}/api/reports?days=7`,{headers:{Cookie:cookie}});assert.equal(report.response.status,200);assert.equal(report.body.webActivity[0].domain,'github.com','reports include web history');
    const revoked=await responseJson(`${base}/api/privacy/web-consent`,{method:'POST',headers:{Cookie:cookie,'Content-Type':'application/json'},body:JSON.stringify({enabled:false})});assert.equal(revoked.response.status,200);assert.equal(revoked.body.webConsent,false);
    const afterRevoke=await responseJson(`${base}/api/dashboard`,{headers:{Cookie:cookie}});assert.equal(afterRevoke.body.webActivity.length,0,'revoking consent deletes collected web rows');
    await waitFor(async()=>{await submitNavigation();const {body}=await responseJson(`${base}/api/dashboard`,{headers:{Cookie:cookie}});return body.machines[0].webActivity.includes('desativada');},'agente aplicar revogação');
    assert.equal((await submitNavigation()).status,403,'agent bridge blocks navigation after revocation');
    await stopAgent(agent); agent=null;
    const offline=await waitFor(async()=>{const {body}=await responseJson(`${base}/api/dashboard`,{headers:{Cookie:cookie}});return body.machines.find(m=>m.id===connected.body.machineId)?.status==='offline'?body:null;},'offline ser refletido',8000);assert.ok(offline.summary.offline>=1);
    agent=launchAgent(agentDir);
    const recovered=await waitFor(async()=>{const {body}=await responseJson(`${base}/api/dashboard`,{headers:{Cookie:cookie}});return body.machines[0]?.status==='online'?body:null;},'agente reconectar',12000);assert.equal(recovered.summary.online,1);
    const exported=await responseJson(`${base}/api/privacy/export`,{headers:{Cookie:cookie}});assert.equal(exported.response.status,200);assert.ok(!JSON.stringify(exported.body).includes(connected.body.token),'export never exposes device token');
    const deleted=await responseJson(`${base}/api/privacy/delete-account`,{method:'POST',headers:{Cookie:cookie,'Content-Type':'application/json'},body:'{}'});assert.equal(deleted.response.status,200);
    const unauthorized=await responseJson(`${base}/api/dashboard`,{headers:{Cookie:cookie}});assert.equal(unauthorized.response.status,401,'account deletion revokes its session');
    console.log('PASS: auth/terms, installer and Windows foreground watcher, pairing, metrics/processes, measured foreground app durations, isolated machine reports, reports/alerts, extension bridge/consent, privacy deletion, offline and recovery.');
    process.exitCode=0;
  } catch (error) { console.error('FAIL:',error); process.exitCode=1; }
  finally { await stopAgent(agent); await stopSetup(setup); if(agentDir)await removeSmokeDirectory(agentDir); }
  process.exit(process.exitCode||0);
})();
