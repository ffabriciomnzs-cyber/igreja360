'use client';

// Aviso ÚNICO das regras novas da Arena Bíblica.
// Aparece uma vez só, no próximo acesso ao portal, e some para sempre.
// A versão na chave é o mecanismo: subir a versão faz o aviso voltar para
// TODO mundo, inclusive quem já leu o anterior — que é exatamente o que se
// quer quando a regra do jogo muda. v1: ciclo semanal. v2: cronômetro.
// v3: botão de começar + rodada completa.

import { useEffect, useState } from 'react';
import { Crown, Timer, PlayCircle, ListChecks } from 'lucide-react';

const CHAVE = 'igreja360.arena.regras.v3';

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
      icone: PlayCircle,
      titulo: 'Você decide quando o relógio começa',
      texto:
        'Entrar na Arena não inicia mais a contagem. A pergunta fica escondida até você tocar em "Começar" — aí ela aparece e o cronômetro liga. Dá para abrir o app na fila do mercado sem perder ponto.',
    },
    {
      icone: Timer,
      titulo: 'Cada pergunta tem 20 segundos',
      texto:
        'É pouco de propósito: dá para ler e decidir, não dá para consultar. Passou do tempo, aquela pergunta vale 0 e não volta — e sair do app não pausa o relógio.',
    },
    {
      icone: ListChecks,
      titulo: 'Os pontos só valem com a rodada inteira',
      texto:
        'São 12 perguntas por dia, e o seu placar do dia só entra no ranking depois que você enfrentar as 12. Parar no meio não pontua. Errar tudo, sim: o que conta é terminar, não acertar.',
    },
    {
      icone: Crown,
      titulo: 'A coroa continua sendo no domingo',
      texto:
        '10 pontos por acerto, e a disputa fecha no sábado. No domingo, quem estiver em 1º aparece com a coroa na tela inicial — e agora dá para compartilhar isso no status do WhatsApp.',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-[2px] p-4">
      <div className="mx-auto my-auto flex min-h-full max-w-md items-center">
        <div className="w-full rounded-3xl bg-white p-6 shadow-2xl dark:bg-slate-900">
          <div className="text-center">
            <p className="text-4xl">⏱️</p>
            <h2 className="mt-2 text-lg font-bold text-slate-900 dark:text-slate-100">
              A Arena mudou de novo!
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Duas novidades importantes. Leia antes de jogar:
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
