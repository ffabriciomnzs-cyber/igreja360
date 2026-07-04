'use client';

import { Music, BookOpen, Tv, Sparkles, Star } from 'lucide-react';

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
    color: 'bg-pink-500',
  },
  {
    title: 'Histórias da Bíblia',
    description: 'Histórias bíblicas contadas para crianças.',
    url: 'https://www.youtube.com/results?search_query=hist%C3%B3rias+b%C3%ADblicas+para+crian%C3%A7as',
    icon: BookOpen,
    color: 'bg-amber-500',
  },
  {
    title: '3 Palavrinhas',
    description: 'Músicas e desenhos cristãos infantis.',
    url: 'https://www.youtube.com/results?search_query=3+palavrinhas',
    icon: Sparkles,
    color: 'bg-indigo-500',
  },
  {
    title: 'Desenhos cristãos',
    description: 'Animações com valores da fé.',
    url: 'https://www.youtube.com/results?search_query=desenho+crist%C3%A3o+infantil',
    icon: Tv,
    color: 'bg-emerald-500',
  },
  {
    title: 'Versículos para decorar',
    description: 'Versículos cantados para memorizar.',
    url: 'https://www.youtube.com/results?search_query=vers%C3%ADculos+b%C3%ADblicos+para+crian%C3%A7as+cantados',
    icon: Star,
    color: 'bg-sky-500',
  },
];

export default function KidsPage(): React.ReactElement {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Área Kids 🧒</h1>
        <p className="text-sm text-slate-500">
          Conteúdos cristãos para as crianças aprenderem se divertindo.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {KIDS_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <a
              key={item.title}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-4 rounded-xl border border-border bg-white p-4 transition-shadow hover:shadow-md"
            >
              <div
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-white ${item.color}`}
              >
                <Icon className="h-6 w-6" />
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-slate-900">{item.title}</p>
                <p className="text-sm text-slate-500">{item.description}</p>
              </div>
            </a>
          );
        })}
      </div>

      <p className="pt-1 text-center text-xs text-slate-400">
        Os conteúdos abrem no YouTube. Recomendamos o acompanhamento dos pais.
      </p>
    </div>
  );
}
