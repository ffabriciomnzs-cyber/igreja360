import axios, {
  AxiosError,
  AxiosInstance,
  InternalAxiosRequestConfig,
} from 'axios';
import {
  clearSession,
  getAccessToken,
  getRefreshToken,
  updateTokens,
} from './auth';

const baseURL =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/v1';

export const api: AxiosInstance = axios.create({ baseURL });

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getAccessToken();
  if (token) {
    config.headers.set('Authorization', `Bearer ${token}`);
  }
  return config;
});

let refreshing: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;
  try {
    const { data } = await axios.post<{
      accessToken: string;
      refreshToken: string;
    }>(`${baseURL}/auth/refresh`, { refreshToken });
    updateTokens(data.accessToken, data.refreshToken);
    return data.accessToken;
  } catch {
    clearSession();
    return null;
  }
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as
      | (InternalAxiosRequestConfig & { _retry?: boolean })
      | undefined;

    if (
      error.response?.status === 401 &&
      original &&
      !original._retry &&
      !original.url?.includes('/auth/')
    ) {
      original._retry = true;
      refreshing = refreshing ?? refreshAccessToken();
      const newToken = await refreshing;
      refreshing = null;

      if (newToken) {
        original.headers.set('Authorization', `Bearer ${newToken}`);
        return api(original);
      }
      if (typeof window !== 'undefined') {
        window.location.href = '/auth';
      }
    }
    return Promise.reject(error);
  },
);

export function extractApiError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { message?: string | string[] } | undefined;
    if (data?.message) {
      return Array.isArray(data.message) ? data.message[0] : data.message;
    }
    if (error.code === 'ERR_NETWORK') {
      return 'Não foi possível conectar ao servidor. Tente novamente.';
    }
  }
  return 'Ocorreu um erro inesperado. Tente novamente.';
}
