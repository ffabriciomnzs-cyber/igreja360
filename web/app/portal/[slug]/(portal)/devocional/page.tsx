'use client';

import { useEffect, useState } from 'react';
import { Loader2, HandHeart, BookOpen } from 'lucide-react';
import { memberApi } from '@/lib/member-api';
import { verseOfDay } from '@/lib/verse-of-day';

export default function DevocionalPage(): React.ReactElement {
  const verse = verseOfDay();
  const today = new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
  }).format(new Date());

  const [count, setCount] = useState(0);
  const [joined, setJoined] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let mounted = true;
    memberApi
      .get<{ count: number; joined: boolean }>('/member-auth/devotional')
      .then(({ data }) => {
        if (!mounted) return;
        setCount(data.count);
        setJoined(data.joined);
      })
      .catch(() => undefined)
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  async function togglePray(): Promise<void> {
    setSaving(true);
    try {
      const { data } = await memberApi.post<{
        count: number;
        joined: boolean;
      }>('/member-auth/devotional/pray');
      setCount(data.count);
      setJoined(data.joined);
    } catch {
      /* ignora */
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Devocional do dia</h1>
        <p className="text-sm capitalize text-slate-500">{today}</p>
      </div>

      {/* Versículo */}
      <div className="rounded-2xl bg-gradient-to-br from-indigo-600 to-indigo-800 p-6 text-white shadow-lg">
        <BookOpen className="h-6 w-6 text-indigo-200" />
        <p className="mt-3 text-lg font-medium leading-relaxed">
          “{verse.text}”
        </p>
        <p className="mt-2 text-sm text-indigo-200">{verse.ref}</p>
      </div>

      <div className="rounded-xl border border-border bg-white p-5">
        <p className="text-sm leading-relaxed text-slate-600">
          Reserve um momento para meditar nesta palavra e orar. Toque no botão
          abaixo para se unir à igreja em oração hoje. 🙏
        </p>

        <button
          onClick={togglePray}
          disabled={saving || loading}
          className={`mt-4 flex w-full items-center justify-center gap-2 rounded-lg py-3 text-sm font-semibold transition-colors ${
            joined
              ? 'bg-indigo-600 text-white hover:bg-indigo-700'
              : 'border border-indigo-300 text-indigo-700 hover:bg-indigo-50'
          }`}
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <HandHeart className="h-4 w-4" />
          )}
          {joined ? 'Estou orando 🙏' : 'Estou orando'}
        </button>

        <p className="mt-3 text-center text-sm text-slate-500">
          {loading ? (
            <span className="inline-flex items-center gap-1">
              <Loader2 className="h-3 w-3 animate-spin" />
              carregando...
            </span>
          ) : count > 0 ? (
            <>
              <strong className="text-indigo-600">{count}</strong>{' '}
              {count === 1 ? 'irmão está orando' : 'irmãos estão orando'} hoje
            </>
          ) : (
            'Seja o primeiro a orar hoje.'
          )}
        </p>
      </div>
    </div>
  );
}
