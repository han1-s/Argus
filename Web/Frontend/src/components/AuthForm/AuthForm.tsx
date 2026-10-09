import React, { useEffect, useRef, useState } from 'react';
import { Eye, EyeOff, KeyRound, Mail, UserRound } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { getArgusTerms, loginArgus, registerArgus, requestArgusPasswordReset, resetArgusPassword, signInArgus } from '../../services/argusAuth';

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
  const [termsVersion, setTermsVersion] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [webConsent, setWebConsent] = useState(false);
  const [termsError, setTermsError] = useState('');
  const [recoveryOpen, setRecoveryOpen] = useState(false);
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [recoveryCode, setRecoveryCode] = useState('');
  const [recoveryPassword, setRecoveryPassword] = useState('');
  const [recoveryMessage, setRecoveryMessage] = useState('');
  const [recoveryError, setRecoveryError] = useState('');
  const [recoveryCodeSent, setRecoveryCodeSent] = useState(false);
  const timers = useRef<number[]>([]);

  useEffect(() => {
    let active = true;
    const activeTimers = timers.current;
    getArgusTerms().then((terms) => {
      if (active) setTermsVersion(terms.version);
    }).catch((error: unknown) => {
      if (active) setFeedback(error instanceof Error ? error.message : 'Não foi possível conectar ao servidor.');
    });
    return () => {
      active = false;
      activeTimers.forEach((timer) => window.clearTimeout(timer));
    };
  }, []);

  const validate = (): boolean => {
    const nextErrors: AuthErrors = {};
    const normalizedEmail = email.trim();
    if (isRegister && !name.trim()) nextErrors.name = 'Informe seu nome completo.';
    if (!normalizedEmail) nextErrors.email = 'Informe seu e-mail corporativo.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) nextErrors.email = 'Digite um e-mail válido.';
    if (!password) nextErrors.password = isRegister ? 'Crie uma senha para continuar.' : 'Digite uma senha.';
    else if (isRegister && password.length < 10) nextErrors.password = 'Use uma senha com pelo menos 10 caracteres.';
    setErrors(nextErrors);
    setTermsError(termsAccepted ? '' : 'Aceite os termos atuais para continuar.');
    return Object.keys(nextErrors).length === 0 && termsAccepted && Boolean(termsVersion);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting || !validate()) return;
    setSubmitting(true);
    setFeedback(isRegister ? 'Criando sua conta...' : 'Validando suas credenciais...');
    setFeedbackSuccess(false);
    try {
      const user = isRegister
        ? await registerArgus(name.trim(), email.trim(), password, termsVersion, webConsent)
        : await loginArgus(email.trim(), password, termsVersion);
      signInArgus({ name: user.name, email: user.email });
      setFeedback(isRegister ? 'Conta criada com sucesso.' : 'Login realizado com sucesso.');
      setFeedbackSuccess(true);
      setSubmitting(false);
      const requestedRedirect = new URLSearchParams(location.search).get('redirect') || '/';
      const redirect = requestedRedirect.startsWith('/') && !requestedRedirect.startsWith('//') ? requestedRedirect : '/';
      timers.current.push(window.setTimeout(() => navigate(redirect), 450));
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : 'Não foi possível autenticar. Tente novamente.');
      setSubmitting(false);
    }
  };

  const handleRecoveryRequest = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setRecoveryError('');
    try {
      const result = await requestArgusPasswordReset(recoveryEmail.trim());
      setRecoveryMessage(result.simulatedEmail
        ? `Simulação de e-mail para ${result.simulatedEmail.to}. Código: ${result.simulatedEmail.code}. Válido por ${result.simulatedEmail.expiresInMinutes} minutos.`
        : result.message);
      setRecoveryCodeSent(Boolean(result.simulatedEmail));
    } catch (error) {
      setRecoveryError(error instanceof Error ? error.message : 'Não foi possível preparar a simulação de e-mail.');
    }
  };

  const handlePasswordReset = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setRecoveryError('');
    try {
      await resetArgusPassword(recoveryEmail.trim(), recoveryCode.trim(), recoveryPassword);
      setRecoveryMessage('Senha alterada. Você já pode entrar com a nova senha.');
      setRecoveryCodeSent(false);
      setRecoveryOpen(false);
      setPassword('');
    } catch (error) {
      setRecoveryError(error instanceof Error ? error.message : 'Não foi possível redefinir a senha.');
    }
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
        <label className="auth-terms-check"><input type="checkbox" checked={termsAccepted} onChange={(event) => setTermsAccepted(event.target.checked)} /><span>Li e aceito os <a href="/terms.html" target="_blank" rel="noreferrer">Termos de Uso e Aviso de Privacidade</a>.</span></label>
        {isRegister && <label className="auth-terms-check"><input type="checkbox" checked={webConsent} onChange={(event) => setWebConsent(event.target.checked)} /><span>Opcional: autorizo a coleta de domínios de navegação.</span></label>}
        {termsError && <p className="argus-auth-error" role="alert">{termsError}</p>}
        <button type="submit" className="btn btn-primary btn-block argus-auth-submit" disabled={submitting || !termsVersion}>{submitting ? (isRegister ? 'Criando conta...' : 'Entrando...') : (isRegister ? 'Criar conta' : 'Entrar')}</button>
        <p className={`argus-auth-feedback ${feedback ? 'is-visible' : ''} ${feedbackSuccess ? 'is-success' : ''}`} role="status" aria-live="polite">{feedback}</p>
      </form>
      {!isRegister && <button className="auth-forgot-link" type="button" onClick={() => { setRecoveryOpen((open) => !open); setRecoveryEmail(email); setRecoveryError(''); setRecoveryMessage(''); setRecoveryCodeSent(false); }}>{recoveryOpen ? 'Cancelar recuperação' : 'Esqueci a senha'}</button>}
      {recoveryOpen && <section className="auth-recovery-panel" aria-label="Recuperar senha"><h2>Recuperar acesso</h2><p>Vamos simular o envio de um código de recuperação para seu e-mail.</p>
        {!recoveryCodeSent ? <form className="argus-auth-form" onSubmit={handleRecoveryRequest}><label className="argus-auth-field"><span>E-mail da conta</span><div className="argus-auth-input-wrap"><Mail size={17} aria-hidden="true" /><input type="email" autoComplete="email" value={recoveryEmail} onChange={(event) => setRecoveryEmail(event.target.value)} required /></div></label><button type="submit" className="btn btn-secondary btn-block">Simular envio do e-mail</button></form> : <form className="argus-auth-form" onSubmit={handlePasswordReset}><label className="argus-auth-field"><span>Código de 6 dígitos</span><div className="argus-auth-input-wrap"><KeyRound size={17} aria-hidden="true" /><input inputMode="numeric" pattern="[0-9]{6}" maxLength={6} value={recoveryCode} onChange={(event) => setRecoveryCode(event.target.value)} required /></div></label><label className="argus-auth-field"><span>Nova senha</span><div className="argus-auth-input-wrap"><KeyRound size={17} aria-hidden="true" /><input type="password" minLength={10} autoComplete="new-password" value={recoveryPassword} onChange={(event) => setRecoveryPassword(event.target.value)} required /></div></label><button type="submit" className="btn btn-primary btn-block">Redefinir senha</button></form>}
        {recoveryMessage && <p className="auth-recovery-message" role="status">{recoveryMessage}</p>}{recoveryError && <p className="argus-auth-error" role="alert">{recoveryError}</p>}
      </section>}
      <p className="argus-auth-switch">{isRegister ? 'Já possui uma conta?' : 'Ainda não possui uma conta?'} <Link to={isRegister ? '/login' : '/cadastro'}>{isRegister ? 'Fazer login' : 'Cadastre-se'}</Link></p>
    </section>
  );
};
