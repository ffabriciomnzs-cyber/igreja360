import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, WorshipStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { PushService } from '../push/push.service';
import {
  CreateWorshipDto,
  WorshipItemDto,
  WorshipParticipantDto,
} from './dto/create-worship.dto';
import { UpdateWorshipDto } from './dto/update-worship.dto';
import { QueryWorshipDto } from './dto/query-worship.dto';

@Injectable()
export class WorshipService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly push: PushService,
  ) {}

  private mapItems(items: WorshipItemDto[]) {
    return items.map((it, i) => ({
      order: it.order ?? i,
      title: it.title.trim(),
      responsible: it.responsible?.trim() || null,
      durationMin: it.durationMin ?? null,
      notes: it.notes?.trim() || null,
    }));
  }

  private mapParticipants(participants: WorshipParticipantDto[]) {
    return participants.map((p) => ({
      memberId: p.memberId || null,
      name: p.name.trim(),
      role: p.role.trim(),
      notes: p.notes?.trim() || null,
    }));
  }

  async findAll(churchId: string, query: QueryWorshipDto) {
    const where: Prisma.WorshipServiceWhereInput = { churchId };
    const now = new Date();
    const todayStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    );
    if (query.when === 'upcoming') where.date = { gte: todayStart };
    if (query.when === 'past') where.date = { lt: todayStart };

    return this.prisma.worshipService.findMany({
      where,
      orderBy: { date: query.when === 'past' ? 'desc' : 'asc' },
      include: {
        _count: { select: { items: true, participants: true } },
      },
    });
  }

  async findOne(churchId: string, id: string) {
    const service = await this.prisma.worshipService.findFirst({
      where: { id, churchId },
      include: {
        items: { orderBy: { order: 'asc' } },
        participants: { orderBy: { name: 'asc' } },
      },
    });
    if (!service) {
      throw new NotFoundException('Culto não encontrado.');
    }
    return service;
  }

  async create(churchId: string, dto: CreateWorshipDto) {
    const created = await this.prisma.worshipService.create({
      data: {
        churchId,
        title: dto.title.trim(),
        date: new Date(dto.date),
        theme: dto.theme?.trim() || null,
        bibleRef: dto.bibleRef?.trim() || null,
        notes: dto.notes?.trim() || null,
        status: (dto.status as WorshipStatus) ?? WorshipStatus.PLANNED,
        items: dto.items?.length
          ? { create: this.mapItems(dto.items) }
          : undefined,
        participants: dto.participants?.length
          ? { create: this.mapParticipants(dto.participants) }
          : undefined,
      },
      include: {
        items: { orderBy: { order: 'asc' } },
        participants: { orderBy: { name: 'asc' } },
      },
    });
    // Avisa os membros por push (best-effort, não bloqueia a criação).
    const quando = created.date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      timeZone: 'America/Sao_Paulo',
    });
    void this.push.notifyChurch(
      churchId,
      '⛪ Novo culto agendado',
      `${created.title} — ${quando}`,
      'worship',
    );
    return created;
  }

  async update(churchId: string, id: string, dto: UpdateWorshipDto) {
    await this.findOne(churchId, id);

    const data: Prisma.WorshipServiceUpdateInput = {};
    if (dto.title !== undefined) data.title = dto.title.trim();
    if (dto.date !== undefined) data.date = new Date(dto.date);
    if (dto.theme !== undefined) data.theme = dto.theme?.trim() || null;
    if (dto.bibleRef !== undefined) data.bibleRef = dto.bibleRef?.trim() || null;
    if (dto.notes !== undefined) data.notes = dto.notes?.trim() || null;
    if (dto.status !== undefined) data.status = dto.status as WorshipStatus;

    if (dto.items !== undefined) {
      await this.prisma.worshipItem.deleteMany({ where: { serviceId: id } });
      data.items = { create: this.mapItems(dto.items) };
    }
    if (dto.participants !== undefined) {
      await this.prisma.worshipParticipant.deleteMany({
        where: { serviceId: id },
      });
      data.participants = { create: this.mapParticipants(dto.participants) };
    }

    return this.prisma.worshipService.update({
      where: { id },
      data,
      include: {
        items: { orderBy: { order: 'asc' } },
        participants: { orderBy: { name: 'asc' } },
      },
    });
  }

  async remove(churchId: string, id: string) {
    await this.findOne(churchId, id);
    await this.prisma.worshipService.delete({ where: { id } });
    return { success: true };
  }

  async stats(churchId: string) {
    const now = new Date();
    const todayStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    );
    const [total, upcoming] = await this.prisma.$transaction([
      this.prisma.worshipService.count({ where: { churchId } }),
      this.prisma.worshipService.count({
        where: { churchId, date: { gte: todayStart } },
      }),
    ]);
    return { total, upcoming };
  }
}
