import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service';
import { PushService } from '../push/push.service';
import { QUESTIONS, ArenaQuestion } from './questions';
import { SEGUNDOS_POR_PERGUNTA, TOLERANCIA_MS } from './config';

/** Um duelo é curto de propósito: é para jogar no intervalo de uma conversa. */
const PERGUNTAS_POR_DUELO = 5;
/** Convite sem resposta vira lixo; dois dias é o bastante para um desafio. */
const VALIDADE_HORAS = 48;
/** Trava simples contra encher o app de convites abertos. */
const MAX_ABERTOS = 5;

type Lado = 'challenger' | 'opponent';

@Injectable()
export class DuelsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly push: PushService,
  ) {}

  /** Sorteia perguntas do acervo inteiro — o duelo não usa o dia da Arena. */
  private sorteia(): string[] {
    const escolhidas = new Set<string>();
    while (escolhidas.size < PERGUNTAS_POR_DUELO) {
      escolhidas.add(QUESTIONS[Math.floor(Math.random() * QUESTIONS.length)].id);
    }
    return [...escolhidas];
  }

  private pergunta(id: string): ArenaQuestion {
    const q = QUESTIONS.find((x) => x.id === id);
    if (!q) throw new NotFoundException('Pergunta não encontrada.');
    return q;
  }

  /**
   * As alternativas embaralhadas por (duelo, pergunta) — iguais para os dois
   * jogadores. Se cada um visse uma ordem, comparar as respostas numa conversa
   * viraria confusão, e a disputa perderia a graça.
   */
  private embaralha(duelId: string, q: ArenaQuestion): ArenaQuestion {
    let h = 0x811c9dc5;
    for (const ch of `${duelId}|${q.id}`) {
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
    const perm = [0, 1, 2, 3];
    for (let i = 3; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [perm[i], perm[j]] = [perm[j], perm[i]];
    }
    return {
      ...q,
      options: perm.map((i) => q.options[i]) as ArenaQuestion['options'],
      answer: perm.indexOf(q.answer) as ArenaQuestion['answer'],
    };
  }

  async criar(churchId: string, memberId: string, rematchOfId?: string) {
    const abertos = await this.prisma.arenaDuel.count({
      where: {
        churchId,
        challengerId: memberId,
        opponentId: null,
        expiresAt: { gt: new Date() },
      },
    });
    if (abertos >= MAX_ABERTOS) {
      throw new BadRequestException(
        'Você já tem desafios esperando resposta. Espere alguém aceitar.',
      );
    }

    const duelo = await this.prisma.arenaDuel.create({
      data: {
        churchId,
        challengerId: memberId,
        questionIds: this.sorteia(),
        token: randomBytes(9).toString('base64url'),
        rematchOfId: rematchOfId ?? null,
        expiresAt: new Date(Date.now() + VALIDADE_HORAS * 3600_000),
      },
    });
    return { token: duelo.token, id: duelo.id };
  }

  /** Abre o duelo pelo link. Quem chega sem ser o autor vira o adversário. */
  async abrirPeloToken(churchId: string, memberId: string, token: string) {
    const duelo = await this.prisma.arenaDuel.findFirst({
      where: { token, churchId },
    });
    if (!duelo) throw new NotFoundException('Desafio não encontrado.');

    if (!duelo.opponentId && duelo.challengerId !== memberId) {
      if (duelo.expiresAt < new Date()) {
        throw new BadRequestException('Este desafio expirou.');
      }
      try {
        await this.prisma.arenaDuel.update({
          where: { id: duelo.id, opponentId: null },
          data: { opponentId: memberId },
        });
      } catch {
        // Dois abriram o link ao mesmo tempo: o primeiro ficou com a vaga.
      }
    }
    return this.estado(churchId, memberId, duelo.id);
  }

  private lado(
    duelo: { challengerId: string; opponentId: string | null },
    memberId: string,
  ): Lado | null {
    if (duelo.challengerId === memberId) return 'challenger';
    if (duelo.opponentId === memberId) return 'opponent';
    return null;
  }

  async estado(churchId: string, memberId: string, duelId: string) {
    const duelo = await this.prisma.arenaDuel.findFirst({
      where: { id: duelId, churchId },
      include: {
        turns: true,
        challenger: { select: { id: true, name: true, photo: true } },
        opponent: { select: { id: true, name: true, photo: true } },
      },
    });
    if (!duelo) throw new NotFoundException('Desafio não encontrado.');

    const meuLado = this.lado(duelo, memberId);
    const placar = (quem: string | null) =>
      quem
        ? duelo.turns.filter((t) => t.memberId === quem && t.correct === true).length
        : 0;
    const respondidas = (quem: string | null) =>
      quem
        ? duelo.turns.filter((t) => t.memberId === quem && t.answeredAt !== null)
            .length
        : 0;

    const desafianteFim = respondidas(duelo.challengerId) >= duelo.questionIds.length;
    const desafiadoFim =
      !!duelo.opponentId && respondidas(duelo.opponentId) >= duelo.questionIds.length;
    const encerrado = desafianteFim && desafiadoFim;

    // Minha próxima pergunta: a primeira ainda não respondida por mim.
    const minhas = new Set(
      duelo.turns
        .filter((t) => t.memberId === memberId && t.answeredAt !== null)
        .map((t) => t.questionId),
    );
    const proximoId = meuLado
      ? (duelo.questionIds.find((id) => !minhas.has(id)) ?? null)
      : null;
    const turnoAberto = proximoId
      ? duelo.turns.find(
          (t) => t.memberId === memberId && t.questionId === proximoId,
        )
      : undefined;

    let vencedor: 'challenger' | 'opponent' | 'draw' | null = null;
    if (encerrado) {
      const a = placar(duelo.challengerId);
      const b = placar(duelo.opponentId);
      if (a !== b) vencedor = a > b ? 'challenger' : 'opponent';
      else {
        // Empate no acerto: leva quem respondeu mais rápido no total.
        const tempo = (quem: string | null) =>
          duelo.turns
            .filter((t) => t.memberId === quem && t.answeredAt)
            .reduce(
              (soma, t) => soma + (t.answeredAt!.getTime() - t.openedAt.getTime()),
              0,
            );
        const ta = tempo(duelo.challengerId);
        const tb = tempo(duelo.opponentId);
        vencedor = ta === tb ? 'draw' : ta < tb ? 'challenger' : 'opponent';
      }
    }

    const historico =
      duelo.opponentId && encerrado
        ? await this.historico(churchId, duelo.challengerId, duelo.opponentId)
        : null;

    return {
      id: duelo.id,
      token: duelo.token,
      total: duelo.questionIds.length,
      seconds: SEGUNDOS_POR_PERGUNTA,
      side: meuLado,
      challenger: {
        id: duelo.challenger.id,
        name: duelo.challenger.name,
        photo: duelo.challenger.photo,
        score: placar(duelo.challengerId),
        answered: respondidas(duelo.challengerId),
        done: desafianteFim,
      },
      opponent: duelo.opponent
        ? {
            id: duelo.opponent.id,
            name: duelo.opponent.name,
            photo: duelo.opponent.photo,
            // O placar do outro só aparece quando ele termina: saber quanto
            // falta para alcançar tiraria o sentido de responder com verdade.
            score: desafiadoFim ? placar(duelo.opponentId) : null,
            answered: respondidas(duelo.opponentId),
            done: desafiadoFim,
          }
        : null,
      finished: encerrado,
      winner: vencedor,
      history: historico,
      expiresAt: duelo.expiresAt,
      // A pergunta da vez, sem gabarito.
      current:
        proximoId && !encerrado
          ? (() => {
              const q = this.embaralha(duelo.id, this.pergunta(proximoId));
              return {
                id: q.id,
                question: q.question,
                options: q.options,
                remaining: turnoAberto ? this.restante(turnoAberto.openedAt) : null,
                index: duelo.questionIds.indexOf(proximoId) + 1,
              };
            })()
          : null,
    };
  }

  private restante(abertaEm: Date): number {
    return Math.max(
      0,
      Math.ceil(SEGUNDOS_POR_PERGUNTA - (Date.now() - abertaEm.getTime()) / 1000),
    );
  }

  private async carrega(churchId: string, memberId: string, duelId: string) {
    const duelo = await this.prisma.arenaDuel.findFirst({
      where: { id: duelId, churchId },
    });
    if (!duelo) throw new NotFoundException('Desafio não encontrado.');
    if (!this.lado(duelo, memberId)) {
      throw new NotFoundException('Você não está neste desafio.');
    }
    return duelo;
  }

  /** Liga o cronômetro desta pergunta do duelo (mesma defesa da Arena). */
  async abrirPergunta(
    churchId: string,
    memberId: string,
    duelId: string,
    questionId: string,
  ) {
    const duelo = await this.carrega(churchId, memberId, duelId);
    if (!duelo.questionIds.includes(questionId)) {
      throw new BadRequestException('Essa pergunta não é deste desafio.');
    }
    const turno = await this.prisma.arenaRoundTurn.upsert({
      where: {
        duelId_memberId_questionId: { duelId, memberId, questionId },
      },
      create: { churchId, kind: 'DUEL', duelId, memberId, questionId },
      update: {}, // reabrir não devolve tempo
      select: { openedAt: true, answeredAt: true },
    });
    if (turno.answeredAt) {
      throw new ConflictException('Você já respondeu essa pergunta.');
    }
    return { questionId, seconds: SEGUNDOS_POR_PERGUNTA, remaining: this.restante(turno.openedAt) };
  }

  async responder(
    churchId: string,
    memberId: string,
    duelId: string,
    questionId: string,
    choice: number,
  ) {
    const duelo = await this.carrega(churchId, memberId, duelId);
    if (!duelo.questionIds.includes(questionId)) {
      throw new BadRequestException('Essa pergunta não é deste desafio.');
    }
    const turno = await this.prisma.arenaRoundTurn.findUnique({
      where: { duelId_memberId_questionId: { duelId, memberId, questionId } },
    });
    if (!turno) throw new BadRequestException('Abra a pergunta antes de responder.');
    if (turno.answeredAt) {
      throw new ConflictException('Você já respondeu essa pergunta.');
    }

    const q = this.embaralha(duelId, this.pergunta(questionId));
    const noTempo =
      Date.now() - turno.openedAt.getTime() <=
      SEGUNDOS_POR_PERGUNTA * 1000 + TOLERANCIA_MS;
    // -1 = o tempo acabou sem resposta.
    const escolheu = Number.isInteger(choice) && choice >= 0 && choice <= 3;
    const acertou = escolheu && noTempo && q.answer === choice;

    await this.prisma.arenaRoundTurn.update({
      where: { id: turno.id },
      data: {
        choice: escolheu ? choice : -1,
        correct: acertou,
        answeredAt: new Date(),
      },
    });

    const estado = await this.estado(churchId, memberId, duelId);
    // Terminou e o outro já tinha terminado? Avisa quem estava esperando.
    if (estado.finished) void this.avisaResultado(duelo.id).catch(() => undefined);
    return { correct: acertou, timedOut: !noTempo, answer: q.answer, ref: q.ref, state: estado };
  }

  private async avisaResultado(duelId: string): Promise<void> {
    const duelo = await this.prisma.arenaDuel.findUnique({
      where: { id: duelId },
      include: {
        challenger: { select: { name: true } },
        opponent: { select: { name: true } },
      },
    });
    if (!duelo?.opponentId) return;
    const igreja = await this.prisma.church.findUnique({
      where: { id: duelo.churchId },
      select: { slug: true },
    });
    await this.push.notifyMember(duelo.challengerId, {
      title: '⚔️ Seu desafio terminou!',
      body: `${duelo.opponent?.name ?? 'Alguém'} respondeu ao seu desafio. Veja quem venceu.`,
      ...(igreja
        ? { url: `/portal/${igreja.slug}/arena/duelo/${duelo.token}` }
        : {}),
    });
  }

  /** "Lucas 4 x 3 Pedro": vitórias de cada um nos duelos já encerrados. */
  async historico(churchId: string, aId: string, bId: string) {
    const duelos = await this.prisma.arenaDuel.findMany({
      where: {
        churchId,
        OR: [
          { challengerId: aId, opponentId: bId },
          { challengerId: bId, opponentId: aId },
        ],
      },
      include: { turns: { select: { memberId: true, correct: true, answeredAt: true } } },
    });

    let vitoriasA = 0;
    let vitoriasB = 0;
    let empates = 0;
    for (const d of duelos) {
      const feitas = (quem: string) =>
        d.turns.filter((t) => t.memberId === quem && t.answeredAt).length;
      if (feitas(aId) < d.questionIds.length || feitas(bId) < d.questionIds.length) {
        continue; // ainda em andamento: não entra na conta
      }
      const acertos = (quem: string) =>
        d.turns.filter((t) => t.memberId === quem && t.correct).length;
      const ga = acertos(aId);
      const gb = acertos(bId);
      if (ga > gb) vitoriasA++;
      else if (gb > ga) vitoriasB++;
      else empates++;
    }
    return { aWins: vitoriasA, bWins: vitoriasB, draws: empates };
  }

  /** Duelos que pedem ação: convites recebidos e os meus esperando resposta. */
  async meus(churchId: string, memberId: string) {
    const duelos = await this.prisma.arenaDuel.findMany({
      where: {
        churchId,
        OR: [{ challengerId: memberId }, { opponentId: memberId }],
        expiresAt: { gt: new Date(Date.now() - 7 * 86_400_000) },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        turns: { select: { memberId: true, answeredAt: true, correct: true } },
        challenger: { select: { id: true, name: true, photo: true } },
        opponent: { select: { id: true, name: true, photo: true } },
      },
    });

    return duelos.map((d) => {
      const feitas = (quem: string | null) =>
        quem ? d.turns.filter((t) => t.memberId === quem && t.answeredAt).length : 0;
      const souDesafiante = d.challengerId === memberId;
      const outro = souDesafiante ? d.opponent : d.challenger;
      const minhasFeitas = feitas(memberId);
      return {
        id: d.id,
        token: d.token,
        total: d.questionIds.length,
        opponentName: outro?.name ?? null,
        opponentPhoto: outro?.photo ?? null,
        iAmChallenger: souDesafiante,
        myAnswered: minhasFeitas,
        myTurn: minhasFeitas < d.questionIds.length && (!souDesafiante || !!d.opponentId || true),
        waitingOther:
          minhasFeitas >= d.questionIds.length &&
          (!d.opponentId || feitas(souDesafiante ? d.opponentId : d.challengerId) < d.questionIds.length),
        pendingInvite: !d.opponentId && souDesafiante,
        createdAt: d.createdAt,
      };
    });
  }
}
