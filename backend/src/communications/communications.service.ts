import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PushService } from '../push/push.service';
import { CreateCommunicationDto } from './dto/create-communication.dto';
import { UpdateCommunicationDto } from './dto/update-communication.dto';

@Injectable()
export class CommunicationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly push: PushService,
  ) {}

  async findAll(churchId: string) {
    return this.prisma.communication.findMany({
      where: { churchId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(churchId: string, id: string) {
    const item = await this.prisma.communication.findFirst({
      where: { id, churchId },
    });
    if (!item) throw new NotFoundException('Comunicado não encontrado.');
    return item;
  }

  async create(churchId: string, authorId: string, dto: CreateCommunicationDto) {
    const comm = await this.prisma.communication.create({
      data: {
        churchId,
        authorId,
        title: dto.title.trim(),
        content: dto.content.trim(),
        type: dto.type?.trim() || 'NOTICE',
      },
    });
    // Notifica os membros por push (não bloqueia nem falha a criação).
    void this.notifyMembers(churchId, comm.title);
    return comm;
  }

  private async notifyMembers(churchId: string, title: string): Promise<void> {
    try {
      const church = await this.prisma.church.findUnique({
        where: { id: churchId },
        select: { slug: true },
      });
      await this.push.sendToChurch(churchId, {
        title: '📢 Novo aviso da igreja',
        body: title,
        url: church?.slug ? `/portal/${church.slug}/inicio` : undefined,
      });
    } catch {
      /* push é best-effort */
    }
  }

  async update(churchId: string, id: string, dto: UpdateCommunicationDto) {
    await this.findOne(churchId, id);
    return this.prisma.communication.update({
      where: { id },
      data: {
        ...(dto.title !== undefined ? { title: dto.title.trim() } : {}),
        ...(dto.content !== undefined ? { content: dto.content.trim() } : {}),
        ...(dto.type !== undefined ? { type: dto.type?.trim() || 'NOTICE' } : {}),
      },
    });
  }

  async remove(churchId: string, id: string) {
    await this.findOne(churchId, id);
    await this.prisma.communication.delete({ where: { id } });
    return { success: true };
  }
}
