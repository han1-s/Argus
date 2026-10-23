import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Bell, Check, ChevronRight, CircleHelp, CreditCard, Download, Eraser, ExternalLink, FileText, Globe,
  ImagePlus, Languages, Palette, Shield, Sparkles, SunMoon, Trash2, X,
} from 'lucide-react';
import type { SettingsTab, UserSettings } from '../../types';
import {
  ARGUS_KEYS, DEFAULT_USER_EMAIL, DEFAULT_USER_NAME, getArgusProfile, getArgusTheme,
  resetArgusPreferences, setArgusPreference, setArgusTheme,
} from '../../services/argusPreferences';
import { showArgusToast } from '../../services/argusToast';
import { getArgusSubscription, getPlatformNotifications, type ArgusSubscription, type PlatformNotification } from '../../services/argusWebApi';
import { getArgusTerms, isArgusSignedIn, restoreArgusSession, updateArgusProfile } from '../../services/argusAuth';
import './Configuracoes.css';

const SETTINGS_KEY = 'argusSettings';
const defaultSettings: UserSettings = {
  notifSystem: true, notifAi: true, notifUpdates: true, theme: 'dark', language: 'pt-BR', refreshSeconds: 30,
};

function getStoredSettings(): UserSettings {
  try {
    const saved = localStorage.getItem(SETTINGS_KEY);
    const notifications = localStorage.getItem(ARGUS_KEYS.NOTIFS);
    const parsed = saved ? JSON.parse(saved) as Partial<UserSettings> : {};
    const legacyNotifications = notifications ? JSON.parse(notifications) as Partial<UserSettings> : {};
    return { ...defaultSettings, ...legacyNotifications, ...parsed, theme: getArgusTheme(), language: 'pt-BR' };
  } catch {
    return { ...defaultSettings, theme: getArgusTheme() };
  }
}

const tabs: Array<{ id: SettingsTab; label: string; icon: React.ReactNode }> = [
  { id: 'privacy', label: 'Dados e Privacidade', icon: <Shield size={18} /> },
  { id: 'notifications', label: 'Notificações', icon: <Bell size={18} /> },
  { id: 'appearance', label: 'Aparência', icon: <Palette size={18} /> },
  { id: 'system', label: 'Idioma e Horário', icon: <Globe size={18} /> },
  { id: 'billing', label: 'Planos e Cobrança', icon: <CreditCard size={18} /> },
  { id: 'legal', label: 'Termos e Privacidade', icon: <FileText size={18} /> },
];

function optimizeAvatar(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const objectUrl = URL.createObjectURL(file);
    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const scale = Math.min(1, 512 / Math.max(image.naturalWidth, image.naturalHeight));
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
      canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
      const context = canvas.getContext('2d');
      if (!context) { reject(new Error('Não foi possível preparar esta imagem.')); return; }
      context.fillStyle = '#ffffff';
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/jpeg', 0.82));
    };
    image.onerror = () => { URL.revokeObjectURL(objectUrl); reject(new Error('Não foi possível ler esta imagem. Tente outro arquivo.')); };
    image.src = objectUrl;
  });
}

