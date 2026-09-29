import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity, AppWindow, ArrowDown, ArrowRight, BarChart3, Clock3, Cpu, Database,
  Download, Eye, FileChartColumn, Globe, LayoutDashboard, LockKeyhole,
  Monitor, ShieldCheck, UserCheck,
} from 'lucide-react';
import './Home.css';

const scenes = [
  { title: 'Segurança Digital', description: 'Acompanhe os sinais do ambiente monitorado.', icon: ShieldCheck },
  { title: 'Análise de utilização', description: 'Organize dados de uso para facilitar a leitura.', icon: Activity },
  { title: 'Visão operacional', description: 'Reúna informações em uma visão centralizada.', icon: LayoutDashboard },
];

const capabilities = [
  { icon: Monitor, title: 'Computadores', text: 'Acompanhe os dispositivos cadastrados no ambiente.' },
  { icon: AppWindow, title: 'Aplicações', text: 'Visualize os softwares utilizados nos computadores.' },
  { icon: Globe, title: 'Sites', text: 'Organize informações sobre os domínios acessados.' },
  { icon: Clock3, title: 'Tempo', text: 'Consulte períodos de utilização dos recursos.' },
  { icon: FileChartColumn, title: 'Relatórios', text: 'Reúna informações para apoiar consultas e análises.' },
  { icon: LayoutDashboard, title: 'Dashboard', text: 'Visualize indicadores em um só lugar.' },
];

const flowSteps = [
  { icon: Monitor, title: 'Computadores', text: 'Dispositivos vinculados ao ambiente.' },
  { icon: Activity, title: 'Coleta', text: 'Dados definidos pela plataforma.' },
  { icon: Cpu, title: 'Processamento', text: 'Informações organizadas para consulta.' },
  { icon: LayoutDashboard, title: 'Dashboard', text: 'Uma visão visual dos dados.' },
];

const differentiators = [
  { icon: LayoutDashboard, title: 'Centralização', text: 'Informações reunidas em um único ambiente.' },
  { icon: Database, title: 'Organização', text: 'Dados apresentados de forma estruturada.' },
  { icon: Eye, title: 'Visibilidade', text: 'Acompanhamento de diferentes computadores e recursos.' },
  { icon: BarChart3, title: 'Análise', text: 'Indicadores organizados para facilitar a interpretação.' },
];

const safeguards = [
  { icon: Eye, title: 'Transparência' },
  { icon: UserCheck, title: 'Controle de acesso' },
  { icon: LockKeyhole, title: 'Privacidade' },
  { icon: ShieldCheck, title: 'Segurança' },
];

const sampleBars = [36, 54, 44, 68, 52, 76, 61, 86, 63, 72, 48, 79];

