'use strict';

const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const mysql = require('mysql2/promise');
const { ensureSharedSchema } = require('./schemaManager');

const platformRoot = path.resolve(__dirname, '..');
const envPath = path.join(platformRoot, '.env');
const examplePath = path.join(platformRoot, '.env.example');

function quoteSql(value) { return `'${String(value).replace(/\\/g, '\\\\').replace(/'/g, "''")}'`; }

function setEnvValue(source, key, value) {
  const line = `${key}=${JSON.stringify(String(value))}`;
  const pattern = new RegExp(`^\\s*${key}\\s*=.*$`, 'm');
  return pattern.test(source) ? source.replace(pattern, line) : `${source.trimEnd()}\n${line}\n`;
}

async function readInput() {
  let raw = '';
  for await (const chunk of process.stdin) raw += chunk;
  const encoded = raw.trim();
  if (!encoded) throw new Error('O assistente de configuração não enviou os dados necessários.');
  try { return JSON.parse(Buffer.from(encoded, 'base64').toString('utf8')); }
  catch { throw new Error('Os dados de configuração recebidos são inválidos.'); }
}

async function setup() {
  const input = await readInput();
  const host = String(input.host || '127.0.0.1').trim();
  const port = Number(input.port || 3306);
  const database = String(input.database || 'argus').trim();
  const adminUser = String(input.adminUser || '').trim();
  const adminPassword = String(input.adminPassword || '');
  const adminEmail = String(input.adminEmail || '').trim().toLowerCase();
  const argusAdminPassword = String(input.argusAdminPassword || '');
  const appUser = 'argus_app';

  if (!/^[a-zA-Z0-9_]{1,64}$/.test(database)) throw new Error('O nome do banco deve ter até 64 caracteres e usar somente letras, números e sublinhados.');
  if (!['127.0.0.1', 'localhost', '::1'].includes(host) || !Number.isInteger(port) || port < 1 || port > 65535) throw new Error('O assistente cria uma conta limitada ao computador servidor. Use localhost, 127.0.0.1 ou ::1.');
  if (!adminUser || adminUser.length > 64 || adminUser.includes('\0')) throw new Error('Informe um usuário administrador do MySQL válido.');
  if (!/^\S+@\S+\.\S+$/.test(adminEmail) || argusAdminPassword.length < 10) throw new Error('Informe um e-mail válido e uma senha ARGUS com pelo menos 10 caracteres.');

  const appPassword = crypto.randomBytes(32).toString('hex');
  const adminConnection = await mysql.createConnection({ host, port, user: adminUser, password: adminPassword, charset: 'utf8mb4' });
  try {
    await adminConnection.query(`CREATE DATABASE IF NOT EXISTS \`${database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    for (const accountHost of ['127.0.0.1', 'localhost', '::1']) {
      const account = `${quoteSql(appUser)}@${quoteSql(accountHost)}`;
      await adminConnection.query(`CREATE USER IF NOT EXISTS ${account} IDENTIFIED BY ${quoteSql(appPassword)}`);
      await adminConnection.query(`ALTER USER ${account} IDENTIFIED BY ${quoteSql(appPassword)}`);
      await adminConnection.query(`GRANT ALL PRIVILEGES ON \`${database}\`.* TO ${account}`);
    }
  } finally {
    await adminConnection.end();
  }

  const appPool = mysql.createPool({ host, port, user: appUser, password: appPassword, database, charset: 'utf8mb4', timezone: 'Z', waitForConnections: true, connectionLimit: 5 });
  try { await ensureSharedSchema(appPool); }
  finally { await appPool.end(); }

  let envText = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : fs.readFileSync(examplePath, 'utf8');
  for (const [key, value] of Object.entries({
    MYSQL_HOST: host,
    MYSQL_PORT: port,
    MYSQL_USER: appUser,
    MYSQL_PASSWORD: appPassword,
    MYSQL_DATABASE: database,
    MYSQL_AUTO_CREATE_DATABASE: 'false',
    ARGUS_ADMIN_EMAIL: adminEmail,
    ARGUS_ADMIN_PASSWORD: 'configure-during-install',
    ARGUS_ADMIN_PASSWORD_B64: Buffer.from(argusAdminPassword, 'utf8').toString('base64'),
  })) envText = setEnvValue(envText, key, value);
  fs.writeFileSync(envPath, envText, { encoding: 'utf8', mode: 0o600 });

  process.stdout.write(JSON.stringify({ ok: true, database, host, port, envPath }));
}

setup().catch(error => {
  process.stderr.write(`${error.message}\n`);
  process.exitCode = 1;
});
