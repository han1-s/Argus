const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const pool = require('../src/config/database');

const enabled = process.env.ARGUS_RUN_MYSQL_INTEGRATION_TESTS === '1';
const baseUrl = (process.env.ARGUS_TEST_API_URL || 'http://127.0.0.1:3001').replace(/\/$/, '');
const testRunId = crypto.randomUUID();

test('Web API integration against MySQL (opt-in)', { skip: !enabled }, async t => {
  const emails = [
    `argus-test-${testRunId}@example.invalid`,
    `argus-register-${testRunId}@example.invalid`,
  ];
  const password = `Argus-${crypto.randomBytes(10).toString('hex')}`;
  let termsVersion;
  let cookie;
  let machineId;
  let alertId;

  const request = (route, { method = 'GET', body, session = cookie } = {}) => fetch(`${baseUrl}${route}`, {
    method,
    headers: {
      ...(body === undefined ? {} : { 'content-type': 'application/json' }),
      ...(session ? { cookie: session } : {}),
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  const readJson = async response => response.json();

  try {
    await t.test('public root, legal terms, health, and generated installer', async () => {
      const root = await request('/');
      assert.equal(root.status, 200);
      assert.match((await readJson(root)).message, /Web do ARGUS/);

      const terms = await request('/api/legal/terms');
      assert.equal(terms.status, 200);
      termsVersion = (await readJson(terms)).version;
      assert.ok(termsVersion);

      const health = await request('/api/health');
      assert.equal(health.status, 200);
      assert.deepEqual(await readJson(health), { ok: true, database: true });

      const download = await request('/downloads/ARGUS.cmd?server=http%3A%2F%2F127.0.0.1%3A3000');
      assert.equal(download.status, 200);
      assert.match(download.headers.get('content-disposition'), /attachment; filename="ARGUS\.cmd"/);
      assert.match(await download.text(), /ARGUS_SERVER_URL=http:\/\/127\.0\.0\.1:3000/);
      assert.equal((await request('/downloads/ARGUS.cmd?server=invalid')).status, 400);
      const injectedHost = encodeURIComponent('http://argus.example.com&whoami');
      assert.equal((await request(`/downloads/ARGUS.cmd?server=${injectedHost}`)).status, 400);
    });

    await t.test('all protected routes reject requests without a session', async () => {
      const routes = [
        '/api/auth/me', '/api/auth/profile', '/api/dashboard', '/api/maquinas',
        '/api/atividades', '/api/relatorios', '/api/alertas', '/api/assinatura',
        '/api/notificacoes',
      ];
      for (const route of routes) assert.equal((await request(route, { session: null })).status, 401, route);
    });

    await t.test('signup validates input, stores a disposable account, and sets a secure cookie policy', async () => {
      const invalid = await request('/api/auth/signup', { method: 'POST', body: { name: 'A', email: emails[0], password: 'short' } });
      assert.equal(invalid.status, 400);

      const noTerms = await request('/api/auth/signup', { method: 'POST', body: { name: 'ARGUS Test', email: emails[0], password } });
      assert.equal(noTerms.status, 400);

      const signup = await request('/api/auth/signup', { method: 'POST', body: { name: 'ARGUS Test', email: emails[0], password, termsAccepted: true, termsVersion, webConsent: false } });
      assert.equal(signup.status, 201);
      const user = (await readJson(signup)).user;
      assert.equal(user.email, emails[0]);
      assert.equal(user.webConsent, false);
      const setCookie = signup.headers.get('set-cookie');
      assert.match(setCookie, /HttpOnly/i);
      assert.match(setCookie, /SameSite=Lax/i);
      cookie = setCookie.split(';')[0];

      assert.equal((await request('/api/auth/signup', { method: 'POST', body: { name: 'ARGUS Test', email: emails[0], password, termsAccepted: true, termsVersion } })).status, 409);
      assert.equal((await request('/api/auth/register', { method: 'POST', body: { name: 'ARGUS Alias', email: emails[1], password, termsAccepted: true, termsVersion } })).status, 201);
    });

    await t.test('login, current-user, profile, and consent version checks work', async () => {
      assert.equal((await request('/api/auth/login', { method: 'POST', body: { email: emails[0], password: 'wrong-password', termsAccepted: true, termsVersion } })).status, 401);
      assert.equal((await request('/api/auth/login', { method: 'POST', body: { email: emails[0], password } })).status, 428);

      const me = await request('/api/auth/me');
      assert.equal(me.status, 200);
      assert.equal((await readJson(me)).user.email, emails[0]);
      const profile = await request('/api/auth/profile');
      assert.equal(profile.status, 200);
      assert.equal((await readJson(profile)).usuario.email, emails[0]);
    });

    await t.test('account-scoped machines, dashboard, events, reports, alerts, and notifications work', async () => {
      const [users] = await pool.execute('SELECT id FROM users WHERE email = ?', [emails[0]]);
      assert.equal(users.length, 1);
      const userId = users[0].id;
      machineId = crypto.randomUUID();
      alertId = crypto.randomUUID();
      const now = new Date();
      const token = crypto.randomBytes(32).toString('hex');
      await pool.execute(
        `INSERT INTO machines (id,user_id,name,token,status,user_name,os,arch,uptime,metrics,apps,last_seen,created_at,first_seen_at)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        [machineId, userId, 'ARGUS Integration Test', token, 'online', 'test-user', 'Windows Test', 'x64', 60, JSON.stringify({ cpu: 10 }), JSON.stringify([]), now, now, now],
      );
      await pool.execute('INSERT INTO events (id,machine_id,machine_name,type,message,occurred_at) VALUES (?,?,?,?,?,?)', [crypto.randomUUID(), machineId, 'ARGUS Integration Test', 'test', 'Evento de teste', now]);
      await pool.execute('INSERT INTO alerts (id,machine_id,machine_name,kind,message,occurred_at,is_open) VALUES (?,?,?,?,?,?,TRUE)', [alertId, machineId, 'ARGUS Integration Test', 'test', 'Alerta de teste', now]);
      await pool.execute('INSERT INTO web_activity (id,machine_id,domain,duration_seconds,occurred_at) VALUES (?,?,?,?,?)', [crypto.randomUUID(), machineId, 'example.invalid', 12, now]);

      const machines = await readJson(await request('/api/maquinas'));
      assert.equal(machines.maquinas.length, 1);
      assert.equal(machines.maquinas[0].id, machineId);
      const detail = await readJson(await request(`/api/maquinas/${machineId}`));
      assert.equal(detail.maquina.id, machineId);
      assert.equal(Object.hasOwn(detail.maquina, 'token'), false);
      assert.equal((await request('/api/maquinas/not-the-owner')).status, 404);

      const dashboard = await readJson(await request('/api/dashboard'));
      assert.equal(dashboard.summary.total, 1);
      assert.equal(dashboard.summary.online, 1);
      assert.equal(dashboard.summary.alerts, 1);
      assert.equal(dashboard.events.length, 1);
      assert.equal(dashboard.webActivity[0].domain, 'example.invalid');
      assert.equal((await readJson(await request('/api/atividades'))).atividades.length, 1);
      assert.equal((await readJson(await request('/api/relatorios?days=999'))).dias, 30);
      assert.equal((await readJson(await request('/api/alertas'))).alertas.length, 1);
      const notifications = (await readJson(await request('/api/notificacoes'))).notificacoes;
      assert.equal(notifications.length, 2);
      assert.ok(notifications.every(item => item.source === 'Platform'));

      const otherLogin = await request('/api/auth/login', { method: 'POST', body: { email: emails[1], password, termsAccepted: true, termsVersion } });
      assert.equal(otherLogin.status, 200);
      const otherCookie = otherLogin.headers.get('set-cookie').split(';')[0];
      assert.equal((await readJson(await request('/api/maquinas', { session: otherCookie }))).maquinas.length, 0);
      assert.equal((await request(`/api/alertas/${alertId}/ack`, { method: 'POST', body: {}, session: otherCookie })).status, 404);
      assert.equal(Number((await readJson(await request('/api/alertas'))).alertas[0].aberto), 1);

      assert.equal((await request(`/api/alertas/${alertId}/ack`, { method: 'POST', body: {} })).status, 200);
      const alertsAfterAck = (await readJson(await request('/api/alertas'))).alertas;
      assert.equal(Number(alertsAfterAck[0].aberto), 0);
      assert.equal((await request('/api/alertas/not-found/ack', { method: 'POST', body: {} })).status, 404);
    });

    await t.test('subscription is validated, persisted, and returned on the next read', async () => {
      assert.equal((await readJson(await request('/api/assinatura'))).assinatura.plan, 'Free');
      assert.equal((await request('/api/assinatura', { method: 'PUT', body: { plan: 'Invalid', billingCycle: 'monthly' } })).status, 400);
      assert.equal((await request('/api/assinatura', { method: 'PUT', body: { plan: 'Pro', billingCycle: 'invalid' } })).status, 400);
      const saved = await request('/api/assinatura', { method: 'PUT', body: { plan: 'Pro', billingCycle: 'annual' } });
      assert.equal(saved.status, 200);
      assert.equal((await readJson(saved)).assinatura.plan, 'Pro');
      const persisted = await readJson(await request('/api/assinatura'));
      assert.equal(persisted.assinatura.plan, 'Pro');
      assert.equal(persisted.assinatura.billing_cycle, 'annual');
    });

    await t.test('simulated recovery validates, resets credentials, and revokes sessions', async () => {
      assert.equal((await request('/api/auth/forgot-password', { method: 'POST', body: { email: 'invalid' } })).status, 400);
      const unknown = await readJson(await request('/api/auth/forgot-password', { method: 'POST', body: { email: 'nobody@example.invalid' } }));
      assert.equal(unknown.simulated, true);
      assert.equal(unknown.simulatedEmail, null);

      const recovery = await readJson(await request('/api/auth/forgot-password', { method: 'POST', body: { email: emails[0] } }));
      assert.equal(recovery.simulated, true);
      assert.equal(recovery.simulatedEmail.to, emails[0]);
      const code = recovery.simulatedEmail.code;
      assert.equal((await request('/api/auth/reset-password', { method: 'POST', body: { email: emails[0], code, password: 'short' } })).status, 400);
      const wrongCode = code === '000000' ? '000001' : '000000';
      assert.equal((await request('/api/auth/reset-password', { method: 'POST', body: { email: emails[0], code: wrongCode, password: 'A-valid-new-pass-1' } })).status, 400);

      const newPassword = `Changed-${crypto.randomBytes(8).toString('hex')}`;
      const reset = await request('/api/auth/reset-password', { method: 'POST', body: { email: emails[0], code, password: newPassword } });
      assert.equal(reset.status, 200);
      assert.equal((await request('/api/auth/me')).status, 401);
      assert.equal((await request('/api/auth/login', { method: 'POST', body: { email: emails[0], password, termsAccepted: true, termsVersion } })).status, 401);
      const login = await request('/api/auth/login', { method: 'POST', body: { email: emails[0], password: newPassword, termsAccepted: true, termsVersion } });
      assert.equal(login.status, 200);
      cookie = login.headers.get('set-cookie').split(';')[0];
    });

    await t.test('logout clears cookie and revokes the session', async () => {
      const logout = await request('/api/auth/logout', { method: 'POST' });
      assert.equal(logout.status, 200);
      assert.match(logout.headers.get('set-cookie'), /Max-Age=0/);
      assert.equal((await request('/api/auth/me')).status, 401);
    });
  } finally {
    try {
      await pool.execute('DELETE FROM users WHERE email IN (?, ?)', emails);
      const [remainingAccounts] = await pool.execute('SELECT email FROM users WHERE email IN (?, ?)', emails);
      assert.equal(remainingAccounts.length, 0, 'temporary integration accounts must be removed');
    } finally {
      await pool.end();
    }
  }
});