export const Home: React.FC = () => {
  const [activeScene, setActiveScene] = useState(0);

  useEffect(() => {
    const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
    let interval: number | undefined;
    const syncCarousel = () => {
      window.clearInterval(interval);
      interval = undefined;
      const motionReduced = motionPreference.matches || document.body.classList.contains('reduce-animations');
      if (!motionReduced && document.visibilityState === 'visible') {
        interval = window.setInterval(() => setActiveScene((previous) => (previous + 1) % scenes.length), 6000);
      }
    };
    const handleVisibilityChange = () => syncCarousel();

    syncCarousel();
    motionPreference.addEventListener('change', syncCarousel);
    window.addEventListener('argus-preferences-changed', syncCarousel);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      window.clearInterval(interval);
      motionPreference.removeEventListener('change', syncCarousel);
      window.removeEventListener('argus-preferences-changed', syncCarousel);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const currentScene = scenes[activeScene];
  const SceneIcon = currentScene.icon;

  return (
    <div className="home-page">
      <section className="home-hero" aria-labelledby="home-title">
        <div className="home-hero-copy">
          <span className="home-eyebrow"><span className="home-live-dot" /> Monitoramento <i /> Análise <i /> Gestão</span>
          <h1 id="home-title">Tenha uma visão mais clara da sua operação.</h1>
          <p>O ARGUS centraliza informações dos computadores da sua organização para facilitar o acompanhamento de recursos, aplicações, sites e indicadores em uma única plataforma.</p>
          <div className="home-actions">
            <Link to="/download" className="btn btn-primary"><Download size={17} /> Baixar agente</Link>
            <Link to="/saiba-mais" className="btn btn-secondary">Conheça o ARGUS <ArrowRight size={17} /></Link>
          </div>
          <div className="home-trust-line"><ShieldCheck size={16} /><span>Visibilidade organizada para ambientes corporativos</span></div>
        </div>

        <div className="home-product-preview" role="region" aria-label="Prévia ilustrativa do sistema ARGUS">
          <div className="home-preview-topbar">
            <div className="home-window-dots" aria-hidden="true"><i /><i /><i /></div>
            <span className="home-preview-label">PRÉVIA DO PRODUTO</span>
            <span className="home-demo-pill">Demonstração</span>
          </div>
          <div className="home-preview-layout">
            <aside className="home-preview-sidebar" aria-hidden="true">
              <span className="home-sidebar-mark"><LayoutDashboard size={16} /></span>
              <span className="is-selected"><LayoutDashboard size={15} /></span>
              <span><Monitor size={15} /></span>
              <span><AppWindow size={15} /></span>
              <span><FileChartColumn size={15} /></span>
            </aside>
            <div className="home-preview-main">
              <div className="home-preview-heading">
                <div><span className="home-preview-kicker">AMBIENTE CORPORATIVO</span><h2>Visão geral</h2></div>
                <span className="home-preview-date">Últimos 7 dias <ArrowDown size={12} /></span>
              </div>
              <div className="home-scene-caption" aria-live="polite"><SceneIcon size={15} /><span>{currentScene.title}</span><span className="home-caption-divider">·</span><span>{currentScene.description}</span></div>
              <div className="home-preview-metrics">
                <article><span>Computadores</span><strong>24</strong><small><Monitor size={12} /> Dispositivos</small></article>
                <article><span>Ativos agora</span><strong>18</strong><small className="home-positive"><i /> Em atividade</small></article>
                <article><span>Utilização média</span><strong>76<small>%</small></strong><small><Activity size={12} /> Período demonstrativo</small></article>
              </div>
              <div className="home-preview-panels">
                <section className="home-chart-panel" aria-label="Gráfico ilustrativo de utilização">
                  <div className="home-panel-heading"><div><strong>Atividade do ambiente</strong><span>Visão demonstrativa</span></div><BarChart3 size={16} /></div>
                  <div className="home-chart" aria-hidden="true">{sampleBars.map((height, index) => <span key={index} style={{ height: `${height}%` }} />)}</div>
                  <div className="home-chart-labels"><span>SEG</span><span>TER</span><span>QUA</span><span>QUI</span><span>SEX</span><span>SÁB</span><span>DOM</span></div>
                </section>
                <section className="home-device-panel" aria-label="Lista ilustrativa de computadores">
                  <div className="home-panel-heading"><div><strong>Computadores</strong><span>Status demonstrativo</span></div><Monitor size={16} /></div>
                  <div className="home-device-row"><span className="home-device-icon"><Monitor size={13} /></span><span className="home-device-name">Estação financeira</span><span className="home-status online"><i /> Online</span></div>
                  <div className="home-device-row"><span className="home-device-icon"><Monitor size={13} /></span><span className="home-device-name">Notebook design</span><span className="home-status online"><i /> Online</span></div>
                  <div className="home-device-row"><span className="home-device-icon"><Monitor size={13} /></span><span className="home-device-name">Estação logística</span><span className="home-status offline"><i /> Offline</span></div>
                </section>
              </div>
              <div className="home-preview-bottom">
                <span><AppWindow size={13} /> Aplicações</span><span>Editor <b>2h 18min</b></span><span>Navegador <b>1h 42min</b></span>
              </div>
            </div>
          </div>
          <div className="home-preview-carousel" aria-label="Destaques da prévia do ARGUS">
            <span className="home-carousel-current"><SceneIcon size={14} /> {currentScene.title}</span>
            <div className="home-carousel-indicators" role="group" aria-label="Selecionar destaque">
              {scenes.map((scene, index) => <button key={scene.title} type="button" className={activeScene === index ? 'is-active' : ''} onClick={() => setActiveScene(index)} aria-label={`Exibir ${scene.title}`} aria-pressed={activeScene === index} />)}
            </div>
            <span className="home-carousel-count">0{activeScene + 1} <i>/</i> 0{scenes.length}</span>
          </div>
        </div>
      </section>

      <section className="home-section" id="recursos">
        <div className="home-section-heading"><span className="home-eyebrow">Um ambiente. Mais contexto.</span><h2>Tudo o que você precisa para acompanhar seu ambiente.</h2><p>O ARGUS reúne informações de diferentes computadores em uma única interface, facilitando o acompanhamento, a organização e a análise dos dados.</p><span className="home-capabilities-note">Os recursos de monitoramento apresentados fazem parte da proposta da plataforma e dependem da integração dos computadores.</span></div>
        <div className="home-capabilities-grid">
          {capabilities.map(({ icon: Icon, title, text }, index) => <article className="home-capability-card" key={title} style={{ '--home-delay': `${index * 55}ms` } as React.CSSProperties}><span className="home-card-icon"><Icon size={20} /></span><h3>{title}</h3><p>{text}</p></article>)}
        </div>
      </section>

      <section className="home-section home-process-section" id="como-funciona">
        <div className="home-section-heading"><span className="home-eyebrow">Do computador ao insight</span><h2>Como funciona?</h2><p>Um fluxo simples para transformar dados do ambiente em informações fáceis de consultar.</p></div>
        <div className="home-process-flow">
          {flowSteps.map(({ icon: Icon, title, text }, index) => <React.Fragment key={title}><article className="home-process-step"><span className="home-step-number">0{index + 1}</span><span className="home-card-icon"><Icon size={20} /></span><h3>{title}</h3><p>{text}</p></article>{index < flowSteps.length - 1 && <ArrowRight className="home-process-arrow" size={18} aria-hidden="true" />}</React.Fragment>)}
        </div>
      </section>

      <section className="home-section home-dashboard-section" id="dashboard">
        <div className="home-dashboard-copy"><span className="home-eyebrow">Informações em contexto</span><h2>Uma visão completa da sua operação.</h2><p>Visualize informações importantes do ambiente monitorado de forma organizada e compreensível.</p><Link to="/saiba-mais" className="home-text-link">Conheça a proposta do ARGUS <ArrowRight size={16} /></Link></div>
        <div className="home-dashboard-showcase" aria-label="Prévia demonstrativa do dashboard ARGUS">
          <div className="home-showcase-header"><div><span className="home-preview-kicker">PAINEL DE MONITORAMENTO</span><h3>Resumo do ambiente</h3></div><span className="home-demo-pill">Dados demonstrativos</span></div>
          <div className="home-showcase-stats"><article><span>Computadores</span><strong>24</strong><small>Visão demonstrativa</small></article><article><span>Em atividade</span><strong>18 <i>de 24</i></strong><small><span className="home-stat-dot" /> Status ilustrativo</small></article><article><span>Tempo acompanhado</span><strong>06h 42m</strong><small>Exemplo visual</small></article></div>
          <div className="home-showcase-content">
            <section className="home-showcase-chart"><div className="home-panel-heading"><div><strong>Utilização ao longo do dia</strong><span>Dados fictícios para demonstração</span></div><Activity size={16} /></div><div className="home-large-chart" aria-hidden="true">{[32, 48, 42, 61, 54, 70, 62, 85, 67, 76, 58, 80, 65, 90, 73, 83, 57, 70].map((height, index) => <span key={index} style={{ height: `${height}%` }} />)}</div><div className="home-large-chart-labels"><span>08:00</span><span>10:00</span><span>12:00</span><span>14:00</span><span>16:00</span><span>18:00</span></div></section>
            <section className="home-showcase-activity"><div className="home-panel-heading"><div><strong>Atividade por categoria</strong><span>Exemplo de organização</span></div><BarChart3 size={16} /></div><div className="home-activity-row"><span className="home-activity-icon"><AppWindow size={14} /></span><span>Aplicações</span><strong>58%</strong></div><div className="home-activity-bar"><i style={{ width: '58%' }} /></div><div className="home-activity-row"><span className="home-activity-icon is-blue"><Globe size={14} /></span><span>Sites</span><strong>29%</strong></div><div className="home-activity-bar is-blue"><i style={{ width: '29%' }} /></div><div className="home-activity-row"><span className="home-activity-icon is-muted"><Database size={14} /></span><span>Outros dados</span><strong>13%</strong></div><div className="home-activity-bar is-muted"><i style={{ width: '13%' }} /></div></section>
          </div>
          <span className="home-showcase-disclaimer"><i /> Prévia conceitual. Os números e estados exibidos são demonstrativos, não dados reais.</span>
        </div>
      </section>

      <section className="home-section" id="diferenciais">
        <div className="home-section-heading"><span className="home-eyebrow">A proposta</span><h2>Por que ARGUS?</h2><p>Uma proposta para tornar o acompanhamento do ambiente mais claro e organizado.</p></div>
        <div className="home-differentiators-grid">{differentiators.map(({ icon: Icon, title, text }) => <article className="home-differentiator" key={title}><span className="home-card-icon"><Icon size={20} /></span><div><h3>{title}</h3><p>{text}</p></div></article>)}</div>
      </section>

      <section className="home-responsibility-section" id="responsabilidade">
        <div className="home-responsibility-copy"><span className="home-eyebrow">Princípios da plataforma</span><h2>Monitoramento com responsabilidade.</h2><p>O ARGUS considera transparência, controle de acesso, privacidade, segurança e uso responsável das informações como princípios importantes da plataforma.</p><Link to="/saiba-mais" className="home-text-link">Saiba mais sobre o ARGUS <ArrowRight size={16} /></Link></div>
        <div className="home-safeguards">{safeguards.map(({ icon: Icon, title }) => <div className="home-safeguard" key={title}><Icon size={17} /><span>{title}</span></div>)}</div>
      </section>

      <section className="home-final-cta">
        <div><span className="home-eyebrow">ARGUS · MONITORAMENTO E ANÁLISE</span><h2>Conheça uma nova forma de acompanhar sua operação.</h2><p>Explore o ARGUS e descubra como uma visão centralizada pode facilitar o acompanhamento do seu ambiente.</p></div>
        <div className="home-actions"><Link to="/saiba-mais" className="btn btn-secondary">Conhecer o ARGUS <ArrowRight size={16} /></Link><Link to="/download" className="btn btn-primary"><Download size={16} /> Baixar agente</Link></div>
      </section>
    </div>
  );
};
