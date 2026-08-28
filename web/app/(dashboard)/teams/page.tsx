'use client';

// Equipes e escala. Duas perguntas que a tela responde:
// "quem serve em cada equipe?" e "quem ainda não confirmou o próximo culto?".

import { useCallback, useEffect, useState } from 'react';
import {
  Users,
  Plus,
  Loader2,
  Trash2,
  Check,
  X,
  Clock,
  CalendarPlus,
  Search,
} from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ListSkeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { api, extractApiError } from '@/lib/api';
import { formatDateTime } from '@/lib/utils';
import { toast } from 'sonner';

interface TeamMember {
  memberId: string;
  name: string;
  photo: string | null;
  role: string | null;
}

interface Team {
  id: string;
  name: string;
  active: boolean;
  members: TeamMember[];
}

type Status = 'PENDING' | 'CONFIRMED' | 'DECLINED';

interface Slot {
  id: string;
  date: string;
  teamId: string;
  teamName: string;
  memberId: string;
  name: string;
  role: string | null;
  status: Status;
}

interface MembroBusca {
  id: string;
  name: string;
}

const ROTULO: Record<Status, string> = {
  PENDING: 'Aguardando',
  CONFIRMED: 'Confirmou',
  DECLINED: 'Não pode',
};
const COR: Record<Status, 'warning' | 'success' | 'danger'> = {
  PENDING: 'warning',
  CONFIRMED: 'success',
  DECLINED: 'danger',
};

