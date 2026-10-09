import React, { useState } from 'react';
import {
  Activity, ArrowDownToLine, CalendarDays, Check, Cpu, HardDrive, Monitor,
  Network, Package, Shield,
} from 'lucide-react';
import './Download.css';

const releaseHistory = [
  {
    version: 'v2.4.0', label: 'Nova versão', date: '14/08/2026', latest: true,
    changes: ['Integração do site com os serviços ARGUS', 'Assinatura demonstrativa persistida no MySQL', 'Notificações recebidas da Platform'],
  },
  {
    version: 'v2.3.1', label: 'Correções', latest: false,
    changes: ['Melhorias de estabilidade', 'Melhorias de conectividade', 'Reconexão automática'],
  },
  {
    version: 'v2.3.0', label: 'Novos recursos', latest: false,
    changes: ['Inicialização manual do agente com Node.js', 'Coleta de métricas e processos em sistemas compatíveis'],
  },
];

const installationSteps = [
  { number: '01', title: 'Baixe', text: 'Baixe o instalador Windows disponibilizado pela Platform.', icon: <ArrowDownToLine size={18} /> },
  { number: '02', title: 'Instale', text: 'Execute o CMD no computador autorizado e informe o código de pareamento.', icon: <Package size={18} /> },
  { number: '03', title: 'Conecte', text: 'O agente envia métricas ao servidor Platform na rede local.', icon: <Network size={18} /> },
  { number: '04', title: 'Monitore', text: 'As informações coletadas ficam disponíveis para análise no ARGUS.', icon: <Activity size={18} /> },
];

