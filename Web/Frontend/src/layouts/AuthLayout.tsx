import React, { useLayoutEffect } from 'react';
import { Activity, ArrowLeft, BarChart3, Eye, Monitor } from 'lucide-react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { ArgusBrand } from '../components/ArgusBrand/ArgusBrand';
import { continueAsGuest } from '../services/argusAuth';
import './AuthLayout.css';

export const AuthLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useLayoutEffect(() => {
    const previousScrollRestoration = window.history.scrollRestoration;
    window.history.scrollRestoration = 'manual';

    return () => {
      window.history.scrollRestoration = previousScrollRestoration;
    };
  }, []);

  useLayoutEffect(() => {
    const root = document.documentElement;
    const previousScrollBehavior = root.style.scrollBehavior;

    root.style.scrollBehavior = 'auto';
    root.scrollTop = 0;
    document.body.scrollTop = 0;
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    root.style.scrollBehavior = previousScrollBehavior;
  }, [location.pathname]);

  const handleSkip = () => {
    continueAsGuest();
    navigate('/');
  };

  return (
    <main className="auth-container argus-auth-page">
      <section className="auth-showcase" aria-label="Conheça o ARGUS">
        <Link to="/" className="auth-brand-link" aria-label="ARGUS — página inicial"><ArgusBrand /></Link>
        <div className="auth-showcase-copy">
          <span className="auth-showcase-kicker">MONITORAMENTO E ANÁLISE DE COMPUTADORES</span>
          <h1>Tenha uma visão<br />mais clara da sua<br /><span>operação.</span></h1>
          <p>O ARGUS reúne informações dos computadores monitorados para facilitar a gestão e a análise.</p>
        </div>
        <div className="auth-showcase-visual" aria-hidden="true">
          <span className="auth-observatory-ring auth-ring-outer" />
          <span className="auth-observatory-ring auth-ring-inner" />
          <div className="auth-orbit-core"><Eye size={34} strokeWidth={1.5} /></div>
          <div className="auth-visual-node auth-node-one"><Monitor size={17} /><span>Dispositivos</span></div>
          <div className="auth-visual-node auth-node-two"><Activity size={17} /><span>Dados organizados</span></div>
          <div className="auth-visual-node auth-node-three"><BarChart3 size={17} /><span>Análise visual</span></div>
          <span className="auth-orbit-point auth-point-one" /><span className="auth-orbit-point auth-point-two" />
          <span className="auth-orbit-point auth-point-three" /><span className="auth-orbit-point auth-point-four" />
          <span className="auth-orbit-point auth-point-five" /><span className="auth-orbit-point auth-point-six" />
          <span className="auth-orbit-point auth-point-seven" />
        </div>
        <div className="auth-showcase-foot"><span>MONITORAMENTO AUTORIZADO</span><span>ARGUS · ENDPOINT INTELLIGENCE</span></div>
      </section>
      <section className="auth-side" aria-label="Acesso à sua conta">
        <div className="auth-side-content">
          <div className="auth-box argus-auth-box route-page-transition" key={location.key}><Outlet /></div>
          <Link className="auth-home-link argus-auth-home-link" to="/"><ArrowLeft size={15} /> Voltar para a página inicial</Link>
          <div className="auth-guest-option"><span>Quer conhecer antes de entrar?</span><button className="auth-skip-button argus-auth-skip" type="button" onClick={handleSkip}>Pular por enquanto</button></div>
        </div>
      </section>
    </main>
  );
};
