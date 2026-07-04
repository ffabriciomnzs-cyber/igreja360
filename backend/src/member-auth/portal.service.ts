import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PortalService {
  constructor(private readonly prisma: PrismaService) {}

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
