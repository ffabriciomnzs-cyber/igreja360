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

export type Status =
  | 'INVITED'
  | 'ACTIVE'
  | 'WAITING_OPPONENT'
  | 'COMPLETED'
  | 'DECLINED'
  | 'EXPIRED';

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

  /**
   * Cria um desafio.
   *
   * Dois caminhos: sem `opponentId` o convite viaja por link (quem abrir vira
   * o adversário, e abrir já é aceitar); com `opponentId` — o caso da revanche
   * — o convite é NOMINAL, chega por push e pela Arena, e só vale depois que o
   * convidado aceitar. Sem isso a revanche nascia muda: o token existia só na
   * tela de quem pediu, e o outro nunca ficava sabendo.
   */
  async criar(
    churchId: string,
    memberId: string,
    opts: { rematchOf?: string; opponentId?: string } = {},
  ) {
    let opponentId = opts.opponentId ?? null;
    let anterior: { id: string } | null = null;

    if (opts.rematchOf) {
      const velho = await this.prisma.arenaDuel.findFirst({
        where: { id: opts.rematchOf, churchId },
      });
      if (!velho || !this.lado(velho, memberId)) {
        throw new NotFoundException('Desafio não encontrado.');
      }
      anterior = { id: velho.id };
      // A revanche é contra o mesmo adversário, sempre.
      opponentId =
        velho.challengerId === memberId ? velho.opponentId : velho.challengerId;
      if (!opponentId) {
        throw new BadRequestException('Este desafio ainda não teve adversário.');
      }
      const jaPedida = await this.prisma.arenaDuel.findFirst({
        where: { rematchOfId: velho.id, declinedAt: null },
        select: { token: true, id: true },
      });
      // Pedir revanche duas vezes devolve a mesma, em vez de encher o outro.
      if (jaPedida) return { token: jaPedida.token, id: jaPedida.id };
    }

    if (!opponentId) {
      const abertos = await this.prisma.arenaDuel.count({
        where: {
          churchId,
          challengerId: memberId,
          opponentId: null,
          declinedAt: null,
          expiresAt: { gt: new Date() },
        },
      });
      if (abertos >= MAX_ABERTOS) {
        throw new BadRequestException(
          'Você já tem desafios esperando resposta. Espere alguém aceitar.',
        );
      }
    }

    const duelo = await this.prisma.arenaDuel.create({
      data: {
        churchId,
        challengerId: memberId,
        opponentId,
        // Perguntas NOVAS: a revanche não reaproveita a partida anterior.
        questionIds: this.sorteia(),
        token: randomBytes(9).toString('base64url'),
        rematchOfId: anterior?.id ?? null,
        // Convite por link: abrir é aceitar, então já nasce aceito.
        acceptedAt: opponentId ? null : new Date(),
        expiresAt: new Date(Date.now() + VALIDADE_HORAS * 3600_000),
      },
    });

    if (opponentId) void this.avisaConvite(duelo.id).catch(() => undefined);
    return { token: duelo.token, id: duelo.id };
  }

  /** Aceitar é idempotente: dois toques não criam dois aceites. */
  async aceitar(churchId: string, memberId: string, duelId: string) {
    const duelo = await this.carrega(churchId, memberId, duelId);
    if (duelo.declinedAt) throw new BadRequestException('Este desafio foi recusado.');
    if (duelo.opponentId !== memberId) {
      throw new BadRequestException('Só quem foi convidado pode aceitar.');
    }
    if (!duelo.acceptedAt) {
      if (duelo.expiresAt < new Date()) {
        throw new BadRequestException('Este desafio expirou.');
      }
      await this.prisma.arenaDuel.updateMany({
        where: { id: duelId, acceptedAt: null },
        data: { acceptedAt: new Date() },
      });
    }
    return this.estado(churchId, memberId, duelId);
  }

  async recusar(churchId: string, memberId: string, duelId: string) {
    const duelo = await this.carrega(churchId, memberId, duelId);
    if (duelo.opponentId !== memberId) {
      throw new BadRequestException('Só quem foi convidado pode recusar.');
    }
    if (duelo.acceptedAt) {
      throw new BadRequestException('Você já aceitou este desafio.');
    }
    await this.prisma.arenaDuel.updateMany({
      where: { id: duelId, declinedAt: null },
      data: { declinedAt: new Date() },
    });
    return { ok: true };
  }

  /** Avisa o convidado. Um convite, um push — garantido por inviteSentAt. */
  private async avisaConvite(duelId: string): Promise<void> {
    const marcado = await this.prisma.arenaDuel.updateMany({
      where: { id: duelId, inviteSentAt: null },
      data: { inviteSentAt: new Date() },
    });
    if (marcado.count === 0) return;

    const duelo = await this.prisma.arenaDuel.findUnique({
      where: { id: duelId },
      include: { challenger: { select: { name: true } } },
    });
    if (!duelo?.opponentId) return;
    const igreja = await this.prisma.church.findUnique({
      where: { id: duelo.churchId },
      select: { slug: true },
    });
    const quem = duelo.challenger.name.split(' ')[0];
    await this.push.notifyMember(duelo.opponentId, {
      title: duelo.rematchOfId
        ? `🔁 ${quem} pediu revanche`
        : `⚔️ ${quem} desafiou você na Arena Bíblica`,
      body: duelo.rematchOfId
        ? 'Aceite e jogue novamente.'
        : 'Aceite o desafio e veja quem vence.',
      ...(igreja
        ? { url: `/portal/${igreja.slug}/arena/duelo/${duelo.token}` }
        : {}),
    });
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
      // Convite por link: abrir É aceitar. O updateMany com opponentId nulo
      // resolve a corrida de dois abrindo o mesmo link no mesmo instante.
      await this.prisma.arenaDuel.updateMany({
        where: { id: duelo.id, opponentId: null },
        data: { opponentId: memberId, acceptedAt: new Date() },
      });
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
      // Mesma pontuação é EMPATE, e ponto. Havia aqui um desempate por tempo
      // que ninguém combinou: num 1x1 ele elegia um vencedor, e cada lado lia
      // o mesmo resultado de um jeito — um via vitória, o outro derrota.
      vencedor = a === b ? 'draw' : a > b ? 'challenger' : 'opponent';
    }

    const agora = Date.now();
    const status: Status = duelo.declinedAt
      ? 'DECLINED'
      : encerrado
        ? 'COMPLETED'
        : !duelo.acceptedAt
          ? duelo.expiresAt.getTime() < agora
            ? 'EXPIRED'
            : 'INVITED'
          : meuLado && respondidas(memberId) >= duelo.questionIds.length
            ? 'WAITING_OPPONENT'
            : 'ACTIVE';

    const historico =
      duelo.opponentId && encerrado
        ? await this.historico(churchId, duelo.challengerId, duelo.opponentId)
        : null;

    return {
      id: duelo.id,
      token: duelo.token,
      status,
      isRematch: !!duelo.rematchOfId,
      /** Só o convidado decide; quem convidou espera. */
      canDecide: status === 'INVITED' && !!duelo.opponentId && meuLado === 'opponent',
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
        proximoId && !encerrado && status !== 'INVITED' && status !== 'DECLINED'
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
    if (!duelo.acceptedAt || duelo.declinedAt) {
      throw new BadRequestException('Este desafio ainda não está valendo.');
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
    if (!duelo.acceptedAt || duelo.declinedAt) {
      throw new BadRequestException('Este desafio ainda não está valendo.');
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

  /**
   * Resultado fechado: avisa quem não estava olhando.
   *
   * O placar em si não é "consolidado" numa coluna — ele é a contagem dos
   * turnos, então duas finalizações simultâneas chegam ao mesmo número e não
   * há o que duplicar. O que precisa de trava é o AVISO: resultSentAt garante
   * um push por duelo, mesmo com duas réplicas terminando junto.
   */
  private async avisaResultado(duelId: string): Promise<void> {
    const marcado = await this.prisma.arenaDuel.updateMany({
      where: { id: duelId, resultSentAt: null },
      data: { resultSentAt: new Date() },
    });
    if (marcado.count === 0) return;

    const duelo = await this.prisma.arenaDuel.findUnique({
      where: { id: duelId },
      include: {
        challenger: { select: { id: true, name: true } },
        opponent: { select: { id: true, name: true } },
        turns: { select: { memberId: true, correct: true } },
      },
    });
    if (!duelo?.opponentId || !duelo.opponent) return;
    const igreja = await this.prisma.church.findUnique({
      where: { id: duelo.churchId },
      select: { slug: true },
    });
    const url = igreja
      ? { url: `/portal/${igreja.slug}/arena/duelo/${duelo.token}` }
      : {};
    const placar = (quem: string) =>
      duelo.turns.filter((t) => t.memberId === quem && t.correct).length;
    const a = placar(duelo.challengerId);
    const b = placar(duelo.opponentId);

    const paraCada: [string, string, number, number][] = [
      [duelo.challengerId, duelo.opponent.name.split(' ')[0], a, b],
      [duelo.opponentId, duelo.challenger.name.split(' ')[0], b, a],
    ];
    for (const [quem, outro, meu, dele] of paraCada) {
      await this.push.notifyMember(quem, {
        title:
          meu === dele
            ? `🤝 Empate! ${meu} x ${dele}`
            : meu > dele
              ? `🏆 Você venceu! ${meu} x ${dele}`
              : `${outro} venceu ${dele} x ${meu}`,
        body: `Desafio contra ${outro} terminou. Quer a revanche?`,
        ...url,
      });
    }
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

  /**
   * O que a Arena precisa mostrar. Separado por TIPO, porque "aceite este
   * convite" e "espere o outro aceitar" pedem coisas diferentes de quem lê —
   * uma lista só, misturada, empurrava a decisão para o WhatsApp.
   */
  async meus(churchId: string, memberId: string) {
    const duelos = await this.prisma.arenaDuel.findMany({
      where: {
        churchId,
        declinedAt: null,
        OR: [{ challengerId: memberId }, { opponentId: memberId }],
        createdAt: { gt: new Date(Date.now() - 7 * 86_400_000) },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: {
        turns: { select: { memberId: true, answeredAt: true, correct: true } },
        challenger: { select: { id: true, name: true, photo: true } },
        opponent: { select: { id: true, name: true, photo: true } },
      },
    });

    const agora = Date.now();
    const lista = duelos.map((d) => {
      const feitas = (quem: string | null) =>
        quem ? d.turns.filter((t) => t.memberId === quem && t.answeredAt).length : 0;
      const souDesafiante = d.challengerId === memberId;
      const outro = souDesafiante ? d.opponent : d.challenger;
      const eu = feitas(memberId);
      const dele = feitas(souDesafiante ? d.opponentId : d.challengerId);
      const encerrado = eu >= d.questionIds.length && dele >= d.questionIds.length;
      const expirado = !d.acceptedAt && d.expiresAt.getTime() < agora;

      return {
        id: d.id,
        token: d.token,
        total: d.questionIds.length,
        opponentName: outro?.name ?? null,
        opponentPhoto: outro?.photo ?? null,
        iAmChallenger: souDesafiante,
        isRematch: !!d.rematchOfId,
        myAnswered: eu,
        finished: encerrado,
        /** Convite nominal esperando a MINHA decisão. */
        awaitingMyAnswer: !d.acceptedAt && !souDesafiante && !!d.opponentId && !expirado,
        /** Convite que EU mandei e ainda não foi respondido. */
        awaitingThem: !d.acceptedAt && souDesafiante && !expirado,
        myTurn: !!d.acceptedAt && !encerrado && eu < d.questionIds.length,
        waitingOther: !!d.acceptedAt && eu >= d.questionIds.length && !encerrado,
        expired: expirado,
        createdAt: d.createdAt,
      };
    });

    return {
      received: lista.filter((d) => d.awaitingMyAnswer),
      sent: lista.filter((d) => d.awaitingThem),
      playing: lista.filter((d) => d.myTurn || d.waitingOther),
      finished: lista.filter((d) => d.finished).slice(0, 3),
    };
  }
}
