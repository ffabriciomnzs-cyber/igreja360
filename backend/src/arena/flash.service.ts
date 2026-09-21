import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { PushService } from '../push/push.service';
import { QUESTIONS, ArenaQuestion } from './questions';
import { SEGUNDOS_POR_PERGUNTA, TOLERANCIA_MS } from './config';

/**
 * Desafio surpresa.
 *
 * A regra que dá sentido ao susto: há uma janela curta para ENTRAR. Quem não
 * entra a perde. Quem entrou termina com calma — cortar alguém no meio de uma
 * pergunta seria punir quem atendeu ao chamado.
 *
 * O prazo é conferido no servidor (startedAt do primeiro turno). Um contador
 * de tela é enfeite: fecha-se o app, muda-se o relógio do aparelho, e pronto.
 */
@Injectable()
export class FlashService {
  private readonly logger = new Logger('FlashService');

  constructor(
    private readonly prisma: PrismaService,
    private readonly push: PushService,
  ) {}

  private pergunta(id: string): ArenaQuestion {
    const q = QUESTIONS.find((x) => x.id === id);
    if (!q) throw new NotFoundException('Pergunta não encontrada.');
    return q;
  }

  /** Perguntas do surpresa: sorteadas por (desafio, posição), iguais p/ todos. */
  private perguntasDo(flashId: string, quantas: number): ArenaQuestion[] {
    let h = 0x811c9dc5;
    for (const ch of flashId) {
      h ^= ch.charCodeAt(0);
      h = Math.imul(h, 0x01000193);
    }
    let s = h >>> 0 || 1;
    const rand = () => {
      s ^= s << 13;
      s ^= s >>> 17;
      s ^= s << 5;
      return (s >>> 0) / 0xffffffff;
    };
    const escolhidas: ArenaQuestion[] = [];
    const vistos = new Set<string>();
    while (escolhidas.length < quantas) {
      const q = QUESTIONS[Math.floor(rand() * QUESTIONS.length)];
      if (vistos.has(q.id)) continue;
      vistos.add(q.id);
      escolhidas.push(q);
    }
    return escolhidas;
  }

  /** O surpresa em cartaz agora (liberado e dentro da janela de entrada). */
  async emCartaz(churchId: string, memberId: string) {
    const agora = new Date();
    const flash = await this.prisma.arenaFlash.findFirst({
      where: { churchId, startsAt: { lte: agora } },
      orderBy: { startsAt: 'desc' },
      include: { turns: { where: { memberId } } },
    });
    if (!flash) return null;

    const fechaEm = new Date(flash.startsAt.getTime() + flash.windowMin * 60_000);
    const meusTurnos = flash.turns;
    const entrou = meusTurnos.length > 0;
    const respondidas = meusTurnos.filter((t) => t.answeredAt).length;
    const concluido = respondidas >= flash.questions;

    // Não entrou e a janela fechou: não há o que mostrar.
    if (!entrou && agora > fechaEm) return null;

    return {
      id: flash.id,
      bonus: flash.bonus,
      total: flash.questions,
      seconds: SEGUNDOS_POR_PERGUNTA,
      closesAt: fechaEm,
      /** Segundos para ENTRAR (0 = a porta fechou). */
      secondsToEnter: Math.max(
        0,
        Math.ceil((fechaEm.getTime() - agora.getTime()) / 1000),
      ),
      joined: entrou,
      answered: respondidas,
      done: concluido,
      score: meusTurnos.filter((t) => t.correct).length * flash.bonus,
    };
  }

  /** Entra no surpresa. É aqui que a janela é cobrada. */
  async entrar(churchId: string, memberId: string, flashId: string) {
    const flash = await this.prisma.arenaFlash.findFirst({
      where: { id: flashId, churchId },
      include: { turns: { where: { memberId }, take: 1 } },
    });
    if (!flash) throw new NotFoundException('Desafio não encontrado.');

    const agora = Date.now();
    if (flash.startsAt.getTime() > agora) {
      throw new BadRequestException('Este desafio ainda não começou.');
    }
    const jaEstava = flash.turns.length > 0;
    const fechou = agora > flash.startsAt.getTime() + flash.windowMin * 60_000;
    if (!jaEstava && fechou) {
      throw new BadRequestException(
        'O tempo para entrar acabou. Fique atento ao próximo!',
      );
    }
    return this.estado(churchId, memberId, flashId);
  }

  async estado(churchId: string, memberId: string, flashId: string) {
    const flash = await this.prisma.arenaFlash.findFirst({
      where: { id: flashId, churchId },
      include: { turns: { where: { memberId } } },
    });
    if (!flash) throw new NotFoundException('Desafio não encontrado.');

    const perguntas = this.perguntasDo(flash.id, flash.questions);
    const respondidas = new Set(
      flash.turns.filter((t) => t.answeredAt).map((t) => t.questionId),
    );
    const proxima = perguntas.find((q) => !respondidas.has(q.id)) ?? null;
    const turnoAberto = proxima
      ? flash.turns.find((t) => t.questionId === proxima.id)
      : undefined;

    return {
      id: flash.id,
      total: flash.questions,
      bonus: flash.bonus,
      seconds: SEGUNDOS_POR_PERGUNTA,
      answered: respondidas.size,
      hits: flash.turns.filter((t) => t.correct).length,
      score: flash.turns.filter((t) => t.correct).length * flash.bonus,
      done: respondidas.size >= flash.questions,
      current: proxima
        ? {
            id: proxima.id,
            question: proxima.question,
            options: proxima.options,
            index: perguntas.indexOf(proxima) + 1,
            remaining: turnoAberto
              ? Math.max(
                  0,
                  Math.ceil(
                    SEGUNDOS_POR_PERGUNTA -
                      (Date.now() - turnoAberto.openedAt.getTime()) / 1000,
                  ),
                )
              : null,
          }
        : null,
    };
  }

