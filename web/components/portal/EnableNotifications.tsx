'use client';

import { useEffect, useState } from 'react';
import { Bell, Loader2, X, Share, Plus, Smartphone } from 'lucide-react';
import {
  getPushState,
  enablePush,
  pushEnvironment,
  PushState,
  PushEnvironment,
} from '@/lib/push';

const DISMISS_KEY = 'igreja360.push.dismissed';
// O "X" apenas adia: o lembrete volta depois desse prazo e insiste até o
// membro ativar de fato (quem já ativou nunca vê o banner, pois o estado
// deixa de ser 'available').
const SNOOZE_DAYS = 3;
const SNOOZE_MS = SNOOZE_DAYS * 24 * 60 * 60 * 1000;

// Banner p/ o membro ativar as notificações de avisos da igreja.
export function EnableNotifications(): React.ReactElement | null {
  const [state, setState] = useState<PushState | null>(null);
  const [env, setEnv] = useState<PushEnvironment>('ok');
  const [busy, setBusy] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    setEnv(pushEnvironment());
    try {
      const saved = localStorage.getItem(DISMISS_KEY);
      const until = saved ? Number(saved) : 0;
      // Valor legado ('1') não é número: trata como adiado a partir de agora.
      if (saved && !Number.isFinite(until)) {
        localStorage.setItem(DISMISS_KEY, String(Date.now() + SNOOZE_MS));
        setDismissed(true);
      } else if (until > Date.now()) {
        setDismissed(true);
      } else if (saved) {
        localStorage.removeItem(DISMISS_KEY);
      }
    } catch {
      /* ignora */
    }
    getPushState()
      .then(setState)
      .catch(() => setState('unsupported'));
  }, []);

  const iosPrecisaInstalar = env === 'ios-precisa-instalar';

  // Some quando já está inscrito, quando o membro adiou, ou quando o aparelho
  // não tem como receber. No iPhone sem o app instalado o estado é
  // 'unsupported' — aí mostramos o passo a passo da instalação.
  if (dismissed) return null;
  if (!iosPrecisaInstalar && state !== 'available') return null;

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
      localStorage.setItem(DISMISS_KEY, String(Date.now() + SNOOZE_MS));
    } catch {
      /* ignora */
    }
  }

  if (iosPrecisaInstalar) {
    return (
      <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50/70 p-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-white">
          <Smartphone className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-slate-900">
            Instale o app para receber avisos
          </p>
          <p className="mt-1 text-xs leading-relaxed text-amber-800">
            No iPhone, as notificações só funcionam com o portal instalado.
            Toque em <Share className="inline h-3.5 w-3.5 -translate-y-px" />{' '}
            <strong>Compartilhar</strong> e depois em{' '}
            <span className="whitespace-nowrap">
              <Plus className="inline h-3.5 w-3.5 -translate-y-px" />{' '}
              <strong>“Adicionar à Tela de Início”</strong>
            </span>
            .
          </p>
        </div>
        <button
          onClick={dismiss}
          aria-label="Lembrar depois"
          title="Lembrar depois"
          className="shrink-0 text-amber-500 hover:text-amber-700"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    );
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
          Seja avisado no celular sobre novos cultos, eventos, campanhas e
          comunicados da igreja.
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
        aria-label="Lembrar depois"
        title="Lembrar depois"
        className="shrink-0 text-slate-400 hover:text-slate-600"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
