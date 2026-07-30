import Link from 'next/link';
import { Plus } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  /** Rota do botão de ação. Sem ela, mostra só o texto (ex.: busca vazia). */
  actionHref?: string;
  actionLabel?: string;
}

/**
 * Tela vazia como convite, não como beco: ícone, explicação curta e o botão
 * que cria o primeiro registro. Uma lista vazia é sempre o primeiro contato
 * de alguém com o módulo — é aqui que a pessoa decide se "entendeu" o sistema.
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  actionHref,
  actionLabel,
}: EmptyStateProps): React.ReactElement {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 dark:bg-indigo-950/50">
        <Icon className="h-6 w-6 text-indigo-500 dark:text-indigo-400" />
      </div>
      <p className="mt-1 text-sm font-semibold text-slate-800 dark:text-slate-200">{title}</p>
      <p className="max-w-xs text-sm text-slate-500 dark:text-slate-400">{description}</p>
      {actionHref && actionLabel && (
        <Link
          href={actionHref}
          className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-indigo-700"
        >
          <Plus className="h-4 w-4" />
          {actionLabel}
        </Link>
      )}
    </div>
  );
}
