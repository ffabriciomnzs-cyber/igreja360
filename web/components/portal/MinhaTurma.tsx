'use client';

// "Minha turma na EBD" — o aluno sabe onde é a sala e quem é o professor.
// Some da tela quando ele não está matriculado em nenhuma turma.

import { useEffect, useState } from 'react';
import { GraduationCap } from 'lucide-react';
import { memberApi } from '@/lib/member-api';

interface Turma {
  id: string;
  name: string;
  room: string | null;
  teacherName: string | null;
}

export function MinhaTurma(): React.ReactElement | null {
  const [turmas, setTurmas] = useState<Turma[]>([]);

  useEffect(() => {
    memberApi
      .get<Turma[]>('/member-auth/school')
      .then((r) => setTurmas(r.data))
      .catch(() => undefined);
  }, []);

  if (!turmas.length) return null;

  return (
    <div className="rounded-2xl border border-border bg-white p-4 dark:bg-slate-900">
      <div className="flex items-center gap-2">
        <GraduationCap className="h-4 w-4 text-indigo-500" />
        <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
          {turmas.length === 1 ? 'Minha turma na EBD' : 'Minhas turmas na EBD'}
        </span>
      </div>
      <div className="mt-2 space-y-1.5">
        {turmas.map((t) => (
          <div key={t.id}>
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              {t.name}
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {t.teacherName ? `Prof. ${t.teacherName}` : 'Professor a definir'}
              {t.room ? ` · ${t.room}` : ''}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
