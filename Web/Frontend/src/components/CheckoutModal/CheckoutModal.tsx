import React, { useEffect, useRef, useState } from 'react';
import { CheckCircle2, Copy, CreditCard, QrCode, ShieldCheck, X } from 'lucide-react';
import type { BillingCycle, PaymentMethod, PlanType } from '../../types';
import { completeArgusCheckout, type ArgusPayment, type ArgusSubscription } from '../../services/argusWebApi';

interface CheckoutModalProps {
  isOpen: boolean;
  planName: PlanType | null;
  cycle: BillingCycle;
  onClose: () => void;
  onPlanSaved: (subscription: ArgusSubscription, payment: ArgusPayment) => void;
}

const prices: Record<Exclude<PlanType, 'Free'>, { monthly: number; annual: number }> = {
  Pro: { monthly: 49, annual: 39 },
  Business: { monthly: 149, annual: 119 },
};

function getCardBrand(number: string) {
  if (/^4/.test(number)) return 'Visa';
  if (/^(5[1-5]|2[2-7])/.test(number)) return 'Mastercard';
  if (/^3[47]/.test(number)) return 'American Express';
  if (/^(4011|4312|4389|4514|4576|5041|5067|5090|6277|6362|6504)/.test(number)) return 'Elo';
  if (/^(6011|65|64[4-9])/.test(number)) return 'Discover';
  return 'Outro';
}

