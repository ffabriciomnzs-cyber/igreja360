export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
  churchId: string;
}

const ACCESS_KEY = 'igreja360.accessToken';
const REFRESH_KEY = 'igreja360.refreshToken';
const USER_KEY = 'igreja360.user';

export function isBrowser(): boolean {
  return typeof window !== 'undefined';
}

export function getAccessToken(): string | null {
  if (!isBrowser()) return null;
  return window.localStorage.getItem(ACCESS_KEY);
}

export function getRefreshToken(): string | null {
  if (!isBrowser()) return null;
  return window.localStorage.getItem(REFRESH_KEY);
}

export function getStoredUser(): AuthUser | null {
  if (!isBrowser()) return null;
  const raw = window.localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function saveSession(
  accessToken: string,
  refreshToken: string,
  user: AuthUser,
): void {
  if (!isBrowser()) return;
  window.localStorage.setItem(ACCESS_KEY, accessToken);
  window.localStorage.setItem(REFRESH_KEY, refreshToken);
  window.localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function updateTokens(accessToken: string, refreshToken: string): void {
  if (!isBrowser()) return;
  window.localStorage.setItem(ACCESS_KEY, accessToken);
  window.localStorage.setItem(REFRESH_KEY, refreshToken);
}

export function clearSession(): void {
  if (!isBrowser()) return;
  window.localStorage.removeItem(ACCESS_KEY);
  window.localStorage.removeItem(REFRESH_KEY);
  window.localStorage.removeItem(USER_KEY);
}

export const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: 'Super Admin',
  ADMIN: 'Administrador',
  PASTOR: 'Pastor',
  SECRETARY: 'Secretária',
  TREASURER: 'Tesoureiro',
  LEADER: 'Líder',
  MEMBER: 'Membro',
};
