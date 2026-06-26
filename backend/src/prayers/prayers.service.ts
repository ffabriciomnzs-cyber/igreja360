import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, PrayerStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePrayerDto } from './dto/create-prayer.dto';
import { UpdatePrayerDto } from './dto/update-prayer.dto';

@Injectable()
export class PrayersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(churchId: string, status?: string) {
    const where: Prisma.PrayerWhereInput = { churchId };
    if (status === 'ACTIVE' || status === 'ANSWERED' || status === 'ARCHIVED') {
      where.status = status as PrayerStatus;
    }
    return this.prisma.prayer.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(churchId: string, id: string) {
    const prayer = await this.prisma.prayer.findFirst({
      where: { id, churchId },
    });
    if (!prayer) throw new NotFoundException('Pedido não encontrado.');
    return prayer;
  }

  async create(churchId: string, dto: CreatePrayerDto) {
    return this.prisma.prayer.create({
      data: {
        churchId,
        title: dto.title.trim(),
        description: dto.description?.trim() || null,
        memberId: dto.memberId || null,
        status: dto.status ?? 'ACTIVE',
        visibility: dto.visibility?.trim() || 'PUBLIC',
      },
    });
  }

  async update(churchId: string, id: string, dto: UpdatePrayerDto) {
    await this.findOne(churchId, id);
    const data: Prisma.PrayerUpdateInput = {};
    if (dto.title !== undefined) data.title = dto.title.trim();
    if (dto.description !== undefined)
      data.description = dto.description?.trim() || null;
    if (dto.status !== undefined) data.status = dto.status;
    if (dto.visibility !== undefined)
      data.visibility = dto.visibility?.trim() || 'PUBLIC';
    return this.prisma.prayer.update({ where: { id }, data });
  }

  async remove(churchId: string, id: string) {
    await this.findOne(churchId, id);
    await this.prisma.prayer.delete({ where: { id } });
    return { success: true };
  }
}
