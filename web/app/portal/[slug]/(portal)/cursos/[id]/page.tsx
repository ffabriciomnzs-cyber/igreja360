'use client';

// O curso aberto: uma lição por vez, no ritmo de quem lê.
//
// Não há trava de tempo nem prova. Dá para marcar tudo em dois minutos se a
// pessoa quiser — o objetivo é preparar alguém para o batismo ou para o
// casamento, não pegar quem apressa. Quem engana o curso não é problema de
// software.

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  GraduationCap, Check, ChevronDown, Loader2, BookOpen, Users, Heart,
} from 'lucide-react';
import { memberApi } from '@/lib/member-api';
import { cn } from '@/lib/utils';

interface Licao {
  id: string;
  position: number;
  title: string;
  content: string;
  bibleRefs: string[];
  question: string | null;
  done: boolean;
  partnerDone: boolean;
  reflection: string | null;
}
interface Curso {
  id: string;
  title: string;
  description: string | null;
  couple: boolean;
  needsPastor: boolean;
  enrolled: boolean;
  completedAt: string | null;
  pastorTalkAt: string | null;
  partnerName: string | null;
  lessons: Licao[];
}

export default function CursoPage(): React.ReactElement {
  const { slug, id } = useParams<{ slug: string; id: string }>();
  const base = `/portal/${slug}`;
  const [curso, setCurso] = useState<Curso | null>(null);
  const [aberta, setAberta] = useState<string | null>(null);
  const [texto, setTexto] = useState('');
  const [salvando, setSalvando] = useState(false);

  const carrega = useCallback(async () => {
    try {
      const { data } = await memberApi.get<Curso>(`/member-auth/courses/${id}`);
      setCurso(data);
      // Abre direto na primeira que falta: é onde a pessoa parou.
      setAberta((a) => a ?? data.lessons.find((l) => !l.done)?.id ?? null);
    } catch {
      setCurso(null);
    }
  }, [id]);

  useEffect(() => {
    void carrega();
  }, [carrega]);

  async function inscrever(): Promise<void> {
    setSalvando(true);
    try {
      await memberApi.post(`/member-auth/courses/${id}/enroll`);
      await carrega();
    } finally {
      setSalvando(false);
    }
  }

  async function concluir(licao: Licao): Promise<void> {
    if (salvando) return;
    setSalvando(true);
    try {
      await memberApi.post<Curso>(`/member-auth/courses/lessons/${licao.id}/done`, {
        reflection: texto.trim() || undefined,
      });
      setTexto('');
      const { data } = await memberApi.get<Curso>(`/member-auth/courses/${id}`);
      setCurso(data);
      setAberta(data.lessons.find((l) => !l.done)?.id ?? null);
    } finally {
      setSalvando(false);
    }
  }

  if (!curso) {
    return <div className="h-64 animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-800" />;
  }

  const feitas = curso.lessons.filter((l) => l.done).length;
  const pct = Math.round((feitas / Math.max(1, curso.lessons.length)) * 100);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-slate-100">
          <GraduationCap className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
          {curso.title}
        </h1>
        {curso.description && (
          <p className="mt-1 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
            {curso.description}
          </p>
        )}
      </div>

      {!curso.enrolled ? (
        <button
          onClick={() => void inscrever()}
          disabled={salvando}
          className="w-full rounded-xl bg-indigo-600 py-4 text-base font-bold text-white disabled:opacity-60"
        >
          {salvando ? <Loader2 className="mx-auto h-5 w-5 animate-spin" /> : 'Começar o curso'}
        </button>
      ) : (
        <>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between text-sm">
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {feitas} de {curso.lessons.length} lições
              </span>
              <span className="text-slate-400">{pct}%</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
              <div className="h-full rounded-full bg-indigo-500" style={{ width: `${pct}%` }} />
            </div>
            {curso.couple && curso.partnerName && (
              <p className="mt-2 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                <Heart className="h-3.5 w-3.5 text-rose-500" />
                Vocês fazem juntos com {curso.partnerName.split(' ')[0]} — cada um
                responde no seu celular.
              </p>
            )}
            {curso.couple && !curso.partnerName && (
              <p className="mt-2 flex items-center gap-1.5 text-xs text-amber-700 dark:text-amber-400">
                <Users className="h-3.5 w-3.5" />
                A igreja ainda vai vincular o seu par. Pode começar.
              </p>
            )}
          </div>

          {curso.completedAt && (
            <div className="rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 p-5 text-center text-white">
              <Check className="mx-auto h-8 w-8" />
              <p className="mt-1 font-bold">Você terminou as lições!</p>
              <p className="mt-1 text-sm text-emerald-50">
                {curso.pastorTalkAt
                  ? 'Preparação concluída.'
                  : 'Agora é conversar com o pastor — ele já foi avisado.'}
              </p>
            </div>
          )}

          <div className="space-y-2">
            {curso.lessons.map((l) => {
              const abertaAgora = aberta === l.id;
              return (
                <div
                  key={l.id}
                  className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
                >
                  <button
                    onClick={() => setAberta(abertaAgora ? null : l.id)}
                    className="flex w-full items-center gap-3 px-4 py-3.5 text-left"
                  >
                    <span
                      className={cn(
                        'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold',
                        l.done
                          ? 'bg-emerald-500 text-white'
                          : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400',
                      )}
                    >
                      {l.done ? <Check className="h-4 w-4" /> : l.position}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold text-slate-800 dark:text-slate-200">
                        {l.title}
                      </span>
                      {curso.couple && l.done && (
                        <span className="text-xs text-slate-400">
                          {l.partnerDone
                            ? 'os dois já fizeram'
                            : `aguardando ${curso.partnerName?.split(' ')[0] ?? 'o par'}`}
                        </span>
                      )}
                    </span>
                    <ChevronDown
                      className={cn(
                        'h-4 w-4 shrink-0 text-slate-400 transition-transform',
                        abertaAgora && 'rotate-180',
                      )}
                    />
                  </button>

                  {abertaAgora && (
                    <div className="border-t border-slate-100 px-4 py-4 dark:border-slate-800">
                      {l.content.split('\n\n').map((par, i) => (
                        <p
                          key={i}
                          className="mb-3 text-[15px] leading-relaxed text-slate-700 dark:text-slate-300"
                        >
                          {par}
                        </p>
                      ))}

                      {l.bibleRefs.length > 0 && (
                        <div className="mt-1 flex flex-wrap gap-1.5">
                          {l.bibleRefs.map((ref) => (
                            <Link
                              key={ref}
                              href={`${base}/biblia?q=${encodeURIComponent(ref)}`}
                              className="flex items-center gap-1 rounded-lg bg-indigo-50 px-2 py-1 text-xs font-medium text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300"
                            >
                              <BookOpen className="h-3 w-3" />
                              {ref}
                            </Link>
                          ))}
                        </div>
                      )}

                      {l.question && (
                        <div className="mt-4">
                          <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                            {l.question}
                          </p>
                          <p className="mt-0.5 text-xs text-slate-400">
                            Só você e a liderança leem o que escrever aqui.
                          </p>
                          <textarea
                            value={l.done ? (l.reflection ?? '') : texto}
                            onChange={(e) => setTexto(e.target.value)}
                            readOnly={l.done}
                            rows={3}
                            placeholder="Escreva se quiser (opcional)"
                            className="mt-2 w-full rounded-xl border border-slate-200 p-3 text-sm dark:border-slate-700 dark:bg-slate-800"
                          />
                        </div>
                      )}

                      {!l.done && (
                        <button
                          onClick={() => void concluir(l)}
                          disabled={salvando}
                          className="mt-3 w-full rounded-xl bg-indigo-600 py-3 text-sm font-bold text-white disabled:opacity-60"
                        >
                          {salvando ? (
                            <Loader2 className="mx-auto h-4 w-4 animate-spin" />
                          ) : (
                            'Marcar como lida'
                          )}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      <Link
        href={`${base}/cursos`}
        className="block text-center text-sm text-slate-500 dark:text-slate-400"
      >
        Voltar para os cursos
      </Link>
    </div>
  );
}
