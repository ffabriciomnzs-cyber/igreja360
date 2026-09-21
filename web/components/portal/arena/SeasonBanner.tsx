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
 * O tema, como LINHA dentro do card do jogo — não como faixa própria.
 *
 * Era um gradiente violeta ocupando a largura inteira acima da Arena do dia, e
 * competia com o botão de jogar sendo apenas contexto. Aqui ele informa sem
 * disputar. Diz "tema em destaque" e mostra quantas das perguntas de hoje são
 * dele: o acervo raramente dá uma semana inteira de um tema só, e prometer
 * isso para entregar quatro perguntas seria pior do que não prometer nada.
 */
export function SeasonBanner({ season }: { season: Season | null }): React.ReactElement | null {
  if (!season) return null;
  // "5 de 12" parecia "pergunta 5 de 12". O número precisa dizer o que é.
  const parcial =
    !!season.questionsFromTheme &&
    !!season.questionsTotal &&
    season.questionsFromTheme < season.questionsTotal;

  return (
    <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-2.5 dark:border-slate-800">
      <span className="text-base">{season.emoji}</span>
      <span className="min-w-0 flex-1 truncate text-xs text-slate-500 dark:text-slate-400">
        Tema em destaque:{' '}
        <span className="font-semibold text-slate-700 dark:text-slate-300">
          {season.name}
        </span>
        {parcial &&
          ` · ${season.questionsFromTheme} perguntas temáticas hoje`}
      </span>
    </div>
  );
}
