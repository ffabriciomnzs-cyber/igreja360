'use client';

// Painel dos cursos: criar a partir de um modelo, revisar as lições, publicar,
// acompanhar quem está fazendo e registrar a conversa e o batismo.

import { useCallback, useEffect, useState } from 'react';
import {
  GraduationCap, Plus, Loader2, Eye, EyeOff, Trash2, Check, Heart, MessageSquare,
} from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ListSkeleton } from '@/components/ui/skeleton';
import { notFound } from 'next/navigation';
import { api, extractApiError } from '@/lib/api';
import { CURSOS_HABILITADO } from '@/lib/features';
import { toast } from 'sonner';

interface Licao {
  id: string;
  position: number;
  title: string;
  content: string;
  bibleRefs: string[];
  question: string | null;
}
interface Inscricao {
  id: string;
  memberName: string;
  partnerName: string | null;
  done: number;
  partnerDone: number;
  total: number;
  completedAt: string | null;
  pastorTalkAt: string | null;
  baptizedAt: string | null;
}
interface Curso {
  id: string;
  title: string;
  description: string | null;
  kind: string;
  couple: boolean;
  published: boolean;
  lessons: Licao[];
  enrollments: Inscricao[];
}
interface Modelo {
  id: string;
  title: string;
  description: string;
  lessons: number;
  couple: boolean;
}

