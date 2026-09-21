import { ArenaQuestion, QUESTIONS } from './questions';

/**
 * Temas das temporadas da Arena.
 *
 * O tema sai do próprio acervo, por filtro — não há campo "tema" nas 359
 * perguntas e não faria sentido criar um: a referência bíblica já diz a que
 * parte da Escritura a pergunta pertence, e duplicar isso em outro campo seria
 * arranjar duas versões da mesma verdade.
 *
 * Uma semana consome 84 perguntas (12 × 7). Quase nenhum tema tem tudo isso,
 * então o tema TEMPERA o dia: entram quantas o acervo aguenta sem repetir na
 * semana, e o resto vem do sorteio geral. Assim a semana tem cara de tema sem
 * que ninguém veja a mesma pergunta duas vezes.
 */

const EVANGELHOS = ['Mateus', 'Marcos', 'Lucas', 'João'];

const CARTAS_PAULO = [
  'Romanos',
  '1 Coríntios',
  '2 Coríntios',
  'Gálatas',
  'Efésios',
  'Filipenses',
  'Colossenses',
  '1 Tessalonicenses',
  '2 Tessalonicenses',
  '1 Timóteo',
  '2 Timóteo',
  'Tito',
  'Filemom',
];

const NOVO_TESTAMENTO = [
  ...EVANGELHOS,
  'Atos',
  ...CARTAS_PAULO,
  'Hebreus',
  'Tiago',
  '1 Pedro',
  '2 Pedro',
  '1 João',
  '2 João',
  '3 João',
  'Judas',
  'Apocalipse',
];

const PROFETAS = [
  'Isaías',
  'Jeremias',
  'Lamentações',
  'Ezequiel',
  'Daniel',
  'Oseias',
  'Joel',
  'Amós',
  'Obadias',
  'Jonas',
  'Miqueias',
  'Naum',
  'Habacuque',
  'Sofonias',
  'Ageu',
  'Zacarias',
  'Malaquias',
];

/** "1 Reis 17:6" → "1 Reis". Referências soltas ("Cânon do NT") caem fora. */
function livro(ref: string): string {
  return ref
    .replace(/\s*\d+[:\-–].*$/, '')
    .replace(/\s*\(.*$/, '')
    .replace(/\s+\d+$/, '')
    .trim();
}

export interface Tema {
  id: string;
  nome: string;
  emoji: string;
  pertence: (q: ArenaQuestion) => boolean;
}

export const TEMAS: Tema[] = [
  {
    id: 'parabolas',
    nome: 'Parábolas de Jesus',
    emoji: '🌾',
    pertence: (q) => /par[áa]bola/i.test(q.question),
  },
  {
    id: 'personagens',
    nome: 'Personagens bíblicos',
    emoji: '🧔',
    pertence: (q) => /^(Quem|A quem|Qual (profeta|rei|apóstolo))/i.test(q.question),
  },
  {
    id: 'evangelhos',
    nome: 'Evangelhos',
    emoji: '✝️',
    pertence: (q) => EVANGELHOS.includes(livro(q.ref)),
  },
  {
    id: 'antigo-testamento',
    nome: 'Antigo Testamento',
    emoji: '📜',
    pertence: (q) => {
      const l = livro(q.ref);
      return !!l && !NOVO_TESTAMENTO.includes(l);
    },
  },
  {
    id: 'atos',
    nome: 'Atos dos Apóstolos',
    emoji: '🔥',
    pertence: (q) => livro(q.ref) === 'Atos',
  },
  {
    id: 'cartas-paulo',
    nome: 'Cartas de Paulo',
    emoji: '✉️',
    pertence: (q) => CARTAS_PAULO.includes(livro(q.ref)),
  },
  {
    id: 'profetas',
    nome: 'Profetas',
    emoji: '🕊️',
    pertence: (q) => PROFETAS.includes(livro(q.ref)),
  },
];

/** Tema sem tema: a Arena de sempre, sorteio geral. */
export const TEMA_LIVRE = 'livre';

const CACHE = new Map<string, ArenaQuestion[]>();

/** As perguntas do acervo que pertencem ao tema (calculado uma vez). */
export function perguntasDoTema(temaId: string): ArenaQuestion[] {
  const pronto = CACHE.get(temaId);
  if (pronto) return pronto;
  const tema = TEMAS.find((t) => t.id === temaId);
  const lista = tema ? QUESTIONS.filter(tema.pertence) : [];
  CACHE.set(temaId, lista);
  return lista;
}

export function temaPorId(temaId: string): Tema | null {
  return TEMAS.find((t) => t.id === temaId) ?? null;
}

/**
 * Quantas perguntas do tema cabem por dia sem repetir na semana.
 * Menos de uma por dia: o tema é pequeno demais e a semana sai sem tema.
 */
export function porDiaDoTema(temaId: string, perguntasPorDia: number): number {
  return Math.min(perguntasPorDia, Math.floor(perguntasDoTema(temaId).length / 7));
}

/** Temas que hoje têm acervo para valer — é o que o painel pode oferecer. */
export function temasDisponiveis(perguntasPorDia: number) {
  return TEMAS.map((t) => ({
    id: t.id,
    nome: t.nome,
    emoji: t.emoji,
    acervo: perguntasDoTema(t.id).length,
    porDia: porDiaDoTema(t.id, perguntasPorDia),
  })).filter((t) => t.porDia >= 1);
}
