import { cn } from '@/lib/utils';

/**
 * Blocos cinza pulsando no formato do conteúdo, no lugar de "Carregando...".
 * A tela parece pronta antes de estar — percepção de velocidade muda muito.
 */
export function Skeleton({
  className,
}: {
  className?: string;
}): React.ReactElement {
  return (
    <div
      aria-hidden
      className={cn('animate-pulse rounded-md bg-slate-200/70', className)}
    />
  );
}

/** Lista/tabela: linhas com avatar + duas larguras de texto. */
export function ListSkeleton({
  rows = 6,
}: {
  rows?: number;
}): React.ReactElement {
  return (
    <div aria-label="Carregando" role="status" className="space-y-3 py-4">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-1">
          <Skeleton className="h-9 w-9 shrink-0 rounded-full" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-3.5 w-1/3" />
            <Skeleton className="h-3 w-1/5" />
          </div>
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
      ))}
    </div>
  );
}

/** Grade de cards (eventos, campanhas...). */
export function CardsSkeleton({
  cards = 6,
}: {
  cards?: number;
}): React.ReactElement {
  return (
    <div
      aria-label="Carregando"
      role="status"
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
    >
      {Array.from({ length: cards }).map((_, i) => (
        <div
          key={i}
          className="overflow-hidden rounded-xl border border-slate-200 bg-white"
        >
          <Skeleton className="h-36 w-full rounded-none" />
          <div className="space-y-2 p-4">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-3 w-1/2" />
            <Skeleton className="h-3 w-1/3" />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Cartões de resumo do topo (dashboard, financeiro...). */
export function StatsSkeleton({
  cards = 4,
}: {
  cards?: number;
}): React.ReactElement {
  return (
    <div
      aria-label="Carregando"
      role="status"
      className="grid grid-cols-2 gap-4 lg:grid-cols-4"
    >
      {Array.from({ length: cards }).map((_, i) => (
        <div
          key={i}
          className="space-y-2 rounded-xl border border-slate-200 bg-white p-4"
        >
          <Skeleton className="h-3 w-1/2" />
          <Skeleton className="h-7 w-1/3" />
        </div>
      ))}
    </div>
  );
}