export default function TeamsPage(): React.ReactElement {
  const [teams, setTeams] = useState<Team[]>([]);
  const [escala, setEscala] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(true);

  const [novaEquipe, setNovaEquipe] = useState('');
  const [criando, setCriando] = useState(false);

  const [buscaPorEquipe, setBuscaPorEquipe] = useState<Record<string, string>>({});
  const [achados, setAchados] = useState<Record<string, MembroBusca[]>>({});
  const [agindo, setAgindo] = useState<string | null>(null);

  // Formulário de escalação
  const [form, setForm] = useState({ teamId: '', memberId: '', date: '', role: '' });

  const carrega = useCallback(() => {
    setLoading(true);
    Promise.all([api.get<Team[]>('/teams'), api.get<Slot[]>('/schedule')])
      .then(([t, e]) => {
        setTeams(t.data);
        setEscala(e.data);
      })
      .catch((err) => toast.error(extractApiError(err)))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    carrega();
  }, [carrega]);

  async function criaEquipe(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    if (novaEquipe.trim().length < 2) return;
    setCriando(true);
    try {
      const { data } = await api.post<Team[]>('/teams', { name: novaEquipe.trim() });
      setTeams(data);
      setNovaEquipe('');
      toast.success('Equipe criada.');
    } catch (err) {
      toast.error(extractApiError(err));
    } finally {
      setCriando(false);
    }
  }

  async function buscaMembro(teamId: string, termo: string): Promise<void> {
    setBuscaPorEquipe((b) => ({ ...b, [teamId]: termo }));
    if (termo.trim().length < 2) {
      setAchados((a) => ({ ...a, [teamId]: [] }));
      return;
    }
    try {
      const { data } = await api.get<{ data?: MembroBusca[] } | MembroBusca[]>(
        `/members?search=${encodeURIComponent(termo.trim())}&limit=6`,
      );
      const lista = Array.isArray(data) ? data : (data.data ?? []);
      setAchados((a) => ({ ...a, [teamId]: lista.slice(0, 6) }));
    } catch {
      /* ignora */
    }
  }

  async function adiciona(teamId: string, memberId: string): Promise<void> {
    setAgindo(memberId);
    try {
      const { data } = await api.post<Team[]>(`/teams/${teamId}/members`, {
        memberId,
      });
      setTeams(data);
      setBuscaPorEquipe((b) => ({ ...b, [teamId]: '' }));
      setAchados((a) => ({ ...a, [teamId]: [] }));
    } catch (err) {
      toast.error(extractApiError(err));
    } finally {
      setAgindo(null);
    }
  }

  async function removeDaEquipe(teamId: string, memberId: string): Promise<void> {
    try {
      const { data } = await api.delete<Team[]>(`/teams/${teamId}/members/${memberId}`);
      setTeams(data);
    } catch (err) {
      toast.error(extractApiError(err));
    }
  }

  async function apagaEquipe(t: Team): Promise<void> {
    if (
      !window.confirm(
        `Excluir a equipe "${t.name}"? As escalas dela também serão apagadas.`,
      )
    ) {
      return;
    }
    try {
      const { data } = await api.delete<Team[]>(`/teams/${t.id}`);
      setTeams(data);
      carrega();
      toast.success('Equipe excluída.');
    } catch (err) {
      toast.error(extractApiError(err));
    }
  }

  async function criaEscala(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    if (!form.teamId || !form.memberId || !form.date) return;
    setAgindo('escalando');
    try {
      const { data } = await api.post<Slot[]>('/schedule', {
        teamId: form.teamId,
        memberId: form.memberId,
        date: new Date(form.date).toISOString(),
        role: form.role.trim() || undefined,
      });
      setEscala(data);
      setForm((f) => ({ ...f, memberId: '', role: '' }));
      toast.success('Escalado! A pessoa recebeu um aviso no celular.');
    } catch (err) {
      toast.error(extractApiError(err));
    } finally {
      setAgindo(null);
    }
  }

  async function removeSlot(id: string): Promise<void> {
    try {
      const { data } = await api.delete<Slot[]>(`/schedule/${id}`);
      setEscala(data);
    } catch (err) {
      toast.error(extractApiError(err));
    }
  }

  const equipeSelecionada = teams.find((t) => t.id === form.teamId);
  const pendentes = escala.filter((s) => s.status === 'PENDING').length;

  // Agrupa a escala por dia, que é como a liderança pensa.
  const porDia = escala.reduce<Record<string, Slot[]>>((acc, s) => {
    const dia = s.date.slice(0, 10);
    (acc[dia] ??= []).push(s);
    return acc;
  }, {});

  return (
    <div>
      <PageHeader
        title="Equipes e escala"
        description="Quem serve em cada ministério e a escala dos próximos cultos."
      />

      {pendentes > 0 && (
        <div className="mb-4 flex items-center gap-2 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
          <Clock className="h-4 w-4 shrink-0" />
          {pendentes} {pendentes === 1 ? 'pessoa ainda não confirmou' : 'pessoas ainda não confirmaram'} a escala.
        </div>
      )}

      {loading ? (
        <ListSkeleton />
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {/* ---- Equipes ---- */}
          <div className="space-y-4">
            <Card>
              <CardContent className="p-5">
                <form onSubmit={criaEquipe} className="flex gap-2">
                  <Input
                    value={novaEquipe}
                    onChange={(e) => setNovaEquipe(e.target.value)}
                    placeholder="Nova equipe (Louvor, Recepção, Som…)"
                  />
                  <Button type="submit" disabled={criando}>
                    {criando ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Plus className="h-4 w-4" />
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {teams.length === 0 ? (
              <EmptyState
                icon={Users}
                title="Nenhuma equipe ainda"
                description="Crie as equipes que servem na igreja para montar a escala."
              />
            ) : (
              teams.map((t) => (
                <Card key={t.id}>
                  <CardContent className="p-5">
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <p className="font-semibold text-slate-900 dark:text-slate-100">
                        {t.name}
                        <span className="ml-2 text-sm font-normal text-slate-400">
                          {t.members.length}
                        </span>
                      </p>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => apagaEquipe(t)}
                        className="text-red-600 dark:text-red-400"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="mb-3 flex flex-wrap gap-1.5">
                      {t.members.map((m) => (
                        <span
                          key={m.memberId}
                          className="flex items-center gap-1.5 rounded-full border border-border px-2.5 py-1 text-sm"
                        >
                          <span className="text-slate-700 dark:text-slate-300">{m.name}</span>
                          {m.role && (
                            <span className="text-xs text-slate-400">{m.role}</span>
                          )}
                          <button
                            onClick={() => removeDaEquipe(t.id, m.memberId)}
                            className="text-slate-300 hover:text-red-500 dark:text-slate-600"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </span>
                      ))}
                      {t.members.length === 0 && (
                        <span className="text-sm text-slate-400">
                          Ninguém nesta equipe ainda.
                        </span>
                      )}
                    </div>

                    <div className="relative">
                      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <Input
                        value={buscaPorEquipe[t.id] ?? ''}
                        onChange={(e) => buscaMembro(t.id, e.target.value)}
                        placeholder="Adicionar alguém"
                        className="pl-9"
                      />
                      {(achados[t.id]?.length ?? 0) > 0 && (
                        <div className="absolute z-10 mt-1 w-full overflow-hidden rounded-xl border border-border bg-white shadow-lg dark:bg-slate-900">
                          {achados[t.id].map((m) => (
                            <button
                              key={m.id}
                              onClick={() => adiciona(t.id, m.id)}
                              disabled={agindo === m.id}
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

          {/* ---- Escala ---- */}
          <div className="space-y-4">
            <Card>
              <CardContent className="p-5">
                <p className="mb-3 flex items-center gap-2 font-semibold text-slate-900 dark:text-slate-100">
                  <CalendarPlus className="h-4 w-4 text-indigo-500" />
                  Escalar alguém
                </p>
                <form onSubmit={criaEscala} className="space-y-3">
                  <div>
                    <Label htmlFor="e-equipe">Equipe</Label>
                    <Select
                      id="e-equipe"
                      value={form.teamId}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, teamId: e.target.value, memberId: '' }))
                      }
                    >
                      <option value="">Escolha…</option>
                      {teams.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="e-membro">Quem serve</Label>
                    <Select
                      id="e-membro"
                      value={form.memberId}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, memberId: e.target.value }))
                      }
                      disabled={!equipeSelecionada}
                    >
                      <option value="">
                        {equipeSelecionada
                          ? 'Escolha…'
                          : 'Selecione a equipe primeiro'}
                      </option>
                      {equipeSelecionada?.members.map((m) => (
                        <option key={m.memberId} value={m.memberId}>
                          {m.name}
                        </option>
                      ))}
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="e-data">Dia e hora</Label>
                    <Input
                      id="e-data"
                      type="datetime-local"
                      value={form.date}
                      onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="e-funcao">Função (opcional)</Label>
                    <Input
                      id="e-funcao"
                      value={form.role}
                      onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
                      placeholder="Vocal, bateria, portaria…"
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={
                      agindo === 'escalando' ||
                      !form.teamId ||
                      !form.memberId ||
                      !form.date
                    }
                    className="w-full"
                  >
                    {agindo === 'escalando' && (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    )}
                    Escalar e avisar
                  </Button>
                </form>
              </CardContent>
            </Card>

            {Object.keys(porDia).length === 0 ? (
              <EmptyState
                icon={Clock}
                title="Escala vazia"
                description="Escale as pessoas dos próximos cultos — cada uma recebe um aviso no celular."
              />
            ) : (
              Object.entries(porDia).map(([dia, slots]) => (
                <Card key={dia}>
                  <CardContent className="p-5">
                    <p className="mb-3 text-sm font-semibold capitalize text-slate-800 dark:text-slate-200">
                      {formatDateTime(slots[0].date)}
                    </p>
                    <div className="space-y-2">
                      {slots.map((s) => (
                        <div
                          key={s.id}
                          className="flex items-center justify-between gap-2 rounded-xl border border-border px-3 py-2"
                        >
                          <div className="min-w-0">
                            <p className="truncate text-sm text-slate-800 dark:text-slate-200">
                              {s.name}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              {s.teamName}
                              {s.role ? ` · ${s.role}` : ''}
                            </p>
                          </div>
                          <div className="flex shrink-0 items-center gap-2">
                            <Badge variant={COR[s.status]}>
                              {s.status === 'CONFIRMED' && (
                                <Check className="mr-1 inline h-3 w-3" />
                              )}
                              {ROTULO[s.status]}
                            </Badge>
                            <button
                              onClick={() => removeSlot(s.id)}
                              className="text-slate-300 hover:text-red-500 dark:text-slate-600"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
