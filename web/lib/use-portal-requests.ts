'use client';

import { useEffect, useState } from 'react';
import { api } from './api';
import { getStoredUser } from './auth';

/** Quem pode ver e resolver pedidos do portal. */
const REQUEST_ROLES = ['SUPER_ADMIN', 'ADMIN', 'PASTOR', 'SECRETARY'];

export interface PortalRequests {
  /** Cadastros de membros aguardando liberação. */
  acessos: number;
  /** Pedidos de "esqueci minha senha". */
  senhas: number;
  /** O que aparece nas bolinhas vermelhas: a fila inteira. */
  total: number;
}

/**
 * Fila de pendências do portal. Vive num lugar só porque três telas mostram
 * o mesmo número (barra lateral, botão Solicitações e aviso do Dashboard) —
 * quando ficava separado, um contava senha e o outro não.
 */
export function usePortalRequests(): PortalRequests {
  const [fila, setFila] = useState({ acessos: 0, senhas: 0 });

  useEffect(() => {
    const role = getStoredUser()?.role ?? '';
    if (!REQUEST_ROLES.includes(role)) return;

    let mounted = true;
    const load = () =>
      Promise.all([
        api.get<unknown[]>('/members/portal/pending'),
        api.get<unknown[]>('/members/portal/reset-requests'),
      ])
        .then(([acessos, senhas]) => {
          if (!mounted) return;
          setFila({
            acessos: Array.isArray(acessos.data) ? acessos.data.length : 0,
            senhas: Array.isArray(senhas.data) ? senhas.data.length : 0,
          });
        })
        .catch(() => undefined);

    load();
    const timer = setInterval(load, 60000);
    window.addEventListener('igreja360:portal-requests-updated', load);
    return () => {
      mounted = false;
      clearInterval(timer);
      window.removeEventListener('igreja360:portal-requests-updated', load);
    };
  }, []);

  return { ...fila, total: fila.acessos + fila.senhas };
}
