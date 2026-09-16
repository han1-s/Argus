import React from 'react';
import { Link } from 'react-router-dom';

export const Footer: React.FC = () => {
  return (
    <footer className="main-footer">
      <div className="footer-container">
        <div className="footer-brand">
          <Link to="/" className="logo-top">Argus</Link>
          <p>Sistema Avançado de Monitoramento Inteligente</p>
        </div>
        <div className="footer-links">
          <Link to="/">Início</Link>
          <Link to="/saiba-mais">Saiba Mais</Link>
          <Link to="/monetizacao">Planos</Link>
          <Link to="/download">Download</Link>
        </div>
      </div>
      <div className="footer-bottom">
        <p>&copy; 2026 Argus Inc. Todos os direitos reservados.</p>
      </div>
    </footer>
  );
};