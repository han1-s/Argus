const crypto = require('node:crypto');
const pool = require('../config/database');

function cookieToken(req) {
  const match = (req.headers.cookie || '').match(/(?:^|;\s*)argus_session=([^;]+)/);
  if (!match) return null;
  try {
    return decodeURIComponent(match[1]);
  } catch {
    return null;
  }
}

async function autenticar(req, res, next) {
  try {
    const token = cookieToken(req);
    if (!token) return res.status(401).json({ error: 'Sessão não informada.' });

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const [rows] = await pool.execute(
      `SELECT u.id, u.name, u.email, u.web_consent, u.terms_version
       FROM sessions s JOIN users u ON u.id = s.user_id
       WHERE s.token_hash = ? AND s.expires_at > UTC_TIMESTAMP(3)
       LIMIT 1`,
      [tokenHash],
    );
    if (!rows.length) return res.status(401).json({ error: 'Sessão expirada. Entre novamente.' });

    const user = rows[0];
    req.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      webConsent: Boolean(user.web_consent),
      termsVersion: user.terms_version,
    };
    req.usuario = { id: user.id, nome: user.name, email: user.email };
    next();
  } catch (error) {
    next(error);
  }
}

module.exports = autenticar;