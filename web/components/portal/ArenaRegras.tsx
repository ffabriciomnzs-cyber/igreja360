'use client';

// Aviso ÚNICO das regras novas da Arena Bíblica (ciclo semanal + campeão).
// Aparece uma vez só, no próximo acesso ao portal, e some para sempre.
// A chave leva ".v1": se um dia a regra mudar de novo, basta subir a versão
// para o aviso voltar a aparecer sem afetar quem já leu o antigo.

import { useEffect, useState } from 'react';
import { Crown, CalendarDays, Swords, Trophy } from 'lucide-react';

const CHAVE = 'igreja360.arena.regras.v1';

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
      icone: CalendarDays,
      titulo: 'A disputa agora é por semana',
      texto:
        'Cada ciclo vai de domingo a sábado. No sábado a contagem fecha, e tudo recomeça do zero no domingo — quem começou devagar tem chance nova toda semana.',
    },
    {
      icone: Crown,
      titulo: 'No domingo sai o campeão',
      texto:
        'Quem fizer mais pontos na semana aparece com a coroa na tela inicial do app, com foto e nome, para a igreja inteira ver — e fica em destaque a semana toda.',
    },
    {
      icone: Swords,
      titulo: 'Como pontuar',
      texto:
        'São 12 perguntas novas por dia, 10 pontos por acerto. Cada pergunta vale uma tentativa só, então leia com calma. Jogar todo dia é o que ganha a semana.',
    },
    {
      icone: Trophy,
      titulo: 'E a pontuação de agora?',
      texto:
        'Nada se perde: tudo o que você já fez conta para este primeiro ciclo, que fecha neste sábado. No domingo teremos o primeiro campeão da história da Arena.',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-[2px] p-4">
      <div className="mx-auto my-auto flex min-h-full max-w-md items-center">
        <div className="w-full rounded-3xl bg-white p-6 shadow-2xl dark:bg-slate-900">
          <div className="text-center">
            <p className="text-4xl">👑</p>
            <h2 className="mt-2 text-lg font-bold text-slate-900 dark:text-slate-100">
              A Arena Bíblica mudou!
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Agora tem campeão toda semana. Veja como funciona:
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
            Entendi, quero jogar
          </button>
        </div>
      </div>
    </div>
  );
}
