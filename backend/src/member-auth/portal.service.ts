import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

// Trilhas temáticas do devocional. O conteúdo mora no app
// (web/lib/devotional-trails.ts) — aqui só validamos o id e o tamanho.
const TRAIL_IDS = [
  'ansiedade',
  'paz',
  'fe',
  'gratidao',
  'recomeco',
  'forca',
] as const;
const TRAIL_LENGTH = 7;

/*
 * `position` = quantos dias da trilha já foram concluídos.
 * `todayIndex` = qual dia a tela deve MOSTRAR hoje. Se o membro já concluiu
 * hoje, ele continua vendo a leitura de hoje (position - 1) em vez de a de
 * amanhã aparecer adiantada.
 */
function trailPayload(
  row: { trailId: string; position: number; lastDay: string | null },
  today: string,
) {
  const jaLeuHoje = row.lastDay === today;
  return {
    id: row.trailId,
    position: row.position,
    todayIndex: jaLeuHoje ? Math.max(0, row.position - 1) : row.position,
    length: TRAIL_LENGTH,
    finished: row.position >= TRAIL_LENGTH,
  };
}

function brToday(): string {
  const br = new Date(Date.now() - 3 * 60 * 60 * 1000);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${br.getUTCFullYear()}-${pad(br.getUTCMonth() + 1)}-${pad(br.getUTCDate())}`;
}

// Soma/subtrai dias de uma data 'YYYY-MM-DD'.
function shiftDay(day: string, delta: number): string {
  const [y, m, d] = day.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + delta));
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${dt.getUTCFullYear()}-${pad(dt.getUTCMonth() + 1)}-${pad(dt.getUTCDate())}`;
}

// Dias seguidos concluídos até hoje (conta hoje se já concluiu; senão até ontem).
function computeStreak(days: Set<string>, today: string): number {
  let cursor = days.has(today) ? today : shiftDay(today, -1);
  let streak = 0;
  while (days.has(cursor)) {
    streak++;
    cursor = shiftDay(cursor, -1);
  }
  return streak;
}

// Dias concluídos nos últimos 35 dias (para o mini-calendário).
function recentHistory(days: Set<string>, today: string): string[] {
  const out: string[] = [];
  for (let i = 0; i < 35; i++) {
    const d = shiftDay(today, -i);
    if (days.has(d)) out.push(d);
  }
  return out;
}

/**
 * Acrescenta `photoUrl` do evento (endereço público, cacheável) SEM carregar o
 * base64 da imagem. O `?v=` muda quando a foto muda, então o cache do celular
 * nunca mostra cartaz velho. Mesma regra do painel (events.service.ts).
 */
function comFotoUrl<T extends { id: string; photoUpdatedAt: Date | null }>(
  evento: T,
) {
  const { photoUpdatedAt, ...resto } = evento;
  return {
    ...resto,
    photoUrl: photoUpdatedAt
      ? `/public/events/${evento.id}/photo?v=${photoUpdatedAt.getTime()}`
      : null,
  };
}

@Injectable()
export class PortalService {
  constructor(private readonly prisma: PrismaService) {}

