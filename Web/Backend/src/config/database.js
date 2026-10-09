const path = require('node:path');
const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config({
  path: process.env.ARGUS_ENV_FILE || path.resolve(__dirname, '../../../../Platform/.env'),
});

const database = process.env.MYSQL_DATABASE || 'argus';
if (!/^[a-zA-Z0-9_]+$/.test(database)) {
  throw new Error('MYSQL_DATABASE may contain only letters, numbers and underscores.');
}

module.exports = mysql.createPool({
  host: process.env.MYSQL_HOST || '127.0.0.1',
  port: Number(process.env.MYSQL_PORT || 3306),
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '',
  database,
  waitForConnections: true,
  connectionLimit: 10,
  charset: 'utf8mb4',
  timezone: 'Z',
});