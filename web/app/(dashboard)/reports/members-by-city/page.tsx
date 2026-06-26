'use client';

import { useEffect, useState } from 'react';
import { ReportShell } from '@/components/reports/ReportShell';
import { DataTable } from '@/components/reports/DataTable';
import { api, extractApiError } from '@/lib/api';
import { exportToCsv } from '@/lib/report-export';
import { ReportCityRow } from '@/lib/reports';

export default function MembersByCityReportPage(): React.ReactElement {
  const [rows, setRows] = useState<ReportCityRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    api
      .get<ReportCityRow[]>('/reports/members-by-city')
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

  const total = rows.reduce((sum, r) => sum + r.count, 0);

  const handleExport = () =>
    exportToCsv('membros-por-cidade', [
      { label: 'Cidade', value: (r: ReportCityRow) => r.city },
      { label: 'Membros', value: (r) => r.count },
    ], rows);

  return (
    <ReportShell
      title="Membros por cidade"
      description={`${rows.length} cidade(s) · ${total} membro(s).`}
      onExport={handleExport}
      loading={loading}
      error={error}
    >
      <DataTable
        rows={rows}
        getKey={(r) => r.city}
        empty="Nenhum membro cadastrado."
        columns={[
          { key: 'city', label: 'Cidade' },
          { key: 'count', label: 'Membros', align: 'right' },
        ]}
      />
    </ReportShell>
  );
}
