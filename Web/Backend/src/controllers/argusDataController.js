const crypto = require('node:crypto');
const pool = require('../config/database');
const { getPlanEntitlements } = require('../../../../Platform/shared/plans');

async function getUserPlan(userId) {
  const [rows] = await pool.execute("SELECT plan FROM subscriptions WHERE user_id = ? AND status = 'active' LIMIT 1", [userId]);
  return getPlanEntitlements(rows[0]?.plan || 'Free');
}

async function getComputerUsage(userId) {
  const [rows] = await pool.execute('SELECT COUNT(*) AS computers FROM machines WHERE user_id = ?', [userId]);
  return { computadores: Number(rows[0]?.computers || 0) };
}

function parseJson(value, fallback = {}) {
  if (typeof value !== 'string') return value || fallback;
  try { return JSON.parse(value); } catch { return fallback; }
}

function visibleApps(value, plan) {
  if (!plan.advancedMetrics) return [];
  const cutoff = Date.now() - plan.retentionDays * 86400000;
  return parseJson(value, []).filter(app => Date.parse(app.lastSeenAt) >= cutoff).map(app => {
    const daily = (Array.isArray(app.foregroundDailyUsage) ? app.foregroundDailyUsage : []).filter(day => Date.parse(day.date + 'T00:00:00Z') >= cutoff);
    return {
      ...app,
      foregroundDailyUsage: daily,
      foregroundDurationMilliseconds: daily.reduce((sum, day) => sum + (Number(day.durationMilliseconds) || 0), 0),
      foregroundOccurrences: daily.reduce((sum, day) => sum + (Number(day.occurrences) || 0), 0),
    };
  });
}

async function listarMaquinas(req, res, next) {
  try {
    const plan = await getUserPlan(req.user.id);
    const [rows] = await pool.execute(
      `SELECT id, name, status, user_name, os, arch, uptime, metrics, apps, last_seen, created_at, first_seen_at
       FROM machines WHERE user_id = ? ORDER BY created_at DESC`,
      [req.user.id],
    );
    const maquinas = rows.map(row => ({
      id: row.id,
      nome: row.name,
      sistema_operacional: row.os,
      status: row.status,
      usuario_id: row.user_name,
      arquitetura: row.arch,
      tempo_ligado: Number(row.uptime),
      metricas: parseJson(row.metrics),
      aplicativos: visibleApps(row.apps, plan),
      ultimo_sinal: row.last_seen,
      criado_em: row.created_at,
      primeiro_sinal: row.first_seen_at,
    }));
    res.json({ maquinas });
  } catch (error) { next(error); }
}

async function obterMaquina(req, res, next) {
  try {
    const plan = await getUserPlan(req.user.id);
    const [rows] = await pool.execute(
      'SELECT * FROM machines WHERE id = ? AND user_id = ? LIMIT 1',
      [req.params.id, req.user.id],
    );
    const machine = rows[0];
    if (!machine) return res.status(404).json({ message: 'Máquina não encontrada.' });
    delete machine.token;
    res.json({ maquina: { ...machine, metricas: parseJson(machine.metrics), aplicativos: visibleApps(machine.apps, plan) } });
  } catch (error) { next(error); }
}