export const Download: React.FC = () => {
  const defaultServerUrl = import.meta.env.VITE_PLATFORM_SERVER_URL
    || `${window.location.protocol}//${window.location.hostname}:3000`;
  const [platformServerUrl, setPlatformServerUrl] = useState(defaultServerUrl);
  const serverUrlMatch = platformServerUrl.trim().match(/^https?:\/\/(?:[a-zA-Z0-9.-]+|\[[a-fA-F0-9:]+\])(?::([0-9]{1,5}))?$/);
  const serverPort = serverUrlMatch?.[1];
  const serverUrlIsValid = Boolean(serverUrlMatch) && (!serverPort || (Number(serverPort) >= 1 && Number(serverPort) <= 65535));
  const installerUrl = `/downloads/ARGUS.cmd?server=${encodeURIComponent(platformServerUrl.trim())}`;

  return (
    <div className="page-wrapper download-page">
      <header className="download-page-heading">
        <div><span className="section-label">AGENTE ARGUS</span><h1>Baixe o agente ARGUS</h1><p>Instale o agente ARGUS nos computadores que serão integrados ao sistema de monitoramento.</p></div>
        <span className="download-role-note"><Network size={16} /> Integração entre computadores e plataforma</span>
      </header>

      <section className="download-agent-card" aria-labelledby="agent-title">
        <div className="download-agent-main">
          <div className="download-agent-icon"><Package size={26} /></div>
          <div className="download-agent-title-row"><div><span className="download-eyebrow">INSTALADOR DA PLATFORM</span><h2 id="agent-title">ARGUS para Windows</h2></div><span className="download-release-badge"><Shield size={13} /> Instalador guiado</span></div>
          <p className="download-agent-description">Baixe o instalador no computador que será conectado ao servidor Platform. O assistente pede o código de pareamento de uso único gerado no painel Platform.</p>
          <label className="download-server-field">Endereço do servidor Platform<input value={platformServerUrl} onChange={(event) => setPlatformServerUrl(event.target.value)} placeholder="http://192.168.1.10:3000" inputMode="url" aria-invalid={!serverUrlIsValid} /></label>
          <div className="download-spec-grid" aria-label="Componentes do instalador">
            <div className="download-spec"><span><Package size={14} /> Componentes</span><strong>Agente + assistente</strong></div>
            <div className="download-spec"><span><CalendarDays size={14} /> Configuração</span><strong>Guiada no navegador</strong></div>
            <div className="download-spec"><span><Monitor size={14} /> Compatibilidade</span><strong>Windows 10 / 11</strong></div>
            <div className="download-spec"><span><HardDrive size={14} /> Distribuição</span><strong>Arquivo CMD</strong></div>
          </div>
          <div className="download-action-row">{serverUrlIsValid ? <a className="btn-download-pill download-demo-button" href={installerUrl}><ArrowDownToLine size={17} />Baixar instalador</a> : <button className="btn-download-pill download-demo-button download-not-available" type="button" disabled><ArrowDownToLine size={17} />Informe um endereço válido</button>}<span className="download-action-caption">Gera o instalador da Platform para este servidor</span></div>
          <p className="download-feedback visible" role="status">O arquivo baixa os componentes do agente; ele não instala o servidor MySQL nem configura um servidor remoto.</p>
        </div>
        <aside className="download-availability"><span className="availability-icon"><Shield size={17} /></span><div><strong>Conexão autenticada e assistida</strong><p>Execute o arquivo no endpoint autorizado. O instalador obtém os componentes pela Platform e abre o assistente local para conectar o computador com o código de pareamento gerado no painel.</p></div></aside>
        <p className="download-data-note">O servidor Platform e o MySQL devem estar ativos na rede quando você executar o instalador.</p>
      </section>

      <section className="section-block download-compatibility" aria-labelledby="compatibility-title">
        <div className="section-header"><span className="section-label">Plataformas previstas</span><h2 id="compatibility-title">Compatibilidade</h2><p className="section-desc">O instalador guiado ARGUS.cmd é compatível com Windows.</p></div>
        <div className="download-platform-grid"><article className="download-platform-card"><span className="platform-icon"><Monitor size={20} /></span><div><h3>Windows</h3><p>Windows 10 / 11</p></div><span className="platform-status">Indicado</span></article><article className="download-platform-card"><span className="platform-icon"><Cpu size={20} /></span><div><h3>Linux</h3><p>Execução manual com Node.js; sem instalador guiado</p></div><span className="platform-status">Manual</span></article></div>
        <p className="download-platform-note">Em outros sistemas, o agente pode ser iniciado manualmente com Node.js; a medição foreground depende do watcher do Windows.</p>
      </section>

      <section className="section-block download-history" aria-labelledby="history-title">
        <div className="section-header"><span className="section-label">Registro de alterações</span><h2 id="history-title">Histórico de versões</h2><p className="section-desc">Confira as principais alterações e melhorias atribuídas às versões do agente ARGUS nesta demonstração.</p></div>
        <div className="download-timeline">{releaseHistory.map((release, index) => <article className={`download-release-card ${release.latest ? 'latest' : ''}`} key={release.version} style={{ '--release-order': index } as React.CSSProperties}><div className="release-marker" aria-hidden="true"><span /></div><div className="release-card-heading"><div><span className="release-tag">{release.label}</span><h3>{release.version}</h3></div>{release.latest && <span className="release-latest"><Check size={13} /> Mais recente</span>}</div><div className="release-date">{release.date ?? 'Data não informada'}</div><ul>{release.changes.map((change) => <li key={change}><Check size={14} />{change}</li>)}</ul><p className="release-demo-note">Informações de versão demonstrativas</p></article>)}</div>
      </section>

      <section className="section-block download-howto" aria-labelledby="howto-title">
        <div className="section-header"><span className="section-label">Fluxo previsto</span><h2 id="howto-title">Como funciona</h2><p className="section-desc">Etapas de instalação e conexão do agente à Platform.</p></div>
        <div className="download-steps-grid">{installationSteps.map((step) => <article className="download-step-card" key={step.number}><span className="step-number">{step.number}</span><span className="step-icon">{step.icon}</span><h3>{step.title}</h3><p>{step.text}</p></article>)}</div>
        <p className="download-flow-note">O instalador é obtido de uma Platform em execução. Gere um código de pareamento no painel antes de conectar o computador.</p>
      </section>

      <section className="download-distribution-note"><span><Shield size={18} /></span><div><span className="section-label">USO RESPONSÁVEL</span><h2>Distribuição e segurança</h2><p>Distribua o agente de forma controlada e utilize-o de acordo com as políticas, autorizações e práticas de segurança da sua organização. O botão baixa o CMD gerado pela Platform informada acima. Execute-o somente em um computador autorizado.</p></div></section>
    </div>
  );
};

export default Download;
