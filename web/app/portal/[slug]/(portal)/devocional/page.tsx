'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  Loader2,
  HandHeart,
  BookOpen,
  Music,
  Share2,
  Check,
  Flame,
  NotebookPen,
} from 'lucide-react';
import { memberApi } from '@/lib/member-api';
import { devotionalOfDay, daySeed } from '@/lib/daily-devotional';
import { generateVerseImage } from '@/lib/verse-image';

interface DevotionalResponse {
  count: number;
  joined: boolean;
  completed: boolean;
  streak: number;
  history: string[];
  note: string | null;
  reactions: Record<string, number>;
  myReaction: string | null;
  churchName: string | null;
}

const REACTIONS: { type: string; emoji: string; label: string }[] = [
  { type: 'amem', emoji: '🙏', label: 'Amém' },
  { type: 'heart', emoji: '❤️', label: 'Amei' },
  { type: 'praise', emoji: '🙌', label: 'Glória' },
  { type: 'fire', emoji: '🔥', label: 'Avivamento' },
];

const WEEKDAY = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

function brTodayStr(): string {
  const br = new Date(Date.now() - 3 * 60 * 60 * 1000);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${br.getUTCFullYear()}-${pad(br.getUTCMonth() + 1)}-${pad(br.getUTCDate())}`;
}

function shiftDay(day: string, delta: number): string {
  const [y, m, d] = day.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + delta));
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${dt.getUTCFullYear()}-${pad(dt.getUTCMonth() + 1)}-${pad(dt.getUTCDate())}`;
}

