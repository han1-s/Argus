const test = require('node:test');
const assert = require('node:assert/strict');
const pool = require('../src/config/database');
const authController = require('../src/controllers/authController');

const termsVersion = process.env.ARGUS_TERMS_VERSION || '2026-09-v1';
const request = body => ({ body, headers: {}, secure: false });
const response = () => ({
  status() { return this; },
  json() { return this; },
  setHeader() {},
});

test('auth handlers forward MySQL connection failures to Express', async t => {
  const originalGetConnection = pool.getConnection;
  const failure = new Error('simulated MySQL connection failure');
  pool.getConnection = async () => { throw failure; };

  const cases = [
    ['signup', authController.cadastrar, { name: 'Test User', email: 'test@example.invalid', password: 'valid-password-123', termsAccepted: true, termsVersion }],
    ['login', authController.login, { email: 'test@example.invalid', password: 'valid-password-123', termsAccepted: true, termsVersion }],
    ['password reset', authController.redefinirSenha, { email: 'test@example.invalid', code: '123456', password: 'valid-password-123' }],
  ];

  try {
    for (const [name, handler, body] of cases) {
      await t.test(name, async () => {
        let forwardedError;
        await handler(request(body), response(), error => { forwardedError = error; });
        assert.equal(forwardedError, failure);
      });
    }
  } finally {
    pool.getConnection = originalGetConnection;
  }
});
