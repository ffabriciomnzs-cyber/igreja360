'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  Loader2,
  ChevronLeft,
  ChevronDown,
  Check,
  BookOpen,
} from 'lucide-react';
import { memberApi } from '@/lib/member-api';

interface PlanDay {
  dayNumber: number;
  title: string | null;
  verseRef: string | null;
  verseText: string | null;
  reflection: string;
}

interface PlanDetail {
  id: string;
  title: string;
  description: string | null;
  cover: string | null;
  days: PlanDay[];
  completed: number[];
}

export default function PlanReaderPage(): React.ReactElement {
  const params = useParams();
  const slug = String(params.slug);
  const planId = String(params.planId);

  const [plan, setPlan] = useState<PlanDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState<number | null>(null);
  const [busy, setBusy] = useState<number | null>(null);

  useEffect(() => {
    let mounted = true;
    memberApi
      .get<PlanDetail>(`/member-auth/plans/${planId}`)
      .then(({ data }) => {
        if (!mounted) return;
        setPlan(data);
        // Abre o primeiro dia ainda não concluído.
        const done = new Set(data.completed);
        const next = data.days.find((d) => !done.has(d.dayNumber));
        setOpen(next?.dayNumber ?? data.days[0]?.dayNumber ?? null);
      })
      .catch(() => undefined)
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [planId]);

  async function toggle(dayNumber: number): Promise<void> {
    setBusy(dayNumber);
    try {
      const { data } = await memberApi.post<{ completed: number[] }>(
        `/member-auth/plans/${planId}/day/${dayNumber}`,
      );
      setPlan((p) => (p ? { ...p, completed: data.completed } : p));
    } catch {
      /* ignora */
    } finally {
      setBusy(null);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-16 text-sm text-slate-500">
        <Loader2 className="h-4 w-4 animate-spin" />
        Carregando...
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="py-16 text-center text-sm text-slate-500">
        Plano não encontrado.
        <div className="mt-4">
          <Link
            href={`/portal/${slug}/devocional`}
            className="text-indigo-600 hover:underline"
          >
            Voltar ao devocional
          </Link>
        </div>
      </div>
    );
  }

  const doneSet = new Set(plan.completed);
  const pct =
    plan.days.length > 0
      ? Math.round((plan.completed.length / plan.days.length) * 100)
      : 0;

  return (
    <div className="space-y-5">
      <Link
        href={`/portal/${slug}/devocional`}
        className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800"
      >
        <ChevronLeft className="h-4 w-4" />
        Devocional
      </Link>

      {plan.cover && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={plan.cover}
          alt={plan.title}
          className="h-40 w-full rounded-2xl object-cover shadow"
        />
      )}

      <div>
        <h1 className="text-xl font-bold text-slate-900">{plan.title}</h1>
        {plan.description && (
          <p className="mt-1 text-sm text-slate-500">{plan.description}</p>
        )}
        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-indigo-500 transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="mt-1.5 text-xs text-slate-400">
          {plan.completed.length} de {plan.days.length} dias concluídos
          {pct === 100 && ' — parabéns! 🎉'}
        </p>
      </div>

      <div className="space-y-2">
        {plan.days.map((day) => {
          const done = doneSet.has(day.dayNumber);
          const isOpen = open === day.dayNumber;
          return (
            <div
              key={day.dayNumber}
              className="overflow-hidden rounded-xl border border-border bg-white"
            >
              <button
                onClick={() => setOpen(isOpen ? null : day.dayNumber)}
                className="flex w-full items-center gap-3 p-4 text-left"
              >
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
                    done
                      ? 'bg-emerald-500 text-white'
                      : 'bg-indigo-100 text-indigo-700'
                  }`}
                >
                  {done ? <Check className="h-4 w-4" /> : day.dayNumber}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-xs uppercase tracking-wide text-slate-400">
                    Dia {day.dayNumber}
                  </span>
                  <span className="block truncate font-medium text-slate-900">
                    {day.title || day.verseRef || 'Reflexão'}
                  </span>
                </span>
                <ChevronDown
                  className={`h-5 w-5 shrink-0 text-slate-300 transition-transform ${
                    isOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {isOpen && (
                <div className="space-y-4 border-t border-border p-4">
                  {day.verseText && (
                    <div className="rounded-xl bg-gradient-to-br from-indigo-600 to-indigo-800 p-4 text-white">
                      <p className="text-sm font-medium leading-relaxed">
                        “{day.verseText}”
                      </p>
                      {day.verseRef && (
                        <div className="mt-2 flex items-center justify-between">
                          <p className="text-xs text-indigo-200">
                            {day.verseRef}
                          </p>
                          <Link
                            href={`/portal/${slug}/biblia?ref=${encodeURIComponent(day.verseRef)}`}
                            className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-1 text-xs text-white hover:bg-white/25"
                          >
                            <BookOpen className="h-3 w-3" />
                            Ler
                          </Link>
                        </div>
                      )}
                    </div>
                  )}
                  <p className="whitespace-pre-line leading-relaxed text-slate-700">
                    {day.reflection}
                  </p>
                  <button
                    onClick={() => toggle(day.dayNumber)}
                    disabled={busy === day.dayNumber}
                    className={`flex w-full items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold transition-colors ${
                      done
                        ? 'border border-emerald-300 bg-emerald-50 text-emerald-700'
                        : 'bg-indigo-600 text-white hover:bg-indigo-700'
                    }`}
                  >
                    {busy === day.dayNumber ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Check className="h-4 w-4" />
                    )}
                    {done ? 'Concluído' : 'Marcar como concluído'}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
