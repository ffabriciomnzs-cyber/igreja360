import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { cicloAnterior, cicloDoDia } from './cycle';
import { PERGUNTAS_POR_DIA } from './config';

function hojeBrt(): string {
  return new Date(Date.now() - 3 * 3600_000).toISOString().slice(0, 10);
}

function somaDias(day: string, delta: number): string {
  const [y, m, d] = day.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + delta)).toISOString().slice(0, 10);
}

export interface Conquista {
  id: string;
  nome: string;
  emoji: string;
  descricao: string;
  conquistada: boolean;
  progresso: number;
  alvo: number;
}

/**
 * Sequência, conquistas e destaques — tudo calculado, nada guardado.
 *
 * Um troféu gravado numa tabela é um número que pode discordar do histórico
 * que o gerou; e quando discorda, ninguém sabe qual dos dois está certo.
 * ArenaAnswer já tem quem respondeu o quê e quando: é a única fonte.
 */
@Injectable()
export class ProgressService {
  constructor(private readonly prisma: PrismaService) {}

  /** Dias em que o membro FECHOU a rodada, do mais recente para o mais antigo. */
  private async diasCompletos(memberId: string): Promise<string[]> {
    const porDia = await this.prisma.arenaAnswer.groupBy({
      by: ['day'],
      where: { memberId },
      _count: { _all: true },
    });
    return porDia
      .filter((d) => d._count._all >= PERGUNTAS_POR_DIA)
      .map((d) => d.day)
      .sort((a, b) => b.localeCompare(a));
  }

  /**
   * Dias seguidos jogando. Conta a partir de hoje ou de ontem: quem ainda não
   * jogou hoje não deve ver a sequência zerada às 8 da manhã — ela só quebra
   * quando um dia inteiro passa em branco.
   */
  private sequencia(dias: string[]): number {
    if (!dias.length) return 0;
    const hoje = hojeBrt();
    const ontem = somaDias(hoje, -1);
    let atual = dias.includes(hoje) ? hoje : dias.includes(ontem) ? ontem : null;
    if (!atual) return 0;
    const conjunto = new Set(dias);
    let total = 0;
    while (conjunto.has(atual)) {
      total++;
      atual = somaDias(atual, -1);
    }
    return total;
  }

  /** Semanas seguidas com pelo menos uma rodada fechada. */
  private semanasSeguidas(dias: string[]): number {
    if (!dias.length) return 0;
    const semanas = new Set(dias.map((d) => cicloDoDia(d).fim));
    let fim = cicloDoDia(hojeBrt()).fim;
    if (!semanas.has(fim)) fim = somaDias(fim, -7);
    let total = 0;
    while (semanas.has(fim)) {
      total++;
      fim = somaDias(fim, -7);
    }
    return total;
  }

  async meu(churchId: string, memberId: string) {
    const [dias, respostas, duelos] = await Promise.all([
      this.diasCompletos(memberId),
      this.prisma.arenaAnswer.findMany({
        where: { memberId },
        orderBy: { createdAt: 'asc' },
        select: { day: true, correct: true },
      }),
      this.duelosVencidos(churchId, memberId),
    ]);

    // Acertos seguidos: a corrente que está de pé agora.
    let seguidosAgora = 0;
    let maiorSeguidos = 0;
    for (const r of respostas) {
      seguidosAgora = r.correct ? seguidosAgora + 1 : 0;
      maiorSeguidos = Math.max(maiorSeguidos, seguidosAgora);
    }

    // Arena perfeita: fechou o dia acertando as 12.
    const porDia = new Map<string, { total: number; acertos: number }>();
    for (const r of respostas) {
      const atual = porDia.get(r.day) ?? { total: 0, acertos: 0 };
      atual.total++;
      if (r.correct) atual.acertos++;
      porDia.set(r.day, atual);
    }
    const perfeitas = [...porDia.values()].filter(
      (d) => d.total >= PERGUNTAS_POR_DIA && d.acertos >= PERGUNTAS_POR_DIA,
    ).length;

    const streak = this.sequencia(dias);
    const semanas = this.semanasSeguidas(dias);

    const conquistas: Conquista[] = [
      this.conquista('fogo-3', '🔥', 'Pegando fogo', '3 dias seguidos', streak, 3),
      this.conquista('fogo-7', '🗓️', 'Semana cheia', '7 dias seguidos', streak, 7),
      this.conquista('fogo-30', '💎', 'Um mês inteiro', '30 dias seguidos', streak, 30),
      this.conquista('serie-10', '🎯', 'Mira certeira', '10 acertos seguidos', maiorSeguidos, 10),
      this.conquista('perfeita', '⭐', 'Arena perfeita', 'Acertar as 12 num dia', perfeitas, 1),
      this.conquista('perfeita-5', '🌟', 'Cinco perfeitas', '5 Arenas perfeitas', perfeitas, 5),
      this.conquista('duelo-1', '⚔️', 'Primeiro duelo', 'Vencer um desafio 1x1', duelos, 1),
      this.conquista('duelo-10', '🏆', 'Duelista', 'Vencer 10 desafios', duelos, 10),
      this.conquista('fiel-4', '🤝', 'Presença fiel', '4 semanas seguidas', semanas, 4),
    ];

    return {
      streak,
      bestStreakCorrect: maiorSeguidos,
      currentStreakCorrect: seguidosAgora,
      perfectRounds: perfeitas,
      duelWins: duelos,
      weeksInARow: semanas,
      daysPlayed: dias.length,
      achievements: conquistas,
    };
  }

