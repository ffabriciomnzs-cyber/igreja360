import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCellDto } from './dto/create-cell.dto';
import { UpdateCellDto } from './dto/update-cell.dto';
import { QueryCellsDto } from './dto/query-cells.dto';
import { CreateMeetingDto } from './dto/create-meeting.dto';

@Injectable()
export class CellsService {
  constructor(private readonly prisma: PrismaService) {}

  private async resolveLeaderNames(
    churchId: string,
    ids: string[],
  ): Promise<Map<string, string>> {
    const unique = Array.from(new Set(ids.filter(Boolean)));
    if (unique.length === 0) return new Map();
    const members = await this.prisma.member.findMany({
      where: { churchId, id: { in: unique } },
      select: { id: true, name: true },
    });
    return new Map(members.map((m) => [m.id, m.name]));
  }

  async findAll(churchId: string, query: QueryCellsDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Prisma.CellWhereInput = { churchId };
    if (query.active === 'true') where.active = true;
    if (query.active === 'false') where.active = false;
    if (query.search) {
      const term = query.search.trim();
      where.OR = [
        { name: { contains: term, mode: 'insensitive' } },
        { neighborhood: { contains: term, mode: 'insensitive' } },
      ];
    }

    const [cells, total] = await this.prisma.$transaction([
      this.prisma.cell.findMany({
        where,
        include: { _count: { select: { members: true, meetings: true } } },
        orderBy: { name: 'asc' },
        skip,
        take: limit,
      }),
      this.prisma.cell.count({ where }),
    ]);

    const leaderNames = await this.resolveLeaderNames(
      churchId,
      cells.map((c) => c.leaderId ?? '').filter(Boolean),
    );

    const data = cells.map((c) => ({
      ...c,
      leaderName: c.leaderId ? leaderNames.get(c.leaderId) ?? null : null,
    }));

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    };
  }

  async findOne(churchId: string, id: string) {
    const cell = await this.prisma.cell.findFirst({
      where: { id, churchId },
      include: {
        members: {
          // sem `photo`: base64 pesado e não exibido na tela da célula
          select: { id: true, name: true, status: true, role: true },
          orderBy: { name: 'asc' },
        },
        meetings: { orderBy: { date: 'desc' } },
        _count: { select: { members: true, meetings: true } },
      },
    });
    if (!cell) {
      throw new NotFoundException('Célula não encontrada.');
    }

    const leaderNames = await this.resolveLeaderNames(churchId, [
      cell.leaderId ?? '',
      cell.coLeaderId ?? '',
    ]);

    return {
      ...cell,
      leaderName: cell.leaderId ? leaderNames.get(cell.leaderId) ?? null : null,
      coLeaderName: cell.coLeaderId
        ? leaderNames.get(cell.coLeaderId) ?? null
        : null,
    };
  }

  async create(churchId: string, dto: CreateCellDto) {
    return this.prisma.cell.create({
      data: {
        churchId,
        name: dto.name.trim(),
        leaderId: dto.leaderId || null,
        coLeaderId: dto.coLeaderId || null,
        dayOfWeek: dto.dayOfWeek?.trim() || null,
        time: dto.time?.trim() || null,
        address: dto.address?.trim() || null,
        neighborhood: dto.neighborhood?.trim() || null,
        capacity: dto.capacity ?? null,
        active: dto.active ?? true,
      },
    });
  }

  async update(churchId: string, id: string, dto: UpdateCellDto) {
    await this.findOne(churchId, id);

    const data: Prisma.CellUpdateInput = {};
    if (dto.name !== undefined) data.name = dto.name.trim();
    if (dto.leaderId !== undefined) data.leaderId = dto.leaderId || null;
    if (dto.coLeaderId !== undefined) data.coLeaderId = dto.coLeaderId || null;
    if (dto.dayOfWeek !== undefined) data.dayOfWeek = dto.dayOfWeek?.trim() || null;
    if (dto.time !== undefined) data.time = dto.time?.trim() || null;
    if (dto.address !== undefined) data.address = dto.address?.trim() || null;
    if (dto.neighborhood !== undefined)
      data.neighborhood = dto.neighborhood?.trim() || null;
    if (dto.capacity !== undefined) data.capacity = dto.capacity ?? null;
    if (dto.active !== undefined) data.active = dto.active;

    return this.prisma.cell.update({ where: { id }, data });
  }

  async remove(churchId: string, id: string) {
    await this.findOne(churchId, id);
    await this.prisma.cell.delete({ where: { id } });
    return { success: true };
  }

  async addMeeting(churchId: string, cellId: string, dto: CreateMeetingDto) {
    await this.findOne(churchId, cellId);
    return this.prisma.cellMeeting.create({
      data: {
        cellId,
        date: new Date(dto.date),
        theme: dto.theme?.trim() || null,
        attendees: dto.attendees ?? null,
        notes: dto.notes?.trim() || null,
      },
    });
  }

  async removeMeeting(churchId: string, cellId: string, meetingId: string) {
    await this.findOne(churchId, cellId);
    const meeting = await this.prisma.cellMeeting.findFirst({
      where: { id: meetingId, cellId },
    });
    if (!meeting) {
      throw new NotFoundException('Reunião não encontrada.');
    }
    await this.prisma.cellMeeting.delete({ where: { id: meetingId } });
    return { success: true };
  }

  async addMember(churchId: string, cellId: string, memberId: string) {
    await this.findOne(churchId, cellId);
    const member = await this.prisma.member.findFirst({
      where: { id: memberId, churchId },
    });
    if (!member) {
      throw new NotFoundException('Membro não encontrado.');
    }
    await this.prisma.member.update({
      where: { id: memberId },
      data: { cellId },
    });
    return { success: true };
  }

  async removeMember(churchId: string, cellId: string, memberId: string) {
    await this.findOne(churchId, cellId);
    const member = await this.prisma.member.findFirst({
      where: { id: memberId, churchId, cellId },
    });
    if (!member) {
      throw new NotFoundException('Membro não encontrado nesta célula.');
    }
    await this.prisma.member.update({
      where: { id: memberId },
      data: { cellId: null },
    });
    return { success: true };
  }

  async stats(churchId: string) {
    const [total, active, membersInCells] = await this.prisma.$transaction([
      this.prisma.cell.count({ where: { churchId } }),
      this.prisma.cell.count({ where: { churchId, active: true } }),
      this.prisma.member.count({
        where: { churchId, cellId: { not: null } },
      }),
    ]);
    return { total, active, membersInCells };
  }
}
