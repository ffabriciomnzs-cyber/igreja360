import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpsertPlanDto } from './dto/upsert-plan.dto';

@Injectable()
export class PlansService {
  constructor(private readonly prisma: PrismaService) {}

  async list(churchId: string) {
    const plans = await this.prisma.devotionalPlan.findMany({
      where: { churchId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        description: true,
        cover: true,
        active: true,
        _count: { select: { days: true } },
      },
    });
    return plans.map((p) => ({
      id: p.id,
      title: p.title,
      description: p.description,
      cover: p.cover,
      active: p.active,
      totalDays: p._count.days,
    }));
  }

  async get(churchId: string, id: string) {
    const plan = await this.prisma.devotionalPlan.findFirst({
      where: { id, churchId },
      include: { days: { orderBy: { dayNumber: 'asc' } } },
    });
    if (!plan) throw new NotFoundException('Plano não encontrado.');
    return plan;
  }

  async upsert(churchId: string, dto: UpsertPlanDto) {
    const days = dto.days.map((d, i) => ({
      dayNumber: d.dayNumber ?? i + 1,
      title: d.title?.trim() || null,
      verseRef: d.verseRef?.trim() || null,
      verseText: d.verseText?.trim() || null,
      reflection: d.reflection.trim(),
    }));

    const base = {
      title: dto.title.trim(),
      description: dto.description?.trim() || null,
      cover: dto.cover || null,
      active: dto.active ?? true,
    };

    if (dto.id) {
      const existing = await this.prisma.devotionalPlan.findFirst({
        where: { id: dto.id, churchId },
        select: { id: true },
      });
      if (!existing) throw new ForbiddenException('Plano não encontrado.');
      await this.prisma.$transaction([
        this.prisma.devotionalPlanDay.deleteMany({
          where: { planId: dto.id },
        }),
        this.prisma.devotionalPlan.update({
          where: { id: dto.id },
          data: { ...base, days: { create: days } },
        }),
      ]);
      return { id: dto.id };
    }

    const created = await this.prisma.devotionalPlan.create({
      data: { churchId, ...base, days: { create: days } },
      select: { id: true },
    });
    return created;
  }

  async remove(churchId: string, id: string) {
    const existing = await this.prisma.devotionalPlan.findFirst({
      where: { id, churchId },
      select: { id: true },
    });
    if (!existing) throw new NotFoundException('Plano não encontrado.');
    await this.prisma.devotionalPlan.delete({ where: { id } });
    return { ok: true };
  }
}
