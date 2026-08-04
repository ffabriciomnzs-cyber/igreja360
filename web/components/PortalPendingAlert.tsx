'use client';

import Link from 'next/link';
import { KeyRound, UserPlus, ChevronRight } from 'lucide-react';
import { usePortalRequests } from '@/lib/use-portal-requests';

/**
 * Aviso no topo do painel quando há gente esperando: cadastro para liberar ou
 * senha para redefinir. Sem isso o pedido ficava só na página de solicitações
 * e passava despercebido.
 */
export function PortalPendingAlert(): React.ReactElement | null {
  const { acessos, senhas } = usePortalRequests();

  if (!acessos && !senhas) return null;

  const partes: string[] = [];
  if (senhas) {
    partes.push(
      senhas === 1
        ? '1 membro pediu uma senha nova'
        : `${senhas} membros pediram senha nova`,
    );
  }
  if (acessos) {
    partes.push(
      acessos === 1
        ? '1 cadastro aguarda liberação'
        : `${acessos} cadastros aguardam liberação`,
    );
  }

  return (
    <Link
      href="/members/portal-requests"
      className="mb-4 flex items-center gap-3 rounded-xl border border-amber-300 bg-amber-50 p-4 transition-colors hover:bg-amber-100 dark:border-amber-900 dark:bg-amber-950/40 dark:hover:bg-amber-950/60"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-300">
        {senhas ? (
          <KeyRound className="h-5 w-5" />
        ) : (
          <UserPlus className="h-5 w-5" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">
          {partes.join(' · ')}
        </p>
        <p className="text-xs text-amber-800/80 dark:text-amber-300/80">
          Toque para resolver em Solicitações de acesso.
        </p>
      </div>
      <ChevronRight className="h-4 w-4 shrink-0 text-amber-700 dark:text-amber-400" />
    </Link>
  );
}
