import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpsertDevotionalDto } from './dto/upsert-devotional.dto';

@Injectable()
export class DevotionalsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(churchId: string) {
    return this.prisma.devotional.findMany({
      where: { churchId },
      orderBy: { date: 'desc' },
      take: 60,
      select: { id: true, date: true, title: true, verseRef: true },
    });
  }

  async getByDate(churchId: string, date: string) {
    return this.prisma.devotional.findUnique({
      where: { churchId_date: { churchId, date } },
    });
  }

  async upsert(churchId: string, dto: UpsertDevotionalDto) {
    const data = {
      title: dto.title?.trim() || null,
      verseRef: dto.verseRef?.trim() || null,
      verseText: dto.verseText?.trim() || null,
      reflection: dto.reflection.trim(),
      songTitle: dto.songTitle?.trim() || null,
      songUrl: dto.songUrl?.trim() || null,
      image: dto.image || null,
    };
    return this.prisma.devotional.upsert({
      where: { churchId_date: { churchId, date: dto.date } },
      create: { churchId, date: dto.date, ...data },
      update: data,
    });
  }
}
