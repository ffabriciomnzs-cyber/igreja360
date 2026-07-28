import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { PushService } from '../push/push.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { QueryEventsDto } from './dto/query-events.dto';

/**
 * Seleção padrão do evento: tudo, MENOS `photo`. A foto é um data URL base64
 * (centenas de KB) e trafegava em toda listagem e detalhe. Agora a tela recebe
 * `photoUrl` e busca a imagem pelo endpoint público, que o navegador guarda em
 * cache. Só o endpoint da imagem lê a coluna `photo`.
 */
const eventSelect = {
  id: true,
  churchId: true,
  name: true,
  description: true,
  date: true,
  endDate: true,
  location: true,
  capacity: true,
  type: true,
  photoUpdatedAt: true,
  createdAt: true,
} satisfies Prisma.EventSelect;

type EventRow = Prisma.EventGetPayload<{ select: typeof eventSelect }>;

/**
 * Acrescenta `photoUrl` (relativa à raiz da API; a tela prefixa com a base).
 * O `?v=` é a data da última troca da foto: muda a URL quando a imagem muda,
 * o que permite cachear de forma agressiva sem servir imagem velha.
 */
function withPhotoUrl(event: EventRow) {
  return {
    ...event,
    photoUrl: event.photoUpdatedAt
      ? `/public/events/${event.id}/photo?v=${event.photoUpdatedAt.getTime()}`
      : null,
  };
}

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
      this.prisma.event.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        select: eventSelect,
      }),
      this.prisma.event.count({ where }),
    ]);

    return {
      data: data.map(withPhotoUrl),
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    };
  }

  async findOne(churchId: string, id: string) {
    const event = await this.prisma.event.findFirst({
      where: { id, churchId },
      select: eventSelect,
    });
    if (!event) {
      throw new NotFoundException('Evento não encontrado.');
    }
    return withPhotoUrl(event);
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
        photoUpdatedAt: dto.photo ? new Date() : null,
      },
      select: eventSelect,
    });
    // Avisa os membros por push (best-effort, não bloqueia a criação).
    const quando = created.date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      timeZone: 'America/Sao_Paulo',
    });
    // .catch: garante que uma falha no push jamais vire unhandled rejection
    // (o `void` sozinho nao captura), o que poderia derrubar o processo.
    void this.push.notifyChurch(
      churchId,
      '📅 Novo evento',
      `${created.name} — ${quando}`,
      'events',
    ).catch(() => undefined);
    return withPhotoUrl(created);
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
    // `photo` ausente = mantém a atual (a tela só o envia quando troca ou
    // remove a imagem, para não reenviar centenas de KB a cada "Salvar").
    if (dto.photo !== undefined) {
      data.photo = dto.photo || null;
      data.photoUpdatedAt = dto.photo ? new Date() : null;
    }

    const updated = await this.prisma.event.update({
      where: { id },
      data,
      select: eventSelect,
    });
    return withPhotoUrl(updated);
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
