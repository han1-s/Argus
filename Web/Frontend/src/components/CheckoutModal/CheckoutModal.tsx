import React, { useEffect, useState } from 'react';
import { CheckCircle2, Copy, CreditCard, QrCode, ShieldCheck, X } from 'lucide-react';
import type { BillingCycle, PaymentMethod, PlanType } from '../../types';

interface CheckoutModalProps {
  isOpen: boolean;
  planName: PlanType | null;
  cycle: BillingCycle;
  onClose: () => void;
}

const prices: Record<Exclude<PlanType, 'Free'>, { monthly: number; annual: number }> = {
  Pro: { monthly: 49, annual: 39 },
  Business: { monthly: 149, annual: 119 },
};

export const CheckoutModal: React.FC<CheckoutModalProps> = ({ isOpen, planName, cycle, onClose }) => {
  const [method, setMethod] = useState<PaymentMethod>('pix');
  const [copied, setCopied] = useState(false);
  const [completed, setCompleted] = useState(false);

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

  const completeDemo = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setCompleted(true);
  };

  return (
    <div className="modal-overlay monetization-modal-overlay" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="modal-card monetization-modal" role="dialog" aria-modal="true" aria-labelledby="checkout-title">
        <button className="modal-close" type="button" onClick={onClose} aria-label="Fechar checkout"><X size={20} /></button>
        {completed ? <div className="checkout-success"><span><CheckCircle2 size={30} /></span><p className="section-label">DEMONSTRAÇÃO CONCLUÍDA</p><h2 id="checkout-title">Contratação simulada</h2><p>A etapa demonstrativa do plano {planName} foi concluída. Nenhum pagamento foi processado e nenhuma cobrança será realizada.</p><button className="btn btn-primary" type="button" onClick={onClose}>Concluir</button></div> : <>
          <div className="checkout-heading"><span className="checkout-kicker"><ShieldCheck size={15} /> CHECKOUT DEMONSTRATIVO</span><h2 id="checkout-title">Resumo da contratação</h2><p>Revise os dados ilustrativos antes de continuar.</p></div>
          <div className="checkout-summary"><div><span>Plano selecionado</span><strong>{planName}</strong></div><div><span>Período</span><strong>{cycleLabel}</strong></div><div className="checkout-total"><span>{cycle === 'annual' ? 'Equivalente mensal' : 'Valor demonstrativo'}</span><strong>R$ {new Intl.NumberFormat('pt-BR').format(price)}<small> / mês</small></strong></div>{cycle === 'annual' && <p className="checkout-annual-note">Equivalente demonstrativo de R$ {new Intl.NumberFormat('pt-BR').format(price * 12)} por ano. Nenhuma cobrança será realizada.</p>}</div>
          <div className="checkout-tabs" role="tablist" aria-label="Forma de pagamento ilustrativa">
            <button type="button" role="tab" aria-selected={method === 'pix'} className={method === 'pix' ? 'active' : ''} onClick={() => setMethod('pix')}><QrCode size={16} /> PIX</button>
            <button type="button" role="tab" aria-selected={method === 'card'} className={method === 'card' ? 'active' : ''} onClick={() => setMethod('card')}><CreditCard size={16} /> Cartão</button>
          </div>
          {method === 'pix' ? <div className="checkout-payment-panel"><div className="pix-demo-mark"><QrCode size={42} /></div><strong className="pix-demo-title">PIX DE DEMONSTRAÇÃO</strong><p>Chave fictícia, sem vínculo com uma conta financeira.</p><div className="pix-key-field"><code>{pixKey}</code><button type="button" onClick={() => void copyPix()} aria-label="Copiar chave PIX fictícia"><Copy size={15} /> {copied ? 'Copiada' : 'Copiar'}</button></div><button className="btn btn-primary btn-block" type="button" onClick={() => setCompleted(true)}>Simular confirmação</button></div> : <form className="checkout-card-form" onSubmit={completeDemo} autoComplete="off"><label>Número do cartão<input inputMode="numeric" placeholder="0000 0000 0000 0000" required maxLength={23} /></label><label>Nome impresso no cartão<input placeholder="Nome para demonstração" required /></label><div className="checkout-form-row"><label>Validade<input inputMode="numeric" placeholder="MM/AA" required maxLength={5} /></label><label>CVV<input inputMode="numeric" placeholder="123" required maxLength={4} /></label></div><button className="btn btn-primary btn-block" type="submit">Simular contratação</button><p className="checkout-form-note">Os campos são apenas visuais; não digite dados reais.</p></form>}
          <p className="checkout-simulation-notice"><ShieldCheck size={15} /> Pagamento simulado — nenhuma cobrança será realizada.</p>
        </>}
      </section>
    </div>
  );
};
