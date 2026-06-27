import { Injectable } from '@nestjs/common';

export interface WorshipSuggestionInput {
  title: string;
  theme?: string;
  bibleRef?: string;
}

export interface WorshipSuggestion {
  theme: string;
  bibleRef: string;
  summary: string;
  items: {
    title: string;
    responsible: string;
    durationMin: number;
    notes: string;
  }[];
  participantRoles: string[];
}

function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim();
}

// Palavras-chave → texto-base bíblico sugerido (lista curada, ordem importa:
// a primeira correspondência vence).
const KEYWORD_PASSAGES: { keywords: string[]; ref: string }[] = [
  { keywords: ['santa ceia', 'ceia'], ref: '1 Coríntios 11:23-26' },
  { keywords: ['natal', 'nascimento de jesus'], ref: 'Lucas 2:8-14' },
  { keywords: ['pascoa', 'ressurreicao', 'ressurreição'], ref: '1 Coríntios 15:20-22' },
  { keywords: ['batismo', 'batismos'], ref: 'Mateus 28:18-20' },
  { keywords: ['missoes', 'missão', 'missao', 'evangelismo', 'evangelizar'], ref: 'Mateus 28:18-20' },
  { keywords: ['espirito santo', 'espírito santo', 'pentecostes'], ref: 'Atos 2:1-4' },
  { keywords: ['amor'], ref: '1 Coríntios 13:4-7' },
  { keywords: ['fe', 'fé'], ref: 'Hebreus 11:1' },
  { keywords: ['esperanca', 'esperança'], ref: 'Romanos 15:13' },
  { keywords: ['graca', 'graça'], ref: 'Efésios 2:8-10' },
  { keywords: ['gratidao', 'gratidão', 'gratos', 'acao de gracas', 'ação de graças'], ref: 'Salmos 100' },
  { keywords: ['familia', 'família', 'lar', 'casamento'], ref: 'Josué 24:15' },
  { keywords: ['oracao', 'oração', 'interceder', 'intercessao', 'intercessão'], ref: 'Filipenses 4:6-7' },
  { keywords: ['perdao', 'perdão'], ref: 'Colossenses 3:13' },
  { keywords: ['salvacao', 'salvação', 'salvo'], ref: 'João 3:16' },
  { keywords: ['adoracao', 'adoração', 'louvor', 'adorar'], ref: 'Salmos 95:1-6' },
  { keywords: ['cura', 'curar', 'doente', 'saude', 'saúde'], ref: 'Tiago 5:14-15' },
  { keywords: ['jejum'], ref: 'Mateus 6:16-18' },
  { keywords: ['santidade', 'santo'], ref: '1 Pedro 1:15-16' },
  { keywords: ['paz'], ref: 'João 14:27' },
  { keywords: ['alegria', 'gozo', 'contentamento'], ref: 'Filipenses 4:4' },
  { keywords: ['provisao', 'provisão', 'sustento', 'financas', 'finanças'], ref: 'Filipenses 4:19' },
  { keywords: ['libertacao', 'libertação', 'livramento'], ref: 'João 8:36' },
  { keywords: ['restauracao', 'restauração', 'renovo'], ref: 'Joel 2:25-26' },
  { keywords: ['mulher', 'mulheres', 'mae', 'mães', 'maes'], ref: 'Provérbios 31:25-30' },
  { keywords: ['homem', 'homens', 'pai', 'pais'], ref: 'Efésios 6:4' },
  { keywords: ['jovem', 'jovens', 'juventude', 'mocidade'], ref: '1 Timóteo 4:12' },
  { keywords: ['crianca', 'criança', 'criancas', 'crianças', 'infantil'], ref: 'Provérbios 22:6' },
  { keywords: ['dizimo', 'dízimo', 'oferta', 'ofertas'], ref: 'Malaquias 3:10' },
  { keywords: ['arrependimento', 'arrepender'], ref: 'Atos 3:19' },
  { keywords: ['vitoria', 'vitória', 'vencer', 'batalha'], ref: 'Romanos 8:37' },
  { keywords: ['consolo', 'consolacao', 'consolação', 'luto', 'dor'], ref: '2 Coríntios 1:3-4' },
  { keywords: ['proposito', 'propósito', 'futuro', 'planos'], ref: 'Jeremias 29:11' },
  { keywords: ['obediencia', 'obediência', 'obedecer'], ref: '1 Samuel 15:22' },
  { keywords: ['palavra', 'biblia', 'bíblia', 'escritura'], ref: '2 Timóteo 3:16-17' },
];

