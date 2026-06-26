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
import { STATUS_LABELS, STATUS_VARIANTS } from '@/lib/members';
import { ReportNewMembers } from '@/lib/reports';

export default function NewMembersReportPage(): React.ReactElement {
  const [data, setData] = useState<ReportNewMembers | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<Period>(presetThisYear());

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    api
      .get<ReportNewMembers>('/reports/new-members', {
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
    exportToCsv('novos-membros', [
      { label: 'Nome', value: (m: ReportNewMembers['members'][number]) => m.name },
      { label: 'Status', value: (m) => STATUS_LABELS[m.status] },
      { label: 'Célula', value: (m) => m.cell ?? '' },
      { label: 'Entrada', value: (m) => formatDate(m.joinedAt) },
    ], data?.members ?? []);

  const maxCount = Math.max(1, ...(data?.monthly.map((m) => m.count) ?? [1]));

  return (
    <ReportShell
      title="Novos membros"
      description={`${data?.total ?? 0} entrada(s) no período.`}
      onExport={handleExport}
      filters={<PeriodFilter value={period} onChange={setPeriod} />}
      loading={loading}
      error={error}
    >
      {data && (
        <div className="space-y-6">
          {data.monthly.length > 0 && (
            <Card>
              <CardContent className="p-5">
                <p className="mb-4 text-sm font-medium text-slate-600">
                  Entradas por mês
                </p>
                <div className="flex h-40 items-end gap-3">
                  {data.monthly.map((m) => (
                    <div
                      key={m.key}
                      className="flex flex-1 flex-col items-center gap-1"
                    >
                      <span className="text-xs font-medium text-slate-700">
                        {m.count}
                      </span>
                      <div className="flex w-full flex-1 items-end">
                        <div
                          className="w-full rounded-t bg-indigo-500"
                          style={{
                            height: `${(m.count / maxCount) * 100}%`,
                            minHeight: m.count > 0 ? '4px' : '0',
                          }}
                        />
                      </div>
                      <span className="text-xs text-slate-500">{m.label}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <DataTable
            rows={data.members}
            empty="Nenhuma entrada no período."
            columns={[
              { key: 'name', label: 'Nome' },
              {
                key: 'status',
                label: 'Status',
                render: (m) => (
                  <Badge variant={STATUS_VARIANTS[m.status]}>
                    {STATUS_LABELS[m.status]}
                  </Badge>
                ),
              },
              { key: 'cell', label: 'Célula', render: (m) => m.cell ?? '—' },
              {
                key: 'joinedAt',
                label: 'Entrada',
                render: (m) => formatDate(m.joinedAt),
              },
            ]}
          />
        </div>
      )}
    </ReportShell>
  );
}
