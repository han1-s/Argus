import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LockKeyhole } from 'lucide-react';
import { isArgusAuthenticated } from '../../services/argusAuth';

interface AuthGateProps {
  children: React.ReactNode;
}

export const AuthGate: React.FC<AuthGateProps> = ({ children }) => {
  const location = useLocation();

  if (isArgusAuthenticated()) return <>{children}</>;

  return (
    <section className="access-gate">
      <div className="access-gate-icon"><LockKeyhole size={28} /></div>
      <span className="section-label">Acesso protegido</span>
      <h1>Entre para acessar esta área</h1>
      <p>Faça login ou crie sua conta para continuar com o monitoramento e os planos do Argus.</p>
      <div className="access-gate-actions">
        <Link className="btn btn-primary" to={`/login?redirect=${encodeURIComponent(location.pathname)}`}>Entrar</Link>
        <Link className="btn btn-secondary" to={`/cadastro?redirect=${encodeURIComponent(location.pathname)}`}>Criar conta</Link>
      </div>
      <p className="access-gate-skip">Você pode continuar sem cadastro pela página inicial.</p>
    </section>
  );
};
