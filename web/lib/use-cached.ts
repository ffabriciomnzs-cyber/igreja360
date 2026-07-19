'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

// Cache simples em memória, compartilhado entre as telas. Como a navegação do
// portal é client-side (o layout não desmonta), o cache sobrevive à troca de
// abas: a tela aparece na hora com o dado anterior e revalida em segundo plano
// ("stale-while-revalidate"), em vez de mostrar "Carregando..." toda vez.
const cache = new Map<string, unknown>();

export function clearCached(key?: string): void {
  if (key) cache.delete(key);
  else cache.clear();
}

/** Atualiza o cache após uma ação do usuário, para não voltar dado velho. */
export function setCached<T>(key: string, updater: T | ((prev: T | null) => T)): void {
  const prev = (cache.get(key) as T | undefined) ?? null;
  const next =
    typeof updater === 'function'
      ? (updater as (p: T | null) => T)(prev)
      : updater;
  cache.set(key, next);
}

interface CachedResult<T> {
  data: T | null;
  /** true apenas na primeira carga (sem nada em cache) — evita spinner ao voltar numa aba. */
  loading: boolean;
  refresh: () => Promise<void>;
}

export function useCached<T>(
  key: string,
  fetcher: () => Promise<T>,
): CachedResult<T> {
  const [data, setData] = useState<T | null>(
    () => (cache.get(key) as T | undefined) ?? null,
  );
  const [loading, setLoading] = useState(!cache.has(key));

  // Mantém o fetcher em ref para não reexecutar o efeito a cada render.
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const refresh = useCallback(async (): Promise<void> => {
    try {
      const fresh = await fetcherRef.current();
      cache.set(key, fresh);
      setData(fresh);
    } catch {
      /* falhou: mantém o que já estava em cache */
    } finally {
      setLoading(false);
    }
  }, [key]);

  useEffect(() => {
    let mounted = true;
    const cached = cache.get(key) as T | undefined;
    if (cached !== undefined) {
      setData(cached);
      setLoading(false);
    } else {
      setLoading(true);
    }
    void (async () => {
      try {
        const fresh = await fetcherRef.current();
        if (!mounted) return;
        cache.set(key, fresh);
        setData(fresh);
      } catch {
        /* mantém cache */
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [key]);

  return { data, loading, refresh };
}
