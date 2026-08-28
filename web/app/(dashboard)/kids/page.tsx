'use client';

// Ministério infantil: entrega e retirada com código.
//
// A tela é feita para ser usada em pé, na porta da sala, com criança no colo:
// busca, um toque para entregar, código GIGANTE na tela, e retirada digitando
// o código. Alergia e restrição aparecem em vermelho, sem precisar abrir nada.

import { useCallback, useEffect, useState } from 'react';
import {
  Baby,
  Plus,
  Loader2,
  Search,
  LogIn,
  LogOut,
  TriangleAlert,
  Check,
  X,
  Trash2,
} from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ListSkeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { api, extractApiError } from '@/lib/api';
import { toast } from 'sonner';

interface Guardian {
  id?: string;
  name: string;
  phone?: string | null;
  relation?: string | null;
}

interface Crianca {
  id: string;
  name: string;
  notes: string | null;
  restrictions: string | null;
  guardians: Guardian[];
}

interface Registro {
  id: string;
  childId: string;
  childName: string;
  notes: string | null;
  restrictions: string | null;
  code: string;
  room: string | null;
  checkedInBy: string;
  checkedOutBy: string | null;
  guardians: Guardian[];
}

interface Hoje {
  day: string;
  inside: Registro[];
  left: Registro[];
}

