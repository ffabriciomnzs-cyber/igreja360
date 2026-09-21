'use client';

import { Users } from 'lucide-react';

export interface Mission {
  id: string;
  title: string;
  kind: string;
  target: number;
  progress: number;
  reward: string | null;
}

/** Meta da igreja inteira. É a única barra que não fala de você. */
export function MissionBar({ mission }: { mission: Mission | null }): React.ReactElement | null {
  if (!mission) return null;
  const pct = Math.min(100, Math.round((mission.progress / mission.target) * 100));
  const cumprida = mission.progress >= mission.target;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center gap-2">
        <Users className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
        <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200">
          Missão da igreja
        </h2>
      </div>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{mission.title}</p>

      <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
        <div
          className={`h-full rounded-full transition-all ${cumprida ? 'bg-emerald-500' : 'bg-indigo-500'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="mt-1.5 flex items-center justify-between text-xs">
        <span className="font-semibold tabular-nums text-slate-700 dark:text-slate-300">
          {mission.progress.toLocaleString('pt-BR')} de{' '}
          {mission.target.toLocaleString('pt-BR')}
        </span>
        <span className="text-slate-400">{pct}%</span>
      </div>
      {cumprida && (
        <p className="mt-2 rounded-xl bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
          🎉 Meta alcançada! {mission.reward ?? 'A igreja conseguiu junto.'}
        </p>
      )}
    </section>
  );
}
