import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { cicloAnterior, cicloDoDia, hojeBrt } from './cycle';
import { PERGUNTAS_POR_DIA } from './config';
import { TEMAS, temaPorId, temasDisponiveis } from './themes';

/** Quantas opções entram na votação da próxima temporada. */
const OPCOES_NA_VOTACAO = 3;

/**
 * Temporadas temáticas e a votação que escolhe a próxima.
 *
 * Nada aqui depende de alguém lembrar de virar a semana: a temporada e a
 * votação nascem sozinhas no primeiro acesso do ciclo, e a apuração acontece
 * ao criar a temporada seguinte. Um cron a mais seria mais uma coisa para
 * quebrar em silêncio num domingo de manhã.
 */
@Injectable()
export class SeasonsService {
  constructor(private readonly prisma: PrismaService) {}

  private disponiveis() {
    return temasDisponiveis(PERGUNTAS_POR_DIA);
  }

  /** Tema de partida quando ninguém votou ainda: roda a lista, sem repetir. */
  private temaPorRodizio(fimDoCiclo: string, jaUsados: string[]): string {
    const opcoes = this.disponiveis().map((t) => t.id);
    const inedito = opcoes.filter((t) => !jaUsados.includes(t));
    const lista = inedito.length ? inedito : opcoes;
    const semana = Math.floor(Date.parse(`${fimDoCiclo}T00:00:00Z`) / 604_800_000);
    return lista[semana % lista.length];
  }

  /**
   * A temporada do ciclo em curso, criando-a se for o primeiro acesso da
   * semana. Se houver votação encerrada na semana anterior, o tema vem de lá.
   */
  async temporadaAtual(churchId: string) {
    const ciclo = cicloDoDia(hojeBrt());
    const existente = await this.prisma.arenaSeason.findUnique({
      where: { churchId_startDay: { churchId, startDay: ciclo.inicio } },
    });
    if (existente) return this.comNome(existente);

    const vencedor = await this.apuraVotacaoAnterior(churchId);
    const anteriores = await this.prisma.arenaSeason.findMany({
      where: { churchId },
      orderBy: { startDay: 'desc' },
      take: 4,
      select: { theme: true },
    });
    const tema =
      vencedor ??
      this.temaPorRodizio(
        ciclo.fim,
        anteriores.map((a) => a.theme),
      );

    try {
      const criada = await this.prisma.arenaSeason.create({
        data: { churchId, startDay: ciclo.inicio, endDay: ciclo.fim, theme: tema },
      });
      return this.comNome(criada);
    } catch (err) {
      // P2002: outro acesso criou a temporada no mesmo instante.
      if ((err as { code?: string })?.code !== 'P2002') throw err;
      const agora = await this.prisma.arenaSeason.findUnique({
        where: { churchId_startDay: { churchId, startDay: ciclo.inicio } },
      });
      return agora ? this.comNome(agora) : null;
    }
  }

  private comNome(s: { theme: string; startDay: string; endDay: string }) {
    const tema = temaPorId(s.theme);
    return {
      theme: s.theme,
      name: tema?.nome ?? 'Arena livre',
      emoji: tema?.emoji ?? '⚔️',
      startDay: s.startDay,
      endDay: s.endDay,
    };
  }

  /** Fecha a votação da semana passada e devolve o tema vencedor, se houver. */
  private async apuraVotacaoAnterior(churchId: string): Promise<string | null> {
    const anterior = cicloAnterior(hojeBrt());
    if (!anterior) return null;

    const enquete = await this.prisma.arenaThemePoll.findUnique({
      where: { churchId_startDay: { churchId, startDay: anterior.inicio } },
      include: { votes: true },
    });
    if (!enquete) return null;
    if (enquete.closed) return enquete.winner;

    const contagem = new Map<string, number>();
    for (const voto of enquete.votes) {
      contagem.set(voto.theme, (contagem.get(voto.theme) ?? 0) + 1);
    }
    // Empate (ou ninguém votou): fica a primeira opção da lista, que é estável
    // e não depende da ordem em que os votos chegaram.
    const vencedor =
      [...contagem.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0]?.[0] ??
      enquete.options[0] ??
      null;

    await this.prisma.arenaThemePoll.update({
      where: { id: enquete.id },
      data: { closed: true, winner: vencedor },
    });
    return vencedor;
  }

