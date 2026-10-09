const crypto = require('node:crypto');
const pool = require('../config/database');

const TERMS_VERSION = process.env.ARGUS_TERMS_VERSION || '2026-09-v1';
const SESSION_MAX_AGE_SECONDS = 7 * 24 * 60 * 60;

function hashPassword(password, salt) {
  return crypto.scryptSync(password, salt, 64).toString('hex');
}

function setSessionCookie(req, res, token) {
  const secure = req.secure || req.headers['x-forwarded-proto'] === 'https' ? '; Secure' : '';
  res.setHeader('Set-Cookie', `argus_session=${encodeURIComponent(token)}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${SESSION_MAX_AGE_SECONDS}${secure}`);
}

function publicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    webConsent: Boolean(user.web_consent ?? user.webConsent),
    termsVersion: user.terms_version ?? user.termsVersion ?? null,
  };
}

async function createSession(connection, userId, res, req) {
  const token = crypto.randomBytes(32).toString('hex');
  const now = new Date();
  const expiresAt = new Date(now.getTime() + SESSION_MAX_AGE_SECONDS * 1000);
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  await connection.execute(
    'INSERT INTO sessions (token_hash, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)',
    [tokenHash, userId, now, expiresAt],
  );
  setSessionCookie(req, res, token);
}

