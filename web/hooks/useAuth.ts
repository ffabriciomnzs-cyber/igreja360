'use client';

import { useCallback, useEffect, useState } from 'react';
import { api, extractApiError } from '@/lib/api';
import {
  AuthUser,
  clearSession,
  getStoredUser,
  saveSession,
} from '@/lib/auth';

interface LoginResult {
  ok: boolean;
  error?: string;
}

interface UseAuth {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<LoginResult>;
  logout: () => void;
}

export function useAuth(): UseAuth {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setUser(getStoredUser());
    setLoading(false);
    const onUserUpdated = (): void => setUser(getStoredUser());
    window.addEventListener('igreja360:user-updated', onUserUpdated);
    return () =>
      window.removeEventListener('igreja360:user-updated', onUserUpdated);
  }, []);

  const login = useCallback(
    async (email: string, password: string): Promise<LoginResult> => {
      try {
        const { data } = await api.post<{
          accessToken: string;
          refreshToken: string;
          user: AuthUser;
        }>('/auth/login', { email, password });
        saveSession(data.accessToken, data.refreshToken, data.user);
        setUser(data.user);
        return { ok: true };
      } catch (error) {
        return { ok: false, error: extractApiError(error) };
      }
    },
    [],
  );

  const logout = useCallback((): void => {
    clearSession();
    setUser(null);
    if (typeof window !== 'undefined') {
      window.location.href = '/auth';
    }
  }, []);

  return { user, loading, login, logout };
}