async function obterDashboard(req, res, next) {
  try {
    const plan = await getUserPlan(req.user.id);
    const [machines] = await pool.execute('SELECT * FROM machines WHERE user_id = ? ORDER BY created_at DESC', [req.user.id]);
    const machineIds = machines.map(machine => machine.id);
    let events = [];
    let alerts = [];
    let webActivity = [];
    if (machineIds.length) {
      const placeholders = machineIds.map(() => '?').join(',');
      [events] = await pool.execute(`SELECT * FROM events WHERE machine_id IN (${placeholders}) AND occurred_at >= DATE_SUB(UTC_TIMESTAMP(3), INTERVAL ? DAY) ORDER BY occurred_at DESC LIMIT 100`, [...machineIds, plan.retentionDays]);
      if (plan.alerts) [alerts] = await pool.execute(`SELECT * FROM alerts WHERE machine_id IN (${placeholders}) AND is_open = TRUE AND occurred_at >= DATE_SUB(UTC_TIMESTAMP(3), INTERVAL ? DAY) ORDER BY occurred_at DESC LIMIT 100`, [...machineIds, plan.retentionDays]);
      [webActivity] = await pool.execute(`SELECT w.machine_id, m.name AS machine_name, w.domain, SUM(w.duration_seconds) AS duration_seconds, COUNT(*) AS visits, MAX(w.occurred_at) AS last_seen FROM web_activity w JOIN machines m ON m.id = w.machine_id WHERE m.user_id = ? AND w.occurred_at >= DATE_SUB(UTC_TIMESTAMP(3), INTERVAL ? DAY) GROUP BY w.machine_id, m.name, w.domain ORDER BY duration_seconds DESC LIMIT 200`, [req.user.id, plan.retentionDays]);
    }
    const online = machines.filter(machine => machine.status === 'online').length;
    const publicMachines = machines.map(machine => {
      delete machine.token;
      return { ...machine, name: machine.name, metrics: parseJson(machine.metrics), apps: visibleApps(machine.apps, plan) };
    });
    const summary = { total: machines.length, online, offline: machines.length - online, users: new Set(machines.filter(machine => machine.status === 'online').map(machine => machine.user_name).filter(Boolean)).size, alerts: alerts.length };
    res.json({ plan, usage: { computers: machines.length }, summary, resumo: { totalMaquinas: summary.total, online, offline: summary.offline, outros: 0 }, machines: publicMachines, maquinas: publicMachines, applications: [], events: events.map(event => ({ id: event.id, machineId: event.machine_id, machineName: event.machine_name, type: event.type, message: event.message, at: event.occurred_at })), alerts, webActivity: webActivity.map(item => ({ machineId: item.machine_id, machineName: item.machine_name, domain: item.domain, durationSeconds: Number(item.duration_seconds), visits: Number(item.visits), lastSeen: item.last_seen })) });
  } catch (error) { next(error); }
}

async function listarAtividades(req, res, next) {
  try {
    const plan = await getUserPlan(req.user.id);
    const [atividades] = await pool.execute(
      `SELECT e.id, e.machine_id AS maquina_id, e.machine_name AS maquina_nome, e.type AS tipo, e.message AS mensagem, e.occurred_at AS data
       FROM events e JOIN machines m ON m.id = e.machine_id
       WHERE m.user_id = ? AND e.occurred_at >= DATE_SUB(UTC_TIMESTAMP(3), INTERVAL ? DAY) ORDER BY e.occurred_at DESC LIMIT 500`,
      [req.user.id, plan.retentionDays],
    );
    res.json({ atividades });
  } catch (error) { next(error); }
}

async function listarRelatorios(req, res, next) {
  try {
    const plan = await getUserPlan(req.user.id);
    if (!plan.reports) return res.status(403).json({ error: 'Relatórios ficam disponíveis nos planos Pro e Business.' });
    const days = Math.min(plan.retentionDays, Math.max(1, Number(req.query.days) || 7));
    const [relatorios] = await pool.execute(
      `SELECT e.id, e.machine_id AS maquina_id, e.machine_name AS maquina_nome, e.type AS tipo, e.message AS titulo, e.occurred_at AS data
       FROM events e JOIN machines m ON m.id = e.machine_id
       WHERE m.user_id = ? AND e.occurred_at >= DATE_SUB(UTC_TIMESTAMP(3), INTERVAL ? DAY)
       ORDER BY e.occurred_at DESC LIMIT 500`,
      [req.user.id, days],
    );
    const [metricas] = await pool.execute(
      'SELECT s.sample_id, s.sampled_at, s.metrics, s.apps, m.id AS machine_id, m.name AS machine_name ' +
      'FROM metric_samples s JOIN machines m ON m.id = s.machine_id ' +
      'WHERE m.user_id = ? AND s.sampled_at >= DATE_SUB(UTC_TIMESTAMP(3), INTERVAL ? DAY) ' +
      'ORDER BY s.sampled_at DESC LIMIT 2000',
      [req.user.id, days],
    );
    res.json({ dias: days, retencaoMaxima: plan.retentionDays, relatorios, metricas: metricas.map(row => ({ id: row.sample_id, coletado_em: row.sampled_at, maquina_id: row.machine_id, maquina_nome: row.machine_name, metricas: parseJson(row.metrics), aplicativos: parseJson(row.apps, []) })) });
  } catch (error) { next(error); }
}

async function listarAlertas(req, res, next) {
  try {
    const plan = await getUserPlan(req.user.id);
    if (!plan.alerts) return res.json({ alertas: [] });
    const [alertas] = await pool.execute(
      `SELECT a.id, a.machine_id AS maquina_id, a.machine_name AS maquina_nome, a.kind AS tipo, a.message AS mensagem, a.occurred_at AS data, a.is_open AS aberto
       FROM alerts a JOIN machines m ON m.id = a.machine_id
       WHERE m.user_id = ? AND a.occurred_at >= DATE_SUB(UTC_TIMESTAMP(3), INTERVAL ? DAY) ORDER BY a.occurred_at DESC LIMIT 500`,
      [req.user.id, plan.retentionDays],
    );
    res.json({ alertas });
  } catch (error) { next(error); }
}

