// Exportação de relatórios para CSV (compatível com Excel pt-BR).

export interface CsvColumn<T> {
  label: string;
  value: (row: T) => string | number | null | undefined;
}

function escapeCell(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return '';
  const text = String(value);
  if (/[";\n\r]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

export function exportToCsv<T>(
  filename: string,
  columns: CsvColumn<T>[],
  rows: T[],
): void {
  const header = columns.map((c) => escapeCell(c.label)).join(';');
  const body = rows.map((row) =>
    columns.map((c) => escapeCell(c.value(row))).join(';'),
  );
  // BOM (﻿) garante acentuação correta ao abrir no Excel.
  const csv = '﻿' + [header, ...body].join('\r\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename.endsWith('.csv') ? filename : `${filename}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
