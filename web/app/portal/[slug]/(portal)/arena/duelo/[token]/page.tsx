'use client';

// Tela do desafio 1x1. O relógio, a entrega da pergunta e o placar do outro
// são todos decididos no servidor — aqui é só o espelho.

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Swords,
  Timer,
  Loader2,
  Check,
  X,
  ChevronRight,
  RotateCcw,
  BookOpen,
} from 'lucide-react';
import { memberApi } from '@/lib/member-api';
import { cn } from '@/lib/utils';

interface Jogador {
  id: string;
  name: string;
  photo: string | null;
  score: number | null;
  answered: number;
  done: boolean;
}

type Status =
  | 'INVITED'
  | 'ACTIVE'
  | 'WAITING_OPPONENT'
  | 'COMPLETED'
  | 'DECLINED'
  | 'EXPIRED';

interface Estado {
  id: string;
  token: string;
  status: Status;
  isRematch: boolean;
  canDecide: boolean;
  total: number;
  seconds: number;
  side: 'challenger' | 'opponent' | null;
  challenger: Jogador;
  opponent: Jogador | null;
  finished: boolean;
  winner: 'challenger' | 'opponent' | 'draw' | null;
  history: { aWins: number; bWins: number; draws: number } | null;
  current: {
    id: string;
    question: string;
    options: string[];
    remaining: number | null;
    index: number;
  } | null;
}

interface Resultado {
  correct: boolean;
  timedOut: boolean;
  answer: number;
  ref: string;
  state: Estado;
}

function iniciais(nome: string): string {
  const p = nome.trim().split(/\s+/);
  return ((p[0]?.[0] ?? '') + (p.length > 1 ? p[p.length - 1][0] : '')).toUpperCase();
}

function Avatar({ j }: { j: Jogador | null }): React.ReactElement {
  return (
    <span className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-slate-100 text-sm font-bold text-slate-500 dark:bg-slate-800 dark:text-slate-400">
      {j?.photo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={j.photo} alt={j.name} className="h-full w-full object-cover" />
      ) : (
        iniciais(j?.name ?? '?')
      )}
    </span>
  );
}

