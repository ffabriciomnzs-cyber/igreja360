import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { PushService } from '../push/push.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { QueryEventsDto } from './dto/query-events.dto';

@Injectable()
export class EventsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly push: PushService,
  ) {}

  async findAll(churchId: string, query: QueryEventsDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;
    const now = new Date();

    const where: Prisma.EventWhereInput = { churchId };
    if (query.type) where.type = query.type;
    if (query.when === 'upcoming') where.date = { gte: now };
    if (query.when === 'past') where.date = { lt: now };
    if (query.search) {
      const term = query.search.trim();
      where.OR = [
        { name: { contains: term, mode: 'insensitive' } },
        { location: { contains: term, mode: 'insensitive' } },
      ];
    }

    const orderBy: Prisma.EventOrderByWithRelationInput =
      query.when === 'past' ? { date: 'desc' } : { date: 'asc' };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.event.findMany({ where, orderBy, skip, take: limit }),
      this.prisma.event.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    };
  }

  async findOne(churchId: string, id: string) {
    const event = await this.prisma.event.findFirst({
      where: { id, churchId },
    });
    if (!event) {
      throw new NotFoundException('Evento não encontrado.');
    }
    return event;
  }

  async create(churchId: string, dto: CreateEventDto) {
    const created = await this.prisma.event.create({
      data: {
        churchId,
        name: dto.name.trim(),
        description: dto.description?.trim() || null,
        date: new Date(dto.date),
        endDate: dto.endDate ? new Date(dto.endDate) : null,
        location: dto.location?.trim() || null,
        capacity: dto.capacity ?? null,
        type: dto.type?.trim() || null,
        photo: dto.photo || null,
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
      '📅 Novo evento',
      `${created.name} — ${quando}`,
      'events',
    );
    return created;
  }

  async update(churchId: string, id: string, dto: UpdateEventDto) {
    await this.findOne(churchId, id);
    const data: Prisma.EventUpdateInput = {};
    if (dto.name !== undefined) data.name = dto.name.trim();
    if (dto.description !== undefined)
      data.description = dto.description?.trim() || null;
    if (dto.date !== undefined) data.date = new Date(dto.date);
    if (dto.endDate !== undefined)
      data.endDate = dto.endDate ? new Date(dto.endDate) : null;
    if (dto.location !== undefined) data.location = dto.location?.trim() || null;
    if (dto.capacity !== undefined) data.capacity = dto.capacity ?? null;
    if (dto.type !== undefined) data.type = dto.type?.trim() || null;
    if (dto.photo !== undefined) data.photo = dto.photo || null;

    return this.prisma.event.update({ where: { id }, data });
  }

  async remove(churchId: string, id: string) {
    await this.findOne(churchId, id);
    await this.prisma.event.delete({ where: { id } });
    return { success: true };
  }

  async stats(churchId: string) {
    const now = new Date();
    const [total, upcoming] = await this.prisma.$transaction([
      this.prisma.event.count({ where: { churchId } }),
      this.prisma.event.count({ where: { churchId, date: { gte: now } } }),
    ]);
    return { total, upcoming };
  }
}
