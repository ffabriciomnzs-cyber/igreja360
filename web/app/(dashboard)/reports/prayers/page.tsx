'use client';

import { useEffect, useState } from 'react';
import { ReportShell } from '@/components/reports/ReportShell';
import { DataTable } from '@/components/reports/DataTable';
import {
  PeriodFilter,
  Period,
  presetThisYear,
} from '@/components/reports/PeriodFilter';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { api, extractApiError } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { exportToCsv } from '@/lib/report-export';
import {
  PRAYER_STATUS_LABELS,
  PRAYER_STATUS_VARIANTS,
} from '@/lib/prayers';
import { ReportPrayers } from '@/lib/reports';

export default function PrayersReportPage(): React.ReactElement {
  const [data, setData] = useState<ReportPrayers | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<Period>(presetThisYear());

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    api
      .get<ReportPrayers>('/reports/prayers', {
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
    exportToCsv('oracoes', [
      { label: 'Título', value: (p: ReportPrayers['prayers'][number]) => p.title },
      { label: 'Status', value: (p) => PRAYER_STATUS_LABELS[p.status] },
      { label: 'Criado em', value: (p) => formatDate(p.createdAt) },
    ], data?.prayers ?? []);

  return (
    <ReportShell
      title="Pedidos de oração"
      description="Pedidos ativos e respondidos no período."
      onExport={handleExport}
      filters={<PeriodFilter value={period} onChange={setPeriod} />}
      loading={loading}
      error={error}
    >
      {data && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Card>
              <CardContent className="p-5">
                <p className="text-sm text-slate-500">Ativos</p>
                <p className="mt-1 text-2xl font-bold text-indigo-600">
                  {data.counts.active}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5">
                <p className="text-sm text-slate-500">Respondidos</p>
                <p className="mt-1 text-2xl font-bold text-emerald-600">
                  {data.counts.answered}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5">
                <p className="text-sm text-slate-500">Arquivados</p>
                <p className="mt-1 text-2xl font-bold text-slate-500">
                  {data.counts.archived}
                </p>
              </CardContent>
            </Card>
          </div>

          <DataTable
            rows={data.prayers}
            empty="Nenhum pedido no período."
            columns={[
              { key: 'title', label: 'Título' },
              {
                key: 'status',
                label: 'Status',
                render: (p) => (
                  <Badge variant={PRAYER_STATUS_VARIANTS[p.status]}>
                    {PRAYER_STATUS_LABELS[p.status]}
                  </Badge>
                ),
              },
              {
                key: 'createdAt',
                label: 'Criado em',
                render: (p) => formatDate(p.createdAt),
              },
            ]}
          />
        </div>
      )}
    </ReportShell>
  );
}
