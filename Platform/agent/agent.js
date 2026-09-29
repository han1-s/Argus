const os = require('os');
const fs = require('fs');
const path = require('path');
const { execFile } = require('child_process');
const http = require('http');
const configPath = path.join(__dirname, 'config.json');
if (!fs.existsSync(configPath)) {
  console.error('Crie agent/config.json a partir de config.example.json e informe o IP e o código do dashboard.'); process.exit(1);
}
// Windows PowerShell 5 and older Notepad versions may prepend a UTF-8 BOM.
const config = JSON.parse(fs.readFileSync(configPath, 'utf8').replace(/^\uFEFF/, ''));
const serverUrl = String(config.serverUrl || '').replace(/\/$/, '');
if (!/^https?:\/\//.test(serverUrl)) { console.error('serverUrl deve começar com http:// ou https://'); process.exit(1); }
const interval = Math.max(5, Number(config.heartbeatSeconds) || 10) * 1000;
let token = config.deviceToken || '';
let bridgeKey = config.bridgeKey || require('crypto').randomBytes(32).toString('hex');
let webEnabled = false;
const navigationQueue = [];
let previousCpu = cpuSnapshot();
const windowsProcessTimes = new Map();
let windowsProcessSampleAt = Date.now();
let busy = false;

function cpuSnapshot() {
  const cpus = os.cpus();
  let idle = 0, total = 0;
  for (const cpu of cpus) { for (const value of Object.values(cpu.times)) total += value; idle += cpu.times.idle; }
  return { idle, total };
}
function cpuUsage() {
  const now = cpuSnapshot();
  const total = now.total - previousCpu.total, idle = now.idle - previousCpu.idle;
  previousCpu = now;
  return total > 0 ? Math.round((1 - idle / total) * 100) : 0;
}
function activeProcesses() {
  return new Promise(resolve => {
    const win = process.platform === 'win32';
    const command = win ? 'powershell.exe' : 'ps';
    const args = win ? ['-NoProfile', '-Command', 'Get-Process | Sort-Object CPU -Descending | Select-Object -First 18 Id,ProcessName,CPU,WorkingSet64 | ConvertTo-Json -Compress'] : ['-eo', 'comm,pcpu,rss', '--sort=-pcpu'];
    execFile(command, args, { timeout: 5000, windowsHide: true, maxBuffer: 1024 * 1024 }, (err, stdout) => {
      if (err) return resolve([]);
      try {
        let rows;
        if (win) { const parsed = JSON.parse(stdout || '[]'); rows = Array.isArray(parsed) ? parsed : [parsed]; }
        else rows = stdout.trim().split('\n').slice(1).map(line => { const m = line.trim().match(/^(.*?)\s+(\d+(?:\.\d+)?)\s+(\d+)$/); return m && { ProcessName: m[1], CPU: Number(m[2]), WorkingSet64: Number(m[3]) * 1024 }; }).filter(Boolean);
        const sampledAt = Date.now(), elapsedSeconds = Math.max(0.001, (sampledAt - windowsProcessSampleAt) / 1000), logicalCpus = Math.max(1, os.cpus().length);
        const result = rows.slice(0, 12).map(p => {
          const name = String(p.ProcessName || p.comm || 'process').replace(/\.exe$/i, '');
          let cpu;
          if (win) {
            const pid = Number(p.Id); const totalCpuSeconds = Number(p.CPU) || 0; const previous = windowsProcessTimes.get(pid);
            cpu = previous && elapsedSeconds > 0 ? Math.max(0, Math.min(100, (totalCpuSeconds - previous) / elapsedSeconds / logicalCpus * 100)) : null;
            if (Number.isFinite(pid)) windowsProcessTimes.set(pid, totalCpuSeconds);
          } else cpu = Number(p.pcpu) || 0;
          return { name, processName: name, cpu, memory: Math.round(Number(p.WorkingSet64 || p.rss || 0) / 1048576) };
        });
        if (win) { const livePids = new Set(rows.slice(0, 18).map(p => Number(p.Id))); for (const pid of windowsProcessTimes.keys()) if (!livePids.has(pid)) windowsProcessTimes.delete(pid); windowsProcessSampleAt = sampledAt; }
        resolve(result);
      } catch { resolve([]); }
    });
  });
}
function diskUsage() {
  return new Promise(resolve => {
    const win = process.platform === 'win32';
    execFile(win ? 'powershell.exe' : 'df', win ? ['-NoProfile', '-Command', '(Get-CimInstance Win32_LogicalDisk -Filter "DriveType=3" | Measure-Object Size -Sum).Sum; (Get-CimInstance Win32_LogicalDisk -Filter "DriveType=3" | Measure-Object FreeSpace -Sum).Sum'] : ['-Pk', '/'], { timeout: 5000, windowsHide: true }, (err, stdout) => {
      if (err) return resolve(0);
      if (win) { const n = stdout.trim().split(/\s+/).map(Number); return resolve(n[0] ? Math.round((1 - n[1] / n[0]) * 100) : 0); }
      const cols = stdout.trim().split(/\s+/); resolve(Number(cols[4]?.replace('%', '')) || 0);
    });
  });
}
function startBrowserBridge() {
  const bridge = http.createServer((req, res) => {
    const origin = req.headers.origin || '';
    if (!origin.startsWith('chrome-extension://') && !origin.startsWith('moz-extension://')) { res.writeHead(403); return res.end(); }
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Argus-Bridge-Key');
    res.setHeader('Access-Control-Allow-Private-Network', 'true');
    if (req.method === 'OPTIONS') { res.writeHead(204); return res.end(); }
    if (req.method !== 'POST' || req.url !== '/navigation') { res.writeHead(404); return res.end(); }
    const supplied = Buffer.from(String(req.headers['x-argus-bridge-key'] || ''));
    const expected = Buffer.from(bridgeKey);
    if (supplied.length !== expected.length || !require('crypto').timingSafeEqual(supplied, expected)) { res.writeHead(401); return res.end(); }
    if (!webEnabled) { res.writeHead(403); res.end(JSON.stringify({ error: 'Web collection consent is off' })); return; }
    let raw = '';
    req.on('data', chunk => { raw += chunk; if (raw.length > 4096) req.destroy(); });
    req.on('end', () => {
      try {
        const item = JSON.parse(raw);
        const domain = String(item.domain || '').toLowerCase().replace(/\.$/, '');
        const durationSeconds = Math.floor(Number(item.durationSeconds));
        if (!/^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/.test(domain) || durationSeconds < 1 || durationSeconds > 60) { res.writeHead(400); return res.end(); }
        navigationQueue.push({ domain, durationSeconds });
        if (navigationQueue.length > 200) navigationQueue.shift();
        res.writeHead(202, { 'Content-Type': 'application/json' }); res.end('{"ok":true}');
      } catch { res.writeHead(400); res.end(); }
    });
  });
  bridge.on('error', error => console.error(`Ponte local do navegador: ${error.message}`));
  bridge.listen(Number(config.bridgePort) || 43172, '127.0.0.1');
}
async function request(route, data, bearer) {
  const response = await fetch(serverUrl + route, { method: 'POST', headers: { 'Content-Type': 'application/json', ...(bearer ? { Authorization: `Bearer ${bearer}` } : {}) }, body: JSON.stringify(data), signal: AbortSignal.timeout(10000) });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.error || `HTTP ${response.status}`);
  return result;
}
async function enroll() {
  const result = await request('/api/agent/connect', { code: config.connectionCode, name: os.hostname() });
  token = result.token; config.deviceToken = token; delete config.connectionCode;
  config.bridgeKey = bridgeKey; config.bridgePort = Number(config.bridgePort) || 43172;
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  console.log(`Conectado como ${os.hostname()}. Heartbeat a cada ${interval / 1000}s.`);
}
async function heartbeat() {
  if (busy) return; busy = true;
  try {
    const total = os.totalmem(), free = os.freemem();
    const apps = await activeProcesses();
    const result = await request('/api/agent/heartbeat', { name: os.hostname(), userName: os.userInfo().username, os: `${os.type()} ${os.release()}`, arch: os.arch(), uptime: os.uptime(), metrics: { cpu: cpuUsage(), ram: Math.round((1 - free / total) * 100), disk: await diskUsage(), memoryUsed: total - free, memoryTotal: total }, apps, navigation: webEnabled ? navigationQueue.slice(0, 40) : [] }, token);
    webEnabled = result.webCollection === true;
    if (webEnabled) navigationQueue.splice(0, Math.min(40, navigationQueue.length));
  } catch (error) { console.error(`Falha ao enviar heartbeat: ${error.message}`); }
  finally { busy = false; }
}
async function start() {
  if (!token) await enroll();
  if (!config.bridgeKey) { config.bridgeKey = bridgeKey; config.bridgePort = Number(config.bridgePort) || 43172; fs.writeFileSync(configPath, JSON.stringify(config, null, 2)); }
  bridgeKey = config.bridgeKey; startBrowserBridge();
  console.log(`Ponte local da extensão: http://127.0.0.1:${Number(config.bridgePort) || 43172} — chave em config.json`);
  await heartbeat(); setInterval(heartbeat, interval);
}
start().catch(error => { console.error(`Não foi possível conectar: ${error.message}`); process.exitCode = 1; });
process.on('SIGINT', () => { console.log('\nAgente encerrado.'); process.exit(0); });