export const Configuracoes: React.FC = () => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('privacy');
  const [settings, setSettings] = useState<UserSettings>(getStoredSettings);
  const [animationsEnabled, setAnimationsEnabled] = useState(() => localStorage.getItem(ARGUS_KEYS.ANIMATIONS) !== 'false');
  const [glowEnabled, setGlowEnabled] = useState(() => localStorage.getItem(ARGUS_KEYS.GLOW) !== 'false');
  const [profile, setProfile] = useState(getArgusProfile);
  const [profileIsSynced, setProfileIsSynced] = useState(isArgusSignedIn);
  const [hasCustomAvatar, setHasCustomAvatar] = useState(() => Boolean(localStorage.getItem(ARGUS_KEYS.AVATAR)));
  const [avatarError, setAvatarError] = useState('');
  const [clearDialogOpen, setClearDialogOpen] = useState(false);
  const [subscription, setSubscription] = useState<ArgusSubscription | null>(null);
  const [platformNotifications, setPlatformNotifications] = useState<PlatformNotification[]>([]);
  const [notificationError, setNotificationError] = useState('');
  const [termsVersion, setTermsVersion] = useState('');
  const [termsError, setTermsError] = useState('');
  const [acceptedTermsVersion] = useState(() => localStorage.getItem('argusTermsAcceptedVersion') || '');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isArgusSignedIn()) return;
    let active = true;
    void restoreArgusSession().then(user => {
      if (!active || !user) return;
      setProfile(getArgusProfile());
      setHasCustomAvatar(Boolean(user.avatarData));
      setProfileIsSynced(true);
    });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;
    if (activeTab === 'billing') {
      getArgusSubscription().then(value => { if (active) setSubscription(value); }).catch(error => {
        if (active) setNotificationError(error instanceof Error ? error.message : 'Não foi possível carregar a assinatura.');
      });
    }
    if (activeTab === 'notifications') {
      const refresh = () => getPlatformNotifications().then(value => {
        if (active) { setPlatformNotifications(value); setNotificationError(''); }
      }).catch(error => {
        if (active) setNotificationError(error instanceof Error ? error.message : 'Não foi possível carregar notificações.');
      });
      void refresh();
      const interval = window.setInterval(refresh, settings.refreshSeconds * 1000);
      return () => { active = false; window.clearInterval(interval); };
    }
    if (activeTab === 'legal') {
      getArgusTerms().then((terms) => { if (active) { setTermsVersion(terms.version); setTermsError(''); } })
        .catch((error) => { if (active) setTermsError(error instanceof Error ? error.message : 'Não foi possível carregar os termos atuais.'); });
    }
    return () => { active = false; };
  }, [activeTab, settings.refreshSeconds]);

  useEffect(() => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    localStorage.setItem(ARGUS_KEYS.NOTIFS, JSON.stringify({
      notifSystem: settings.notifSystem, notifAi: settings.notifAi, notifUpdates: settings.notifUpdates,
    }));
    setArgusTheme(settings.theme);
  }, [settings]);

  useEffect(() => {
    if (!clearDialogOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === 'Escape') setClearDialogOpen(false); };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [clearDialogOpen]);

  const updateSetting = <Key extends keyof UserSettings>(key: Key, value: UserSettings[Key]) => {
    setSettings((current) => ({ ...current, [key]: value }));
    if (key !== 'theme') showArgusToast('Preferências atualizadas.');
  };

  const handleProfileSave = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const name = profile.name.trim();
    const email = profile.email.trim();
    if (!name || !email) {
      showArgusToast('Preencha o nome e o e-mail antes de salvar.');
      return;
    }
    try {
      if (isArgusSignedIn()) {
        await updateArgusProfile(name, email);
        setProfileIsSynced(true);
      } else {
        localStorage.setItem(ARGUS_KEYS.USER_NAME, name);
        localStorage.setItem(ARGUS_KEYS.USER_EMAIL, email);
        window.dispatchEvent(new Event('argus-preferences-changed'));
      }
      setProfile(getArgusProfile());
      showArgusToast(isArgusSignedIn() ? 'Perfil sincronizado com Web e Platform.' : 'Alterações salvas neste navegador.');
    } catch (error) {
      showArgusToast(error instanceof Error ? error.message : 'Não foi possível atualizar o perfil.');
    }
  };

  const handleAvatarChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setAvatarError('Escolha uma imagem JPEG, PNG ou WebP.');
      event.target.value = '';
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setAvatarError('A imagem deve ter no máximo 2 MB. Escolha um arquivo menor.');
      event.target.value = '';
      return;
    }
    event.target.value = '';
    try {
      const avatarData = await optimizeAvatar(file);
      if (isArgusSignedIn()) {
        await updateArgusProfile(profile.name, profile.email, avatarData);
        setProfileIsSynced(true);
      } else {
        localStorage.setItem(ARGUS_KEYS.AVATAR, avatarData);
        window.dispatchEvent(new Event('argus-preferences-changed'));
      }
      setProfile(getArgusProfile());
      setHasCustomAvatar(true);
      setAvatarError('');
      showArgusToast(isArgusSignedIn() ? 'Foto sincronizada com Web e Platform.' : 'Foto salva neste navegador.');
    } catch (error) {
      setAvatarError(error instanceof Error ? error.message : 'Não foi possível salvar a imagem. Tente outro arquivo.');
    }
  };

  const handleAvatarRemove = async () => {
    try {
      if (isArgusSignedIn()) await updateArgusProfile(profile.name, profile.email, null);
      else {
        localStorage.removeItem(ARGUS_KEYS.AVATAR);
        window.dispatchEvent(new Event('argus-preferences-changed'));
      }
      setProfile(getArgusProfile());
      setHasCustomAvatar(false);
      setAvatarError('');
      showArgusToast(isArgusSignedIn() ? 'Foto removida da conta Web e Platform.' : 'Foto removida deste navegador.');
    } catch (error) {
      setAvatarError(error instanceof Error ? error.message : 'Não foi possível remover a foto.');
    }
  };

  const handleExportData = () => {
    const exportSettings = {
      theme: settings.theme,
      notifications: { system: settings.notifSystem, predictiveAi: settings.notifAi, updates: settings.notifUpdates },
      refreshSeconds: settings.refreshSeconds, acceptedTermsVersion,
      animations: animationsEnabled,
      effects: glowEnabled,
      language: settings.language,
    };
    const blob = new Blob([JSON.stringify(exportSettings, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'argus_settings.json';
    anchor.click();
    URL.revokeObjectURL(url);
    showArgusToast('Arquivo de configurações exportado.');
  };

  const handleClearData = () => {
    resetArgusPreferences();
    localStorage.removeItem(SETTINGS_KEY);
    const restored = { ...defaultSettings, theme: getArgusTheme() };
    setSettings(restored);
    setAnimationsEnabled(true);
    setGlowEnabled(true);
    setProfile({ name: DEFAULT_USER_NAME, email: DEFAULT_USER_EMAIL, avatar: '/assets/img/user.png' });
    setHasCustomAvatar(false);
    setAvatarError('');
    setClearDialogOpen(false);
    showArgusToast('Configurações locais restauradas.');
  };

  const handleAnimationsChange = (enabled: boolean) => {
    setAnimationsEnabled(enabled);
    setArgusPreference('ANIMATIONS', enabled);
    showArgusToast('Preferências atualizadas.');
  };

  const handleGlowChange = (enabled: boolean) => {
    setGlowEnabled(enabled);
    setArgusPreference('GLOW', enabled);
    showArgusToast('Preferências atualizadas.');
  };

  const renderToggle = (id: string, title: string, description: string, checked: boolean, onChange: (value: boolean) => void) => (
    <div className="settings-toggle-row" key={id}>
      <div className="settings-toggle-copy"><h3>{title}</h3><p>{description}</p></div>
      <label className="settings-switch"><input id={id} type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} /><span className="settings-switch-track" /><span className="sr-only">{title}</span></label>
    </div>
  );

  return (
    <div className="page-wrapper settings-page-wrapper settings-redesign">
      <header className="settings-page-heading">
        <div><span className="section-label">PREFERÊNCIAS DO ARGUS</span><h1>Configurações</h1><p>Personalize sua experiência no ARGUS e gerencie suas preferências.</p></div>
        <span className="settings-local-note"><Shield size={15} /> {profileIsSynced ? 'Perfil sincronizado entre Web e Platform' : 'Preferências locais deste navegador'}</span>
      </header>

      <div className="settings-container settings-layout">
        <nav className="settings-sidebar" aria-label="Categorias de configurações">
          <span className="settings-nav-caption">PREFERÊNCIAS</span>
          {tabs.map((tab) => <button key={tab.id} type="button" className={`sidebar-nav-item ${activeTab === tab.id ? 'active' : ''}`} aria-current={activeTab === tab.id ? 'page' : undefined} onClick={() => setActiveTab(tab.id)}>{tab.icon}<span>{tab.label}</span><ChevronRight className="settings-nav-chevron" size={15} /></button>)}
          <p className="settings-sidebar-footnote">Estas opções são armazenadas neste navegador, não em um servidor.</p>
        </nav>

        <section className="settings-content-card settings-panel" key={activeTab} aria-live="polite">
          {activeTab === 'privacy' && <div className="settings-tab-content">
            <div className="settings-section-heading"><span className="settings-section-icon"><Shield size={19} /></span><div><h2>Dados e Privacidade</h2><p>Gerencie o perfil e as preferências guardadas neste navegador.</p></div></div>
            <section className="settings-subsection"><div className="settings-subsection-heading"><h3>Foto do perfil</h3><p>{profileIsSynced ? 'Foto compartilhada pela conta Web e Platform. Arquivos de até 2 MB são otimizados antes do envio.' : 'A foto fica neste navegador até você entrar na conta compartilhada. Tamanho máximo: 2 MB.'}</p></div>
              <div className="settings-profile-card"><div className="settings-avatar-preview">{profile.avatar ? <img src={profile.avatar} alt={`Foto de perfil de ${profile.name}`} /> : <span aria-hidden="true">{profile.name.charAt(0).toUpperCase()}</span>}</div><div className="settings-avatar-info"><strong>{profile.name || DEFAULT_USER_NAME}</strong><span>Imagem de perfil</span><div className="settings-avatar-actions"><input ref={fileInputRef} className="settings-file-input" type="file" accept="image/*" onChange={handleAvatarChange} aria-label="Selecionar uma imagem de perfil" /><button type="button" className="settings-btn settings-btn-secondary" onClick={() => fileInputRef.current?.click()}><ImagePlus size={16} /> Alterar foto</button>{hasCustomAvatar && <button type="button" className="settings-btn settings-btn-quiet-danger" onClick={handleAvatarRemove}><Trash2 size={15} /> Remover foto</button>}</div>{avatarError && <p className="settings-inline-error" role="alert">{avatarError}</p>}</div></div>
            </section>
            <form className="settings-form settings-subsection" onSubmit={handleProfileSave}><div className="settings-subsection-heading"><h3>Informações pessoais</h3><p>Atualize os dados exibidos no perfil do ARGUS.</p></div><div className="form-grid"><div className="form-group"><label htmlFor="userNameInput">Nome</label><input id="userNameInput" className="form-input" autoComplete="name" value={profile.name} onChange={(event) => setProfile((current) => ({ ...current, name: event.target.value }))} required /></div><div className="form-group"><label htmlFor="userEmailInput">E-mail</label><input id="userEmailInput" className="form-input" type="email" autoComplete="email" value={profile.email} onChange={(event) => setProfile((current) => ({ ...current, email: event.target.value }))} required /></div></div><div><button type="submit" className="settings-btn settings-btn-primary"><Check size={16} /> Salvar alterações</button></div></form>
            <section className="settings-subsection"><div className="settings-subsection-heading"><h3>Exportar preferências</h3><p>Baixe um arquivo JSON com tema, notificações, animações, efeitos e idioma.</p></div><div className="settings-action-card"><span className="settings-action-icon"><Download size={18} /></span><div><h4>Exportar configurações</h4><p>O arquivo inclui somente as preferências locais relevantes.</p></div><button type="button" className="settings-btn settings-btn-secondary" onClick={handleExportData}><Download size={16} /> Exportar configurações</button></div></section>
            <section className="settings-danger-zone"><div className="settings-subsection-heading"><h3><Eraser size={17} /> Limpar armazenamento local</h3><p>Restaura tema, animações, efeitos, notificações e dados de perfil aos valores padrão deste navegador.</p></div><button type="button" className="settings-btn settings-btn-outline-danger" onClick={() => setClearDialogOpen(true)}><Trash2 size={16} /> Limpar dados</button></section>
          </div>}

          {activeTab === 'notifications' && <div className="settings-tab-content">
            <div className="settings-section-heading"><span className="settings-section-icon"><Bell size={19} /></span><div><h2>Notificações</h2><p>Escolha quais categorias de aviso prefere ver na interface.</p></div></div>
              <div className="settings-info-note"><CircleHelp size={16} /><p>Preferências desta interface ficam neste navegador. Alertas e eventos abaixo são lidos diretamente do Platform e atualizados a cada {settings.refreshSeconds} segundos.</p></div>
            <div className="settings-toggle-list">
              {renderToggle('notifSystem', 'Notificações do sistema', 'Alertas gerais relacionados ao desempenho e ao funcionamento do ARGUS.', settings.notifSystem, (value) => updateSetting('notifSystem', value))}
              {renderToggle('notifAi', 'Alertas preditivos de IA', 'Preferência para alertas relacionados às análises e previsões do sistema.', settings.notifAi, (value) => updateSetting('notifAi', value))}
              {renderToggle('notifUpdates', 'Novidades e atualizações', 'Novidades, atualizações e avisos importantes de segurança do ARGUS.', settings.notifUpdates, (value) => updateSetting('notifUpdates', value))}
            </div>
            <section className="settings-subsection"><div className="settings-subsection-heading"><h3>Atualização das notificações do Platform</h3><p>Define a frequência de consulta enquanto esta aba está aberta.</p></div><div className="form-group settings-system-field"><label htmlFor="refreshSeconds">Intervalo</label><select id="refreshSeconds" className="form-input" value={settings.refreshSeconds} onChange={(event) => updateSetting('refreshSeconds', Number(event.target.value) as UserSettings['refreshSeconds'])}><option value={10}>A cada 10 segundos</option><option value={30}>A cada 30 segundos</option><option value={60}>A cada 60 segundos</option></select></div></section>
            <section className="settings-subsection"><div className="settings-subsection-heading"><h3>Atividade do Platform</h3><p>{platformNotifications.length} notificações recentes da sua conta</p></div>
              {notificationError && <p className="settings-inline-error" role="alert">{notificationError}</p>}
              {platformNotifications.length ? <div className="settings-toggle-list">{platformNotifications.map(item => <article className="settings-toggle-row" key={`${item.category}-${item.id}`}><div className="settings-toggle-copy"><h3>{item.category === 'alert' ? `Alerta · ${item.type}` : `Evento · ${item.type}`}</h3><p>{item.message} · {item.machine_name} · {new Date(item.created_at).toLocaleString('pt-BR')}</p></div><span className={`settings-plan-status ${item.active ? '' : 'is-muted'}`}>{item.active ? 'Ativo' : 'Reconhecido'}</span></article>)}</div> : !notificationError ? <p className="settings-accessibility-note">Nenhum evento ou alerta recebido do Platform.</p> : null}
            </section>
          </div>}

          {activeTab === 'appearance' && <div className="settings-tab-content">
            <div className="settings-section-heading"><span className="settings-section-icon"><Palette size={19} /></span><div><h2>Aparência</h2><p>Configure o tema e os efeitos visuais da interface.</p></div></div>
            <section className="settings-subsection"><div className="settings-subsection-heading"><h3>Tema</h3><p>O tema selecionado é aplicado imediatamente a esta interface.</p></div><div className="settings-theme-grid">{([
              { id: 'dark', label: 'Escuro', description: 'Tema principal do ARGUS.' },
              { id: 'gray', label: 'Cinza', description: 'Tonalidade intermediária.' },
              { id: 'light', label: 'Claro', description: 'Para ambientes mais iluminados.' },
            ] as const).map((theme) => <label className={`settings-theme-option ${settings.theme === theme.id ? 'selected' : ''}`} key={theme.id}><input type="radio" name="theme" value={theme.id} checked={settings.theme === theme.id} onChange={() => { updateSetting('theme', theme.id); showArgusToast(`Tema ${theme.label.toLocaleLowerCase('pt-BR')} aplicado.`); }} /><span className={`settings-theme-preview settings-preview-${theme.id}`} aria-hidden="true"><span /><span /><span /></span><strong>{theme.label}</strong><small>{theme.description}</small>{settings.theme === theme.id && <span className="settings-theme-check"><Check size={14} /></span>}</label>)}</div></section>
            <section className="settings-subsection"><div className="settings-subsection-heading"><h3><Sparkles size={17} /> Efeitos visuais</h3><p>Ative ou reduza movimentos e brilhos decorativos.</p></div><div className="settings-toggle-list">{renderToggle('animationsEnabled', 'Animações da interface', 'Controla as transições e animações visuais do ARGUS.', animationsEnabled, handleAnimationsChange)}{renderToggle('glowEnabled', 'Efeitos de brilho e neon', 'Controla os efeitos de brilho usados na interface, sem alterar a legibilidade.', glowEnabled, handleGlowChange)}</div><p className="settings-accessibility-note"><SunMoon size={15} /> A preferência de movimento reduzido do dispositivo também é respeitada.</p></section>
          </div>}

          {activeTab === 'system' && <div className="settings-tab-content">
            <div className="settings-section-heading"><span className="settings-section-icon"><Globe size={19} /></span><div><h2>Idioma e Horário</h2><p>Preferências regionais para a experiência ARGUS.</p></div></div>
            <section className="settings-subsection"><div className="settings-subsection-heading"><h3>Idioma</h3><p>A interface ARGUS está disponível em português nesta versão.</p></div><div className="form-group settings-system-field"><label htmlFor="language"><Languages size={15} /> Idioma da interface</label><select id="language" className="form-input" value="pt-BR" disabled><option value="pt-BR">Português (Brasil)</option></select><small>O idioma inglês poderá ser disponibilizado novamente em uma versão futura.</small></div></section>
            <section className="settings-subsection"><div className="settings-subsection-heading"><h3>Fuso horário</h3><p>O fuso horário é definido pelo sistema e não pode ser alterado nesta versão.</p></div><div className="form-group settings-system-field"><label htmlFor="timezone">Horário local</label><input id="timezone" className="form-input" value="Horário Oficial de Brasília (UTC−03:00)" disabled readOnly /></div></section>
          </div>}

          {activeTab === 'billing' && <div className="settings-tab-content">
            <div className="settings-section-heading"><span className="settings-section-icon"><CreditCard size={19} /></span><div><h2>Planos e Cobrança</h2><p>Consulte a assinatura persistida na sua conta.</p></div></div>
            {notificationError && <p className="settings-inline-error" role="alert">{notificationError}</p>}
            <div className="settings-billing-card"><div className="settings-billing-heading"><div><span className="settings-plan-tag">PLANO ATUAL</span><h3>Argus {subscription?.plan || 'Free'}</h3><p>{subscription?.billing_cycle === 'annual' ? 'Ciclo anual demonstrativo.' : 'Ciclo mensal demonstrativo.'} Nenhuma cobrança real é processada.</p></div><span className="settings-plan-status"><Check size={14} /> {subscription?.status === 'canceled' ? 'Encerrado' : 'Ativo'}</span></div><ul className="settings-plan-limits"><li><Check size={16} /><span>Limite de computadores</span><strong>{subscription?.plan === 'Business' ? 'Ilimitado' : subscription?.plan === 'Pro' ? 'Até 50' : 'Até 10'}</strong></li><li><Check size={16} /><span>Retenção de métricas</span><strong>{subscription?.plan === 'Business' ? '365 dias' : subscription?.plan === 'Pro' ? '90 dias' : '7 dias'}</strong></li><li><Check size={16} /><span>Forma de pagamento</span><strong>{subscription?.latest_payment?.method === 'pix' ? 'PIX simulado' : subscription?.latest_payment ? `${subscription.latest_payment.method === 'credit_card' ? 'Crédito' : 'Débito'} · ${subscription.latest_payment.card_brand || 'Cartão'} •••• ${subscription.latest_payment.card_last4}` : 'Nenhum pagamento'}</strong></li>{subscription?.latest_payment && <li><Check size={16} /><span>Último valor simulado</span><strong>R$ {(subscription.latest_payment.amount_cents / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong></li>}</ul>{subscription?.latest_payment && <p className="settings-billing-note">Transação {subscription.latest_payment.reference} · {new Date(subscription.latest_payment.created_at).toLocaleString('pt-BR')} · pagamento aprovado em modo demonstração.</p>}<p className="settings-billing-note">O plano e o histórico demonstrativo são salvos na sua conta do banco ARGUS. Número completo de cartão, validade e CVV não são armazenados.</p><Link to="/monetizacao" className="settings-btn settings-btn-primary">Gerenciar assinatura <ChevronRight size={16} /></Link></div>
          </div>}

          {activeTab === 'legal' && <div className="settings-tab-content">
            <div className="settings-section-heading"><span className="settings-section-icon"><FileText size={19} /></span><div><h2>Termos e Privacidade</h2><p>Consulte as regras de uso, os dados tratados e os direitos das pessoas titulares.</p></div></div>
            <section className="settings-subsection"><div className="settings-subsection-heading"><h3>Termos atuais</h3><p>A aceitação da versão vigente é solicitada ao entrar na conta.</p></div><div className="settings-action-card"><span className="settings-action-icon"><Shield size={18} /></span><div><h4>{termsVersion ? `Versão ${termsVersion}` : 'Versão atual'}</h4><p>{termsError || (termsVersion ? `Versão aceita nesta sessão: ${acceptedTermsVersion || 'não registrada localmente'}.` : 'Carregando versão vigente…')}</p></div><a className="settings-btn settings-btn-secondary" href="/terms.html" target="_blank" rel="noreferrer">Ler termos <ExternalLink size={15} /></a></div></section>
            <div className="settings-info-note"><CircleHelp size={16} /><p>O consentimento para coleta de navegação é opcional e pode ser revogado na seção Dados e Privacidade. Ao revogar, os registros web associados à conta são removidos.</p></div>
          </div>}
        </section>
      </div>

      {clearDialogOpen && <div className="settings-dialog-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setClearDialogOpen(false); }}><section className="settings-confirm-dialog" role="alertdialog" aria-modal="true" aria-labelledby="clear-dialog-title" aria-describedby="clear-dialog-description"><button type="button" className="settings-dialog-close" aria-label="Fechar confirmação" onClick={() => setClearDialogOpen(false)}><X size={19} /></button><span className="settings-dialog-icon"><Eraser size={21} /></span><h2 id="clear-dialog-title">Limpar armazenamento local</h2><p id="clear-dialog-description">Tem certeza de que deseja limpar as configurações locais? O tema, animações, efeitos, notificações e os dados de perfil salvos neste navegador serão restaurados aos valores padrão.</p><div className="settings-dialog-actions"><button type="button" className="settings-btn settings-btn-secondary" onClick={() => setClearDialogOpen(false)}>Cancelar</button><button type="button" className="settings-btn settings-btn-outline-danger" onClick={handleClearData}><Trash2 size={15} /> Confirmar</button></div></section></div>}
    </div>
  );
};
