import {
  Injectable,
  ServiceUnavailableException,
  Logger,
} from '@nestjs/common';
import Anthropic from '@anthropic-ai/sdk';

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

const SYSTEM_PROMPT = `Você é um auxiliar pastoral de uma igreja evangélica brasileira.
A partir de um tema/título de culto, monte um planejamento de culto prático e bíblico.
Diretrizes:
- Use linguagem em português do Brasil, tom acolhedor e respeitoso.
- Mantenha-se fiel à fé cristã evangélica; não invente doutrinas.
- Sugira um texto-base bíblico real e coerente com o tema (ex.: "Efésios 2:8-10").
- Monte uma "ordem do culto" com 6 a 9 itens em sequência lógica (abertura, louvor,
  oração, leitura, mensagem, ofertas, encerramento etc.), com duração estimada em
  minutos somando aproximadamente 90 minutos.
- Em "responsible", sugira a FUNÇÃO de quem conduz (ex.: "Ministério de louvor",
  "Pastor", "Diácono"), não nomes próprios.
- Em "participantRoles", liste de 3 a 6 funções a serem escaladas para o culto.`;

const SUGGESTION_TOOL: Anthropic.Tool = {
  name: 'montar_plano_culto',
  description:
    'Registra o plano de um culto evangélico: tema, texto-base, resumo, ordem do culto e funções de participantes.',
  input_schema: {
    type: 'object',
    properties: {
      theme: {
        type: 'string',
        description: 'Tema/título da mensagem do culto.',
      },
      bibleRef: {
        type: 'string',
        description: 'Texto-base bíblico (ex.: "Salmos 23").',
      },
      summary: {
        type: 'string',
        description: 'Resumo de 2 a 3 frases sobre o foco do culto.',
      },
      items: {
        type: 'array',
        description: 'Itens da ordem do culto, em sequência.',
        items: {
          type: 'object',
          properties: {
            title: { type: 'string', description: 'Nome do item.' },
            responsible: {
              type: 'string',
              description: 'Função responsável pelo item.',
            },
            durationMin: {
              type: 'integer',
              description: 'Duração estimada em minutos.',
            },
            notes: { type: 'string', description: 'Observação curta.' },
          },
          required: ['title', 'responsible', 'durationMin', 'notes'],
          additionalProperties: false,
        },
      },
      participantRoles: {
        type: 'array',
        description: 'Funções a escalar (ex.: "Pregação", "Louvor").',
        items: { type: 'string' },
      },
    },
    required: ['theme', 'bibleRef', 'summary', 'items', 'participantRoles'],
    additionalProperties: false,
  },
};

@Injectable()
export class WorshipAiService {
  private readonly logger = new Logger(WorshipAiService.name);
  private readonly client: Anthropic | null;

  constructor() {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    this.client = apiKey ? new Anthropic({ apiKey }) : null;
  }

  get enabled(): boolean {
    return this.client !== null;
  }

  async suggest(input: WorshipSuggestionInput): Promise<WorshipSuggestion> {
    if (!this.client) {
      throw new ServiceUnavailableException(
        'Assistente de IA não configurado. Defina ANTHROPIC_API_KEY no servidor.',
      );
    }

    const context = [
      `Título do culto: ${input.title.trim()}`,
      input.theme?.trim() ? `Tema desejado: ${input.theme.trim()}` : null,
      input.bibleRef?.trim()
        ? `Texto-base preferido: ${input.bibleRef.trim()}`
        : null,
    ]
      .filter(Boolean)
      .join('\n');

    try {
      const response = await this.client.messages.create({
        model: 'claude-opus-4-8',
        max_tokens: 2000,
        system: SYSTEM_PROMPT,
        tools: [SUGGESTION_TOOL],
        tool_choice: { type: 'tool', name: SUGGESTION_TOOL.name },
        messages: [
          {
            role: 'user',
            content: `Monte o planejamento para este culto.\n\n${context}`,
          },
        ],
      });

      const block = response.content.find(
        (b): b is Anthropic.ToolUseBlock => b.type === 'tool_use',
      );
      if (!block) {
        throw new Error('Resposta da IA sem conteúdo estruturado.');
      }
      return block.input as WorshipSuggestion;
    } catch (err) {
      this.logger.error('Falha ao gerar sugestão de culto', err as Error);
      throw new ServiceUnavailableException(
        'Não foi possível gerar a sugestão agora. Tente novamente em instantes.',
      );
    }
  }
}
