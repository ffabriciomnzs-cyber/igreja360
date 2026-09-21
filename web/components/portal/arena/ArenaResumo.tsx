'use client';

// Card compacto da Arena na tela inicial.
//
// A tentação é trazer tudo (tema, missão, votação, duelos, ranking) para cá.
// O efeito seria empurrar para baixo o que a igreja precisa ver primeiro —
// aviso, culto, pedido de oração. Aqui fica só o que chama de volta ao jogo.

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Swords, Flame, ChevronRight, Zap } from 'lucide-react';
import { memberApi } from '@/lib/member-api';

interface Resumo {
  season: { name: string; emoji: string } | null;
  streak: number;
  myTurnDuels: number;
  flashOpen: boolean;
}

export function ArenaResumo({ base }: { base: string }): React.ReactElement | null {
  const [r, setR] = useState<Resumo | null>(null);

  useEffect(() => {
    memberApi
      .get<Resumo>('/member-auth/arena/summary')
      .then((res) => setR(res.data))
      .catch(() => undefined);
  }, []);

  if (!r) return null;

  const chamada = r.flashOpen
    ? 'Desafio surpresa aberto agora!'
    : r.myTurnDuels > 0
      ? `${r.myTurnDuels} ${r.myTurnDuels === 1 ? 'desafio espera' : 'desafios esperam'} você`
      : r.season
        ? `Temporada: ${r.season.name}`
        : 'Jogue o desafio de hoje';

  return (
    <Link
      href={`${base}/arena`}
      className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
    >
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-950/40">
        {r.flashOpen ? (
          <Zap className="h-5 w-5 text-amber-500" />
        ) : (
          <Swords className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
          Arena Bíblica {r.season ? r.season.emoji : ''}
        </p>
        <p className="truncate text-xs text-slate-500 dark:text-slate-400">{chamada}</p>
      </div>
      {r.streak > 0 && (
        <span className="flex shrink-0 items-center gap-1 rounded-lg bg-orange-50 px-2 py-1 text-xs font-bold text-orange-600 dark:bg-orange-950/40 dark:text-orange-400">
          <Flame className="h-3.5 w-3.5" />
          {r.streak}
        </span>
      )}
      <ChevronRight className="h-5 w-5 shrink-0 text-slate-400" />
    </Link>
  );
}
