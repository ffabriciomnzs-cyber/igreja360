'use client';

export interface Season {
  theme: string;
  name: string;
  emoji: string;
  startDay: string;
  endDay: string;
}

/** A faixa do tema da semana. Discreta: é contexto, não é o jogo. */
export function SeasonBanner({ season }: { season: Season | null }): React.ReactElement | null {
  if (!season) return null;
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-3 text-white">
      <span className="text-2xl">{season.emoji}</span>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-indigo-200">
          Temporada desta semana
        </p>
        <p className="truncate text-sm font-bold">{season.name}</p>
      </div>
    </div>
  );
}
