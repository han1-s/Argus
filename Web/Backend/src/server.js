const path = require('node:path');
const express = require('express');
const pool = require('./config/database');
const initializeAdmin = require('./config/initializeAdmin');
const authRoutes = require('./routes/authRoutes');
const argusDataRoutes = require('./routes/argusDataRoutes');

const app = express();
const PORT = Number(process.env.WEB_API_PORT || 3001);
const TERMS_VERSION = process.env.ARGUS_TERMS_VERSION || '2026-09-v1';

function normalizeServerUrl(value) {
  try {
    const url = new URL(value);
    const port = Number(url.port || (url.protocol === 'https:' ? 443 : 80));
    const isValid = ['http:', 'https:'].includes(url.protocol)
      && Boolean(url.hostname)
      && !url.username && !url.password
      && url.pathname === '/' && !url.search && !url.hash
      && port >= 1 && port <= 65535;
    return isValid ? url.origin : null;
  } catch {
    return null;
  }
}

app.use(express.json({ limit: '256kb' }));
app.use('/api/auth', authRoutes);
app.use('/api', argusDataRoutes);
app.get('/api/legal/terms', (req, res) => res.json({ version: TERMS_VERSION, url: '/terms.html' }));
app.get('/api/health', async (req, res, next) => {
  try {
    const [result] = await pool.query('SELECT 1 AS connected');
    res.json({ ok: true, database: Boolean(result[0]?.connected) });
  } catch (error) { next(error); }
});
app.get('/downloads/ARGUS.cmd', (req, res) => {
  const serverUrl = normalizeServerUrl(String(req.query.server || '').trim());
  if (!serverUrl) {
    return res.status(400).send('Informe o endereco HTTP/HTTPS da Platform.');
  }
  const content = `@echo off\r\nsetlocal\r\ncd /d "%~dp0"\r\nset "ARGUS_SERVER_URL=${serverUrl}"\r\nset "ARGUS_AGENT_ONLY=1"\r\nset "ARGUS_INSTALL_ONLY=1"\r\nset "ARGUS_HELPER_PATH=%~dp0argus-control.ps1"\r\nif not exist "%ARGUS_HELPER_PATH%" (\r\n  echo Baixando componentes de suporte do ARGUS...\r\n  powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "Invoke-WebRequest -Uri ($env:ARGUS_SERVER_URL + '/downloads/argus-control.ps1') -OutFile $env:ARGUS_HELPER_PATH"\r\n  if errorlevel 1 (echo Nao foi possivel baixar o suporte. Confira a rede e tente novamente.& pause & exit /b 1)\r\n)\r\npowershell.exe -NoProfile -ExecutionPolicy Bypass -File "%ARGUS_HELPER_PATH%"\r\n`;
  res.setHeader('Content-Type', 'application/octet-stream');
  res.setHeader('Content-Disposition', 'attachment; filename="ARGUS.cmd"');
  res.send(content);
});
app.get('/terms.html', (req, res) => res.sendFile(path.resolve(__dirname, '../../../Platform/frontend/terms.html')));
app.get('/', (req, res) => res.json({ message: 'API Web do ARGUS funcionando.' }));
app.use((error, req, res, next) => {
  console.error(error);
  if (!res.headersSent) res.status(500).json({ error: 'Erro interno do backend Web do ARGUS.' });
});

let server;
initializeAdmin().then(() => {
  server = app.listen(PORT, '127.0.0.1', () => {
    console.log(`ARGUS Web API conectada ao banco compartilhado em http://127.0.0.1:${PORT}`);
  });
}).catch(async error => {
  console.error('Não foi possível inicializar a API Web e a conta admin compartilhada:', error.message);
  await pool.end();
  process.exitCode = 1;
});

async function shutdown() {
  if (!server) {
    await pool.end();
    process.exit(0);
  }
  server.close(async () => {
    await pool.end();
    process.exit(0);
  });
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
