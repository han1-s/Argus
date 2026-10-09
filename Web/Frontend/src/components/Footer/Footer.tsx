import React from 'react';
import { Link } from 'react-router-dom';

export const Footer: React.FC = () => {
  return (
    <footer className="main-footer">
      <div className="footer-container">
        <Link to="/" className="footer-brand-wordmark" aria-label="ARGUS — página inicial">ARGUS</Link>
        <nav className="footer-links" aria-label="Links do rodapé">
          <Link to="/">Início</Link>
          <Link to="/saiba-mais">Saiba Mais</Link>
          <Link to="/monetizacao">Planos</Link>
          <Link to="/download">Download</Link>
        </nav>
      </div>
      <div className="footer-bottom">
        <p>&copy; 2026 ARGUS</p>
      </div>
    </footer>
  );
};
