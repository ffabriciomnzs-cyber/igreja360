'use client';

// Aviso ÚNICO das regras novas da Arena Bíblica.
// Aparece uma vez só, no próximo acesso ao portal, e some para sempre.
// A versão na chave é o mecanismo: subir de .v1 (ciclo semanal) para .v2
// (cronômetro) faz o aviso voltar para TODO mundo, inclusive quem já leu o
// anterior — que é exatamente o que se quer quando a regra do jogo muda.

import { useEffect, useState } from 'react';
import { Crown, Timer, TimerOff, RotateCcw } from 'lucide-react';

const CHAVE = 'igreja360.arena.regras.v2';

export function ArenaRegras(): React.ReactElement | null {
  const [aberto, setAberto] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(CHAVE)) {
        // Deixa a tela inicial pintar antes de cobrir com o aviso.
        const t = setTimeout(() => setAberto(true), 900);
        return () => clearTimeout(t);
      }
    } catch {
      /* sem localStorage: não insiste */
    }
    return undefined;
  }, []);

  function fecha(): void {
    setAberto(false);
    try {
      localStorage.setItem(CHAVE, String(Date.now()));
    } catch {
      /* ignora */
    }
  }

  if (!aberto) return null;

  const itens = [
    {
      icone: Timer,
      titulo: 'Agora cada pergunta tem 30 segundos',
      texto:
        'O relógio começa a correr assim que a pergunta aparece na tela. Dá tempo de ler com calma e pensar — mas não dá para consultar. Responder rápido virou parte do jogo.',
    },
    {
      icone: TimerOff,
      titulo: 'Acabou o tempo, a pergunta se fecha',
      texto:
        'Sem resposta dentro dos 30 segundos, aquela pergunta vale 0 ponto e não volta. E não adianta sair do app para ganhar tempo: o relógio continua correndo do lado de fora.',
    },
    {
      icone: RotateCcw,
      titulo: 'A largada é a mesma para todo mundo',
      texto:
        'A semana virou neste domingo, então o placar está zerado para a igreja inteira. E chegaram quase 100 perguntas novas: agora dá mais de um mês de desafio sem nenhuma se repetir.',
    },
    {
      icone: Crown,
      titulo: 'O resto continua igual',
      texto:
        'São 12 perguntas por dia, 10 pontos por acerto, e a disputa fecha no sábado. No domingo, quem estiver em 1º aparece com a coroa na tela inicial para todos verem.',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-[2px] p-4">
      <div className="mx-auto my-auto flex min-h-full max-w-md items-center">
        <div className="w-full rounded-3xl bg-white p-6 shadow-2xl dark:bg-slate-900">
          <div className="text-center">
            <p className="text-4xl">⏱️</p>
            <h2 className="mt-2 text-lg font-bold text-slate-900 dark:text-slate-100">
              A Arena ficou mais difícil!
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Chegou o cronômetro. Veja o que mudou:
            </p>
          </div>

          <div className="mt-5 space-y-4">
            {itens.map((item) => {
              const Icone = item.icone;
              return (
                <div key={item.titulo} className="flex gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400">
                    <Icone className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                      {item.titulo}
                    </p>
                    <p className="mt-0.5 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                      {item.texto}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <button
            onClick={fecha}
            className="mt-6 w-full rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            Entendi, bora jogar
          </button>
        </div>
      </div>
    </div>
  );
}
