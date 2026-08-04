'use client';

// Explicativo do Devocional no primeiro acesso à aba. Aparece uma vez só e
// pode ser revisto pelo botão "Como funciona" no rodapé da tela.
// Mesma linguagem visual do tour do portal (PortalTour).

import { useEffect, useState } from 'react';

const INTRO_KEY = 'igreja360.devocional.intro';
export const ABRIR_INTRO_DEVOCIONAL = 'igreja360:abrir-intro-devocional';

interface Passo {
  emoji: string;
  titulo: string;
  texto: string;
}

const PASSOS: Passo[] = [
  {
    emoji: '📖',
    titulo: 'Uma palavra por dia',
    texto:
      'Todo dia um versículo novo com uma reflexão curta. Leva uns 2 minutos — dá para fazer antes de sair de casa.',
  },
  {
    emoji: '✨',
    titulo: 'Pensamento de hoje',
    texto:
      'A frase em destaque é feita para guardar (ou compartilhar). Toque no ícone ao lado dela para mandar no WhatsApp ou no status.',
  },
  {
    emoji: '✍️',
    titulo: 'Pergunta e diário',
    texto:
      'Toda leitura vem com uma pergunta. Responda no seu diário: só você enxerga o que escrever ali.',
  },
  {
    emoji: '🔥',
    titulo: 'Marque como lido',
    texto:
      'Ao terminar, toque em "Marcar como lido". Os dias seguidos vão se somando no rodapé — e é bonito ver a sequência crescer.',
  },
  {
    emoji: '🧭',
    titulo: 'Trilhas de 7 dias',
    texto:
      'Passando por ansiedade, luto ou gratidão? Escolha uma trilha e receba 7 dias sobre esse tema, um por dia.',
  },
];

export function DevocionalIntro(): React.ReactElement | null {
  const [aberto, setAberto] = useState(false);
  const [passo, setPasso] = useState(0);

  useEffect(() => {
    try {
      if (!localStorage.getItem(INTRO_KEY)) {
        // Deixa a tela pintar antes de cobrir com o explicativo.
        const t = setTimeout(() => setAberto(true), 700);
        return () => clearTimeout(t);
      }
    } catch {
      /* sem localStorage: não insiste */
    }
    return undefined;
  }, []);

  useEffect(() => {
    const abre = (): void => {
      setPasso(0);
      setAberto(true);
    };
    window.addEventListener(ABRIR_INTRO_DEVOCIONAL, abre);
    return () => window.removeEventListener(ABRIR_INTRO_DEVOCIONAL, abre);
  }, []);

  function fecha(): void {
    setAberto(false);
    try {
      localStorage.setItem(INTRO_KEY, String(Date.now()));
    } catch {
      /* ignora */
    }
  }

  function avanca(): void {
    if (passo >= PASSOS.length - 1) {
      fecha();
      return;
    }
    setPasso((p) => p + 1);
  }

  if (!aberto) return null;
  const atual = PASSOS[passo];
  const ultimo = passo === PASSOS.length - 1;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-[2px]">
      <div className="absolute inset-x-4 top-1/2 mx-auto max-w-sm -translate-y-1/2 rounded-3xl bg-white p-6 text-center shadow-2xl dark:bg-slate-900">
        <p className="text-3xl">{atual.emoji}</p>
        <p className="mt-1.5 text-lg font-bold text-slate-900 dark:text-slate-100">
          {atual.titulo}
        </p>
        <p className="mt-1.5 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
          {atual.texto}
        </p>

        <div className="mt-5 flex items-center justify-between">
          <div className="flex gap-1">
            {PASSOS.map((_, i) => (
              <span
                key={i}
                className={`h-1.5 rounded-full transition-all ${
                  i === passo
                    ? 'w-5 bg-indigo-500'
                    : 'w-1.5 bg-slate-200 dark:bg-slate-700'
                }`}
              />
            ))}
          </div>
          <div className="flex items-center gap-3">
            {!ultimo && (
              <button
                onClick={fecha}
                className="text-xs font-medium text-slate-400 dark:text-slate-500"
              >
                Pular
              </button>
            )}
            <button
              onClick={avanca}
              className="rounded-xl bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
            >
              {ultimo ? 'Começar' : 'Próximo'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
