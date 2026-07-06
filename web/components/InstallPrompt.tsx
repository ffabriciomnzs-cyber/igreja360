'use client';

import { useEffect, useState } from 'react';
import { X, Share, Download, Plus } from 'lucide-react';

const DISMISS_KEY = 'igreja360.install.dismissed';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: string }>;
}

export function InstallPrompt(): React.ReactElement | null {
  const [visible, setVisible] = useState(false);
  const [ios, setIos] = useState(false);
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(
    null,
  );

  useEffect(() => {
    // Registra o service worker (necessário para o Android oferecer instalar).
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => undefined);
    }

    // Já está instalado (rodando como app)? Não mostra nada.
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (navigator as unknown as { standalone?: boolean }).standalone === true;
    if (standalone) return;

    // Usuário já dispensou antes?
    try {
      if (localStorage.getItem(DISMISS_KEY)) return;
    } catch {
      /* ignora */
    }

    const ua = window.navigator.userAgent.toLowerCase();
    const isIOS = /iphone|ipad|ipod/.test(ua);

    if (isIOS) {
      // No iOS a instalação é manual (via Safari). Mostra instruções.
      const isSafari =
        /safari/.test(ua) && !/crios|fxios|edgios|opios/.test(ua);
      if (isSafari) {
        setIos(true);
        setVisible(true);
      }
      return;
    }

    // Android/Chrome: captura o evento e mostra o botão "Instalar".
    const handler = (e: Event): void => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setVisible(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', () => setVisible(false));
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  function dismiss(): void {
    setVisible(false);
    try {
      localStorage.setItem(DISMISS_KEY, '1');
    } catch {
      /* ignora */
    }
  }

  async function install(): Promise<void> {
    if (!deferred) return;
    try {
      await deferred.prompt();
      await deferred.userChoice;
    } catch {
      /* ignora */
    }
    setDeferred(null);
    dismiss();
  }

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-20 z-30 mx-auto max-w-2xl px-4">
      <div className="flex items-start gap-3 rounded-2xl border border-indigo-100 bg-white p-4 shadow-xl">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white">
          <Download className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-slate-900">
            Instale o app da igreja
          </p>
          {ios ? (
            <p className="mt-1 text-xs leading-relaxed text-slate-500">
              Toque em{' '}
              <Share className="inline h-3.5 w-3.5 -translate-y-px text-indigo-600" />{' '}
              <strong>Compartilhar</strong> na barra do Safari e depois em{' '}
              <span className="whitespace-nowrap">
                <Plus className="inline h-3.5 w-3.5 -translate-y-px text-indigo-600" />{' '}
                <strong>“Adicionar à Tela de Início”</strong>
              </span>
              .
            </p>
          ) : (
            <p className="mt-0.5 text-xs text-slate-500">
              Tenha o portal na tela inicial e abra como um aplicativo.
            </p>
          )}
          {!ios && (
            <button
              onClick={install}
              className="mt-2 rounded-lg bg-indigo-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700"
            >
              Instalar aplicativo
            </button>
          )}
        </div>
        <button
          onClick={dismiss}
          aria-label="Fechar"
          className="shrink-0 text-slate-400 hover:text-slate-600"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
