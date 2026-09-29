import React, { useState } from 'react';
import {
  Activity, AlertTriangle, BarChart3, Check, ChevronDown, Clock3, Code2,
  Database, FileText, Headphones, Monitor, ShieldCheck, Sparkles, X,
} from 'lucide-react';
import type { BillingCycle, PlanType } from '../../types';
import { CheckoutModal } from '../../components/CheckoutModal/CheckoutModal';
import './Monetizacao.css';

const plans: Array<{
  id: PlanType; name: string; monthly: number; annual: number;
  summary: string; featured?: boolean; resources: Array<{ icon: typeof Monitor; name: string; value: string }>;
}> = [
  { id: 'Free', name: 'Free', monthly: 0, annual: 0, summary: 'O essencial para começar a conhecer o ARGUS.', resources: [
    { icon: Monitor, name: 'Computadores', value: 'Até 10' }, { icon: Activity, name: 'Métricas', value: 'Básicas' },
    { icon: Database, name: 'Retenção', value: '7 dias' }, { icon: BarChart3, name: 'Dashboard', value: 'Essencial' },
    { icon: ShieldCheck, name: 'Monitoramento', value: 'Básico' },
  ] },
  { id: 'Pro', name: 'Pro', monthly: 49, annual: 39, summary: 'Mais visibilidade e ferramentas para operações em expansão.', featured: true, resources: [
    { icon: Monitor, name: 'Computadores', value: 'Até 50' }, { icon: Activity, name: 'Métricas', value: 'Avançadas' },
    { icon: Database, name: 'Retenção', value: '90 dias' }, { icon: AlertTriangle, name: 'Alertas', value: 'Disponível' },
    { icon: FileText, name: 'Relatórios', value: 'Disponível' }, { icon: Headphones, name: 'Suporte', value: 'Chat e e-mail' },
  ] },
  { id: 'Business', name: 'Business', monthly: 149, annual: 119, summary: 'Capacidade ampliada e recursos para operações maiores.', resources: [
    { icon: Monitor, name: 'Computadores', value: 'Ilimitados' }, { icon: Activity, name: 'Métricas', value: 'Avançadas' },
    { icon: Database, name: 'Histórico', value: 'Ampliado' }, { icon: BarChart3, name: 'Análises', value: 'Avançadas' },
    { icon: Code2, name: 'API', value: 'Dedicada' }, { icon: Headphones, name: 'Suporte', value: 'Prioritário' },
    { icon: Sparkles, name: 'Recursos', value: 'Personalizados' },
  ] },
];

const comparison = [
  ['Computadores', 'Até 10', 'Até 50', 'Ilimitados'],
  ['Frequência de atualização', 'Padrão', 'Avançada', 'Avançada'],
  ['Métricas', 'Básicas', 'Avançadas', 'Avançadas'],
  ['Detecção de anomalias', '—', 'Disponível', 'Disponível'],
  ['Relatórios exportáveis', '—', 'Disponível', 'Disponível'],
  ['Retenção de dados', '7 dias', '90 dias', 'Ampliada'],
  ['Alertas', '—', 'Disponível', 'Disponível'],
  ['Suporte', 'Essencial', 'Chat e e-mail', 'Prioritário'],
  ['API', '—', '—', 'Dedicada'],
  ['Recursos avançados', '—', 'Disponível', 'Personalizados'],
];

const faqs = [
  ['Posso cancelar meu plano?', 'Esta página é uma demonstração. Em uma oferta comercial, as condições de cancelamento seriam apresentadas antes da contratação.'],
  ['Como funciona a cobrança anual?', 'O valor anual é apresentado como equivalente mensal, com desconto demonstrativo de 20%. O pagamento seria anual; nenhum valor é cobrado nesta demonstração.'],
  ['Quais formas de pagamento estão disponíveis?', 'O fluxo demonstrativo apresenta PIX e cartão apenas para ilustrar uma possível contratação.'],
  ['Posso mudar de plano?', 'Os botões permitem percorrer o checkout simulado de cada plano. A seleção não altera uma conta nem ativa recursos.'],
  ['O que acontece se eu ultrapassar o limite de computadores?', 'Os limites mostrados são ilustrativos. Esta página não monitora computadores nem verifica utilização.'],
  ['Os pagamentos são reais?', 'Não. Preços, planos e checkout são demonstrativos. Nenhuma transação ou cobrança real é realizada.'],
];

