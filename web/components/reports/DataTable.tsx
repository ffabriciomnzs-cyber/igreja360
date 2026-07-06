'use client';

import { cn } from '@/lib/utils';

export interface Column<T> {
  key: string;
  label: string;
  align?: 'left' | 'right' | 'center';
  render?: (row: T) => React.ReactNode;
}

export function DataTable<T>({
  columns,
  rows,
  empty = 'Nenhum registro encontrado.',
  getKey,
}: {
  columns: Column<T>[];
  rows: T[];
  empty?: string;
  getKey?: (row: T, index: number) => string;
}): React.ReactElement {
  if (rows.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-white py-12 text-center text-sm text-slate-400">
        {empty}
      </div>
    );
  }

  const alignClass = (align?: 'left' | 'right' | 'center') =>
    align === 'right'
      ? 'text-right'
      : align === 'center'
        ? 'text-center'
        : 'text-left';

  const rowKey = (row: T, i: number): string =>
    getKey ? getKey(row, i) : ((row as { id?: string }).id ?? String(i));

  const cellValue = (row: T, c: Column<T>): React.ReactNode =>
    c.render
      ? c.render(row)
      : ((row as Record<string, unknown>)[c.key] as React.ReactNode);

  return (
    <>
      {/* Tabela (desktop/tablet) */}
      <div className="hidden overflow-x-auto rounded-lg border border-border bg-white md:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-slate-50">
              {columns.map((c) => (
                <th
                  key={c.key}
                  className={cn(
                    'px-4 py-2.5 font-semibold text-slate-600',
                    alignClass(c.align),
                  )}
                >
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr
                key={rowKey(row, i)}
                className="border-b border-border last:border-0 hover:bg-slate-50"
              >
                {columns.map((c) => (
                  <td
                    key={c.key}
                    className={cn(
                      'px-4 py-2.5 text-slate-700',
                      alignClass(c.align),
                    )}
                  >
                    {cellValue(row, c)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Cards empilhados (celular) */}
      <div className="space-y-2.5 md:hidden">
        {rows.map((row, i) => (
          <div
            key={rowKey(row, i)}
            className="rounded-xl border border-border bg-white p-3 shadow-sm"
          >
            {columns.map((c) => (
              <div
                key={c.key}
                className="flex items-start justify-between gap-3 border-b border-slate-100 py-1.5 text-sm last:border-0"
              >
                <span className="shrink-0 text-xs font-medium uppercase tracking-wide text-slate-400">
                  {c.label}
                </span>
                <span className="text-right font-medium text-slate-700">
                  {cellValue(row, c)}
                </span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </>
  );
}
