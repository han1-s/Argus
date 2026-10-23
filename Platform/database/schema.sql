-- Esquema canonico compartilhado pela API Platform, pelo Web Backend e pelos agentes.
-- Todas as tabelas sao criadas de forma idempotente; inicializacao nao remove dados.
CREATE DATABASE IF NOT EXISTS argus CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE argus;

CREATE TABLE IF NOT EXISTS schema_migrations (
  version INT UNSIGNED PRIMARY KEY,
  description VARCHAR(255) NOT NULL,
  applied_at DATETIME(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS app_metadata (
  `key` VARCHAR(100) PRIMARY KEY,
  value VARCHAR(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS users (
  id CHAR(36) PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(254) NOT NULL UNIQUE,
  salt CHAR(32) NOT NULL,
  password_hash CHAR(128) NOT NULL,
  created_at DATETIME(3) NOT NULL,
  web_consent BOOLEAN NOT NULL DEFAULT FALSE,
  terms_version VARCHAR(30) NULL,
  terms_accepted_at DATETIME(3) NULL,
  avatar_data MEDIUMTEXT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS terms_acceptances (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  terms_version VARCHAR(30) NOT NULL,
  accepted_at DATETIME(3) NOT NULL,
  web_consent BOOLEAN NOT NULL DEFAULT FALSE,
  INDEX idx_terms_user_time (user_id, accepted_at),
  UNIQUE KEY uq_terms_acceptance (user_id, terms_version, accepted_at),
  CONSTRAINT fk_terms_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS sessions (
  token_hash CHAR(64) PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  created_at DATETIME(3) NOT NULL,
  expires_at DATETIME(3) NOT NULL,
  INDEX idx_session_expiry (expires_at),
  INDEX idx_session_user_expiry (user_id, expires_at),
  CONSTRAINT fk_session_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  code_hash CHAR(64) NOT NULL,
  requested_at DATETIME(3) NOT NULL,
  expires_at DATETIME(3) NOT NULL,
  UNIQUE KEY uq_password_reset_hash (code_hash),
  INDEX idx_password_reset_user_expiry (user_id, expires_at),
  INDEX idx_password_reset_expiry (expires_at),
  CONSTRAINT fk_password_reset_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS subscriptions (
  user_id CHAR(36) PRIMARY KEY,
  plan ENUM('Free','Pro','Business') NOT NULL DEFAULT 'Free',
  billing_cycle ENUM('monthly','annual') NOT NULL DEFAULT 'monthly',
  status ENUM('active','canceled') NOT NULL DEFAULT 'active',
  started_at DATETIME(3) NOT NULL,
  updated_at DATETIME(3) NOT NULL,
  CONSTRAINT fk_subscription_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS machines (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  name VARCHAR(80) NOT NULL,
  token CHAR(64) NOT NULL UNIQUE,
  status ENUM('online','offline') NOT NULL DEFAULT 'offline',
  user_name VARCHAR(100) NULL,
  os VARCHAR(120) NULL,
  arch VARCHAR(30) NULL,
  uptime BIGINT UNSIGNED NOT NULL DEFAULT 0,
  metrics JSON NULL,
  apps JSON NULL,
  web_activity VARCHAR(255) NULL,
  last_seen DATETIME(3) NOT NULL,
  created_at DATETIME(3) NOT NULL,
  first_seen_at DATETIME(3) NOT NULL,
  UNIQUE KEY uq_machine_user_name (user_id, name),
  INDEX idx_machine_owner_status (user_id, status),
  CONSTRAINT fk_machine_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS metric_samples (
  sample_id CHAR(36) PRIMARY KEY,
  machine_id CHAR(36) NOT NULL,
  sampled_at DATETIME(3) NOT NULL,
  metrics JSON NOT NULL,
  apps JSON NOT NULL,
  INDEX idx_metric_sample_machine_time (machine_id, sampled_at),
  INDEX idx_metric_sample_sampled_at (sampled_at),
  CONSTRAINT fk_metric_sample_machine FOREIGN KEY (machine_id) REFERENCES machines(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS pairings (
  code VARCHAR(16) PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  expires_at BIGINT UNSIGNED NOT NULL,
  INDEX idx_pairing_expires_at (expires_at),
  CONSTRAINT fk_pairing_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS events (
  id CHAR(36) PRIMARY KEY,
  machine_id CHAR(36) NOT NULL,
  machine_name VARCHAR(80) NOT NULL,
  type VARCHAR(30) NOT NULL,
  message VARCHAR(255) NOT NULL,
  occurred_at DATETIME(3) NOT NULL,
  INDEX idx_event_machine_time (machine_id, occurred_at),
  INDEX idx_event_occurred_at (occurred_at),
  CONSTRAINT fk_event_machine FOREIGN KEY (machine_id) REFERENCES machines(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS alerts (
  id CHAR(36) PRIMARY KEY,
  machine_id CHAR(36) NOT NULL,
  machine_name VARCHAR(80) NOT NULL,
  kind VARCHAR(30) NOT NULL,
  message VARCHAR(255) NOT NULL,
  occurred_at DATETIME(3) NOT NULL,
  is_open BOOLEAN NOT NULL DEFAULT TRUE,
  INDEX idx_alert_machine_open (machine_id, is_open),
  INDEX idx_alert_machine_open_time (machine_id, is_open, occurred_at),
  INDEX idx_alert_occurred_at (occurred_at),
  CONSTRAINT fk_alert_machine FOREIGN KEY (machine_id) REFERENCES machines(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS web_activity (
  id CHAR(36) PRIMARY KEY,
  machine_id CHAR(36) NOT NULL,
  domain VARCHAR(253) NOT NULL,
  duration_seconds SMALLINT UNSIGNED NOT NULL,
  occurred_at DATETIME(3) NOT NULL,
  INDEX idx_web_machine_time (machine_id, occurred_at),
  INDEX idx_web_domain_time (domain, occurred_at),
  INDEX idx_web_occurred_at (occurred_at),
  CONSTRAINT fk_web_machine FOREIGN KEY (machine_id) REFERENCES machines(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
