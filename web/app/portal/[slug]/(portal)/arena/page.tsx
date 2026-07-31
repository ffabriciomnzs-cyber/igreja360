'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Swords,
  Trophy,
  Check,
  X,
  ChevronRight,
  BookOpen,
  Loader2,
  Medal,
} from 'lucide-react';
import { memberApi } from '@/lib/member-api';
import { cn } from '@/lib/utils';

interface Answered {
  choice: number;
  correct: boolean;
  points: number;
  answer: number;
  ref: string;
}

interface TodayQuestion {
  id: string;
  question: string;
  options: string[];
  answered: Answered | null;
}

interface Today {
  day: string;
  pointsPerHit: number;
  questions: TodayQuestion[];
}

interface RankRow {
  position: number;
  name: string;
  photo: string | null;
  points: number;
  me: boolean;
}

/** Iniciais para o avatar de quem não tem foto. */
function iniciais(nome: string): string {
  const partes = nome.trim().split(/\s+/);
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
  return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
}

interface Ranking {
  period: string;
  top: RankRow[];
  me: { position: number | null; points: number };
}

const MEDALHAS = ['🥇', '🥈', '🥉'];

export default function ArenaPage(): React.ReactElement {
  const [today, setToday] = useState<Today | null>(null);
  const [ranking, setRanking] = useState<Ranking | null>(null);
  const [period, setPeriod] = useState<'month' | 'all'>('month');
  const [sending, setSending] = useState(false);
  // Resultado da pergunta recém-respondida (mostra feedback antes de avançar).
  const [reveal, setReveal] = useState<Answered | null>(null);
  const [myChoice, setMyChoice] = useState<number | null>(null);

  useEffect(() => {
    memberApi
      .get<Today>('/member-auth/arena/today')
      .then((r) => setToday(r.data))
      .catch(() => setToday(null));
  }, []);

  useEffect(() => {
    memberApi
      .get<Ranking>('/member-auth/arena/ranking', { params: { period } })
      .then((r) => setRanking(r.data))
      .catch(() => undefined);
  }, [period]);

  // Próxima pergunta ainda não respondida (o desafio "resume" de onde parou).
  const atual = useMemo(
    () => today?.questions.find((q) => !q.answered) ?? null,
    [today],
  );
  const respondidas = today?.questions.filter((q) => q.answered) ?? [];
  const acertosHoje = respondidas.filter((q) => q.answered?.correct).length;
  const pontosHoje = respondidas.reduce(
    (s, q) => s + (q.answered?.points ?? 0),
    0,
  );
  const terminou = !!today && !atual;

  async function responder(choice: number): Promise<void> {
    if (!atual || sending || reveal) return;
    setSending(true);
    setMyChoice(choice);
    try {
      const { data } = await memberApi.post<Answered>(
        '/member-auth/arena/answer',
        { questionId: atual.id, choice },
      );
      setReveal({ ...data, choice });
    } catch {
      setMyChoice(null);
    } finally {
      setSending(false);
    }
  }

  function proxima(): void {
    if (!today || !atual || !reveal) return;
    // Marca a atual como respondida localmente e limpa o feedback.
    setToday({
      ...today,
      questions: today.questions.map((q) =>
        q.id === atual.id ? { ...q, answered: reveal } : q,
      ),
    });
    setReveal(null);
    setMyChoice(null);
    // Ranking muda quando pontua.
    memberApi
      .get<Ranking>('/member-auth/arena/ranking', { params: { period } })
      .then((r) => setRanking(r.data))
      .catch(() => undefined);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-slate-100">
          <Swords className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
          Arena Bíblica
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          12 perguntas por dia · 10 pontos por acerto · valendo o topo do
          ranking!
        </p>
      </div>

      {/* Desafio do dia */}
      {!today ? (
        <div className="h-64 animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-800" />
      ) : terminou ? (
        <div className="rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-700 p-6 text-center text-white shadow-lg">
          <Trophy className="mx-auto h-10 w-10 text-amber-300" />
          <p className="mt-2 text-lg font-bold">Desafio de hoje concluído!</p>
          <p className="mt-1 text-sm text-indigo-100">
            Você acertou {acertosHoje} de {today.questions.length} e marcou{' '}
            <span className="font-bold text-white">{pontosHoje} pontos</span>.
          </p>
          <p className="mt-3 text-xs text-indigo-200">
            Volte amanhã — tem desafio novo todo dia. 🔥
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          {/* progresso */}
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 dark:border-slate-800">
            <div className="flex gap-1.5">
              {today.questions.map((q) => (
                <span
                  key={q.id}
                  className={cn(
                    'h-1.5 w-6 rounded-full',
                    q.answered
                      ? q.answered.correct
                        ? 'bg-emerald-500'
                        : 'bg-red-400'
                      : q.id === atual?.id
                        ? 'bg-indigo-500'
                        : 'bg-slate-200 dark:bg-slate-700',
                  )}
                />
              ))}
            </div>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              {respondidas.length + 1}/{today.questions.length}
            </span>
          </div>

          <div className="p-5">
            <p className="text-base font-semibold leading-snug text-slate-900 dark:text-slate-100">
              {atual?.question}
            </p>

            <div className="mt-4 space-y-2.5">
              {atual?.options.map((opcao, i) => {
                const acertou = reveal && i === reveal.answer;
                const errei = reveal && i === myChoice && !reveal.correct;
                return (
                  <button
                    key={i}
                    onClick={() => void responder(i)}
                    disabled={sending || !!reveal}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm font-medium transition-colors duration-150',
                      acertou
                        ? 'border-emerald-400 bg-emerald-50 text-emerald-800 dark:border-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-200'
                        : errei
                          ? 'border-red-300 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300'
                          : reveal
                            ? 'border-slate-200 text-slate-400 dark:border-slate-800 dark:text-slate-500'
                            : 'border-slate-200 text-slate-700 hover:border-indigo-300 hover:bg-indigo-50 dark:border-slate-700 dark:text-slate-300 dark:hover:border-indigo-700 dark:hover:bg-indigo-950/40',
                    )}
                  >
                    <span
                      className={cn(
                        'flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold',
                        acertou
                          ? 'bg-emerald-500 text-white'
                          : errei
                            ? 'bg-red-400 text-white'
                            : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400',
                      )}
                    >
                      {acertou ? (
                        <Check className="h-3.5 w-3.5" />
                      ) : errei ? (
                        <X className="h-3.5 w-3.5" />
                      ) : (
                        String.fromCharCode(65 + i)
                      )}
                    </span>
                    {opcao}
                    {sending && myChoice === i && (
                      <Loader2 className="ml-auto h-4 w-4 animate-spin text-slate-400" />
                    )}
                  </button>
                );
              })}
            </div>

            {reveal && (
              <div className="mt-4 space-y-3">
                <div
                  className={cn(
                    'flex items-center justify-between rounded-xl px-4 py-3 text-sm font-semibold',
                    reveal.correct
                      ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200'
                      : 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300',
                  )}
                >
                  <span>
                    {reveal.correct ? '🎉 Acertou! +10 pontos' : 'Não foi dessa vez...'}
                  </span>
                  <span className="flex items-center gap-1 text-xs font-medium opacity-80">
                    <BookOpen className="h-3.5 w-3.5" />
                    {reveal.ref}
                  </span>
                </div>
                <button
                  onClick={proxima}
                  className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white transition-colors hover:bg-indigo-700"
                >
                  {respondidas.length + 1 === today.questions.length
                    ? 'Ver resultado'
                    : 'Próxima pergunta'}
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Ranking */}
      <section>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-sm font-bold text-slate-800 dark:text-slate-200">
            <Medal className="h-4 w-4 text-amber-500" />
            Ranking da igreja
          </h2>
          <div className="flex rounded-lg border border-slate-200 p-0.5 text-xs dark:border-slate-700">
            {(['month', 'all'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={cn(
                  'rounded-md px-3 py-1 font-medium transition-colors',
                  period === p
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-500 dark:text-slate-400',
                )}
              >
                {p === 'month' ? 'Este mês' : 'Geral'}
              </button>
            ))}
          </div>
        </div>

        <div className="divide-y divide-slate-100 rounded-2xl border border-slate-200 bg-white dark:divide-slate-800 dark:border-slate-800 dark:bg-slate-900">
          {!ranking ? (
            <div className="h-40 animate-pulse rounded-2xl bg-slate-50 dark:bg-slate-950" />
          ) : ranking.top.length === 0 ? (
            <p className="px-4 py-10 text-center text-sm text-slate-400 dark:text-slate-500">
              Ninguém pontuou ainda. Seja a primeira pessoa do ranking! 🏆
            </p>
          ) : (
            ranking.top.map((linha) => (
              <div
                key={linha.position}
                className={cn(
                  'flex items-center gap-3 px-4 py-3',
                  linha.me && 'bg-indigo-50/60 dark:bg-indigo-950/30',
                )}
              >
                <span className="w-7 text-center text-sm font-bold text-slate-500 dark:text-slate-400">
                  {MEDALHAS[linha.position - 1] ?? `${linha.position}º`}
                </span>
                <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-indigo-100 text-xs font-bold text-indigo-600 dark:bg-indigo-900/60 dark:text-indigo-300">
                  {linha.photo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={linha.photo}
                      alt={linha.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    iniciais(linha.name)
                  )}
                </span>
                <span
                  className={cn(
                    'min-w-0 flex-1 truncate text-sm',
                    linha.me
                      ? 'font-bold text-indigo-700 dark:text-indigo-300'
                      : 'font-medium text-slate-700 dark:text-slate-300',
                  )}
                >
                  {linha.name}
                  {linha.me && ' (você)'}
                </span>
                <span className="text-sm font-bold tabular-nums text-slate-900 dark:text-slate-100">
                  {linha.points}
                  <span className="ml-1 text-xs font-normal text-slate-400">
                    pts
                  </span>
                </span>
              </div>
            ))
          )}
        </div>

        {ranking && ranking.me.position && ranking.me.position > 10 && (
          <p className="mt-2 text-center text-xs text-slate-500 dark:text-slate-400">
            Sua posição: {ranking.me.position}º com {ranking.me.points} pontos
            — continua que o pódio vem! 💪
          </p>
        )}
      </section>
    </div>
  );
}
