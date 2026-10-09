const crypto = require('crypto');
const fs = require('fs');
const http = require('http');
const path = require('path');

const port = Number(process.env.ARGUS_SETUP_PORT) || 43173;
const configPath = path.join(__dirname, 'config.json');
const html = `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Configurar ARGUS</title>
<style>
:root{font-family:Segoe UI,Arial,sans-serif;color:#17212b;background:#f1f4f6}*{box-sizing:border-box}body{margin:0;min-height:100vh;display:grid;place-items:center;padding:24px}.setup{width:min(100%,520px);background:#fff;border:1px solid #d8e0e5;border-radius:8px;padding:30px;box-shadow:0 14px 40px #12202b12}.brand{font-size:13px;font-weight:700;letter-spacing:.12em;color:#087e78}.eyebrow{font-size:11px;font-weight:700;color:#64737e;margin-top:26px}h1{font-size:26px;margin:7px 0}p{font-size:14px;line-height:1.55;color:#586772;margin:0 0 20px}.field{display:grid;gap:6px;margin:14px 0;font-size:13px;font-weight:600}.field input{height:42px;border:1px solid #cbd5dc;border-radius:5px;padding:0 11px;font:inherit;font-weight:400}.field input:focus{outline:2px solid #16a39a;outline-offset:1px}.terms{display:flex;align-items:flex-start;gap:9px;margin:17px 0;font-size:12px;line-height:1.5;color:#586772}.terms input{margin-top:2px}.terms a{color:#087e78}.submit{width:100%;height:44px;border:0;border-radius:5px;background:#087e78;color:white;font-size:14px;font-weight:700;cursor:pointer}.submit:disabled{opacity:.55;cursor:wait}.status{margin-top:15px;font-size:13px;line-height:1.5;color:#31404a}.status.error{color:#b42318}.status.success{color:#087e78}.foot{border-top:1px solid #e5eaed;margin-top:22px;padding-top:14px;font-size:11px;color:#6b7881}
#cancelSetup{width:100%;height:38px;margin-top:8px;border:1px solid #cbd5dc;border-radius:5px;background:white;color:#586772;font-size:13px;cursor:pointer}
</style>
</head>
<body><main class="setup"><div class="brand">ARGUS · CONFIGURAÇÃO LOCAL</div><div class="eyebrow">VINCULAR COMPUTADOR</div><h1>Configurar este computador</h1><p>Informe o endereço do servidor, o nome deste computador e o código de conexão gerado no painel ARGUS.</p>
<form id="setupForm">
<label class="field">Endereço LAN do servidor ARGUS<input name="serverUrl" type="url" placeholder="http://192.168.1.10:3000" required autocomplete="url"></label>
<label class="field">Nome deste computador<input name="deviceName" maxlength="80" required autocomplete="off"></label>
<label class="field">Código de conexão<input name="pairingCode" type="text" placeholder="ARG-XXXX-XXXX" required autocomplete="off" minlength="13" maxlength="13" pattern="ARG-[A-Fa-f0-9]{4}-[A-Fa-f0-9]{4}"></label>
<label class="terms"><input name="termsAccepted" type="checkbox" required><span>Li e aceito os termos atuais do ARGUS para conectar este computador. <a id="termsLink" target="_blank" rel="noopener" hidden>Consultar termos</a></span></label>
<button class="submit" type="submit">Conectar computador</button>
<button id="cancelSetup" type="button">Cancelar instalação</button>
</form><div id="status" class="status" role="status" aria-live="polite"></div><div class="foot">O código é de uso único e expira em 15 minutos. Gere um novo no painel se necessário.</div></main>
<script>
const form=document.querySelector('#setupForm');const statusNode=document.querySelector('#status');const button=form.querySelector('.submit');const termsLink=document.querySelector('#termsLink');const updateTermsLink=()=>{try{termsLink.href=new URL('/terms.html',form.elements.serverUrl.value).href;termsLink.hidden=false}catch{termsLink.removeAttribute('href');termsLink.hidden=true}};
form.elements.deviceName.value=(()=>{const name=location.hostname;return name==='127.0.0.1'||name==='localhost'?'${process.env.COMPUTERNAME || 'Meu computador'}':name})();
form.elements.serverUrl.addEventListener('input',updateTermsLink);updateTermsLink();
document.querySelector('#cancelSetup').onclick=async()=>{await fetch('/api/cancel',{method:'POST'});form.hidden=true;statusNode.className='status';statusNode.textContent='Instalação cancelada. Nenhuma conexão foi criada.'};
form.onsubmit=async event=>{event.preventDefault();statusNode.className='status';statusNode.textContent='Conectando computador…';button.disabled=true;const values=Object.fromEntries(new FormData(form));values.pairingCode=values.pairingCode.trim().toUpperCase();values.termsAccepted=form.elements.termsAccepted.checked;try{const response=await fetch('/api/setup',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(values)});const result=await response.json();if(!response.ok)throw new Error(result.error||'Não foi possível configurar o computador.');form.hidden=true;statusNode.className='status success';statusNode.innerHTML='Computador conectado como <b></b>. O assistente pode ser fechado.';statusNode.querySelector('b').textContent=result.deviceName;}catch(error){statusNode.className='status error';statusNode.textContent=error.message;button.disabled=false;}};
</script></body></html>`;

