const mysql = require('mysql2/promise');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

let pool;
let eventIds = new Set();
let webIds = new Set();
let acceptanceKeys = new Set();
let writeQueue = Promise.resolve();
const date = value => value instanceof Date ? value.toISOString() : new Date(value).toISOString();
const json = value => typeof value === 'string' ? JSON.parse(value || 'null') : value;

async function initialize() {
  const database = process.env.MYSQL_DATABASE || 'argus';
  if (!/^[a-zA-Z0-9_]+$/.test(database)) throw new Error('MYSQL_DATABASE may contain only letters, numbers and underscores.');
  const config = { host: process.env.MYSQL_HOST || '127.0.0.1', port: Number(process.env.MYSQL_PORT || 3306), user: process.env.MYSQL_USER || 'root', password: process.env.MYSQL_PASSWORD || '', waitForConnections: true, connectionLimit: 10, charset: 'utf8mb4' };
  if (process.env.MYSQL_AUTO_CREATE_DATABASE !== 'false') {
    const bootstrap = await mysql.createConnection({ host: config.host, port: config.port, user: config.user, password: config.password, charset: config.charset });
    try { await bootstrap.query(`CREATE DATABASE IF NOT EXISTS \`${database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`); }
    finally { await bootstrap.end(); }
  }
  pool = mysql.createPool({ ...config, database, timezone: 'Z', dateStrings: false });
  const sql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8').replace(/^CREATE DATABASE[^;]*;\s*/i, '').replace(/^USE[^;]*;\s*/i, '');
  for (const statement of sql.split(';').map(s => s.trim()).filter(Boolean)) await pool.query(statement);
  const data = await load();
  if (data.users.length === 0) {
    const legacyPath = path.join(__dirname, 'data.json');
    try {
      const legacy = JSON.parse(fs.readFileSync(legacyPath, 'utf8').replace(/^\uFEFF/, ''));
      if (legacy.users?.length) {
        Object.assign(data, { ...data, ...legacy, webActivity: legacy.webActivity || [], termAcceptances: legacy.termAcceptances || [], sessions: legacy.sessions || [] });
        data.users = data.users.map(u => ({ ...u, webConsent: Boolean(u.webConsent) }));
        await save(data);
      }
    } catch (error) { if (error.code !== 'ENOENT') throw error; }
  }
  await initializeAdmin(data);
  return data;
}

async function initializeAdmin(data) {
  const key = 'admin_account_seed_v1';
  const [markers] = await pool.execute('SELECT value FROM app_metadata WHERE `key`=?', [key]);
  if (markers.length) return;

  const email = String(process.env.ARGUS_ADMIN_EMAIL || 'hanielshz@gmail.com').trim().toLowerCase();
  const password = String(process.env.ARGUS_ADMIN_PASSWORD || '12345678');
  if (!/^\S+@\S+\.\S+$/.test(email) || password.length < 8) throw new Error('ARGUS_ADMIN_EMAIL and ARGUS_ADMIN_PASSWORD must define valid admin credentials (password: at least 8 characters).');

  const user = data.users.find(entry => entry.email.toLowerCase() === email);
  const credentials = { salt: crypto.randomBytes(16).toString('hex') };
  credentials.hash = crypto.scryptSync(password, credentials.salt, 64).toString('hex');
  const now = new Date().toISOString();
  if (user) {
    user.salt = credentials.salt;
    user.hash = credentials.hash;
  } else {
    data.users.push({ id: crypto.randomUUID(), name: 'Haniel Sousa e Souza', email, ...credentials, createdAt: now, webConsent: false, termsVersion: null, termsAcceptedAt: null });
  }
  await save(data);
  await pool.execute('INSERT INTO app_metadata (`key`, value) VALUES (?, ?)', [key, email]);
}

