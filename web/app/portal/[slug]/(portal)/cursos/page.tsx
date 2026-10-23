'use client';

// Lista de cursos do membro. Só aparece o que a igreja publicou.

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { GraduationCap, ChevronRight, Check, Users } from 'lucide-react';
import { memberApi } from '@/lib/member-api';

interface Curso {
  id: string;
  title: string;
  description: string | null;
  kind: string;
  couple: boolean;
  totalLessons: number;
  enrolled: boolean;
  myDone: number;
  completedAt: string | null;
  pastorTalkAt: string | null;
}

export default function CursosPage(): React.ReactElement {
  const { slug } = useParams<{ slug: string }>();
  const base = `/portal/${slug}`;
  const [cursos, setCursos] = useState<Curso[] | null>(null);

  useEffect(() => {
    memberApi
      .get<Curso[]>('/member-auth/courses')
      .then((r) => setCursos(r.data))
      .catch(() => setCursos([]));
  }, []);

  return (
    <div className="space-y-4">
      <h1 className="flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-slate-100">
        <GraduationCap className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
        Cursos
      </h1>

      {!cursos ? (
        <div className="h-32 animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-800" />
      ) : cursos.length === 0 ? (
        <p className="rounded-2xl bg-slate-50 px-4 py-10 text-center text-sm text-slate-500 dark:bg-slate-800/60 dark:text-slate-400">
          Nenhum curso disponível agora.
        </p>
      ) : (
        cursos.map((c) => {
          const pct = c.totalLessons
            ? Math.round((c.myDone / c.totalLessons) * 100)
            : 0;
          return (
            <Link
              key={c.id}
              href={`${base}/cursos/${c.id}`}
              className="block rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="flex items-start gap-3">
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-slate-900 dark:text-slate-100">
                    {c.title}
                  </p>
                  {c.description && (
                    <p className="mt-0.5 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                      {c.description}
                    </p>
                  )}
                </div>
                <ChevronRight className="mt-1 h-5 w-5 shrink-0 text-slate-400" />
              </div>

              <div className="mt-3 flex items-center gap-2 text-xs">
                {c.couple && (
                  <span className="flex items-center gap-1 rounded-lg bg-rose-50 px-2 py-1 font-medium text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
                    <Users className="h-3 w-3" /> para o casal
                  </span>
                )}
                {c.completedAt ? (
                  <span className="flex items-center gap-1 rounded-lg bg-emerald-50 px-2 py-1 font-medium text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                    <Check className="h-3 w-3" />
                    {c.pastorTalkAt ? 'Concluído' : 'Falta a conversa com o pastor'}
                  </span>
                ) : c.enrolled ? (
                  <span className="text-slate-500 dark:text-slate-400">
                    {c.myDone} de {c.totalLessons} lições
                  </span>
                ) : (
                  <span className="text-slate-500 dark:text-slate-400">
                    {c.totalLessons} lições · comece quando quiser
                  </span>
                )}
              </div>

              {c.enrolled && !c.completedAt && (
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                  <div
                    className="h-full rounded-full bg-indigo-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              )}
            </Link>
          );
        })
      )}
    </div>
  );
}