  async devotional(churchId: string, memberId: string) {
    const day = brToday();
    const [
      count,
      mine,
      content,
      note,
      myReaction,
      reactionRows,
      completions,
      church,
      trail,
    ] = await this.prisma.$transaction([
        this.prisma.devotionalPrayer.count({ where: { churchId, day } }),
        this.prisma.devotionalPrayer.findUnique({
          where: { memberId_day: { memberId, day } },
        }),
        this.prisma.devotional.findUnique({
          where: { churchId_date: { churchId, date: day } },
          select: {
            title: true,
            verseRef: true,
            verseText: true,
            reflection: true,
            songTitle: true,
            songUrl: true,
            image: true,
          },
        }),
        this.prisma.devotionalNote.findUnique({
          where: { memberId_day: { memberId, day } },
          select: { text: true },
        }),
        this.prisma.devotionalReaction.findUnique({
          where: { memberId_day: { memberId, day } },
          select: { type: true },
        }),
        this.prisma.devotionalReaction.groupBy({
          by: ['type'],
          where: { churchId, day },
          _count: true,
          orderBy: { type: 'asc' },
        }),
        this.prisma.devotionalCompletion.findMany({
          where: { memberId },
          select: { day: true },
          orderBy: { day: 'desc' },
          take: 400,
        }),
        this.prisma.church.findUnique({
          where: { id: churchId },
          select: { name: true },
        }),
        this.prisma.memberDevotionalTrail.findUnique({
          where: { memberId },
          select: { trailId: true, position: true, lastDay: true },
        }),
      ]);

    const completedDays = new Set(completions.map((c) => c.day));
    const reactions = Object.fromEntries(
      reactionRows.map((r) => [r.type, r._count]),
    );

    return {
      day,
      count,
      joined: mine !== null,
      content,
      completed: completedDays.has(day),
      streak: computeStreak(completedDays, day),
      history: recentHistory(completedDays, day),
      note: note?.text ?? null,
      reactions,
      myReaction: myReaction?.type ?? null,
      churchName: church?.name ?? null,
      trail: trail ? trailPayload(trail, day) : null,
    };
  }

  async complete(churchId: string, memberId: string) {
    const day = brToday();
    await this.prisma.devotionalCompletion.upsert({
      where: { memberId_day: { memberId, day } },
      create: { churchId, memberId, day },
      update: {},
    });

    // Trilha avança no máximo 1 dia por dia — mesmo que o membro conclua duas
    // vezes (dois aparelhos, recarregou a página), `lastDay` segura.
    const trail = await this.prisma.memberDevotionalTrail.findUnique({
      where: { memberId },
    });
    if (trail && trail.lastDay !== day && trail.position < TRAIL_LENGTH) {
      await this.prisma.memberDevotionalTrail.update({
        where: { memberId },
        data: { position: trail.position + 1, lastDay: day },
      });
    }

    const completions = await this.prisma.devotionalCompletion.findMany({
      where: { memberId },
      select: { day: true },
      orderBy: { day: 'desc' },
      take: 400,
    });
    const set = new Set(completions.map((c) => c.day));
    return {
      completed: true,
      streak: computeStreak(set, day),
      history: recentHistory(set, day),
      trail: await this.currentTrail(memberId),
    };
  }

  /** Trilha ativa do membro, no formato que o app consome. */
  private async currentTrail(memberId: string) {
    const row = await this.prisma.memberDevotionalTrail.findUnique({
      where: { memberId },
      select: { trailId: true, position: true, lastDay: true },
    });
    return row ? trailPayload(row, brToday()) : null;
  }

  /** Começa (ou troca de) trilha, sempre do dia 1. */
  async startTrail(churchId: string, memberId: string, trailId: string) {
    if (!(TRAIL_IDS as readonly string[]).includes(trailId)) {
      throw new BadRequestException('Trilha inválida.');
    }
    await this.prisma.memberDevotionalTrail.upsert({
      where: { memberId },
      create: { churchId, memberId, trailId },
      update: { trailId, position: 0, lastDay: null, startedAt: new Date() },
    });
    return this.currentTrail(memberId);
  }

  /** Sai da trilha e volta ao devocional do dia. */
  async leaveTrail(memberId: string) {
    await this.prisma.memberDevotionalTrail
      .delete({ where: { memberId } })
      .catch(() => undefined);
    return { trail: null };
  }

  async saveNote(churchId: string, memberId: string, text: string) {
    const day = brToday();
    const clean = (text ?? '').trim();
    if (!clean) {
      await this.prisma.devotionalNote.deleteMany({ where: { memberId, day } });
      return { note: null };
    }
    await this.prisma.devotionalNote.upsert({
      where: { memberId_day: { memberId, day } },
      create: { churchId, memberId, day, text: clean },
      update: { text: clean },
    });
    return { note: clean };
  }

