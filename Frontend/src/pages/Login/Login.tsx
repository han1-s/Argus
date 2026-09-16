import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { signInArgus } from '../../services/argusAuth';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    signInArgus();
    const redirect = new URLSearchParams(location.search).get('redirect') || '/dashboard';
    navigate(redirect);
  };

  return (
    <div className="auth-form-card">
      <h2>Acessar o Argus</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>E-mail corporativo</label>
          <input type="email" placeholder="nome@empresa.com" required />
        </div>
        <div className="form-group">
          <label>Senha</label>
          <input type="password" placeholder="••••••••" required />
        </div>
        <button type="submit" className="btn btn-primary btn-block">Entrar</button>
      </form>
      <p className="auth-footer-text">
        Não tem conta? <Link to="/cadastro">Cadastre-se</Link>
      </p>
    </div>
  );
};