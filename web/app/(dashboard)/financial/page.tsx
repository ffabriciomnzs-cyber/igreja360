'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Plus,
  Search,
  Loader2,
  Pencil,
  Trash2,
  TrendingUp,
  TrendingDown,
  Wallet,
  Receipt,
} from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { api, extractApiError } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import {
  FinancialSummary,
  PaginatedTransactions,
  Transaction,
} from '@/lib/financial';

const EMPTY_SUMMARY: FinancialSummary = { income: 0, expense: 0, balance: 0 };

export default function FinancialPage(): React.ReactElement {
  const [items, setItems] = useState<Transaction[]>([]);
  const [summary, setSummary] = useState<FinancialSummary>(EMPTY_SUMMARY);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [type, setType] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get<PaginatedTransactions>('/financial', {
        params: {
          page,
          limit: 20,
          search: search.trim() || undefined,
          type: type || undefined,
        },
      });
      setItems(data.data);
      setSummary(data.summary);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    } catch (err) {
      setError(extractApiError(err));
    } finally {
      setLoading(false);
    }
  }, [page, search, type]);

  useEffect(() => {
    const timer = setTimeout(load, 250);
    return () => clearTimeout(timer);
  }, [load]);

  async function handleDelete(t: Transaction): Promise<void> {
    const ok = window.confirm('Remover este lançamento?');
    if (!ok) return;
    setDeletingId(t.id);
    try {
      await api.delete(`/financial/${t.id}`);
      await load();
    } catch (err) {
      setError(extractApiError(err));
    } finally {
      setDeletingId(null);
    }
  }

  const cards = [
    {
      label: 'Receitas',
      value: summary.income,
      icon: TrendingUp,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
    },
    {
      label: 'Despesas',
      value: summary.expense,
      icon: TrendingDown,
      color: 'text-red-600',
      bg: 'bg-red-50',
    },
    {
      label: 'Saldo',
      value: summary.balance,
      icon: Wallet,
      color: summary.balance >= 0 ? 'text-indigo-600' : 'text-red-600',
      bg: 'bg-indigo-50',
    },
  ];

  return (
    <div>
      <PageHeader
        title="Financeiro"
        description="Receitas, despesas e saldo da igreja."
        action={
          <Link href="/financial/new">
            <Button>
              <Plus className="h-4 w-4" />
              Novo lançamento
            </Button>
          </Link>
        }
      />

      <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <Card key={c.label}>
              <CardContent className="flex items-center justify-between p-6">
                <div>
                  <p className="text-sm text-slate-500">{c.label}</p>
                  <p className={`mt-1 text-2xl font-bold ${c.color}`}>
                    {formatCurrency(c.value)}
                  </p>
                </div>
                <div
                  className={`flex h-11 w-11 items-center justify-center rounded-lg ${c.bg} ${c.color}`}
                >
                  <Icon className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="mb-4">
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={search}
              onChange={(e) => {
                setPage(1);
                setSearch(e.target.value);
              }}
              placeholder="Buscar por categoria ou descrição"
              className="pl-9"
            />
          </div>
          <Select
            value={type}
            onChange={(e) => {
              setPage(1);
              setType(e.target.value);
            }}
            className="sm:w-48"
          >
            <option value="">Todos os tipos</option>
            <option value="INCOME">Receitas</option>
            <option value="EXPENSE">Despesas</option>
          </Select>
        </CardContent>
      </Card>

      {error && (
        <div className="mb-4 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-16 text-sm text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              Carregando lançamentos...
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
              <Receipt className="h-8 w-8 text-slate-300" />
              <p className="text-sm font-medium text-slate-700">
                Nenhum lançamento encontrado
              </p>
              <p className="text-sm text-slate-500">
                Registre a primeira receita ou despesa.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-slate-500">
                    <th className="px-4 py-3 font-medium">Data</th>
                    <th className="px-4 py-3 font-medium">Categoria</th>
                    <th className="px-4 py-3 font-medium">Tipo</th>
                    <th className="px-4 py-3 text-right font-medium">Valor</th>
                    <th className="px-4 py-3 text-right font-medium">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((t) => {
                    const isIncome = t.type === 'INCOME';
                    return (
                      <tr
                        key={t.id}
                        className="border-b border-border last:border-0 hover:bg-slate-50"
                      >
                        <td className="px-4 py-3 text-slate-600">
                          {formatDate(t.date)}
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-medium text-slate-900">
                            {t.category}
                          </p>
                          {t.description && (
                            <p className="text-xs text-slate-500">
                              {t.description}
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={isIncome ? 'success' : 'danger'}>
                            {isIncome ? 'Receita' : 'Despesa'}
                          </Badge>
                        </td>
                        <td
                          className={`px-4 py-3 text-right font-medium ${
                            isIncome ? 'text-emerald-600' : 'text-red-600'
                          }`}
                        >
                          {isIncome ? '+' : '−'}{' '}
                          {formatCurrency(Number(t.amount))}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <Link href={`/financial/${t.id}/edit`}>
                              <Button variant="ghost" size="icon" title="Editar">
                                <Pencil className="h-4 w-4" />
                              </Button>
                            </Link>
                            <Button
                              variant="ghost"
                              size="icon"
                              title="Remover"
                              onClick={() => handleDelete(t)}
                              disabled={deletingId === t.id}
                            >
                              {deletingId === t.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4 text-red-500" />
                              )}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {!loading && items.length > 0 && (
        <div className="mt-4 flex items-center justify-between text-sm text-slate-600">
          <span>
            {total} {total === 1 ? 'lançamento' : 'lançamentos'}
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Anterior
            </Button>
            <span>
              Página {page} de {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Próxima
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
