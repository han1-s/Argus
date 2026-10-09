const crypto = require('node:crypto');
const pool = require('./database');

async function initializeAdmin() {
  const email = String(process.env.ARGUS_ADMIN_EMAIL || 'hanielshz@gmail.com').trim().toLowerCase();
  const password = String(process.env.ARGUS_ADMIN_PASSWORD || '12345678');
  if (!/^\S+@\S+\.\S+$/.test(email) || password.length < 8) {
    throw new Error('Configure um e-mail válido e senha admin com pelo menos 8 caracteres.');
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [markers] = await connection.execute(
      'SELECT value FROM app_metadata WHERE `key` = ? FOR UPDATE',
      ['admin_account_seed_v1'],
    );
    if (markers.length) {
      await connection.commit();
      return;
    }

    const [existing] = await connection.execute('SELECT id FROM users WHERE email = ? LIMIT 1', [email]);
    const salt = crypto.randomBytes(16).toString('hex');
    const passwordHash = crypto.scryptSync(password, salt, 64).toString('hex');
    const now = new Date();
    if (existing.length) {
      await connection.execute('UPDATE users SET salt = ?, password_hash = ? WHERE id = ?', [salt, passwordHash, existing[0].id]);
    } else {
      await connection.execute(
        `INSERT INTO users (id, name, email, salt, password_hash, created_at, web_consent)
         VALUES (?, ?, ?, ?, ?, ?, FALSE)`,
        [crypto.randomUUID(), 'Haniel Sousa e Souza', email, salt, passwordHash, now],
      );
    }
    await connection.execute(
      'INSERT INTO app_metadata (`key`, value) VALUES (?, ?)',
      ['admin_account_seed_v1', email],
    );
    await connection.commit();
  } catch (error) {
    await connection.rollback().catch(() => {});
    if (error.code !== 'ER_DUP_ENTRY') throw error;
  } finally {
    connection.release();
  }
}

module.exports = initializeAdmin;