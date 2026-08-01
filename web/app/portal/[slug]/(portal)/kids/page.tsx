'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Music, BookOpen, Tv, Sparkles, Star, ChevronRight, Gamepad2 } from 'lucide-react';

// Jogos feitos por nós: rodam no próprio aparelho, sem anúncio e sem sair
// do portal — diferente dos conteúdos abaixo, que abrem no YouTube.
const JOGOS = [
  { emoji: '🃏', titulo: 'Memória', rota: 'memoria' },
  { emoji: '⭐', titulo: 'Quiz Kids', rota: 'quiz' },
  { emoji: '📖', titulo: 'Ordene a História', rota: 'historia' },
  { emoji: '🔍', titulo: 'Ache o Intruso', rota: 'intruso' },
];

interface KidsItem {
  title: string;
  description: string;
  url: string;
  icon: typeof Music;
  color: string;
}

// Conteúdo infantil cristão (buscas seguras que sempre abrem conteúdo atual).
const KIDS_ITEMS: KidsItem[] = [
  {
    title: 'Louvores infantis',
    description: 'Cânticos gospel para as crianças cantarem.',
    url: 'https://www.youtube.com/results?search_query=louvor+infantil+gospel',
    icon: Music,
    color: 'from-pink-500 to-rose-500',
  },
  {
    title: 'Histórias da Bíblia',
    description: 'Histórias bíblicas contadas para crianças.',
    url: 'https://www.youtube.com/results?search_query=hist%C3%B3rias+b%C3%ADblicas+para+crian%C3%A7as',
    icon: BookOpen,
    color: 'from-amber-500 to-orange-500',
  },
  {
    title: '3 Palavrinhas',
    description: 'Músicas e desenhos cristãos infantis.',
    url: 'https://www.youtube.com/results?search_query=3+palavrinhas',
    icon: Sparkles,
    color: 'from-indigo-500 to-violet-500',
  },
  {
    title: 'Desenhos cristãos',
    description: 'Animações com valores da fé.',
    url: 'https://www.youtube.com/results?search_query=desenho+crist%C3%A3o+infantil',
    icon: Tv,
    color: 'from-emerald-500 to-teal-500',
  },
  {
    title: 'Versículos para decorar',
    description: 'Versículos cantados para memorizar.',
    url: 'https://www.youtube.com/results?search_query=vers%C3%ADculos+b%C3%ADblicos+para+crian%C3%A7as+cantados',
    icon: Star,
    color: 'from-sky-500 to-blue-500',
  },
];

export default function KidsPage(): React.ReactElement {
  const slug = String(useParams()?.slug ?? '');
  return (
    <div className="space-y-5">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-fuchsia-500 to-indigo-600 p-5 text-white shadow-lg">
        <Sparkles className="absolute -right-4 -top-4 h-24 w-24 text-white/10" />
        <div className="relative">
          <h1 className="text-xl font-bold">Área Kids 🧒</h1>
          <p className="mt-1 max-w-xs text-sm text-white/80">
            Conteúdos cristãos para as crianças aprenderem se divertindo.
          </p>
        </div>
      </div>

      {/* Joguinhos */}
      <section>
        <h2 className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-800 dark:text-slate-200">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-fuchsia-500 text-white">
            <Gamepad2 className="h-4 w-4" />
          </span>
          Joguinhos
        </h2>
        <div className="grid grid-cols-2 gap-3">
          {JOGOS.map((j) => (
            <Link
              key={j.rota}
              href={`/portal/${slug}/kids/jogos/${j.rota}`}
              className="rounded-3xl border-2 border-fuchsia-100 bg-white p-4 text-center shadow-sm transition-transform active:scale-95 dark:border-fuchsia-900/60 dark:bg-slate-900"
            >
              <span className="text-4xl">{j.emoji}</span>
              <span className="mt-1.5 block text-sm font-bold text-slate-800 dark:text-slate-200">
                {j.titulo}
              </span>
            </Link>
          ))}
        </div>
      </section>

      <div className="grid grid-cols-1 gap-3">
        {KIDS_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <a
              key={item.title}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-4 rounded-2xl border border-border bg-white dark:bg-slate-900 p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
            >
              <div
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow ${item.color}`}
              >
                <Icon className="h-6 w-6" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-slate-900 dark:text-slate-100">{item.title}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">{item.description}</p>
              </div>
              <ChevronRight className="h-5 w-5 shrink-0 text-slate-300 dark:text-slate-600" />
            </a>
          );
        })}
      </div>

      <p className="pt-1 text-center text-xs text-slate-400 dark:text-slate-500">
        Os conteúdos abrem no YouTube. Recomendamos o acompanhamento dos pais.
      </p>
    </div>
  );
}
