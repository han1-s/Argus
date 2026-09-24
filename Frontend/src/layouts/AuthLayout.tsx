import React from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { continueAsGuest } from '../services/argusAuth';

export const AuthLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleSkip = () => {
    continueAsGuest();
    const redirect = new URLSearchParams(location.search).get('redirect') || '/dashboard';
    navigate(redirect);
  };

  return (
    <div className="auth-container">
      <div className="auth-brand">
        <Link to="/" className="logo-top float-glow-anim">Argus</Link>
      </div>
      <div className="auth-box">
        <Outlet />
      </div>
      <button className="auth-skip-button" type="button" onClick={handleSkip}>
        Pular por enquanto
      </button>
    </div>
  );
};
