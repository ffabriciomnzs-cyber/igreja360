import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PushService } from '../push/push.service';
import { QUESTIONS, ArenaQuestion } from './questions';
import {
  Ciclo,
  cicloAnterior,
  cicloDoDia,
  hojeBrt,
  posicaoNaSemana,
} from './cycle';
import { TEMA_LIVRE, perguntasDoTema, porDiaDoTema } from './themes';
import {
  PERGUNTAS_POR_DIA,
  PONTOS_POR_ACERTO,
  RODADA_COMPLETA_A_PARTIR_DE,
  SEGUNDOS_POR_PERGUNTA,
  TOLERANCIA_MS,
} from './config';
import { SeasonsService } from './seasons.service';

// Os testes (e as temporadas) importam daqui desde antes de config.ts existir.
export { PERGUNTAS_POR_DIA, SEGUNDOS_POR_PERGUNTA };

/** "AAAA-MM-DD" no fuso de Brasília — o dia vira à meia-noite BRT, não UTC. */
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
function sorteioGeral(day: string, churchId: string): ArenaQuestion[] {
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
    .map((i) => QUESTIONS[i]);
}

/**
 * O tema TEMPERA o dia em vez de tomá-lo inteiro.
 *
 * Uma semana come 84 perguntas e quase nenhum tema tem tudo isso: "Cartas de
 * Paulo" são 29 no acervo. Então entram quantas o tema aguenta sem ninguém ver
 * a mesma duas vezes na semana (aqui, 4 por dia) e o resto vem do sorteio
 * geral. A semana tem cara de tema e continua sem repetição.
 */
function sorteioComTema(
  day: string,
  churchId: string,
  temaId: string,
): ArenaQuestion[] {
  const geral = sorteioGeral(day, churchId);
  const porDia = porDiaDoTema(temaId, PERGUNTAS_POR_DIA);
  if (porDia < 1) return geral;

  const ciclo = cicloDoDia(day);
  const pool = embaralhado(
    perguntasDoTema(temaId),
    criaPrng(fnv1a(`tema:${temaId}|${ciclo.fim}|${churchId}`)),
  );
  const posicao = posicaoNaSemana(day);
  const doTema = pool.slice(posicao * porDia, posicao * porDia + porDia);

  const jaTem = new Set(doTema.map((q) => q.id));
  const completa = geral
    .filter((q) => !jaTem.has(q.id))
    .slice(0, PERGUNTAS_POR_DIA - doTema.length);

  // Mistura para as do tema não caírem sempre nas primeiras posições.
  return embaralhado(
    [...doTema, ...completa],
    criaPrng(fnv1a(`mistura|${day}|${churchId}`)),
  );
}

export function perguntasDoDia(
  day: string,
  churchId: string,
  temaId?: string | null,
): ArenaQuestion[] {
  const cruas =
    temaId && temaId !== TEMA_LIVRE
      ? sorteioComTema(day, churchId, temaId)
      : sorteioGeral(day, churchId);
  return cruas.map((q) => comOpcoesEmbaralhadas(q, day, churchId));
}

