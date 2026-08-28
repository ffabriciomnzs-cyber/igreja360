'use client';

// Escola Bíblica: turmas e caderneta.
// A chamada é feita em pé, no celular, minutos antes da aula — por isso é um
// toque por aluno, sem formulário e sem botão de salvar.

import { useCallback, useEffect, useState } from 'react';
import {
  GraduationCap,
  Plus,
  Loader2,
  Trash2,
  Check,
  X,
  Search,
  ClipboardList,
} from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ListSkeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { api, extractApiError } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { toast } from 'sonner';

interface Aluno {
  memberId: string;
  name: string;
  photo: string | null;
}

interface Turma {
  id: string;
  name: string;
  room: string | null;
  teacherName: string | null;
  enrolled: number;
  students: Aluno[];
  lastLessons: { day: string; topic: string | null; present: number }[];
  averageAttendance: number;
}

interface Folha {
  lessonId: string;
  classId: string;
  className: string;
  day: string;
  topic: string | null;
  present: number;
  enrolled: number;
  roll: { memberId: string; name: string; photo: string | null; present: boolean }[];
}

interface MembroBusca {
  id: string;
  name: string;
}

export default function SchoolPage(): React.ReactElement {
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [loading, setLoading] = useState(true);

  const [nova, setNova] = useState({ name: '', teacherName: '', room: '' });
  const [criando, setCriando] = useState(false);

  const [busca, setBusca] = useState<Record<string, string>>({});
  const [achados, setAchados] = useState<Record<string, MembroBusca[]>>({});

  const [folha, setFolha] = useState<Folha | null>(null);
  const [dia, setDia] = useState('');
  const [agindo, setAgindo] = useState<string | null>(null);
  const [assunto, setAssunto] = useState('');

  const carrega = useCallback(() => {
    setLoading(true);
    api
      .get<Turma[]>('/school/classes')
      .then(({ data }) => setTurmas(data))
      .catch((err) => toast.error(extractApiError(err)))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    carrega();
  }, [carrega]);

  async function criaTurma(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    if (nova.name.trim().length < 2) return;
    setCriando(true);
    try {
      const { data } = await api.post<Turma[]>('/school/classes', {
        name: nova.name.trim(),
        teacherName: nova.teacherName.trim() || undefined,
        room: nova.room.trim() || undefined,
      });
      setTurmas(data);
      setNova({ name: '', teacherName: '', room: '' });
      toast.success('Turma criada.');
    } catch (err) {
      toast.error(extractApiError(err));
    } finally {
      setCriando(false);
    }
  }

  async function buscaAluno(classId: string, termo: string): Promise<void> {
    setBusca((b) => ({ ...b, [classId]: termo }));
    if (termo.trim().length < 2) {
      setAchados((a) => ({ ...a, [classId]: [] }));
      return;
    }
    try {
      const { data } = await api.get<{ data?: MembroBusca[] } | MembroBusca[]>(
        `/members?search=${encodeURIComponent(termo.trim())}&limit=6`,
      );
      const lista = Array.isArray(data) ? data : (data.data ?? []);
      setAchados((a) => ({ ...a, [classId]: lista.slice(0, 6) }));
    } catch {
      /* ignora */
    }
  }

  async function matricula(classId: string, memberId: string): Promise<void> {
    try {
      const { data } = await api.post<Turma[]>(`/school/classes/${classId}/enroll`, {
        memberId,
      });
      setTurmas(data);
      setBusca((b) => ({ ...b, [classId]: '' }));
      setAchados((a) => ({ ...a, [classId]: [] }));
    } catch (err) {
      toast.error(extractApiError(err));
    }
  }

  async function desmatricula(classId: string, memberId: string): Promise<void> {
    try {
      const { data } = await api.delete<Turma[]>(
        `/school/classes/${classId}/enroll/${memberId}`,
      );
      setTurmas(data);
    } catch (err) {
      toast.error(extractApiError(err));
    }
  }

  async function apagaTurma(t: Turma): Promise<void> {
    if (
      !window.confirm(
        `Excluir a turma "${t.name}"? As aulas e a chamada dela também serão apagadas.`,
      )
    ) {
      return;
    }
    try {
      const { data } = await api.delete<Turma[]>(`/school/classes/${t.id}`);
      setTurmas(data);
      if (folha?.classId === t.id) setFolha(null);
      toast.success('Turma excluída.');
    } catch (err) {
      toast.error(extractApiError(err));
    }
  }

  async function abreCaderneta(classId: string, day?: string): Promise<void> {
    try {
      const { data } = await api.get<Folha>(
        `/school/classes/${classId}/lesson${day ? `?day=${day}` : ''}`,
      );
      setFolha(data);
      setAssunto(data.topic ?? '');
      setDia(data.day);
    } catch (err) {
      toast.error(extractApiError(err));
    }
  }

  async function alterna(memberId: string): Promise<void> {
    if (!folha) return;
    setAgindo(memberId);
    try {
      const { data } = await api.post<Folha>(
        `/school/lessons/${folha.lessonId}/attendance/${memberId}`,
      );
      setFolha(data);
      carrega();
    } catch (err) {
      toast.error(extractApiError(err));
    } finally {
      setAgindo(null);
    }
  }

  async function salvaAssunto(): Promise<void> {
    if (!folha) return;
    try {
      const { data } = await api.patch<Folha>(`/school/lessons/${folha.lessonId}`, {
        topic: assunto.trim() || undefined,
      });
      setFolha(data);
      carrega();
      toast.success('Assunto da aula salvo.');
    } catch (err) {
      toast.error(extractApiError(err));
    }
  }

  return (
    <div>
      <PageHeader
        title="Escola Bíblica"
        description="Turmas, matrículas e a caderneta de chamada."
      />

      {loading ? (
        <ListSkeleton />
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {/* ---- Turmas ---- */}
          <div className="space-y-4">
            <Card>
              <CardContent className="p-5">
                <form onSubmit={criaTurma} className="space-y-3">
                  <div>
                    <Label htmlFor="t-nome">Nova turma</Label>
                    <Input
                      id="t-nome"
                      value={nova.name}
                      onChange={(e) => setNova((n) => ({ ...n, name: e.target.value }))}
                      placeholder="Jovens, Adultos I, Crianças…"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="t-prof">Professor</Label>
                      <Input
                        id="t-prof"
                        value={nova.teacherName}
                        onChange={(e) =>
                          setNova((n) => ({ ...n, teacherName: e.target.value }))
                        }
                        placeholder="Nome"
                      />
                    </div>
                    <div>
                      <Label htmlFor="t-sala">Sala</Label>
                      <Input
                        id="t-sala"
                        value={nova.room}
                        onChange={(e) => setNova((n) => ({ ...n, room: e.target.value }))}
                        placeholder="Sala 2"
                      />
                    </div>
                  </div>
                  <Button type="submit" disabled={criando} className="w-full">
                    {criando ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Plus className="h-4 w-4" />
                    )}
                    Criar turma
                  </Button>
                </form>
              </CardContent>
            </Card>

            {turmas.length === 0 ? (
              <EmptyState
                icon={GraduationCap}
                title="Nenhuma turma ainda"
                description="Crie as turmas da EBD para matricular os alunos e fazer a chamada."
              />
            ) : (
              turmas.map((t) => (
                <Card key={t.id}>
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-900 dark:text-slate-100">
                          {t.name}
                        </p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          {t.teacherName ? `Prof. ${t.teacherName}` : 'Sem professor'}
                          {t.room ? ` · ${t.room}` : ''} · {t.enrolled}{' '}
                          {t.enrolled === 1 ? 'aluno' : 'alunos'}
                        </p>
                        {t.averageAttendance > 0 && (
                          <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">
                            Média de presença: {t.averageAttendance}
                          </p>
                        )}
                      </div>
                      <div className="flex shrink-0 gap-1">
                        <Button size="sm" onClick={() => abreCaderneta(t.id)}>
                          <ClipboardList className="h-4 w-4" />
                          Chamada
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => apagaTurma(t)}
                          className="text-red-600 dark:text-red-400"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {t.students.map((a) => (
                        <span
                          key={a.memberId}
                          className="flex items-center gap-1.5 rounded-full border border-border px-2.5 py-1 text-sm text-slate-700 dark:text-slate-300"
                        >
                          {a.name}
                          <button
                            onClick={() => desmatricula(t.id, a.memberId)}
                            className="text-slate-300 hover:text-red-500 dark:text-slate-600"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </span>
                      ))}
                    </div>

                    <div className="relative mt-3">
                      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <Input
                        value={busca[t.id] ?? ''}
                        onChange={(e) => buscaAluno(t.id, e.target.value)}
                        placeholder="Matricular aluno"
                        className="pl-9"
                      />
                      {(achados[t.id]?.length ?? 0) > 0 && (
                        <div className="absolute z-10 mt-1 w-full overflow-hidden rounded-xl border border-border bg-white shadow-lg dark:bg-slate-900">
                          {achados[t.id].map((m) => (
                            <button
                              key={m.id}
                              onClick={() => matricula(t.id, m.id)}
                              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-slate-50 dark:hover:bg-slate-800/60"
                            >
                              <Plus className="h-3.5 w-3.5 text-indigo-500" />
                              {m.name}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {/* ---- Caderneta ---- */}
          <div>
            {!folha ? (
              <EmptyState
                icon={ClipboardList}
                title="Caderneta"
                description="Escolha uma turma e toque em Chamada para marcar quem veio na aula de hoje."
              />
            ) : (
              <Card>
                <CardContent className="p-5">
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-slate-100">
                        {folha.className}
                      </p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        Aula de {formatDate(folha.day)} · {folha.present} de{' '}
                        {folha.enrolled} presentes
                      </p>
                    </div>
                    <Input
                      type="date"
                      value={dia}
                      onChange={(e) => {
                        setDia(e.target.value);
                        abreCaderneta(folha.classId, e.target.value);
                      }}
                      className="w-40"
                    />
                  </div>

                  <div className="mb-3 flex gap-2">
                    <Input
                      value={assunto}
                      onChange={(e) => setAssunto(e.target.value)}
                      placeholder="Assunto da aula"
                    />
                    <Button variant="outline" onClick={salvaAssunto}>
                      Salvar
                    </Button>
                  </div>

                  {folha.roll.length === 0 ? (
                    <p className="py-6 text-center text-sm text-slate-400 dark:text-slate-500">
                      Nenhum aluno matriculado nesta turma.
                    </p>
                  ) : (
                    <div className="space-y-1.5">
                      {folha.roll.map((a) => (
                        <button
                          key={a.memberId}
                          onClick={() => alterna(a.memberId)}
                          disabled={agindo === a.memberId}
                          className={`flex w-full items-center justify-between gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors ${
                            a.present
                              ? 'border-emerald-300 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/40'
                              : 'border-border hover:bg-slate-50 dark:hover:bg-slate-800/60'
                          }`}
                        >
                          <span
                            className={
                              a.present
                                ? 'font-medium text-emerald-900 dark:text-emerald-200'
                                : 'text-slate-700 dark:text-slate-300'
                            }
                          >
                            {a.name}
                          </span>
                          {agindo === a.memberId ? (
                            <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                          ) : a.present ? (
                            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-white">
                              <Check className="h-4 w-4" />
                            </span>
                          ) : (
                            <span className="h-6 w-6 rounded-full border-2 border-slate-200 dark:border-slate-700" />
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
