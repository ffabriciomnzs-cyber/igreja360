'use client';

import { useEffect, useState } from 'react';
import { ReportShell } from '@/components/reports/ReportShell';
import { DataTable } from '@/components/reports/DataTable';
import { Badge } from '@/components/ui/badge';
import { api, extractApiError } from '@/lib/api';
import { exportToCsv } from '@/lib/report-export';
import { ReportCell } from '@/lib/reports';

export default function CellsReportPage(): React.ReactElement {
  const [rows, setRows] = useState<ReportCell[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    api
      .get<ReportCell[]>('/reports/cells')
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
  }, []);

  const handleExport = () =>
    exportToCsv('celulas', [
      { label: 'Célula', value: (c: ReportCell) => c.name },
      { label: 'Situação', value: (c) => (c.active ? 'Ativa' : 'Inativa') },
      { label: 'Dia', value: (c) => c.dayOfWeek ?? '' },
      { label: 'Horário', value: (c) => c.time ?? '' },
      { label: 'Bairro', value: (c) => c.neighborhood ?? '' },
      { label: 'Membros', value: (c) => c.memberCount },
      { label: 'Reuniões', value: (c) => c.meetingCount },
    ], rows);

  return (
    <ReportShell
      title="Relatório de células"
      description={`${rows.length} célula(s) cadastrada(s).`}
      onExport={handleExport}
      loading={loading}
      error={error}
    >
      <DataTable
        rows={rows}
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
          { key: 'dayOfWeek', label: 'Dia', render: (c) => c.dayOfWeek ?? '—' },
          { key: 'time', label: 'Horário', render: (c) => c.time ?? '—' },
          {
            key: 'neighborhood',
            label: 'Bairro',
            render: (c) => c.neighborhood ?? '—',
          },
          { key: 'memberCount', label: 'Membros', align: 'right' },
          { key: 'meetingCount', label: 'Reuniões', align: 'right' },
        ]}
      />
    </ReportShell>
  );
}
