import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateChurchDto } from './dto/update-church.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

const churchSelect = {
  id: true,
  name: true,
  slug: true,
  logo: true,
  cardLogo: true,
  denomination: true,
  address: true,
  phone: true,
  email: true,
  site: true,
  serviceHours: true,
} satisfies Prisma.ChurchSelect;

@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async getChurch(churchId: string) {
    const church = await this.prisma.church.findUnique({
      where: { id: churchId },
      select: churchSelect,
    });
    if (!church) throw new NotFoundException('Igreja não encontrada.');
    return church;
  }

  async updateChurch(churchId: string, dto: UpdateChurchDto) {
    const data: Prisma.ChurchUpdateInput = {};
    if (dto.name !== undefined) data.name = dto.name.trim();
    if (dto.logo !== undefined) data.logo = dto.logo || null;
    if (dto.cardLogo !== undefined) data.cardLogo = dto.cardLogo || null;
    if (dto.denomination !== undefined)
      data.denomination = dto.denomination?.trim() || null;
    if (dto.address !== undefined) data.address = dto.address?.trim() || null;
    if (dto.phone !== undefined) data.phone = dto.phone?.trim() || null;
    if (dto.email !== undefined) data.email = dto.email?.trim() || null;
    if (dto.site !== undefined) data.site = dto.site?.trim() || null;
    if (dto.serviceHours !== undefined)
      data.serviceHours = dto.serviceHours?.trim() || null;

    return this.prisma.church.update({
      where: { id: churchId },
      data,
      select: churchSelect,
    });
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Usuário não encontrado.');

    const ok = await bcrypt.compare(dto.currentPassword, user.passwordHash);
    if (!ok) throw new BadRequestException('Senha atual incorreta.');

    const passwordHash = await bcrypt.hash(dto.newPassword, 10);
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });
    return { success: true };
  }

  /** Agenda fixa de cultos da igreja (quadro semanal do portal). */
  async getSchedules(churchId: string) {
    return this.prisma.serviceSchedule.findMany({
      where: { churchId },
      orderBy: [{ order: 'asc' }, { weekday: 'asc' }, { time: 'asc' }],
      select: {
        id: true,
        weekday: true,
        time: true,
        name: true,
        note: true,
        active: true,
      },
    });
  }

  /**
   * Substitui a agenda inteira pela lista enviada. É a operação que a tela de
   * Configurações usa (a pessoa mexe nas linhas e salva tudo de uma vez).
   */
  async replaceSchedules(
    churchId: string,
    schedules: {
      weekday: number;
      time: string;
      name: string;
      note?: string;
      active?: boolean;
    }[],
  ) {
    await this.prisma.$transaction([
      this.prisma.serviceSchedule.deleteMany({ where: { churchId } }),
      this.prisma.serviceSchedule.createMany({
        data: schedules.map((s, i) => ({
          churchId,
          weekday: s.weekday,
          time: s.time,
          name: s.name.trim(),
          note: s.note?.trim() || null,
          active: s.active ?? true,
          order: i,
        })),
      }),
    ]);
    return this.getSchedules(churchId);
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const data: Prisma.UserUpdateInput = {};
    if (dto.name !== undefined) data.name = dto.name.trim();
    if (dto.gender !== undefined) data.gender = dto.gender ?? null;

    return this.prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        gender: true,
        churchId: true,
      },
    });
  }
}
