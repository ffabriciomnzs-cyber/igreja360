'use client';

// Card dos cursos na tela inicial. Só aparece quando a igreja publicou algum —
// a home é disputada e um card vazio é ruído.

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { GraduationCap, ChevronRight } from 'lucide-react';
import { memberApi } from '@/lib/member-api';

interface Curso {
  id: string;
  title: string;
  totalLessons: number;
  enrolled: boolean;
  myDone: number;
  completedAt: string | null;
}

export function CursoResumo({ base }: { base: string }): React.ReactElement | null {
  const [cursos, setCursos] = useState<Curso[]>([]);

  useEffect(() => {
    memberApi
      .get<Curso[]>('/member-auth/courses')
      .then((r) => setCursos(r.data))
      .catch(() => undefined);
  }, []);

  if (!cursos.length) return null;
  // Prioriza o que está em andamento; senão, o primeiro disponível.
  const curso =
    cursos.find((c) => c.enrolled && !c.completedAt) ?? cursos[0];

  return (
    <Link
      href={`${base}/cursos`}
      className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
    >
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-950/40">
        <GraduationCap className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold text-slate-800 dark:text-slate-200">
          {curso.title}
        </p>
        <p className="truncate text-xs text-slate-500 dark:text-slate-400">
          {curso.completedAt
            ? 'Concluído'
            : curso.enrolled
              ? `${curso.myDone} de ${curso.totalLessons} lições`
              : `${curso.totalLessons} lições · comece quando quiser`}
        </p>
      </div>
      <ChevronRight className="h-5 w-5 shrink-0 text-slate-400" />
    </Link>
  );
}
