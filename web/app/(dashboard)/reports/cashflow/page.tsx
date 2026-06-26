'use client';

import { useEffect, useState } from 'react';
import { ReportShell } from '@/components/reports/ReportShell';
import { DataTable } from '@/components/reports/DataTable';
import { Card, CardContent } from '@/components/ui/card';
import { api, extractApiError } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { exportToCsv } from '@/lib/report-export';
import { ReportCashflowPoint } from '@/lib/reports';

export default function CashflowReportPage(): React.ReactElement {
  const [rows, setRows] = useState<ReportCashflowPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [months, setMonths] = useState(12);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    api
      .get<ReportCashflowPoint[]>('/reports/cashflow', { params: { months } })
      .then(({ data }) => {
        if (mounted) setRows(data);
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
  }, [months]);

  const maxValue = Math.max(
    1,
    ...rows.map((r) => Math.max(r.income, r.expense)),
  );

  const handleExport = () =>
    exportToCsv('fluxo-de-caixa', [
      { label: 'Mês', value: (r: ReportCashflowPoint) => r.label },
      { label: 'Receitas', value: (r) => r.income.toFixed(2).replace('.', ',') },
      { label: 'Despesas', value: (r) => r.expense.toFixed(2).replace('.', ',') },
      { label: 'Saldo', value: (r) => r.balance.toFixed(2).replace('.', ',') },
    ], rows);

  const filters = (
    <div className="flex items-end gap-3 rounded-lg border border-border bg-white p-4">
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-500">
          Período
        </label>
        <select
          value={months}
          onChange={(e) => setMonths(Number(e.target.value))}
          className="rounded-md border border-border px-3 py-1.5 text-sm"
        >
          <option value={6}>Últimos 6 meses</option>
          <option value={12}>Últimos 12 meses</option>
          <option value={24}>Últimos 24 meses</option>
        </select>
      </div>
    </div>
  );

  return (
    <ReportShell
      title="Fluxo de caixa"
      description="Evolução de entradas e saídas mês a mês."
      onExport={handleExport}
      filters={filters}
      loading={loading}
      error={error}
    >
      <div className="space-y-6">
        <Card>
          <CardContent className="p-5">
            <div className="mb-4 flex items-center gap-4 text-xs text-slate-500">
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm bg-emerald-500" />
                Receitas
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm bg-red-400" />
                Despesas
              </span>
            </div>
            <div className="flex h-48 items-end gap-2 overflow-x-auto">
              {rows.map((r) => (
                <div
                  key={r.key}
                  className="flex min-w-[2.5rem] flex-1 flex-col items-center gap-1"
                >
                  <div className="flex w-full flex-1 items-end justify-center gap-0.5">
                    <div
                      className="w-1/2 rounded-t bg-emerald-500"
                      style={{
                        height: `${(r.income / maxValue) * 100}%`,
                        minHeight: r.income > 0 ? '3px' : '0',
                      }}
                      title={`Receitas: ${formatCurrency(r.income)}`}
                    />
                    <div
                      className="w-1/2 rounded-t bg-red-400"
                      style={{
                        height: `${(r.expense / maxValue) * 100}%`,
                        minHeight: r.expense > 0 ? '3px' : '0',
                      }}
                      title={`Despesas: ${formatCurrency(r.expense)}`}
                    />
                  </div>
                  <span className="text-xs text-slate-500">{r.label}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <DataTable
          rows={rows}
          getKey={(r) => r.key}
          empty="Sem dados financeiros."
          columns={[
            { key: 'label', label: 'Mês' },
            {
              key: 'income',
              label: 'Receitas',
              align: 'right',
              render: (r) => (
                <span className="text-emerald-600">
                  {formatCurrency(r.income)}
                </span>
              ),
            },
            {
              key: 'expense',
              label: 'Despesas',
              align: 'right',
              render: (r) => (
                <span className="text-red-600">{formatCurrency(r.expense)}</span>
              ),
            },
            {
              key: 'balance',
              label: 'Saldo',
              align: 'right',
              render: (r) => (
                <span
                  className={r.balance >= 0 ? 'text-slate-900' : 'text-red-600'}
                >
                  {formatCurrency(r.balance)}
                </span>
              ),
            },
          ]}
        />
      </div>
    </ReportShell>
  );
}
