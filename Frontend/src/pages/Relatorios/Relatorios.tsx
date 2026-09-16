import React from 'react';
import { FileBarChart, Download } from 'lucide-react';

export const Relatorios: React.FC = () => {
  return (
    <div className="page-wrapper">
      <div className="section-header">
        <span className="section-label">Exportação</span>
        <h2>Relatórios Consolidados</h2>
      </div>

      <div className="cards-grid grid-3">
        <div className="info-card border-glow">
          <FileBarChart size={32} />
          <h3>Relatório Semanal de Produtividade</h3>
          <p>Métricas de uso por equipe referentes aos últimos 7 dias.</p>
          <button className="btn btn-primary"><Download size={16} /> Baixar PDF</button>
        </div>

        <div className="info-card border-glow">
          <FileBarChart size={32} />
          <h3>Inventário de Hardware</h3>
          <p>Status atual do desempenho e carga das máquinas.</p>
          <button className="btn btn-primary"><Download size={16} /> Baixar CSV</button>
        </div>
      </div>
    </div>
  );
};