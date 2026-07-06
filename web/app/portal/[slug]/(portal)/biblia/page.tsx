'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { ChevronLeft, ChevronRight, Loader2, BookOpen } from 'lucide-react';
import {
  BibleBook,
  BibleBookData,
  parseReference,
} from '@/lib/bible';

function BibleReader(): React.ReactElement {
  const params = useParams();
  const slug = String(params.slug);
  const search = useSearchParams();
  const ref = search.get('ref') ?? '';

  const [books, setBooks] = useState<BibleBook[]>([]);
  const [abbrev, setAbbrev] = useState('gn');
  const [chapter, setChapter] = useState(1);
  const [highlight, setHighlight] = useState<number | null>(null);
  const [book, setBook] = useState<BibleBookData | null>(null);
  const [loading, setLoading] = useState(true);

  // Carrega o índice e resolve a referência recebida.
  useEffect(() => {
    let mounted = true;
    fetch('/bible/index.json')
      .then((r) => r.json())
      .then((data: BibleBook[]) => {
        if (!mounted) return;
        setBooks(data);
        const parsed = ref ? parseReference(ref, data) : null;
        if (parsed) {
          setAbbrev(parsed.book.abbrev);
          setChapter(parsed.chapter);
          setHighlight(parsed.verse ?? null);
        }
      })
      .catch(() => undefined);
    return () => {
      mounted = false;
    };
  }, [ref]);

  // Carrega o livro selecionado.
  useEffect(() => {
    let mounted = true;
    setLoading(true);
    fetch(`/bible/${abbrev}.json`)
      .then((r) => r.json())
      .then((data: BibleBookData) => {
        if (mounted) setBook(data);
      })
      .catch(() => undefined)
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [abbrev]);

  const current = useMemo(
    () => books.find((b) => b.abbrev === abbrev) ?? null,
    [books, abbrev],
  );

  const verses = book?.chapters[chapter - 1] ?? [];

  function goChapter(next: number): void {
    if (!current) return;
    const clamped = Math.max(1, Math.min(current.chapters, next));
    setChapter(clamped);
    setHighlight(null);
    window.scrollTo({ top: 0 });
  }

  return (
    <div className="space-y-4">
      <Link
        href={`/portal/${slug}/devocional`}
        className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800"
      >
        <ChevronLeft className="h-4 w-4" />
        Devocional
      </Link>

      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-700 p-5 text-white shadow-lg">
        <BookOpen className="absolute -right-3 -top-3 h-20 w-20 text-white/10" />
        <div className="relative">
          <p className="text-xs uppercase tracking-wide text-indigo-200">
            Bíblia Sagrada
          </p>
          <h1 className="mt-0.5 text-2xl font-bold">
            {current?.name ?? 'Bíblia'}{' '}
            <span className="text-indigo-200">{chapter}</span>
          </h1>
          <div className="mt-3 flex gap-2">
            <select
              value={abbrev}
              onChange={(e) => {
                setAbbrev(e.target.value);
                setChapter(1);
                setHighlight(null);
              }}
              className="min-w-0 flex-1 rounded-lg border-0 bg-white/15 px-3 py-2 text-sm font-medium text-white outline-none backdrop-blur [&>option]:text-slate-900"
            >
              {books.map((b) => (
                <option key={b.abbrev} value={b.abbrev}>
                  {b.name}
                </option>
              ))}
            </select>
            <select
              value={chapter}
              onChange={(e) => goChapter(Number(e.target.value))}
              className="rounded-lg border-0 bg-white/15 px-3 py-2 text-sm font-medium text-white outline-none backdrop-blur [&>option]:text-slate-900"
            >
              {Array.from(
                { length: current?.chapters ?? 1 },
                (_, i) => i + 1,
              ).map((c) => (
                <option key={c} value={c}>
                  Cap. {c}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <p className="flex items-center gap-2 py-10 text-sm text-slate-400">
          <Loader2 className="h-4 w-4 animate-spin" />
          Carregando...
        </p>
      ) : (
        <div className="space-y-2.5 rounded-2xl border border-border bg-white p-5 shadow-sm">
          {verses.map((text, i) => {
            const v = i + 1;
            const active = highlight === v;
            return (
              <p
                key={v}
                className={`leading-relaxed transition-colors ${
                  active
                    ? 'rounded-lg bg-indigo-50 px-3 py-2 text-slate-900 ring-1 ring-indigo-100'
                    : 'text-slate-700'
                }`}
              >
                <span className="mr-1.5 align-super text-xs font-bold text-indigo-500">
                  {v}
                </span>
                {text}
              </p>
            );
          })}
        </div>
      )}

      <div className="flex items-center justify-between pb-4">
        <button
          onClick={() => goChapter(chapter - 1)}
          disabled={chapter <= 1}
          className="flex items-center gap-1 rounded-xl border border-border bg-white px-4 py-2.5 text-sm font-medium text-slate-600 shadow-sm transition-colors hover:bg-slate-50 disabled:opacity-40"
        >
          <ChevronLeft className="h-4 w-4" />
          Anterior
        </button>
        <span className="text-xs font-medium text-slate-400">
          {chapter} / {current?.chapters ?? 1}
        </span>
        <button
          onClick={() => goChapter(chapter + 1)}
          disabled={!current || chapter >= current.chapters}
          className="flex items-center gap-1 rounded-xl border border-border bg-white px-4 py-2.5 text-sm font-medium text-slate-600 shadow-sm transition-colors hover:bg-slate-50 disabled:opacity-40"
        >
          Próximo
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export default function PortalBiblePage(): React.ReactElement {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center gap-2 py-16 text-sm text-slate-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          Carregando...
        </div>
      }
    >
      <BibleReader />
    </Suspense>
  );
}