function sendJson(res, statusCode, body) {
  res.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(body));
}
function readJson(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', chunk => {
      raw += chunk;
      if (raw.length > 16384) { reject(new Error('A solicitação excedeu o tamanho permitido.')); req.destroy(); }
    });
    req.on('end', () => {
      try { resolve(JSON.parse(raw || '{}')); }
      catch { reject(new Error('Os dados enviados não são JSON válido.')); }
    });
    req.on('error', reject);
  });
}
async function apiRequest(baseUrl, route, body, cookie) {
  const response = await fetch(`${baseUrl}${route}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(cookie ? { Cookie: cookie } : {}) },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(10000)
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(result.error || `Servidor ARGUS respondeu HTTP ${response.status}.`);
    error.statusCode = response.status;
    throw error;
  }
  return { result, response };
}
function normalizeServerUrl(value) {
  let target;
  try { target = new URL(String(value || '').trim()); }
  catch { throw new Error('Informe o endereço LAN completo do servidor, por exemplo http://192.168.1.10:3000.'); }
  if (!['http:', 'https:'].includes(target.protocol) || target.username || target.password || target.search || target.hash || target.pathname !== '/') {
    throw new Error('Use somente o endereço base do servidor, começando com http:// ou https://.');
  }
  return target.origin;
}

const server = http.createServer(async (req, res) => {
  const host = String(req.headers.host || '').toLowerCase();
  if (![`127.0.0.1:${port}`, `localhost:${port}`, `[::1]:${port}`].includes(host)) return sendJson(res, 403, { error: 'O assistente aceita somente conexões locais.' });
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Content-Security-Policy', "default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline'; connect-src 'self'; form-action 'self'; base-uri 'none'");
  if (req.method === 'GET' && req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
    return res.end(html);
  }
  if (req.method === 'POST' && req.url === '/api/cancel') {
    sendJson(res, 200, { ok: true, canceled: true });
    setTimeout(() => { server.close(); server.closeAllConnections?.(); }, 300);
    return;
  }
  if (req.method !== 'POST' || req.url !== '/api/setup') return sendJson(res, 404, { error: 'Página não encontrada.' });
  try {
    const input = await readJson(req);
    const serverUrl = normalizeServerUrl(input.serverUrl);
    const deviceName = String(input.deviceName || '').trim();
    const pairingCode = String(input.pairingCode || '').trim().toUpperCase();
    if (deviceName.length < 2 || deviceName.length > 80) return sendJson(res, 400, { error: 'O nome do computador deve ter de 2 a 80 caracteres.' });
    if (!/^ARG-[A-F0-9]{4}-[A-F0-9]{4}$/.test(pairingCode)) return sendJson(res, 400, { error: 'Informe um código de conexão válido, gerado no painel ARGUS.' });
    if (input.termsAccepted !== true) return sendJson(res, 400, { error: 'Aceite os termos atuais para continuar.' });

    const { result: connection } = await apiRequest(serverUrl, '/api/agent/connect', { code: pairingCode, name: deviceName });
    const config = {
      serverUrl,
      deviceName,
      deviceToken: connection.token,
      bridgeKey: crypto.randomBytes(32).toString('hex'),
      heartbeatSeconds: 5,
      bridgePort: Number(process.env.ARGUS_AGENT_BRIDGE_PORT) || 43172
    };
    const temporaryPath = `${configPath}.tmp`;
    fs.writeFileSync(temporaryPath, JSON.stringify(config, null, 2), { mode: 0o600 });
    fs.renameSync(temporaryPath, configPath);
    fs.writeFileSync(path.join(__dirname, 'setup-complete'), new Date().toISOString());
    sendJson(res, 200, { ok: true, deviceName });
    setTimeout(() => { server.close(); server.closeAllConnections?.(); }, 300);
  } catch (error) {
    sendJson(res, error.name === 'TimeoutError' ? 504 : error.statusCode || 400, { error: error.name === 'TimeoutError' ? 'O servidor não respondeu a tempo. Confira o IP LAN e tente novamente.' : error.message });
  }
});
server.on('error', error => { console.error(`Assistente ARGUS: ${error.message}`); process.exitCode = 1; });
server.listen(port, '127.0.0.1', () => console.log(`Assistente ARGUS aberto em http://127.0.0.1:${port}`));