  private conquista(
    id: string,
    emoji: string,
    nome: string,
    descricao: string,
    progresso: number,
    alvo: number,
  ): Conquista {
    return {
      id,
      nome,
      emoji,
      descricao,
      alvo,
      progresso: Math.min(progresso, alvo),
      conquistada: progresso >= alvo,
    };
  }

  private async duelosVencidos(
    churchId: string,
    memberId: string,
    desde?: string,
  ): Promise<number> {
    const duelos = await this.prisma.arenaDuel.findMany({
      where: {
        churchId,
        OR: [{ challengerId: memberId }, { opponentId: memberId }],
        ...(desde ? { createdAt: { gte: new Date(`${desde}T00:00:00Z`) } } : {}),
      },
      include: {
        turns: { select: { memberId: true, correct: true, answeredAt: true } },
      },
    });
    let vitorias = 0;
    for (const d of duelos) {
      if (!d.opponentId) continue;
      const outro = d.challengerId === memberId ? d.opponentId : d.challengerId;
      const feitas = (quem: string) =>
        d.turns.filter((t) => t.memberId === quem && t.answeredAt).length;
      if (feitas(memberId) < d.questionIds.length) continue;
      if (feitas(outro) < d.questionIds.length) continue;
      const acertos = (quem: string) =>
        d.turns.filter((t) => t.memberId === quem && t.correct).length;
      if (acertos(memberId) > acertos(outro)) vitorias++;
    }
    return vitorias;
  }

  /**
   * Destaques da semana que fechou. Não repete o Líder da Semana, que já
   * existe: aqui entram os méritos que o ranking de pontos não enxerga.
   */
  async destaques(churchId: string) {
    const ciclo = cicloAnterior(hojeBrt());
    if (!ciclo) return [];

    const respostas = await this.prisma.arenaAnswer.findMany({
      where: { churchId, day: { gte: ciclo.inicio, lte: ciclo.fim } },
      orderBy: { createdAt: 'asc' },
      select: { memberId: true, day: true, correct: true },
    });
    if (!respostas.length) return [];

    interface Resumo {
      total: number;
      acertos: number;
      rodadas: number;
      maiorSerie: number;
      serieAtual: number;
      porDia: Map<string, number>;
    }
    const por = new Map<string, Resumo>();
    for (const r of respostas) {
      const m = por.get(r.memberId) ?? {
        total: 0,
        acertos: 0,
        rodadas: 0,
        maiorSerie: 0,
        serieAtual: 0,
        porDia: new Map<string, number>(),
      };
      m.total++;
      if (r.correct) {
        m.acertos++;
        m.serieAtual++;
        m.maiorSerie = Math.max(m.maiorSerie, m.serieAtual);
      } else {
        m.serieAtual = 0;
      }
      m.porDia.set(r.day, (m.porDia.get(r.day) ?? 0) + 1);
      por.set(r.memberId, m);
    }
    for (const m of por.values()) {
      m.rodadas = [...m.porDia.values()].filter((n) => n >= PERGUNTAS_POR_DIA).length;
    }

    const vitorias = new Map<string, number>();
    for (const id of por.keys()) {
      vitorias.set(id, await this.duelosVencidos(churchId, id, ciclo.inicio));
    }

    const nomes = await this.prisma.member.findMany({
      where: { id: { in: [...por.keys()] } },
      select: { id: true, name: true, photo: true },
    });
    const nomePorId = new Map(nomes.map((n) => [n.id, n]));

    const monta = (
      id: string,
      emoji: string,
      titulo: string,
      memberId: string,
      valor: string,
    ) => {
      const m = nomePorId.get(memberId);
      return m
        ? { id, emoji, title: titulo, name: m.name, photo: m.photo, value: valor }
        : null;
    };

    const melhor = <T>(
      lista: [string, T][],
      nota: (v: T) => number,
      minimo = 1,
    ): [string, T] | null => {
      const bons = lista.filter(([, v]) => nota(v) >= minimo);
      if (!bons.length) return null;
      return bons.sort(
        (a, b) => nota(b[1]) - nota(a[1]) || a[0].localeCompare(b[0]),
      )[0];
    };

    const entradas = [...por.entries()];
    const destaques = [];

    const serie = melhor(entradas, (m) => m.maiorSerie, 3);
    if (serie) {
      destaques.push(
        monta(
          'serie',
          '🎯',
          'Maior sequência de acertos',
          serie[0],
          `${serie[1].maiorSerie} seguidos`,
        ),
      );
    }

    // Percentual só faz sentido com volume: com 3 respostas, 100% não é mérito.
    const pontaria = melhor(
      entradas.filter(([, m]) => m.total >= PERGUNTAS_POR_DIA * 2),
      (m) => m.acertos / m.total,
    );
    if (pontaria) {
      destaques.push(
        monta(
          'pontaria',
          '🏹',
          'Melhor aproveitamento',
          pontaria[0],
          `${Math.round((pontaria[1].acertos / pontaria[1].total) * 100)}% de acerto`,
        ),
      );
    }

    const presenca = melhor(entradas, (m) => m.rodadas, 2);
    if (presenca) {
      destaques.push(
        monta(
          'presenca',
          '📅',
          'Maior participação',
          presenca[0],
          `${presenca[1].rodadas} rodadas na semana`,
        ),
      );
    }

    const duelista = melhor([...vitorias.entries()], (v) => v, 1);
    if (duelista) {
      destaques.push(
        monta('duelos', '⚔️', 'Mais duelos vencidos', duelista[0], `${duelista[1]} vitórias`),
      );
    }

    return destaques.filter((d): d is NonNullable<typeof d> => d !== null);
  }
}
