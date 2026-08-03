import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PushService } from '../push/push.service';
import { QUESTIONS, ArenaQuestion } from './questions';

const PERGUNTAS_POR_DIA = 12;
const PONTOS_POR_ACERTO = 10;

/** "AAAA-MM-DD" no fuso de Brasília — o dia vira à meia-noite BRT, não UTC. */
function hojeBrt(): string {
  const brt = new Date(Date.now() - 3 * 3600_000);
  return brt.toISOString().slice(0, 10);
}

/** Hash determinístico simples (FNV-1a) — não é criptografia, é sorteio. */
function fnv1a(texto: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < texto.length; i++) {
    h ^= texto.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** Gerador determinístico (xorshift32) a partir de uma semente. */
function criaPrng(semente: number): () => number {
  let s = semente || 1; // xorshift trava em 0
  return () => {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    return (s >>> 0) / 0xffffffff;
  };
}

function embaralhado<T>(itens: T[], rand: () => number): T[] {
  const arr = [...itens];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/** Dias corridos desde a época Unix para a data "AAAA-MM-DD". */
function numeroDoDia(day: string): number {
  return Math.floor(Date.parse(`${day}T00:00:00Z`) / 86_400_000);
}

/**
 * Embaralha as ALTERNATIVAS da pergunta (determinístico por dia+igreja+id).
 * Sem isso, quem decorasse "a certa é sempre a B" pontuaria sem ler — e o
 * índice correto é remapeado junto, então a correção continua batendo.
 */
function comOpcoesEmbaralhadas(
  q: ArenaQuestion,
  day: string,
  churchId: string,
): ArenaQuestion {
  const rand = criaPrng(fnv1a(`${day}|${churchId}|${q.id}`));
  const perm = embaralhado([0, 1, 2, 3], rand);
  return {
    ...q,
    options: perm.map((i) => q.options[i]) as ArenaQuestion['options'],
    answer: perm.indexOf(q.answer) as ArenaQuestion['answer'],
  };
}

/**
 * As perguntas do dia, em RODÍZIO SEM REPETIÇÃO:
 *
 * O banco inteiro é embaralhado uma vez por CICLO (semente = ciclo + igreja) e
 * consumido em fatias de 12 por dia. Nenhuma pergunta repete até o banco todo
 * rodar (~banco/12 dias); no ciclo seguinte, novo embaralhamento. Todo mundo
 * da MESMA igreja vê as MESMAS perguntas no dia — é o que gera a conversa
 * ("acertou a 3?") — e igrejas diferentes veem sorteios diferentes.
 */
export function perguntasDoDia(day: string, churchId: string): ArenaQuestion[] {
  const total = QUESTIONS.length;
  const diasPorCiclo = Math.floor(total / PERGUNTAS_POR_DIA);
  const dia = numeroDoDia(day);
  const ciclo = Math.floor(dia / diasPorCiclo);
  const posicaoNoCiclo = ((dia % diasPorCiclo) + diasPorCiclo) % diasPorCiclo;

  const rand = criaPrng(fnv1a(`ciclo:${ciclo}|${churchId}`));
  const indices = embaralhado(
    QUESTIONS.map((_, i) => i),
    rand,
  );
  const inicio = posicaoNoCiclo * PERGUNTAS_POR_DIA;
  return indices
    .slice(inicio, inicio + PERGUNTAS_POR_DIA)
    .map((i) => comOpcoesEmbaralhadas(QUESTIONS[i], day, churchId));
}

@Injectable()
export class ArenaService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly push: PushService,
  ) {}

  /** Desafio de hoje: perguntas SEM a resposta + o que o membro já respondeu. */
  async today(churchId: string, memberId: string) {
    const day = hojeBrt();
    const perguntas = perguntasDoDia(day, churchId);

    const respondidas = await this.prisma.arenaAnswer.findMany({
      where: { memberId, day },
      select: { questionId: true, choice: true, correct: true, points: true },
    });
    const porPergunta = new Map(respondidas.map((r) => [r.questionId, r]));

    return {
      day,
      pointsPerHit: PONTOS_POR_ACERTO,
      questions: perguntas.map((q) => {
        const resposta = porPergunta.get(q.id);
        return {
          id: q.id,
          question: q.question,
          options: q.options,
          // Só depois de responder o membro vê o gabarito e a referência.
          answered: resposta
            ? {
                choice: resposta.choice,
                correct: resposta.correct,
                points: resposta.points,
                answer: q.answer,
                ref: q.ref,
              }
            : null,
        };
      }),
    };
  }

  /** Corrige e pontua NO SERVIDOR. Uma tentativa por pergunta por dia. */
  async answer(
    churchId: string,
    memberId: string,
    questionId: string,
    choice: number,
  ) {
    const day = hojeBrt();
    const pergunta = perguntasDoDia(day, churchId).find(
      (q) => q.id === questionId,
    );
    // Pergunta fora do sorteio de hoje = tentativa de burlar (ou app velho).
    if (!pergunta) {
      throw new BadRequestException('Essa pergunta não é do desafio de hoje.');
    }
    if (!Number.isInteger(choice) || choice < 0 || choice > 3) {
      throw new BadRequestException('Alternativa inválida.');
    }

    const correct = pergunta.answer === choice;
    const points = correct ? PONTOS_POR_ACERTO : 0;

    try {
      await this.prisma.arenaAnswer.create({
        data: { churchId, memberId, day, questionId, choice, correct, points },
      });
    } catch (err) {
      // P2002 = violação do @@unique: já respondeu esta pergunta hoje.
      if ((err as { code?: string })?.code === 'P2002') {
        throw new ConflictException('Você já respondeu essa pergunta hoje.');
      }
      throw err;
    }

    // Pontuou? Confere se acabou de assumir o topo do mês — se sim, avisa a
    // igreja. Best-effort: nunca atrasa nem quebra a resposta da pergunta.
    if (correct) {
      void this.avisaSeNovoLider(churchId, memberId, points).catch(
        () => undefined,
      );
    }

    return { correct, points, answer: pergunta.answer, ref: pergunta.ref };
  }

  /**
   * Detecta a TROCA de líder do mês: notifica só quando este acerto fez o
   * membro cruzar para o 1º lugar (antes dele estava alguém — ou ninguém).
   * Empate não conta como ultrapassagem, então não há spam de ping-pong.
   */
  private async avisaSeNovoLider(
    churchId: string,
    memberId: string,
    pontosGanhos: number,
  ): Promise<void> {
    const mesInicio = `${hojeBrt().slice(0, 7)}-01`;
    const somas = await this.prisma.arenaAnswer.groupBy({
      by: ['memberId'],
      where: { churchId, day: { gte: mesInicio } },
      _sum: { points: true },
    });

    const minha = somas.find((s) => s.memberId === memberId)?._sum.points ?? 0;
    const maiorDosOutros = Math.max(
      0,
      ...somas
        .filter((s) => s.memberId !== memberId)
        .map((s) => s._sum.points ?? 0),
    );

    const lideraAgora = minha > maiorDosOutros;
    const jaLiderava = minha - pontosGanhos > maiorDosOutros;
    if (!lideraAgora || jaLiderava) return;

    const membro = await this.prisma.member.findUnique({
      where: { id: memberId },
      select: { name: true },
    });
    if (!membro) return;

    await this.push.notifyChurch(
      churchId,
      '🏆 Novo líder na Arena!',
      `${membro.name} assumiu o topo do ranking com ${minha} pontos. Quem alcança?`,
      'arena',
    );
  }

  /**
   * Ranking da igreja. `period` = 'month' (competição corrente, zera todo
   * mês) ou 'all' (histórico). Devolve o top e a posição do próprio membro.
   */
  async ranking(churchId: string, memberId: string, period: 'month' | 'all') {
    const where: {
      churchId: string;
      day?: { gte: string };
    } = { churchId };
    if (period === 'month') {
      where.day = { gte: `${hojeBrt().slice(0, 7)}-01` };
    }

    const somas = await this.prisma.arenaAnswer.groupBy({
      by: ['memberId'],
      where,
      _sum: { points: true },
      _count: { _all: true },
    });

    const ordenado = somas
      .map((s) => ({
        memberId: s.memberId,
        points: s._sum.points ?? 0,
        answers: s._count._all,
      }))
      .sort((a, b) => b.points - a.points || a.memberId.localeCompare(b.memberId));

    const top = ordenado.slice(0, 10);
    const nomes = await this.prisma.member.findMany({
      where: { id: { in: top.map((t) => t.memberId) } },
      select: { id: true, name: true, photo: true },
    });
    const nomePorId = new Map(nomes.map((n) => [n.id, n]));

    const minhaPosicao = ordenado.findIndex((o) => o.memberId === memberId);
    const meu = minhaPosicao >= 0 ? ordenado[minhaPosicao] : null;

    return {
      period,
      top: top.map((t, i) => ({
        position: i + 1,
        name: nomePorId.get(t.memberId)?.name ?? 'Membro',
        photo: nomePorId.get(t.memberId)?.photo ?? null,
        points: t.points,
        me: t.memberId === memberId,
      })),
      me: meu
        ? { position: minhaPosicao + 1, points: meu.points }
        : { position: null, points: 0 },
    };
  }
}
