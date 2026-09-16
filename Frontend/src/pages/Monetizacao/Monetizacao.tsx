import React, { useState } from 'react';
import { Check, X, Star, ChevronDown, CheckCircle2 } from 'lucide-react';
import { PLANS_DATA, FAQ_DATA } from '../../services/mockData';
import type { BillingCycle, PlanType } from '../../types';
import { CheckoutModal } from '../../components/CheckoutModal/CheckoutModal';

export const Monetizacao: React.FC = () => {
  const [cycle, setCycle] = useState<BillingCycle>('monthly');
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<PlanType | null>(null);

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  return (
    <div className="page-wrapper">
      <section className="usage-banner">
        <div className="usage-info">
          <span className="badge-tag">
            <CheckCircle2 size={14} /> Plano Atual: <strong>Gratuito</strong>
          </span>
          <h2>Uso do Período Atual</h2>
          <p>Você utilizou <strong>8 de 10</strong> computadores monitorados no seu limite gratuito.</p>
        </div>
        <div className="usage-progress-container">
          <div className="progress-bar-bg">
            <div className="progress-bar-fill" style={{ width: '80%' }}></div>
          </div>
          <span className="progress-text">80% da capacidade utilizada</span>
        </div>
      </section>

      <section className="section-block">
        <div className="section-header">
          <span className="section-label">Evolua seu Monitoramento</span>
          <h2>Escolha o Plano Ideal para seu Negócio</h2>
          <p className="section-desc">
            Desbloqueie poder computacional em nuvem, IA preditiva e suporte prioritário 24/7.
          </p>

          <div className="pricing-toggle-container">
            <span className={`toggle-label ${cycle === 'monthly' ? 'active' : ''}`}>Mensal</span>
            <button
              className={`pricing-toggle-btn ${cycle === 'annual' ? 'active' : ''}`}
              onClick={() => setCycle(cycle === 'monthly' ? 'annual' : 'monthly')}
            />
            <span className={`toggle-label ${cycle === 'annual' ? 'active' : ''}`}>
              Anual <span className="discount-badge">-20% OFF</span>
            </span>
          </div>
        </div>

        <div className="cards-grid grid-3">
          {PLANS_DATA.map((plan) => {
            const price = cycle === 'monthly' ? plan.priceMonthly : plan.priceAnnual;
            return (
              <div key={plan.id} className={`pricing-card ${plan.popular ? 'featured' : ''}`}>
                {plan.popular && (
                  <div className="popular-badge">
                    <Star size={14} /> MAIS POPULAR
                  </div>
                )}
                <div className="plan-header">
                  <h3>{plan.name}</h3>
                  <p>{plan.description}</p>
                  <div className="plan-price">
                    <span className="currency">R$</span>
                    <span className="amount">{price}</span>
                    <span className="period">/mês</span>
                  </div>
                </div>

                <ul className="plan-features">
                  {plan.features.map((feat, idx) => (
                    <li key={idx} className={feat.included ? '' : 'disabled'}>
                      {feat.included ? <Check size={16} /> : <X size={16} />}
                      {feat.text}
                    </li>
                  ))}
                </ul>

                {plan.id === 'Free' ? (
                  <button className="btn btn-plan btn-current" disabled>
                    Plano Atual
                  </button>
                ) : (
                  <button
                    className="btn btn-primary btn-plan"
                    onClick={() => setSelectedPlan(plan.id)}
                  >
                    {plan.id === 'Pro' ? 'Fazer Upgrade' : 'Assinar Business'}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <section className="section-block">
        <div className="section-header">
          <span className="section-label">Comparativo Detalhado</span>
          <h2>Matriz de Recursos</h2>
        </div>
        <div className="table-responsive">
          <table className="comparison-table">
            <thead><tr><th>Recurso</th><th>Free</th><th>Pro</th><th>Business</th></tr></thead>
            <tbody>
              <tr><td>Maquinas monitoradas</td><td>Ate 10</td><td>Ate 50</td><td>Ilimitado</td></tr>
              <tr><td>Frequencia de atualizacao</td><td>30s</td><td>5s</td><td>1s (tempo real)</td></tr>
              <tr><td>Deteccao de anomalias com IA</td><td>-</td><td><Check size={16} /></td><td><Check size={16} /> Avancado</td></tr>
              <tr><td>Relatorios exportaveis</td><td>-</td><td><Check size={16} /></td><td><Check size={16} /></td></tr>
              <tr><td>Suporte tecnico</td><td>Comunitario</td><td>Prioritario</td><td>Dedicado 24/7</td></tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="section-block dark-bg-box">
        <div className="section-header">
          <span className="section-label">Dúvidas Frequentes</span>
          <h2>Perguntas sobre Planos e Cobrança</h2>
        </div>

        <div className="faq-accordion">
          {FAQ_DATA.map((item, idx) => (
            <div key={idx} className="faq-item">
              <button className="faq-question" onClick={() => toggleFaq(idx)}>
                <span>{item.question}</span>
                <ChevronDown size={18} style={{ transform: openFaq === idx ? 'rotate(180deg)' : 'rotate(0)' }} />
              </button>
              {openFaq === idx && (
                <div className="faq-answer">
                  <p>{item.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      <CheckoutModal
        key={selectedPlan ?? 'closed'}
        isOpen={!!selectedPlan}
        planName={selectedPlan}
        onClose={() => setSelectedPlan(null)}
      />
    </div>
  );
};