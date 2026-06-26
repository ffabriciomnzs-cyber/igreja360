// Tipos e utilitários da Bíblia (arquivos estáticos em /public/bible).

export interface BibleBook {
  abbrev: string;
  name: string;
  testament: 'AT' | 'NT';
  chapters: number;
}

export interface BibleBookData {
  abbrev: string;
  name: string;
  chapters: string[][]; // chapters[cap][versículo]
}

export function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim();
}

export interface ParsedReference {
  book: BibleBook;
  chapter: number;
  verse?: number;
}

// Interpreta entradas como "João 3:16", "1 co 13", "salmos 23".
export function parseReference(
  query: string,
  books: BibleBook[],
): ParsedReference | null {
  const match = query.trim().match(/^(.+?)\s*(\d+)?\s*(?::\s*(\d+))?\s*$/);
  if (!match) return null;

  const rawBook = normalize(match[1]);
  if (!rawBook) return null;

  const book =
    books.find((b) => normalize(b.name) === rawBook) ??
    books.find((b) => normalize(b.abbrev) === rawBook) ??
    books.find((b) => normalize(b.name).startsWith(rawBook)) ??
    books.find(
      (b) =>
        normalize(b.name).replace(/\s/g, '') === rawBook.replace(/\s/g, ''),
    );

  if (!book) return null;

  const chapter = match[2] ? Number(match[2]) : 1;
  if (chapter < 1 || chapter > book.chapters) return null;

  return {
    book,
    chapter,
    verse: match[3] ? Number(match[3]) : undefined,
  };
}
