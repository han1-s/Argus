import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { ArgusBrand } from '../components/ArgusBrand/ArgusBrand';
import { continueAsGuest } from '../services/argusAuth';
import './AuthLayout.css';

export const AuthLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleSkip = () => {
    continueAsGuest();
    navigate('/');
  };

  return (
    <main className="auth-container argus-auth-page">
      <Link to="/" className="auth-brand-link" aria-label="ARGUS — página inicial"><ArgusBrand /></Link>
      <div className="auth-box argus-auth-box route-page-transition" key={location.key}><Outlet /></div>
      <Link className="auth-home-link argus-auth-home-link" to="/"><ArrowLeft size={15} /> Voltar para a página inicial</Link>
      <div className="auth-guest-option"><span>Quer conhecer antes de entrar?</span><button className="auth-skip-button argus-auth-skip" type="button" onClick={handleSkip}>Pular por enquanto</button></div>
    </main>
  );
};
