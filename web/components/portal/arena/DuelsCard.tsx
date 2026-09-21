'use client';

// Desafios 1x1 na Arena. Separados por TIPO: um convite para decidir e um
// convite esperando o outro pedem coisas diferentes de quem lê — misturados
// numa lista só, a decisão acabava indo parar no WhatsApp.

import { useState } from 'react';
import Link from 'next/link';
import { Swords, Loader2, Share2, ChevronRight, Check, X } from 'lucide-react';
import { memberApi } from '@/lib/member-api';
import { desafiarAlguem } from '@/lib/arena-duelo';

export interface Duel {
  id: string;
  token: string;
  total: number;
  opponentName: string | null;
  iAmChallenger: boolean;
  isRematch: boolean;
  myAnswered: number;
  finished: boolean;
  myTurn: boolean;
  waitingOther: boolean;
}

export interface Duels {
  received: Duel[];
  sent: Duel[];
  playing: Duel[];
  finished: Duel[];
}

export function DuelsCard({
  duels,
  base,
  meuNome,
  onCriou,
}: {
  duels: Duels;
  base: string;
  meuNome: string;
  onCriou: () => void;
}): React.ReactElement {
  const [criando, setCriando] = useState(false);
  const [decidindo, setDecidindo] = useState<string | null>(null);

  async function desafiar(): Promise<void> {
    if (criando) return;
    setCriando(true);
    try {
      await desafiarAlguem(base, meuNome);
    } catch {
      /* cancelar o compartilhamento não é erro */
    } finally {
      setCriando(false);
      onCriou();
    }
  }

  async function decide(id: string, acao: 'accept' | 'decline'): Promise<void> {
    if (decidindo) return;
    setDecidindo(id);
    try {
      await memberApi.post(`/member-auth/arena/duels/${id}/${acao}`);
    } catch {
      /* já decidido: recarregar mostra a verdade do servidor */
    } finally {
      setDecidindo(null);
      onCriou();
    }
  }

  const emJogo = duels.playing.slice(0, 2);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center gap-2">
        <Swords className="h-4 w-4 text-rose-600 dark:text-rose-400" />
        <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200">
          Desafio 1 contra 1
        </h2>
      </div>

      {/* Convite recebido tem prioridade visual: é o que pede decisão. */}
      {duels.received.map((d) => (
        <div
          key={d.id}
          className="mt-3 rounded-xl border border-rose-200 bg-rose-50 p-3 dark:border-rose-900 dark:bg-rose-950/40"
        >
          <p className="text-sm font-semibold text-rose-900 dark:text-rose-200">
            {d.isRematch ? '🔁' : '⚔️'} {d.opponentName ?? 'Alguém'}{' '}
            {d.isRematch ? 'pediu revanche' : 'desafiou você'}
          </p>
          <div className="mt-2 flex gap-2">
            <button
              onClick={() => void decide(d.id, 'accept')}
              disabled={decidindo === d.id}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-rose-600 py-2 text-xs font-bold text-white disabled:opacity-60"
            >
              {decidindo === d.id ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <>
                  <Check className="h-3.5 w-3.5" /> Aceitar
                </>
              )}
            </button>
            <button
              onClick={() => void decide(d.id, 'decline')}
              disabled={decidindo === d.id}
              className="flex items-center justify-center gap-1.5 rounded-lg border border-rose-300 px-3 py-2 text-xs font-medium text-rose-700 disabled:opacity-60 dark:border-rose-800 dark:text-rose-300"
            >
              <X className="h-3.5 w-3.5" /> Recusar
            </button>
          </div>
        </div>
      ))}

      {/* Partidas em andamento: no máximo duas linhas. */}
      {emJogo.length > 0 && (
        <div className="mt-3 space-y-1.5">
          {emJogo.map((d) => (
            <Link
              key={d.id}
              href={`${base}/arena/duelo/${d.token}`}
              className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 text-sm dark:bg-slate-800/60"
            >
              <span className="min-w-0 flex-1 truncate text-slate-700 dark:text-slate-300">
                {d.opponentName ?? 'Adversário'}
              </span>
              <span className="shrink-0 text-xs font-medium text-slate-500 dark:text-slate-400">
                {d.waitingOther ? 'aguardando' : `sua vez · ${d.myAnswered}/${d.total}`}
              </span>
              <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" />
            </Link>
          ))}
        </div>
      )}

      {duels.sent.length > 0 && (
        <p className="mt-2.5 text-xs text-slate-500 dark:text-slate-400">
          {duels.sent.length === 1
            ? `1 desafio enviado aguardando resposta${
                duels.sent[0].opponentName ? ` de ${duels.sent[0].opponentName}` : ''
              }`
            : `${duels.sent.length} desafios enviados aguardando resposta`}
        </p>
      )}

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
    </section>
  );
}