  /** A votação do ciclo em curso, criando-a no primeiro acesso da semana. */
  async votacaoAtual(churchId: string, memberId?: string) {
    const ciclo = cicloDoDia(hojeBrt());
    let enquete = await this.prisma.arenaThemePoll.findUnique({
      where: { churchId_startDay: { churchId, startDay: ciclo.inicio } },
      include: { votes: true },
    });

    if (!enquete) {
      const atual = await this.prisma.arenaSeason.findUnique({
        where: { churchId_startDay: { churchId, startDay: ciclo.inicio } },
        select: { theme: true },
      });
      // Não faz sentido votar no tema que já está rodando.
      const opcoes = this.disponiveis()
        .map((t) => t.id)
        .filter((t) => t !== atual?.theme)
        .slice(0, OPCOES_NA_VOTACAO);
      try {
        await this.prisma.arenaThemePoll.create({
          data: {
            churchId,
            startDay: ciclo.inicio,
            endDay: ciclo.fim,
            options: opcoes,
          },
        });
      } catch (err) {
        if ((err as { code?: string })?.code !== 'P2002') throw err;
      }
      enquete = await this.prisma.arenaThemePoll.findUnique({
        where: { churchId_startDay: { churchId, startDay: ciclo.inicio } },
        include: { votes: true },
      });
    }
    if (!enquete) return null;

    const contagem = new Map<string, number>();
    for (const v of enquete.votes) {
      contagem.set(v.theme, (contagem.get(v.theme) ?? 0) + 1);
    }
    const meu = memberId
      ? (enquete.votes.find((v) => v.memberId === memberId)?.theme ?? null)
      : null;

    return {
      pollId: enquete.id,
      endDay: enquete.endDay,
      myVote: meu,
      total: enquete.votes.length,
      options: enquete.options.map((id) => {
        const t = temaPorId(id);
        return {
          theme: id,
          name: t?.nome ?? id,
          emoji: t?.emoji ?? '❔',
          votes: contagem.get(id) ?? 0,
        };
      }),
    };
  }

  async votar(churchId: string, memberId: string, theme: string) {
    const votacao = await this.votacaoAtual(churchId, memberId);
    if (!votacao) throw new BadRequestException('Não há votação aberta.');
    if (!votacao.options.some((o) => o.theme === theme)) {
      throw new BadRequestException('Esse tema não está em votação.');
    }
    // Trocar de ideia é permitido; votar duas vezes, não.
    await this.prisma.arenaThemeVote.upsert({
      where: { pollId_memberId: { pollId: votacao.pollId, memberId } },
      create: { churchId, pollId: votacao.pollId, memberId, theme },
      update: { theme },
    });
    return this.votacaoAtual(churchId, memberId);
  }

  // ---------- Painel ----------

  /** Os temas que o painel pode colocar em votação. */
  listaDeTemas() {
    return this.disponiveis();
  }

  async defineOpcoes(churchId: string, temas: string[]) {
    const validos = this.disponiveis().map((t) => t.id);
    const escolhidos = [...new Set(temas)].filter((t) => validos.includes(t));
    if (escolhidos.length < 2) {
      throw new BadRequestException('Escolha pelo menos dois temas.');
    }
    const votacao = await this.votacaoAtual(churchId);
    if (!votacao) throw new BadRequestException('Não há votação aberta.');

    // Votos em temas que saíram da lista não podem continuar contando.
    await this.prisma.$transaction([
      this.prisma.arenaThemeVote.deleteMany({
        where: { pollId: votacao.pollId, theme: { notIn: escolhidos } },
      }),
      this.prisma.arenaThemePoll.update({
        where: { id: votacao.pollId },
        data: { options: escolhidos },
      }),
    ]);
    return this.votacaoAtual(churchId);
  }

  /** Histórico: temporadas passadas e o que cada votação decidiu. */
  async historico(churchId: string) {
    const [temporadas, enquetes] = await Promise.all([
      this.prisma.arenaSeason.findMany({
        where: { churchId },
        orderBy: { startDay: 'desc' },
        take: 12,
      }),
      this.prisma.arenaThemePoll.findMany({
        where: { churchId, closed: true },
        orderBy: { startDay: 'desc' },
        take: 12,
        include: { _count: { select: { votes: true } } },
      }),
    ]);
    return {
      seasons: temporadas.map((t) => ({
        startDay: t.startDay,
        endDay: t.endDay,
        theme: t.theme,
        name: temaPorId(t.theme)?.nome ?? t.theme,
      })),
      polls: enquetes.map((e) => ({
        startDay: e.startDay,
        winner: e.winner,
        winnerName: e.winner ? (temaPorId(e.winner)?.nome ?? e.winner) : null,
        votes: e._count.votes,
      })),
    };
  }

  /** Só para o serviço da Arena saber com que tema sortear o dia. */
  async temaDeHoje(churchId: string): Promise<string | null> {
    const t = await this.temporadaAtual(churchId);
    return t?.theme ?? null;
  }
}

export const TODOS_OS_TEMAS = TEMAS;
