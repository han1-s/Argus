import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, Shield, Bell, Palette, Globe, CreditCard, Download, Eraser } from 'lucide-react';
import type { SettingsTab, UserSettings } from '../../types';
import { ARGUS_KEYS, DEFAULT_USER_EMAIL, DEFAULT_USER_NAME, getArgusProfile, getArgusTheme, resetArgusPreferences, setArgusPreference, setArgusTheme } from '../../services/argusPreferences';
import { showArgusToast } from '../../services/argusToast';

const SETTINGS_KEY = 'argusSettings';
const defaultSettings: UserSettings = {
  notifSystem: true,
  notifAi: true,
  notifUpdates: true,
  theme: 'dark',
  language: 'pt-BR',
};

export const Configuracoes: React.FC = () => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('privacy');
  const [settings, setSettings] = useState<UserSettings>(() => {
    try {
      const stored = localStorage.getItem(SETTINGS_KEY);
      return stored ? { ...defaultSettings, ...JSON.parse(stored) } : defaultSettings;
    } catch {
      return defaultSettings;
    }
  });
  const [animationsEnabled, setAnimationsEnabled] = useState(() => localStorage.getItem('argusAnimations') !== 'false');
  const [glowEnabled, setGlowEnabled] = useState(() => localStorage.getItem('argusEffects') !== 'false');
  const [profile, setProfile] = useState(getArgusProfile);

    useEffect(() => {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
      setArgusTheme(settings.theme);
    }, [settings]);

    const updateSetting = <Key extends keyof UserSettings>(key: Key, value: UserSettings[Key]) => {
      setSettings((current) => ({ ...current, [key]: value }));
    };

    const handleExportData = () => {
      const data = `data:application/json;charset=utf-8,${encodeURIComponent(JSON.stringify(settings, null, 2))}`;
      const anchor = document.createElement('a');
      anchor.href = data;
      anchor.download = 'argus_settings.json';
      anchor.click();
    };

    const handleClearData = () => {
        resetArgusPreferences();
        localStorage.removeItem(SETTINGS_KEY);
        setSettings({ ...defaultSettings, theme: getArgusTheme() });
        setAnimationsEnabled(true);
        setGlowEnabled(true);
        setProfile({ name: DEFAULT_USER_NAME, email: DEFAULT_USER_EMAIL, avatar: '/assets/img/user.png' });
        showArgusToast('Dados locais restaurados aos padrões de fábrica.');
    };

    const handleProfileSave = (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      localStorage.setItem(ARGUS_KEYS.USER_NAME, profile.name.trim() || DEFAULT_USER_NAME);
      localStorage.setItem(ARGUS_KEYS.USER_EMAIL, profile.email.trim() || DEFAULT_USER_EMAIL);
      setProfile(getArgusProfile());
      showArgusToast('Informações da conta salvas com sucesso!');
    };

    const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file || !file.type.startsWith('image/') || file.size > 2 * 1024 * 1024) return;
      const reader = new FileReader();
      reader.onload = () => {
        const avatar = typeof reader.result === 'string' ? reader.result : null;
        if (avatar) {
          localStorage.setItem(ARGUS_KEYS.AVATAR, avatar);
          setProfile(getArgusProfile());
          showArgusToast('Foto de perfil atualizada!');
        }
      };
      reader.readAsDataURL(file);
    };

    const handleAvatarRemove = () => {
      localStorage.removeItem(ARGUS_KEYS.AVATAR);
      setProfile(getArgusProfile());
      showArgusToast('Foto de perfil removida.');
    };

    const handleAnimationsChange = (enabled: boolean) => {
      setAnimationsEnabled(enabled);
      setArgusPreference('ANIMATIONS', enabled);
      showArgusToast('Preferências de animação atualizadas.');
    };

    const handleGlowChange = (enabled: boolean) => {
      setGlowEnabled(enabled);
      setArgusPreference('GLOW', enabled);
      showArgusToast('Preferências de brilho atualizadas.');
    };

  const tabs: Array<{ id: SettingsTab; label: string; icon: React.ReactNode; group: string }> = [
      { id: 'privacy', label: 'Dados e Privacidade', icon: <Shield size={18} />, group: 'PRIVACIDADE' },
      { id: 'notifications', label: 'Notificações', icon: <Bell size={18} />, group: 'PRIVACIDADE' },
      { id: 'appearance', label: 'Aparência', icon: <Palette size={18} />, group: 'ACESSIBILIDADE' },
      { id: 'system', label: 'Idioma e Horário', icon: <Globe size={18} />, group: 'SISTEMA' },
      { id: 'billing', label: 'Planos', icon: <CreditCard size={18} />, group: 'COBRANÇA' },
    ];

  const groups = [...new Set(tabs.map((tab) => tab.group))];

  return (
      <div className="page-wrapper settings-page-wrapper">
        <div className="settings-container">
          <aside className="settings-sidebar">
            {groups.map((group) => (
              <div className="sidebar-group" key={group}>
                <span className="sidebar-group-title">{group}</span>
                {tabs.filter((tab) => tab.group === group).map((tab) => (
                  <button
                    key={tab.id}
                    className={`sidebar-nav-item ${activeTab === tab.id ? 'active' : ''}`}
                    onClick={() => setActiveTab(tab.id)}
                  >
                    {tab.icon} <span>{tab.label}</span>
                  </button>
                ))}
              </div>
            ))}
          </aside>

          <section className="settings-content-card border-glow">
            {activeTab === 'privacy' && (
              <div className="tab-content active">
                <h2 className="section-title"><Shield size={22} /> Dados e Privacidade</h2>
                <p className="section-desc">Gerencie o armazenamento local do navegador e preferências de dados.</p>
                <form className="settings-form" onSubmit={handleProfileSave}>
                  <div className="profile-upload-block">
                    <div className="avatar-preview-wrapper">{profile.avatar ? <img src={profile.avatar} alt="Avatar do perfil" /> : <span className="avatar-fallback avatar-fallback-large" aria-hidden="true">{profile.name.charAt(0).toUpperCase()}</span>}</div>
                    <div className="avatar-controls"><label className="settings-btn settings-btn-secondary" htmlFor="avatarInput">Escolher foto</label><input id="avatarInput" className="avatar-file-input" type="file" accept="image/*" onChange={handleAvatarChange} /><button type="button" className="settings-btn settings-btn-secondary" onClick={handleAvatarRemove}>Remover foto</button></div>
                  </div>
                  <div className="form-grid"><div className="form-group"><label htmlFor="userNameInput">Nome</label><input id="userNameInput" className="form-input" value={profile.name} onChange={(event) => setProfile((current) => ({ ...current, name: event.target.value }))} /></div><div className="form-group"><label htmlFor="userEmailInput">E-mail</label><input id="userEmailInput" className="form-input" type="email" value={profile.email} onChange={(event) => setProfile((current) => ({ ...current, email: event.target.value }))} /></div></div>
                  <button type="submit" className="settings-btn settings-btn-primary">Salvar perfil</button>
                </form>
                <div className="action-card-group">
                  <div className="action-card">
                    <div><h4>Exportar Preferências</h4><p>Baixe um arquivo JSON contendo suas configurações locais salvas.</p></div>
                    <button className="settings-btn settings-btn-secondary" onClick={handleExportData}><Download size={16} /> Exportar</button>
                  </div>
                  <div className="action-card">
                    <div><h4>Limpar Armazenamento Local</h4><p>Restaure o tema, notificações e configurações de fábrica.</p></div>
                    <button className="settings-btn settings-btn-outline-danger" onClick={handleClearData}><Eraser size={16} /> Limpar Dados</button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="tab-content active">
                <h2 className="section-title"><Bell size={22} /> Notificações</h2>
                <p className="section-desc">Configure quais alertas e avisos do sistema você deseja receber.</p>
                <div className="toggle-list">
                  <div className="toggle-item"><div><h4>Notificações do Sistema</h4><p>Alertas de desempenho e gargalos de hardware em tempo real.</p></div><label className="switch"><input type="checkbox" checked={settings.notifSystem} onChange={(event) => updateSetting('notifSystem', event.target.checked)} /><span className="slider" /></label></div>
                  <div className="toggle-item"><div><h4>Alertas Preditivos de IA</h4><p>Notificações sobre anomalias antes que afetem o sistema.</p></div><label className="switch"><input type="checkbox" checked={settings.notifAi} onChange={(event) => updateSetting('notifAi', event.target.checked)} /><span className="slider" /></label></div>
                  <div className="toggle-item"><div><h4>Atualizações do Argus</h4><p>Avisos sobre novos releases, patches de segurança e recursos.</p></div><label className="switch"><input type="checkbox" checked={settings.notifUpdates} onChange={(event) => updateSetting('notifUpdates', event.target.checked)} /><span className="slider" /></label></div>
                </div>
              </div>
            )}

            {activeTab === 'appearance' && (
              <div className="tab-content active">
                <h2 className="section-title"><Palette size={22} /> Aparência</h2>
                <p className="section-desc">Escolha o tema visual usado pelo painel Argus.</p>
                <div className="theme-selector-grid">
                  {(['dark', 'gray', 'light'] as const).map((theme) => (
                    <label className={`theme-card-option ${settings.theme === theme ? 'active' : ''}`} key={theme}>
                      <input type="radio" name="theme" checked={settings.theme === theme} onChange={() => { updateSetting('theme', theme); showArgusToast(`Tema ${theme.toUpperCase()} aplicado!`); }} />
                      <span className={`theme-preview ${theme}-preview`}><span className="preview-header" /><span className="preview-body" /></span>
                      <span className="theme-name">{theme === 'dark' ? 'Escuro' : theme === 'gray' ? 'Cinza' : 'Claro'}</span>
                    </label>
                  ))}
                </div>
                <hr className="settings-divider" />
                <h3 className="subsection-title">Efeitos Visuais</h3>
                <div className="toggle-list">
                  <div className="toggle-item"><div><h4>Animações da Interface</h4><p>Habilita transições suaves e efeitos de movimento nos menus.</p></div><label className="switch"><input type="checkbox" checked={animationsEnabled} onChange={(event) => handleAnimationsChange(event.target.checked)} /><span className="slider" /></label></div>
                  <div className="toggle-item"><div><h4>Efeitos de Brilho e Neon</h4><p>Ativa feixes de iluminação e destaques de borda nos componentes.</p></div><label className="switch"><input type="checkbox" checked={glowEnabled} onChange={(event) => handleGlowChange(event.target.checked)} /><span className="slider" /></label></div>
                </div>
              </div>
            )}

            {activeTab === 'system' && (
              <div className="tab-content active">
                <h2 className="section-title"><Globe size={22} /> Idioma e Horário</h2>
                <p className="section-desc">Ajuste a regionalização e o formato de exibição temporal.</p>
                <div className="form-group"><label htmlFor="language">Idioma do Sistema</label><select id="language" className="form-input" value={settings.language} onChange={(event) => updateSetting('language', event.target.value)}><option value="pt-BR">Português (Brasil)</option><option value="en-US">English (United States)</option></select></div>
                <div className="form-group"><label htmlFor="timezone">Fuso Horário</label><input id="timezone" className="form-input" value="Horário Oficial de Brasília (UTC-03:00)" disabled /></div>
              </div>
            )}

            {activeTab === 'billing' && (
              <div className="tab-content active">
                <h2 className="section-title"><CreditCard size={22} /> Planos e Cobrança</h2>
                <p className="section-desc">Consulte a assinatura atual e os limites de máquinas monitoradas.</p>
                <div className="billing-current-card">
                  <div className="plan-badge-box"><span className="plan-tag">PLANO ATUAL</span><h3>Argus Free</h3></div>
                  <div className="plan-specs"><p><Check size={16} /> Até <strong>10 computadores</strong> simultâneos</p><p><Check size={16} /> Retenção de métricas por 7 dias</p><p><Check size={16} /> Renovação automática desativada</p></div>
                  <Link to="/monetizacao" className="settings-btn settings-btn-primary">Gerenciar Assinatura</Link>
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
  );
};

