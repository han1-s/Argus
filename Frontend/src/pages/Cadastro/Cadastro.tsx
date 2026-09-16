import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { signInArgus } from '../../services/argusAuth';

export const Cadastro: React.FC = () => {
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
      <h2>Criar Conta Argus</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Nome Completo</label>
          <input type="text" placeholder="Seu nome" required />
        </div>
        <div className="form-group">
          <label>E-mail Corporativo</label>
          <input type="email" placeholder="nome@empresa.com" required />
        </div>
        <div className="form-group">
          <label>Senha</label>
          <input type="password" placeholder="••••••••" required />
        </div>
        <button type="submit" className="btn btn-primary btn-block">Criar Conta</button>
      </form>
      <p className="auth-footer-text">
        Já tem uma conta? <Link to="/login">Fazer Login</Link>
      </p>
    </div>
  );
};