const formatPrice = (value: number) => new Intl.NumberFormat('pt-BR').format(value);

export const Monetizacao: React.FC = () => {
  const [cycle, setCycle] = useState<BillingCycle>('monthly');
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<PlanType | null>(null);
  const activePlan = plans[0];

  return (
    <div className="page-wrapper monetization-page">
      <section className="monetization-hero">
        <div className="monetization-intro">
          <span className="section-label">ARGUS · PLANOS</span>
          <h1>Escolha o plano ideal para sua operação.</h1>
          <p>Os planos definem os recursos e limites disponíveis no ARGUS, para que cada operação encontre uma configuração adequada às suas necessidades.</p>
          <span className="demo-note"><ShieldCheck size={15} /> Modo demonstração · preços e contratação ilustrativos</span>
        </div>
        <aside className="current-plan-card">
          <div className="current-plan-heading"><span>Plano atual</span><span className="current-plan-status"><Check size={13} /> ATIVO</span></div>
          <div className="current-plan-name">{activePlan.name}</div>
          <p className="current-plan-description">Recursos essenciais para conhecer o ARGUS.</p>
          <ul>{activePlan.resources.slice(0, 4).map(({ icon: Icon, name, value }) => <li key={name}><Icon size={15} /><span>{name}</span><strong>{value}</strong></li>)}</ul>
          <button className="btn btn-secondary current-plan-button" disabled>Plano atual</button>
        </aside>
      </section>

      <section className="section-block plans-section" aria-labelledby="plans-title">
        <div className="section-header plans-heading">
          <span className="section-label">Planos para cada etapa</span>
          <h2 id="plans-title">Recursos claros para sua operação</h2>
          <p className="section-desc">Compare limites e recursos. Valores e condições são exibidos apenas para demonstração.</p>
          <div className="billing-switch" role="group" aria-label="Período de cobrança">
            <button type="button" className={cycle === 'monthly' ? 'selected' : ''} aria-pressed={cycle === 'monthly'} onClick={() => setCycle('monthly')}>Mensal</button>
            <button type="button" className={cycle === 'annual' ? 'selected' : ''} aria-pressed={cycle === 'annual'} onClick={() => setCycle('annual')}>Anual <span>Economize 20%</span></button>
          </div>
          <p className="billing-caption">{cycle === 'annual' ? 'Valor equivalente mensal; cobrança anual demonstrativa.' : 'Valores mensais demonstrativos.'}</p>
        </div>

        <div className="monetization-plan-grid">
          {plans.map((plan, index) => {
            const price = cycle === 'monthly' ? plan.monthly : plan.annual;
            return <article key={plan.id} className={`monetization-plan-card ${plan.featured ? 'plan-featured' : ''}`} style={{ '--plan-order': index } as React.CSSProperties}>
              {plan.featured && <span className="plan-recommended"><Sparkles size={13} /> Recomendado</span>}
              <div className="plan-card-top"><div><span className="plan-tier">PLANO</span><h3>{plan.name}</h3></div><span className="plan-glyph"><Activity size={19} /></span></div>
              <p className="plan-summary">{plan.summary}</p>
              <div className="plan-price-line"><span className="plan-currency">R$</span><strong>{formatPrice(price)}</strong><span className="plan-period">/ mês</span></div>
              {cycle === 'annual' && plan.monthly > 0 && <div className="annual-equivalent">Equivalente mensal · R$ {formatPrice(price)} · R$ {formatPrice(price * 12)} por ano</div>}
              {cycle === 'monthly' && <div className="annual-equivalent">{price === 0 ? 'Sem custo demonstrativo' : 'Cobrança mensal demonstrativa'}</div>}
              <div className="plan-resources">{plan.resources.map(({ icon: Icon, name, value }) => <div className="plan-resource" key={name}><span className="resource-icon"><Icon size={15} /></span><span className="resource-name">{name}</span><strong>{value}</strong></div>)}</div>
              {plan.id === 'Free' ? <button className="btn btn-secondary btn-plan-cta" disabled>Plano atual</button> : <button className={`btn ${plan.featured ? 'btn-primary' : 'btn-secondary'} btn-plan-cta`} onClick={() => setSelectedPlan(plan.id)}>Escolher {plan.name}</button>}
            </article>;
          })}
        </div>
      </section>

      <section className="section-block monetization-compare" aria-labelledby="compare-title">
        <div className="section-header"><span className="section-label">Visão lado a lado</span><h2 id="compare-title">Compare os planos</h2><p className="section-desc">Consulte os limites e recursos apresentados em cada opção.</p></div>
        <div className="table-responsive monetization-table-wrap"><table className="comparison-table monetization-table"><thead><tr><th>Recurso</th><th>Free</th><th>Pro</th><th>Business</th></tr></thead><tbody>{comparison.map(([label, ...values]) => <tr key={label}><th scope="row">{label}</th>{values.map((value, index) => <td key={`${label}-${index}`}>{value === '—' ? <span className="comparison-unavailable"><X size={14} aria-label="Não disponível" /></span> : <span className="comparison-available"><Check size={14} /> {value}</span>}</td>)}</tr>)}</tbody></table></div>
      </section>

      <section className="section-block billing-explainer">
        <div className="section-header"><span className="section-label">Transparência</span><h2>Como os valores são apresentados</h2></div>
        <div className="billing-explainer-grid"><article><Clock3 size={19} /><div><h3>Cobrança mensal</h3><p>O plano é apresentado pelo seu valor mensal demonstrativo.</p></div></article><article><Database size={19} /><div><h3>Cobrança anual</h3><p>O desconto demonstrativo de 20% aparece como equivalente mensal. A referência considera o pagamento anual.</p></div></article></div>
        <p className="billing-disclaimer"><ShieldCheck size={15} /> Os preços, limites e condições desta página fazem parte da demonstração do ARGUS.</p>
      </section>

      <section className="section-block plan-guidance">
        <div className="section-header"><span className="section-label">Encontre seu ponto de partida</span><h2>Qual plano combina com sua necessidade?</h2><p className="section-desc">Cada opção atende a uma etapa diferente da operação.</p></div>
        <div className="guidance-grid"><article><span className="guidance-icon"><Activity size={18} /></span><h3>Começando</h3><p>Para operações menores que precisam dos recursos essenciais.</p><span>Free</span></article><article><span className="guidance-icon"><BarChart3 size={18} /></span><h3>Expandindo</h3><p>Para quem precisa de mais computadores, histórico e análise.</p><span>Pro</span></article><article><span className="guidance-icon"><Code2 size={18} /></span><h3>Escalando</h3><p>Para operações maiores que precisam de capacidade, API e recursos avançados.</p><span>Business</span></article></div>
      </section>

      <section className="section-block monetization-faq dark-bg-box">
        <div className="section-header"><span className="section-label">Dúvidas frequentes</span><h2>Sobre planos e demonstração</h2></div>
        <div className="faq-accordion">{faqs.map(([question, answer], index) => <div className="faq-item" key={question}><h3><button className="faq-question" type="button" aria-expanded={openFaq === index} aria-controls={`monetization-faq-${index}`} onClick={() => setOpenFaq(openFaq === index ? null : index)}><span>{question}</span><ChevronDown size={18} /></button></h3><div id={`monetization-faq-${index}`} className={`faq-answer monetization-faq-answer ${openFaq === index ? 'is-open' : ''}`} aria-hidden={openFaq !== index}><p>{answer}</p></div></div>)}</div>
      </section>

      <aside className="demo-disclosure"><span className="demo-disclosure-icon"><ShieldCheck size={17} /></span><div><strong>Modo demonstração</strong><p>Preços e limites são ilustrativos. O checkout é simulado e nenhuma cobrança real é realizada.</p></div></aside>

      <CheckoutModal key={`${selectedPlan ?? 'closed'}-${cycle}`} isOpen={!!selectedPlan} planName={selectedPlan} cycle={cycle} onClose={() => setSelectedPlan(null)} />
    </div>
  );
};
