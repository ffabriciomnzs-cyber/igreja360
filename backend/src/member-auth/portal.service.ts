import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

function brToday(): string {
  const br = new Date(Date.now() - 3 * 60 * 60 * 1000);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${br.getUTCFullYear()}-${pad(br.getUTCMonth() + 1)}-${pad(br.getUTCDate())}`;
}

@Injectable()
export class PortalService {
  constructor(private readonly prisma: PrismaService) {}

  async devotional(churchId: string, memberId: string) {
    const day = brToday();
    const [count, mine] = await this.prisma.$transaction([
      this.prisma.devotionalPrayer.count({ where: { churchId, day } }),
      this.prisma.devotionalPrayer.findUnique({
        where: { memberId_day: { memberId, day } },
      }),
    ]);
    return { day, count, joined: mine !== null };
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