function passesLuhn(number: string) {
  let sum = 0;
  let double = false;
  for (let index = number.length - 1; index >= 0; index -= 1) {
    let digit = Number(number[index]);
    if (double) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    double = !double;
  }
  return sum % 10 === 0;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({ isOpen, planName, cycle, onClose, onPlanSaved }) => {
  const [method, setMethod] = useState<PaymentMethod>('pix');
  const [copied, setCopied] = useState(false);
  const [completed, setCompleted] = useState<ArgusPayment | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const cardFormRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !planName || planName === 'Free') return null;
  const price = prices[planName][cycle];
  const cycleLabel = cycle === 'annual' ? 'Anual (equivalente mensal)' : 'Mensal';
  const pixKey = `ARGUS-${planName.toUpperCase()}-PIX-DEMO`;

  const copyPix = async () => {
    try {
      await navigator.clipboard.writeText(pixKey);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      setCopied(false);
    }
  };

  const savePayment = async (paymentMethod: PaymentMethod, cardSummary?: { cardBrand: string; cardLast4: string }) => {
    if (saving) return;
    setSaving(true);
    setSaveError('');
    try {
      const result = await completeArgusCheckout(planName, cycle, paymentMethod, cardSummary);
      cardFormRef.current?.reset();
      onPlanSaved(result.assinatura, result.pagamento);
      setCompleted(result.pagamento);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Não foi possível registrar a simulação.');
    } finally {
      setSaving(false);
    }
  };

  const submitCard = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    const cardNumber = String(values.get('card-number') || '').replace(/\D/g, '');
    const expiry = String(values.get('expiry') || '');
    const cvv = String(values.get('cvv') || '').replace(/\D/g, '');
    const [monthText, yearText] = expiry.split('/');
    const month = Number(monthText);
    const year = Number(`20${yearText}`);
    const now = new Date();
    if (cardNumber.length < 13 || cardNumber.length > 19 || !passesLuhn(cardNumber)) {
      setSaveError('Informe um número de demonstração válido. Não use dados de um cartão real.');
      return;
    }
    if (!/^\d{2}\/\d{2}$/.test(expiry) || month < 1 || month > 12 || year < now.getFullYear() || (year === now.getFullYear() && month < now.getMonth() + 1)) {
      setSaveError('Informe uma validade de demonstração futura no formato MM/AA.');
      return;
    }
    if (![3, 4].includes(cvv.length)) {
      setSaveError('O CVV de demonstração precisa ter três ou quatro dígitos.');
      return;
    }

    // Never send the full card number, expiry, cardholder name, or CVV to the backend.
    void savePayment(method, { cardBrand: getCardBrand(cardNumber), cardLast4: cardNumber.slice(-4) });
  };

  const methodLabel = (value: ArgusPayment['method']) => ({ pix: 'PIX', credit_card: 'Cartão de crédito', debit_card: 'Cartão de débito' })[value];

  return (
    <div className="modal-overlay active monetization-modal-overlay" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="modal-card monetization-modal" role="dialog" aria-modal="true" aria-labelledby="checkout-title">
        <button className="modal-close" type="button" onClick={onClose} aria-label="Fechar checkout"><X size={20} /></button>
        {completed ? <div className="checkout-success">
          <span><CheckCircle2 size={30} /></span>
          <p className="section-label">SIMULAÇÃO CONCLUÍDA</p>
          <h2 id="checkout-title">Plano registrado</h2>
          <p>O plano {planName} e o pagamento simulado por {methodLabel(completed.method)} foram salvos no banco ARGUS.</p>
          <p className="checkout-reference">Referência: <code>{completed.reference}</code></p>
          <p>Nenhuma cobrança real foi feita. Dados completos de cartão não são enviados nem armazenados.</p>
          <button className="btn btn-primary" type="button" onClick={onClose}>Concluir</button>
        </div> : <>
          <div className="checkout-heading"><span className="checkout-kicker"><ShieldCheck size={15} /> CHECKOUT DEMONSTRATIVO</span><h2 id="checkout-title">Resumo da contratação</h2><p>Escolha uma forma de pagamento fictícia para registrar a demonstração.</p></div>
          <div className="checkout-summary"><div><span>Plano selecionado</span><strong>{planName}</strong></div><div><span>Período</span><strong>{cycleLabel}</strong></div><div className="checkout-total"><span>{cycle === 'annual' ? 'Total anual demonstrativo' : 'Valor demonstrativo'}</span><strong>R$ {new Intl.NumberFormat('pt-BR').format(cycle === 'annual' ? price * 12 : price)}<small> / {cycle === 'annual' ? 'ano' : 'mês'}</small></strong></div>{cycle === 'annual' && <p className="checkout-annual-note">Equivalente mensal de R$ {new Intl.NumberFormat('pt-BR').format(price)}. Nenhuma cobrança será realizada.</p>}</div>
          <div className="checkout-tabs" role="tablist" aria-label="Forma de pagamento simulada">
            <button type="button" role="tab" aria-selected={method === 'pix'} className={method === 'pix' ? 'active' : ''} onClick={() => { setMethod('pix'); setSaveError(''); }}><QrCode size={16} /> PIX</button>
            <button type="button" role="tab" aria-selected={method === 'credit_card'} className={method === 'credit_card' ? 'active' : ''} onClick={() => { setMethod('credit_card'); setSaveError(''); }}><CreditCard size={16} /> Crédito</button>
            <button type="button" role="tab" aria-selected={method === 'debit_card'} className={method === 'debit_card' ? 'active' : ''} onClick={() => { setMethod('debit_card'); setSaveError(''); }}><CreditCard size={16} /> Débito</button>
          </div>
          {method === 'pix' ? <div className="checkout-payment-panel"><div className="pix-demo-mark"><QrCode size={42} /></div><strong className="pix-demo-title">PIX DE DEMONSTRAÇÃO</strong><p>Chave fictícia, sem vínculo com uma conta financeira.</p><div className="pix-key-field"><code>{pixKey}</code><button type="button" onClick={() => void copyPix()} aria-label="Copiar chave PIX fictícia"><Copy size={15} /> {copied ? 'Copiada' : 'Copiar'}</button></div><button className="btn btn-primary btn-block" type="button" disabled={saving} onClick={() => void savePayment('pix')}>{saving ? 'Registrando...' : 'Simular pagamento PIX'}</button></div> : <form ref={cardFormRef} className="checkout-card-form" onSubmit={submitCard} autoComplete="off"><label>Número de demonstração<input name="card-number" inputMode="numeric" placeholder="4242 4242 4242 4242" required maxLength={23} autoComplete="off" /></label><label>Nome (não será armazenado)<input name="cardholder" placeholder="Nome fictício" required autoComplete="off" /></label><div className="checkout-form-row"><label>Validade<input name="expiry" inputMode="numeric" placeholder="MM/AA" required maxLength={5} autoComplete="off" /></label><label>CVV (não será armazenado)<input name="cvv" inputMode="numeric" placeholder="123" required maxLength={4} autoComplete="off" /></label></div><button className="btn btn-primary btn-block" type="submit" disabled={saving}>{saving ? 'Registrando...' : `Simular pagamento no ${method === 'credit_card' ? 'crédito' : 'débito'}`}</button><p className="checkout-form-note">Use apenas dados fictícios. Número completo, nome, validade e CVV permanecem no navegador e não são enviados ao servidor.</p></form>}
          {saveError && <p className="argus-auth-error" role="alert">{saveError}</p>}
          <p className="checkout-simulation-notice"><ShieldCheck size={15} /> Pagamento simulado — nenhuma cobrança real será realizada.</p>
        </>}
      </section>
    </div>
  );
};
