import type { BillingCycle, PlanType } from '../types';

export interface ArgusSubscription {
  plan: PlanType;
  billing_cycle: BillingCycle;
  status: 'active' | 'canceled';
  started_at: string | null;
  updated_at: string | null;
  latest_payment?: ArgusPayment | null;
  limits?: ArgusPlanLimits;
  usage?: { computers: number };
}

export interface ArgusPlanLimits {
  name: PlanType;
  computers: number | null;
  retentionDays: number;
  reports: boolean;
  alerts: boolean;
  advancedMetrics: boolean;
}

export interface ArgusPayment {
  plan: Exclude<PlanType, 'Free'>;
  method: 'pix' | 'credit_card' | 'debit_card';
  amount_cents: number;
  currency: string;
  status: 'approved';
  reference: string;
  card_brand: string | null;
  card_last4: string | null;
  created_at: string;
  simulated?: boolean;
}

export interface ArgusCardSummary {
  cardBrand: string;
  cardLast4: string;
}

export interface ArgusCheckoutResult {
  assinatura: ArgusSubscription;
  pagamento: ArgusPayment;
}

export interface PlatformNotification {
  id: string;
  category: 'alert' | 'event';
  type: string;
  message: string;
  machine_name: string;
  created_at: string;
  active: boolean;
  source: 'Platform';
}

async function request<T>(route: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(route, {
    ...options,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...options.headers },
  });
  const result = await response.json().catch(() => ({})) as T & { error?: string };
  if (!response.ok) throw new Error(result.error || 'Não foi possível carregar os dados do ARGUS.');
  return result;
}

export async function getArgusSubscription(): Promise<ArgusSubscription> {
  const result = await request<{ assinatura: ArgusSubscription; limites?: ArgusPlanLimits; uso?: { computadores: number } }>('/api/assinatura');
  return { ...result.assinatura, limits: result.limites, usage: { computers: result.uso?.computadores ?? 0 } };
}

export async function saveArgusSubscription(plan: PlanType, billingCycle: BillingCycle): Promise<ArgusSubscription> {
  const result = await request<{ assinatura: ArgusSubscription; limites?: ArgusPlanLimits; uso?: { computadores: number } }>('/api/assinatura', {
    method: 'PUT',
    body: JSON.stringify({ plan, billingCycle }),
  });
  return { ...result.assinatura, limits: result.limites, usage: { computers: result.uso?.computadores ?? 0 } };
}

export async function completeArgusCheckout(
  plan: Exclude<PlanType, 'Free'>,
  billingCycle: BillingCycle,
  paymentMethod: ArgusPayment['method'],
  cardSummary?: ArgusCardSummary,
): Promise<ArgusCheckoutResult> {
  const result = await request<ArgusCheckoutResult & { limites?: ArgusPlanLimits; uso?: { computadores: number } }>('/api/assinatura/pagamentos-simulados', {
    method: 'POST',
    body: JSON.stringify({
      plan,
      billingCycle,
      paymentMethod,
      ...(cardSummary || {}),
    }),
  });
  return { ...result, assinatura: { ...result.assinatura, limits: result.limites, usage: { computers: result.uso?.computadores ?? 0 } } };
}

export async function getPlatformNotifications(): Promise<PlatformNotification[]> {
  const result = await request<{ notificacoes: PlatformNotification[] }>('/api/notificacoes');
  return result.notificacoes;
}
