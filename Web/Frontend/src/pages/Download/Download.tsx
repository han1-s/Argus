import React, { useEffect, useState } from 'react';
import {
  Activity, ArrowDownToLine, CalendarDays, Check, Cpu, HardDrive, Monitor,
  Network, Package, Shield, Sparkles,
} from 'lucide-react';
import './Download.css';

const agentRelease = {
  name: 'ARGUS Agent',
  version: 'v2.4.0',
  date: '14/08/2026',
  compatibility: ['Windows 10/11', 'Linux'],
  size: '45,2 MB',
};

const releaseHistory = [
  {
    version: 'v2.4.0', label: 'Nova versão', date: '14/08/2026', latest: true,
    changes: ['Monitoramento preditivo com IA', 'Alertas preditivos', 'Otimização do uso de memória RAM'],
  },
  {
    version: 'v2.3.1', label: 'Correções', latest: false,
    changes: ['Melhorias de estabilidade', 'Melhorias de conectividade', 'Reconexão automática'],
  },
  {
    version: 'v2.3.0', label: 'Novos recursos', latest: false,
    changes: ['Suporte indicado para Linux baseado em Debian', 'Suporte à arquitetura ARM64'],
  },
];

const installationSteps = [
  { number: '01', title: 'Baixe', text: 'Obtenha o agente ARGUS correspondente ao sistema operacional.', icon: <ArrowDownToLine size={18} /> },
  { number: '02', title: 'Instale', text: 'Execute o instalador no computador que será integrado.', icon: <Package size={18} /> },
  { number: '03', title: 'Conecte', text: 'O agente estabelece a comunicação necessária com a plataforma.', icon: <Network size={18} /> },
  { number: '04', title: 'Monitore', text: 'As informações coletadas ficam disponíveis para análise no ARGUS.', icon: <Activity size={18} /> },
];

type DownloadState = 'idle' | 'preparing' | 'unavailable';

