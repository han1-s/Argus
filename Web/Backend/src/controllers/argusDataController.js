const pool = require('../config/database');

function parseJson(value, fallback = {}) {
  if (typeof value !== 'string') return value || fallback;
  try { return JSON.parse(value); } catch { return fallback; }
}

async function listarMaquinas(req, res, next) {
  try {
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
      aplicativos: parseJson(row.apps, []),
      ultimo_sinal: row.last_seen,
      criado_em: row.created_at,
      primeiro_sinal: row.first_seen_at,
    }));
    res.json({ maquinas });
  } catch (error) { next(error); }
}

async function obterMaquina(req, res, next) {
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM machines WHERE id = ? AND user_id = ? LIMIT 1',
      [req.params.id, req.user.id],
    );
    const machine = rows[0];
    if (!machine) return res.status(404).json({ message: 'Máquina não encontrada.' });
    delete machine.token;
    res.json({ maquina: { ...machine, metricas: parseJson(machine.metrics), aplicativos: parseJson(machine.apps, []) } });
  } catch (error) { next(error); }
}

async function obterDashboard(req, res, next) {
  try {
    const [machines] = await pool.execute('SELECT * FROM machines WHERE user_id = ? ORDER BY created_at DESC', [req.user.id]);
    const machineIds = machines.map(machine => machine.id);
    let events = [];
    let alerts = [];
    let webActivity = [];
    if (machineIds.length) {
      const placeholders = machineIds.map(() => '?').join(',');
      [events] = await pool.execute(`SELECT * FROM events WHERE machine_id IN (${placeholders}) ORDER BY occurred_at DESC LIMIT 100`, machineIds);
      [alerts] = await pool.execute(`SELECT * FROM alerts WHERE machine_id IN (${placeholders}) AND is_open = TRUE ORDER BY occurred_at DESC LIMIT 100`, machineIds);
      [webActivity] = await pool.execute(`SELECT w.machine_id, m.name AS machine_name, w.domain, SUM(w.duration_seconds) AS duration_seconds, COUNT(*) AS visits, MAX(w.occurred_at) AS last_seen FROM web_activity w JOIN machines m ON m.id = w.machine_id WHERE m.user_id = ? AND w.occurred_at >= DATE_SUB(UTC_TIMESTAMP(3), INTERVAL 30 DAY) GROUP BY w.machine_id, m.name, w.domain ORDER BY duration_seconds DESC LIMIT 200`, [req.user.id]);
    }
    const online = machines.filter(machine => machine.status === 'online').length;
    const publicMachines = machines.map(machine => {
      delete machine.token;
      return { ...machine, name: machine.name, metrics: parseJson(machine.metrics), apps: parseJson(machine.apps, []) };
    });
    const summary = { total: machines.length, online, offline: machines.length - online, users: new Set(machines.filter(machine => machine.status === 'online').map(machine => machine.user_name).filter(Boolean)).size, alerts: alerts.length };
    res.json({ summary, resumo: { totalMaquinas: summary.total, online, offline: summary.offline, outros: 0 }, machines: publicMachines, maquinas: publicMachines, applications: [], events: events.map(event => ({ id: event.id, machineId: event.machine_id, machineName: event.machine_name, type: event.type, message: event.message, at: event.occurred_at })), alerts, webActivity: webActivity.map(item => ({ machineId: item.machine_id, machineName: item.machine_name, domain: item.domain, durationSeconds: Number(item.duration_seconds), visits: Number(item.visits), lastSeen: item.last_seen })) });
  } catch (error) { next(error); }
}

async function listarAtividades(req, res, next) {
  try {
    const [atividades] = await pool.execute(
      `SELECT e.id, e.machine_id AS maquina_id, e.machine_name AS maquina_nome, e.type AS tipo, e.message AS mensagem, e.occurred_at AS data
       FROM events e JOIN machines m ON m.id = e.machine_id
       WHERE m.user_id = ? ORDER BY e.occurred_at DESC LIMIT 500`,
      [req.user.id],
    );
    res.json({ atividades });
  } catch (error) { next(error); }
}

