import React from 'react';
import { Link } from 'react-router-dom';

export const Footer: React.FC = () => {
  return (
    <footer className="main-footer">
      <div className="footer-container">
        <div className="footer-brand">
          <strong className="footer-brand-wordmark">ARGUS</strong>
          <p>Plataforma de monitoramento e análise de ambientes computacionais.</p>
          <span className="footer-tech">Tecnologias: React · TypeScript · Node.js · MySQL</span>
        </div>
        <div className="footer-links">
          <Link to="/">Início</Link>
          <Link to="/saiba-mais">Saiba Mais</Link>
          <Link to="/monetizacao">Planos</Link>
          <Link to="/download">Download</Link>
        </div>
      </div>
      <div className="footer-bottom">
        <p>&copy; 2026 ARGUS. Todos os direitos reservados.</p>
      </div>
    </footer>
  );
};
