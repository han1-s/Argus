import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { DashboardLayout } from './layouts/DashboardLayout';
import { AuthLayout } from './layouts/AuthLayout';

import { Home } from './pages/Home/Home';
import { SaibaMais } from './pages/SaibaMais/SaibaMais';
import { Monetizacao } from './pages/Monetizacao/Monetizacao';
import Download from './pages/Download';
import { Configuracoes } from './pages/Configuracoes/Configuracoes';

import { Dashboard } from './pages/Dashboard/Dashboard';
import { Computadores } from './pages/Computadores/Computadores';
import { Monitoramento } from './pages/Monitoramento/Monitoramento';
import { Relatorios } from './pages/Relatorios/Relatorios';
import { Login } from './pages/Login/Login';
import { Cadastro } from './pages/Cadastro/Cadastro';
import { applyArgusPreferences } from './services/argusPreferences';
import { AuthGate } from './components/AuthGate/AuthGate';

export const App: React.FC = () => {
  useEffect(() => {
    applyArgusPreferences();
    const handleStorage = () => applyArgusPreferences();
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<Login />} />
          <Route path="/cadastro" element={<Cadastro />} />
        </Route>

        <Route element={<DashboardLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/computadores" element={<Computadores />} />
          <Route path="/monitoramento" element={<AuthGate><Monitoramento /></AuthGate>} />
          <Route path="/relatorios" element={<Relatorios />} />
          <Route path="/saiba-mais" element={<SaibaMais />} />
          <Route path="/monetizacao" element={<AuthGate><Monetizacao /></AuthGate>} />
          <Route path="/download" element={<Download />} />
          <Route path="/configuracoes" element={<Configuracoes />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;