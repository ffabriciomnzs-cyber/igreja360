'use client';

import { useEffect, useState } from 'react';
import { ReportShell } from '@/components/reports/ReportShell';
import { DataTable } from '@/components/reports/DataTable';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { api, extractApiError } from '@/lib/api';
import { exportToCsv } from '@/lib/report-export';
import { ReportMembersByCell } from '@/lib/reports';

export default function MembersByCellReportPage(): React.ReactElement {
  const [data, setData] = useState<ReportMembersByCell | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    api
      .get<ReportMembersByCell>('/reports/members-by-cell')
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
  }, []);

  const handleExport = () =>
    exportToCsv('membros-por-celula', [
      { label: 'Célula', value: (c: ReportMembersByCell['cells'][number]) => c.name },
      { label: 'Situação', value: (c) => (c.active ? 'Ativa' : 'Inativa') },
      { label: 'Membros', value: (c) => c.count },
    ], data?.cells ?? []);

  const totalInCells =
    data?.cells.reduce((sum, c) => sum + c.count, 0) ?? 0;

  return (
    <ReportShell
      title="Membros por célula"
      description="Distribuição de membros entre as células."
      onExport={handleExport}
      loading={loading}
      error={error}
    >
      {data && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Card>
              <CardContent className="p-5">
                <p className="text-sm text-slate-500">Células</p>
                <p className="mt-1 text-2xl font-bold text-slate-900">
                  {data.cells.length}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5">
                <p className="text-sm text-slate-500">Membros em células</p>
                <p className="mt-1 text-2xl font-bold text-emerald-600">
                  {totalInCells}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5">
                <p className="text-sm text-slate-500">Sem célula</p>
                <p className="mt-1 text-2xl font-bold text-amber-600">
                  {data.withoutCell}
                </p>
              </CardContent>
            </Card>
          </div>

          <DataTable
            rows={data.cells}
            empty="Nenhuma célula cadastrada."
            columns={[
              { key: 'name', label: 'Célula' },
              {
                key: 'active',
                label: 'Situação',
                render: (c) => (
                  <Badge variant={c.active ? 'success' : 'muted'}>
                    {c.active ? 'Ativa' : 'Inativa'}
                  </Badge>
                ),
              },
              { key: 'count', label: 'Membros', align: 'right' },
            ]}
          />
        </div>
      )}
    </ReportShell>
  );
}
