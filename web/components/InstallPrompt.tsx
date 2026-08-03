'use client';

import { useEffect, useState } from 'react';
import { X, Share, Download, Plus } from 'lucide-react';
import {
  estaInstalado,
  podeInstalar,
  disparaInstalacao,
  ehIosManual,
  iniciaCapturaInstalacao,
} from '@/lib/install';

const DISMISS_KEY = 'igreja360.install.dismissed';
// O "X" apenas adia: instalar o app é a porta das notificações (especialmente
// no iPhone), então o lembrete volta até a pessoa instalar de verdade.
const SNOOZE_DIAS = 3;
const SNOOZE_MS = SNOOZE_DIAS * 24 * 60 * 60 * 1000;

export function InstallPrompt(): React.ReactElement | null {
  const [visible, setVisible] = useState(false);
  const [ios, setIos] = useState(false);

  useEffect(() => {
    // Registra o service worker (necessário para o Android oferecer instalar).
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => undefined);
    }
    iniciaCapturaInstalacao();

    if (estaInstalado()) return;

    // Adiado recentemente? (valor legado '1' vira adiamento a partir de agora)
    try {
      const salvo = localStorage.getItem(DISMISS_KEY);
      const ate = salvo ? Number(salvo) : 0;
      if (salvo && !Number.isFinite(ate)) {
        localStorage.setItem(DISMISS_KEY, String(Date.now() + SNOOZE_MS));
        return;
      }
      if (ate > Date.now()) return;
      if (salvo) localStorage.removeItem(DISMISS_KEY);
    } catch {
      /* ignora */
    }

    if (ehIosManual()) {
      const ua = window.navigator.userAgent.toLowerCase();
      const isSafari = /safari/.test(ua) && !/crios|fxios|edgios|opios/.test(ua);
      if (isSafari) {
        setIos(true);
        setVisible(true);
      }
      return;
    }

    // Android/Chrome: aparece quando (ou se) o prompt estiver disponível.
    if (podeInstalar()) setVisible(true);
    const disponivel = (): void => setVisible(true);
    const instalado = (): void => setVisible(false);
    window.addEventListener('igreja360:install-available', disponivel);
    window.addEventListener('igreja360:installed', instalado);
    return () => {
      window.removeEventListener('igreja360:install-available', disponivel);
      window.removeEventListener('igreja360:installed', instalado);
    };
  }, []);

  function dismiss(): void {
    setVisible(false);
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now() + SNOOZE_MS));
    } catch {
      /* ignora */
    }
  }

  async function install(): Promise<void> {
    const aceitou = await disparaInstalacao();
    if (aceitou) setVisible(false);
    else dismiss();
  }

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-20 z-30 mx-auto max-w-2xl px-4">
      <div className="flex items-start gap-3 rounded-2xl border border-indigo-100 bg-white p-4 shadow-xl dark:border-indigo-900 dark:bg-slate-900">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white">
          <Download className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            Instale o app da igreja
          </p>
          {ios ? (
            <p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
              Toque em{' '}
              <Share className="inline h-3.5 w-3.5 -translate-y-px text-indigo-600 dark:text-indigo-400" />{' '}
              <strong>Compartilhar</strong> na barra do Safari e depois em{' '}
              <span className="whitespace-nowrap">
                <Plus className="inline h-3.5 w-3.5 -translate-y-px text-indigo-600 dark:text-indigo-400" />{' '}
                <strong>“Adicionar à Tela de Início”</strong>
              </span>
              . Sem isso o iPhone não recebe as notificações!
            </p>
          ) : (
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              A igreja a um toque, com notificações de cultos e avisos.
            </p>
          )}
          {!ios && (
            <button
              onClick={() => void install()}
              className="mt-2 rounded-lg bg-indigo-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700"
            >
              Instalar aplicativo
            </button>
          )}
        </div>
        <button
          onClick={dismiss}
          aria-label="Lembrar depois"
          title="Lembrar depois"
          className="shrink-0 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
