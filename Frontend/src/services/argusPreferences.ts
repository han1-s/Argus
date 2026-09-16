export const ARGUS_KEYS = {
  THEME: 'argusTheme',
  USER_NAME: 'argusUserName',
  USER_EMAIL: 'argusUserEmail',
  AVATAR: 'argusProfileImage',
  NOTIFS: 'argusNotifications',
  ANIMATIONS: 'argusAnimations',
  GLOW: 'argusEffects',
} as const;

export type ArgusTheme = 'dark' | 'gray' | 'light';

export const DEFAULT_USER_NAME = 'Alex Argus';
export const DEFAULT_USER_EMAIL = 'alex@argus.io';

export function getArgusTheme(): ArgusTheme {
  const theme = localStorage.getItem(ARGUS_KEYS.THEME);
  return theme === 'gray' || theme === 'light' ? theme : 'dark';
}

export function setArgusTheme(theme: ArgusTheme): void {
  localStorage.setItem(ARGUS_KEYS.THEME, theme);
  document.body.dataset.theme = theme;
  window.dispatchEvent(new CustomEvent('argus-preferences-changed'));
}

export function applyArgusPreferences(): void {
  document.body.dataset.theme = getArgusTheme();
  document.body.classList.toggle('reduce-animations', localStorage.getItem(ARGUS_KEYS.ANIMATIONS) === 'false');
  document.body.classList.toggle('reduce-glow', localStorage.getItem(ARGUS_KEYS.GLOW) === 'false');
}

export function getArgusProfile() {
  return {
    name: localStorage.getItem(ARGUS_KEYS.USER_NAME) || DEFAULT_USER_NAME,
    email: localStorage.getItem(ARGUS_KEYS.USER_EMAIL) || DEFAULT_USER_EMAIL,
    avatar: localStorage.getItem(ARGUS_KEYS.AVATAR) || '/assets/img/user.png',
  };
}

export function setArgusPreference(key: 'ANIMATIONS' | 'GLOW', enabled: boolean): void {
  localStorage.setItem(ARGUS_KEYS[key], String(enabled));
  applyArgusPreferences();
  window.dispatchEvent(new CustomEvent('argus-preferences-changed'));
}

export function resetArgusPreferences(): void {
  Object.values(ARGUS_KEYS).forEach((key) => localStorage.removeItem(key));
  applyArgusPreferences();
  window.dispatchEvent(new CustomEvent('argus-preferences-changed'));
}
