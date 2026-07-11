'use client';

import { Play, Pause, Loader2, Radio as RadioIcon, X } from 'lucide-react';
import { useRadioPlayer } from './radio-player';

// Barrinha flutuante de "tocando agora", exibida em qualquer tela do portal
// enquanto a rádio está ativa (fica logo acima da navegação inferior).
export function RadioMiniBar(): React.ReactElement | null {
  const { current, playing, loading, toggle, stop } = useRadioPlayer();
  if (!current) return null;

  return (
    <div className="fixed inset-x-0 bottom-[76px] z-20 px-3">
      <div className="mx-auto flex max-w-md items-center gap-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-700 px-3 py-2 text-white shadow-lg">
        <button
          onClick={toggle}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-indigo-700"
          aria-label={playing ? 'Pausar' : 'Tocar'}
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : playing ? (
            <Pause className="h-4 w-4" />
          ) : (
            <Play className="h-4 w-4 translate-x-px" />
          )}
        </button>
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1 text-[10px] uppercase tracking-wide text-indigo-200">
            <RadioIcon className="h-3 w-3" />
            {playing ? 'Tocando' : loading ? 'Conectando…' : 'Pausado'}
          </p>
          <p className="truncate text-sm font-semibold leading-tight">
            {current.name}
          </p>
        </div>
        <button
          onClick={stop}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-white/80 hover:bg-white/15"
          aria-label="Fechar rádio"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
