'use client';

import { useState } from 'react';
import { KidsGameShell, KidsButton } from '@/components/portal/KidsGameShell';
import { cn } from '@/lib/utils';

/**
 * Perguntas BEM fáceis, com emoji nas alternativas — para quem está
 * aprendendo a ler (ou para os pais lerem junto). Sem ranking, sem pressão:
 * só estrelinhas e festa no final.
 */
interface Pergunta {
  q: string;
  opcoes: [string, string, string];
  certa: 0 | 1 | 2;
}

const PERGUNTAS: Pergunta[] = [
  { q: 'Quem construiu a arca dos animais?', opcoes: ['👴 Noé', '👑 Davi', '💪 Sansão'], certa: 0 },
  { q: 'Quantos dias e noites choveu no dilúvio?', opcoes: ['🖐️ 5', '4️⃣0️⃣ 40', '💯 100'], certa: 1 },
  { q: 'O que apareceu no céu depois do dilúvio?', opcoes: ['🌈 Arco-íris', '⚡ Raio', '☁️ Nuvem'], certa: 0 },
  { q: 'Quem foi engolido por um peixe grandão?', opcoes: ['🧔 Pedro', '🏃 Jonas', '👴 Moisés'], certa: 1 },
  { q: 'Quem venceu o gigante Golias?', opcoes: ['🎯 Davi', '🦁 Daniel', '👑 Salomão'], certa: 0 },
  { q: 'Com o que Davi venceu o gigante?', opcoes: ['🗡️ Espada', '🪨 Pedra e funda', '🏹 Flecha'], certa: 1 },
  { q: 'Onde Daniel foi jogado?', opcoes: ['🦁 Cova dos leões', '🌊 Mar', '🕳️ Poço'], certa: 0 },
  { q: 'Em que cidade Jesus nasceu?', opcoes: ['🏙️ Jerusalém', '⭐ Belém', '⛵ Nazaré'], certa: 1 },
  { q: 'Onde o bebê Jesus foi colocado ao nascer?', opcoes: ['🛏️ Numa cama', '🧺 Numa manjedoura', '🛶 Num barco'], certa: 1 },
  { q: 'O que guiou os magos até Jesus?', opcoes: ['⭐ Uma estrela', '🗺️ Um mapa', '🕊️ Uma pomba'], certa: 0 },
  { q: 'Quantos amigos especiais (apóstolos) Jesus escolheu?', opcoes: ['🔟 10', '1️⃣2️⃣ 12', '2️⃣0️⃣ 20'], certa: 1 },
  { q: 'O que Jesus multiplicou para alimentar a multidão?', opcoes: ['🍞🐟 Pães e peixes', '🍎 Maçãs', '🍚 Arroz'], certa: 0 },
  { q: 'Jesus andou por cima de quê?', opcoes: ['🌊 Da água', '🔥 Do fogo', '☁️ Das nuvens'], certa: 0 },
  { q: 'Quem subiu numa árvore para ver Jesus?', opcoes: ['🌳 Zaqueu', '🎣 Pedro', '📜 Paulo'], certa: 0 },
  { q: 'O que o filho da parábola gastou longe de casa?', opcoes: ['💰 A herança', '🧸 Os brinquedos', '📚 Os livros'], certa: 0 },
  { q: 'Quem era muito forte por causa do cabelo?', opcoes: ['💪 Sansão', '👑 Saul', '🧔 José'], certa: 0 },
  { q: 'O que caía do céu para alimentar o povo no deserto?', opcoes: ['🍞 Maná', '🍕 Pizza', '🍇 Uvas'], certa: 0 },
  { q: 'Qual mar se abriu para o povo passar?', opcoes: ['🌊 Mar Vermelho', '🏖️ Mar Azul', '❄️ Mar Gelado'], certa: 0 },
  { q: 'Quem recebeu os Dez Mandamentos?', opcoes: ['👴 Moisés', '👑 Davi', '🧔 Abraão'], certa: 0 },
  { q: 'As muralhas de qual cidade caíram com trombetas?', opcoes: ['🏰 Jericó', '🏛️ Roma', '🕌 Babilônia'], certa: 0 },
  { q: 'Quem foi vendido pelos irmãos e virou governador?', opcoes: ['🌈 José', '🐑 Abel', '🏹 Esaú'], certa: 0 },
  { q: 'Que animal falou com Balaão?', opcoes: ['🐴 Jumenta', '🐍 Cobra', '🦜 Papagaio'], certa: 0 },
  { q: 'Jesus é o bom...', opcoes: ['🐑 Pastor', '🎣 Pescador', '🌾 Fazendeiro'], certa: 0 },
  { q: 'Quantas vezes devemos perdoar, segundo Jesus?', opcoes: ['1️⃣ Uma vez', '♾️ Sempre', '🔟 Dez vezes'], certa: 1 },
];

