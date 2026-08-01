'use client';

import { useState } from 'react';
import { KidsGameShell, KidsButton } from '@/components/portal/KidsGameShell';
import { cn } from '@/lib/utils';

/**
 * Quatro figuras, uma não pertence ao grupo. Zero leitura obrigatória —
 * a dica em texto ajuda os pais a conversarem sobre a história.
 */
interface Rodada {
  dica: string;
  certos: [string, string, string];
  intruso: string;
}

const RODADAS: Rodada[] = [
  { dica: 'Quem entrou na arca de Noé?', certos: ['🦁', '🐘', '🐒'], intruso: '🚗' },
  { dica: 'Coisas da história do dilúvio', certos: ['🚢', '🌧️', '🌈'], intruso: '📱' },
  { dica: 'Coisas que Davi usou contra o gigante', certos: ['🪨', '🎯', '🐑'], intruso: '🚀' },
  { dica: 'Coisas do nascimento de Jesus', certos: ['⭐', '👶', '🎁'], intruso: '🎃' },
  { dica: 'Quem viveu histórias com animais?', certos: ['🦁', '🐟', '🐴'], intruso: '🦖' },
  { dica: 'Comidas que aparecem na Bíblia', certos: ['🍞', '🐟', '🍇'], intruso: '🍔' },
  { dica: 'Coisas do céu que Deus criou', certos: ['☀️', '🌙', '⭐'], intruso: '💡' },
  { dica: 'Instrumentos de louvor', certos: ['🎺', '🪕', '🥁'], intruso: '📺' },
  { dica: 'Água na Bíblia', certos: ['🌊', '🌧️', '⛵'], intruso: '🧊' },
  { dica: 'Animais que aparecem na Bíblia', certos: ['🐑', '🕊️', '🐟'], intruso: '🐧' },
];

function embaralha<T>(itens: T[]): T[] {
  const arr = [...itens];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

const POR_JOGO = 6;

export default function IntrusoPage(): React.ReactElement {
  const [rodadas, setRodadas] = useState<Rodada[] | null>(null);
  const [indice, setIndice] = useState(0);
  const [acertos, setAcertos] = useState(0);
  const [opcoes, setOpcoes] = useState<string[]>([]);
  const [escolha, setEscolha] = useState<string | null>(null);

  function prepara(r: Rodada): void {
    setOpcoes(embaralha([...r.certos, r.intruso]));
    setEscolha(null);
  }

  function comeca(): void {
    const sorteadas = embaralha(RODADAS).slice(0, POR_JOGO);
    setRodadas(sorteadas);
    setIndice(0);
    setAcertos(0);
    prepara(sorteadas[0]);
  }

  const rodada = rodadas?.[indice];
  const acabou = rodadas && indice >= rodadas.length;

  function toca(emoji: string): void {
    if (!rodada || escolha !== null) return;
    setEscolha(emoji);
    if (emoji === rodada.intruso) setAcertos((a) => a + 1);
    setTimeout(() => {
      const prox = indice + 1;
      setIndice(prox);
      if (rodadas && prox < rodadas.length) prepara(rodadas[prox]);
    }, 1100);
  }

  return (
    <KidsGameShell
      emoji="🔍"
      title="Ache o Intruso"
      subtitle="Qual figura NÃO pertence ao grupo?"
    >
      {!rodadas ? (
        <div className="flex flex-col items-center gap-3 py-8">
          <p className="text-center text-sm text-slate-500 dark:text-slate-400">
            {POR_JOGO} desafios: descubra quem entrou na história errada!
          </p>
          <KidsButton onClick={comeca}>Começar! 🕵️</KidsButton>
        </div>
      ) : acabou ? (
        <div className="rounded-3xl bg-gradient-to-br from-fuchsia-500 to-purple-600 p-8 text-center text-white shadow-lg">
          <p className="text-5xl">🕵️</p>
          <p className="mt-2 text-xl font-bold">
            {acertos === POR_JOGO
              ? 'Detetive perfeito!'
              : acertos >= POR_JOGO - 2
                ? 'Grande detetive!'
                : 'Bom trabalho, detetive!'}
          </p>
          <p className="mt-1 text-sm text-fuchsia-100">
            Você achou {acertos} de {POR_JOGO} intrusos.
          </p>
          <div className="mt-4">
            <KidsButton onClick={comeca}>Jogar de novo</KidsButton>
          </div>
        </div>
      ) : rodada ? (
        <div className="space-y-4">
          <div className="flex justify-center gap-1">
            {rodadas.map((_, i) => (
              <span
                key={i}
                className={cn(
                  'h-2 w-8 rounded-full',
                  i < indice
                    ? 'bg-fuchsia-400'
                    : i === indice
                      ? 'bg-indigo-500'
                      : 'bg-slate-200 dark:bg-slate-700',
                )}
              />
            ))}
          </div>
          <p className="text-center text-base font-bold text-slate-800 dark:text-slate-200">
            {rodada.dica}
          </p>
          <div className="grid grid-cols-2 gap-3">
            {opcoes.map((emoji) => {
              const ehIntruso = emoji === rodada.intruso;
              const revelado = escolha !== null;
              return (
                <button
                  key={emoji}
                  onClick={() => toca(emoji)}
                  disabled={revelado}
                  className={cn(
                    'aspect-square rounded-3xl border-2 text-6xl shadow-sm transition-all duration-200',
                    revelado && ehIntruso
                      ? 'scale-105 border-emerald-400 bg-emerald-50 dark:bg-emerald-950/40'
                      : revelado && emoji === escolha
                        ? 'border-red-300 bg-red-50 opacity-70 dark:bg-red-950/40'
                        : revelado
                          ? 'border-slate-200 opacity-40 dark:border-slate-700'
                          : 'border-slate-200 bg-white active:scale-95 dark:border-slate-700 dark:bg-slate-900',
                  )}
                >
                  {emoji}
                  {revelado && ehIntruso && (
                    <span className="block text-xs font-bold text-emerald-600 dark:text-emerald-400">
                      intruso!
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </KidsGameShell>
  );
}
