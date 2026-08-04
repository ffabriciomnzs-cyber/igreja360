'use client';

import { PageHeader } from '@/components/PageHeader';
import { Card, CardContent } from '@/components/ui/card';

interface Tutorial {
  titulo: string;
  descricao: string;
  arquivo: string;
  capa: string;
  /** Vídeo de celular (retrato) fica estreito; o do painel ocupa a largura. */
  retrato: boolean;
}

const TUTORIAIS: Tutorial[] = [
  {
    titulo: 'Painel administrativo',
    descricao:
      'Uma volta completa pelo painel: membros, células, finanças, eventos, cultos, comunicações e configurações.',
    arquivo: '/tutoriais/painel-administrativo.mp4',
    capa: '/tutoriais/painel-administrativo.jpg',
    retrato: false,
  },
  {
    titulo: 'Portal do membro',
    descricao:
      'O que o membro encontra no celular — para você mostrar à igreja e ajudar quem tiver dúvida.',
    arquivo: '/tutoriais/portal-do-membro.mp4',
    capa: '/tutoriais/portal-do-membro.jpg',
    retrato: true,
  },
  {
    titulo: 'Redefinir a senha',
    descricao:
      'Como o membro troca a própria senha e o que fazer quando ele esquece.',
    arquivo: '/tutoriais/redefinir-senha.mp4',
    capa: '/tutoriais/redefinir-senha.jpg',
    retrato: true,
  },
];

export default function AjudaPage(): React.ReactElement {
  return (
    <div>
      <PageHeader
        title="Ajuda em vídeo"
        description="Tutoriais curtos do Igreja360. Assista quando quiser."
      />

      <div className="space-y-4">
        {TUTORIAIS.map((t) => (
          <Card key={t.arquivo}>
            <CardContent className="flex flex-col gap-4 p-4 sm:flex-row">
              <video
                controls
                preload="none"
                poster={t.capa}
                className={`w-full shrink-0 rounded-xl bg-black ${
                  t.retrato ? 'sm:w-56' : 'sm:w-96'
                }`}
              >
                <source src={t.arquivo} type="video/mp4" />
              </video>
              <div className="min-w-0">
                <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                  {t.titulo}
                </h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  {t.descricao}
                </p>
                <a
                  href={t.arquivo}
                  download
                  className="mt-3 inline-block text-sm font-medium text-indigo-600 hover:underline dark:text-indigo-400"
                >
                  Baixar o vídeo
                </a>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
