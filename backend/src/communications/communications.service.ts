import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCommunicationDto } from './dto/create-communication.dto';
import { UpdateCommunicationDto } from './dto/update-communication.dto';

@Injectable()
export class CommunicationsService {
  constructor(private readonly prisma: PrismaService) {}

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
    return this.prisma.communication.create({
      data: {
        churchId,
        authorId,
        title: dto.title.trim(),
        content: dto.content.trim(),
        type: dto.type?.trim() || 'NOTICE',
      },
    });
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