async function reconhecerAlerta(req, res, next) {
  try {
    const plan = await getUserPlan(req.user.id);
    if (!plan.alerts) return res.status(403).json({ error: 'Alertas ficam disponíveis nos planos Pro e Business.' });
    const [result] = await pool.execute(
      'UPDATE alerts a JOIN machines m ON m.id = a.machine_id SET a.is_open = FALSE WHERE a.id = ? AND m.user_id = ?',
      [req.params.id, req.user.id],
    );
    if (!result.affectedRows) return res.status(404).json({ message: 'Alerta não encontrado.' });
    res.json({ ok: true });
  } catch (error) { next(error); }
}

async function obterAssinatura(req, res, next) {
  try {
    const plan = await getUserPlan(req.user.id);
    const [rows] = await pool.execute(
      `SELECT s.plan, s.billing_cycle, s.status, s.started_at, s.updated_at,
              p.payment_method, p.amount_cents, p.currency, p.status AS payment_status,
              p.transaction_reference, p.card_brand, p.card_last4, p.plan AS payment_plan, p.created_at AS payment_created_at
       FROM subscriptions s
       LEFT JOIN payment_transactions p ON p.transaction_id = (
         SELECT recent.transaction_id FROM payment_transactions recent
         WHERE recent.user_id = s.user_id ORDER BY recent.created_at DESC LIMIT 1
       )
       WHERE s.user_id = ? LIMIT 1`,
      [req.user.id],
    );
    const row = rows[0];
    const [usageRows] = await pool.execute('SELECT COUNT(*) AS computers FROM machines WHERE user_id = ?', [req.user.id]);
    res.json({ limites: plan, uso: { computadores: Number(usageRows[0]?.computers || 0) }, assinatura: row ? {
      plan: row.plan,
      billing_cycle: row.billing_cycle,
      status: row.status,
      started_at: row.started_at,
      updated_at: row.updated_at,
      latest_payment: row.payment_method ? {
        method: row.payment_method,
        amount_cents: row.amount_cents,
        currency: row.currency,
        status: row.payment_status,
        reference: row.transaction_reference,
        plan: row.payment_plan,
        card_brand: row.card_brand,
        card_last4: row.card_last4,
        created_at: row.payment_created_at,
      } : null,
    } : { plan: 'Free', billing_cycle: 'monthly', status: 'active', started_at: null, updated_at: null, latest_payment: null } });
  } catch (error) { next(error); }
}

async function concluirPagamentoSimulado(req, res, next) {
  const allowedFields = new Set(['plan', 'billingCycle', 'paymentMethod', 'cardBrand', 'cardLast4']);
  if (Object.keys(req.body || {}).some(key => !allowedFields.has(key))) {
    return res.status(400).json({ error: 'Envie apenas os dados da simulação. Número completo, validade e CVV não são aceitos nem armazenados.' });
  }

  const body = req.body && typeof req.body === 'object' ? req.body : {};
  const { plan, billingCycle, paymentMethod, cardBrand = null, cardLast4 = null } = body;
  if (!['Pro', 'Business'].includes(plan) || !['monthly', 'annual'].includes(billingCycle)) {
    return res.status(400).json({ error: 'Plano ou ciclo de cobrança inválido.' });
  }
  if (!['pix', 'credit_card', 'debit_card'].includes(paymentMethod)) {
    return res.status(400).json({ error: 'Forma de pagamento inválida.' });
  }
  if (paymentMethod === 'pix' && (cardBrand !== null || cardLast4 !== null)) {
    return res.status(400).json({ error: 'PIX não deve incluir dados de cartão.' });
  }
  if (paymentMethod !== 'pix' && (!['Visa', 'Mastercard', 'American Express', 'Elo', 'Discover', 'Outro'].includes(cardBrand) || !/^\d{4}$/.test(String(cardLast4)))) {
    return res.status(400).json({ error: 'Para simular cartão, informe somente a bandeira e os quatro últimos dígitos.' });
  }

  const prices = { Pro: { monthly: 4900, annual: 46800 }, Business: { monthly: 14900, annual: 142800 } };
  const amountCents = prices[plan][billingCycle];
  const now = new Date();
  const transactionId = crypto.randomUUID();
  const reference = `ARG-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(5).toString('hex').toUpperCase()}`;
  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();
    await connection.execute(
      `INSERT INTO payment_transactions
         (transaction_id, user_id, plan, billing_cycle, payment_method, amount_cents, currency, status, transaction_reference, card_brand, card_last4, created_at)
       VALUES (?, ?, ?, ?, ?, ?, 'BRL', 'approved', ?, ?, ?, ?)`,
      [transactionId, req.user.id, plan, billingCycle, paymentMethod, amountCents, reference, cardBrand, cardLast4, now],
    );
    await connection.execute(
      `INSERT INTO subscriptions (user_id, plan, billing_cycle, status, started_at, updated_at)
       VALUES (?, ?, ?, 'active', ?, ?)
       ON DUPLICATE KEY UPDATE plan = VALUES(plan), billing_cycle = VALUES(billing_cycle), status = 'active', updated_at = VALUES(updated_at)`,
      [req.user.id, plan, billingCycle, now, now],
    );
    await connection.commit();
    const payment = {
      plan,
      method: paymentMethod,
      amount_cents: amountCents,
      currency: 'BRL',
      status: 'approved',
      reference,
      card_brand: cardBrand,
      card_last4: cardLast4,
      created_at: now,
      simulated: true,
    };
    res.status(201).json({
      assinatura: { plan, billing_cycle: billingCycle, status: 'active', started_at: now, updated_at: now, latest_payment: payment },
      pagamento: payment,
      limites: getPlanEntitlements(plan),
      uso: await getComputerUsage(req.user.id),
    });
  } catch (error) {
    if (connection) await connection.rollback().catch(() => {});
    next(error);
  } finally {
    connection?.release();
  }
}

