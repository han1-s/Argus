import React, { useEffect, useState } from 'react';
import { CheckCircle2, Download as DownloadIcon, HardDrive, ShieldCheck, Terminal } from 'lucide-react';

type DownloadState = 'idle' | 'preparing' | 'success';

const updates = [
  { version: 'v2.4.0 - Nova versao', date: '14/08/2026', title: 'Monitoramento Preditivo com IA', text: 'O sistema ficou mais inteligente para encontrar gargalos, com um painel de desempenho em tempo real.', tags: ['Alertas preditivos', 'Otimizacao de memoria RAM'] },
  { version: 'v2.3.1 - Correcoes', date: '28/07/2026', title: 'Estabilidade e Conectividade', text: 'Reconexao automatica mais confiavel quando a rede apresenta oscilacoes.', tags: ['Correcao de logs duplicados', 'Patch de seguranca'] },
  { version: 'v2.3.0 - Novos recursos', date: '10/07/2026', title: 'Suporte Multiplataforma', text: 'Suporte oficial para distribuicoes Linux baseadas em Debian e arquitetura ARM64.', tags: ['Linux', 'ARM64'] },
];

export const Download: React.FC = () => {
  const [downloadState, setDownloadState] = useState<DownloadState>('idle');

  useEffect(() => {
    if (downloadState !== 'success') return;
    const resetTimer = window.setTimeout(() => setDownloadState('idle'), 3000);
    return () => window.clearTimeout(resetTimer);
  }, [downloadState]);

  const handleDownload = () => {
    if (downloadState !== 'idle') return;
    setDownloadState('preparing');
    window.setTimeout(() => setDownloadState('success'), 1000);
  };

  const buttonLabel = downloadState === 'preparing' ? 'Preparando...' : downloadState === 'success' ? 'Download iniciado!' : 'Baixar agora';

  return (
    <div className="page-wrapper">
      <div className="download-grid-layout">
        <section className="download-box-card">
          <div className="card-badge-header">
            <span className="category-tag"><DownloadIcon size={18} /> Download</span>
            <span className="security-tag"><ShieldCheck size={14} /> Verificado e Seguro</span>
          </div>
          <div className="download-main-content">
            <h1 className="download-title">Baixar Argus</h1>
            <p className="download-description">Garanta acesso ao monitoramento e a seguranca em tempo real com o agente Argus.</p>
            <div className="download-action-area">
              <button className={`btn-download-pill ${downloadState === 'success' ? 'download-success' : ''}`} onClick={handleDownload} disabled={downloadState === 'preparing'}>
                {downloadState === 'success' ? <CheckCircle2 size={18} /> : <DownloadIcon size={18} />}
                {buttonLabel}
              </button>
              <span className="download-meta-info"><CheckCircle2 size={14} /> Instalacao direta, sem anuncios</span>
            </div>
            <div className="version-info-grid">
              <div className="info-item"><span className="info-label">Versao</span><span className="info-value">v2.4.0</span></div>
              <div className="info-item"><span className="info-label">Data</span><span className="info-value">14/08/2026</span></div>
              <div className="info-item"><span className="info-label">Compatibilidade</span><span className="info-value">Windows 10/11 e Linux</span></div>
              <div className="info-item"><span className="info-label"><HardDrive size={14} /> Tamanho</span><span className="info-value">45.2 MB</span></div>
            </div>
          </div>
        </section>

        <section className="updates-box-card">
          <div className="updates-header"><h2>Atualizacoes</h2><p className="updates-subtitle">Historico de novidades, correcoes e melhorias do sistema.</p></div>
          <div className="updates-timeline">
            {updates.map((update) => (
              <article className="timeline-entry" key={update.version}>
                <div className="timeline-dot" />
                <div className="timeline-card-content">
                  <div className="version-header"><span className="version-number">{update.version}</span><span className="version-date">{update.date}</span></div>
                  <h3 className="update-title">{update.title}</h3>
                  <p className="update-text">{update.text}</p>
                  <ul className="update-tags">{update.tags.map((tag) => <li key={tag}>{tag}</li>)}</ul>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>

      <section className="section-block dark-bg-box download-terminal-box">
        <h2><Terminal size={20} /> Instalacao via terminal</h2>
        <p>Execute o comando abaixo na maquina com privilegios de superusuario.</p>
        <pre className="code-block"><code>curl -sSL https://get.argus.io/install.sh | bash</code></pre>
      </section>
    </div>
  );
};

export default Download;
