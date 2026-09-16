import React from 'react';
import { Link } from 'react-router-dom';
import { Settings, Info, LogOut } from 'lucide-react';
import { DEFAULT_USER_EMAIL, DEFAULT_USER_NAME } from '../../services/argusPreferences';
import { signOutArgus } from '../../services/argusAuth';

interface ProfileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  profile?: { name: string; email: string; avatar: string | null };
}

export const ProfileMenu: React.FC<ProfileMenuProps> = ({ isOpen, onClose, profile }) => {
  if (!isOpen) return null;

  return (
    <div className="profile-dropdown active" role="menu" aria-label="Menu de perfil">
      <div className="profile-dropdown-header">
        {profile?.avatar ? <img className="user-avatar" src={profile.avatar} alt="Avatar do perfil" /> : <span className="avatar-fallback avatar-fallback-small" aria-hidden="true">{(profile?.name || DEFAULT_USER_NAME).charAt(0).toUpperCase()}</span>}
        <div>
          <p className="profile-name">{profile?.name || DEFAULT_USER_NAME}</p>
          <span className="profile-email">{profile?.email || DEFAULT_USER_EMAIL}</span>
        </div>
      </div>
      <div className="profile-dropdown-divider" />
      <Link to="/configuracoes" onClick={onClose}>
        <Settings size={16} /> Configurações
      </Link>
      <Link to="/saiba-mais" onClick={onClose}>
        <Info size={16} /> Saiba mais
      </Link>
      <div className="profile-dropdown-divider" />
      <Link to="/login" onClick={() => { signOutArgus(); onClose(); }} className="text-danger">
        <LogOut size={16} /> Sair
      </Link>
    </div>
  );
};
