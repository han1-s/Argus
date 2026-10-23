'use strict';

const PLANS = Object.freeze({
  Free: Object.freeze({ computers: 10, retentionDays: 7, reports: false, alerts: false, advancedMetrics: false }),
  Pro: Object.freeze({ computers: 50, retentionDays: 90, reports: true, alerts: true, advancedMetrics: true }),
  Business: Object.freeze({ computers: null, retentionDays: 365, reports: true, alerts: true, advancedMetrics: true }),
});

function getPlanEntitlements(plan) {
  const name = Object.hasOwn(PLANS, plan) ? plan : 'Free';
  return { name, ...PLANS[name] };
}

module.exports = { PLANS, getPlanEntitlements };
