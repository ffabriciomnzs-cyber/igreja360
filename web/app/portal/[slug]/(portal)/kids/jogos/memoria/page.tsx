'use client';

import { useEffect, useState } from 'react';
import { KidsGameShell, KidsButton } from '@/components/portal/KidsGameShell';
import { cn } from '@/lib/utils';

/** Símbolos das histórias bíblicas — sem leitura, qualquer idade joga. */
const SIMBOLOS = ['🚢', '🌈', '🦁', '🐟', '⭐', '🕊️', '👑', '🐑', '🍞', '🌊'];

const NIVEIS = [
  { nome: 'Fácil', pares: 4, colunas: 'grid-cols-4' },
  { nome: 'Médio', pares: 6, colunas: 'grid-cols-4' },
  { nome: 'Difícil', pares: 8, colunas: 'grid-cols-4' },
] as const;

interface Carta {
  id: number;
  simbolo: string;
  virada: boolean;
  achada: boolean;
}

function embaralha<T>(itens: T[]): T[] {
  const arr = [...itens];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function montaBaralho(pares: number): Carta[] {
  const escolhidos = embaralha(SIMBOLOS).slice(0, pares);
  return embaralha(
    escolhidos.flatMap((s, i) => [
      { id: i * 2, simbolo: s, virada: false, achada: false },
      { id: i * 2 + 1, simbolo: s, virada: false, achada: false },
    ]),
  );
}

const RECORDE_KEY = 'igreja360.kids.memoria.recorde';

export default function MemoriaPage(): React.ReactElement {
  const [nivel, setNivel] = useState<(typeof NIVEIS)[number] | null>(null);
  const [cartas, setCartas] = useState<Carta[]>([]);
  const [jogadas, setJogadas] = useState(0);
  const [travado, setTravado] = useState(false);
  const [recordes, setRecordes] = useState<Record<string, number>>({});

  useEffect(() => {
    try {
      setRecordes(JSON.parse(localStorage.getItem(RECORDE_KEY) ?? '{}'));
    } catch {
      /* ignora */
    }
  }, []);

  const ganhou = cartas.length > 0 && cartas.every((c) => c.achada);

  // Ao ganhar, guarda o recorde (menos jogadas = melhor).
  useEffect(() => {
    if (!ganhou || !nivel) return;
    setRecordes((atual) => {
      const melhor = atual[nivel.nome];
      if (melhor && melhor <= jogadas) return atual;
      const novo = { ...atual, [nivel.nome]: jogadas };
      try {
        localStorage.setItem(RECORDE_KEY, JSON.stringify(novo));
      } catch {
        /* ignora */
      }
      return novo;
    });
  }, [ganhou, nivel, jogadas]);

  function comeca(n: (typeof NIVEIS)[number]): void {
    setNivel(n);
    setCartas(montaBaralho(n.pares));
    setJogadas(0);
    setTravado(false);
  }

  function vira(id: number): void {
    if (travado) return;
    const carta = cartas.find((c) => c.id === id);
    if (!carta || carta.virada || carta.achada) return;

    const viradas = cartas.filter((c) => c.virada && !c.achada);
    const novas = cartas.map((c) => (c.id === id ? { ...c, virada: true } : c));
    setCartas(novas);

    if (viradas.length === 1) {
      setJogadas((j) => j + 1);
      if (viradas[0].simbolo === carta.simbolo) {
        // Achou o par!
        setCartas(
          novas.map((c) =>
            c.simbolo === carta.simbolo ? { ...c, achada: true } : c,
          ),
        );
      } else {
        // Errou: mostra um instante e desvira.
        setTravado(true);
        setTimeout(() => {
          setCartas((atual) =>
            atual.map((c) => (c.achada ? c : { ...c, virada: false })),
          );
          setTravado(false);
        }, 900);
      }
    }
  }

  return (
    <KidsGameShell
      emoji="🃏"
      title="Jogo da Memória"
      subtitle="Encontre os pares das histórias da Bíblia!"
    >
      {!nivel ? (
        <div className="flex flex-col items-center gap-3 py-6">
          {NIVEIS.map((n) => (
            <button
              key={n.nome}
              onClick={() => comeca(n)}
              className="w-56 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 px-6 py-4 text-center shadow-lg transition-transform active:scale-95"
            >
              <span className="block text-lg font-bold text-white">
                {n.nome}
              </span>
              <span className="text-xs text-indigo-100">
                {n.pares} pares
                {recordes[n.nome]
                  ? ` · recorde: ${recordes[n.nome]} jogadas`
                  : ''}
              </span>
            </button>
          ))}
        </div>
      ) : ganhou ? (
        <div className="rounded-3xl bg-gradient-to-br from-emerald-400 to-teal-500 p-8 text-center text-white shadow-lg">
          <p className="text-5xl">🎉</p>
          <p className="mt-2 text-xl font-bold">Parabéns!</p>
          <p className="mt-1 text-sm text-emerald-50">
            Você achou todos os pares em {jogadas} jogadas!
            {recordes[nivel.nome] === jogadas && ' Novo recorde! 🏆'}
          </p>
          <div className="mt-4 flex justify-center gap-2">
            <KidsButton onClick={() => comeca(nivel)}>
              Jogar de novo
            </KidsButton>
            <KidsButton variant="ghost" onClick={() => setNivel(null)}>
              Trocar nível
            </KidsButton>
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between px-1 text-sm text-slate-500 dark:text-slate-400">
            <span>
              {nivel.nome} · {jogadas} jogadas
            </span>
            <button
              onClick={() => setNivel(null)}
              className="font-medium text-indigo-600 dark:text-indigo-400"
            >
              Sair
            </button>
          </div>
          <div className={cn('grid gap-2.5', nivel.colunas)}>
            {cartas.map((c) => (
              <button
                key={c.id}
                onClick={() => vira(c.id)}
                aria-label={c.virada || c.achada ? c.simbolo : 'Carta virada'}
                className={cn(
                  'aspect-square rounded-2xl text-3xl shadow transition-all duration-200 sm:text-4xl',
                  c.achada
                    ? 'scale-95 bg-emerald-100 dark:bg-emerald-900/50'
                    : c.virada
                      ? 'bg-white ring-2 ring-indigo-400 dark:bg-slate-800'
                      : 'bg-gradient-to-br from-indigo-500 to-violet-600 active:scale-95',
                )}
              >
                {c.virada || c.achada ? c.simbolo : '✨'}
              </button>
            ))}
          </div>
        </>
      )}
    </KidsGameShell>
  );
}
