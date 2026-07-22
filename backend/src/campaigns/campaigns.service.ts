import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, CampaignStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { PushService } from '../push/push.service';
import { CreateCampaignDto } from './dto/create-campaign.dto';
import { UpdateCampaignDto } from './dto/update-campaign.dto';

@Injectable()
export class CampaignsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly push: PushService,
  ) {}

  async findAll(churchId: string, status?: string, search?: string) {
    const where: Prisma.CampaignWhereInput = { churchId };
    if (status === 'ACTIVE' || status === 'PAUSED' || status === 'CLOSED') {
      where.status = status as CampaignStatus;
    }
    if (search) {
      where.title = { contains: search.trim(), mode: 'insensitive' };
    }
    return this.prisma.campaign.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(churchId: string, id: string) {
    const campaign = await this.prisma.campaign.findFirst({
      where: { id, churchId },
    });
    if (!campaign) throw new NotFoundException('Campanha não encontrada.');
    return campaign;
  }

  async create(churchId: string, dto: CreateCampaignDto) {
    const created = await this.prisma.campaign.create({
      data: {
        churchId,
        title: dto.title.trim(),
        description: dto.description?.trim() || null,
        type: dto.type.trim(),
        status: dto.status ?? 'ACTIVE',
        goal: dto.goal != null ? new Prisma.Decimal(dto.goal) : null,
        current: dto.current != null ? new Prisma.Decimal(dto.current) : null,
        startDate: dto.startDate ? new Date(dto.startDate) : null,
        endDate: dto.endDate ? new Date(dto.endDate) : null,
      },
    });
    // Avisa os membros por push (best-effort, não bloqueia a criação).
    void this.push.notifyChurch(churchId, '💜 Nova campanha', created.title);
    return created;
  }

  async update(churchId: string, id: string, dto: UpdateCampaignDto) {
    await this.findOne(churchId, id);
    const data: Prisma.CampaignUpdateInput = {};
    if (dto.title !== undefined) data.title = dto.title.trim();
    if (dto.description !== undefined)
      data.description = dto.description?.trim() || null;
    if (dto.type !== undefined) data.type = dto.type.trim();
    if (dto.status !== undefined) data.status = dto.status;
    if (dto.goal !== undefined)
      data.goal = dto.goal != null ? new Prisma.Decimal(dto.goal) : null;
    if (dto.current !== undefined)
      data.current = dto.current != null ? new Prisma.Decimal(dto.current) : null;
    if (dto.startDate !== undefined)
      data.startDate = dto.startDate ? new Date(dto.startDate) : null;
    if (dto.endDate !== undefined)
      data.endDate = dto.endDate ? new Date(dto.endDate) : null;
    return this.prisma.campaign.update({ where: { id }, data });
  }

  async remove(churchId: string, id: string) {
    await this.findOne(churchId, id);
    await this.prisma.campaign.delete({ where: { id } });
    return { success: true };
  }
}