  async react(churchId: string, memberId: string, type: string) {
    const day = brToday();
    const existing = await this.prisma.devotionalReaction.findUnique({
      where: { memberId_day: { memberId, day } },
    });
    let mine: string | null = type;
    if (existing && existing.type === type) {
      await this.prisma.devotionalReaction.delete({
        where: { id: existing.id },
      });
      mine = null;
    } else if (existing) {
      await this.prisma.devotionalReaction.update({
        where: { id: existing.id },
        data: { type },
      });
    } else {
      await this.prisma.devotionalReaction.create({
        data: { churchId, memberId, day, type },
      });
    }
    const rows = await this.prisma.devotionalReaction.groupBy({
      by: ['type'],
      where: { churchId, day },
      _count: true,
      orderBy: { type: 'asc' },
    });
    const reactions = Object.fromEntries(rows.map((r) => [r.type, r._count]));
    return { reactions, myReaction: mine };
  }

  async togglePray(churchId: string, memberId: string) {
    const day = brToday();
    const existing = await this.prisma.devotionalPrayer.findUnique({
      where: { memberId_day: { memberId, day } },
    });
    if (existing) {
      await this.prisma.devotionalPrayer.delete({ where: { id: existing.id } });
    } else {
      await this.prisma.devotionalPrayer.create({
        data: { churchId, memberId, day },
      });
    }
    const count = await this.prisma.devotionalPrayer.count({
      where: { churchId, day },
    });
    return { day, count, joined: !existing };
  }

