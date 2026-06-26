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
import { api, extractApiError } from '@/lib/api';
import { formatDateTime } from '@/lib/utils';
import { exportToCsv } from '@/lib/report-export';
import { ReportEvent } from '@/lib/reports';

export default function EventsReportPage(): React.ReactElement {
  const [rows, setRows] = useState<ReportEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<Period>(presetThisYear());

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    api
      .get<ReportEvent[]>('/reports/events', {
        params: { from: period.from, to: period.to },
      })
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
  }, [period]);

  const handleExport = () =>
    exportToCsv('eventos', [
      { label: 'Data', value: (e: ReportEvent) => formatDateTime(e.date) },
      { label: 'Evento', value: (e) => e.name },
      { label: 'Tipo', value: (e) => e.type ?? '' },
      { label: 'Local', value: (e) => e.location ?? '' },
      { label: 'Capacidade', value: (e) => e.capacity ?? '' },
    ], rows);

  return (
    <ReportShell
      title="Eventos"
      description={`${rows.length} evento(s) no período.`}
      onExport={handleExport}
      filters={<PeriodFilter value={period} onChange={setPeriod} />}
      loading={loading}
      error={error}
    >
      <DataTable
        rows={rows}
        empty="Nenhum evento no período."
        columns={[
          { key: 'date', label: 'Data', render: (e) => formatDateTime(e.date) },
          { key: 'name', label: 'Evento' },
          {
            key: 'type',
            label: 'Tipo',
            render: (e) => (e.type ? <Badge>{e.type}</Badge> : '—'),
          },
          { key: 'location', label: 'Local', render: (e) => e.location ?? '—' },
          {
            key: 'capacity',
            label: 'Capacidade',
            align: 'right',
            render: (e) => e.capacity ?? '—',
          },
        ]}
      />
    </ReportShell>
  );
}