async function cadastrar(req, res, next) {
  const name = String(req.body.name || req.body.nome || '').trim();
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || req.body.senha || '');
  const webConsent = req.body.webConsent === true;
  if (name.length < 2 || !/^\S+@\S+\.\S+$/.test(email) || password.length < 10) {
    return res.status(400).json({ error: 'Informe nome, e-mail válido e senha com pelo menos 10 caracteres.' });
  }
  if (req.body.termsAccepted !== true || req.body.termsVersion !== TERMS_VERSION) {
    return res.status(400).json({ error: 'Leia e aceite os termos atuais antes de criar a conta.' });
  }

  const connection = await pool.getConnection();
  try {
    const [existing] = await connection.execute('SELECT id FROM users WHERE email = ? LIMIT 1', [email]);
    if (existing.length) return res.status(409).json({ error: 'Este e-mail já possui uma conta.' });

    const id = crypto.randomUUID();
    const salt = crypto.randomBytes(16).toString('hex');
    const now = new Date();
    await connection.beginTransaction();
    await connection.execute(
      `INSERT INTO users (id, name, email, salt, password_hash, created_at, web_consent, terms_version, terms_accepted_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, name, email, salt, hashPassword(password, salt), now, webConsent, TERMS_VERSION, now],
    );
    await connection.execute(
      'INSERT INTO terms_acceptances (user_id, terms_version, accepted_at, web_consent) VALUES (?, ?, ?, ?)',
      [id, TERMS_VERSION, now, webConsent],
    );
    await createSession(connection, id, res, req);
    await connection.commit();
    res.status(201).json({ user: { id, name, email, webConsent, termsVersion: TERMS_VERSION } });
  } catch (error) {
    await connection.rollback().catch(() => {});
    if (error.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Este e-mail já possui uma conta.' });
    next(error);
  } finally {
    connection.release();
  }
}

async function login(req, res, next) {
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || req.body.senha || '');
  if (!email || !password) return res.status(400).json({ error: 'E-mail e senha são obrigatórios.' });

  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.execute('SELECT * FROM users WHERE email = ? LIMIT 1', [email]);
    const user = rows[0];
    const candidate = user && hashPassword(password, user.salt);
    if (!user || !crypto.timingSafeEqual(Buffer.from(candidate, 'hex'), Buffer.from(user.password_hash, 'hex'))) {
      return res.status(401).json({ error: 'E-mail ou senha incorretos.' });
    }
    if (req.body.termsAccepted !== true || req.body.termsVersion !== TERMS_VERSION) {
      return res.status(428).json({ error: 'Leia e aceite a versão atual dos termos para continuar.' });
    }

    const now = new Date();
    const webConsent = Object.hasOwn(req.body, 'webConsent') ? req.body.webConsent === true : Boolean(user.web_consent);
    await connection.beginTransaction();
    await connection.execute(
      'UPDATE users SET web_consent = ?, terms_version = ?, terms_accepted_at = ? WHERE id = ?',
      [webConsent, TERMS_VERSION, now, user.id],
    );
    await connection.execute(
      'INSERT INTO terms_acceptances (user_id, terms_version, accepted_at, web_consent) VALUES (?, ?, ?, ?)',
      [user.id, TERMS_VERSION, now, webConsent],
    );
    if (!webConsent) {
      await connection.execute('DELETE w FROM web_activity w JOIN machines m ON m.id = w.machine_id WHERE m.user_id = ?', [user.id]);
    }
    await createSession(connection, user.id, res, req);
    await connection.commit();
    res.json({ user: publicUser({ ...user, web_consent: webConsent, terms_version: TERMS_VERSION }) });
  } catch (error) {
    await connection.rollback().catch(() => {});
    next(error);
  } finally {
    connection.release();
  }
}

async function logout(req, res, next) {
  try {
    const token = (req.headers.cookie || '').match(/(?:^|;\s*)argus_session=([^;]+)/)?.[1];
    if (token) {
      const tokenHash = crypto.createHash('sha256').update(decodeURIComponent(token)).digest('hex');
      await pool.execute('DELETE FROM sessions WHERE token_hash = ?', [tokenHash]);
    }
    res.setHeader('Set-Cookie', 'argus_session=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0');
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
}

async function solicitarRecuperacao(req, res, next) {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(email)) return res.status(400).json({ error: 'Informe um e-mail válido.' });
    const [users] = await pool.execute('SELECT id FROM users WHERE email = ? LIMIT 1', [email]);
    if (!users.length) return res.json({ message: 'Se o e-mail estiver cadastrado, o ARGUS enviaria uma mensagem de recuperação.', simulated: true, simulatedEmail: null });

    const code = String(crypto.randomInt(0, 1000000)).padStart(6, '0');
    const codeHash = crypto.createHash('sha256').update(code).digest('hex');
    const requestedAt = new Date();
    const expiresAt = new Date(requestedAt.getTime() + 15 * 60 * 1000);
    await pool.execute('DELETE FROM password_reset_tokens WHERE user_id = ?', [users[0].id]);
    await pool.execute(
      'INSERT INTO password_reset_tokens (id,user_id,code_hash,requested_at,expires_at) VALUES (?,?,?,?,?)',
      [crypto.randomUUID(), users[0].id, codeHash, requestedAt, expiresAt],
    );
    res.json({ message: 'Simulação: mensagem de recuperação preparada para este endereço.', simulated: true, simulatedEmail: { to: email, subject: 'Recuperação de senha ARGUS', code, expiresInMinutes: 15 } });
  } catch (error) { next(error); }
}

async function redefinirSenha(req, res, next) {
  const email = String(req.body.email || '').trim().toLowerCase();
  const code = String(req.body.code || '').trim();
  const password = String(req.body.password || '');
  if (!/^\S+@\S+\.\S+$/.test(email) || !/^\d{6}$/.test(code) || password.length < 8) {
    return res.status(400).json({ error: 'Informe e-mail válido, código de 6 dígitos e senha com pelo menos 8 caracteres.' });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const codeHash = crypto.createHash('sha256').update(code).digest('hex');
    const [rows] = await connection.execute(
      `SELECT u.id FROM users u JOIN password_reset_tokens r ON r.user_id = u.id
       WHERE u.email = ? AND r.code_hash = ? AND r.expires_at > UTC_TIMESTAMP(3) LIMIT 1 FOR UPDATE`,
      [email, codeHash],
    );
    if (!rows.length) {
      await connection.rollback();
      return res.status(400).json({ error: 'Código inválido ou expirado. Solicite uma nova recuperação.' });
    }
    const userId = rows[0].id;
    const salt = crypto.randomBytes(16).toString('hex');
    const passwordHash = hashPassword(password, salt);
    await connection.execute('UPDATE users SET salt = ?, password_hash = ? WHERE id = ?', [salt, passwordHash, userId]);
    await connection.execute('DELETE FROM sessions WHERE user_id = ?', [userId]);
    await connection.execute('DELETE FROM password_reset_tokens WHERE user_id = ?', [userId]);
    await connection.commit();
    res.json({ ok: true, message: 'Senha alterada. Entre novamente com a nova senha.' });
  } catch (error) {
    await connection.rollback().catch(() => {});
    next(error);
  } finally {
    connection.release();
  }
}

function me(req, res) {
  res.json({ user: req.user });
}

function perfil(req, res) {
  res.json({ usuario: { id: req.user.id, nome: req.user.name, email: req.user.email } });
}

module.exports = { cadastrar, login, logout, me, perfil, solicitarRecuperacao, redefinirSenha };