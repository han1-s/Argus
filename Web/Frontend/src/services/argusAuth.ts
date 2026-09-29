const AUTH_KEY = 'argusAuthenticated';
const GUEST_KEY = 'argusGuest';

interface ArgusAccountDetails {
  name?: string;
  email?: string;
}

export function isArgusAuthenticated(): boolean {
  return localStorage.getItem(AUTH_KEY) === 'true' || localStorage.getItem(GUEST_KEY) === 'true';
}

export function isArgusSignedIn(): boolean {
  return localStorage.getItem(AUTH_KEY) === 'true';
}

export function signInArgus(account: ArgusAccountDetails = {}): void {
  if (account.email?.trim()) localStorage.setItem('argusUserEmail', account.email.trim());
  if (account.name?.trim()) {
    localStorage.setItem('argusUserName', account.name.trim());
  } else if (account.email?.trim() && !localStorage.getItem('argusUserName')) {
    const displayName = account.email.split('@')[0].replace(/[._-]+/g, ' ').replace(/\b\w/g, (letter) => letter.toLocaleUpperCase('pt-BR'));
    localStorage.setItem('argusUserName', displayName);
  }
  localStorage.setItem(AUTH_KEY, 'true');
  localStorage.removeItem(GUEST_KEY);
  window.dispatchEvent(new Event('argus-auth-changed'));
}

export function continueAsGuest(): void {
  localStorage.removeItem(AUTH_KEY);
  localStorage.setItem(GUEST_KEY, 'true');
  window.dispatchEvent(new Event('argus-auth-changed'));
}

export function signOutArgus(): void {
  localStorage.removeItem(AUTH_KEY);
  localStorage.removeItem(GUEST_KEY);
  window.dispatchEvent(new Event('argus-auth-changed'));
}