  async plans(churchId: string, memberId: string) {
    const [plans, progress] = await this.prisma.$transaction([
      this.prisma.devotionalPlan.findMany({
        where: { churchId, active: true },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          title: true,
          description: true,
          cover: true,
          _count: { select: { days: true } },
        },
      }),
      this.prisma.devotionalPlanProgress.groupBy({
        by: ['planId'],
        where: { memberId },
        _count: true,
        orderBy: { planId: 'asc' },
      }),
    ]);
    const doneByPlan = new Map(progress.map((p) => [p.planId, p._count]));
    return plans.map((p) => ({
      id: p.id,
      title: p.title,
      description: p.description,
      cover: p.cover,
      totalDays: p._count.days,
      completedDays: doneByPlan.get(p.id) ?? 0,
    }));
  }

  async plan(churchId: string, memberId: string, planId: string) {
    const plan = await this.prisma.devotionalPlan.findFirst({
      where: { id: planId, churchId, active: true },
      select: {
        id: true,
        title: true,
        description: true,
        cover: true,
        days: {
          orderBy: { dayNumber: 'asc' },
          select: {
            dayNumber: true,
            title: true,
            verseRef: true,
            verseText: true,
            reflection: true,
          },
        },
      },
    });
    if (!plan) throw new NotFoundException('Plano não encontrado.');
    const progress = await this.prisma.devotionalPlanProgress.findMany({
      where: { memberId, planId },
      select: { dayNumber: true },
    });
    return { ...plan, completed: progress.map((p) => p.dayNumber) };
  }

  async togglePlanDay(
    churchId: string,
    memberId: string,
    planId: string,
    dayNumber: number,
  ) {
    // Garante que o plano é da igreja do membro.
    const day = await this.prisma.devotionalPlanDay.findFirst({
      where: { planId, dayNumber, plan: { churchId } },
      select: { id: true },
    });
    if (!day) throw new NotFoundException('Dia do plano não encontrado.');

    const existing = await this.prisma.devotionalPlanProgress.findUnique({
      where: {
        memberId_planId_dayNumber: { memberId, planId, dayNumber },
      },
    });
    if (existing) {
      await this.prisma.devotionalPlanProgress.delete({
        where: { id: existing.id },
      });
    } else {
      await this.prisma.devotionalPlanProgress.create({
        data: { churchId, memberId, planId, dayNumber },
      });
    }
    const progress = await this.prisma.devotionalPlanProgress.findMany({
      where: { memberId, planId },
      select: { dayNumber: true },
    });
    return { completed: progress.map((p) => p.dayNumber) };
  }

  async home(churchId: string) {
    const now = new Date();
    const [worship, events, campaigns, announcements, schedules] =
      await this.prisma.$transaction([
      this.prisma.worshipService.findMany({
        where: { churchId, date: { gte: now } },
        orderBy: { date: 'asc' },
        take: 10,
        select: {
          id: true,
          title: true,
          date: true,
          theme: true,
          bibleRef: true,
        },
      }),
      this.prisma.event.findMany({
        where: { churchId, date: { gte: now } },
        orderBy: { date: 'asc' },
        take: 10,
        // `photo` (base64) NUNCA entra aqui: a tela busca a imagem pela URL
        // pública, que o navegador cacheia. Ver withPhotoUrl().
        select: {
          id: true,
          name: true,
          date: true,
          endDate: true,
          location: true,
          type: true,
          photoUpdatedAt: true,
        },
      }),
      this.prisma.campaign.findMany({
        where: { churchId, status: 'ACTIVE' },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          title: true,
          description: true,
          type: true,
          goal: true,
          current: true,
        },
      }),
      this.prisma.communication.findMany({
        where: { churchId },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          title: true,
          content: true,
          type: true,
          createdAt: true,
        },
      }),
      this.prisma.serviceSchedule.findMany({
        where: { churchId, active: true },
        orderBy: [{ order: 'asc' }, { weekday: 'asc' }, { time: 'asc' }],
        select: {
          id: true,
          weekday: true,
          time: true,
          name: true,
          note: true,
        },
      }),
    ]);

    return {
      worship,
      events: events.map(comFotoUrl),
      schedules,
      announcements,
      campaigns: campaigns.map((c) => {
        const goal = Number(c.goal ?? 0);
        const current = Number(c.current ?? 0);
        return {
          id: c.id,
          title: c.title,
          description: c.description,
          type: c.type,
          goal,
          current,
          progress: goal > 0 ? Math.min(100, Math.round((current / goal) * 100)) : 0,
        };
      }),
    };
  }

  /** Detalhe de um evento para o portal — escopado pela igreja do membro. */
  async event(churchId: string, eventId: string) {
    const evento = await this.prisma.event.findFirst({
      where: { id: eventId, churchId },
      select: {
        id: true,
        name: true,
        description: true,
        date: true,
        endDate: true,
        location: true,
        capacity: true,
        type: true,
        photoUpdatedAt: true,
      },
    });
    if (!evento) throw new NotFoundException('Evento não encontrado.');
    return comFotoUrl(evento);
  }

  async me(memberId: string) {
    const member = await this.prisma.member.findUnique({
      where: { id: memberId },
      select: {
        id: true,
        churchId: true,
        name: true,
        email: true,
        phone: true,
        cpf: true,
        gender: true,
        photo: true,
        birthDate: true,
        baptismDate: true,
        address: true,
        city: true,
        status: true,
        role: true,
        joinedAt: true,
      },
    });
    if (!member) throw new NotFoundException('Membro não encontrado.');

    const church = await this.prisma.church.findUnique({
      where: { id: member.churchId },
      select: {
        name: true,
        logo: true,
        cardLogo: true,
        denomination: true,
        phone: true,
        address: true,
      },
    });

    return { member, church };
  }

  async updateProfile(
    memberId: string,
    dto: {
      name?: string;
      phone?: string;
      gender?: 'MALE' | 'FEMALE';
      birthDate?: string;
      address?: string;
      city?: string;
      photo?: string;
    },
  ) {
    const data: Record<string, unknown> = {};
    if (dto.name !== undefined) data.name = dto.name.trim();
    if (dto.phone !== undefined) data.phone = dto.phone.trim() || null;
    if (dto.gender !== undefined) data.gender = dto.gender ?? null;
    if (dto.birthDate !== undefined)
      data.birthDate = dto.birthDate ? new Date(dto.birthDate) : null;
    if (dto.address !== undefined) data.address = dto.address.trim() || null;
    if (dto.city !== undefined) data.city = dto.city.trim() || null;
    if (dto.photo !== undefined) data.photo = dto.photo || null;
    await this.prisma.member.update({ where: { id: memberId }, data });
    return this.me(memberId);
  }

  async createPrayer(
    churchId: string,
    memberId: string,
    dto: { title: string; description?: string; isPublic?: boolean },
  ) {
    return this.prisma.prayer.create({
      data: {
        churchId,
        memberId,
        title: dto.title.trim(),
        description: dto.description?.trim() || null,
        visibility: dto.isPublic ? 'PUBLIC' : 'PRIVATE',
      },
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
        visibility: true,
        createdAt: true,
      },
    });
  }

  /**
   * Mural de oração da tela inicial: só os pedidos que o autor marcou como
   * compartilhados (`PUBLIC`) e que seguem ativos. Pedido privado NUNCA sai
   * daqui — ele fica só para a liderança, no painel.
   */
  async sharedPrayers(churchId: string, memberId: string) {
    const prayers = await this.prisma.prayer.findMany({
      where: { churchId, visibility: 'PUBLIC', status: 'ACTIVE' },
      orderBy: { createdAt: 'desc' },
      take: 15,
      select: {
        id: true,
        title: true,
        description: true,
        createdAt: true,
        memberId: true,
      },
    });
    if (!prayers.length) return [];

    const ids_pedidos = prayers.map((p) => p.id);
    const [contagens, meus] = await this.prisma.$transaction([
      this.prisma.prayerIntercession.groupBy({
        by: ['prayerId'],
        where: { prayerId: { in: ids_pedidos } },
        _count: true,
        orderBy: { prayerId: 'asc' },
      }),
      this.prisma.prayerIntercession.findMany({
        where: { prayerId: { in: ids_pedidos }, memberId },
        select: { prayerId: true },
      }),
    ]);
    const totalPorPedido = new Map(
      contagens.map((c) => [c.prayerId, c._count as number]),
    );
    const meusPedidos = new Set(meus.map((m) => m.prayerId));

    // Prayer.memberId não tem relation no schema — busca os nomes à parte.
    const ids = prayers
      .map((p) => p.memberId)
      .filter((id): id is string => !!id);
    const membros = ids.length
      ? await this.prisma.member.findMany({
          where: { id: { in: ids }, churchId },
          select: { id: true, name: true, photo: true },
        })
      : [];
    const porId = new Map(membros.map((m) => [m.id, m]));

    return prayers.map((p) => {
      const autor = p.memberId ? porId.get(p.memberId) : undefined;
      return {
        id: p.id,
        title: p.title,
        description: p.description,
        createdAt: p.createdAt,
        // Só o primeiro nome: o pedido é público para a igreja, não um cadastro.
        authorName: autor?.name?.trim().split(/\s+/)[0] ?? null,
        authorPhoto: autor?.photo ?? null,
        prayingCount: totalPorPedido.get(p.id) ?? 0,
        iAmPraying: meusPedidos.has(p.id),
        isMine: p.memberId === memberId,
      };
    });
  }

  /**
   * "Estou orando por você": entra ou sai do pedido de outro irmão.
   * Só vale para pedido compartilhado (PUBLIC) da própria igreja.
   */
  async togglePrayerIntercession(
    churchId: string,
    memberId: string,
    prayerId: string,
  ) {
    const pedido = await this.prisma.prayer.findFirst({
      where: { id: prayerId, churchId, visibility: 'PUBLIC' },
      select: { id: true },
    });
    if (!pedido) throw new NotFoundException('Pedido não encontrado.');

    const existente = await this.prisma.prayerIntercession.findUnique({
      where: { prayerId_memberId: { prayerId, memberId } },
    });
    if (existente) {
      await this.prisma.prayerIntercession.delete({
        where: { id: existente.id },
      });
    } else {
      await this.prisma.prayerIntercession.create({
        data: { churchId, prayerId, memberId },
      });
    }

    const prayingCount = await this.prisma.prayerIntercession.count({
      where: { prayerId },
    });
    return { prayingCount, iAmPraying: !existente };
  }

  async myPrayers(memberId: string) {
    return this.prisma.prayer.findMany({
      where: { memberId },
      orderBy: { createdAt: 'desc' },
      take: 30,
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
        visibility: true,
        createdAt: true,
      },
    });
  }
}
