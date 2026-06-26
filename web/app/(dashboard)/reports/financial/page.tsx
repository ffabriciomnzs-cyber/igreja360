'use client';

import { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, Wallet } from 'lucide-react';
import { ReportShell } from '@/components/reports/ReportShell';
import { DataTable } from '@/components/reports/DataTable';
import {
  PeriodFilter,
  Period,
  presetThisMonth,
} from '@/components/reports/PeriodFilter';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { api, extractApiError } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import { exportToCsv } from '@/lib/report-export';
import { ReportFinancial, ReportFinancialTransaction } from '@/lib/reports';

export default function FinancialReportPage(): React.ReactElement {
  const [data, setData] = useState<ReportFinancial | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<Period>(presetThisMonth());

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    api
      .get<ReportFinancial>('/reports/financial', {
        params: { from: period.from, to: period.to },
      })
      .then(({ data: res }) => {
        if (mounted) setData(res);
      })
      .catch((err) => {
        if (mounted) setError(extractApiError(err));
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [period]);

  const handleExport = () =>
    exportToCsv('financeiro', [
      { label: 'Data', value: (t: ReportFinancialTransaction) => formatDate(t.date) },
      { label: 'Tipo', value: (t) => (t.type === 'INCOME' ? 'Receita' : 'Despesa') },
      { label: 'Categoria', value: (t) => t.category },
      { label: 'Descrição', value: (t) => t.description ?? '' },
      { label: 'Valor', value: (t) => t.amount.toFixed(2).replace('.', ',') },
    ], data?.transactions ?? []);

  return (
    <ReportShell
      title="Demonstrativo financeiro"
      description="Receitas, despesas e saldo no período."
      onExport={handleExport}
      filters={<PeriodFilter value={period} onChange={setPeriod} />}
      loading={loading}
      error={error}
    >
      {data && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Card>
              <CardContent className="flex items-center justify-between p-5">
                <div>
                  <p className="text-sm text-slate-500">Receitas</p>
                  <p className="mt-1 text-xl font-bold text-emerald-600">
                    {formatCurrency(data.summary.income)}
                  </p>
                </div>
                <TrendingUp className="h-5 w-5 text-emerald-500" />
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center justify-between p-5">
                <div>
                  <p className="text-sm text-slate-500">Despesas</p>
                  <p className="mt-1 text-xl font-bold text-red-600">
                    {formatCurrency(data.summary.expense)}
                  </p>
                </div>
                <TrendingDown className="h-5 w-5 text-red-500" />
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center justify-between p-5">
                <div>
                  <p className="text-sm text-slate-500">Saldo</p>
                  <p
                    className={`mt-1 text-xl font-bold ${
                      data.summary.balance >= 0
                        ? 'text-slate-900'
                        : 'text-red-600'
                    }`}
                  >
                    {formatCurrency(data.summary.balance)}
                  </p>
                </div>
                <Wallet className="h-5 w-5 text-indigo-500" />
              </CardContent>
            </Card>
          </div>

          {data.byCategory.length > 0 && (
            <Card>
              <CardContent className="p-5">
                <p className="mb-3 text-sm font-medium text-slate-600">
                  Por categoria
                </p>
                <ul className="divide-y divide-border">
                  {data.byCategory.map((c, i) => (
                    <li
                      key={`${c.category}-${c.type}-${i}`}
                      className="flex items-center justify-between py-2.5 text-sm"
                    >
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={c.type === 'INCOME' ? 'success' : 'danger'}
                        >
                          {c.type === 'INCOME' ? 'Receita' : 'Despesa'}
                        </Badge>
                        <span className="text-slate-700">{c.category}</span>
                      </div>
                      <span
                        className={`font-medium ${
                          c.type === 'INCOME'
                            ? 'text-emerald-600'
                            : 'text-red-600'
                        }`}
                      >
                        {formatCurrency(c.amount)}
                      </span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          <div>
            <p className="mb-3 text-sm font-medium text-slate-600">
              Lançamentos ({data.transactions.length})
            </p>
            <DataTable
              rows={data.transactions}
              empty="Nenhum lançamento no período."
              columns={[
                { key: 'date', label: 'Data', render: (t) => formatDate(t.date) },
                {
                  key: 'type',
                  label: 'Tipo',
                  render: (t) => (
                    <Badge variant={t.type === 'INCOME' ? 'success' : 'danger'}>
                      {t.type === 'INCOME' ? 'Receita' : 'Despesa'}
                    </Badge>
                  ),
                },
                { key: 'category', label: 'Categoria' },
                {
                  key: 'description',
                  label: 'Descrição',
                  render: (t) => t.description ?? '—',
                },
                {
                  key: 'amount',
                  label: 'Valor',
                  align: 'right',
                  render: (t) => (
                    <span
                      className={
                        t.type === 'INCOME'
                          ? 'text-emerald-600'
                          : 'text-red-600'
                      }
                    >
                      {formatCurrency(t.amount)}
                    </span>
                  ),
                },
              ]}
            />
          </div>
        </div>
      )}
    </ReportShell>
  );
}
