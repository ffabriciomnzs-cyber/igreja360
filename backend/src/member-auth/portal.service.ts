import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

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
    };
  }

  async complete(churchId: string, memberId: string) {
    const day = brToday();
    await this.prisma.devotionalCompletion.upsert({
      where: { memberId_day: { memberId, day } },
      create: { churchId, memberId, day },
      update: {},
    });
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
    };
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

  async home(churchId: string) {
    const now = new Date();
    const [worship, events, campaigns] = await this.prisma.$transaction([
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
        select: {
          id: true,
          name: true,
          date: true,
          location: true,
          type: true,
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
    ]);

    return {
      worship,
      events,
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

  async me(memberId: string) {
    const member = await this.prisma.member.findUnique({
      where: { id: memberId },
      select: {
        id: true,
        churchId: true,
        name: true,
        email: true,
        phone: true,
        photo: true,
        birthDate: true,
        baptismDate: true,
        status: true,
        role: true,
        joinedAt: true,
      },
    });
    if (!member) throw new NotFoundException('Membro não encontrado.');

    const church = await this.prisma.church.findUnique({
      where: { id: member.churchId },
      select: { name: true, logo: true, cardLogo: true, denomination: true },
    });

    return { member, church };
  }
}
