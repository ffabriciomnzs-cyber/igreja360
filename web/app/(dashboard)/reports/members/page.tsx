'use client';

import { useEffect, useState } from 'react';
import { ReportShell } from '@/components/reports/ReportShell';
import { DataTable } from '@/components/reports/DataTable';
import { Badge } from '@/components/ui/badge';
import { api, extractApiError } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { exportToCsv } from '@/lib/report-export';
import {
  STATUS_LABELS,
  STATUS_VARIANTS,
  STATUS_OPTIONS,
  ROLE_LABELS,
  ROLE_OPTIONS,
} from '@/lib/members';
import { ReportMember } from '@/lib/reports';

export default function MembersReportPage(): React.ReactElement {
  const [rows, setRows] = useState<ReportMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState('');
  const [role, setRole] = useState('');

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    const params: Record<string, string> = {};
    if (status) params.status = status;
    if (role) params.role = role;
    api
      .get<ReportMember[]>('/reports/members', { params })
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
  }, [status, role]);

  const handleExport = () =>
    exportToCsv('membros', [
      { label: 'Nome', value: (m: ReportMember) => m.name },
      { label: 'Status', value: (m) => STATUS_LABELS[m.status] },
      { label: 'Cargo', value: (m) => (m.role ? ROLE_LABELS[m.role] : '') },
      { label: 'Célula', value: (m) => m.cell ?? '' },
      { label: 'Cidade', value: (m) => m.city ?? '' },
      { label: 'Telefone', value: (m) => m.phone ?? '' },
      { label: 'E-mail', value: (m) => m.email ?? '' },
      { label: 'Entrada', value: (m) => (m.joinedAt ? formatDate(m.joinedAt) : '') },
    ], rows);

  const filters = (
    <div className="flex flex-wrap items-end gap-3 rounded-lg border border-border bg-white p-4">
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-500">
          Status
        </label>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="rounded-md border border-border px-3 py-1.5 text-sm"
        >
          <option value="">Todos</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABELS[s]}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-500">
          Cargo
        </label>
        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="rounded-md border border-border px-3 py-1.5 text-sm"
        >
          <option value="">Todos</option>
          {ROLE_OPTIONS.map((r) => (
            <option key={r} value={r}>
              {ROLE_LABELS[r]}
            </option>
          ))}
        </select>
      </div>
    </div>
  );

  return (
    <ReportShell
      title="Lista de membros"
      description={`${rows.length} membro(s) encontrado(s).`}
      onExport={handleExport}
      filters={filters}
      loading={loading}
      error={error}
    >
      <DataTable
        rows={rows}
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
          { key: 'role', label: 'Cargo', render: (m) => (m.role ? ROLE_LABELS[m.role] : '—') },
          { key: 'cell', label: 'Célula', render: (m) => m.cell ?? '—' },
          { key: 'city', label: 'Cidade', render: (m) => m.city ?? '—' },
          { key: 'phone', label: 'Telefone', render: (m) => m.phone ?? '—' },
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
