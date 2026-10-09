const pool = require('./database');

async function ensureBillingSchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS payment_transactions (
      transaction_id CHAR(36) PRIMARY KEY,
      user_id CHAR(36) NOT NULL,
      plan ENUM('Pro','Business') NOT NULL,
      billing_cycle ENUM('monthly','annual') NOT NULL,
      payment_method ENUM('pix','credit_card','debit_card') NOT NULL,
      amount_cents INT UNSIGNED NOT NULL,
      currency CHAR(3) NOT NULL DEFAULT 'BRL',
      status ENUM('approved') NOT NULL DEFAULT 'approved',
      transaction_reference VARCHAR(40) NOT NULL UNIQUE,
      card_brand VARCHAR(24) NULL,
      card_last4 CHAR(4) NULL,
      created_at DATETIME(3) NOT NULL,
      INDEX idx_payment_user_created (user_id, created_at),
      CONSTRAINT fk_payment_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
}

module.exports = ensureBillingSchema;
