'use client';

import Link from 'next/link';
import { ArrowLeft, Printer, Download, Loader2 } from 'lucide-react';

export function ReportShell({
  title,
  description,
  onExport,
  filters,
  loading,
  error,
  children,
}: {
  title: string;
  description?: string;
  onExport?: () => void;
  filters?: React.ReactNode;
  loading?: boolean;
  error?: string | null;
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <div>
      <Link
        href="/reports"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 print:hidden"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar aos relatórios
      </Link>

      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{title}</h1>
          {description && (
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{description}</p>
          )}
        </div>
        <div className="flex gap-2 print:hidden">
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 rounded-md border border-border bg-white dark:bg-slate-900 px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60"
          >
            <Printer className="h-4 w-4" />
            Imprimir / PDF
          </button>
          {onExport && (
            <button
              type="button"
              onClick={onExport}
              className="inline-flex items-center gap-1.5 rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
              <Download className="h-4 w-4" />
              Excel / CSV
            </button>
          )}
        </div>
      </div>

      {filters && <div className="mb-5 print:hidden">{filters}</div>}

      {error ? (
        <div className="rounded-md bg-red-50 dark:bg-red-950/40 px-4 py-3 text-sm text-red-700 dark:text-red-300">
          {error}
        </div>
      ) : loading ? (
        <div className="flex items-center justify-center gap-2 py-16 text-sm text-slate-500 dark:text-slate-400">
          <Loader2 className="h-4 w-4 animate-spin" />
          Carregando relatório...
        </div>
      ) : (
        children
      )}
    </div>
  );
}