export default function CursosAdminPage(): React.ReactElement {
  if (!CURSOS_HABILITADO) notFound();

  const [cursos, setCursos] = useState<Curso[] | null>(null);
  const [modelos, setModelos] = useState<Modelo[]>([]);
  const [ocupado, setOcupado] = useState<string | null>(null);
  const [editando, setEditando] = useState<Licao | null>(null);
  const [reflexoes, setReflexoes] = useState<
    { position: number; title: string; question: string | null; answers: { name: string; text: string }[] }[] | null
  >(null);

  const carrega = useCallback(() => {
    Promise.all([
      api.get<Curso[]>('/courses'),
      api.get<Modelo[]>('/courses/templates'),
    ])
      .then(([c, m]) => {
        setCursos(c.data);
        setModelos(m.data);
      })
      .catch((e) => toast.error(extractApiError(e)));
  }, []);

  useEffect(() => carrega(), [carrega]);

  async function acao(nome: string, fn: () => Promise<unknown>): Promise<void> {
    setOcupado(nome);
    try {
      await fn();
      carrega();
    } catch (e) {
      toast.error(extractApiError(e));
    } finally {
      setOcupado(null);
    }
  }

  return (
    <div>
      <PageHeader
        title="Cursos"
        description="Preparação para o batismo, para o casamento e o que mais a igreja quiser ensinar pelo app."
      />

      {!cursos ? (
        <ListSkeleton />
      ) : (
        <div className="space-y-4">
          {cursos.length === 0 && (
            <Card>
              <CardContent className="p-5">
                <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  Comece por um modelo
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  O curso é criado como <strong>rascunho</strong>: ninguém vê até
                  você ler, ajustar o texto e publicar. O conteúdo é uma sugestão
                  — a doutrina é da igreja.
                </p>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {modelos.map((m) => (
                    <button
                      key={m.id}
                      onClick={() =>
                        void acao(m.id, () => api.post(`/courses/templates/${m.id}`))
                      }
                      disabled={!!ocupado}
                      className="rounded-xl border border-slate-200 p-3 text-left disabled:opacity-60 dark:border-slate-700"
                    >
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                        {ocupado === m.id ? 'Criando...' : m.title}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {m.lessons} lições{m.couple ? ' · para o casal' : ''}
                      </p>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {cursos.map((c) => (
            <Card key={c.id}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="flex items-center gap-2 font-bold text-slate-900 dark:text-slate-100">
                      <GraduationCap className="h-4 w-4 text-indigo-600" />
                      {c.title}
                      {c.couple && <Heart className="h-3.5 w-3.5 text-rose-500" />}
                    </h2>
                    <p className="text-xs text-slate-500">
                      {c.lessons.length} lições · {c.enrollments.length} inscrito(s)
                    </p>
                  </div>
                  <Button
                    variant={c.published ? 'outline' : 'default'}
                    onClick={() =>
                      void acao(c.id, () =>
                        api.patch(`/courses/${c.id}`, { published: !c.published }),
                      )
                    }
                    disabled={!!ocupado}
                  >
                    {ocupado === c.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : c.published ? (
                      <>
                        <EyeOff className="mr-1 h-4 w-4" /> Despublicar
                      </>
                    ) : (
                      <>
                        <Eye className="mr-1 h-4 w-4" /> Publicar
                      </>
                    )}
                  </Button>
                </div>

                {!c.published && (
                  <p className="mt-2 rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
                    Rascunho — nenhum membro vê este curso ainda. Leia as lições
                    antes de publicar.
                  </p>
                )}

                {/* Lições */}
                <div className="mt-3 space-y-1.5">
                  {c.lessons.map((l) => (
                    <div
                      key={l.id}
                      className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 text-sm dark:bg-slate-800/60"
                    >
                      <span className="w-5 text-xs font-bold text-slate-400">
                        {l.position}
                      </span>
                      <button
                        onClick={() => setEditando(l)}
                        className="min-w-0 flex-1 truncate text-left text-slate-700 hover:underline dark:text-slate-300"
                      >
                        {l.title}
                      </button>
                      <button
                        onClick={() =>
                          void acao(l.id, () => api.delete(`/courses/lessons/${l.id}`))
                        }
                        className="text-slate-400 hover:text-red-600"
                        aria-label="Apagar lição"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() =>
                      setEditando({
                        id: '',
                        position: c.lessons.length + 1,
                        title: '',
                        content: '',
                        bibleRefs: [],
                        question: null,
                      })
                    }
                    className="flex items-center gap-1 text-xs font-medium text-indigo-600 dark:text-indigo-400"
                  >
                    <Plus className="h-3.5 w-3.5" /> Nova lição
                  </button>
                </div>

                {/* Inscritos */}
                {c.enrollments.length > 0 && (
                  <div className="mt-4 space-y-1.5 border-t border-slate-100 pt-3 dark:border-slate-800">
                    {c.enrollments.map((e) => (
                      <div
                        key={e.id}
                        className="flex flex-wrap items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 text-xs dark:bg-slate-800/60"
                      >
                        <span className="min-w-0 flex-1 truncate font-medium text-slate-700 dark:text-slate-300">
                          {e.memberName}
                          {e.partnerName && ` & ${e.partnerName}`}
                        </span>
                        <span className="text-slate-500">
                          {e.done}/{e.total}
                          {c.couple && ` · par ${e.partnerDone}/${e.total}`}
                        </span>
                        {e.completedAt && !e.pastorTalkAt && (
                          <Button
                            variant="outline"
                            onClick={() =>
                              void acao(e.id, () =>
                                api.put(`/courses/enrollments/${e.id}/registro`, {
                                  pastorTalk: true,
                                }),
                              )
                            }
                          >
                            <Check className="mr-1 h-3 w-3" /> Conversou
                          </Button>
                        )}
                        {e.pastorTalkAt && c.kind === 'BAPTISM' && !e.baptizedAt && (
                          <Input
                            type="date"
                            className="h-8 w-36"
                            onChange={(ev) =>
                              ev.target.value &&
                              void acao(e.id, () =>
                                api.put(`/courses/enrollments/${e.id}/registro`, {
                                  baptizedAt: ev.target.value,
                                }),
                              )
                            }
                          />
                        )}
                        {e.baptizedAt && (
                          <span className="rounded-lg bg-emerald-50 px-2 py-1 font-medium text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                            batizado
                          </span>
                        )}
                        <button
                          onClick={() =>
                            api
                              .get(`/courses/enrollments/${e.id}/reflections`)
                              .then((r) => setReflexoes(r.data))
                              .catch((err) => toast.error(extractApiError(err)))
                          }
                          className="text-slate-400 hover:text-indigo-600"
                          aria-label="Ver respostas"
                        >
                          <MessageSquare className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}

          {cursos.length > 0 && modelos.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {modelos.map((m) => (
                <Button
                  key={m.id}
                  variant="outline"
                  onClick={() => void acao(m.id, () => api.post(`/courses/templates/${m.id}`))}
                  disabled={!!ocupado}
                >
                  <Plus className="mr-1 h-4 w-4" /> {m.title}
                </Button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Editor de lição */}
      {editando && (
        <EditorLicao
          licao={editando}
          cursoId={cursos?.find((c) => c.lessons.some((l) => l.id === editando.id))?.id ??
            cursos?.[cursos.length - 1]?.id ?? ''}
          onFechar={(mudou) => {
            setEditando(null);
            if (mudou) carrega();
          }}
        />
      )}

      {/* Respostas do aluno */}
      {reflexoes && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 p-4">
          <div className="mx-auto max-w-lg rounded-2xl bg-white p-5 dark:bg-slate-900">
            <h3 className="font-bold text-slate-900 dark:text-slate-100">
              Respostas do curso
            </h3>
            <p className="mt-0.5 text-xs text-slate-500">
              Material de aconselhamento — só a liderança vê.
            </p>
            <div className="mt-3 space-y-3">
              {reflexoes.filter((r) => r.answers.length).map((r) => (
                <div key={r.position}>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                    {r.position}. {r.question ?? r.title}
                  </p>
                  {r.answers.map((a, i) => (
                    <p key={i} className="mt-1 rounded-xl bg-slate-50 px-3 py-2 text-sm dark:bg-slate-800">
                      <strong>{a.name}:</strong> {a.text}
                    </p>
                  ))}
                </div>
              ))}
              {reflexoes.every((r) => !r.answers.length) && (
                <p className="py-6 text-center text-sm text-slate-400">
                  Ninguém escreveu nada ainda.
                </p>
              )}
            </div>
            <Button className="mt-4 w-full" onClick={() => setReflexoes(null)}>
              Fechar
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function EditorLicao({
  licao,
  cursoId,
  onFechar,
}: {
  licao: Licao;
  cursoId: string;
  onFechar: (mudou: boolean) => void;
}): React.ReactElement {
  const [form, setForm] = useState({
    title: licao.title,
    content: licao.content,
    refs: licao.bibleRefs.join(', '),
    question: licao.question ?? '',
  });
  const [salvando, setSalvando] = useState(false);

  async function salva(): Promise<void> {
    setSalvando(true);
    try {
      await api.put(`/courses/${cursoId}/lessons`, {
        id: licao.id || undefined,
        title: form.title,
        content: form.content,
        bibleRefs: form.refs.split(',').map((r) => r.trim()).filter(Boolean),
        question: form.question,
      });
      onFechar(true);
    } catch (e) {
      toast.error(extractApiError(e));
      setSalvando(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 p-4">
      <div className="mx-auto max-w-2xl rounded-2xl bg-white p-5 dark:bg-slate-900">
        <h3 className="font-bold text-slate-900 dark:text-slate-100">
          {licao.id ? 'Editar lição' : 'Nova lição'}
        </h3>
        <div className="mt-3 space-y-3">
          <div>
            <Label>Título</Label>
            <Input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </div>
          <div>
            <Label>Texto</Label>
            <textarea
              rows={12}
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              className="w-full rounded-xl border border-slate-200 p-3 text-sm dark:border-slate-700 dark:bg-slate-800"
            />
            <p className="mt-1 text-xs text-slate-400">
              Deixe uma linha em branco entre os parágrafos.
            </p>
          </div>
          <div>
            <Label>Passagens (separadas por vírgula)</Label>
            <Input
              value={form.refs}
              onChange={(e) => setForm({ ...form, refs: e.target.value })}
              placeholder="Atos 2:38, Romanos 6:4"
            />
          </div>
          <div>
            <Label>Pergunta de reflexão (opcional)</Label>
            <Input
              value={form.question}
              onChange={(e) => setForm({ ...form, question: e.target.value })}
            />
          </div>
        </div>
        <div className="mt-4 flex gap-2">
          <Button onClick={() => void salva()} disabled={salvando} className="flex-1">
            {salvando ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Salvar'}
          </Button>
          <Button variant="outline" onClick={() => onFechar(false)}>
            Cancelar
          </Button>
        </div>
      </div>
    </div>
  );
}
