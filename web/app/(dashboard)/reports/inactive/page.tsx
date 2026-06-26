'use client';

import { useEffect, useState } from 'react';
import { ReportShell } from '@/components/reports/ReportShell';
import { DataTable } from '@/components/reports/DataTable';
import { api, extractApiError } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { exportToCsv } from '@/lib/report-export';
import { ReportInactiveMember } from '@/lib/reports';

export default function InactiveMembersReportPage(): React.ReactElement {
  const [rows, setRows] = useState<ReportInactiveMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    api
      .get<ReportInactiveMember[]>('/reports/inactive-members')
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
    exportToCsv('membros-inativos', [
      { label: 'Nome', value: (m: ReportInactiveMember) => m.name },
      { label: 'Telefone', value: (m) => m.phone ?? '' },
      { label: 'Cidade', value: (m) => m.city ?? '' },
      { label: 'Célula', value: (m) => m.cell ?? '' },
      { label: 'Entrada', value: (m) => (m.joinedAt ? formatDate(m.joinedAt) : '') },
    ], rows);

  return (
    <ReportShell
      title="Membros inativos"
      description={`${rows.length} membro(s) inativo(s) para acompanhamento.`}
      onExport={handleExport}
      loading={loading}
      error={error}
    >
      <DataTable
        rows={rows}
        empty="Nenhum membro inativo."
        columns={[
          { key: 'name', label: 'Nome' },
          { key: 'phone', label: 'Telefone', render: (m) => m.phone ?? '—' },
          { key: 'city', label: 'Cidade', render: (m) => m.city ?? '—' },
          { key: 'cell', label: 'Célula', render: (m) => m.cell ?? '—' },
          {
            key: 'joinedAt',
            label: 'Entrada',
            render: (m) => (m.joinedAt ? formatDate(m.joinedAt) : '—'),
          },
        ]}
      />
    </ReportShell>
  );
}
