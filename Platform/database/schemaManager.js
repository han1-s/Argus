'use strict';

const fs = require('fs');
const path = require('path');

const schemaPath = path.join(__dirname, 'schema.sql');
const schemaVersion = 2;

function databaseConfigFrom(env = process.env) {
  const database = String(env.MYSQL_DATABASE || 'argus').trim();
  if (!/^[a-zA-Z0-9_]+$/.test(database)) throw new Error('MYSQL_DATABASE pode conter somente letras, números e sublinhados.');
  return {
    host: env.MYSQL_HOST || '127.0.0.1',
    port: Number(env.MYSQL_PORT || 3306),
    user: env.MYSQL_USER || 'root',
    password: env.MYSQL_PASSWORD || '',
    database,
    charset: 'utf8mb4',
  };
}

async function ensureDatabaseExists(mysql, env = process.env) {
  const config = databaseConfigFrom(env);
  if (String(env.MYSQL_AUTO_CREATE_DATABASE || 'true').toLowerCase() === 'false') return config;

  const bootstrap = await mysql.createConnection({
    host: config.host,
    port: config.port,
    user: config.user,
    password: config.password,
    charset: config.charset,
  });
  try {
    await bootstrap.query(`CREATE DATABASE IF NOT EXISTS \`${config.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
  } finally {
    await bootstrap.end();
  }
  return config;
}

async function ensureIndex(pool, table, name, statement) {
  const [rows] = await pool.execute(
    'SELECT 1 FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = ? AND index_name = ? LIMIT 1',
    [table, name],
  );
  if (!rows.length) await pool.query(statement);
}

async function ensureColumn(pool, table, name, statement) {
  const [rows] = await pool.execute(
    'SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = ? AND column_name = ? LIMIT 1',
    [table, name],
  );
  if (!rows.length) await pool.query(statement);
}

async function ensureSharedSchema(pool) {
  const connection = await pool.getConnection();
  let locked = false;
  try {
    const [locks] = await connection.query('SELECT GET_LOCK(?, 30) AS acquired', ['argus_shared_schema']);
    if (Number(locks[0]?.acquired) !== 1) throw new Error('Tempo limite aguardando atualizacao do schema compartilhado ARGUS.');
    locked = true;

    const source = fs.readFileSync(schemaPath, 'utf8').replace(/^\uFEFF/, '').replace(/^\s*--.*$/gm, '');
    const statements = source.split(';').map(part => part.trim()).filter(Boolean);
    for (const statement of statements) {
      if (/^CREATE\s+DATABASE\b/i.test(statement) || /^USE\s+/i.test(statement)) continue;
      await connection.query(statement);
    }

    // Aplica os indices que podem faltar em uma base criada por versoes anteriores, sem apagar dados.
    const indexes = [
      ['password_reset_tokens', 'idx_password_reset_expiry', 'ALTER TABLE password_reset_tokens ADD INDEX idx_password_reset_expiry (expires_at)'],
      ['pairings', 'idx_pairing_expires_at', 'ALTER TABLE pairings ADD INDEX idx_pairing_expires_at (expires_at)'],
      ['events', 'idx_event_occurred_at', 'ALTER TABLE events ADD INDEX idx_event_occurred_at (occurred_at)'],
      ['alerts', 'idx_alert_machine_open_time', 'ALTER TABLE alerts ADD INDEX idx_alert_machine_open_time (machine_id, is_open, occurred_at)'],
      ['alerts', 'idx_alert_occurred_at', 'ALTER TABLE alerts ADD INDEX idx_alert_occurred_at (occurred_at)'],
      ['web_activity', 'idx_web_occurred_at', 'ALTER TABLE web_activity ADD INDEX idx_web_occurred_at (occurred_at)'],
      ['metric_samples', 'idx_metric_sample_sampled_at', 'ALTER TABLE metric_samples ADD INDEX idx_metric_sample_sampled_at (sampled_at)'],
    ];
    for (const [table, name, statement] of indexes) await ensureIndex(connection, table, name, statement);
    await ensureColumn(connection, 'users', 'avatar_data', 'ALTER TABLE users ADD COLUMN avatar_data MEDIUMTEXT NULL');

    await connection.execute(
      'INSERT IGNORE INTO schema_migrations (version, description, applied_at) VALUES (?, ?, UTC_TIMESTAMP(3))',
      [schemaVersion, 'Perfil compartilhado ARGUS Web + Platform'],
    );
    await connection.execute(
      `INSERT IGNORE INTO subscriptions (user_id, plan, billing_cycle, status, started_at, updated_at)
       SELECT id, 'Free', 'monthly', 'active', UTC_TIMESTAMP(3), UTC_TIMESTAMP(3) FROM users`,
    );
  } finally {
    if (locked) await connection.query('SELECT RELEASE_LOCK(?)', ['argus_shared_schema']).catch(() => {});
    connection.release();
  }
}

module.exports = { databaseConfigFrom, ensureDatabaseExists, ensureSharedSchema };
