const crypto = require('node:crypto');
const pool = require('./database');

async function initializeAdmin() {
  const email = String(process.env.ARGUS_ADMIN_EMAIL || 'hanielshz@gmail.com').trim().toLowerCase();
  const passwordB64 = String(process.env.ARGUS_ADMIN_PASSWORD_B64 || '');
  const password = passwordB64
    ? Buffer.from(passwordB64, 'base64').toString('utf8')
    : String(process.env.ARGUS_ADMIN_PASSWORD || '12345678');

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
    if (['change-this-password', 'configure-during-install'].includes(passwordB64) || (!passwordB64 && ['change-this-password', 'configure-during-install'].includes(password))) {
      throw new Error('Configure a conta inicial do ARGUS pela opcao Instalar ou atualizar no ARGUS.cmd.');
    }
    if (!/^\S+@\S+\.\S+$/.test(email) || password.length < 8) {
      throw new Error('Configure um e-mail válido e senha admin com pelo menos 8 caracteres.');
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
      `INSERT IGNORE INTO subscriptions (user_id, plan, billing_cycle, status, started_at, updated_at)
       SELECT id, 'Free', 'monthly', 'active', UTC_TIMESTAMP(3), UTC_TIMESTAMP(3) FROM users WHERE email = ?`,
      [email],
    );
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
