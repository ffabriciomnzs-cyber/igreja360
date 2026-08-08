'use client';

// Aba "Contas parceladas" do Financeiro.
// Regra que rege esta tela: cadastrar uma conta NÃO mexe no saldo — cada
// parcela vira despesa só quando é paga (o backend cria o lançamento).

import { useCallback, useEffect, useState } from 'react';
import {
  Plus,
  Loader2,
  ChevronDown,
  ChevronRight,
  Check,
  Undo2,
  Trash2,
  CircleAlert,
  CircleCheck,
  Circle,
  Receipt,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { ListSkeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { api, extractApiError } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import { EXPENSE_CATEGORIES } from '@/lib/financial';
import {
  Payable,
  PayablesStats,
  EMPTY_PAYABLES_STATS,
  payableStatus,
} from '@/lib/payables';
import { toast } from 'sonner';
import {
  PayablesTour,
  ABRIR_TOUR_PARCELADAS,
} from '@/components/financial/PayablesTour';

const FORM_VAZIO = {
  description: '',
  creditor: '',
  category: EXPENSE_CATEGORIES[0],
  installments: '10',
  amount: '',
  firstDueDate: '',
  note: '',
};

export function PayablesTab(): React.ReactElement {
  const [items, setItems] = useState<Payable[]>([]);
  const [stats, setStats] = useState<PayablesStats>(EMPTY_PAYABLES_STATS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [aberta, setAberta] = useState<string | null>(null);
  const [agindo, setAgindo] = useState<string | null>(null);

  const [form, setForm] = useState(FORM_VAZIO);
  const [criando, setCriando] = useState(false);
  const [salvando, setSalvando] = useState(false);

  const carrega = useCallback(() => {
    setLoading(true);
    Promise.all([
      api.get<Payable[]>('/payables'),
      api.get<PayablesStats>('/payables/stats'),
    ])
      .then(([lista, resumo]) => {
        setItems(lista.data);
        setStats(resumo.data);
      })
      .catch((err) => setError(extractApiError(err)))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    carrega();
  }, [carrega]);

  /** Substitui uma conta na lista e recarrega o resumo do topo. */
  function atualiza(conta: Payable): void {
    setItems((prev) => prev.map((p) => (p.id === conta.id ? conta : p)));
    api
      .get<PayablesStats>('/payables/stats')
      .then(({ data }) => setStats(data))
      .catch(() => undefined);
  }

  async function cria(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    setSalvando(true);
    try {
      const { data } = await api.post<Payable>('/payables', {
        description: form.description.trim(),
        creditor: form.creditor.trim() || undefined,
        category: form.category,
        installments: Number(form.installments),
        amount: Number(form.amount),
        firstDueDate: form.firstDueDate,
        note: form.note.trim() || undefined,
      });
      setItems((prev) => [data, ...prev]);
      setForm(FORM_VAZIO);
      setCriando(false);
      setAberta(data.id);
      carrega();
      toast.success('Conta cadastrada. O saldo só muda quando você pagar cada parcela.');
    } catch (err) {
      toast.error(extractApiError(err));
    } finally {
      setSalvando(false);
    }
  }

  async function paga(parcelaId: string): Promise<void> {
    setAgindo(parcelaId);
    try {
      const { data } = await api.post<Payable>(
        `/payables/installments/${parcelaId}/pay`,
      );
      atualiza(data);
      toast.success('Parcela paga. A despesa entrou no financeiro.');
    } catch (err) {
      toast.error(extractApiError(err));
    } finally {
      setAgindo(null);
    }
  }

  async function desfaz(parcelaId: string): Promise<void> {
    if (
      !window.confirm(
        'Desfazer este pagamento? A despesa lançada no financeiro será apagada.',
      )
    ) {
      return;
    }
    setAgindo(parcelaId);
    try {
      const { data } = await api.post<Payable>(
        `/payables/installments/${parcelaId}/unpay`,
      );
      atualiza(data);
      toast.success('Pagamento desfeito.');
    } catch (err) {
      toast.error(extractApiError(err));
    } finally {
      setAgindo(null);
    }
  }

  async function apaga(conta: Payable): Promise<void> {
    if (
      !window.confirm(
        `Excluir "${conta.description}"? Isso apaga a conta e as parcelas em aberto.`,
      )
    ) {
      return;
    }
    try {
      await api.delete(`/payables/${conta.id}`);
      setItems((prev) => prev.filter((p) => p.id !== conta.id));
      carrega();
      toast.success('Conta excluída.');
    } catch (err) {
      toast.error(extractApiError(err));
    }
  }

  const resumo = [
    {
      label: 'Falta pagar',
      value: stats.openAmount,
      hint: `${stats.openCount} parcela(s) em aberto`,
      cor: 'text-slate-900 dark:text-slate-100',
    },
    {
      label: 'Vence este mês',
      value: stats.monthAmount,
      hint: `${stats.monthCount} parcela(s)`,
      cor: 'text-amber-600 dark:text-amber-400',
    },
    {
      label: 'Atrasadas',
      value: stats.overdueAmount,
      hint: `${stats.overdueCount} parcela(s)`,
      cor:
        stats.overdueCount > 0
          ? 'text-red-600 dark:text-red-400'
          : 'text-slate-400 dark:text-slate-500',
    },
  ];

  return (
    <div>
      <PayablesTour />

      <div
        data-tour="parceladas-resumo"
        className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-3"
      >
        {resumo.map((c) => (
          <Card key={c.label}>
            <CardContent className="p-6">
              <p className="text-sm text-slate-500 dark:text-slate-400">{c.label}</p>
              <p className={`mt-1 text-2xl font-bold ${c.cor}`}>
                {formatCurrency(c.value)}
              </p>
              <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">
                {c.hint}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mb-4 flex justify-end">
        <Button data-tour="parceladas-nova" onClick={() => setCriando((v) => !v)}>
          <Plus className="h-4 w-4" />
          Nova conta parcelada
        </Button>
      </div>

      {criando && (
        <Card className="mb-4">
          <CardContent className="p-6">
            <form onSubmit={cria} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label htmlFor="p-desc">O que foi comprado *</Label>
                <Input
                  id="p-desc"
                  required
                  value={form.description}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, description: e.target.value }))
                  }
                  placeholder="Ar-condicionado do templo"
                />
              </div>
              <div>
                <Label htmlFor="p-cred">Para quem se paga</Label>
                <Input
                  id="p-cred"
                  value={form.creditor}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, creditor: e.target.value }))
                  }
                  placeholder="Friocenter"
                />
              </div>
              <div>
                <Label htmlFor="p-cat">Categoria *</Label>
                <Select
                  id="p-cat"
                  value={form.category}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, category: e.target.value }))
                  }
                >
                  {EXPENSE_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <Label htmlFor="p-parc">Quantas parcelas *</Label>
                <Input
                  id="p-parc"
                  type="number"
                  min={2}
                  max={120}
                  required
                  value={form.installments}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, installments: e.target.value }))
                  }
                />
              </div>
              <div>
                <Label htmlFor="p-valor">Valor de cada parcela *</Label>
                <Input
                  id="p-valor"
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  value={form.amount}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, amount: e.target.value }))
                  }
                  placeholder="350,00"
                />
              </div>
              <div>
                <Label htmlFor="p-venc">Primeiro vencimento *</Label>
                <Input
                  id="p-venc"
                  type="date"
                  required
                  value={form.firstDueDate}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, firstDueDate: e.target.value }))
                  }
                />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="p-obs">Observação</Label>
                <Textarea
                  id="p-obs"
                  rows={2}
                  value={form.note}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, note: e.target.value }))
                  }
                  placeholder="Nota fiscal 1234, garantia de 1 ano…"
                />
              </div>

              {form.amount && form.installments && (
                <p className="sm:col-span-2 rounded-md bg-slate-50 dark:bg-slate-800/60 px-3 py-2 text-sm text-slate-600 dark:text-slate-300">
                  Total da conta:{' '}
                  <strong>
                    {formatCurrency(
                      Number(form.amount) * Number(form.installments),
                    )}
                  </strong>{' '}
                  — o saldo da igreja só muda quando cada parcela for paga.
                </p>
              )}

              <div className="flex gap-2 sm:col-span-2">
                <Button type="submit" disabled={salvando}>
                  {salvando && <Loader2 className="h-4 w-4 animate-spin" />}
                  Cadastrar conta
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setCriando(false);
                    setForm(FORM_VAZIO);
                  }}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {error && (
        <div className="mb-4 rounded-md bg-red-50 dark:bg-red-950/40 px-4 py-3 text-sm text-red-700 dark:text-red-300">
          {error}
        </div>
      )}

      {loading ? (
        <ListSkeleton />
      ) : items.length === 0 ? (
        <EmptyState
          icon={Receipt}
          title="Nenhuma conta parcelada"
          description="Cadastre compras parceladas para acompanhar o que ainda falta pagar e não perder vencimento."
        />
      ) : (
        <div data-tour="parceladas-lista" className="space-y-3">
          {items.map((conta) => {
            const situacao = payableStatus(conta);
            const expandida = aberta === conta.id;
            return (
              <Card key={conta.id}>
                <CardContent className="p-0">
                  <button
                    onClick={() => setAberta(expandida ? null : conta.id)}
                    className="flex w-full items-start gap-3 p-5 text-left"
                  >
                    {expandida ? (
                      <ChevronDown className="mt-1 h-4 w-4 shrink-0 text-slate-400" />
                    ) : (
                      <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-slate-400" />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-slate-900 dark:text-slate-100">
                          {conta.description}
                        </p>
                        <Badge variant={situacao.variant}>{situacao.label}</Badge>
                      </div>
                      <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
                        {conta.category}
                        {conta.creditor ? ` · ${conta.creditor}` : ''}
                      </p>

                      <div className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                        <span className="text-lg font-bold text-slate-900 dark:text-slate-100">
                          {formatCurrency(conta.installmentAmount)}
                        </span>
                        <span className="text-sm text-slate-500 dark:text-slate-400">
                          por mês · {conta.paidCount} de {conta.installments} pagas
                        </span>
                        {conta.nextDueDate && !conta.finished && (
                          <span className="text-sm text-slate-400 dark:text-slate-500">
                            próxima em {formatDate(conta.nextDueDate)}
                          </span>
                        )}
                      </div>

                      <div className="mt-3 flex gap-0.5">
                        {conta.items.map((p) => (
                          <span
                            key={p.id}
                            title={`Parcela ${p.number} — ${formatDate(p.dueDate)}`}
                            className={`h-1.5 flex-1 rounded-full ${
                              p.paidAt
                                ? 'bg-emerald-500'
                                : p.overdue
                                  ? 'bg-red-500'
                                  : 'bg-slate-200 dark:bg-slate-700'
                            }`}
                          />
                        ))}
                      </div>

                      <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">
                        Falta {formatCurrency(conta.openAmount)} de{' '}
                        {formatCurrency(conta.totalAmount)}
                      </p>
                    </div>
                  </button>

                  {expandida && (
                    <div className="border-t border-slate-100 dark:border-slate-800">
                      {conta.note && (
                        <p className="border-b border-slate-100 dark:border-slate-800 px-5 py-3 text-sm text-slate-500 dark:text-slate-400">
                          {conta.note}
                        </p>
                      )}
                      {conta.items.map((p) => (
                        <div
                          key={p.id}
                          className={`flex items-center gap-3 border-b border-slate-100 px-5 py-3 last:border-0 dark:border-slate-800 ${
                            p.overdue ? 'bg-red-50/60 dark:bg-red-950/20' : ''
                          }`}
                        >
                          {p.paidAt ? (
                            <CircleCheck className="h-4 w-4 shrink-0 text-emerald-500" />
                          ) : p.overdue ? (
                            <CircleAlert className="h-4 w-4 shrink-0 text-red-500" />
                          ) : (
                            <Circle className="h-4 w-4 shrink-0 text-slate-300 dark:text-slate-600" />
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                              {p.number} de {conta.installments} ·{' '}
                              {formatDate(p.dueDate)}
                            </p>
                            <p className="text-xs text-slate-400 dark:text-slate-500">
                              {p.paidAt
                                ? `Paga em ${formatDate(p.paidAt)}`
                                : p.overdue
                                  ? 'Vencida'
                                  : 'A vencer'}
                            </p>
                          </div>
                          <span className="shrink-0 text-sm font-medium text-slate-700 dark:text-slate-300">
                            {formatCurrency(p.paidAmount ?? p.amount)}
                          </span>
                          {p.paidAt ? (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => desfaz(p.id)}
                              disabled={agindo === p.id}
                              title="Desfazer pagamento"
                            >
                              {agindo === p.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Undo2 className="h-4 w-4" />
                              )}
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              onClick={() => paga(p.id)}
                              disabled={agindo === p.id}
                            >
                              {agindo === p.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Check className="h-4 w-4" />
                              )}
                              Pagar
                            </Button>
                          )}
                        </div>
                      ))}

                      <div className="flex justify-end px-5 py-3">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => apaga(conta)}
                          className="text-red-600 hover:text-red-700 dark:text-red-400"
                        >
                          <Trash2 className="h-4 w-4" />
                          Excluir conta
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <button
        onClick={() => window.dispatchEvent(new Event(ABRIR_TOUR_PARCELADAS))}
        className="mt-6 w-full rounded-xl border border-slate-200 bg-white py-3 text-center text-sm font-medium text-indigo-600 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-indigo-400 dark:hover:bg-slate-800/60"
      >
        Como funciona
      </button>
    </div>
  );
}
