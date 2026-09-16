const AUTH_KEY = 'argusAuthenticated';
const GUEST_KEY = 'argusGuest';

export function isArgusAuthenticated(): boolean {
  return localStorage.getItem(AUTH_KEY) === 'true' || localStorage.getItem(GUEST_KEY) === 'true';
}

export function signInArgus(): void {
  localStorage.setItem(AUTH_KEY, 'true');
  localStorage.removeItem(GUEST_KEY);
}

export function continueAsGuest(): void {
  localStorage.setItem(GUEST_KEY, 'true');
}

export function signOutArgus(): void {
  localStorage.removeItem(AUTH_KEY);
  localStorage.removeItem(GUEST_KEY);
}
