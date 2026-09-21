'use client';

export interface Highlight {
  id: string;
  emoji: string;
  title: string;
  name: string;
  photo: string | null;
  value: string;
}

/** Destaques da semana fechada. Não repete o Líder, que tem card próprio. */
export function Highlights({ items }: { items: Highlight[] }): React.ReactElement | null {
  if (!items.length) return null;
  return (
    <section>
      <h2 className="mb-2 text-sm font-bold text-slate-800 dark:text-slate-200">
        Destaques da semana
      </h2>
      <div className="grid grid-cols-2 gap-2">
        {items.map((d) => (
          <div
            key={d.id}
            className="rounded-2xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900"
          >
            <p className="text-lg">{d.emoji}</p>
            <p className="mt-0.5 text-[11px] font-medium uppercase tracking-wide text-slate-400">
              {d.title}
            </p>
            <p className="truncate text-sm font-bold text-slate-800 dark:text-slate-200">
              {d.name}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">{d.value}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