export default function KidsPage(): React.ReactElement {
  const [hoje, setHoje] = useState<Hoje | null>(null);
  const [loading, setLoading] = useState(true);

  const [busca, setBusca] = useState('');
  const [achados, setAchados] = useState<Crianca[]>([]);
  const [entregando, setEntregando] = useState<Crianca | null>(null);
  const [quemEntrega, setQuemEntrega] = useState('');
  const [sala, setSala] = useState('');
  const [codigoGerado, setCodigoGerado] = useState<{
    code: string;
    childName: string;
  } | null>(null);

  const [codigoRetirada, setCodigoRetirada] = useState('');
  const [quemRetira, setQuemRetira] = useState('');
  const [agindo, setAgindo] = useState(false);

  const [cadastrando, setCadastrando] = useState(false);
  const [nova, setNova] = useState({
    name: '',
    notes: '',
    restrictions: '',
    guardianName: '',
    guardianPhone: '',
    guardianRelation: '',
  });

  const carrega = useCallback(() => {
    setLoading(true);
    api
      .get<Hoje>('/kids/today')
      .then(({ data }) => setHoje(data))
      .catch((err) => toast.error(extractApiError(err)))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    carrega();
  }, [carrega]);

  useEffect(() => {
    if (busca.trim().length < 2) {
      setAchados([]);
      return;
    }
    const t = setTimeout(() => {
      api
        .get<Crianca[]>(`/kids/children?search=${encodeURIComponent(busca.trim())}`)
        .then(({ data }) => setAchados(data.slice(0, 8)))
        .catch(() => undefined);
    }, 300);
    return () => clearTimeout(t);
  }, [busca]);

  async function entrega(): Promise<void> {
    if (!entregando || quemEntrega.trim().length < 2) return;
    setAgindo(true);
    try {
      const { data } = await api.post<{ code: string; childName: string }>(
        '/kids/checkin',
        {
          childId: entregando.id,
          checkedInBy: quemEntrega.trim(),
          room: sala.trim() || undefined,
        },
      );
      setCodigoGerado(data);
      setEntregando(null);
      setQuemEntrega('');
      setBusca('');
      setAchados([]);
      carrega();
    } catch (err) {
      toast.error(extractApiError(err));
    } finally {
      setAgindo(false);
    }
  }

  async function retira(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    setAgindo(true);
    try {
      const { data } = await api.post<{
        childName: string;
        restrictions: string | null;
      }>('/kids/checkout', {
        code: codigoRetirada.trim(),
        checkedOutBy: quemRetira.trim(),
      });
      setCodigoRetirada('');
      setQuemRetira('');
      carrega();
      toast.success(`${data.childName} entregue para ${quemRetira.trim()}.`);
    } catch (err) {
      toast.error(extractApiError(err));
    } finally {
      setAgindo(false);
    }
  }

  async function cadastra(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    setAgindo(true);
    try {
      await api.post('/kids/children', {
        name: nova.name.trim(),
        notes: nova.notes.trim() || undefined,
        restrictions: nova.restrictions.trim() || undefined,
        guardians: [
          {
            name: nova.guardianName.trim(),
            phone: nova.guardianPhone.trim() || undefined,
            relation: nova.guardianRelation.trim() || undefined,
          },
        ],
      });
      setNova({
        name: '',
        notes: '',
        restrictions: '',
        guardianName: '',
        guardianPhone: '',
        guardianRelation: '',
      });
      setCadastrando(false);
      toast.success('Criança cadastrada.');
    } catch (err) {
      toast.error(extractApiError(err));
    } finally {
      setAgindo(false);
    }
  }

  async function desativa(r: Registro): Promise<void> {
    if (!window.confirm(`Remover ${r.childName} da lista do Kids?`)) return;
    try {
      await api.delete(`/kids/children/${r.childId}`);
      carrega();
    } catch (err) {
      toast.error(extractApiError(err));
    }
  }

  return (
    <div>
      <PageHeader
        title="Kids"
        description="Entrega e retirada das crianças com código de segurança."
        action={
          <Button onClick={() => setCadastrando((v) => !v)}>
            <Plus className="h-4 w-4" />
            Cadastrar criança
          </Button>
        }
      />

      {/* Código recém-gerado: a informação mais importante da tela */}
      {codigoGerado && (
        <Card className="mb-4 border-2 border-indigo-500">
          <CardContent className="p-6 text-center">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Código de retirada de{' '}
              <strong className="text-slate-800 dark:text-slate-200">
                {codigoGerado.childName}
              </strong>
            </p>
            <p className="my-2 font-mono text-6xl font-bold tracking-[0.3em] text-indigo-600 dark:text-indigo-400">
              {codigoGerado.code}
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Anote e entregue a quem trouxe a criança. Só com este código ela
              será liberada.
            </p>
            <Button
              variant="outline"
              className="mt-3"
              onClick={() => setCodigoGerado(null)}
            >
              Entendi
            </Button>
          </CardContent>
        </Card>
      )}

      {cadastrando && (
        <Card className="mb-4">
          <CardContent className="p-5">
            <form onSubmit={cadastra} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label htmlFor="k-nome">Nome da criança *</Label>
                <Input
                  id="k-nome"
                  required
                  value={nova.name}
                  onChange={(e) => setNova((n) => ({ ...n, name: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="k-resp">Responsável *</Label>
                <Input
                  id="k-resp"
                  required
                  value={nova.guardianName}
                  onChange={(e) =>
                    setNova((n) => ({ ...n, guardianName: e.target.value }))
                  }
                  placeholder="Nome de quem entrega e busca"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="k-rel">Parentesco</Label>
                  <Input
                    id="k-rel"
                    value={nova.guardianRelation}
                    onChange={(e) =>
                      setNova((n) => ({ ...n, guardianRelation: e.target.value }))
                    }
                    placeholder="mãe, pai, avó"
                  />
                </div>
                <div>
                  <Label htmlFor="k-tel">Telefone</Label>
                  <Input
                    id="k-tel"
                    value={nova.guardianPhone}
                    onChange={(e) =>
                      setNova((n) => ({ ...n, guardianPhone: e.target.value }))
                    }
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="k-obs">Alergias e cuidados</Label>
                <Input
                  id="k-obs"
                  value={nova.notes}
                  onChange={(e) => setNova((n) => ({ ...n, notes: e.target.value }))}
                  placeholder="Alergia a amendoim…"
                />
              </div>
              <div>
                <Label htmlFor="k-restr">Restrição de retirada</Label>
                <Input
                  id="k-restr"
                  value={nova.restrictions}
                  onChange={(e) =>
                    setNova((n) => ({ ...n, restrictions: e.target.value }))
                  }
                  placeholder="Quem NÃO pode buscar"
                />
              </div>
              <div className="flex gap-2 sm:col-span-2">
                <Button type="submit" disabled={agindo}>
                  {agindo && <Loader2 className="h-4 w-4 animate-spin" />}
                  Cadastrar
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCadastrando(false)}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* ---- Entrega ---- */}
        <Card>
          <CardContent className="p-5">
            <p className="mb-3 flex items-center gap-2 font-semibold text-slate-900 dark:text-slate-100">
              <LogIn className="h-4 w-4 text-indigo-500" />
              Entregar criança
            </p>

            {entregando ? (
              <div className="space-y-3">
                <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/60">
                  <p className="font-semibold text-slate-900 dark:text-slate-100">
                    {entregando.name}
                  </p>
                  {entregando.notes && (
                    <p className="mt-1 text-sm text-amber-700 dark:text-amber-400">
                      {entregando.notes}
                    </p>
                  )}
                  {entregando.restrictions && (
                    <p className="mt-1 flex items-start gap-1.5 text-sm font-semibold text-red-600 dark:text-red-400">
                      <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
                      {entregando.restrictions}
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="k-quem">Quem está entregando *</Label>
                  <Input
                    id="k-quem"
                    value={quemEntrega}
                    onChange={(e) => setQuemEntrega(e.target.value)}
                    placeholder="Nome de quem trouxe"
                    list="responsaveis"
                  />
                  <datalist id="responsaveis">
                    {entregando.guardians.map((g) => (
                      <option key={g.name} value={g.name} />
                    ))}
                  </datalist>
                  {entregando.guardians.length > 0 && (
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {entregando.guardians.map((g) => (
                        <button
                          key={g.name}
                          type="button"
                          onClick={() => setQuemEntrega(g.name)}
                          className="rounded-full border border-border px-2.5 py-1 text-xs text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800/60"
                        >
                          {g.name}
                          {g.relation ? ` (${g.relation})` : ''}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div>
                  <Label htmlFor="k-sala">Sala</Label>
                  <Input
                    id="k-sala"
                    value={sala}
                    onChange={(e) => setSala(e.target.value)}
                    placeholder="Berçário, Kids 1…"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={entrega}
                    disabled={agindo || quemEntrega.trim().length < 2}
                    className="flex-1"
                  >
                    {agindo && <Loader2 className="h-4 w-4 animate-spin" />}
                    Gerar código e entregar
                  </Button>
                  <Button variant="outline" onClick={() => setEntregando(null)}>
                    Cancelar
                  </Button>
                </div>
              </div>
            ) : (
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  placeholder="Buscar criança pelo nome"
                  className="pl-9"
                />
                {achados.length > 0 && (
                  <div className="absolute z-10 mt-1 w-full overflow-hidden rounded-xl border border-border bg-white shadow-lg dark:bg-slate-900">
                    {achados.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => {
                          setEntregando(c);
                          setQuemEntrega(c.guardians[0]?.name ?? '');
                        }}
                        className="flex w-full flex-col items-start px-3 py-2 text-left hover:bg-slate-50 dark:hover:bg-slate-800/60"
                      >
                        <span className="text-sm text-slate-800 dark:text-slate-200">
                          {c.name}
                        </span>
                        {c.restrictions && (
                          <span className="text-xs font-semibold text-red-600 dark:text-red-400">
                            Atenção: restrição de retirada
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* ---- Retirada ---- */}
        <Card>
          <CardContent className="p-5">
            <p className="mb-3 flex items-center gap-2 font-semibold text-slate-900 dark:text-slate-100">
              <LogOut className="h-4 w-4 text-emerald-500" />
              Retirar criança
            </p>
            <form onSubmit={retira} className="space-y-3">
              <div>
                <Label htmlFor="k-cod">Código de retirada *</Label>
                <Input
                  id="k-cod"
                  inputMode="numeric"
                  maxLength={4}
                  value={codigoRetirada}
                  onChange={(e) =>
                    setCodigoRetirada(e.target.value.replace(/\D/g, ''))
                  }
                  placeholder="0000"
                  className="text-center font-mono text-2xl tracking-[0.3em]"
                />
              </div>
              <div>
                <Label htmlFor="k-retira">Quem está retirando *</Label>
                <Input
                  id="k-retira"
                  value={quemRetira}
                  onChange={(e) => setQuemRetira(e.target.value)}
                  placeholder="Nome de quem está levando"
                />
              </div>
              <Button
                type="submit"
                disabled={
                  agindo || codigoRetirada.length < 4 || quemRetira.trim().length < 2
                }
                className="w-full"
              >
                {agindo && <Loader2 className="h-4 w-4 animate-spin" />}
                Conferir e liberar
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* ---- Quem está na sala ---- */}
      <div className="mt-4">
        {loading ? (
          <ListSkeleton />
        ) : !hoje || hoje.inside.length + hoje.left.length === 0 ? (
          <EmptyState
            icon={Baby}
            title="Nenhuma criança hoje"
            description="Busque a criança e toque em entregar para gerar o código de retirada."
          />
        ) : (
          <div className="space-y-4">
            <Card>
              <CardContent className="p-5">
                <p className="mb-3 font-semibold text-slate-900 dark:text-slate-100">
                  Na sala agora ({hoje.inside.length})
                </p>
                {hoje.inside.length === 0 ? (
                  <p className="text-sm text-slate-400">Nenhuma criança na sala.</p>
                ) : (
                  <div className="space-y-2">
                    {hoje.inside.map((r) => (
                      <div
                        key={r.id}
                        className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border p-3"
                      >
                        <div className="min-w-0">
                          <p className="font-medium text-slate-900 dark:text-slate-100">
                            {r.childName}
                            {r.room && (
                              <span className="ml-2 text-sm font-normal text-slate-400">
                                {r.room}
                              </span>
                            )}
                          </p>
                          <p className="text-sm text-slate-500 dark:text-slate-400">
                            Entregue por {r.checkedInBy}
                          </p>
                          {r.notes && (
                            <p className="mt-0.5 text-sm text-amber-700 dark:text-amber-400">
                              {r.notes}
                            </p>
                          )}
                          {r.restrictions && (
                            <p className="mt-0.5 flex items-start gap-1.5 text-sm font-semibold text-red-600 dark:text-red-400">
                              <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
                              {r.restrictions}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xl font-bold tracking-widest text-slate-400 dark:text-slate-500">
                            ••••
                          </span>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => desativa(r)}
                            className="text-slate-400"
                            title="Remover do cadastro"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {hoje.left.length > 0 && (
              <Card>
                <CardContent className="p-5">
                  <p className="mb-3 font-semibold text-slate-900 dark:text-slate-100">
                    Já retiradas ({hoje.left.length})
                  </p>
                  <div className="space-y-1.5">
                    {hoje.left.map((r) => (
                      <div
                        key={r.id}
                        className="flex items-center justify-between gap-3 rounded-xl border border-border px-3 py-2"
                      >
                        <span className="text-sm text-slate-700 dark:text-slate-300">
                          {r.childName}
                        </span>
                        <span className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400">
                          <Check className="h-4 w-4 text-emerald-500" />
                          {r.checkedOutBy}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
