'use client';

import { Vote, Check } from 'lucide-react';

export interface Poll {
  pollId: string;
  endDay: string;
  myVote: string | null;
  total: number;
  options: { theme: string; name: string; emoji: string; votes: number }[];
}

/**
 * Votação do próximo tema. As parciais só aparecem depois do voto — ver quem
 * está ganhando antes de votar faz a maioria seguir a maioria.
 */
export function ThemePoll({
  poll,
  votando,
  onVotar,
}: {
  poll: Poll | null;
  votando: string | null;
  onVotar: (theme: string) => void;
}): React.ReactElement | null {
  if (!poll || poll.options.length < 2) return null;
  const votou = !!poll.myVote;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center gap-2">
        <Vote className="h-4 w-4 text-violet-600 dark:text-violet-400" />
        <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200">
          Qual o tema da próxima semana?
        </h2>
      </div>
      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
        {votou
          ? `${poll.total} ${poll.total === 1 ? 'voto' : 'votos'} até agora. Dá para trocar até sábado.`
          : 'Você tem um voto. O mais votado vira a temporada de domingo.'}
      </p>

      <div className="mt-3 space-y-2">
        {poll.options.map((o) => {
          const meu = poll.myVote === o.theme;
          const pct = poll.total ? Math.round((o.votes / poll.total) * 100) : 0;
          return (
            <button
              key={o.theme}
              onClick={() => onVotar(o.theme)}
              disabled={!!votando}
              className={`relative w-full overflow-hidden rounded-xl border px-3 py-2.5 text-left transition-colors ${
                meu
                  ? 'border-violet-400 bg-violet-50 dark:border-violet-700 dark:bg-violet-950/40'
                  : 'border-slate-200 hover:border-violet-300 dark:border-slate-700'
              }`}
            >
              {votou && (
                <span
                  className="absolute inset-y-0 left-0 bg-violet-100/70 dark:bg-violet-900/30"
                  style={{ width: `${pct}%` }}
                />
              )}
              <span className="relative flex items-center gap-2">
                <span className="text-lg">{o.emoji}</span>
                <span className="flex-1 truncate text-sm font-medium text-slate-700 dark:text-slate-200">
                  {o.name}
                </span>
                {votou && (
                  <span className="text-xs font-semibold tabular-nums text-slate-500 dark:text-slate-400">
                    {pct}%
                  </span>
                )}
                {meu && <Check className="h-4 w-4 text-violet-600 dark:text-violet-400" />}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
