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
  Route,
  X,
  Sparkles,
} from 'lucide-react';
import { memberApi } from '@/lib/member-api';
import { useCached, setCached } from '@/lib/use-cached';
import {
  devotionalOfDay,
  daySeed,
  DAILY_DEVOTIONALS,
  type DailyDevotional,
} from '@/lib/daily-devotional';
import {
  DEVOTIONAL_TRAILS,
  trailById,
  trailDevotional,
  TRAIL_LENGTH,
} from '@/lib/devotional-trails';
import { questionFor } from '@/lib/devotional-questions';
import {
  DevocionalIntro,
  ABRIR_INTRO_DEVOCIONAL,
} from '@/components/portal/DevocionalIntro';
import { generateVerseImage } from '@/lib/verse-image';

interface TrailState {
  id: string;
  position: number;
  todayIndex: number;
  length: number;
  finished: boolean;
}

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
  trail: TrailState | null;
}

const REACTIONS: { type: string; emoji: string; label: string }[] = [
  { type: 'amem', emoji: '🙏', label: 'Amém' },
  { type: 'heart', emoji: '❤️', label: 'Amei' },
  { type: 'praise', emoji: '🙌', label: 'Glória' },
  { type: 'fire', emoji: '🔥', label: 'Avivamento' },
];

const WEEKDAY = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

const DEVOTIONAL_CACHE_KEY = 'portal-devotional';

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

/** Minutos de leitura, arredondado para cima (mínimo 1). */
function readingMinutes(d: DailyDevotional): number {
  const palavras = `${d.text} ${d.thought} ${d.reflection}`.split(/\s+/).length;
  return Math.max(1, Math.round(palavras / 130));
}

