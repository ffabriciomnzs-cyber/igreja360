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

  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-white">
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
              key={
                getKey
                  ? getKey(row, i)
                  : ((row as { id?: string }).id ?? i)
              }
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
                  {c.render
                    ? c.render(row)
                    : ((row as Record<string, unknown>)[c.key] as React.ReactNode)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