async function salvarAssinatura(req, res, next) {
  const plan = String(req.body.plan || '');
  const billingCycle = String(req.body.billingCycle || 'monthly');
  if (!['Free', 'Pro', 'Business'].includes(plan) || !['monthly', 'annual'].includes(billingCycle)) {
    return res.status(400).json({ error: 'Plano ou ciclo de cobrança inválido.' });
  }
  if (plan !== 'Free') {
    return res.status(409).json({ error: 'Planos pagos precisam ser confirmados pelo checkout simulado.' });
  }
  try {
    const now = new Date();
    await pool.execute(
      `INSERT INTO subscriptions (user_id, plan, billing_cycle, status, started_at, updated_at)
       VALUES (?, ?, ?, 'active', ?, ?)
       ON DUPLICATE KEY UPDATE plan = VALUES(plan), billing_cycle = VALUES(billing_cycle), status = 'active', updated_at = VALUES(updated_at)`,
      [req.user.id, plan, billingCycle, now, now],
    );
    res.json({ assinatura: { plan, billing_cycle: billingCycle, status: 'active', started_at: now, updated_at: now, simulated: true }, limites: getPlanEntitlements(plan), uso: await getComputerUsage(req.user.id) });
  } catch (error) { next(error); }
}

async function listarNotificacoes(req, res, next) {
  try {
    const plan = await getUserPlan(req.user.id);
    const alertQuery = plan.alerts ? `
         SELECT a.id, 'alert' AS category, a.kind AS type, a.message, a.machine_name, a.occurred_at AS created_at, a.is_open AS active
         FROM alerts a JOIN machines m ON m.id = a.machine_id WHERE m.user_id = ? AND a.occurred_at >= DATE_SUB(UTC_TIMESTAMP(3), INTERVAL ? DAY)
         UNION ALL` : '';
    const queryValues = plan.alerts ? [req.user.id, plan.retentionDays, req.user.id] : [req.user.id];
    const [notificacoes] = await pool.execute(
      `SELECT * FROM (
         ${alertQuery}
         SELECT e.id, 'event' AS category, e.type, e.message, e.machine_name, e.occurred_at AS created_at, TRUE AS active
         FROM events e JOIN machines m ON m.id = e.machine_id WHERE m.user_id = ? AND e.occurred_at >= DATE_SUB(UTC_TIMESTAMP(3), INTERVAL ? DAY)
       ) AS platform_notifications
       ORDER BY created_at DESC LIMIT 100`,
      [...queryValues, plan.retentionDays],
    );
    res.json({ notificacoes: notificacoes.map(item => ({ ...item, active: Boolean(item.active), source: 'Platform' })) });
  } catch (error) { next(error); }
}

module.exports = { listarMaquinas, obterMaquina, obterDashboard, listarAtividades, listarRelatorios, listarAlertas, reconhecerAlerta, obterAssinatura, salvarAssinatura, concluirPagamentoSimulado, listarNotificacoes };