export default function DevocionalPage(): React.ReactElement {
  const params = useParams();
  const slug = String(params.slug);

  const today = new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
  }).format(new Date());

  const [count, setCount] = useState(0);
  const [joined, setJoined] = useState(false);
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

  const [trail, setTrail] = useState<TrailState | null>(null);
  const [trailPicker, setTrailPicker] = useState(false);
  const [trailBusy, setTrailBusy] = useState(false);

  // Cache + revalidação: ao voltar para o Devocional a tela abre na hora.
  const { data: initial, loading } = useCached<DevotionalResponse>(
    DEVOTIONAL_CACHE_KEY,
    () =>
      memberApi
        .get<DevotionalResponse>('/member-auth/devotional')
        .then((r) => r.data),
  );

  // Após uma ação, atualiza o cache para não voltar dado velho ao renavegar.
  const syncCache = (patch: Partial<DevotionalResponse>): void => {
    setCached<DevotionalResponse>(DEVOTIONAL_CACHE_KEY, (prev) =>
      prev ? { ...prev, ...patch } : ({ ...patch } as DevotionalResponse),
    );
  };

  useEffect(() => {
    if (!initial) return;
    setCount(initial.count);
    setJoined(initial.joined);
    setCompleted(initial.completed);
    setStreak(initial.streak);
    setHistory(initial.history ?? []);
    setReactions(initial.reactions ?? {});
    setMyReaction(initial.myReaction);
    setNote(initial.note ?? '');
    setSavedNote(initial.note ?? '');
    setChurchName(initial.churchName ?? '');
    setTrail(initial.trail ?? null);
  }, [initial]);

  // Leitura de hoje: da trilha, se houver uma em andamento; senão a do dia.
  const trilhaAtiva = trail && !trail.finished ? trailById(trail.id) : null;
  const daily =
    (trail && !trail.finished
      ? trailDevotional(trail.id, trail.todayIndex)
      : null) ?? devotionalOfDay();

  const indiceConteudo = DAILY_DEVOTIONALS.findIndex(
    (d) => d.ref === daily.ref,
  );
  const pergunta = questionFor(indiceConteudo < 0 ? daySeed() : indiceConteudo);
  const minutos = readingMinutes(daily);

  const songUrl = daily.song
    ? `https://www.youtube.com/results?search_query=${encodeURIComponent(daily.song)}`
    : null;

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
      syncCache({ count: data.count, joined: data.joined });
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
        trail: TrailState | null;
      }>('/member-auth/devotional/complete');
      setCompleted(data.completed);
      setStreak(data.streak);
      setHistory(data.history ?? []);
      setTrail(data.trail ?? null);
      syncCache({
        completed: data.completed,
        streak: data.streak,
        history: data.history ?? [],
        trail: data.trail ?? null,
      });
    } catch {
      /* ignora */
    } finally {
      setCompleting(false);
    }
  }

  async function escolherTrilha(trailId: string): Promise<void> {
    setTrailBusy(true);
    try {
      const { data } = await memberApi.post<TrailState>(
        '/member-auth/devotional/trail',
        { trailId },
      );
      setTrail(data);
      syncCache({ trail: data });
      setTrailPicker(false);
    } catch {
      /* ignora */
    } finally {
      setTrailBusy(false);
    }
  }

  async function sairDaTrilha(): Promise<void> {
    setTrailBusy(true);
    try {
      await memberApi.delete('/member-auth/devotional/trail');
      setTrail(null);
      syncCache({ trail: null });
    } catch {
      /* ignora */
    } finally {
      setTrailBusy(false);
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
      syncCache({
        reactions: data.reactions ?? {},
        myReaction: data.myReaction,
      });
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
      syncCache({ note: data.note });
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
      daily.thought,
      '',
      `“${daily.text}” — ${daily.ref}`,
      '',
      churchName || 'Igreja360',
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
        alert('Pensamento copiado!');
      } catch {
        /* ignora */
      }
    }
  }, [daily, churchName]);

  const historySet = new Set(history);
  const todayStr = brTodayStr();
  const last7 = Array.from({ length: 7 }, (_, i) => shiftDay(todayStr, i - 6));

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-16 text-sm text-slate-500 dark:text-slate-400">
        <Loader2 className="h-4 w-4 animate-spin" />
        Carregando...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <DevocionalIntro />

      {/* Capa: a Palavra é a primeira coisa que se vê */}
      <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-800 shadow-lg">
        <div className="p-6">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs capitalize text-indigo-200">{today}</p>
            <span className="rounded-full bg-white/15 px-2.5 py-1 text-[11px] text-indigo-100">
              {minutos} min
            </span>
          </div>

          {trilhaAtiva && (
            <div className="mt-4">
              <div className="flex items-center justify-between gap-2">
                <p className="truncate text-xs font-medium text-indigo-100">
                  {trilhaAtiva.title}
                </p>
                <p className="shrink-0 text-[11px] text-indigo-200">
                  Dia {Math.min(trail!.todayIndex + 1, TRAIL_LENGTH)} de{' '}
                  {TRAIL_LENGTH}
                </p>
              </div>
              <div className="mt-2 flex gap-1">
                {Array.from({ length: TRAIL_LENGTH }, (_, i) => (
                  <span
                    key={i}
                    className={`h-1 flex-1 rounded-full ${
                      i < trail!.position ? 'bg-white' : 'bg-white/25'
                    }`}
                  />
                ))}
              </div>
            </div>
          )}

          <p className="mt-5 font-serif text-[22px] leading-relaxed text-white">
            “{daily.text}”
          </p>
          <p className="mt-3 text-sm text-indigo-200">{daily.ref}</p>
        </div>

        {/* Ler o capítulo na Bíblia */}
        <Link
          href={`/portal/${slug}/biblia?ref=${encodeURIComponent(daily.ref)}`}
          className="flex items-center justify-center gap-2 border-t border-white/15 px-4 py-3.5 text-sm font-medium text-white hover:bg-white/10"
        >
          <BookOpen className="h-4 w-4" />
          Ler na Bíblia
        </Link>
      </div>

      {/* Pensamento de hoje — a frase que vira print */}
      <div className="rounded-2xl border border-border bg-white p-5 dark:bg-slate-900">
        <div className="mb-2 flex items-center justify-between gap-3">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">
            Pensamento de hoje
          </p>
          <button
            onClick={share}
            aria-label="Compartilhar"
            className="text-slate-400 hover:text-indigo-600 dark:text-slate-500 dark:hover:text-indigo-400"
          >
            <Share2 className="h-4 w-4" />
          </button>
        </div>
        <p className="font-serif text-lg leading-relaxed text-slate-900 dark:text-slate-100">
          {daily.thought}
        </p>
      </div>

      {/* Reflexão */}
      <div className="px-1">
        <p className="whitespace-pre-line leading-relaxed text-slate-600 dark:text-slate-300">
          {daily.reflection}
        </p>
      </div>

      {/* Pergunta de hoje + diário */}
      <div className="rounded-2xl border border-border bg-white p-5 dark:bg-slate-900">
        <div className="mb-1.5 flex items-center gap-2">
          <NotebookPen className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">
            Pergunta de hoje
          </p>
        </div>
        <p className="mb-3 leading-relaxed text-slate-800 dark:text-slate-200">
          {pergunta}
        </p>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Escrever no meu diário… (só você vê)"
          maxLength={2000}
          className="min-h-[96px] w-full resize-y rounded-xl border border-border bg-slate-50 p-3 text-sm text-slate-700 outline-none focus:border-indigo-400 focus:bg-white dark:bg-slate-950 dark:text-slate-300"
        />
        <div className="mt-2 flex items-center justify-end gap-3">
          {noteSaved && (
            <span className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
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

      {/* Concluir + reações */}
      <div className="space-y-3">
        <button
          onClick={complete}
          disabled={completed || completing}
          className={`flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-semibold transition-colors ${
            completed
              ? 'border border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-400'
              : 'bg-indigo-600 text-white hover:bg-indigo-700'
          }`}
        >
          {completing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Check className="h-4 w-4" />
          )}
          {completed ? 'Leitura de hoje concluída' : 'Marcar como lido'}
        </button>

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
                    ? 'border-indigo-400 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300'
                    : 'border-border bg-white text-slate-600 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800/60'
                }`}
              >
                <span className="text-base leading-none">{r.emoji}</span>
                <span className="font-medium">{r.label}</span>
                {n > 0 && (
                  <span
                    className={`text-xs ${active ? 'text-indigo-500 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500'}`}
                  >
                    {n}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Trilha concluída */}
      {trail?.finished && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-center dark:border-emerald-900 dark:bg-emerald-950/40">
          <Sparkles className="mx-auto h-8 w-8 text-emerald-500" />
          <p className="mt-2 font-semibold text-emerald-800 dark:text-emerald-300">
            Você concluiu a trilha {trailById(trail.id)?.title}!
          </p>
          <p className="mt-1 text-sm text-emerald-700 dark:text-emerald-400">
            Sete dias de caminhada. Escolha a próxima quando quiser.
          </p>
          <button
            onClick={() => setTrailPicker(true)}
            className="mt-3 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
          >
            Escolher outra trilha
          </button>
        </div>
      )}

      {/* Trilha: escolher, trocar ou sair */}
      <div className="rounded-2xl border border-border bg-white p-4 dark:bg-slate-900">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <Route className="h-4 w-4 shrink-0 text-indigo-600 dark:text-indigo-400" />
            <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-200">
              {trilhaAtiva ? trilhaAtiva.title : 'Seguir uma trilha de 7 dias'}
            </p>
          </div>
          <button
            onClick={() => setTrailPicker((v) => !v)}
            className="shrink-0 text-sm font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
          >
            {trailPicker ? 'Fechar' : trilhaAtiva ? 'Trocar' : 'Escolher'}
          </button>
        </div>
        {!trilhaAtiva && !trailPicker && (
          <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
            Um tema por vez — ansiedade, gratidão, perdão — um dia de cada vez.
          </p>
        )}

        {trailPicker && (
          <div className="mt-3 space-y-2">
            {DEVOTIONAL_TRAILS.map((t) => {
              const atual = trilhaAtiva?.id === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => escolherTrilha(t.id)}
                  disabled={trailBusy}
                  className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-colors disabled:opacity-50 ${
                    atual
                      ? 'border-indigo-400 bg-indigo-50 dark:bg-indigo-950/50'
                      : 'border-border hover:bg-slate-50 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-200">
                      {t.title}
                    </p>
                    <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                      {t.subtitle}
                    </p>
                  </div>
                  <span className="shrink-0 text-[11px] text-slate-400 dark:text-slate-500">
                    7 dias
                  </span>
                </button>
              );
            })}
            {trilhaAtiva && (
              <button
                onClick={sairDaTrilha}
                disabled={trailBusy}
                className="flex w-full items-center justify-center gap-1.5 py-2 text-xs font-medium text-slate-500 hover:text-slate-700 disabled:opacity-50 dark:text-slate-400"
              >
                <X className="h-3.5 w-3.5" />
                Sair da trilha e voltar ao devocional do dia
              </button>
            )}
          </div>
        )}
      </div>

      {/* Sugestão de louvor */}
      {songUrl && (
        <a
          href={songUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 rounded-2xl border border-border bg-white p-4 hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800/60"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-pink-500 text-white">
            <Music className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-wide text-slate-400 dark:text-slate-500">
              Sugestão de louvor
            </p>
            <p className="truncate font-medium text-slate-900 dark:text-slate-100">
              {daily.song}
            </p>
          </div>
        </a>
      )}

      {/* Oração coletiva */}
      <div className="rounded-2xl border border-indigo-100 bg-indigo-50/50 p-5 text-center dark:border-indigo-900 dark:bg-indigo-950/40">
        <button
          onClick={togglePray}
          disabled={saving}
          className={`flex w-full items-center justify-center gap-2 rounded-lg py-3 text-sm font-semibold transition-colors ${
            joined
              ? 'bg-indigo-600 text-white hover:bg-indigo-700'
              : 'border border-indigo-300 bg-white text-indigo-700 hover:bg-indigo-50 dark:border-indigo-700 dark:bg-slate-900 dark:text-indigo-300 dark:hover:bg-indigo-950/60'
          }`}
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <HandHeart className="h-4 w-4" />
          )}
          {joined ? 'Estou orando 🙏' : 'Estou orando'}
        </button>
        <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
          {count > 0 ? (
            <>
              <strong className="text-indigo-600 dark:text-indigo-400">
                {count}
              </strong>{' '}
              {count === 1 ? 'irmão está orando' : 'irmãos estão orando'} hoje
            </>
          ) : (
            'Seja o primeiro a orar hoje.'
          )}
        </p>
      </div>

      {/* Recompensa no rodapé: sequência + semana */}
      <div className="rounded-2xl border border-border bg-white p-4 dark:bg-slate-900">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Flame
              className={`h-6 w-6 ${streak > 0 ? 'text-amber-500' : 'text-slate-300 dark:text-slate-600'}`}
            />
            <div>
              <p className="text-xl font-bold leading-none text-slate-900 dark:text-slate-100">
                {streak}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {streak === 1 ? 'dia seguido' : 'dias seguidos'}
              </p>
            </div>
          </div>
          <div className="flex gap-1.5">
            {last7.map((day) => {
              const done = historySet.has(day);
              const isToday = day === todayStr;
              const weekday = WEEKDAY[new Date(`${day}T12:00:00Z`).getUTCDay()];
              return (
                <div key={day} className="flex flex-col items-center gap-1">
                  <span className="text-[10px] text-slate-400 dark:text-slate-500">
                    {weekday}
                  </span>
                  <span
                    className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] ${
                      done
                        ? 'bg-amber-500 text-white'
                        : isToday
                          ? 'border-2 border-amber-400 text-amber-500'
                          : 'bg-slate-100 text-slate-300 dark:bg-slate-800 dark:text-slate-600'
                    }`}
                  >
                    {done ? '✓' : ''}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Rever o explicativo do devocional */}
      <button
        onClick={() =>
          window.dispatchEvent(new Event(ABRIR_INTRO_DEVOCIONAL))
        }
        className="w-full rounded-2xl border border-border bg-white p-3 text-center text-sm font-medium text-indigo-600 hover:bg-slate-50 dark:bg-slate-900 dark:text-indigo-400 dark:hover:bg-slate-800/60"
      >
        Como funciona o devocional
      </button>

      {/* Imagem para compartilhar */}
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
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-white py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800/60"
          >
            <Share2 className="h-4 w-4" />
            Compartilhar nas redes
          </button>
        </div>
      )}
    </div>
  );
}