async function load() {
  const [users, machines, pairings, events, alerts, webActivity, acceptances, sessions] = await Promise.all([
    pool.query('SELECT * FROM users'), pool.query('SELECT * FROM machines'), pool.query('SELECT * FROM pairings'),
    pool.query('SELECT * FROM events ORDER BY occurred_at DESC LIMIT 500'), pool.query('SELECT * FROM alerts ORDER BY occurred_at DESC LIMIT 500'),
    pool.query('SELECT * FROM web_activity ORDER BY occurred_at DESC LIMIT 5000'), pool.query('SELECT * FROM terms_acceptances ORDER BY accepted_at'),
    pool.query('SELECT * FROM sessions WHERE expires_at > UTC_TIMESTAMP(3)')
  ]).then(results => results.map(result => result[0]));
  const result = {
    users: users.map(u => ({ id: u.id, name: u.name, email: u.email, salt: u.salt, hash: u.password_hash, createdAt: date(u.created_at), webConsent: Boolean(u.web_consent), termsVersion: u.terms_version, termsAcceptedAt: u.terms_accepted_at ? date(u.terms_accepted_at) : null })),
    machines: machines.map(m => ({ id: m.id, userId: m.user_id, name: m.name, token: m.token, status: m.status, userName: m.user_name, os: m.os, arch: m.arch, uptime: Number(m.uptime), metrics: json(m.metrics) || {}, apps: json(m.apps) || [], webActivity: m.web_activity, lastSeen: date(m.last_seen), createdAt: date(m.created_at), firstSeenAt: date(m.first_seen_at) })),
    pairings: pairings.map(p => ({ code: p.code, userId: p.user_id, expiresAt: Number(p.expires_at) })),
    events: events.map(e => ({ id: e.id, machineId: e.machine_id, machineName: e.machine_name, type: e.type, message: e.message, at: date(e.occurred_at) })),
    alerts: alerts.map(a => ({ id: a.id, machineId: a.machine_id, machineName: a.machine_name, kind: a.kind, message: a.message, at: date(a.occurred_at), open: Boolean(a.is_open) })),
    webActivity: webActivity.map(w => ({ id: w.id, machineId: w.machine_id, domain: w.domain, durationSeconds: Number(w.duration_seconds), at: date(w.occurred_at) })),
    termAcceptances: acceptances.map(a => ({ userId: a.user_id, version: a.terms_version, acceptedAt: date(a.accepted_at), webConsent: Boolean(a.web_consent) })),
    sessions: sessions.map(s => ({ tokenHash: s.token_hash, userId: s.user_id, createdAt: date(s.created_at), expiresAt: date(s.expires_at) }))
  };
  eventIds = new Set(result.events.map(e => e.id));
  webIds = new Set(result.webActivity.map(w => w.id));
  acceptanceKeys = new Set(result.termAcceptances.map(t => `${t.userId}:${t.version}:${t.acceptedAt}`));
  return result;
}

async function refreshUsers(data) {
  const [users, sessions] = await Promise.all([
    pool.query('SELECT * FROM users'),
    pool.query('SELECT * FROM sessions WHERE expires_at > UTC_TIMESTAMP(3)'),
  ]).then(results => results.map(result => result[0]));
  data.users = users.map(u => ({ id: u.id, name: u.name, email: u.email, salt: u.salt, hash: u.password_hash, createdAt: date(u.created_at), webConsent: Boolean(u.web_consent), termsVersion: u.terms_version, termsAcceptedAt: u.terms_accepted_at ? date(u.terms_accepted_at) : null }));
  data.sessions = sessions.map(s => ({ tokenHash: s.token_hash, userId: s.user_id, createdAt: date(s.created_at), expiresAt: date(s.expires_at) }));
}

async function findSessionUser(tokenHash) {
  const [rows] = await pool.execute(
    `SELECT u.id, u.name, u.email, u.web_consent, u.terms_version
     FROM sessions s JOIN users u ON u.id = s.user_id
     WHERE s.token_hash = ? AND s.expires_at > UTC_TIMESTAMP(3)
     LIMIT 1`,
    [tokenHash],
  );
  const user = rows[0];
  return user ? {
    id: user.id,
    name: user.name,
    email: user.email,
    webConsent: Boolean(user.web_consent),
    termsVersion: user.terms_version,
  } : null;
}

