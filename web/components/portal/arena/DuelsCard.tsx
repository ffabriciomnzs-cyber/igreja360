'use client';

// Desafio 1x1. O convite viaja por link: quem abre vira o adversário.

import { useState } from 'react';
import Link from 'next/link';
import { Swords, Loader2, Share2, ChevronRight } from 'lucide-react';
import { desafiarAlguem } from '@/lib/arena-duelo';

export interface Duel {
  id: string;
  token: string;
  total: number;
  opponentName: string | null;
  opponentPhoto: string | null;
  iAmChallenger: boolean;
  myAnswered: number;
  waitingOther: boolean;
  pendingInvite: boolean;
}

export function DuelsCard({
  duels,
  base,
  meuNome,
  onCriou,
}: {
  duels: Duel[];
  base: string;
  meuNome: string;
  onCriou: () => void;
}): React.ReactElement {
  const [criando, setCriando] = useState(false);

  async function desafiar(): Promise<void> {
    if (criando) return;
    setCriando(true);
    try {
      await desafiarAlguem(base, meuNome);
    } catch {
      /* cancelar o compartilhamento cai aqui e não é erro */
    } finally {
      setCriando(false);
      onCriou();
    }
  }

  // Só o que pede ação, e no máximo dois: a Arena não é uma lista de duelos.
  const minhaVez = duels.filter((d) => !d.pendingInvite && d.myAnswered < d.total);
  const prontos = duels.filter(
    (d) => !d.pendingInvite && d.myAnswered >= d.total && !d.waitingOther,
  );
  const mostrar = [...minhaVez, ...prontos].slice(0, 2);
  const esperando = duels.filter((d) => d.pendingInvite).length;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center gap-2">
        <Swords className="h-4 w-4 text-rose-600 dark:text-rose-400" />
        <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200">
          Desafio 1 contra 1
        </h2>
      </div>
      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
        {esperando > 0
          ? `${esperando} convite(s) esperando alguém aceitar.`
          : '5 perguntas, mesmas para os dois. Não conta para o ranking.'}
      </p>

      <button
        onClick={() => void desafiar()}
        disabled={criando}
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-rose-600 py-3 text-sm font-semibold text-white transition-colors hover:bg-rose-700 disabled:opacity-60"
      >
        {criando ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <>
            <Share2 className="h-4 w-4" />
            Desafiar alguém
          </>
        )}
      </button>

      {mostrar.length > 0 && (
        <div className="mt-3 space-y-1.5">
          {mostrar.map((d) => (
            <Link
              key={d.id}
              href={`${base}/arena/duelo/${d.token}`}
              className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 text-sm dark:bg-slate-800/60"
            >
              <span className="min-w-0 flex-1 truncate text-slate-700 dark:text-slate-300">
                {d.opponentName ?? 'Aguardando alguém'}
              </span>
              <span className="shrink-0 text-xs font-medium text-slate-500 dark:text-slate-400">
                {d.myAnswered >= d.total
                  ? d.waitingOther
                    ? 'esperando'
                    : 'ver resultado'
                  : `sua vez · ${d.myAnswered}/${d.total}`}
              </span>
              <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" />
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