export default function DevocionalPage(): React.ReactElement {
  const params = useParams();
  const slug = String(params.slug);

  // Conteúdo do dia — pré-definido, automático (biblioteca embutida).
  const daily = devotionalOfDay();
  const today = new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
  }).format(new Date());

  const [count, setCount] = useState(0);
  const [joined, setJoined] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [completed, setCompleted] = useState(false);
  const [streak, setStreak] = useState(0);
  const [history, setHistory] = useState<string[]>([]);
  const [completing, setCompleting] = useState(false);

  const [reactions, setReactions] = useState<Record<string, number>>({});
  const [myReaction, setMyReaction] = useState<string | null>(null);

  const [note, setNote] = useState('');
  const [savedNote, setSavedNote] = useState('');
  const [noteSaving, setNoteSaving] = useState(false);
  const [noteSaved, setNoteSaved] = useState(false);

  const [churchName, setChurchName] = useState('');
  const [genImage, setGenImage] = useState('');
  const genBlobRef = useRef<Blob | null>(null);

  const songUrl = daily.song
    ? `https://www.youtube.com/results?search_query=${encodeURIComponent(daily.song)}`
    : null;

  useEffect(() => {
    let mounted = true;
    memberApi
      .get<DevotionalResponse>('/member-auth/devotional')
      .then(({ data }) => {
        if (!mounted) return;
        setCount(data.count);
        setJoined(data.joined);
        setCompleted(data.completed);
        setStreak(data.streak);
        setHistory(data.history ?? []);
        setReactions(data.reactions ?? {});
        setMyReaction(data.myReaction);
        setNote(data.note ?? '');
        setSavedNote(data.note ?? '');
        setChurchName(data.churchName ?? '');
      })
      .catch(() => undefined)
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  // Gera a imagem do versículo do dia para compartilhar.
  useEffect(() => {
    let mounted = true;
    generateVerseImage({
      verseText: daily.text,
      verseRef: daily.ref,
      title: daily.title,
      footer: churchName || 'Igreja360',
      seed: daySeed(),
    })
      .then(({ dataUrl, blob }) => {
        if (!mounted) return;
        setGenImage(dataUrl);
        genBlobRef.current = blob;
      })
      .catch(() => undefined);
    return () => {
      mounted = false;
    };
  }, [daily.text, daily.ref, daily.title, churchName]);

  async function togglePray(): Promise<void> {
    setSaving(true);
    try {
      const { data } = await memberApi.post<{ count: number; joined: boolean }>(
        '/member-auth/devotional/pray',
      );
      setCount(data.count);
      setJoined(data.joined);
    } catch {
      /* ignora */
    } finally {
      setSaving(false);
    }
  }

  async function complete(): Promise<void> {
    if (completed) return;
    setCompleting(true);
    try {
      const { data } = await memberApi.post<{
        completed: boolean;
        streak: number;
        history: string[];
      }>('/member-auth/devotional/complete');
      setCompleted(data.completed);
      setStreak(data.streak);
      setHistory(data.history ?? []);
    } catch {
      /* ignora */
    } finally {
      setCompleting(false);
    }
  }

  async function react(type: string): Promise<void> {
    try {
      const { data } = await memberApi.post<{
        reactions: Record<string, number>;
        myReaction: string | null;
      }>('/member-auth/devotional/react', { type });
      setReactions(data.reactions ?? {});
      setMyReaction(data.myReaction);
    } catch {
      /* ignora */
    }
  }

  async function saveNote(): Promise<void> {
    setNoteSaving(true);
    setNoteSaved(false);
    try {
      const { data } = await memberApi.post<{ note: string | null }>(
        '/member-auth/devotional/note',
        { text: note },
      );
      setSavedNote(data.note ?? '');
      setNoteSaved(true);
      setTimeout(() => setNoteSaved(false), 2500);
    } catch {
      /* ignora */
    } finally {
      setNoteSaving(false);
    }
  }

  const share = useCallback(async (): Promise<void> => {
    const text = [
      daily.title,
      '',
      `“${daily.text}” — ${daily.ref}`,
      '',
      daily.reflection,
    ].join('\n');

    const data: ShareData = { title: 'Devocional', text };
    try {
      if (genBlobRef.current) {
        const file = new File([genBlobRef.current], 'devocional.jpg', {
          type: 'image/jpeg',
        });
        if (navigator.canShare?.({ files: [file] })) {
          (data as ShareData & { files: File[] }).files = [file];
        }
      }
    } catch {
      /* segue sem imagem */
    }

    if (navigator.share) {
      try {
        await navigator.share(data);
      } catch {
        /* usuário cancelou */
      }
    } else {
      try {
        await navigator.clipboard.writeText(text);
        alert('Texto do devocional copiado!');
      } catch {
        /* ignora */
      }
    }
  }, [daily]);

  const historySet = new Set(history);
  const todayStr = brTodayStr();
  const last7 = Array.from({ length: 7 }, (_, i) => shiftDay(todayStr, i - 6));

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-16 text-sm text-slate-500">
        <Loader2 className="h-4 w-4 animate-spin" />
        Carregando...
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-slate-900">{daily.title}</h1>
        <p className="text-sm capitalize text-slate-500">{today}</p>
      </div>

      {/* Sequência + histórico da semana */}
      <div className="rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 p-5 text-white shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flame className="h-8 w-8 text-amber-100" />
            <div>
              <p className="text-3xl font-bold leading-none">{streak}</p>
              <p className="text-xs text-amber-100">
                {streak === 1 ? 'dia seguido' : 'dias seguidos'}
              </p>
            </div>
          </div>
          <button
            onClick={complete}
            disabled={completed || completing}
            className={`flex items-center gap-1.5 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors ${
              completed
                ? 'bg-white/20 text-white'
                : 'bg-white text-orange-600 hover:bg-amber-50'
            }`}
          >
            {completing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : completed ? (
              <Check className="h-4 w-4" />
            ) : null}
            {completed ? 'Concluído hoje' : 'Marcar como concluído'}
          </button>
        </div>
        <div className="mt-4 flex justify-between">
          {last7.map((day) => {
            const done = historySet.has(day);
            const isToday = day === todayStr;
            const weekday = WEEKDAY[new Date(`${day}T12:00:00Z`).getUTCDay()];
            return (
              <div key={day} className="flex flex-col items-center gap-1.5">
                <span className="text-[10px] text-amber-100">{weekday}</span>
                <span
                  className={`flex h-7 w-7 items-center justify-center rounded-full text-xs ${
                    done
                      ? 'bg-white text-orange-600'
                      : isToday
                        ? 'border-2 border-white/70 text-white'
                        : 'bg-white/15 text-white/60'
                  }`}
                >
                  {done ? '✓' : ''}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Imagem para compartilhar + botão logo abaixo */}
      {genImage && (
        <div className="space-y-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={genImage}
            alt="Devocional"
            className="w-full rounded-2xl object-cover shadow"
          />
          <button
            onClick={share}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-white py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <Share2 className="h-4 w-4" />
            Compartilhar nas redes
          </button>
        </div>
      )}

      {/* Versículo */}
      <div className="rounded-2xl bg-gradient-to-br from-indigo-600 to-indigo-800 p-6 text-white shadow-lg">
        <BookOpen className="h-6 w-6 text-indigo-200" />
        <p className="mt-3 text-lg font-medium leading-relaxed">
          “{daily.text}”
        </p>
        <p className="mt-2 text-sm text-indigo-200">{daily.ref}</p>
        <Link
          href={`/portal/${slug}/biblia?ref=${encodeURIComponent(daily.ref)}`}
          className="mt-3 inline-flex items-center gap-1 rounded-full bg-white/15 px-3 py-1.5 text-xs font-medium text-white hover:bg-white/25"
        >
          <BookOpen className="h-3.5 w-3.5" />
          Ler na Bíblia
        </Link>
      </div>

      {/* Reflexão */}
      <div className="rounded-xl border border-border bg-white p-5">
        <p className="whitespace-pre-line leading-relaxed text-slate-700">
          {daily.reflection}
        </p>
      </div>

      {/* Reações */}
      <div className="flex flex-wrap gap-2">
        {REACTIONS.map((r) => {
          const active = myReaction === r.type;
          const n = reactions[r.type] ?? 0;
          return (
            <button
              key={r.type}
              onClick={() => react(r.type)}
              className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors ${
                active
                  ? 'border-indigo-400 bg-indigo-50 text-indigo-700'
                  : 'border-border bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span className="text-base leading-none">{r.emoji}</span>
              <span className="font-medium">{r.label}</span>
              {n > 0 && (
                <span
                  className={`text-xs ${active ? 'text-indigo-500' : 'text-slate-400'}`}
                >
                  {n}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Música do dia */}
      {songUrl && (
        <a
          href={songUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 rounded-xl border border-border bg-white p-4 hover:bg-slate-50"
        >
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-pink-500 text-white">
            <Music className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-wide text-slate-400">
              Música do dia
            </p>
            <p className="truncate font-medium text-slate-900">{daily.song}</p>
          </div>
        </a>
      )}

      {/* Diário / anotações */}
      <div className="rounded-xl border border-border bg-white p-5">
        <div className="mb-2 flex items-center gap-2">
          <NotebookPen className="h-4 w-4 text-indigo-600" />
          <p className="text-sm font-semibold text-slate-800">
            Meu diário de hoje
          </p>
        </div>
        <p className="mb-3 text-xs text-slate-400">
          O que Deus falou com você? (só você vê)
        </p>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Escreva sua reflexão pessoal..."
          maxLength={2000}
          className="min-h-[110px] w-full resize-y rounded-lg border border-border bg-slate-50 p-3 text-sm text-slate-700 outline-none focus:border-indigo-400 focus:bg-white"
        />
        <div className="mt-2 flex items-center justify-end gap-3">
          {noteSaved && (
            <span className="flex items-center gap-1 text-xs text-emerald-600">
              <Check className="h-3.5 w-3.5" />
              Salvo
            </span>
          )}
          <button
            onClick={saveNote}
            disabled={noteSaving || note === savedNote}
            className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-40"
          >
            {noteSaving && <Loader2 className="h-4 w-4 animate-spin" />}
            Salvar
          </button>
        </div>
      </div>

      {/* Oração coletiva */}
      <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-5 text-center">
        <button
          onClick={togglePray}
          disabled={saving}
          className={`flex w-full items-center justify-center gap-2 rounded-lg py-3 text-sm font-semibold transition-colors ${
            joined
              ? 'bg-indigo-600 text-white hover:bg-indigo-700'
              : 'border border-indigo-300 bg-white text-indigo-700 hover:bg-indigo-50'
          }`}
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <HandHeart className="h-4 w-4" />
          )}
          {joined ? 'Estou orando 🙏' : 'Estou orando'}
        </button>
        <p className="mt-3 text-sm text-slate-500">
          {count > 0 ? (
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
