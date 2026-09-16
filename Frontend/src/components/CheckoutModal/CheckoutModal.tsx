import React, { useState } from 'react';
import { X, QrCode, Copy, CreditCard, ShieldCheck } from 'lucide-react';
import type { PlanType, PaymentMethod } from '../../types';

interface CheckoutModalProps {
  isOpen: boolean;
  planName: PlanType | null;
  onClose: () => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({ isOpen, planName, onClose }) => {
  const [method, setMethod] = useState<PaymentMethod>('pix');
  const [copied, setCopied] = useState(false);
  const [completed, setCompleted] = useState(false);

  if (!isOpen || !planName) return null;

  const handleCopyPix = () => {
    void navigator.clipboard?.writeText(`ARGUS-${planName}-PIX-DEMO`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePayment = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setCompleted(true);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Fechar">
          <X size={20} />
        </button>

        <div className="modal-header">
          <span className="badge-tag">
            <ShieldCheck size={14} /> Checkout Seguro
          </span>
          <h2>{completed ? 'Pagamento simulado com sucesso' : <>Confirmar Upgrade - <span>{planName}</span></>}</h2>
        </div>

        <div className="payment-tabs">
          <button
            className={`tab-btn ${method === 'pix' ? 'active' : ''}`}
            onClick={() => setMethod('pix')}
          >
            PIX
          </button>
          <button
            className={`tab-btn ${method === 'card' ? 'active' : ''}`}
            onClick={() => setMethod('card')}
          >
            <CreditCard size={16} /> Cartão de Crédito
          </button>
        </div>

        {method === 'pix' ? (
          <div className="payment-panel active">
            <div className="pix-box">
              <div className="qr-placeholder">
                <QrCode size={120} />
              </div>
              <p>{completed ? 'Seu plano foi atualizado no perfil.' : 'Escaneie o QR Code acima ou copie a chave PIX para confirmação instantânea.'}</p>
              <button className="btn btn-primary" onClick={handleCopyPix} disabled={completed}>
                <Copy size={16} /> {copied ? 'Copiado!' : 'Copiar Chave PIX'}
              </button>
            </div>
          </div>
        ) : (
          <div className="payment-panel active">
            <form className="card-form" onSubmit={handlePayment}>
              <div className="form-group">
                <label>Número do Cartão</label>
                <input type="text" placeholder="0000 0000 0000 0000" required />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Validade</label>
                  <input type="text" placeholder="MM/AA" required />
                </div>
                <div className="form-group">
                  <label>CVV</label>
                  <input type="text" placeholder="123" required />
                </div>
              </div>
              <button type="submit" className="btn btn-primary btn-block">
                Finalizar Assinatura
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};