async function deleteSession(tokenHash) {
  await pool.execute('DELETE FROM sessions WHERE token_hash = ?', [tokenHash]);
}

async function createSession(session) {
  await pool.execute(
    'INSERT INTO sessions (token_hash, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)',
    [session.tokenHash, session.userId, new Date(session.createdAt), new Date(session.expiresAt)],
  );
}

async function createPasswordReset(email) {
  const [users] = await pool.execute('SELECT id FROM users WHERE email = ? LIMIT 1', [email]);
  if (!users.length) return null;
  const userId = users[0].id;
  const code = String(crypto.randomInt(0, 1000000)).padStart(6, '0');
  const codeHash = crypto.createHash('sha256').update(code).digest('hex');
  const requestedAt = new Date();
  const expiresAt = new Date(requestedAt.getTime() + 15 * 60 * 1000);
  await pool.execute('DELETE FROM password_reset_tokens WHERE user_id = ?', [userId]);
  await pool.execute('INSERT INTO password_reset_tokens (id,user_id,code_hash,requested_at,expires_at) VALUES (?,?,?,?,?)', [crypto.randomUUID(), userId, codeHash, requestedAt, expiresAt]);
  return code;
}

async function completePasswordReset(email, code, password) {
  const userId = await pool.getConnection().then(async connection => {
    try {
      await connection.beginTransaction();
      const codeHash = crypto.createHash('sha256').update(code).digest('hex');
      const [rows] = await connection.execute(
        `SELECT u.id FROM users u JOIN password_reset_tokens r ON r.user_id = u.id
         WHERE u.email = ? AND r.code_hash = ? AND r.expires_at > UTC_TIMESTAMP(3) LIMIT 1 FOR UPDATE`,
        [email, codeHash],
      );
      if (!rows.length) { await connection.rollback(); return null; }
      const userId = rows[0].id;
      const salt = crypto.randomBytes(16).toString('hex');
      const hash = crypto.scryptSync(password, salt, 64).toString('hex');
      await connection.execute('UPDATE users SET salt = ?, password_hash = ? WHERE id = ?', [salt, hash, userId]);
      await connection.execute('DELETE FROM sessions WHERE user_id = ?', [userId]);
      await connection.execute('DELETE FROM password_reset_tokens WHERE user_id = ?', [userId]);
      await connection.commit();
      return userId;
    } catch (error) {
      await connection.rollback().catch(() => {});
      throw error;
    } finally {
      connection.release();
    }
  });
  return userId;
}

