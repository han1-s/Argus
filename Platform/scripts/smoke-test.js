// Full HTTP and agent smoke test. The MySQL adapter is replaced with an in-memory store,
// so this exercises the application flow without modifying a developer's real database.
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const net = require('node:net');
const { spawn } = require('node:child_process');
const Module = require('node:module');

const db = { users: [], machines: [], pairings: [], events: [], alerts: [], webActivity: [], termAcceptances: [], sessions: [] };
const store = {
  initialize: async () => db,
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
async function stopAgent(child) {
  if (!child || child.exitCode !== null) return;
  child.kill('SIGINT'); await Promise.race([new Promise(resolve => child.once('exit', resolve)), delay(3000)]);
  if (child.exitCode === null) child.kill('SIGKILL');
}

(async () => {
  let agent; let agentDir;
  try {
    process.env.PORT = String(await availablePort()); process.env.HOST = '127.0.0.1';
    process.env.OFFLINE_TIMEOUT_MS = '4000'; process.env.OFFLINE_CHECK_INTERVAL_MS = '250';
    const base = `http://127.0.0.1:${process.env.PORT}`;
    require(backendPath);
    await waitFor(async () => (await fetch(`${base}/api/legal/terms`)).ok, 'backend iniciar');
    const terms = await (await fetch(`${base}/terms.html`)).text(); assert.match(terms, /LGPD/);
    const email = `argus-smoke-${crypto.randomUUID()}@example.test`;
    const invalid = await responseJson(`${base}/api/auth/signup`, { method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:'Smoke Admin',email,password:'ValidPass123'}) });
    assert.equal(invalid.response.status, 400, 'signup must require an explicit terms acceptance');
    const signup = await responseJson(`${base}/api/auth/signup`, { method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:'Smoke Admin',email,password:'ValidPass123',termsAccepted:true,termsVersion:'2026-09-v1',webConsent:true}) });
    assert.equal(signup.response.status, 201); const cookie = signup.response.headers.get('set-cookie')?.split(';')[0]; assert.ok(cookie, 'login cookie returned');
    const rejectedLogin = await responseJson(`${base}/api/auth/login`, { method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email,password:'ValidPass123',termsVersion:'2026-09-v1',termsAccepted:false}) });
    assert.equal(rejectedLogin.response.status, 428, 'login must require explicit terms confirmation');
    const successfulLogin = await responseJson(`${base}/api/auth/login`, { method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email,password:'ValidPass123',termsVersion:'2026-09-v1',termsAccepted:true}) });
    assert.equal(successfulLogin.response.status,200,'accepted terms allow login');
    const pairing = await responseJson(`${base}/api/pairings`, { method:'POST',headers:{Cookie:cookie,'Content-Type':'application/json'},body:'{}' }); assert.equal(pairing.response.status,201);
    const setupCommandResponse = await fetch(`${base}/downloads/ARGUS.cmd?server=${encodeURIComponent(base)}&code=${encodeURIComponent(pairing.body.code)}`);
    assert.equal(setupCommandResponse.status,200,'pairing flow provides a downloadable ARGUS command');
    const setupCommand = await setupCommandResponse.text(); assert.match(setupCommand,/ARGUS_AGENT_ONLY=1/); assert.match(setupCommand,new RegExp(pairing.body.code)); assert.match(setupCommand,new RegExp(base.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')));
    const controlScript = await fetch(`${base}/downloads/argus-control.ps1`); assert.equal(controlScript.status,200); const controlText=await controlScript.text(); assert.match(controlText,/function Install-Agent/); assert.match(controlText,/SAIBA MAIS/); assert.match(controlText,/5\. Saiba mais/); assert.match(controlText,/7\. Saiba mais/);
    const config = { serverUrl:base, connectionCode:pairing.body.code, heartbeatSeconds:5, bridgePort:await availablePort() };
    const connected = await responseJson(`${base}/api/agent/connect`, { method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({code:config.connectionCode,name:'ARGUS-SMOKE-PC'}) });
    assert.equal(connected.response.status,200); config.deviceToken=connected.body.token; config.bridgeKey=crypto.randomBytes(32).toString('hex'); delete config.connectionCode;
    agentDir = fs.mkdtempSync(path.join(os.tmpdir(),'argus-agent-smoke-')); fs.copyFileSync(path.resolve(__dirname,'..','agent','agent.js'),path.join(agentDir,'agent.js')); fs.writeFileSync(path.join(agentDir,'config.json'),JSON.stringify(config));
    agent=launchAgent(agentDir);
    const live = await waitFor(async()=>{const {body}=await responseJson(`${base}/api/dashboard`,{headers:{Cookie:cookie}});return body.machines?.[0]?.status==='online'&&body.machines[0].metrics?.memoryTotal?body:null;},'agente enviar métricas reais');
    assert.ok(live.machines[0].metrics.cpu >= 0 && live.machines[0].metrics.cpu <= 100); assert.ok(live.machines[0].apps.length > 0,'agent reports local processes');
    await stopAgent(agent); agent=null;
    const appHeartbeat = apps => responseJson(`${base}/api/agent/heartbeat`, { method:'POST',headers:{Authorization:`Bearer ${connected.body.token}`,'Content-Type':'application/json'},body:JSON.stringify({name:'ARGUS-SMOKE-PC',userName:'smoke',os:'test',metrics:{cpu:5,ram:8,disk:10},apps}) });
    const smokeApp = [{name:'argus-smoke-app',processName:'argus-smoke-app',cpu:null,memory:12}];
    assert.equal((await appHeartbeat(smokeApp)).response.status,200);
    await delay(1200);
    assert.equal((await appHeartbeat(smokeApp)).response.status,200);
    let appDashboard = (await responseJson(`${base}/api/dashboard`,{headers:{Cookie:cookie}})).body;
    let appRecord = appDashboard.machines[0].apps.find(a=>a.processName==='argus-smoke-app');
    assert.equal(appRecord.name,'Argus Smoke App','process name is presented as a friendly application name');
    assert.equal(appRecord.occurrences,1,'consecutive samples count one observed application session');
    assert.ok(appRecord.durationSeconds>=1,'application duration is accumulated only across consecutive samples');
    assert.equal(appDashboard.applications.find(a=>a.processName==='argus-smoke-app').machineCount,1,'dashboard aggregates application use by machine');
    assert.equal((await appHeartbeat([])).response.status,200);
    appDashboard = (await responseJson(`${base}/api/dashboard`,{headers:{Cookie:cookie}})).body;
    assert.equal(appDashboard.machines[0].apps.find(a=>a.processName==='argus-smoke-app').status,'not_observed','missing process samples are not mislabeled as confirmed exits');
    assert.equal((await appHeartbeat(smokeApp)).response.status,200);
    appDashboard = (await responseJson(`${base}/api/dashboard`,{headers:{Cookie:cookie}})).body;
    assert.equal(appDashboard.machines[0].apps.find(a=>a.processName==='argus-smoke-app').occurrences,2,'a later reappearance is counted separately');
    agent=launchAgent(agentDir);
    await waitFor(async()=>{const preflight=await fetch(`http://127.0.0.1:${config.bridgePort}/navigation`,{method:'OPTIONS',headers:{Origin:'chrome-extension://abcdefghijklmnopabcdefghijklmnop','Access-Control-Request-Method':'POST','Access-Control-Request-Headers':'content-type,x-argus-bridge-key'}});return preflight.status===204;},'ponte local do agente voltar a escutar');
    const origin='chrome-extension://abcdefghijklmnopabcdefghijklmnop';
    const preflight=await fetch(`http://127.0.0.1:${config.bridgePort}/navigation`,{method:'OPTIONS',headers:{Origin:origin,'Access-Control-Request-Method':'POST','Access-Control-Request-Headers':'content-type,x-argus-bridge-key'}});
    assert.equal(preflight.status,204,'extension bridge preflight');
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
    const offline=await waitFor(async()=>{const {body}=await responseJson(`${base}/api/dashboard`,{headers:{Cookie:cookie}});return body.machines[0]?.status==='offline'?body:null;},'offline ser refletido',8000);assert.equal(offline.summary.offline,1);
    agent=launchAgent(agentDir);
    const recovered=await waitFor(async()=>{const {body}=await responseJson(`${base}/api/dashboard`,{headers:{Cookie:cookie}});return body.machines[0]?.status==='online'?body:null;},'agente reconectar',12000);assert.equal(recovered.summary.online,1);
    const exported=await responseJson(`${base}/api/privacy/export`,{headers:{Cookie:cookie}});assert.equal(exported.response.status,200);assert.ok(!JSON.stringify(exported.body).includes(connected.body.token),'export never exposes device token');
    const deleted=await responseJson(`${base}/api/privacy/delete-account`,{method:'POST',headers:{Cookie:cookie,'Content-Type':'application/json'},body:'{}'});assert.equal(deleted.response.status,200);
    const unauthorized=await responseJson(`${base}/api/dashboard`,{headers:{Cookie:cookie}});assert.equal(unauthorized.response.status,401,'account deletion revokes its session');
    console.log('PASS: terms/authentication, pair and installer downloads, live metrics/processes, application history/aggregation, extension consent, privacy deletion, offline and recovery.');
    process.exitCode=0;
  } catch (error) { console.error('FAIL:',error); process.exitCode=1; }
  finally { await stopAgent(agent); if(agentDir)fs.rmSync(agentDir,{recursive:true,force:true}); }
  process.exit(process.exitCode||0);
})();
