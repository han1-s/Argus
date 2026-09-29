import React, { useEffect, useRef, useState } from 'react';
import { Eye, EyeOff, KeyRound, Mail, UserRound } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { signInArgus } from '../../services/argusAuth';

type AuthMode = 'login' | 'register';
type FieldName = 'name' | 'email' | 'password';
type AuthErrors = Partial<Record<FieldName, string>>;

interface AuthFormProps { mode: AuthMode }

export const AuthForm: React.FC<AuthFormProps> = ({ mode }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const isRegister = mode === 'register';
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<AuthErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [feedbackSuccess, setFeedbackSuccess] = useState(false);
  const timers = useRef<number[]>([]);

  useEffect(() => () => timers.current.forEach((timer) => window.clearTimeout(timer)), []);

  const validate = (): boolean => {
    const nextErrors: AuthErrors = {};
    const normalizedEmail = email.trim();
    if (isRegister && !name.trim()) nextErrors.name = 'Informe seu nome completo.';
    if (!normalizedEmail) nextErrors.email = 'Informe seu e-mail corporativo.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) nextErrors.email = 'Digite um e-mail válido.';
    if (!password) nextErrors.password = isRegister ? 'Crie uma senha para continuar.' : 'Digite uma senha.';
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting || !validate()) return;
    setSubmitting(true);
    setFeedback(isRegister ? 'Preparando cadastro demonstrativo...' : 'Preparando acesso demonstrativo...');
    setFeedbackSuccess(false);

    timers.current.push(window.setTimeout(() => {
      signInArgus({ ...(isRegister ? { name: name.trim() } : {}), email: email.trim() });
      setFeedback(isRegister ? 'Sessão demonstrativa criada.' : 'Sessão demonstrativa iniciada.');
      setFeedbackSuccess(true);
      setSubmitting(false);
      const requestedRedirect = new URLSearchParams(location.search).get('redirect') || '/';
      const redirect = requestedRedirect.startsWith('/') && !requestedRedirect.startsWith('//') ? requestedRedirect : '/';
      timers.current.push(window.setTimeout(() => navigate(redirect), 450));
    }, 500));
  };

  const updateField = (field: FieldName, value: string) => {
    if (field === 'name') setName(value);
    if (field === 'email') setEmail(value);
    if (field === 'password') setPassword(value);
    setErrors((current) => ({ ...current, [field]: undefined }));
    if (feedback && !feedbackSuccess) setFeedback('');
  };

  return (
    <section className={`auth-form-card argus-auth-card ${isRegister ? 'auth-register-card' : 'auth-login-card'}`}>
      <div className="auth-card-heading"><span className="auth-card-kicker"><KeyRound size={14} /> ACESSO À PLATAFORMA</span><h1>{isRegister ? 'Criar conta no ARGUS' : 'Acessar o ARGUS'}</h1><p>{isRegister ? 'Crie sua conta para começar a utilizar a plataforma.' : 'Entre na sua conta para acessar sua experiência no ARGUS.'}</p></div>
      <form className="argus-auth-form" onSubmit={handleSubmit} noValidate>
        {isRegister && <div className="argus-auth-field"><label htmlFor="signup-name">Nome completo</label><div className={`argus-auth-input-wrap ${errors.name ? 'has-error' : ''}`}><UserRound size={17} aria-hidden="true" /><input id="signup-name" name="name" type="text" placeholder="Seu nome completo" autoComplete="name" value={name} onChange={(event) => updateField('name', event.target.value)} aria-invalid={Boolean(errors.name)} aria-describedby={errors.name ? 'signup-name-error' : undefined} /></div>{errors.name && <p className="argus-auth-error" id="signup-name-error" role="alert">{errors.name}</p>}</div>}
        <div className="argus-auth-field"><label htmlFor={`${mode}-email`}>E-mail corporativo</label><div className={`argus-auth-input-wrap ${errors.email ? 'has-error' : ''}`}><Mail size={17} aria-hidden="true" /><input id={`${mode}-email`} name="email" type="email" placeholder="seu.email@empresa.com" autoComplete="email" value={email} onChange={(event) => updateField('email', event.target.value)} aria-invalid={Boolean(errors.email)} aria-describedby={errors.email ? `${mode}-email-error` : undefined} /></div>{errors.email && <p className="argus-auth-error" id={`${mode}-email-error`} role="alert">{errors.email}</p>}</div>
        <div className="argus-auth-field"><label htmlFor={`${mode}-password`}>Senha</label><div className={`argus-auth-input-wrap ${errors.password ? 'has-error' : ''}`}><KeyRound size={17} aria-hidden="true" /><input id={`${mode}-password`} name="password" type={showPassword ? 'text' : 'password'} placeholder="Digite sua senha" autoComplete={isRegister ? 'new-password' : 'current-password'} value={password} onChange={(event) => updateField('password', event.target.value)} aria-invalid={Boolean(errors.password)} aria-describedby={errors.password ? `${mode}-password-error` : undefined} /><button className="auth-password-toggle" type="button" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'} aria-pressed={showPassword}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></div>{errors.password && <p className="argus-auth-error" id={`${mode}-password-error`} role="alert">{errors.password}</p>}</div>
        <button type="submit" className="btn btn-primary btn-block argus-auth-submit" disabled={submitting}>{submitting ? (isRegister ? 'Criando conta...' : 'Entrando...') : (isRegister ? 'Criar conta' : 'Entrar')}</button>
        <p className={`argus-auth-feedback ${feedback ? 'is-visible' : ''} ${feedbackSuccess ? 'is-success' : ''}`} role="status" aria-live="polite">{feedback}</p>
      </form>
      <p className="argus-auth-switch">{isRegister ? 'Já possui uma conta?' : 'Ainda não possui uma conta?'} <Link to={isRegister ? '/login' : '/cadastro'}>{isRegister ? 'Fazer login' : 'Cadastre-se'}</Link></p>
      <div className="auth-demo-disclosure"><span>Modo demonstração</span><p>A autenticação utiliza armazenamento local e ainda não está conectada a um servidor.</p></div>
    </section>
  );
};