const POR_RODADA = 8;

function sorteia(): Pergunta[] {
  const arr = [...PERGUNTAS];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr.slice(0, POR_RODADA);
}

export default function QuizKidsPage(): React.ReactElement {
  const [rodada, setRodada] = useState<Pergunta[] | null>(null);
  const [indice, setIndice] = useState(0);
  const [acertos, setAcertos] = useState(0);
  const [escolha, setEscolha] = useState<number | null>(null);

  function comeca(): void {
    setRodada(sorteia());
    setIndice(0);
    setAcertos(0);
    setEscolha(null);
  }

  const pergunta = rodada?.[indice];
  const acabou = rodada && indice >= rodada.length;
  const estrelas = acabou
    ? acertos >= POR_RODADA - 1
      ? 3
      : acertos >= POR_RODADA - 3
        ? 2
        : 1
    : 0;

  function responde(i: number): void {
    if (escolha !== null || !pergunta) return;
    setEscolha(i);
    if (i === pergunta.certa) setAcertos((a) => a + 1);
    setTimeout(() => {
      setEscolha(null);
      setIndice((x) => x + 1);
    }, 1100);
  }

  return (
    <KidsGameShell
      emoji="⭐"
      title="Quiz Kids"
      subtitle="Responda e ganhe estrelinhas!"
    >
      {!rodada ? (
        <div className="flex flex-col items-center gap-3 py-8">
          <p className="text-center text-sm text-slate-500 dark:text-slate-400">
            {POR_RODADA} perguntinhas sobre as histórias da Bíblia.
          </p>
          <KidsButton onClick={comeca}>Começar! 🚀</KidsButton>
        </div>
      ) : acabou ? (
        <div className="rounded-3xl bg-gradient-to-br from-amber-400 to-orange-500 p-8 text-center text-white shadow-lg">
          <p className="text-4xl tracking-widest">
            {'⭐'.repeat(estrelas)}
            <span className="opacity-30">{'⭐'.repeat(3 - estrelas)}</span>
          </p>
          <p className="mt-2 text-xl font-bold">
            {estrelas === 3
              ? 'Você é fera na Bíblia!'
              : estrelas === 2
                ? 'Muito bem!'
                : 'Boa! Continue treinando!'}
          </p>
          <p className="mt-1 text-sm text-amber-50">
            Você acertou {acertos} de {rodada.length} perguntas.
          </p>
          <div className="mt-4">
            <KidsButton onClick={comeca}>Jogar de novo</KidsButton>
          </div>
        </div>
      ) : pergunta ? (
        <div className="space-y-4">
          <div className="flex justify-center gap-1">
            {rodada.map((_, i) => (
              <span
                key={i}
                className={cn(
                  'h-2 w-6 rounded-full',
                  i < indice
                    ? 'bg-amber-400'
                    : i === indice
                      ? 'bg-indigo-500'
                      : 'bg-slate-200 dark:bg-slate-700',
                )}
              />
            ))}
          </div>
          <div className="rounded-3xl border-2 border-indigo-100 bg-white p-5 dark:border-indigo-900 dark:bg-slate-900">
            <p className="text-center text-lg font-bold leading-snug text-slate-900 dark:text-slate-100">
              {pergunta.q}
            </p>
            <div className="mt-4 space-y-2.5">
              {pergunta.opcoes.map((opcao, i) => {
                const acertou = escolha !== null && i === pergunta.certa;
                const errou =
                  escolha !== null && i === escolha && i !== pergunta.certa;
                return (
                  <button
                    // Chave por pergunta+opção: sem isso o React reutiliza o
                    // botão da mesma posição e o anel de foco do clique
                    // anterior "vaza" para a pergunta seguinte.
                    key={`${indice}-${i}`}
                    onClick={() => responde(i)}
                    disabled={escolha !== null}
                    className={cn(
                      'w-full rounded-2xl border-2 px-4 py-3.5 text-left text-base font-semibold transition-all duration-150',
                      acertou
                        ? 'scale-[1.02] border-emerald-400 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200'
                        : errou
                          ? 'border-red-300 bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-300'
                          : 'border-slate-200 text-slate-700 active:scale-95 dark:border-slate-700 dark:text-slate-200',
                    )}
                  >
                    {opcao}
                    {acertou && ' ✅'}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}
    </KidsGameShell>
  );
}
