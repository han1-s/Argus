const mysql = require('mysql2/promise');
const pool = require('./database');
const { ensureDatabaseExists, ensureSharedSchema } = require('../../../../Platform/database/schemaManager');

async function ensureBillingSchema() {
  await ensureDatabaseExists(mysql, process.env);
  await ensureSharedSchema(pool);
}

module.exports = ensureBillingSchema;
