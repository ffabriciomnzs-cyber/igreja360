'use client';

import { Flame } from 'lucide-react';

export interface Progress {
  streak: number;
  bestStreakCorrect: number;
  perfectRounds: number;
  duelWins: number;
  weeksInARow: number;
  achievements: {
    id: string;
    nome: string;
    emoji: string;
    descricao: string;
    conquistada: boolean;
    progresso: number;
    alvo: number;
  }[];
}

/**
 * Sequência e conquistas em UMA faixa.
 *
 * A tentação aqui é uma tela de troféus; o efeito seria mais um lugar para
 * navegar e menos gente jogando. Fica o que cabe de relance: a sequência e as
 * medalhas já ganhas, com a próxima a caminho.
 */
export function StreakStrip({ progress }: { progress: Progress | null }): React.ReactElement | null {
  if (!progress) return null;
  const ganhas = progress.achievements.filter((c) => c.conquistada);
  const proxima = progress.achievements.find((c) => !c.conquistada);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-50 dark:bg-orange-950/40">
          <Flame
            className={`h-5 w-5 ${progress.streak > 0 ? 'text-orange-500' : 'text-slate-300 dark:text-slate-600'}`}
          />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
            {progress.streak > 0
              ? `${progress.streak} ${progress.streak === 1 ? 'dia seguido' : 'dias seguidos'}`
              : 'Comece sua sequência hoje'}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {progress.streak > 0
              ? 'Termine a Arena de hoje para não perder.'
              : 'Cada dia com a rodada fechada soma um.'}
          </p>
        </div>
      </div>

      {ganhas.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {ganhas.map((c) => (
            <span
              key={c.id}
              title={c.descricao}
              className="rounded-lg bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300"
            >
              {c.emoji} {c.nome}
            </span>
          ))}
        </div>
      )}

      {proxima && (
        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
          Próxima: {proxima.emoji} <span className="font-medium">{proxima.nome}</span> —{' '}
          {proxima.descricao} ({proxima.progresso}/{proxima.alvo})
        </p>
      )}
    </section>
  );
}
