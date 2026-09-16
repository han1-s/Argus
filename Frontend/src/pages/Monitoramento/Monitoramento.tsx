import React from 'react';
import { Globe, AppWindow } from 'lucide-react';
import { MOCK_ACTIVITIES } from '../../services/mockData';

export const Monitoramento: React.FC = () => {
  return (
    <div className="page-wrapper">
      <div className="section-header">
        <span className="section-label">Análise de Uso</span>
        <h2>Monitoramento de Produtividade</h2>
      </div>

      <div className="cards-grid grid-2">
        <div className="section-block dark-bg-box">
          <h3><AppWindow size={20} /> Aplicações Principais</h3>
          <ul className="plan-features">
            {MOCK_ACTIVITIES.filter(a => a.type === 'app').map(a => (
              <li key={a.id}><strong>{a.name}</strong> - {a.durationMinutes} min ({a.category})</li>
            ))}
          </ul>
        </div>

        <div className="section-block dark-bg-box">
          <h3><Globe size={20} /> Web / Domínios Acessados</h3>
          <ul className="plan-features">
            {MOCK_ACTIVITIES.filter(a => a.type === 'website').map(a => (
              <li key={a.id}><strong>{a.name}</strong> - {a.durationMinutes} min ({a.category})</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};