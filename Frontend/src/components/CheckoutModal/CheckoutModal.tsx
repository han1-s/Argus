import React, { useState } from 'react';
import { X, QrCode, Copy, CreditCard, ShieldCheck } from 'lucide-react';
import type { PlanType, PaymentMethod } from '../../types';

interface CheckoutModalProps { isOpen: boolean; planName: PlanType | null; onClose: () => void; onComplete: () => void; }

export const CheckoutModal: React.FC<CheckoutModalProps> = ({ isOpen, planName, onClose, onComplete }) => {
  const [method, setMethod] = useState<PaymentMethod>('pix');
  const [copied, setCopied] = useState(false);
  const [completed, setCompleted] = useState(false);
  if (!isOpen || !planName) return null;
  const handleCopyPix = () => { void navigator.clipboard?.writeText(`ARGUS-${planName}-PIX-DEMO`); setCopied(true); window.setTimeout(() => setCopied(false), 2000); };
  const markCompleted = () => { setCompleted(true); onComplete(); };
  const handlePayment = (event: React.FormEvent<HTMLFormElement>) => { event.preventDefault(); markCompleted(); };
  return <div className="modal-overlay" onClick={onClose}>
    <div className="modal-card" role="dialog" aria-modal="true" aria-labelledby="checkout-title" onClick={(event) => event.stopPropagation()}>
      <button className="modal-close" onClick={onClose} aria-label="Fechar"><X size={20} /></button>
      <div className="modal-header"><span className="badge-tag"><ShieldCheck size={14} /> Checkout demonstrativo</span><h2 id="checkout-title">{completed ? 'Pagamento simulado com sucesso' : <>Confirmar assinatura <span>{planName}</span></>}</h2></div>
      <div className="payment-tabs">
        <button type="button" className={`tab-btn ${method === 'pix' ? 'active' : ''}`} onClick={() => setMethod('pix')}>PIX</button>
        <button type="button" className={`tab-btn ${method === 'card' ? 'active' : ''}`} onClick={() => setMethod('card')}><CreditCard size={16} /> Cartão de crédito</button>
        <button type="button" className={`tab-btn ${method === 'boleto' ? 'active' : ''}`} onClick={() => setMethod('boleto')}>Boleto</button>
      </div>
      {method === 'pix' ? <div className="payment-panel active"><div className="pix-box"><div className="qr-placeholder"><QrCode size={120} /></div><p>{completed ? 'A confirmação foi simulada; nenhum pagamento real foi realizado.' : 'Use a chave fictícia ou confirme a simulação para demonstrar a assinatura.'}</p><div className="checkout-actions"><button className="btn btn-secondary" onClick={handleCopyPix} disabled={completed}><Copy size={16} /> {copied ? 'Copiado!' : 'Copiar chave PIX'}</button><button className="btn btn-primary" onClick={markCompleted} disabled={completed}>{completed ? 'Confirmado' : 'Simular pagamento PIX'}</button></div></div></div>
      : method === 'card' ? <div className="payment-panel active"><form className="card-form" onSubmit={handlePayment}><div className="form-group"><label htmlFor="card-number">Número do cartão (simulado)</label><input id="card-number" inputMode="numeric" placeholder="0000 0000 0000 0000" required /></div><div className="form-row"><div className="form-group"><label htmlFor="card-expiry">Validade</label><input id="card-expiry" placeholder="MM/AA" required /></div><div className="form-group"><label htmlFor="card-cvv">CVV</label><input id="card-cvv" inputMode="numeric" placeholder="123" required /></div></div><button type="submit" className="btn btn-primary btn-block">{completed ? 'Pagamento simulado' : 'Simular assinatura'}</button></form></div>
      : <div className="payment-panel active"><div className="pix-box"><p>{completed ? 'Boleto demonstrativo gerado. Nenhuma cobrança foi realizada.' : 'Gere um boleto fictício para demonstrar a forma de pagamento.'}</p><p><strong>Vencimento:</strong> em 3 dias úteis</p><button className="btn btn-primary" onClick={markCompleted} disabled={completed}>{completed ? 'Boleto gerado' : 'Gerar boleto simulado'}</button></div></div>}
    </div>
  </div>;
};
