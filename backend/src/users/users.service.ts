import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

const userSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  active: true,
  createdAt: true,
} satisfies Prisma.UserSelect;

function isEmailTaken(err: unknown): boolean {
  return (
    err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002'
  );
}

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(churchId: string) {
    return this.prisma.user.findMany({
      where: { churchId },
      select: userSelect,
      orderBy: { name: 'asc' },
    });
  }

  private async ensureInChurch(churchId: string, id: string) {
    const user = await this.prisma.user.findFirst({ where: { id, churchId } });
    if (!user) throw new NotFoundException('Usuário não encontrado.');
    return user;
  }

  async create(churchId: string, dto: CreateUserDto) {
    const passwordHash = await bcrypt.hash(dto.password, 10);
    try {
      return await this.prisma.user.create({
        data: {
          churchId,
          name: dto.name.trim(),
          email: dto.email.toLowerCase().trim(),
          passwordHash,
          role: dto.role,
        },
        select: userSelect,
      });
    } catch (err) {
      if (isEmailTaken(err)) {
        throw new BadRequestException('Este e-mail já está em uso.');
      }
      throw err;
    }
  }

  async update(churchId: string, id: string, dto: UpdateUserDto) {
    await this.ensureInChurch(churchId, id);
    const data: Prisma.UserUpdateInput = {};
    if (dto.name !== undefined) data.name = dto.name.trim();
    if (dto.email !== undefined) data.email = dto.email.toLowerCase().trim();
    if (dto.role !== undefined) data.role = dto.role;
    if (dto.active !== undefined) data.active = dto.active;
    if (dto.password) data.passwordHash = await bcrypt.hash(dto.password, 10);

    try {
      return await this.prisma.user.update({
        where: { id },
        data,
        select: userSelect,
      });
    } catch (err) {
      if (isEmailTaken(err)) {
        throw new BadRequestException('Este e-mail já está em uso.');
      }
      throw err;
    }
  }

  async remove(churchId: string, id: string, currentUserId: string) {
    if (id === currentUserId) {
      throw new BadRequestException('Você não pode excluir a sua própria conta.');
    }
    await this.ensureInChurch(churchId, id);
    await this.prisma.user.delete({ where: { id } });
    return { success: true };
  }
}
