import React, { useState } from 'react';
import { FileBarChart, Download } from 'lucide-react';
import { MOCK_ACTIVITIES, MOCK_COMPUTERS } from '../../services/mockData';

const downloadFile = (fileName: string, contents: string, mimeType: string) => {
  const blob = new Blob(['\uFEFF', contents], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
};

export const Relatorios: React.FC = () => {
  const [lastDownload, setLastDownload] = useState<string | null>(null);
  const exportActivity = () => {
    const rows = [['Aplicativo/Site', 'Categoria', 'Duração (min)', 'Impacto'], ...MOCK_ACTIVITIES.map((row) => [row.name, row.category, String(row.durationMinutes), row.impact])];
    downloadFile('argus-relatorio-semanal.csv', rows.map((row) => row.map((cell) => `"${cell.replaceAll('"', '""')}"`).join(',')).join('\n'), 'text/csv;charset=utf-8');
    setLastDownload('Relatório semanal de produtividade');
  };
  const exportInventory = () => {
    const rows = [['Computador', 'Usuário', 'Sistema', 'Status', 'CPU (%)', 'RAM (%)', 'Última atividade'], ...MOCK_COMPUTERS.map((row) => [row.name, row.user, row.os, row.status, String(row.cpuUsage), String(row.ramUsage), row.lastActive])];
    downloadFile('argus-inventario-hardware.csv', rows.map((row) => row.map((cell) => `"${cell.replaceAll('"', '""')}"`).join(',')).join('\n'), 'text/csv;charset=utf-8');
    setLastDownload('Inventário de hardware');
  };
  return <div className="page-wrapper">
    <div className="section-header"><span className="section-label">Exportação</span><h2>Relatórios Consolidados</h2><p className="section-desc">Arquivos de demonstração criados com os dados simulados do Argus.</p></div>
    <div className="cards-grid grid-3">
      <div className="info-card border-glow"><FileBarChart size={32} /><h3>Relatório Semanal de Produtividade</h3><p>Métricas de uso por equipe referentes aos últimos 7 dias.</p><button className="btn btn-primary" onClick={exportActivity}><Download size={16} /> Baixar CSV</button></div>
      <div className="info-card border-glow"><FileBarChart size={32} /><h3>Inventário de Hardware</h3><p>Status atual do desempenho e carga das máquinas monitoradas.</p><button className="btn btn-primary" onClick={exportInventory}><Download size={16} /> Baixar CSV</button></div>
    </div>
    {lastDownload && <p className="report-download-status" role="status">Download demonstrativo iniciado: {lastDownload}.</p>}
  </div>;
};
