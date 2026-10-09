const path = require('node:path');
const express = require('express');
const pool = require('./config/database');
const initializeAdmin = require('./config/initializeAdmin');
const authRoutes = require('./routes/authRoutes');
const argusDataRoutes = require('./routes/argusDataRoutes');

const app = express();
const PORT = Number(process.env.WEB_API_PORT || 3001);
const TERMS_VERSION = process.env.ARGUS_TERMS_VERSION || '2026-09-v1';

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
app.get('/downloads/ARGUS.cmd', async (req, res, next) => {
  const serverUrl = String(req.query.server || '').trim();
  if (!/^https?:\/\/(?:[a-zA-Z0-9.-]+|\[[a-fA-F0-9:]+\])(?::[0-9]{1,5})?$/.test(serverUrl)) {
    return res.status(400).send('Informe o endereco HTTP/HTTPS da Platform.');
  }
  try {
    const platformApi = new URL(process.env.PLATFORM_API_TARGET || 'http://127.0.0.1:3000');
    const installerUrl = new URL('/downloads/ARGUS.cmd', platformApi);
    installerUrl.searchParams.set('server', serverUrl);
    const response = await fetch(installerUrl, { signal: AbortSignal.timeout(10000) });
    if (!response.ok) return res.status(response.status).send(await response.text());
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', 'attachment; filename="ARGUS.cmd"');
    res.send(Buffer.from(await response.arrayBuffer()));
  } catch (error) {
    next(error);
  }
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