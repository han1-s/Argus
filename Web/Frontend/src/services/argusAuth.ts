const AUTH_KEY = 'argusAuthenticated';
const GUEST_KEY = 'argusGuest';
const TERMS_VERSION_KEY = 'argusTermsAcceptedVersion';

export interface ArgusAuthUser {
  id: string;
  name: string;
  email: string;
  avatarData?: string | null;
  webConsent?: boolean;
  termsVersion?: string | null;
}

interface ArgusAccountDetails {
  name?: string;
  email?: string;
  avatarData?: string | null;
  termsVersion?: string | null;
}

interface AuthResponse {
  user?: ArgusAuthUser;
  error?: string;
}

async function authRequest(path: string, options: RequestInit = {}): Promise<AuthResponse> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 12000);
  try {
    const response = await fetch(path, {
      ...options,
      signal: controller.signal,
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', ...options.headers },
    });
    const result = await response.json().catch(() => ({})) as AuthResponse;
    if (!response.ok) throw new Error(result.error || 'Não foi possível autenticar no ARGUS.');
    return result;
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error('O servidor demorou para responder. Verifique se o ARGUS Web está iniciado e tente novamente.', { cause: error });
    }
    throw error;
  } finally {
    window.clearTimeout(timeout);
  }
}

export async function getArgusTerms(): Promise<{ version: string; url: string }> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch('/api/legal/terms', { credentials: 'include', signal: controller.signal });
    if (!response.ok) throw new Error('Não foi possível carregar os termos atuais.');
    const terms = await response.json() as { version?: string; url?: string };
    if (!terms.version) throw new Error('O servidor não retornou a versão dos termos.');
    return { version: terms.version, url: terms.url || '/terms.html' };
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error('O servidor não respondeu ao carregar os termos. Confira se o ARGUS Web está iniciado.', { cause: error });
    }
    throw error;
  } finally {
    window.clearTimeout(timeout);
  }
}

export async function registerArgus(name: string, email: string, password: string, termsVersion: string, webConsent: boolean): Promise<ArgusAuthUser> {
  const result = await authRequest('/api/auth/signup', {
    method: 'POST',
    body: JSON.stringify({ name, email, password, termsAccepted: true, termsVersion, webConsent }),
  });
  if (!result.user) throw new Error('A API não retornou os dados da conta.');
  return result.user;
}

export async function loginArgus(email: string, password: string, termsVersion: string): Promise<ArgusAuthUser> {
  const result = await authRequest('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password, termsAccepted: true, termsVersion }),
  });
  if (!result.user) throw new Error('A API não retornou os dados da conta.');
  return result.user;
}

export async function requestArgusPasswordReset(email: string): Promise<{ message: string; simulatedEmail: { to: string; subject: string; code: string; expiresInMinutes: number } | null }> {
  const result = await authRequest('/api/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) });
  return { message: result.error || 'Pedido processado.', simulatedEmail: (result as AuthResponse & { simulatedEmail?: { to: string; subject: string; code: string; expiresInMinutes: number } | null }).simulatedEmail ?? null };
}

export async function resetArgusPassword(email: string, code: string, password: string): Promise<void> {
  await authRequest('/api/auth/reset-password', { method: 'POST', body: JSON.stringify({ email, code, password }) });
}

export async function updateArgusProfile(name: string, email: string, avatarData?: string | null): Promise<ArgusAuthUser> {
  const body: { name: string; email: string; avatarData?: string | null } = { name, email };
  if (avatarData !== undefined) body.avatarData = avatarData;
  const result = await authRequest('/api/auth/profile', { method: 'PUT', body: JSON.stringify(body) });
  if (!result.user) throw new Error('A API não retornou os dados atualizados da conta.');
  signInArgus(result.user);
  return result.user;
}

export async function restoreArgusSession(): Promise<ArgusAuthUser | null> {
  try {
    const result = await authRequest('/api/auth/me');
    if (result.user) {
      signInArgus(result.user);
      return result.user;
    }
  } catch {
    localStorage.removeItem(AUTH_KEY);
    window.dispatchEvent(new Event('argus-auth-changed'));
  }
  return null;
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
  if (account.termsVersion) localStorage.setItem(TERMS_VERSION_KEY, account.termsVersion);
  if (account.avatarData !== undefined) {
    if (account.avatarData) localStorage.setItem('argusProfileImage', account.avatarData);
    else localStorage.removeItem('argusProfileImage');
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
  void fetch('/api/auth/logout', { method: 'POST', credentials: 'include' }).catch(() => {});
  localStorage.removeItem(AUTH_KEY);
  localStorage.removeItem(GUEST_KEY);
  window.dispatchEvent(new Event('argus-auth-changed'));
}
