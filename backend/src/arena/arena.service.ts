import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { QUESTIONS, ArenaQuestion } from './questions';

const PERGUNTAS_POR_DIA = 5;
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

/**
 * As 5 perguntas do dia. Determinístico por (dia + igreja): todo mundo da
 * MESMA igreja vê as MESMAS perguntas no mesmo dia — isso gera a conversa
 * ("acertou a 3?") — e igrejas diferentes veem sorteios diferentes.
 */
export function perguntasDoDia(day: string, churchId: string): ArenaQuestion[] {
  let semente = fnv1a(`${day}|${churchId}`);
  const proximaAleatoria = () => {
    // xorshift32: rápido, determinístico e suficiente para embaralhar.
    semente ^= semente << 13;
    semente ^= semente >>> 17;
    semente ^= semente << 5;
    return (semente >>> 0) / 0xffffffff;
  };
  const indices = QUESTIONS.map((_, i) => i);
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(proximaAleatoria() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }
  return indices.slice(0, PERGUNTAS_POR_DIA).map((i) => QUESTIONS[i]);
}

@Injectable()
export class ArenaService {
  constructor(private readonly prisma: PrismaService) {}

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

    return { correct, points, answer: pergunta.answer, ref: pergunta.ref };
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
