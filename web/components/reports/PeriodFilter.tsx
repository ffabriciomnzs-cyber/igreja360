'use client';

export interface Period {
  from: string;
  to: string;
}

function iso(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function presetThisMonth(): Period {
  const now = new Date();
  return {
    from: iso(new Date(now.getFullYear(), now.getMonth(), 1)),
    to: iso(new Date(now.getFullYear(), now.getMonth() + 1, 0)),
  };
}

export function presetThisYear(): Period {
  const now = new Date();
  return {
    from: iso(new Date(now.getFullYear(), 0, 1)),
    to: iso(new Date(now.getFullYear(), 11, 31)),
  };
}

export function presetLastMonth(): Period {
  const now = new Date();
  return {
    from: iso(new Date(now.getFullYear(), now.getMonth() - 1, 1)),
    to: iso(new Date(now.getFullYear(), now.getMonth(), 0)),
  };
}

const presets: { label: string; build: () => Period }[] = [
  { label: 'Mês atual', build: presetThisMonth },
  { label: 'Mês passado', build: presetLastMonth },
  { label: 'Este ano', build: presetThisYear },
];

export function PeriodFilter({
  value,
  onChange,
}: {
  value: Period;
  onChange: (p: Period) => void;
}): React.ReactElement {
  return (
    <div className="flex flex-wrap items-end gap-3 rounded-lg border border-border bg-white p-4">
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-500">
          De
        </label>
        <input
          type="date"
          value={value.from}
          onChange={(e) => onChange({ ...value, from: e.target.value })}
          className="rounded-md border border-border px-3 py-1.5 text-sm"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-500">
          Até
        </label>
        <input
          type="date"
          value={value.to}
          onChange={(e) => onChange({ ...value, to: e.target.value })}
          className="rounded-md border border-border px-3 py-1.5 text-sm"
        />
      </div>
      <div className="flex gap-2">
        {presets.map((p) => (
          <button
            key={p.label}
            type="button"
            onClick={() => onChange(p.build())}
            className="rounded-md border border-border px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50"
          >
            {p.label}
          </button>
        ))}
      </div>
    </div>
  );
}
