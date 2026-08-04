'use client';

import { useCallback, useEffect, useState } from 'react';
import { Bell, BellRing, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { getStoredUser } from '@/lib/auth';
import {
  enableAdminPush,
  getAdminPushState,
  type AdminPushState,
} from '@/lib/admin-push';

/** Quem resolve pedidos do portal (e portanto precisa ser avisado). */
const ROLES_AVISADOS = ['SUPER_ADMIN', 'ADMIN', 'PASTOR', 'SECRETARY'];

/**
 * Convite para ligar as notificações do painel neste aparelho — é assim que a
 * secretaria fica sabendo, na hora, que um membro pediu uma senha nova.
 * Some sozinho quando já está ativo.
 */
export function AdminNotifyCard(): React.ReactElement | null {
  const [state, setState] = useState<AdminPushState | null>(null);
  const [busy, setBusy] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [permitido, setPermitido] = useState(false);

  useEffect(() => {
    const role = getStoredUser()?.role ?? '';
    setPermitido(ROLES_AVISADOS.includes(role));
  }, []);

  const carregar = useCallback(() => {
    getAdminPushState()
      .then(setState)
      .catch(() => setState('available'));
  }, []);

  useEffect(() => {
    if (permitido) carregar();
  }, [permitido, carregar]);

  async function ativar(): Promise<void> {
    setBusy(true);
    setErro(null);
    try {
      setState(await enableAdminPush());
    } catch (e) {
      setErro(
        e instanceof Error ? e.message : 'Não foi possível ativar os avisos.',
      );
    } finally {
      setBusy(false);
    }
  }

  if (!permitido || state === null) return null;
  if (state === 'subscribed' || state === 'unsupported') return null;

  const negado = state === 'denied';
  const precisaInstalar = state === 'ios-precisa-instalar';

  return (
    <Card className="mb-4 border-indigo-200 bg-indigo-50/60 dark:border-indigo-900 dark:bg-indigo-950/30">
      <CardContent className="flex flex-wrap items-center gap-3 p-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600 dark:bg-indigo-900/60 dark:text-indigo-300">
          <BellRing className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            Receba avisos da igreja neste aparelho
          </p>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            {negado
              ? 'As notificações estão bloqueadas neste navegador. Libere nas configurações do site e recarregue a página.'
              : precisaInstalar
                ? 'No iPhone, adicione o painel à tela de início (Compartilhar → Adicionar à Tela de Início) e abra por lá para ativar os avisos.'
                : 'Fique sabendo na hora quando um membro pedir uma senha nova.'}
          </p>
          {erro && (
            <p className="mt-1 text-xs font-medium text-red-600 dark:text-red-400">
              {erro}
            </p>
          )}
        </div>
        {!negado && !precisaInstalar && (
          <Button size="sm" onClick={ativar} disabled={busy}>
            {busy ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Bell className="h-4 w-4" />
            )}
            Ativar avisos
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
