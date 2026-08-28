import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ScheduleStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { PushService } from '../push/push.service';

/**
 * Equipes e escala de voluntários.
 *
 * Quem serve na igreja é o núcleo mais fiel — e é justamente quem hoje
 * descobre a própria escala por print de grupo de WhatsApp. Aqui a escala
 * vive no app: o líder monta, o voluntário confirma, e a liderança vê quem
 * ainda não respondeu ANTES do culto, não no domingo de manhã.
 */
@Injectable()
export class TeamsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly push: PushService,
  ) {}

  // ---------- Equipes ----------

  async listTeams(churchId: string) {
    const equipes = await this.prisma.ministryTeam.findMany({
      where: { churchId },
      orderBy: { name: 'asc' },
      include: { members: true },
    });
    if (!equipes.length) return [];

    const ids = [...new Set(equipes.flatMap((e) => e.members.map((m) => m.memberId)))];
    const membros = ids.length
      ? await this.prisma.member.findMany({
          where: { id: { in: ids }, churchId },
          select: { id: true, name: true, photo: true },
        })
      : [];
    const porId = new Map(membros.map((m) => [m.id, m]));

    return equipes.map((e) => ({
      id: e.id,
      name: e.name,
      active: e.active,
      members: e.members.map((m) => ({
        memberId: m.memberId,
        name: porId.get(m.memberId)?.name ?? 'Membro',
        photo: porId.get(m.memberId)?.photo ?? null,
        role: m.role,
      })),
    }));
  }

  async createTeam(churchId: string, name: string) {
    const limpo = name.trim();
    if (limpo.length < 2) throw new BadRequestException('Informe o nome da equipe.');
    await this.prisma.ministryTeam.create({ data: { churchId, name: limpo } });
    return this.listTeams(churchId);
  }

  async removeTeam(churchId: string, teamId: string) {
    const equipe = await this.prisma.ministryTeam.findFirst({
      where: { id: teamId, churchId },
      select: { id: true },
    });
    if (!equipe) throw new NotFoundException('Equipe não encontrada.');
    // Escalas futuras somem junto (cascade) — é o que se espera ao apagar
    // a equipe inteira.
    await this.prisma.ministryTeam.delete({ where: { id: teamId } });
    return this.listTeams(churchId);
  }

  async addMember(
    churchId: string,
    teamId: string,
    memberId: string,
    role?: string,
  ) {
    const [equipe, membro] = await Promise.all([
      this.prisma.ministryTeam.findFirst({
        where: { id: teamId, churchId },
        select: { id: true },
      }),
      this.prisma.member.findFirst({
        where: { id: memberId, churchId },
        select: { id: true },
      }),
    ]);
    if (!equipe || !membro) {
      throw new NotFoundException('Equipe ou membro não encontrado.');
    }

    await this.prisma.teamMember.upsert({
      where: { teamId_memberId: { teamId, memberId } },
      create: { churchId, teamId, memberId, role: role?.trim() || null },
      update: { role: role?.trim() || null },
    });
    return this.listTeams(churchId);
  }

  async removeMember(churchId: string, teamId: string, memberId: string) {
    await this.prisma.teamMember.deleteMany({
      where: { churchId, teamId, memberId },
    });
    return this.listTeams(churchId);
  }

  // ---------- Escala ----------

  /** Escala de um período, agrupada por data. */
  async schedule(churchId: string, from?: string, to?: string) {
    const inicio = from ? new Date(from) : new Date();
    const fim = to
      ? new Date(`${to}T23:59:59.999Z`)
      : new Date(Date.now() + 60 * 86_400_000);

    const slots = await this.prisma.scheduleSlot.findMany({
      where: { churchId, date: { gte: inicio, lte: fim } },
      orderBy: [{ date: 'asc' }],
      include: { team: { select: { id: true, name: true } } },
    });
    if (!slots.length) return [];

    const membros = await this.prisma.member.findMany({
      where: { id: { in: slots.map((s) => s.memberId) }, churchId },
      select: { id: true, name: true, photo: true },
    });
    const porId = new Map(membros.map((m) => [m.id, m]));

    return slots.map((s) => ({
      id: s.id,
      date: s.date,
      teamId: s.team.id,
      teamName: s.team.name,
      memberId: s.memberId,
      name: porId.get(s.memberId)?.name ?? 'Membro',
      photo: porId.get(s.memberId)?.photo ?? null,
      role: s.role,
      status: s.status,
      note: s.note,
    }));
  }

  /** Escala uma pessoa e avisa no celular dela. */
  async createSlot(
    churchId: string,
    dto: { teamId: string; memberId: string; date: string; role?: string },
  ) {
    const [equipe, membro] = await Promise.all([
      this.prisma.ministryTeam.findFirst({
        where: { id: dto.teamId, churchId },
        select: { id: true, name: true },
      }),
      this.prisma.member.findFirst({
        where: { id: dto.memberId, churchId },
        select: { id: true, name: true },
      }),
    ]);
    if (!equipe || !membro) {
      throw new NotFoundException('Equipe ou membro não encontrado.');
    }

    const quando = new Date(dto.date);
    if (Number.isNaN(quando.getTime())) {
      throw new BadRequestException('Data inválida.');
    }

    try {
      await this.prisma.scheduleSlot.create({
        data: {
          churchId,
          teamId: dto.teamId,
          memberId: dto.memberId,
          date: quando,
          role: dto.role?.trim() || null,
        },
      });
    } catch (err) {
      // Já escalado nesse dia e equipe: não é erro, é o estado desejado.
      if ((err as { code?: string }).code !== 'P2002') throw err;
    }

    const dia = new Intl.DateTimeFormat('pt-BR', {
      weekday: 'long',
      day: '2-digit',
      month: '2-digit',
      timeZone: 'America/Sao_Paulo',
    }).format(quando);
    void this.push
      .notifyMember(dto.memberId, {
        title: '🙌 Você foi escalado!',
        body: `${equipe.name} — ${dia}. Abra o app para confirmar.`,
      })
      .catch(() => undefined);

    return this.schedule(churchId);
  }

  async removeSlot(churchId: string, id: string) {
    const slot = await this.prisma.scheduleSlot.findFirst({
      where: { id, churchId },
      select: { id: true },
    });
    if (!slot) throw new NotFoundException('Escala não encontrada.');
    await this.prisma.scheduleSlot.delete({ where: { id } });
    return this.schedule(churchId);
  }

  // ---------- Portal do membro ----------

  /** Minhas próximas escalas (as passadas não interessam ao voluntário). */
  async mySchedule(churchId: string, memberId: string) {
    const slots = await this.prisma.scheduleSlot.findMany({
      where: {
        churchId,
        memberId,
        date: { gte: new Date(Date.now() - 12 * 3600_000) },
      },
      orderBy: { date: 'asc' },
      take: 20,
      include: { team: { select: { name: true } } },
    });
    return slots.map((s) => ({
      id: s.id,
      date: s.date,
      teamName: s.team.name,
      role: s.role,
      status: s.status,
      note: s.note,
    }));
  }

  /** "Confirmo" ou "não posso" — o líder vê antes do culto. */
  async respond(
    churchId: string,
    memberId: string,
    slotId: string,
    confirma: boolean,
  ) {
    const slot = await this.prisma.scheduleSlot.findFirst({
      where: { id: slotId, churchId, memberId },
      select: { id: true },
    });
    if (!slot) throw new NotFoundException('Escala não encontrada.');

    await this.prisma.scheduleSlot.update({
      where: { id: slotId },
      data: {
        status: confirma ? ScheduleStatus.CONFIRMED : ScheduleStatus.DECLINED,
        respondedAt: new Date(),
      },
    });

    // Quem não pode precisa ser substituído — a liderança tem que saber.
    if (!confirma) {
      const detalhe = await this.prisma.scheduleSlot.findUnique({
        where: { id: slotId },
        include: { team: { select: { name: true } } },
      });
      const membro = await this.prisma.member.findUnique({
        where: { id: memberId },
        select: { name: true },
      });
      const dia = detalhe
        ? new Intl.DateTimeFormat('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            timeZone: 'America/Sao_Paulo',
          }).format(detalhe.date)
        : '';
      void this.push
        .notifyPortalManagers(churchId, {
          title: '⚠️ Falta na escala',
          body: `${membro?.name ?? 'Um voluntário'} não poderá servir em ${detalhe?.team.name ?? ''} no dia ${dia}.`,
          url: '/teams',
        })
        .catch(() => undefined);
    }

    return this.mySchedule(churchId, memberId);
  }
}
