const { spawnSync } = require('node:child_process');
const path = require('node:path');

const result = spawnSync(process.execPath, ['--test', path.resolve(__dirname, '../test/api.integration.test.js')], {
  cwd: path.resolve(__dirname, '..'),
  env: { ...process.env, ARGUS_RUN_MYSQL_INTEGRATION_TESTS: '1' },
  stdio: 'inherit',
});

if (result.error) {
  console.error('Nao foi possivel iniciar os testes de integracao:', result.error.message);
  process.exitCode = 1;
} else {
  process.exitCode = result.status ?? 1;
}
