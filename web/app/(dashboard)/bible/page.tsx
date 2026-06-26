'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Search,
  Copy,
  Check,
  Loader2,
  BookOpen,
} from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import {
  BibleBook,
  BibleBookData,
  parseReference,
  normalize,
} from '@/lib/bible';

const STORAGE_KEY = 'igreja360.bible';

interface SearchHit {
  chapter: number;
  verse: number;
  text: string;
}

export default function BiblePage(): React.ReactElement {
  const [books, setBooks] = useState<BibleBook[]>([]);
  const [abbrev, setAbbrev] = useState<string>('gn');
  const [chapter, setChapter] = useState<number>(1);
  const [book, setBook] = useState<BibleBookData | null>(null);
  const [loadingBook, setLoadingBook] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [query, setQuery] = useState('');
  const [hits, setHits] = useState<SearchHit[] | null>(null);
  const [highlight, setHighlight] = useState<number | null>(null);
  const [copied, setCopied] = useState<number | null>(null);

  // Carrega o índice e restaura a última posição.
  useEffect(() => {
    let mounted = true;
    fetch('/bible/index.json')
      .then((r) => r.json())
      .then((data: BibleBook[]) => {
        if (!mounted) return;
        setBooks(data);
        try {
          const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null');
          if (saved?.abbrev && data.some((b) => b.abbrev === saved.abbrev)) {
            setAbbrev(saved.abbrev);
            setChapter(saved.chapter ?? 1);
          }
        } catch {
          /* ignora */
        }
      })
      .catch(() => {
        if (mounted) setError('Não foi possível carregar a Bíblia.');
      });
    return () => {
      mounted = false;
    };
  }, []);

  // Carrega o livro selecionado.
  useEffect(() => {
    let mounted = true;
    setLoadingBook(true);
    fetch(`/bible/${abbrev}.json`)
      .then((r) => r.json())
      .then((data: BibleBookData) => {
        if (mounted) setBook(data);
      })
      .catch(() => {
        if (mounted) setError('Não foi possível carregar o livro.');
      })
      .finally(() => {
        if (mounted) setLoadingBook(false);
      });
    return () => {
      mounted = false;
    };
  }, [abbrev]);

  // Persiste a posição.
  useEffect(() => {
    if (books.length) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ abbrev, chapter }));
    }
  }, [abbrev, chapter, books.length]);

  const current = useMemo(
    () => books.find((b) => b.abbrev === abbrev) ?? null,
    [books, abbrev],
  );

  const verses = book?.chapters[chapter - 1] ?? [];

  const goTo = useCallback(
    (newAbbrev: string, newChapter: number, verse?: number) => {
      setAbbrev(newAbbrev);
      setChapter(newChapter);
      setHighlight(verse ?? null);
      setHits(null);
    },
    [],
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;

    // 1) Tenta interpretar como referência (ex.: "João 3:16").
    const ref = parseReference(q, books);
    if (ref) {
      goTo(ref.book.abbrev, ref.chapter, ref.verse);
      if (ref.verse) {
        setTimeout(() => {
          document
            .getElementById(`v-${ref.verse}`)
            ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 300);
      }
      return;
    }

    // 2) Busca por palavra dentro do livro atual.
    if (!book) return;
    const term = normalize(q);
    const found: SearchHit[] = [];
    book.chapters.forEach((chap, ci) => {
      chap.forEach((text, vi) => {
        if (normalize(text).includes(term)) {
          found.push({ chapter: ci + 1, verse: vi + 1, text });
        }
      });
    });
    setHits(found);
  };

  const copyVerse = async (verse: number, text: string) => {
    const ref = `${current?.name} ${chapter}:${verse}`;
    try {
      await navigator.clipboard.writeText(`"${text}" (${ref})`);
      setCopied(verse);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      /* clipboard indisponível */
    }
  };

  const at = books.filter((b) => b.testament === 'AT');
  const nt = books.filter((b) => b.testament === 'NT');

  if (error) {
    return (
      <div>
        <PageHeader title="Bíblia" description="Almeida — domínio público." />
        <div className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Bíblia"
        description="Almeida (domínio público) — Antigo e Novo Testamento."
      />

      {/* Controles */}
      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">
              Livro
            </label>
            <select
              value={abbrev}
              onChange={(e) => goTo(e.target.value, 1)}
              className="rounded-md border border-border px-3 py-1.5 text-sm"
            >
              <optgroup label="Antigo Testamento">
                {at.map((b) => (
                  <option key={b.abbrev} value={b.abbrev}>
                    {b.name}
                  </option>
                ))}
              </optgroup>
              <optgroup label="Novo Testamento">
                {nt.map((b) => (
                  <option key={b.abbrev} value={b.abbrev}>
                    {b.name}
                  </option>
                ))}
              </optgroup>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">
              Capítulo
            </label>
            <select
              value={chapter}
              onChange={(e) => goTo(abbrev, Number(e.target.value))}
              className="rounded-md border border-border px-3 py-1.5 text-sm"
            >
              {Array.from({ length: current?.chapters ?? 1 }, (_, i) => (
                <option key={i + 1} value={i + 1}>
                  {i + 1}
                </option>
              ))}
            </select>
          </div>
        </div>

        <form onSubmit={handleSearch} className="flex items-end gap-2">
          <div className="flex-1 lg:w-72">
            <label className="mb-1 block text-xs font-medium text-slate-500">
              Buscar (referência ou palavra)
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ex.: João 3:16 ou amor"
                className="w-full rounded-md border border-border py-1.5 pl-9 pr-3 text-sm"
              />
            </div>
          </div>
          <button
            type="submit"
            className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700"
          >
            Buscar
          </button>
        </form>
      </div>

      {/* Resultados de busca por palavra */}
      {hits !== null && (
        <Card className="mb-5">
          <CardContent className="p-5">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-medium text-slate-600">
                {hits.length} resultado(s) em {current?.name}
              </p>
              <button
                onClick={() => setHits(null)}
                className="text-xs text-slate-500 hover:text-indigo-600"
              >
                Fechar
              </button>
            </div>
            {hits.length === 0 ? (
              <p className="py-4 text-center text-sm text-slate-400">
                Nenhum versículo encontrado neste livro.
              </p>
            ) : (
              <ul className="max-h-72 space-y-2 overflow-y-auto">
                {hits.map((h) => (
                  <li key={`${h.chapter}-${h.verse}`}>
                    <button
                      onClick={() => goTo(abbrev, h.chapter, h.verse)}
                      className="text-left text-sm hover:text-indigo-600"
                    >
                      <span className="font-semibold text-indigo-600">
                        {h.chapter}:{h.verse}
                      </span>{' '}
                      <span className="text-slate-600">{h.text}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      )}

      {/* Texto do capítulo */}
      <Card>
        <CardContent className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
              <BookOpen className="h-5 w-5 text-indigo-600" />
              {current?.name} {chapter}
            </h2>
            <div className="flex gap-2">
              <button
                onClick={() => goTo(abbrev, Math.max(1, chapter - 1))}
                disabled={chapter <= 1}
                className="inline-flex items-center gap-1 rounded-md border border-border px-2.5 py-1.5 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" />
                Anterior
              </button>
              <button
                onClick={() =>
                  goTo(abbrev, Math.min(current?.chapters ?? 1, chapter + 1))
                }
                disabled={chapter >= (current?.chapters ?? 1)}
                className="inline-flex items-center gap-1 rounded-md border border-border px-2.5 py-1.5 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-40"
              >
                Próximo
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          {loadingBook ? (
            <div className="flex items-center justify-center gap-2 py-16 text-sm text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              Carregando...
            </div>
          ) : (
            <div className="space-y-2 leading-relaxed">
              {verses.map((text, i) => {
                const verse = i + 1;
                return (
                  <p
                    key={verse}
                    id={`v-${verse}`}
                    className={`group rounded px-2 py-1 ${
                      highlight === verse ? 'bg-amber-100' : ''
                    }`}
                  >
                    <sup className="mr-1 font-semibold text-indigo-600">
                      {verse}
                    </sup>
                    <span className="text-slate-800">{text}</span>
                    <button
                      onClick={() => copyVerse(verse, text)}
                      title="Copiar versículo"
                      className="ml-2 inline-flex translate-y-0.5 text-slate-300 opacity-0 transition-opacity hover:text-indigo-600 group-hover:opacity-100"
                    >
                      {copied === verse ? (
                        <Check className="h-3.5 w-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </p>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
