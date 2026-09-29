import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { UserRound, Zap } from 'lucide-react';
import { ProfileMenu } from '../ProfileMenu/ProfileMenu';
import { ArgusBrand } from '../ArgusBrand/ArgusBrand';
import { getArgusProfile } from '../../services/argusPreferences';
import { isArgusSignedIn } from '../../services/argusAuth';

export const Header: React.FC = () => {
  const [openLocationKey, setOpenLocationKey] = useState<string | null>(null);
  const [signedIn, setSignedIn] = useState(isArgusSignedIn);
  const [profile, setProfile] = useState<{ name: string; email: string; avatar: string | null }>(getArgusProfile);
  const profileRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const profileOpen = openLocationKey === location.key;

  useEffect(() => {
    const refreshProfile = () => {
      setSignedIn(isArgusSignedIn());
      setProfile(getArgusProfile());
    };
    window.addEventListener('storage', refreshProfile);
    window.addEventListener('argus-preferences-changed', refreshProfile);
    window.addEventListener('argus-auth-changed', refreshProfile);
    return () => {
      window.removeEventListener('storage', refreshProfile);
      window.removeEventListener('argus-preferences-changed', refreshProfile);
      window.removeEventListener('argus-auth-changed', refreshProfile);
    };
  }, []);

  useEffect(() => {
    const closeProfileOnOutsideClick = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) setOpenLocationKey(null);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpenLocationKey(null);
    };
    const closeOnHistoryNavigation = () => setOpenLocationKey(null);

    document.addEventListener('mousedown', closeProfileOnOutsideClick);
    document.addEventListener('keydown', closeOnEscape);
    window.addEventListener('popstate', closeOnHistoryNavigation);
    return () => {
      document.removeEventListener('mousedown', closeProfileOnOutsideClick);
      document.removeEventListener('keydown', closeOnEscape);
      window.removeEventListener('popstate', closeOnHistoryNavigation);
    };
  }, []);

  const avatar = profile.avatar && profile.avatar !== '/assets/img/user.png' ? profile.avatar : null;
  const initial = profile.name.trim().charAt(0).toUpperCase() || 'A';

  return (
    <header className="main-header">
      <div className="header-left">
        <Link to="/" className="logo-top" aria-label="ARGUS — página inicial" onClick={() => setOpenLocationKey(null)}><ArgusBrand /></Link>
      </div>
      <nav className="nav-right" aria-label="Navegação principal">
        <Link to="/monetizacao" className="btn-upgrade-nav" onClick={() => setOpenLocationKey(null)}><Zap size={16} aria-hidden="true" /> <span>Upgrade</span></Link>
        <div className="profile-container" ref={profileRef}>
          {signedIn ? (
            <>
              <button
                className="profile-btn profile-btn-authenticated"
                type="button"
                onClick={() => setOpenLocationKey(profileOpen ? null : location.key)}
                aria-label={`Abrir menu de ${profile.name}`}
                aria-expanded={profileOpen}
                aria-haspopup="menu"
              >
                {avatar ? <img className="user-avatar" src={avatar} alt="" onError={() => setProfile((current) => ({ ...current, avatar: null }))} /> : <span className="avatar-fallback" aria-hidden="true">{initial}</span>}
                <span className="profile-identity">
                  <span className="profile-identity-name">{profile.name}</span>
                  <span className="profile-identity-role">ADMINISTRADOR</span>
                </span>
              </button>
              <ProfileMenu isOpen={profileOpen} onClose={() => setOpenLocationKey(null)} profile={{ ...profile, avatar }} />
            </>
          ) : (
            <Link to="/login" className="profile-btn profile-login-btn" aria-label="Entrar" title="Entrar">
              <UserRound size={19} aria-hidden="true" />
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
};
