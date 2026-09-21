'use client';

// Desafio surpresa. Quem chegou até aqui já passou pela porta: o servidor
// conferiu a janela de entrada. Daqui em diante é só jogar, sem pressa de
// prazo — só o cronômetro de cada pergunta.

import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Zap, Timer, Loader2, Check, X, ChevronRight, BookOpen } from 'lucide-react';
import { memberApi } from '@/lib/member-api';
import { cn } from '@/lib/utils';

interface Estado {
  id: string;
  total: number;
  bonus: number;
  seconds: number;
  answered: number;
  hits: number;
  score: number;
  done: boolean;
  current: {
    id: string;
    question: string;
    options: string[];
    index: number;
    remaining: number | null;
  } | null;
}

interface Resultado {
  correct: boolean;
  answer: number;
  ref: string;
  state: Estado;
}

export default function SurpresaPage(): React.ReactElement {
  const { slug, id } = useParams<{ slug: string; id: string }>();
  const base = `/portal/${slug}`;

  const [estado, setEstado] = useState<Estado | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [restam, setRestam] = useState<number | null>(null);
  const [abrindo, setAbrindo] = useState(false);
  const [revelado, setRevelado] = useState<Resultado | null>(null);
  const [minhaEscolha, setMinhaEscolha] = useState<number | null>(null);

  const carrega = useCallback(async (): Promise<void> => {
    try {
      const { data } = await memberApi.get<Estado>(`/member-auth/arena/flash/${id}`);
      setEstado(data);
      setRestam(data.current?.remaining ?? null);
    } catch {
      setErro('Este desafio não está mais disponível.');
    }
  }, [id]);

  useEffect(() => {
    void carrega();
  }, [carrega]);

  const responder = useCallback(
    async (escolha: number): Promise<void> => {
      if (!estado?.current || revelado) return;
      setMinhaEscolha(escolha);
      try {
        const { data } = await memberApi.post<Resultado>(
          `/member-auth/arena/flash/${id}/answer`,
          { questionId: estado.current.id, choice: escolha },
        );
        setRevelado(data);
        setRestam(null);
      } catch {
        setMinhaEscolha(null);
      }
    },
    [estado, revelado, id],
  );

  useEffect(() => {
    if (restam === null || revelado || !estado?.current) return;
    if (restam <= 0) {
      void responder(-1);
      return;
    }
    const t = setTimeout(() => setRestam((r) => (r === null ? null : r - 1)), 1000);
    return () => clearTimeout(t);
  }, [restam, revelado, estado, responder]);

  async function comecar(): Promise<void> {
    if (!estado?.current || abrindo) return;
    setAbrindo(true);
    try {
      const { data } = await memberApi.post<{ remaining: number }>(
        `/member-auth/arena/flash/${id}/open`,
        { questionId: estado.current.id },
      );
      setRestam(data.remaining);
    } catch {
      setRestam(null);
    } finally {
      setAbrindo(false);
    }
  }

  function proxima(): void {
    if (!revelado) return;
    setEstado(revelado.state);
    setRestam(null);
    setRevelado(null);
    setMinhaEscolha(null);
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

  if (estado.done) {
    return (
      <div className="space-y-4">
        <div className="rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 p-6 text-center text-white shadow-lg">
          <Zap className="mx-auto h-10 w-10" />
          <p className="mt-2 text-lg font-bold">Desafio surpresa concluído!</p>
          <p className="mt-1 text-sm text-amber-50">
            {estado.hits} de {estado.total} certas ·{' '}
            <span className="font-bold text-white">{estado.score} pontos de bônus</span>
          </p>
        </div>
        <Link
          href={`${base}/arena`}
          className="block rounded-xl bg-indigo-600 py-3 text-center text-sm font-semibold text-white"
        >
          Voltar para a Arena
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-slate-100">
        <Zap className="h-5 w-5 text-amber-500" />
        Desafio surpresa
      </h1>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 dark:border-slate-800">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Pergunta {estado.current?.index ?? estado.answered + 1} de {estado.total}
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
                {estado.seconds} segundos por pergunta, {estado.bonus} pontos por
                acerto. O relógio começa no toque.
              </p>
              <button
                onClick={() => void comecar()}
                disabled={abrindo}
                className="mt-4 w-full rounded-xl bg-amber-500 py-3.5 text-sm font-bold text-white disabled:opacity-60"
              >
                {abrindo ? <Loader2 className="mx-auto h-4 w-4 animate-spin" /> : 'Começar'}
              </button>
            </div>
          ) : (
            <>
              <p className="text-base font-semibold leading-snug text-slate-900 dark:text-slate-100">
                {estado.current?.question}
              </p>
              <div className="mt-4 space-y-2.5">
                {estado.current?.options.map((opcao, i) => {
                  const certa = revelado && i === revelado.answer;
                  const errei =
                    revelado && i === minhaEscolha && minhaEscolha >= 0 && !revelado.correct;
                  return (
                    <button
                      key={i}
                      onClick={() => void responder(i)}
                      disabled={!!revelado}
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
                        ? `🎉 Acertou! +${estado.bonus}`
                        : 'Não foi dessa vez...'}
                    </span>
                    <span className="flex items-center gap-1 text-xs opacity-80">
                      <BookOpen className="h-3.5 w-3.5" />
                      {revelado.ref}
                    </span>
                  </div>
                  <button
                    onClick={proxima}
                    className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-amber-500 py-3 text-sm font-semibold text-white"
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
    </div>
  );
}