export default function DueloPage(): React.ReactElement {
  const { slug, token } = useParams<{ slug: string; token: string }>();
  const router = useRouter();
  const base = `/portal/${slug}`;

  const [estado, setEstado] = useState<Estado | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [restam, setRestam] = useState<number | null>(null);
  const [abrindo, setAbrindo] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [revelado, setRevelado] = useState<Resultado | null>(null);
  const [minhaEscolha, setMinhaEscolha] = useState<number | null>(null);
  const [decidindo, setDecidindo] = useState(false);

  async function decide(acao: 'accept' | 'decline'): Promise<void> {
    if (!estado || decidindo) return;
    setDecidindo(true);
    try {
      await memberApi.post(`/member-auth/arena/duels/${estado.id}/${acao}`);
      if (acao === 'decline') router.push(`${base}/arena`);
      else await carrega();
    } catch {
      await carrega();
    } finally {
      setDecidindo(false);
    }
  }

  const carrega = useCallback(async (): Promise<void> => {
    try {
      const { data } = await memberApi.get<Estado>(
        `/member-auth/arena/duels/token/${token}`,
      );
      setEstado(data);
      setRestam(data.current?.remaining ?? null);
    } catch {
      setErro('Desafio não encontrado ou expirado.');
    }
  }, [token]);

  useEffect(() => {
    void carrega();
  }, [carrega]);

  // Contagem regressiva da pergunta em curso.
  useEffect(() => {
    if (restam === null || revelado || !estado?.current) return;
    if (restam <= 0) {
      void responder(-1);
      return;
    }
    const t = setTimeout(() => setRestam((r) => (r === null ? null : r - 1)), 1000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restam, revelado, estado?.current?.id]);

  async function comecar(): Promise<void> {
    if (!estado?.current || abrindo) return;
    setAbrindo(true);
    try {
      const { data } = await memberApi.post<{ remaining: number }>(
        `/member-auth/arena/duels/${estado.id}/open`,
        { questionId: estado.current.id },
      );
      setRestam(data.remaining);
    } catch {
      setRestam(null);
    } finally {
      setAbrindo(false);
    }
  }

  async function responder(escolha: number): Promise<void> {
    if (!estado?.current || enviando || revelado) return;
    setEnviando(true);
    setMinhaEscolha(escolha);
    try {
      const { data } = await memberApi.post<Resultado>(
        `/member-auth/arena/duels/${estado.id}/answer`,
        { questionId: estado.current.id, choice: escolha },
      );
      setRevelado(data);
      setRestam(null);
    } catch {
      setMinhaEscolha(null);
    } finally {
      setEnviando(false);
    }
  }

  function proxima(): void {
    if (!revelado) return;
    setEstado(revelado.state);
    setRestam(null);
    setRevelado(null);
    setMinhaEscolha(null);
  }

  async function revanche(): Promise<void> {
    if (!estado || decidindo) return;
    setDecidindo(true);
    try {
      const { data } = await memberApi.post<{ token: string }>(
        '/member-auth/arena/duels',
        { rematchOf: estado.id },
      );
      // A revanche é um CONVITE: quem pediu espera o aceite do outro.
      router.push(`${base}/arena/duelo/${data.token}`);
    } finally {
      setDecidindo(false);
    }
  }

  if (erro) {
    return (
      <div className="space-y-4">
        <p className="rounded-2xl bg-red-50 px-4 py-6 text-center text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
          {erro}
        </p>
        <Link
          href={`${base}/arena`}
          className="block rounded-xl bg-indigo-600 py-3 text-center text-sm font-semibold text-white"
        >
          Voltar para a Arena
        </Link>
      </div>
    );
  }

  if (!estado) {
    return <div className="h-64 animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-800" />;
  }

  const souDesafiante = estado.side === 'challenger';
  const eu = souDesafiante ? estado.challenger : estado.opponent;
  const outro = souDesafiante ? estado.opponent : estado.challenger;
  const venci =
    estado.winner === 'draw'
      ? 'draw'
      : estado.winner
        ? (estado.winner === 'challenger') === souDesafiante
        : null;

  return (
    <div className="space-y-4">
      <h1 className="flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-slate-100">
        <Swords className="h-5 w-5 text-rose-600 dark:text-rose-400" />
        Desafio 1 contra 1
      </h1>

      {/* Placar */}
      <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col items-center gap-1">
          <Avatar j={eu} />
          <p className="max-w-[6rem] truncate text-xs font-medium text-slate-600 dark:text-slate-300">
            {eu?.name ?? 'Você'}
          </p>
          <p className="text-xl font-bold tabular-nums text-slate-900 dark:text-slate-100">
            {eu?.score ?? '–'}
          </p>
        </div>
        <span className="text-sm font-bold text-slate-400">x</span>
        <div className="flex flex-col items-center gap-1">
          <Avatar j={outro} />
          <p className="max-w-[6rem] truncate text-xs font-medium text-slate-600 dark:text-slate-300">
            {outro?.name ?? 'Aguardando'}
          </p>
          <p className="text-xl font-bold tabular-nums text-slate-900 dark:text-slate-100">
            {outro?.score ?? '–'}
          </p>
        </div>
      </div>

      {estado.history && (
        <p className="text-center text-xs text-slate-500 dark:text-slate-400">
          Entre vocês: você {souDesafiante ? estado.history.aWins : estado.history.bWins},{' '}
          {outro?.name?.split(' ')[0] ?? 'ele'}{' '}
          {souDesafiante ? estado.history.bWins : estado.history.aWins}
          {estado.history.draws > 0 &&
            `, ${estado.history.draws} ${estado.history.draws === 1 ? 'empate' : 'empates'}`}
        </p>
      )}

      {/* Fim de jogo */}
      {estado.status === 'COMPLETED' ? (
        <div
          className={cn(
            'rounded-2xl p-6 text-center text-white shadow-lg',
            venci === true
              ? 'bg-gradient-to-br from-emerald-600 to-teal-700'
              : venci === 'draw'
                ? 'bg-gradient-to-br from-slate-600 to-slate-700'
                : 'bg-gradient-to-br from-rose-600 to-red-700',
          )}
        >
          <p className="text-3xl">
            {venci === true ? '🏆' : venci === 'draw' ? '🤝' : '💪'}
          </p>
          <p className="mt-2 text-lg font-bold">
            {venci === 'draw'
              ? `Empate! ${eu?.score ?? 0} x ${outro?.score ?? 0}`
              : venci === true
                ? `Você venceu! ${eu?.score ?? 0} x ${outro?.score ?? 0}`
                : `${outro?.name?.split(' ')[0] ?? 'Ele'} venceu ${outro?.score ?? 0} x ${eu?.score ?? 0}`}
          </p>
          <button
            onClick={() => void revanche()}
            disabled={decidindo}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-white/20 py-3 text-sm font-semibold disabled:opacity-60"
          >
            <RotateCcw className="h-4 w-4" />
            Pedir revanche
          </button>
        </div>
      ) : estado.status === 'DECLINED' ? (
        <p className="rounded-2xl bg-slate-50 px-4 py-6 text-center text-sm text-slate-600 dark:bg-slate-800/60 dark:text-slate-300">
          Este desafio foi recusado.
        </p>
      ) : estado.status === 'EXPIRED' ? (
        <p className="rounded-2xl bg-slate-50 px-4 py-6 text-center text-sm text-slate-600 dark:bg-slate-800/60 dark:text-slate-300">
          Este convite expirou.
        </p>
      ) : estado.status === 'INVITED' ? (
        estado.canDecide ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-center dark:border-rose-900 dark:bg-rose-950/40">
            <p className="text-sm font-semibold text-rose-900 dark:text-rose-200">
              {estado.isRematch ? '🔁' : '⚔️'}{' '}
              {outro?.name?.split(' ')[0] ?? 'Alguém'}{' '}
              {estado.isRematch ? 'pediu revanche' : 'desafiou você'}
            </p>
            <p className="mt-1 text-xs text-rose-700 dark:text-rose-300">
              {estado.total} perguntas, {estado.seconds} segundos cada.
            </p>
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => void decide('accept')}
                disabled={decidindo}
                className="flex-1 rounded-xl bg-rose-600 py-3 text-sm font-bold text-white disabled:opacity-60"
              >
                {decidindo ? (
                  <Loader2 className="mx-auto h-4 w-4 animate-spin" />
                ) : (
                  'Aceitar'
                )}
              </button>
              <button
                onClick={() => void decide('decline')}
                disabled={decidindo}
                className="rounded-xl border border-rose-300 px-5 py-3 text-sm font-medium text-rose-700 disabled:opacity-60 dark:border-rose-800 dark:text-rose-300"
              >
                Recusar
              </button>
            </div>
          </div>
        ) : (
          <p className="rounded-2xl bg-amber-50 px-4 py-6 text-center text-sm text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
            Aguardando {outro?.name?.split(' ')[0] ?? 'o adversário'} aceitar...
          </p>
        )
      ) : estado.status === 'WAITING_OPPONENT' ? (
        <p className="rounded-2xl bg-slate-50 px-4 py-6 text-center text-sm text-slate-600 dark:bg-slate-800/60 dark:text-slate-300">
          Você terminou! Aguardando {outro?.name?.split(' ')[0] ?? 'o adversário'}{' '}
          terminar...
        </p>
      ) : !estado.side ? (
        <p className="rounded-2xl bg-amber-50 px-4 py-4 text-center text-sm text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
          Este desafio já tem dois jogadores.
        </p>
      ) : !estado.current ? (
        <p className="rounded-2xl bg-slate-50 px-4 py-6 text-center text-sm text-slate-600 dark:bg-slate-800/60 dark:text-slate-300">
          Você terminou! Agora é esperar {outro?.name ?? 'o adversário'} responder.
        </p>
      ) : (
        /* Pergunta da vez */
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 dark:border-slate-800">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Pergunta {estado.current.index} de {estado.total}
            </span>
            {restam !== null && !revelado && (
              <span
                className={cn(
                  'flex items-center gap-1 text-sm font-bold tabular-nums',
                  restam <= 7 ? 'text-red-600' : 'text-emerald-600',
                )}
              >
                <Timer className="h-4 w-4" />
                {restam}s
              </span>
            )}
          </div>

          <div className="p-5">
            {restam === null && !revelado ? (
              <div className="py-6 text-center">
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {estado.seconds} segundos para responder. O relógio começa no
                  toque.
                </p>
                <button
                  onClick={() => void comecar()}
                  disabled={abrindo}
                  className="mt-4 w-full rounded-xl bg-rose-600 py-3.5 text-sm font-semibold text-white disabled:opacity-60"
                >
                  {abrindo ? (
                    <Loader2 className="mx-auto h-4 w-4 animate-spin" />
                  ) : (
                    'Começar'
                  )}
                </button>
              </div>
            ) : (
              <>
                <p className="text-base font-semibold leading-snug text-slate-900 dark:text-slate-100">
                  {estado.current.question}
                </p>
                <div className="mt-4 space-y-2.5">
                  {estado.current.options.map((opcao, i) => {
                    const certa = revelado && i === revelado.answer;
                    const errei =
                      revelado && i === minhaEscolha && minhaEscolha >= 0 && !revelado.correct;
                    return (
                      <button
                        key={i}
                        onClick={() => void responder(i)}
                        disabled={enviando || !!revelado}
                        className={cn(
                          'flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm font-medium',
                          certa
                            ? 'border-emerald-400 bg-emerald-50 text-emerald-800 dark:border-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-200'
                            : errei
                              ? 'border-red-300 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300'
                              : 'border-slate-200 text-slate-700 dark:border-slate-700 dark:text-slate-300',
                        )}
                      >
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-500 dark:bg-slate-800">
                          {certa ? (
                            <Check className="h-3.5 w-3.5" />
                          ) : errei ? (
                            <X className="h-3.5 w-3.5" />
                          ) : (
                            String.fromCharCode(65 + i)
                          )}
                        </span>
                        {opcao}
                      </button>
                    );
                  })}
                </div>

                {revelado && (
                  <div className="mt-4 space-y-3">
                    <div
                      className={cn(
                        'flex items-center justify-between gap-2 rounded-xl px-4 py-3 text-sm font-semibold',
                        revelado.correct
                          ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200'
                          : 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300',
                      )}
                    >
                      <span>
                        {revelado.correct
                          ? '🎉 Acertou!'
                          : revelado.timedOut
                            ? 'Tempo esgotado!'
                            : 'Não foi dessa vez...'}
                      </span>
                      <span className="flex items-center gap-1 text-xs opacity-80">
                        <BookOpen className="h-3.5 w-3.5" />
                        {revelado.ref}
                      </span>
                    </div>
                    <button
                      onClick={proxima}
                      className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-rose-600 py-3 text-sm font-semibold text-white"
                    >
                      Continuar
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      <Link
        href={`${base}/arena`}
        className="block text-center text-sm text-slate-500 dark:text-slate-400"
      >
        Voltar para a Arena
      </Link>
    </div>
  );
}
