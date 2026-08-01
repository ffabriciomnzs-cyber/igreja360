'use client';

import { useState } from 'react';
import { KidsGameShell, KidsButton } from '@/components/portal/KidsGameShell';
import { cn } from '@/lib/utils';

/**
 * A criança toca nas cenas NA ORDEM da história. Cena certa entra na fila;
 * cena errada balança e nada se perde — errar faz parte de aprender.
 */
interface Historia {
  titulo: string;
  emoji: string;
  cenas: { emoji: string; texto: string }[];
}

const HISTORIAS: Historia[] = [
  {
    titulo: 'A Arca de Noé',
    emoji: '🚢',
    cenas: [
      { emoji: '🔨', texto: 'Noé constrói a arca' },
      { emoji: '🐘', texto: 'Os animais entram de dois em dois' },
      { emoji: '🌧️', texto: 'Chove 40 dias e 40 noites' },
      { emoji: '🕊️', texto: 'A pomba volta com um raminho' },
      { emoji: '🌈', texto: 'Deus faz o arco-íris' },
    ],
  },
  {
    titulo: 'Davi e Golias',
    emoji: '🎯',
    cenas: [
      { emoji: '🐑', texto: 'Davi cuida das ovelhas' },
      { emoji: '😠', texto: 'O gigante desafia o povo de Deus' },
      { emoji: '🪨', texto: 'Davi pega 5 pedrinhas no riacho' },
      { emoji: '💫', texto: 'A pedra da funda acerta o gigante' },
      { emoji: '🎉', texto: 'Davi vence com a ajuda de Deus' },
    ],
  },
  {
    titulo: 'Jonas e o Grande Peixe',
    emoji: '🐟',
    cenas: [
      { emoji: '🏃', texto: 'Jonas foge de barco' },
      { emoji: '⛈️', texto: 'Vem uma tempestade' },
      { emoji: '🐟', texto: 'Um peixe enorme engole Jonas' },
      { emoji: '🙏', texto: 'Jonas ora dentro do peixe' },
      { emoji: '📣', texto: 'Jonas obedece e prega em Nínive' },
    ],
  },
  {
    titulo: 'O Nascimento de Jesus',
    emoji: '⭐',
    cenas: [
      { emoji: '👼', texto: 'O anjo dá a notícia a Maria' },
      { emoji: '🐴', texto: 'Maria e José viajam para Belém' },
      { emoji: '👶', texto: 'Jesus nasce na manjedoura' },
      { emoji: '⭐', texto: 'A estrela brilha no céu' },
      { emoji: '🎁', texto: 'Os magos trazem presentes' },
    ],
  },
];

function embaralha<T>(itens: T[]): T[] {
  const arr = [...itens];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export default function HistoriaPage(): React.ReactElement {
  const [historia, setHistoria] = useState<Historia | null>(null);
  const [ordem, setOrdem] = useState<number[]>([]); // índices embaralhados por jogar
  const [proxima, setProxima] = useState(0); // próxima cena correta
  const [balanca, setBalanca] = useState<number | null>(null);

  function comeca(h: Historia): void {
    setHistoria(h);
    setOrdem(embaralha(h.cenas.map((_, i) => i)));
    setProxima(0);
    setBalanca(null);
  }

  const ganhou = historia !== null && proxima >= historia.cenas.length;

  function toca(indiceCena: number): void {
    if (!historia) return;
    if (indiceCena === proxima) {
      setProxima((p) => p + 1);
    } else {
      setBalanca(indiceCena);
      setTimeout(() => setBalanca(null), 450);
    }
  }

  return (
    <KidsGameShell
      emoji="📖"
      title="Ordene a História"
      subtitle="Toque nas cenas na ordem certinha!"
    >
      {!historia ? (
        <div className="grid grid-cols-2 gap-3 py-4">
          {HISTORIAS.map((h) => (
            <button
              key={h.titulo}
              onClick={() => comeca(h)}
              className="rounded-3xl border-2 border-indigo-100 bg-white p-4 text-center transition-transform active:scale-95 dark:border-indigo-900 dark:bg-slate-900"
            >
              <span className="text-4xl">{h.emoji}</span>
              <span className="mt-2 block text-sm font-bold text-slate-800 dark:text-slate-200">
                {h.titulo}
              </span>
            </button>
          ))}
        </div>
      ) : ganhou ? (
        <div className="rounded-3xl bg-gradient-to-br from-sky-400 to-indigo-500 p-8 text-center text-white shadow-lg">
          <p className="text-5xl">🌟</p>
          <p className="mt-2 text-xl font-bold">História completa!</p>
          <p className="mt-1 text-sm text-sky-50">
            Você montou “{historia.titulo}” na ordem certa!
          </p>
          <div className="mt-4 flex justify-center gap-2">
            <KidsButton onClick={() => comeca(historia)}>De novo</KidsButton>
            <KidsButton variant="ghost" onClick={() => setHistoria(null)}>
              Outra história
            </KidsButton>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1 text-sm text-slate-500 dark:text-slate-400">
            <span>
              {historia.emoji} {historia.titulo}
            </span>
            <button
              onClick={() => setHistoria(null)}
              className="font-medium text-indigo-600 dark:text-indigo-400"
            >
              Sair
            </button>
          </div>

          {/* A história montada até agora */}
          <div className="flex min-h-14 items-center gap-1.5 rounded-2xl bg-indigo-50 px-3 py-2 dark:bg-indigo-950/40">
            {historia.cenas.slice(0, proxima).map((c, i) => (
              <span key={i} className="text-2xl">
                {c.emoji}
              </span>
            ))}
            {proxima < historia.cenas.length && (
              <span className="ml-1 animate-pulse text-xl text-indigo-300">
                ❓
              </span>
            )}
          </div>

          <p className="px-1 text-center text-sm font-medium text-slate-600 dark:text-slate-300">
            O que vem {proxima === 0 ? 'primeiro' : 'depois'}?
          </p>

          {/* Cenas para escolher */}
          <div className="space-y-2.5">
            {/* As cenas já colocadas são exatamente as de índice < proxima. */}
            {ordem
              .filter((i) => i >= proxima)
              .map((i) => (
                <button
                  key={i}
                  onClick={() => toca(i)}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-2xl border-2 border-slate-200 bg-white px-4 py-3 text-left transition-transform active:scale-95 dark:border-slate-700 dark:bg-slate-900',
                    balanca === i && 'border-red-300 dark:border-red-800',
                  )}
                  style={
                    balanca === i
                      ? { animation: 'kidsShake 0.45s ease-in-out' }
                      : undefined
                  }
                >
                  <span className="text-3xl">{historia.cenas[i].emoji}</span>
                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                    {historia.cenas[i].texto}
                  </span>
                </button>
              ))}
          </div>
          <style>{`@keyframes kidsShake { 0%,100%{transform:translateX(0)} 25%{transform:translateX(-6px)} 75%{transform:translateX(6px)} }`}</style>
        </div>
      )}
    </KidsGameShell>
  );
}
