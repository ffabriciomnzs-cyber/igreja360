import axios, { AxiosInstance } from 'axios';

const baseURL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/v1';

const MEMBER_TOKEN_KEY = 'igreja360.member.token';
const MEMBER_KEY = 'igreja360.member';

export interface PortalMember {
  id: string;
  name: string;
  email: string | null;
  churchId: string;
}

export const memberApi: AxiosInstance = axios.create({ baseURL });

memberApi.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = window.localStorage.getItem(MEMBER_TOKEN_KEY);
    if (token) config.headers.set('Authorization', `Bearer ${token}`);
  }
  return config;
});

export function saveMemberSession(token: string, member: PortalMember): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(MEMBER_TOKEN_KEY, token);
  window.localStorage.setItem(MEMBER_KEY, JSON.stringify(member));
}

export function getMemberToken(): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(MEMBER_TOKEN_KEY);
}

export function getStoredMember(): PortalMember | null {
  if (typeof window === 'undefined') return null;
  const raw = window.localStorage.getItem(MEMBER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as PortalMember;
  } catch {
    return null;
  }
}

/**
 * Atualiza a cópia local do membro (nome etc.) e avisa quem exibe esses dados
 * (ex.: a saudação do cabeçalho). Sem isso, editar o perfil só mudava o banco
 * e o cabeçalho ficava com o valor antigo até o próximo login.
 */
export function updateStoredMember(patch: Partial<PortalMember>): void {
  if (typeof window === 'undefined') return;
  const atual = getStoredMember();
  if (!atual) return;
  window.localStorage.setItem(MEMBER_KEY, JSON.stringify({ ...atual, ...patch }));
  window.dispatchEvent(new Event('igreja360:member-updated'));
}

export function clearMemberSession(): void {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(MEMBER_TOKEN_KEY);
  window.localStorage.removeItem(MEMBER_KEY);
}

export function memberApiError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { message?: string | string[] };
    if (data?.message) {
      return Array.isArray(data.message) ? data.message[0] : data.message;
    }
    if (error.code === 'ERR_NETWORK') return 'Sem conexão com o servidor.';
  }
  return 'Algo deu errado. Tente novamente.';
}