  private async exigeDentro(churchId: string, memberId: string, flashId: string) {
    const flash = await this.prisma.arenaFlash.findFirst({
      where: { id: flashId, churchId },
      include: { turns: { where: { memberId }, orderBy: { openedAt: 'asc' }, take: 1 } },
    });
    if (!flash) throw new NotFoundException('Desafio não encontrado.');
    // Quem já entrou dentro da janela conclui sem pressa.
    if (!flash.turns.length) {
      const fechou =
        Date.now() > flash.startsAt.getTime() + flash.windowMin * 60_000;
      if (fechou) throw new BadRequestException('O tempo para entrar acabou.');
    }
    return flash;
  }

  async abrirPergunta(
    churchId: string,
    memberId: string,
    flashId: string,
    questionId: string,
  ) {
    const flash = await this.exigeDentro(churchId, memberId, flashId);
    const perguntas = this.perguntasDo(flash.id, flash.questions);
    if (!perguntas.some((q) => q.id === questionId)) {
      throw new BadRequestException('Essa pergunta não é deste desafio.');
    }
    const turno = await this.prisma.arenaRoundTurn.upsert({
      where: { flashId_memberId_questionId: { flashId, memberId, questionId } },
      create: { churchId, kind: 'FLASH', flashId, memberId, questionId },
      update: {},
      select: { openedAt: true },
    });
    return {
      questionId,
      seconds: SEGUNDOS_POR_PERGUNTA,
      remaining: Math.max(
        0,
        Math.ceil(
          SEGUNDOS_POR_PERGUNTA - (Date.now() - turno.openedAt.getTime()) / 1000,
        ),
      ),
    };
  }

  async responder(
    churchId: string,
    memberId: string,
    flashId: string,
    questionId: string,
    choice: number,
  ) {
    await this.exigeDentro(churchId, memberId, flashId);
    const turno = await this.prisma.arenaRoundTurn.findUnique({
      where: { flashId_memberId_questionId: { flashId, memberId, questionId } },
    });
    if (!turno) throw new BadRequestException('Abra a pergunta antes de responder.');
    if (turno.answeredAt) return this.estado(churchId, memberId, flashId);

    const q = this.pergunta(questionId);
    const noTempo =
      Date.now() - turno.openedAt.getTime() <=
      SEGUNDOS_POR_PERGUNTA * 1000 + TOLERANCIA_MS;
    const escolheu = Number.isInteger(choice) && choice >= 0 && choice <= 3;

    await this.prisma.arenaRoundTurn.update({
      where: { id: turno.id },
      data: {
        choice: escolheu ? choice : -1,
        correct: escolheu && noTempo && q.answer === choice,
        answeredAt: new Date(),
      },
    });
    const estado = await this.estado(churchId, memberId, flashId);
    return { correct: escolheu && noTempo && q.answer === choice, answer: q.answer, ref: q.ref, state: estado };
  }

  // ---------- Painel ----------

  async criar(
    churchId: string,
    dto: { startsAt?: string; windowMin?: number; questions?: number; bonus?: number },
  ) {
    const quando = dto.startsAt ? new Date(dto.startsAt) : new Date();
    if (Number.isNaN(quando.getTime())) {
      throw new BadRequestException('Data inválida.');
    }
    return this.prisma.arenaFlash.create({
      data: {
        churchId,
        startsAt: quando,
        windowMin: Math.min(60, Math.max(2, dto.windowMin ?? 10)),
        questions: Math.min(10, Math.max(3, dto.questions ?? 5)),
        bonus: Math.min(50, Math.max(1, dto.bonus ?? 5)),
      },
    });
  }

  async listar(churchId: string) {
    return this.prisma.arenaFlash.findMany({
      where: { churchId },
      orderBy: { startsAt: 'desc' },
      take: 10,
      include: { _count: { select: { turns: true } } },
    });
  }

  async remover(churchId: string, id: string) {
    const flash = await this.prisma.arenaFlash.findFirst({
      where: { id, churchId },
      include: { _count: { select: { turns: true } } },
    });
    if (!flash) throw new NotFoundException('Desafio não encontrado.');
    if (flash._count.turns > 0) {
      throw new BadRequestException(
        'Alguém já jogou este desafio: ele não pode mais ser apagado.',
      );
    }
    await this.prisma.arenaFlash.delete({ where: { id } });
    return { ok: true };
  }

  /**
   * Dispara o aviso quando o desafio abre.
   *
   * De minuto em minuto porque o valor do surpresa está em chegar na hora —
   * um agendamento que avisa dez minutos depois não é surpresa, é atraso. O
   * campo notifiedAt garante um aviso só, mesmo com a API reiniciando.
   */
  @Cron('* * * * *')
  async avisaQuemAbriu(): Promise<void> {
    const agora = new Date();
    const abriram = await this.prisma.arenaFlash.findMany({
      where: {
        notifiedAt: null,
        startsAt: { lte: agora, gte: new Date(agora.getTime() - 30 * 60_000) },
      },
      take: 20,
    });
    for (const flash of abriram) {
      const marcado = await this.prisma.arenaFlash.updateMany({
        where: { id: flash.id, notifiedAt: null },
        data: { notifiedAt: agora },
      });
      if (marcado.count === 0) continue; // outra réplica avisou primeiro
      try {
        await this.push.notifyChurch(
          flash.churchId,
          '⚡ DESAFIO SURPRESA!',
          `Você tem ${flash.windowMin} minutos para entrar na Arena. Corre!`,
          'arena',
          'arena',
        );
      } catch (err) {
        this.logger.warn(`aviso do surpresa falhou: ${String(err)}`);
      }
    }
  }
}