@Injectable()
export class ArenaService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly push: PushService,
    private readonly seasons: SeasonsService,
  ) {}

  /** Desafio de hoje: perguntas SEM a resposta + o que o membro já respondeu. */
  async today(churchId: string, memberId: string) {
    const day = hojeBrt();
    const temporada = await this.seasons.temporadaAtual(churchId);
    const perguntas = perguntasDoDia(day, churchId, temporada?.theme);

    const [respondidas, aberturas] = await Promise.all([
      this.prisma.arenaAnswer.findMany({
        where: { memberId, day },
        select: {
          questionId: true,
          choice: true,
          correct: true,
          points: true,
          timedOut: true,
        },
      }),
      this.prisma.arenaQuestionOpen.findMany({
        where: { memberId, day },
        select: { questionId: true, openedAt: true },
      }),
    ]);
    const porPergunta = new Map(respondidas.map((r) => [r.questionId, r]));
    const porAbertura = new Map(aberturas.map((a) => [a.questionId, a.openedAt]));

    const idsDoTema = new Set(
      temporada ? perguntasDoTema(temporada.theme).map((q) => q.id) : [],
    );
    const doTema = perguntas.filter((q) => idsDoTema.has(q.id)).length;
    const feitas = respondidas.length;
    const pontosDoDia = respondidas.reduce((soma, r) => soma + r.points, 0);

    return {
      day,
      pointsPerHit: PONTOS_POR_ACERTO,
      secondsPerQuestion: SEGUNDOS_POR_PERGUNTA,
      // Progresso da rodada. Os pontos do dia só entram no ranking quando as
      // 12 forem enfrentadas, então a tela precisa dizer isso com clareza —
      // ninguém pode descobrir a regra só ao perder os pontos.
      // Quantas das 12 de hoje são mesmo do tema. A tela promete só isto —
      // o acervo raramente dá uma semana inteira temática, e anunciar o que
      // não se entrega é pior do que anunciar menos.
      season: temporada
        ? { ...temporada, questionsFromTheme: doTema, questionsTotal: PERGUNTAS_POR_DIA }
        : null,
      roundTotal: PERGUNTAS_POR_DIA,
      roundAnswered: feitas,
      roundComplete: feitas >= PERGUNTAS_POR_DIA,
      roundPoints: pontosDoDia,
      questions: perguntas.map((q) => {
        const resposta = porPergunta.get(q.id);
        const abertura = porAbertura.get(q.id);
        return {
          id: q.id,
          question: q.question,
          options: q.options,
          // Retoma o cronômetro de onde parou: quem recarrega a página no
          // meio da pergunta não ganha o tempo cheio de novo.
          remaining: abertura ? this.restante(abertura) : null,
          // Só depois de responder o membro vê o gabarito e a referência.
          answered: resposta
            ? {
                choice: resposta.choice,
                correct: resposta.correct,
                points: resposta.points,
                timedOut: resposta.timedOut,
                answer: q.answer,
                ref: q.ref,
              }
            : null,
        };
      }),
    };
  }

  /** Corrige e pontua NO SERVIDOR. Uma tentativa por pergunta por dia. */
  /**
   * Pontos de cada membro no período, contando SÓ as rodadas concluídas.
   *
   * A regra: o dia só vale se as 12 perguntas foram enfrentadas. Meia rodada
   * não pontua — quem abre o app, pega as fáceis e some não aparece no
   * ranking. Uma pergunta que estourou o tempo CONTA como enfrentada (ela
   * ficou registrada valendo zero): terminar é obrigatório, acertar não.
   */
  private async pontosPorMembro(
    churchId: string,
    dias?: { gte: string; lte: string },
  ): Promise<Map<string, { points: number; answers: number; rounds: number }>> {
    const porDia = await this.prisma.arenaAnswer.groupBy({
      by: ['memberId', 'day'],
      where: { churchId, ...(dias ? { day: dias } : {}) },
      _sum: { points: true },
      _count: { _all: true },
    });

    const total = new Map<
      string,
      { points: number; answers: number; rounds: number }
    >();
    for (const dia of porDia) {
      const valeARegra = dia.day >= RODADA_COMPLETA_A_PARTIR_DE;
      if (valeARegra && dia._count._all < PERGUNTAS_POR_DIA) continue; // pela metade
      const atual = total.get(dia.memberId) ?? {
        points: 0,
        answers: 0,
        rounds: 0,
      };
      atual.points += dia._sum.points ?? 0;
      atual.answers += dia._count._all;
      atual.rounds += 1;
      total.set(dia.memberId, atual);
    }
    await this.somaDoSurpresa(churchId, total, dias);
    return total;
  }

  /**
   * Junta ao ranking os pontos do desafio surpresa.
   *
   * O surpresa vive em outra tabela (ArenaRoundTurn), separada para o duelo
   * 1x1 não contaminar a disputa — e o surpresa tinha ido junto no mesmo
   * balde, o que deixava o "bônus configurável" do painel sem destino: o
   * número aparecia na tela do desafio e morria ali.
   *
   * Aqui ele entra no placar, mas por fora da regra da rodada completa: o
   * surpresa é uma corrida de poucos minutos, não uma rodada do dia, e exigir
   * que estivesse "inteiro" puniria quem entrou correndo — que é justamente
   * quem atendeu ao chamado.
   */
  private async somaDoSurpresa(
    churchId: string,
    total: Map<string, { points: number; answers: number; rounds: number }>,
    dias?: { gte: string; lte: string },
  ): Promise<void> {
    // O dia da igreja vai das 03:00 UTC de um dia às 02:59 do seguinte.
    const janela = dias
      ? {
          startsAt: {
            gte: new Date(`${dias.gte}T03:00:00.000Z`),
            lt: new Date(
              new Date(`${dias.lte}T03:00:00.000Z`).getTime() + 86_400_000,
            ),
          },
        }
      : {};

    const surpresas = await this.prisma.arenaFlash.findMany({
      where: { churchId, ...janela },
      select: {
        bonus: true,
        turns: { where: { correct: true }, select: { memberId: true } },
      },
    });

    for (const flash of surpresas) {
      for (const turno of flash.turns) {
        const atual = total.get(turno.memberId) ?? {
          points: 0,
          answers: 0,
          rounds: 0,
        };
        atual.points += flash.bonus;
        total.set(turno.memberId, atual);
      }
    }
  }

  /** Quantas perguntas de hoje o membro já enfrentou, e quanto somou nelas. */
  private async rodadaDoDia(
    memberId: string,
    day: string,
  ): Promise<{ respondidas: number; pontos: number; completa: boolean }> {
    const resumo = await this.prisma.arenaAnswer.aggregate({
      where: { memberId, day },
      _sum: { points: true },
      _count: { _all: true },
    });
    const respondidas = resumo._count._all;
    return {
      respondidas,
      pontos: resumo._sum.points ?? 0,
      completa: respondidas >= PERGUNTAS_POR_DIA,
    };
  }

  /** Segundos que ainda restam de uma pergunta aberta (nunca negativo). */
  private restante(abertaEm: Date): number {
    const decorrido = (Date.now() - abertaEm.getTime()) / 1000;
    return Math.max(0, Math.ceil(SEGUNDOS_POR_PERGUNTA - decorrido));
  }

  /**
   * A pergunta pedida, se ela for mesmo do desafio de hoje.
   *
   * Recebe o tema em vez de buscá-lo: os quatro caminhos (abrir, responder,
   * estourar e listar) precisam sortear o MESMO dia, e um deles buscando o
   * tema por conta própria seria a forma mais discreta de discordarem.
   */
  private perguntaDeHoje(
    churchId: string,
    day: string,
    questionId: string,
    temaId?: string | null,
  ) {
    const pergunta = perguntasDoDia(day, churchId, temaId).find(
      (q) => q.id === questionId,
    );
    // Pergunta fora do sorteio de hoje = tentativa de burlar (ou app velho).
    if (!pergunta) {
      throw new BadRequestException('Essa pergunta não é do desafio de hoje.');
    }
    return pergunta;
  }

  /**
   * Liga o cronômetro da pergunta.
   *
   * O upsert é o coração da defesa: se a abertura já existe, ela é MANTIDA.
   * Reabrir não reinicia a contagem, então fechar o app, pesquisar a resposta
   * e voltar não devolve tempo nenhum.
   */
  async open(churchId: string, memberId: string, questionId: string) {
    const day = hojeBrt();
    const tema = await this.seasons.temaDeHoje(churchId);
    this.perguntaDeHoje(churchId, day, questionId, tema);

    const jaRespondeu = await this.prisma.arenaAnswer.findUnique({
      where: { memberId_day_questionId: { memberId, day, questionId } },
      select: { id: true },
    });
    if (jaRespondeu) {
      throw new ConflictException('Você já respondeu essa pergunta hoje.');
    }

    const abertura = await this.prisma.arenaQuestionOpen.upsert({
      where: { memberId_day_questionId: { memberId, day, questionId } },
      create: { churchId, memberId, day, questionId },
      update: {},
      select: { openedAt: true },
    });

    return {
      questionId,
      seconds: SEGUNDOS_POR_PERGUNTA,
      remaining: this.restante(abertura.openedAt),
    };
  }

  /**
   * O tempo acabou sem resposta: registra o zero para a pergunta não voltar
   * como pendente e devolve o gabarito, que aí já pode ser mostrado.
   */
  async timeout(churchId: string, memberId: string, questionId: string) {
    const day = hojeBrt();
    const tema = await this.seasons.temaDeHoje(churchId);
    const pergunta = this.perguntaDeHoje(churchId, day, questionId, tema);

    const abertura = await this.prisma.arenaQuestionOpen.findUnique({
      where: { memberId_day_questionId: { memberId, day, questionId } },
      select: { openedAt: true },
    });
    if (!abertura) {
      throw new BadRequestException('Essa pergunta nem chegou a ser aberta.');
    }
    // Só o servidor decide que o tempo acabou. Sem isto, o app poderia
    // "queimar" uma pergunta difícil na hora que quisesse.
    if (this.restante(abertura.openedAt) > 0) {
      throw new BadRequestException('Ainda há tempo para responder.');
    }

    try {
      await this.prisma.arenaAnswer.create({
        data: {
          churchId,
          memberId,
          day,
          questionId,
          choice: -1, // -1 = não respondeu
          correct: false,
          points: 0,
          timedOut: true,
        },
      });
    } catch (err) {
      if ((err as { code?: string })?.code !== 'P2002') throw err;
      // Já registrado (dois toques, duas abas): só devolve o gabarito.
    }

    const rodada = await this.rodadaDoDia(memberId, day);
    if (rodada.completa) {
      void this.avisaSeNovoLider(churchId, memberId, rodada.pontos).catch(
        () => undefined,
      );
    }

    return {
      correct: false,
      points: 0,
      timedOut: true,
      answer: pergunta.answer,
      ref: pergunta.ref,
      roundComplete: rodada.completa,
      roundAnswered: rodada.respondidas,
      roundTotal: PERGUNTAS_POR_DIA,
      roundPoints: rodada.pontos,
    };
  }

  async answer(
    churchId: string,
    memberId: string,
    questionId: string,
    choice: number,
  ) {
    const day = hojeBrt();
    const tema = await this.seasons.temaDeHoje(churchId);
    const pergunta = this.perguntaDeHoje(churchId, day, questionId, tema);
    if (!Number.isInteger(choice) || choice < 0 || choice > 3) {
      throw new BadRequestException('Alternativa inválida.');
    }

    // O cronômetro do servidor manda. Uma resposta que chega depois dos 30
    // segundos vale ZERO mesmo estando certa — é o que impede pausar a tela,
    // procurar no Google e voltar para pontuar.
    const abertura = await this.prisma.arenaQuestionOpen.findUnique({
      where: { memberId_day_questionId: { memberId, day, questionId } },
      select: { openedAt: true },
    });
    if (!abertura) {
      throw new BadRequestException('Abra a pergunta antes de responder.');
    }
    const decorridoMs = Date.now() - abertura.openedAt.getTime();
    const timedOut = decorridoMs > SEGUNDOS_POR_PERGUNTA * 1000 + TOLERANCIA_MS;

    const correct = pergunta.answer === choice;
    const points = correct && !timedOut ? PONTOS_POR_ACERTO : 0;

    try {
      await this.prisma.arenaAnswer.create({
        data: {
          churchId,
          memberId,
          day,
          questionId,
          choice,
          correct,
          points,
          timedOut,
        },
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
    // A rodada acabou de fechar? Só aí os pontos do dia passam a valer, e só
    // aí faz sentido conferir se a liderança mudou de mãos.
    const rodada = await this.rodadaDoDia(memberId, day);
    if (rodada.completa) {
      void this.avisaSeNovoLider(churchId, memberId, rodada.pontos).catch(
        () => undefined,
      );
    }

    return {
      correct,
      points,
      timedOut,
      answer: pergunta.answer,
      ref: pergunta.ref,
      roundComplete: rodada.completa,
      roundAnswered: rodada.respondidas,
      roundTotal: PERGUNTAS_POR_DIA,
      roundPoints: rodada.pontos,
    };
  }

  /**
   * Detecta a TROCA de líder da SEMANA corrente: notifica só quando este
   * acerto fez o membro cruzar para o 1º lugar (antes dele estava alguém —
   * ou ninguém). Empate não conta como ultrapassagem, então não há spam.
   */
  private async avisaSeNovoLider(
    churchId: string,
    memberId: string,
    /** Os pontos da rodada que acabou de fechar — é o que ele "ganhou" agora. */
    pontosGanhos: number,
  ): Promise<void> {
    const ciclo = cicloDoDia(hojeBrt());
    const somas = await this.pontosPorMembro(churchId, {
      gte: ciclo.inicio,
      lte: ciclo.fim,
    });

    const minha = somas.get(memberId)?.points ?? 0;
    const maiorDosOutros = Math.max(
      0,
      ...[...somas.entries()]
        .filter(([id]) => id !== memberId)
        .map(([, t]) => t.points),
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
      `${membro.name} assumiu o topo da semana com ${minha} pontos. O ciclo fecha no sábado — quem alcança?`,
      'arena',
    );
  }

  /**
   * Campeão da última semana ENCERRADA — é quem aparece com a coroa na tela
   * inicial, do domingo até o sábado seguinte. Devolve null enquanto o
   * primeiro ciclo não fechou, ou se ninguém pontuou na semana.
   */
  async campeaoDaSemana(churchId: string) {
    const ciclo: Ciclo | null = cicloAnterior(hojeBrt());
    if (!ciclo) return null;

    const somas = await this.pontosPorMembro(churchId, {
      gte: ciclo.inicio,
      lte: ciclo.fim,
    });
    if (!somas.size) return null;

    const vencedor = [...somas.entries()]
      .map(([memberId, t]) => ({ memberId, points: t.points, rounds: t.rounds }))
      // Empate no ponto: leva quem precisou de MENOS rodadas para chegar lá;
      // persistindo o empate, o id mais antigo, para o resultado ser estável.
      .sort(
        (a, b) =>
          b.points - a.points ||
          a.rounds - b.rounds ||
          a.memberId.localeCompare(b.memberId),
      )[0];
    if (!vencedor || vencedor.points <= 0) return null;

    const membro = await this.prisma.member.findUnique({
      where: { id: vencedor.memberId },
      select: { id: true, name: true, photo: true, gender: true },
    });
    if (!membro) return null;

    return {
      memberId: membro.id,
      name: membro.name,
      photo: membro.photo,
      title: membro.gender === 'FEMALE' ? 'Campeã da semana' : 'Campeão da semana',
      points: vencedor.points,
      cycleStart: ciclo.inicio,
      cycleEnd: ciclo.fim,
    };
  }

  /**
   * Ranking da igreja. `period` = 'week' (a competição corrente, que fecha no
   * sábado) ou 'all' (histórico). Devolve o top e a posição do próprio membro.
   */
  async ranking(churchId: string, memberId: string, period: 'week' | 'all') {
    const ciclo = cicloDoDia(hojeBrt());
    const where: {
      churchId: string;
      day?: { gte: string; lte: string };
    } = { churchId };
    if (period === 'week') {
      where.day = { gte: ciclo.inicio, lte: ciclo.fim };
    }

    const somas = await this.pontosPorMembro(churchId, where.day);

    const ordenado = [...somas.entries()]
      .map(([memberId, t]) => ({ memberId, points: t.points }))
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
      // A tela usa para dizer "vale até sábado" e mostrar a contagem.
      cycleStart: ciclo.inicio,
      cycleEnd: ciclo.fim,
      firstCycle: ciclo.primeiro,
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
