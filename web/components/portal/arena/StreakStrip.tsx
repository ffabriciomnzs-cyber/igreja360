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
 * Progresso pessoal em TRÊS números: sequência, posição e pontos.
 *
 * Estavam em lugares diferentes — a sequência num card, a posição e os pontos
 * só no rodapé do ranking. Quem abre a Arena quer saber "como eu estou" de
 * relance, e isso não é três olhadas em três lugares. A conquista mais recente
 * entra como rodapé, não como vitrine: medalha é consequência, não objetivo.
 */
export function StreakStrip({
  progress,
  position,
  points,
}: {
  progress: Progress | null;
  position?: number | null;
  points?: number;
}): React.ReactElement | null {
  if (!progress) return null;
  const ganhas = progress.achievements.filter((c) => c.conquistada);
  const ultima = ganhas[ganhas.length - 1];

  const numero = (valor: string, rotulo: string, destaque = false) => (
    <div className="flex-1 text-center">
      <p
        className={`text-xl font-bold tabular-nums ${
          destaque
            ? 'text-orange-600 dark:text-orange-400'
            : 'text-slate-900 dark:text-slate-100'
        }`}
      >
        {valor}
      </p>
      <p className="text-[11px] text-slate-500 dark:text-slate-400">{rotulo}</p>
    </div>
  );

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center divide-x divide-slate-100 dark:divide-slate-800">
        {numero(
          progress.streak > 0 ? `🔥 ${progress.streak}` : '—',
          progress.streak === 1 ? 'dia seguido' : 'dias seguidos',
          progress.streak > 0,
        )}
        {numero(position ? `${position}º` : '—', 'na semana')}
        {numero(String(points ?? 0), 'pontos')}
      </div>

      {ultima && (
        <p className="mt-3 border-t border-slate-100 pt-2.5 text-center text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
          {ultima.emoji} <span className="font-medium">{ultima.nome}</span> —{' '}
          {ultima.descricao}
        </p>
      )}
    </section>
  );
}
