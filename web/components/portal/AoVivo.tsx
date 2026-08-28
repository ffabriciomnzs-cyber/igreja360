'use client';

// Faixa "AO VIVO" na tela inicial do portal, com o player embutido.
// A transmissão é do YouTube (que aguenta a audiência de graça); aqui o
// membro assiste sem sair do app da igreja.

import { useState } from 'react';
import { Radio, ExternalLink, Play } from 'lucide-react';

export interface LiveState {
  active: boolean;
  title: string | null;
  embedUrl: string | null;
  watchUrl: string | null;
}

export function AoVivo({ live }: { live: LiveState | null }): React.ReactElement | null {
  // O player só carrega depois do toque: evita o vídeo começar sozinho e
  // gastar internet de quem só abriu o app para ver um aviso.
  const [tocando, setTocando] = useState(false);

  if (!live?.active || !live.embedUrl) return null;

  return (
    <div className="overflow-hidden rounded-2xl border border-red-200 bg-white shadow-sm dark:border-red-900 dark:bg-slate-900">
      <div className="flex items-center gap-2 bg-red-600 px-4 py-2.5 text-white">
        <span className="h-2 w-2 animate-pulse rounded-full bg-white" />
        <span className="text-xs font-bold uppercase tracking-widest">Ao vivo agora</span>
        <Radio className="ml-auto h-4 w-4 text-red-200" />
      </div>

      {tocando ? (
        <iframe
          src={`${live.embedUrl}${live.embedUrl.includes('?') ? '&' : '?'}autoplay=1`}
          title={live.title ?? 'Transmissão ao vivo'}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="aspect-video w-full bg-black"
        />
      ) : (
        <button
          onClick={() => setTocando(true)}
          className="flex aspect-video w-full items-center justify-center bg-slate-900"
        >
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-red-600 shadow-lg">
            <Play className="ml-1 h-7 w-7 fill-white text-white" />
          </span>
        </button>
      )}

      <div className="flex items-center justify-between gap-3 px-4 py-3">
        <p className="min-w-0 flex-1 truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
          {live.title ?? 'Transmissão da igreja'}
        </p>
        {live.watchUrl && (
          <a
            href={live.watchUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex shrink-0 items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400"
          >
            YouTube
            <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </div>
    </div>
  );
}