const DEFAULT_PASSAGES = [
  'Salmos 100',
  'Filipenses 4:4-7',
  'Salmos 23',
  'João 15:1-8',
];

@Injectable()
export class WorshipAiService {
  get enabled(): boolean {
    return true;
  }

  private pickPassage(text: string): string {
    const normalized = normalize(text);
    for (const entry of KEYWORD_PASSAGES) {
      if (entry.keywords.some((k) => normalized.includes(normalize(k)))) {
        return entry.ref;
      }
    }
    // Sem palavra-chave: escolhe um padrão de forma estável pelo tamanho do texto.
    return DEFAULT_PASSAGES[normalized.length % DEFAULT_PASSAGES.length];
  }

  // Gera o plano por regras/templates — sem IA externa, sem custo.
  async suggest(input: WorshipSuggestionInput): Promise<WorshipSuggestion> {
    const title = input.title.trim();
    const theme = input.theme?.trim() || title;
    const bibleRef =
      input.bibleRef?.trim() || this.pickPassage(`${title} ${theme}`);

    const normalized = normalize(`${title} ${theme}`);
    const hasCommunion = ['santa ceia', 'ceia', 'comunhao', 'comunhão'].some(
      (k) => normalized.includes(normalize(k)),
    );

    const items: WorshipSuggestion['items'] = [
      {
        title: 'Boas-vindas e abertura',
        responsible: 'Dirigente do culto',
        durationMin: 5,
        notes: 'Recepção da igreja e oração de abertura.',
      },
      {
        title: 'Louvor e adoração',
        responsible: 'Ministério de louvor',
        durationMin: 20,
        notes: 'Cânticos alinhados ao tema do culto.',
      },
      {
        title: 'Oração de intercessão',
        responsible: 'Dirigente do culto',
        durationMin: 5,
        notes: 'Pedidos da igreja e gratidão.',
      },
      {
        title: 'Leitura bíblica',
        responsible: 'Membro designado',
        durationMin: 5,
        notes: `Leitura do texto-base: ${bibleRef}.`,
      },
      {
        title: 'Avisos e ofertas',
        responsible: 'Diácono / Tesouraria',
        durationMin: 10,
        notes: 'Comunicados da semana e momento de ofertas.',
      },
      {
        title: `Mensagem: ${theme}`,
        responsible: 'Pregador',
        durationMin: hasCommunion ? 30 : 35,
        notes: `Pregação a partir de ${bibleRef}.`,
      },
    ];

    if (hasCommunion) {
      items.push({
        title: 'Santa Ceia',
        responsible: 'Pastor',
        durationMin: 10,
        notes: 'Celebração da Ceia do Senhor.',
      });
    }

    items.push(
      {
        title: 'Apelo e ministração',
        responsible: 'Pregador',
        durationMin: 5,
        notes: 'Resposta à palavra e oração ministerial.',
      },
      {
        title: 'Oração final e bênção',
        responsible: 'Pastor',
        durationMin: 5,
        notes: 'Bênção apostólica e encerramento.',
      },
    );

    return {
      theme,
      bibleRef,
      summary: `Culto com foco em "${theme}", a partir de ${bibleRef}. Conduza a igreja em adoração, palavra e comunhão.`,
      items,
      participantRoles: [
        'Pregação',
        'Louvor / Ministração',
        'Oração',
        'Leitura bíblica',
        'Recepção',
        'Dízimos e ofertas',
      ],
    };
  }
}