async function listarRelatorios(req, res, next) {
  try {
    const days = Math.min(30, Math.max(1, Number(req.query.days) || 7));
    const [relatorios] = await pool.execute(
      `SELECT e.id, e.machine_id AS maquina_id, e.machine_name AS maquina_nome, e.type AS tipo, e.message AS titulo, e.occurred_at AS data
       FROM events e JOIN machines m ON m.id = e.machine_id
       WHERE m.user_id = ? AND e.occurred_at >= DATE_SUB(UTC_TIMESTAMP(3), INTERVAL ? DAY)
       ORDER BY e.occurred_at DESC LIMIT 500`,
      [req.user.id, days],
    );
    res.json({ dias: days, relatorios });
  } catch (error) { next(error); }
}

async function listarAlertas(req, res, next) {
  try {
    const [alertas] = await pool.execute(
      `SELECT a.id, a.machine_id AS maquina_id, a.machine_name AS maquina_nome, a.kind AS tipo, a.message AS mensagem, a.occurred_at AS data, a.is_open AS aberto
       FROM alerts a JOIN machines m ON m.id = a.machine_id
       WHERE m.user_id = ? ORDER BY a.occurred_at DESC LIMIT 500`,
      [req.user.id],
    );
    res.json({ alertas });
  } catch (error) { next(error); }
}

async function reconhecerAlerta(req, res, next) {
  try {
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
    const [rows] = await pool.execute('SELECT plan, billing_cycle, status, started_at, updated_at FROM subscriptions WHERE user_id = ? LIMIT 1', [req.user.id]);
    res.json({ assinatura: rows[0] ? { ...rows[0], plan: rows[0].plan } : { plan: 'Free', billing_cycle: 'monthly', status: 'active', started_at: null, updated_at: null } });
  } catch (error) { next(error); }
}

async function salvarAssinatura(req, res, next) {
  const plan = String(req.body.plan || '');
  const billingCycle = String(req.body.billingCycle || 'monthly');
  if (!['Free', 'Pro', 'Business'].includes(plan) || !['monthly', 'annual'].includes(billingCycle)) {
    return res.status(400).json({ error: 'Plano ou ciclo de cobrança inválido.' });
  }
  try {
    const now = new Date();
    await pool.execute(
      `INSERT INTO subscriptions (user_id, plan, billing_cycle, status, started_at, updated_at)
       VALUES (?, ?, ?, 'active', ?, ?)
       ON DUPLICATE KEY UPDATE plan = VALUES(plan), billing_cycle = VALUES(billing_cycle), status = 'active', updated_at = VALUES(updated_at)`,
      [req.user.id, plan, billingCycle, now, now],
    );
    res.json({ assinatura: { plan, billing_cycle: billingCycle, status: 'active', started_at: now, updated_at: now, simulated: true } });
  } catch (error) { next(error); }
}

async function listarNotificacoes(req, res, next) {
  try {
    const [notificacoes] = await pool.execute(
      `SELECT * FROM (
         SELECT a.id, 'alert' AS category, a.kind AS type, a.message, a.machine_name, a.occurred_at AS created_at, a.is_open AS active
         FROM alerts a JOIN machines m ON m.id = a.machine_id WHERE m.user_id = ?
         UNION ALL
         SELECT e.id, 'event' AS category, e.type, e.message, e.machine_name, e.occurred_at AS created_at, TRUE AS active
         FROM events e JOIN machines m ON m.id = e.machine_id WHERE m.user_id = ?
       ) AS platform_notifications
       ORDER BY created_at DESC LIMIT 100`,
      [req.user.id, req.user.id],
    );
    res.json({ notificacoes: notificacoes.map(item => ({ ...item, active: Boolean(item.active), source: 'Platform' })) });
  } catch (error) { next(error); }
}

module.exports = { listarMaquinas, obterMaquina, obterDashboard, listarAtividades, listarRelatorios, listarAlertas, reconhecerAlerta, obterAssinatura, salvarAssinatura, listarNotificacoes };