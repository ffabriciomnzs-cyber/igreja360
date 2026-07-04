'use client';

import { useEffect, useState } from 'react';
import { Loader2, HandHeart, BookOpen, Music, Share2 } from 'lucide-react';
import { memberApi } from '@/lib/member-api';
import { verseOfDay } from '@/lib/verse-of-day';

interface DevotionalContent {
  title: string | null;
  verseRef: string | null;
  verseText: string | null;
  reflection: string;
  songTitle: string | null;
  songUrl: string | null;
  image: string | null;
}

interface DevotionalResponse {
  count: number;
  joined: boolean;
  content: DevotionalContent | null;
}

export default function DevocionalPage(): React.ReactElement {
  const fallback = verseOfDay();
  const today = new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
  }).format(new Date());

  const [content, setContent] = useState<DevotionalContent | null>(null);
  const [count, setCount] = useState(0);
  const [joined, setJoined] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let mounted = true;
    memberApi
      .get<DevotionalResponse>('/member-auth/devotional')
      .then(({ data }) => {
        if (!mounted) return;
        setContent(data.content);
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

  const verseRef = content?.verseRef || fallback.ref;
  const verseText = content?.verseText || fallback.text;
  const reflection = content?.reflection || null;

  async function share(): Promise<void> {
    const parts = [
      content?.title || 'Devocional do dia',
      '',
      `“${verseText}” — ${verseRef}`,
    ];
    if (reflection) parts.push('', reflection);
    const text = parts.join('\n');

    const data: ShareData = { title: 'Devocional', text };
    if (content?.image) {
      try {
        const blob = await (await fetch(content.image)).blob();
        const file = new File([blob], 'devocional.jpg', { type: blob.type });
        if (navigator.canShare?.({ files: [file] })) {
          (data as ShareData & { files: File[] }).files = [file];
        }
      } catch {
        /* segue sem imagem */
      }
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
  }

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
        <h1 className="text-xl font-bold text-slate-900">
          {content?.title || 'Devocional do dia'}
        </h1>
        <p className="text-sm capitalize text-slate-500">{today}</p>
      </div>

      {/* Imagem compartilhável (se houver) */}
      {content?.image && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={content.image}
          alt="Devocional"
          className="w-full rounded-2xl object-cover shadow"
        />
      )}

      {/* Versículo */}
      <div className="rounded-2xl bg-gradient-to-br from-indigo-600 to-indigo-800 p-6 text-white shadow-lg">
        <BookOpen className="h-6 w-6 text-indigo-200" />
        <p className="mt-3 text-lg font-medium leading-relaxed">
          “{verseText}”
        </p>
        <p className="mt-2 text-sm text-indigo-200">{verseRef}</p>
      </div>

      {/* Reflexão */}
      {reflection ? (
        <div className="rounded-xl border border-border bg-white p-5">
          <p className="whitespace-pre-line leading-relaxed text-slate-700">
            {reflection}
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-white p-5">
          <p className="text-sm leading-relaxed text-slate-600">
            Reserve um momento para meditar nesta palavra e orar.
          </p>
        </div>
      )}

      {/* Música do dia */}
      {content?.songUrl && (
        <a
          href={content.songUrl}
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
            <p className="truncate font-medium text-slate-900">
              {content.songTitle || 'Ouvir agora'}
            </p>
          </div>
        </a>
      )}

      {/* Compartilhar */}
      <button
        onClick={share}
        className="flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-white py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
      >
        <Share2 className="h-4 w-4" />
        Compartilhar nas redes
      </button>

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
