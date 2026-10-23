'use strict';

const express = require('express');
const crypto = require('crypto');
const mysqlStore = require('../database/mysql');
const { getPlanEntitlements } = require('../shared/plans');

const PRICES = { Pro: { monthly: 4900, annual: 46800 }, Business: { monthly: 14900, annual: 142800 } };

function createPlanRouter({ auth, countMachines }) {
  const router = express.Router();

  router.get('/assinatura', auth, async (req, res, next) => {
    try {
      const assinatura = await mysqlStore.getSubscription(req.user.id);
      res.json({ assinatura, limites: getPlanEntitlements(assinatura.plan), uso: { computadores: countMachines(req.user.id) } });
    } catch (error) { next(error); }
  });

  router.put('/assinatura', auth, async (req, res, next) => {
    try {
      const plan = String(req.body.plan || '');
      const billingCycle = String(req.body.billingCycle || 'monthly');
      if (plan !== 'Free' || !['monthly', 'annual'].includes(billingCycle)) return res.status(409).json({ error: 'Planos pagos precisam ser confirmados pelo checkout simulado.' });
      const assinatura = await mysqlStore.setFreeSubscription(req.user.id, billingCycle);
      res.json({ assinatura, limites: getPlanEntitlements(assinatura.plan), uso: { computadores: countMachines(req.user.id) } });
    } catch (error) { next(error); }
  });

  router.post('/assinatura/pagamentos-simulados', auth, async (req, res, next) => {
    const allowedFields = new Set(['plan', 'billingCycle', 'paymentMethod', 'cardBrand', 'cardLast4']);
    if (Object.keys(req.body || {}).some(key => !allowedFields.has(key))) return res.status(400).json({ error: 'Envie somente os dados resumidos da simulação; dados completos de cartão não são aceitos.' });
    const { plan, billingCycle, paymentMethod, cardBrand = null, cardLast4 = null } = req.body || {};
    if (!Object.hasOwn(PRICES, plan) || !['monthly', 'annual'].includes(billingCycle)) return res.status(400).json({ error: 'Plano ou ciclo de cobrança inválido.' });
    if (!['pix', 'credit_card', 'debit_card'].includes(paymentMethod)) return res.status(400).json({ error: 'Forma de pagamento inválida.' });
    if (paymentMethod === 'pix' && (cardBrand !== null || cardLast4 !== null)) return res.status(400).json({ error: 'PIX não deve incluir dados de cartão.' });
    if (paymentMethod !== 'pix' && (!['Visa', 'Mastercard', 'American Express', 'Elo', 'Discover', 'Outro'].includes(cardBrand) || !/^\d{4}$/.test(String(cardLast4)))) return res.status(400).json({ error: 'Para simular cartão, informe somente a bandeira e os quatro últimos dígitos.' });

    try {
      const now = new Date();
      const amountCents = PRICES[plan][billingCycle];
      const reference = 'ARG-' + Date.now().toString(36).toUpperCase() + '-' + crypto.randomBytes(5).toString('hex').toUpperCase();
      const assinatura = await mysqlStore.saveSimulatedPayment(req.user.id, {
        plan, billingCycle, paymentMethod, cardBrand, cardLast4, amountCents,
        transactionId: crypto.randomUUID(), reference, now,
      });
      const pagamento = { plan, method: paymentMethod, amount_cents: amountCents, currency: 'BRL', status: 'approved', reference, card_brand: cardBrand, card_last4: cardLast4, created_at: now, simulated: true };
      res.status(201).json({ assinatura, pagamento, limites: getPlanEntitlements(plan), uso: { computadores: countMachines(req.user.id) } });
    } catch (error) { next(error); }
  });

  return router;
}

module.exports = { createPlanRouter };
