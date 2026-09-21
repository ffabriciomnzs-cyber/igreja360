'use client';

export interface Season {
  theme: string;
  name: string;
  emoji: string;
  startDay: string;
  endDay: string;
  /** Quantas das perguntas de hoje são do tema. */
  questionsFromTheme?: number;
  questionsTotal?: number;
}

/**
 * A faixa do tema da semana. Discreta: é contexto, não é o jogo.
 *
 * Diz "tema em destaque", e não "semana de X", porque é isso que acontece: o
 * acervo raramente dá uma semana inteira de um tema só, e a faixa mostra
 * quantas das perguntas de hoje são dele. Prometer uma semana 100% temática
 * e entregar quatro perguntas seria pior do que não prometer nada.
 */
export function SeasonBanner({ season }: { season: Season | null }): React.ReactElement | null {
  if (!season) return null;
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-3 text-white">
      <span className="text-2xl">{season.emoji}</span>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-indigo-200">
          Tema em destaque
        </p>
        <p className="truncate text-sm font-bold">{season.name}</p>
        {!!season.questionsFromTheme && !!season.questionsTotal && (
          <p className="text-[11px] text-indigo-200">
            {season.questionsFromTheme === season.questionsTotal
              ? `As ${season.questionsTotal} perguntas de hoje são do tema`
              : `${season.questionsFromTheme} das ${season.questionsTotal} perguntas de hoje`}
          </p>
        )}
      </div>
    </div>
  );
}
