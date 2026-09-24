import React, { useState } from 'react';
import { Search, Monitor, Cpu, HardDrive, MapPin, Network } from 'lucide-react';
import { MOCK_COMPUTERS } from '../../services/mockData';

export const Computadores: React.FC = () => {
  const [search, setSearch] = useState('');
  const filtered = MOCK_COMPUTERS.filter((computer) => `${computer.name} ${computer.user}`.toLowerCase().includes(search.toLowerCase()));
  return <div className="page-wrapper">
    <div className="section-header"><span className="section-label">Gerenciamento</span><h2>Computadores Monitorados</h2><p className="section-desc">Informações demonstrativas das máquinas monitoradas.</p></div>
    <div className="search-bar-container"><Search size={18} /><input type="search" aria-label="Buscar computadores" placeholder="Buscar por computador ou usuário..." value={search} onChange={(event) => setSearch(event.target.value)} /></div>
    <div className="cards-grid grid-3">{filtered.map((computer) => <article key={computer.id} className="info-card border-glow computer-card">
      <div className="card-header-flex"><Monitor size={24} /><span className={`status-pill ${computer.status}`}>{computer.status === 'online' ? 'Online' : computer.status === 'offline' ? 'Offline' : 'Alerta'}</span></div>
      <h3>{computer.name}</h3><p><strong>Usuário:</strong> {computer.user}</p><p><strong>Sistema:</strong> {computer.os}</p>
      <div className="usage-bars"><label>CPU: {computer.cpuUsage}%</label><div className="progress-bar-bg"><div className="progress-bar-fill" style={{ width: `${computer.cpuUsage}%` }} /></div><label>Memória: {computer.ramUsage}%</label><div className="progress-bar-bg"><div className="progress-bar-fill" style={{ width: `${computer.ramUsage}%` }} /></div></div>
      <details className="computer-details"><summary>Ver informações completas</summary><dl>
        <div><dt>Última atividade</dt><dd>{computer.lastActive}</dd></div><div><dt><Network size={14} /> Endereço IP</dt><dd>{computer.ipAddress}</dd></div><div><dt><MapPin size={14} /> Localização</dt><dd>{computer.location}</dd></div><div><dt><Cpu size={14} /> Processador</dt><dd>{computer.processor}</dd></div><div><dt>Memória instalada</dt><dd>{computer.memory}</dd></div><div><dt><HardDrive size={14} /> Armazenamento</dt><dd>{computer.storage}</dd></div><div><dt>Número de série</dt><dd>{computer.serialNumber}</dd></div>
      </dl></details>
    </article>)}</div>
    {filtered.length === 0 && <p role="status">Nenhum computador encontrado.</p>}
  </div>;
};
