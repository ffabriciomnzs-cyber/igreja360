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

const churchSelect = {
  id: true,
  name: true,
  slug: true,
  logo: true,
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
}
