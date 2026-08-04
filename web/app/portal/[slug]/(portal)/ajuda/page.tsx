'use client';

import { PlayCircle } from 'lucide-react';

interface Tutorial {
  titulo: string;
  descricao: string;
  arquivo: string;
  capa: string;
}

const TUTORIAIS: Tutorial[] = [
  {
    titulo: 'Conhecendo o portal',
    descricao:
      'Um passeio pelo app: devocional, Arena Bíblica, área Kids, carteirinha e avisos da igreja.',
    arquivo: '/tutoriais/portal-do-membro.mp4',
    capa: '/tutoriais/portal-do-membro.jpg',
  },
  {
    titulo: 'Trocar ou recuperar a senha',
    descricao:
      'Como mudar a sua senha pelo Perfil e o que fazer se você esquecer.',
    arquivo: '/tutoriais/redefinir-senha.mp4',
    capa: '/tutoriais/redefinir-senha.jpg',
  },
];

export default function AjudaPortalPage(): React.ReactElement {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-slate-100">
          <PlayCircle className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
          Ajuda em vídeo
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Vídeos curtos para você aproveitar tudo o que o app oferece.
        </p>
      </div>

      {TUTORIAIS.map((t) => (
        <section
          key={t.arquivo}
          className="overflow-hidden rounded-2xl border border-border bg-white dark:bg-slate-900"
        >
          <video
            controls
            playsInline
            preload="none"
            poster={t.capa}
            className="w-full bg-black"
          >
            <source src={t.arquivo} type="video/mp4" />
          </video>
          <div className="p-4">
            <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200">
              {t.titulo}
            </h2>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {t.descricao}
            </p>
          </div>
        </section>
      ))}
    </div>
  );
}
