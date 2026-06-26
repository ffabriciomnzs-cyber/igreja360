'use client';

import { useEffect, useState } from 'react';
import { ReportShell } from '@/components/reports/ReportShell';
import { DataTable } from '@/components/reports/DataTable';
import { api, extractApiError } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { exportToCsv } from '@/lib/report-export';
import { ReportBirthday } from '@/lib/reports';

const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

export default function BirthdaysReportPage(): React.ReactElement {
  const [rows, setRows] = useState<ReportBirthday[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [type, setType] = useState<'birth' | 'baptism'>('birth');
  const [month, setMonth] = useState(new Date().getMonth() + 1);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    api
      .get<ReportBirthday[]>('/reports/birthdays', {
        params: { type, month },
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
  }, [type, month]);

  const dayOf = (iso: string) => {
    const m = iso.match(/^\d{4}-\d{2}-(\d{2})/);
    return m ? m[1] : formatDate(iso);
  };

  const label = type === 'birth' ? 'nascimento' : 'batismo';

  const handleExport = () =>
    exportToCsv(`aniversariantes-${label}-${MONTHS[month - 1]}`, [
      { label: 'Dia', value: (b: ReportBirthday) => dayOf(b.date) },
      { label: 'Nome', value: (b) => b.name },
      { label: 'Telefone', value: (b) => b.phone ?? '' },
      { label: 'Data', value: (b) => formatDate(b.date) },
    ], rows);

  const filters = (
    <div className="flex flex-wrap items-end gap-3 rounded-lg border border-border bg-white p-4">
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-500">
          Tipo
        </label>
        <select
          value={type}
          onChange={(e) => setType(e.target.value as 'birth' | 'baptism')}
          className="rounded-md border border-border px-3 py-1.5 text-sm"
        >
          <option value="birth">Aniversário de nascimento</option>
          <option value="baptism">Aniversário de batismo</option>
        </select>
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-500">
          Mês
        </label>
        <select
          value={month}
          onChange={(e) => setMonth(Number(e.target.value))}
          className="rounded-md border border-border px-3 py-1.5 text-sm"
        >
          {MONTHS.map((m, i) => (
            <option key={m} value={i + 1}>
              {m}
            </option>
          ))}
        </select>
      </div>
    </div>
  );

  return (
    <ReportShell
      title="Aniversariantes"
      description={`Aniversário de ${label} — ${MONTHS[month - 1]} (${rows.length}).`}
      onExport={handleExport}
      filters={filters}
      loading={loading}
      error={error}
    >
      <DataTable
        rows={rows}
        empty="Nenhum aniversariante neste mês."
        columns={[
          { key: 'day', label: 'Dia', align: 'center', render: (b) => dayOf(b.date) },
          { key: 'name', label: 'Nome' },
          { key: 'phone', label: 'Telefone', render: (b) => b.phone ?? '—' },
          { key: 'date', label: 'Data', render: (b) => formatDate(b.date) },
        ]}
      />
    </ReportShell>
  );
}
