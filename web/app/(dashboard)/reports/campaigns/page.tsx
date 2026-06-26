'use client';

import { useEffect, useState } from 'react';
import { ReportShell } from '@/components/reports/ReportShell';
import { DataTable } from '@/components/reports/DataTable';
import { Badge } from '@/components/ui/badge';
import { api, extractApiError } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { exportToCsv } from '@/lib/report-export';
import {
  CAMPAIGN_STATUS_LABELS,
  CAMPAIGN_STATUS_VARIANTS,
} from '@/lib/campaigns';
import { ReportCampaign } from '@/lib/reports';

export default function CampaignsReportPage(): React.ReactElement {
  const [rows, setRows] = useState<ReportCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    api
      .get<ReportCampaign[]>('/reports/campaigns')
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
    exportToCsv('campanhas', [
      { label: 'Campanha', value: (c: ReportCampaign) => c.title },
      { label: 'Tipo', value: (c) => c.type },
      { label: 'Status', value: (c) => CAMPAIGN_STATUS_LABELS[c.status] },
      { label: 'Meta', value: (c) => c.goal.toFixed(2).replace('.', ',') },
      { label: 'Arrecadado', value: (c) => c.current.toFixed(2).replace('.', ',') },
      { label: 'Progresso (%)', value: (c) => c.progress },
    ], rows);

  return (
    <ReportShell
      title="Campanhas"
      description={`${rows.length} campanha(s) cadastrada(s).`}
      onExport={handleExport}
      loading={loading}
      error={error}
    >
      <DataTable
        rows={rows}
        empty="Nenhuma campanha cadastrada."
        columns={[
          { key: 'title', label: 'Campanha' },
          { key: 'type', label: 'Tipo' },
          {
            key: 'status',
            label: 'Status',
            render: (c) => (
              <Badge variant={CAMPAIGN_STATUS_VARIANTS[c.status]}>
                {CAMPAIGN_STATUS_LABELS[c.status]}
              </Badge>
            ),
          },
          {
            key: 'goal',
            label: 'Meta',
            align: 'right',
            render: (c) => (c.goal > 0 ? formatCurrency(c.goal) : '—'),
          },
          {
            key: 'current',
            label: 'Arrecadado',
            align: 'right',
            render: (c) => formatCurrency(c.current),
          },
          {
            key: 'progress',
            label: 'Progresso',
            render: (c) =>
              c.goal > 0 ? (
                <div className="flex items-center gap-2">
                  <div className="h-2 w-24 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-indigo-500"
                      style={{ width: `${Math.min(100, c.progress)}%` }}
                    />
                  </div>
                  <span className="text-xs text-slate-500">{c.progress}%</span>
                </div>
              ) : (
                '—'
              ),
          },
        ]}
      />
    </ReportShell>
  );
}