function save(data) {
  const task = writeQueue.then(() => saveNow(data));
  writeQueue = task.catch(() => {});
  return task;
}
async function saveNow(data) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    await connection.query('DELETE FROM pairings');
    await connection.execute('DELETE FROM sessions WHERE expires_at <= UTC_TIMESTAMP(3)');
    for (const u of data.users) await connection.execute(`INSERT INTO users (id,name,email,salt,password_hash,created_at,web_consent,terms_version,terms_accepted_at) VALUES (?,?,?,?,?,?,?,?,?) ON DUPLICATE KEY UPDATE name=VALUES(name),email=VALUES(email),salt=VALUES(salt),password_hash=VALUES(password_hash),web_consent=VALUES(web_consent),terms_version=VALUES(terms_version),terms_accepted_at=VALUES(terms_accepted_at)`, [u.id,u.name,u.email,u.salt,u.hash,new Date(u.createdAt),Boolean(u.webConsent),u.termsVersion || null,u.termsAcceptedAt ? new Date(u.termsAcceptedAt) : null]);
    for (const m of data.machines) await connection.execute(`INSERT INTO machines (id,user_id,name,token,status,user_name,os,arch,uptime,metrics,apps,web_activity,last_seen,created_at,first_seen_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?) ON DUPLICATE KEY UPDATE name=VALUES(name),token=VALUES(token),status=VALUES(status),user_name=VALUES(user_name),os=VALUES(os),arch=VALUES(arch),uptime=VALUES(uptime),metrics=VALUES(metrics),apps=VALUES(apps),web_activity=VALUES(web_activity),last_seen=VALUES(last_seen)`, [m.id,m.userId,m.name,m.token,m.status,m.userName || null,m.os || null,m.arch || null,m.uptime || 0,JSON.stringify(m.metrics || {}),JSON.stringify(m.apps || []),m.webActivity || null,new Date(m.lastSeen),new Date(m.createdAt || m.lastSeen),new Date(m.firstSeenAt || m.createdAt || m.lastSeen)]);
    for (const p of data.pairings) await connection.execute('INSERT INTO pairings (code,user_id,expires_at) VALUES (?,?,?) ON DUPLICATE KEY UPDATE expires_at=VALUES(expires_at)', [p.code,p.userId,p.expiresAt]);
    const newEvents = data.events.filter(e => !eventIds.has(e.id));
    for (const e of newEvents) await connection.execute('INSERT IGNORE INTO events (id,machine_id,machine_name,type,message,occurred_at) VALUES (?,?,?,?,?,?)', [e.id,e.machineId,e.machineName,e.type,e.message,new Date(e.at)]);
    for (const a of data.alerts) await connection.execute('INSERT INTO alerts (id,machine_id,machine_name,kind,message,occurred_at,is_open) VALUES (?,?,?,?,?,?,?) ON DUPLICATE KEY UPDATE is_open=VALUES(is_open)', [a.id,a.machineId,a.machineName,a.kind,a.message,new Date(a.at),Boolean(a.open)]);
    const newWeb = data.webActivity.filter(w => !webIds.has(w.id));
    for (const w of newWeb) await connection.execute('INSERT IGNORE INTO web_activity (id,machine_id,domain,duration_seconds,occurred_at) VALUES (?,?,?,?,?)', [w.id,w.machineId,w.domain,w.durationSeconds,new Date(w.at)]);
    const newAcceptances = data.termAcceptances.filter(t => !acceptanceKeys.has(`${t.userId}:${t.version}:${t.acceptedAt}`));
    for (const t of newAcceptances) await connection.execute('INSERT IGNORE INTO terms_acceptances (user_id,terms_version,accepted_at,web_consent) VALUES (?,?,?,?)', [t.userId,t.version,new Date(t.acceptedAt),Boolean(t.webConsent)]);
    await connection.commit();
    newEvents.forEach(e => eventIds.add(e.id)); newWeb.forEach(w => webIds.add(w.id)); newAcceptances.forEach(t => acceptanceKeys.add(`${t.userId}:${t.version}:${t.acceptedAt}`));
  } catch (error) { await connection.rollback(); throw error; }
  finally { connection.release(); }
}

async function acknowledgeConsentRevocation(userId) {
  const [rows] = await pool.execute('SELECT w.id FROM web_activity w JOIN machines m ON m.id=w.machine_id WHERE m.user_id=?', [userId]);
  await pool.execute('DELETE w FROM web_activity w JOIN machines m ON m.id=w.machine_id WHERE m.user_id=?', [userId]);
  rows.forEach(row => webIds.delete(row.id));
}
async function deleteUser(userId) { await pool.execute('DELETE FROM users WHERE id=?', [userId]); }
async function prune() {
  await pool.execute('DELETE FROM sessions WHERE expires_at <= UTC_TIMESTAMP(3)');
  await pool.execute('DELETE FROM web_activity WHERE occurred_at < DATE_SUB(UTC_TIMESTAMP(3), INTERVAL 90 DAY)');
  await pool.execute('DELETE FROM events WHERE occurred_at < DATE_SUB(UTC_TIMESTAMP(3), INTERVAL 90 DAY)');
  await pool.execute('DELETE FROM alerts WHERE is_open=FALSE AND occurred_at < DATE_SUB(UTC_TIMESTAMP(3), INTERVAL 90 DAY)');
}
async function close() { if (pool) await pool.end(); }
module.exports = { initialize, refreshUsers, findSessionUser, createSession, deleteSession, createPasswordReset, completePasswordReset, save, acknowledgeConsentRevocation, deleteUser, prune, close };
