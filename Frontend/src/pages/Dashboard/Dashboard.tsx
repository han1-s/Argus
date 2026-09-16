import React from 'react';
import { Monitor, Activity, ShieldAlert, Cpu } from 'lucide-react';
import { MOCK_COMPUTERS, MOCK_ACTIVITIES } from '../../services/mockData';

export const Dashboard: React.FC = () => {
  return (
    <div className="page-wrapper">
      <div className="section-header">
        <span className="section-label">Visão Geral</span>
        <h2>Painel de Controle</h2>
      </div>

      <div className="cards-grid grid-4">
        <div className="info-card border-glow">
          <div className="card-icon-wrapper"><Monitor size={20} /></div>
          <h3>Total Dispositivos</h3>
          <p className="stat-number">{MOCK_COMPUTERS.length}</p>
        </div>
        <div className="info-card border-glow">
          <div className="card-icon-wrapper"><Activity size={20} /></div>
          <h3>Máquinas Ativas</h3>
          <p className="stat-number">{MOCK_COMPUTERS.filter(c => c.status === 'online').length}</p>
        </div>
        <div className="info-card border-glow">
          <div className="card-icon-wrapper"><ShieldAlert size={20} /></div>
          <h3>Alertas</h3>
          <p className="stat-number text-warning">{MOCK_COMPUTERS.filter(c => c.status === 'alert').length}</p>
        </div>
        <div className="info-card border-glow">
          <div className="card-icon-wrapper"><Cpu size={20} /></div>
          <h3>Uso Médio CPU</h3>
          <p className="stat-number">38%</p>
        </div>
      </div>

      <section className="section-block dark-bg-box">
        <h3>Atividades Recentes</h3>
        <div className="table-responsive">
          <table className="comparison-table">
            <thead>
              <tr>
                <th>Aplicação / Site</th>
                <th>Categoria</th>
                <th>Duração</th>
                <th>Impacto</th>
              </tr>
            </thead>
            <tbody>
              {MOCK_ACTIVITIES.map((act) => (
                <tr key={act.id}>
                  <td>{act.name}</td>
                  <td>{act.category}</td>
                  <td>{act.durationMinutes} min</td>
                  <td>
                    <span className={`status-badge ${act.impact}`}>
                      {act.impact === 'productive' ? 'Produtivo' : 'Não Produtivo'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};