export const Download: React.FC = () => {
  const [downloadState, setDownloadState] = useState<DownloadState>('idle');

  useEffect(() => {
    if (downloadState !== 'preparing') return;
    const timer = window.setTimeout(() => setDownloadState('unavailable'), 850);
    return () => window.clearTimeout(timer);
  }, [downloadState]);

  const handleDownload = () => {
    if (downloadState !== 'idle') return;
    setDownloadState('preparing');
  };

  const buttonLabel = downloadState === 'preparing'
    ? 'Preparando download...'
    : downloadState === 'unavailable'
      ? 'Download ainda não disponível'
      : 'Baixar agora';

  return (
    <div className="page-wrapper download-page">
      <header className="download-page-heading">
        <div><span className="section-label">AGENTE ARGUS</span><h1>Baixe o agente ARGUS</h1><p>Instale o agente ARGUS nos computadores que serão integrados ao sistema de monitoramento.</p></div>
        <span className="download-role-note"><Network size={16} /> Integração entre computadores e plataforma</span>
      </header>

      <section className="download-agent-card" aria-labelledby="agent-title">
        <div className="download-agent-main">
          <div className="download-agent-icon"><Package size={26} /></div>
          <div className="download-agent-title-row"><div><span className="download-eyebrow">PACOTE DE INSTALAÇÃO</span><h2 id="agent-title">{agentRelease.name}</h2></div><span className="download-release-badge"><Sparkles size={13} /> Versão demonstrativa</span></div>
          <p className="download-agent-description">O agente é a aplicação prevista para integrar os computadores à plataforma ARGUS.</p>
          <div className="download-spec-grid" aria-label="Informações demonstrativas do pacote">
            <div className="download-spec"><span><Package size={14} /> Versão</span><strong>{agentRelease.version}</strong></div>
            <div className="download-spec"><span><CalendarDays size={14} /> Lançamento indicado</span><strong>{agentRelease.date}</strong></div>
            <div className="download-spec"><span><Monitor size={14} /> Compatibilidade indicada</span><strong>{agentRelease.compatibility.join(' · ')}</strong></div>
            <div className="download-spec"><span><HardDrive size={14} /> Tamanho indicado</span><strong>{agentRelease.size}</strong></div>
          </div>
          <div className="download-action-row"><button className={`btn-download-pill download-demo-button ${downloadState === 'unavailable' ? 'download-not-available' : ''}`} type="button" onClick={handleDownload} disabled={downloadState !== 'idle'} aria-describedby="download-feedback"><ArrowDownToLine size={17} />{buttonLabel}</button><span className="download-action-caption">Instalador oficial ainda não conectado</span></div>
          <p id="download-feedback" className={`download-feedback ${downloadState !== 'idle' ? 'visible' : ''}`} role="status" aria-live="polite">{downloadState === 'preparing' ? 'Esta demonstração não inicia transferência de arquivos.' : downloadState === 'unavailable' ? 'O instalador real ainda não está disponível nesta versão.' : ''}</p>
        </div>
        <aside className="download-availability"><span className="availability-icon"><Shield size={17} /></span><div><strong>Download do agente em desenvolvimento</strong><p>A interface de download está preparada, mas o instalador oficial ainda não está conectado a esta versão do ARGUS.</p></div></aside>
        <p className="download-data-note">Versão, data, compatibilidade e tamanho são informações demonstrativas até a publicação do pacote oficial.</p>
      </section>

      <section className="section-block download-compatibility" aria-labelledby="compatibility-title">
        <div className="section-header"><span className="section-label">Plataformas previstas</span><h2 id="compatibility-title">Compatibilidade</h2><p className="section-desc">Sistemas operacionais indicados para o agente nesta demonstração.</p></div>
        <div className="download-platform-grid"><article className="download-platform-card"><span className="platform-icon"><Monitor size={20} /></span><div><h3>Windows</h3><p>Windows 10 / 11</p></div><span className="platform-status">Indicado</span></article><article className="download-platform-card"><span className="platform-icon"><Cpu size={20} /></span><div><h3>Linux</h3><p>Distribuições compatíveis indicadas no histórico de versão</p></div><span className="platform-status">Indicado</span></article></div>
        <p className="download-platform-note">A compatibilidade ainda depende da publicação e validação dos instaladores oficiais.</p>
      </section>

      <section className="section-block download-history" aria-labelledby="history-title">
        <div className="section-header"><span className="section-label">Registro de alterações</span><h2 id="history-title">Histórico de versões</h2><p className="section-desc">Confira as principais alterações e melhorias atribuídas às versões do agente ARGUS nesta demonstração.</p></div>
        <div className="download-timeline">{releaseHistory.map((release, index) => <article className={`download-release-card ${release.latest ? 'latest' : ''}`} key={release.version} style={{ '--release-order': index } as React.CSSProperties}><div className="release-marker" aria-hidden="true"><span /></div><div className="release-card-heading"><div><span className="release-tag">{release.label}</span><h3>{release.version}</h3></div>{release.latest && <span className="release-latest"><Check size={13} /> Mais recente</span>}</div><div className="release-date">{release.date ?? 'Data não informada'}</div><ul>{release.changes.map((change) => <li key={change}><Check size={14} />{change}</li>)}</ul><p className="release-demo-note">Informações de versão demonstrativas</p></article>)}</div>
      </section>

      <section className="section-block download-howto" aria-labelledby="howto-title">
        <div className="section-header"><span className="section-label">Fluxo previsto</span><h2 id="howto-title">Como funciona</h2><p className="section-desc">Etapas planejadas para a integração do agente à plataforma.</p></div>
        <div className="download-steps-grid">{installationSteps.map((step) => <article className="download-step-card" key={step.number}><span className="step-number">{step.number}</span><span className="step-icon">{step.icon}</span><h3>{step.title}</h3><p>{step.text}</p></article>)}</div>
        <p className="download-flow-note">Este fluxo descreve a experiência prevista. A instalação e a conexão reais dependem da disponibilização do agente.</p>
      </section>

      <section className="download-distribution-note"><span><Shield size={18} /></span><div><span className="section-label">USO RESPONSÁVEL</span><h2>Distribuição e segurança</h2><p>Distribua o agente de forma controlada e utilize-o de acordo com as políticas, autorizações e práticas de segurança da sua organização. A publicação do instalador oficial ainda está em desenvolvimento.</p></div></section>
    </div>
  );
};

export default Download;
