import React, { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { Menu, X, Zap } from 'lucide-react';
import { ProfileMenu } from '../ProfileMenu/ProfileMenu';
import { getArgusProfile } from '../../services/argusPreferences';

export const Header: React.FC = () => {
  const [profileOpen, setProfileOpen] = useState(false);
  const [navigationOpen, setNavigationOpen] = useState(false);
  const [profile, setProfile] = useState(getArgusProfile);
  const profileRef = useRef<HTMLDivElement>(null);
  const location = useLocation();

  useEffect(() => {
    const refreshProfile = () => setProfile(getArgusProfile());
    window.addEventListener('storage', refreshProfile);
    window.addEventListener('argus-preferences-changed', refreshProfile);
    return () => {
      window.removeEventListener('storage', refreshProfile);
      window.removeEventListener('argus-preferences-changed', refreshProfile);
    };
  }, []);

  useEffect(() => {
    setNavigationOpen(false);
    setProfileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const closeProfileOnOutsideClick = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setProfileOpen(false);
        setNavigationOpen(false);
      }
    };

    document.addEventListener('mousedown', closeProfileOnOutsideClick);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('mousedown', closeProfileOnOutsideClick);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, []);

  return (
    <header className="main-header">
      <div className="header-left">
        <Link to="/" className="logo-top float-glow-anim">
          Argus
        </Link>
        <nav id="primary-navigation" className={`header-nav-links ${navigationOpen ? 'is-open' : ''}`} aria-label="Navegação principal">
          <NavLink to="/dashboard" className={({ isActive }: { isActive: boolean }) => isActive ? 'nav-link active' : 'nav-link'}>
            Dashboard
          </NavLink>
          <NavLink to="/computadores" className={({ isActive }: { isActive: boolean }) => isActive ? 'nav-link active' : 'nav-link'}>
            Computadores
          </NavLink>
          <NavLink to="/monitoramento" className={({ isActive }: { isActive: boolean }) => isActive ? 'nav-link active' : 'nav-link'}>
            Monitoramento
          </NavLink>
          <NavLink to="/relatorios" className={({ isActive }: { isActive: boolean }) => isActive ? 'nav-link active' : 'nav-link'}>
            Relatórios
          </NavLink>
        </nav>
      </div>

      <nav className="nav-right">
        <Link to="/monetizacao" className="btn-upgrade-nav">
          <Zap size={16} aria-hidden="true" /> <span className="upgrade-label">Upgrade</span>
        </Link>

        <div className="profile-container" ref={profileRef}>
          <button
            className="profile-btn"
            onClick={() => setProfileOpen((open) => !open)}
            aria-label="Menu de perfil"
            aria-expanded={profileOpen}
            aria-haspopup="menu"
          >
            {profile.avatar ? <img className="user-avatar" src={profile.avatar} alt="Avatar do perfil" /> : <span className="avatar-fallback" aria-hidden="true">{profile.name.charAt(0).toUpperCase()}</span>}
          </button>
          <ProfileMenu isOpen={profileOpen} onClose={() => setProfileOpen(false)} profile={profile} />
        </div>
        <button
          className="mobile-nav-toggle"
          type="button"
          onClick={() => setNavigationOpen((open) => !open)}
          aria-label={navigationOpen ? 'Fechar navegação' : 'Abrir navegação'}
          aria-expanded={navigationOpen}
          aria-controls="primary-navigation"
        >
          {navigationOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </nav>
    </header>
  );
};
