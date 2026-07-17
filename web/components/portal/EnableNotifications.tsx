'use client';

import { useEffect, useState } from 'react';
import { Bell, Loader2, X } from 'lucide-react';
import { getPushState, enablePush, PushState } from '@/lib/push';

const DISMISS_KEY = 'igreja360.push.dismissed';

// Banner p/ o membro ativar as notificações de avisos da igreja.
export function EnableNotifications(): React.ReactElement | null {
  const [state, setState] = useState<PushState | null>(null);
  const [busy, setBusy] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem(DISMISS_KEY)) setDismissed(true);
    } catch {
      /* ignora */
    }
    getPushState()
      .then(setState)
      .catch(() => setState('unsupported'));
  }, []);

  // Só aparece quando dá para ativar (suportado, ainda não inscrito, não bloqueado/dispensado).
  if (state !== 'available' || dismissed) return null;

  async function activate(): Promise<void> {
    setBusy(true);
    try {
      const s = await enablePush();
      setState(s);
      if (s === 'denied') {
        alert(
          'As notificações foram bloqueadas. Você pode reativar nas configurações do navegador.',
        );
      }
    } catch (e) {
      alert(
        e instanceof Error ? e.message : 'Não foi possível ativar as notificações.',
      );
    } finally {
      setBusy(false);
    }
  }

  function dismiss(): void {
    setDismissed(true);
    try {
      localStorage.setItem(DISMISS_KEY, '1');
    } catch {
      /* ignora */
    }
  }

  return (
    <div className="flex items-start gap-3 rounded-2xl border border-indigo-100 bg-indigo-50/60 p-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white">
        <Bell className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-slate-900">
          Ativar notificações
        </p>
        <p className="mt-0.5 text-xs text-slate-500">
          Receba um aviso no celular quando a igreja publicar algo novo.
        </p>
        <button
          onClick={activate}
          disabled={busy}
          className="mt-2 flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          Ativar
        </button>
      </div>
      <button
        onClick={dismiss}
        aria-label="Dispensar"
        className="shrink-0 text-slate-400 hover:text-slate-600"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
