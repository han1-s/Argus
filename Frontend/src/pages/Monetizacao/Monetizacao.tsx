import React, { useState } from 'react';
import { Check, X, Star, ChevronDown, CheckCircle2 } from 'lucide-react';
import { PLANS_DATA, FAQ_DATA } from '../../services/mockData';
import type { BillingCycle, PlanType } from '../../types';
import { CheckoutModal } from '../../components/CheckoutModal/CheckoutModal';

const currency = (value: number) => value.toLocaleString('pt-BR', { minimumFractionDigits: 2 });

export const Monetizacao: React.FC = () => {
  const [cycle, setCycle] = useState<BillingCycle>('monthly');
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<PlanType | null>(null);
  const [currentPlan, setCurrentPlan] = useState<PlanType>(() => {
    const saved = localStorage.getItem('argusDemoPlan');
    return saved === 'Pro' || saved === 'Business' ? saved : 'Free';
  });

  return (
    <div className="page-wrapper">
      <section className="usage-banner">
        <div className="usage-info">
          <span className="badge-tag"><CheckCircle2 size={14} /> Plano Atual: <strong>{currentPlan}</strong></span>
          <h2>Uso do Período Atual</h2>
          <p>Você utilizou <strong>8 de 10</strong> computadores monitorados no seu limite gratuito.</p>
        </div>
        <div className="usage-progress-container"><div className="progress-bar-bg"><div className="progress-bar-fill" style={{ width: '80%' }} /></div><span className="progress-text">80% da capacidade utilizada</span></div>
      </section>

      <section className="section-block">
        <div className="section-header">
          <span className="section-label">Evolua seu Monitoramento</span>
          <h2>Escolha o Plano Ideal para seu Negócio</h2>
          <p className="section-desc">Desbloqueie monitoramento avançado, análise preditiva e suporte prioritário.</p>
          <div className="pricing-toggle-container">
            <span className={`toggle-label ${cycle === 'monthly' ? 'active' : ''}`}>Mensal</span>
            <button type="button" aria-label="Alternar cobrança anual" aria-pressed={cycle === 'annual'} className={`pricing-toggle-btn ${cycle === 'annual' ? 'active' : ''}`} onClick={() => setCycle(cycle === 'monthly' ? 'annual' : 'monthly')} />
            <span className={`toggle-label ${cycle === 'annual' ? 'active' : ''}`}>Anual <span className="discount-badge">-20% OFF</span></span>
          </div>
        </div>
        <div className="cards-grid grid-3">
          {PLANS_DATA.map((plan) => {
            const installment = cycle === 'monthly' ? plan.priceMonthly : plan.priceAnnual;
            const total = installment * 12;
            return <div key={plan.id} className={`pricing-card ${plan.popular ? 'featured' : ''}`}>
              {plan.popular && <div className="popular-badge"><Star size={14} /> RECOMENDADO</div>}
              <div className="plan-header"><h3>{plan.name}</h3><p>{plan.description}</p>
                <div className="plan-price"><span className="currency">R$</span><span className="amount">{installment.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}</span><span className="period">/mês</span></div>
                {cycle === 'annual' && plan.priceMonthly > 0 && <p className="annual-price-detail">12x de R$ {currency(installment)} · Total anual: R$ {currency(total)}</p>}
              </div>
              <ul className="plan-features">{plan.features.map((feat, idx) => <li key={idx} className={feat.included ? '' : 'disabled'}>{feat.included ? <Check size={16} /> : <X size={16} />}{feat.text}</li>)}</ul>
              {plan.id === currentPlan ? <button className="btn btn-plan btn-current" disabled>Plano Atual</button> : plan.id === 'Free' ? <button className="btn btn-plan btn-current" disabled>Plano Free</button> : <button className="btn btn-primary btn-plan" onClick={() => setSelectedPlan(plan.id)}>{plan.id === 'Pro' ? 'Fazer upgrade' : 'Assinar Business'}</button>}
            </div>;
          })}
        </div>
      </section>

      <section className="section-block"><div className="section-header"><span className="section-label">Comparativo Detalhado</span><h2>Matriz de Recursos</h2></div>
        <div className="table-responsive"><table className="comparison-table"><thead><tr><th>Recurso</th><th>Free</th><th>Pro</th><th>Business</th></tr></thead>
          <tbody>
            <tr><td>Máquinas monitoradas</td><td>Até 10</td><td>Até 50</td><td>Ilimitado</td></tr>
            <tr><td>Frequência de atualização</td><td>30 s</td><td>5 s</td><td>1 s (tempo real)</td></tr>
            <tr><td>Detecção de anomalias com IA</td><td>—</td><td><Check size={16} aria-label="Incluído" /></td><td><Check size={16} aria-label="Incluído" /> Avançado</td></tr>
            <tr><td>Relatórios exportáveis</td><td>—</td><td><Check size={16} aria-label="Incluído" /></td><td><Check size={16} aria-label="Incluído" /></td></tr>
            <tr><td>Suporte técnico</td><td>Comunitário</td><td>Prioritário</td><td>Dedicado 24/7</td></tr>
          </tbody>
        </table></div>
      </section>
      <section className="section-block dark-bg-box"><div className="section-header"><span className="section-label">Dúvidas Frequentes</span><h2>Perguntas sobre Planos e Cobrança</h2></div>
        <div className="faq-accordion">{FAQ_DATA.map((item, idx) => <div key={idx} className={`faq-item ${openFaq === idx ? 'active' : ''}`}>
          <button className="faq-question" aria-expanded={openFaq === idx} onClick={() => setOpenFaq(openFaq === idx ? null : idx)}><span>{item.question}</span><ChevronDown size={18} /></button>
          {openFaq === idx && <div className="faq-answer"><p>{item.answer}</p></div>}
        </div>)}</div>
      </section>
      <CheckoutModal key={selectedPlan ?? 'closed'} isOpen={!!selectedPlan} planName={selectedPlan} onClose={() => setSelectedPlan(null)} onComplete={() => { if (selectedPlan) { localStorage.setItem('argusDemoPlan', selectedPlan); setCurrentPlan(selectedPlan); } }} />
    </div>
  );
};
