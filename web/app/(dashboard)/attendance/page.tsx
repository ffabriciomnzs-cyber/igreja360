'use client';

// Frequência: quem esteve no culto e — o que mais importa para o pastor —
// quem sumiu. A lista de sumidos é uma fila de cuidado, não um relatório.

import { useCallback, useEffect, useState } from 'react';
import {
  UserCheck,
  Users,
  Loader2,
  Phone,
  Plus,
  X,
  Search,
} from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ListSkeleton } from '@/components/ui/skeleton';
import { api, extractApiError } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { toast } from 'sonner';

interface Presente {
  memberId: string;
  name: string;
  photo: string | null;
  manual: boolean;
}

interface DoDia {
  day: string;
  total: number;
  members: Presente[];
}

interface Sumido {
  id: string;
  name: string;
  phone: string | null;
  photo: string | null;
}

interface Stats {
  hoje: number;
  ultimosCultos: { day: string; total: number }[];
  membrosAtivos: number;
  sumidos: Sumido[];
  totalSumidos: number;
}

interface MembroBusca {
  id: string;
  name: string;
}

export default function AttendancePage(): React.ReactElement {
  const [dia, setDia] = useState<DoDia | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState('');

  const [busca, setBusca] = useState('');
  const [achados, setAchados] = useState<MembroBusca[]>([]);
  const [agindo, setAgindo] = useState<string | null>(null);

  const carrega = useCallback(() => {
    setLoading(true);
    Promise.all([
      api.get<DoDia>(`/attendance${data ? `?day=${data}` : ''}`),
      api.get<Stats>('/attendance/stats'),
    ])
      .then(([d, s]) => {
        setDia(d.data);
        setStats(s.data);
      })
      .catch((err) => toast.error(extractApiError(err)))
      .finally(() => setLoading(false));
  }, [data]);

  useEffect(() => {
    carrega();
  }, [carrega]);

  // Busca de membro para marcar presença de quem não usa o aplicativo.
  useEffect(() => {
    if (busca.trim().length < 2) {
      setAchados([]);
      return;
    }
    const t = setTimeout(() => {
      api
        .get<{ data?: MembroBusca[] } | MembroBusca[]>(
          `/members?search=${encodeURIComponent(busca.trim())}&limit=8`,
        )
        .then(({ data: r }) => {
          const lista = Array.isArray(r) ? r : (r.data ?? []);
          setAchados(lista.slice(0, 8));
        })
        .catch(() => undefined);
    }, 300);
    return () => clearTimeout(t);
  }, [busca]);

  async function marca(memberId: string): Promise<void> {
    setAgindo(memberId);
    try {
      const { data: novo } = await api.post<DoDia>(`/attendance/${memberId}`, {
        day: data || undefined,
      });
      setDia(novo);
      setBusca('');
      setAchados([]);
      carrega();
    } catch (err) {
      toast.error(extractApiError(err));
    } finally {
      setAgindo(null);
    }
  }

  async function desmarca(memberId: string): Promise<void> {
    setAgindo(memberId);
    try {
      const { data: novo } = await api.delete<DoDia>(
        `/attendance/${memberId}${data ? `?day=${data}` : ''}`,
      );
      setDia(novo);
      carrega();
    } catch (err) {
      toast.error(extractApiError(err));
    } finally {
      setAgindo(null);
    }
  }

  function whatsapp(m: Sumido): void {
    if (!m.phone) return;
    let d = m.phone.replace(/\D/g, '');
    if (d.length <= 11) d = `55${d}`;
    const texto = encodeURIComponent(
      `Olá, ${m.name.split(' ')[0]}! Sentimos sua falta na igreja. Como você está?`,
    );
    window.open(`https://wa.me/${d}?text=${texto}`, '_blank', 'noopener');
  }

  const cards = [
    { rotulo: 'Presenças hoje', valor: stats?.hoje ?? 0, cor: 'text-indigo-600 dark:text-indigo-400' },
    { rotulo: 'Membros ativos', valor: stats?.membrosAtivos ?? 0, cor: 'text-slate-900 dark:text-slate-100' },
    { rotulo: 'Sem vir há 3 semanas', valor: stats?.totalSumidos ?? 0, cor: 'text-amber-600 dark:text-amber-400' },
  ];

  return (
    <div>
      <PageHeader
        title="Frequência"
        description="Quem esteve nos cultos e quem está precisando de um contato."
      />

      <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {cards.map((c) => (
          <Card key={c.rotulo}>
            <CardContent className="p-5">
              <p className="text-sm text-slate-500 dark:text-slate-400">{c.rotulo}</p>
              <p className={`mt-1 text-2xl font-bold ${c.cor}`}>{c.valor}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {stats && stats.ultimosCultos.length > 0 && (
        <Card className="mb-4">
          <CardContent className="p-5">
            <p className="mb-3 text-sm font-semibold text-slate-800 dark:text-slate-200">
              Últimos cultos
            </p>
            <div className="flex flex-wrap gap-2">
              {stats.ultimosCultos.map((c) => (
                <button
                  key={c.day}
                  onClick={() => setData(c.day)}
                  className="rounded-lg border border-border px-3 py-2 text-left hover:bg-slate-50 dark:hover:bg-slate-800/60"
                >
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {formatDate(c.day)}
                  </p>
                  <p className="text-lg font-bold text-slate-900 dark:text-slate-100">
                    {c.total}
                  </p>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="mb-4">
        <CardContent className="p-5">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              Presentes em {dia ? formatDate(dia.day) : 'hoje'} ({dia?.total ?? 0})
            </p>
            <div className="flex items-center gap-2">
              <Input
                type="date"
                value={data}
                onChange={(e) => setData(e.target.value)}
                className="w-40"
              />
              {data && (
                <Button variant="ghost" size="sm" onClick={() => setData('')}>
                  Hoje
                </Button>
              )}
            </div>
          </div>

          {/* Marcar quem não usa o aplicativo */}
          <div className="relative mb-3">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Marcar presença de alguém (quem não usa o app)"
              className="pl-9"
            />
            {achados.length > 0 && (
              <div className="absolute z-10 mt-1 w-full overflow-hidden rounded-xl border border-border bg-white shadow-lg dark:bg-slate-900">
                {achados.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => marca(m.id)}
                    disabled={agindo === m.id}
                    className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm hover:bg-slate-50 dark:hover:bg-slate-800/60"
                  >
                    {agindo === m.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Plus className="h-4 w-4 text-indigo-500" />
                    )}
                    {m.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {loading ? (
            <ListSkeleton />
          ) : !dia || dia.total === 0 ? (
            <p className="py-6 text-center text-sm text-slate-400 dark:text-slate-500">
              Ninguém marcou presença ainda.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {dia.members.map((m) => (
                <span
                  key={m.memberId}
                  className="flex items-center gap-2 rounded-full border border-border py-1 pl-1 pr-2 text-sm"
                >
                  <span className="flex h-6 w-6 items-center justify-center overflow-hidden rounded-full bg-indigo-100 text-[10px] font-bold text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
                    {m.photo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={m.photo} alt={m.name} className="h-full w-full object-cover" />
                    ) : (
                      m.name.slice(0, 2).toUpperCase()
                    )}
                  </span>
                  <span className="text-slate-700 dark:text-slate-300">{m.name}</span>
                  {m.manual && <Badge variant="muted">na mão</Badge>}
                  <button
                    onClick={() => desmarca(m.memberId)}
                    title="Desmarcar"
                    className="text-slate-300 hover:text-red-500 dark:text-slate-600"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {stats && stats.sumidos.length > 0 && (
        <Card>
          <CardContent className="p-5">
            <div className="mb-1 flex items-center gap-2">
              <Users className="h-4 w-4 text-amber-500" />
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                Não vêm há mais de 3 semanas
              </p>
            </div>
            <p className="mb-3 text-sm text-slate-500 dark:text-slate-400">
              Um telefonema costuma resolver. Mostrando {stats.sumidos.length} de{' '}
              {stats.totalSumidos}.
            </p>
            <div className="space-y-2">
              {stats.sumidos.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-border px-3 py-2"
                >
                  <span className="min-w-0 truncate text-sm text-slate-700 dark:text-slate-300">
                    {m.name}
                  </span>
                  <div className="flex shrink-0 gap-1.5">
                    {m.phone && (
                      <Button size="sm" variant="outline" onClick={() => whatsapp(m)}>
                        <Phone className="h-4 w-4" />
                        Chamar
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => marca(m.id)}
                      disabled={agindo === m.id}
                      title="Marcar presença hoje"
                    >
                      <UserCheck className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
