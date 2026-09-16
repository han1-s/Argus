import React, { useState } from 'react';
import { Search, Monitor } from 'lucide-react';
import { MOCK_COMPUTERS } from '../../services/mockData';

export const Computadores: React.FC = () => {
  const [search, setSearch] = useState('');

  const filtered = MOCK_COMPUTERS.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    c.user.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="page-wrapper">
      <div className="section-header">
        <span className="section-label">Gerenciamento</span>
        <h2>Computadores Monitorados</h2>
      </div>

      <div className="search-bar-container">
        <Search size={18} />
        <input 
          type="text" 
          placeholder="Buscar por computador ou usuário..." 
          value={search} 
          onChange={e => setSearch(e.target.value)} 
        />
      </div>

      <div className="cards-grid grid-3">
        {filtered.map(comp => (
          <div key={comp.id} className="info-card border-glow">
            <div className="card-header-flex">
              <Monitor size={24} />
              <span className={`status-pill ${comp.status}`}>{comp.status}</span>
            </div>
            <h3>{comp.name}</h3>
            <p><strong>Usuário:</strong> {comp.user}</p>
            <p><strong>SO:</strong> {comp.os}</p>
            <div className="usage-bars">
              <label>CPU: {comp.cpuUsage}%</label>
              <div className="progress-bar-bg"><div className="progress-bar-fill" style={{ width: `${comp.cpuUsage}%` }}></div></div>
              <label>RAM: {comp.ramUsage}%</label>
              <div className="progress-bar-bg"><div className="progress-bar-fill" style={{ width: `${comp.ramUsage}%` }}></div></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};