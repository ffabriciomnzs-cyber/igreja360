import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { cicloDoDia, hojeBrt } from './cycle';
import { PERGUNTAS_POR_DIA } from './config';

/**
 * Missão coletiva: uma meta da igreja inteira na semana.
 *
 * O progresso NÃO tem tabela: ele é a soma do que já está em ArenaAnswer.
 * Um contador próprio só teria como ganho evitar uma soma barata, em troca de
 * poder divergir do que de fato aconteceu — e um número coletivo errado na
 * tela é pior do que não ter número nenhum.
 */
@Injectable()
export class MissionsService {
  constructor(private readonly prisma: PrismaService) {}

  async atual(churchId: string) {
    const hoje = hojeBrt();
    const missao = await this.prisma.arenaMission.findFirst({
      where: { churchId, startDay: { lte: hoje }, endDay: { gte: hoje } },
      orderBy: { createdAt: 'desc' },
    });
    if (!missao) return null;
    return { ...missao, progress: await this.progresso(missao) };
  }

  private async progresso(missao: {
    churchId: string;
    kind: string;
    startDay: string;
    endDay: string;
  }): Promise<number> {
    const janela = {
      churchId: missao.churchId,
      day: { gte: missao.startDay, lte: missao.endDay },
    };

    if (missao.kind === 'ROUNDS') {
      // Rodadas concluídas = dias em que alguém enfrentou as 12 perguntas.
      const porDia = await this.prisma.arenaAnswer.groupBy({
        by: ['memberId', 'day'],
        where: janela,
        _count: { _all: true },
      });
      return porDia.filter((d) => d._count._all >= PERGUNTAS_POR_DIA).length;
    }

    // CORRECT: acertos da igreja inteira no período.
    return this.prisma.arenaAnswer.count({
      where: { ...janela, correct: true },
    });
  }

  // ---------- Painel ----------

  async listar(churchId: string) {
    const missoes = await this.prisma.arenaMission.findMany({
      where: { churchId },
      orderBy: { startDay: 'desc' },
      take: 10,
    });
    return Promise.all(
      missoes.map(async (m) => ({ ...m, progress: await this.progresso(m) })),
    );
  }

  async criar(
    churchId: string,
    dto: {
      title: string;
      kind: string;
      target: number;
      startDay?: string;
      endDay?: string;
      reward?: string;
    },
  ) {
    const titulo = dto.title?.trim() ?? '';
    if (titulo.length < 3) throw new BadRequestException('Dê um nome à missão.');
    if (!['CORRECT', 'ROUNDS'].includes(dto.kind)) {
      throw new BadRequestException('Tipo de meta inválido.');
    }
    if (!Number.isInteger(dto.target) || dto.target < 1) {
      throw new BadRequestException('A meta precisa ser um número maior que zero.');
    }
    // Sem datas, a missão vale a semana em curso — que é o caso comum.
    const ciclo = cicloDoDia(hojeBrt());
    return this.prisma.arenaMission.create({
      data: {
        churchId,
        title: titulo,
        kind: dto.kind,
        target: dto.target,
        startDay: dto.startDay || ciclo.inicio,
        endDay: dto.endDay || ciclo.fim,
        reward: dto.reward?.trim() || null,
      },
    });
  }

  async remover(churchId: string, id: string) {
    const missao = await this.prisma.arenaMission.findFirst({
      where: { id, churchId },
      select: { id: true },
    });
    if (!missao) throw new NotFoundException('Missão não encontrada.');
    await this.prisma.arenaMission.delete({ where: { id } });
    return { ok: true };
  }
}
