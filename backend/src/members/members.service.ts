import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMemberDto } from './dto/create-member.dto';
import { UpdateMemberDto } from './dto/update-member.dto';
import { QueryMembersDto } from './dto/query-members.dto';

const memberInclude = {
  cell: { select: { id: true, name: true } },
} satisfies Prisma.MemberInclude;

@Injectable()
export class MembersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(churchId: string, query: QueryMembersDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Prisma.MemberWhereInput = { churchId };

    if (query.status) {
      where.status = query.status;
    }
    if (query.cellId) {
      where.cellId = query.cellId;
    }
    if (query.search) {
      const term = query.search.trim();
      where.OR = [
        { name: { contains: term, mode: 'insensitive' } },
        { email: { contains: term, mode: 'insensitive' } },
        { phone: { contains: term, mode: 'insensitive' } },
        { cpf: { contains: term, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await this.prisma.$transaction([
      this.prisma.member.findMany({
        where,
        include: memberInclude,
        orderBy: { name: 'asc' },
        skip,
        take: limit,
      }),
      this.prisma.member.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    };
  }

  async findOne(churchId: string, id: string) {
    const member = await this.prisma.member.findFirst({
      where: { id, churchId },
      include: memberInclude,
    });
    if (!member) {
      throw new NotFoundException('Membro não encontrado.');
    }
    return member;
  }

  async create(churchId: string, dto: CreateMemberDto) {
    return this.prisma.member.create({
      data: {
        churchId,
        name: dto.name.trim(),
        email: dto.email?.toLowerCase().trim() || null,
        phone: dto.phone?.trim() || null,
        cpf: dto.cpf?.trim() || null,
        birthDate: dto.birthDate ? new Date(dto.birthDate) : null,
        address: dto.address?.trim() || null,
        city: dto.city?.trim() || null,
        status: dto.status ?? 'ACTIVE',
        role: dto.role ?? null,
        cellId: dto.cellId || null,
        joinedAt: dto.joinedAt ? new Date(dto.joinedAt) : new Date(),
      },
      include: memberInclude,
    });
  }

  async update(churchId: string, id: string, dto: UpdateMemberDto) {
    await this.findOne(churchId, id);

    const data: Prisma.MemberUpdateInput = {};
    if (dto.name !== undefined) data.name = dto.name.trim();
    if (dto.email !== undefined) data.email = dto.email?.toLowerCase().trim() || null;
    if (dto.phone !== undefined) data.phone = dto.phone?.trim() || null;
    if (dto.cpf !== undefined) data.cpf = dto.cpf?.trim() || null;
    if (dto.birthDate !== undefined)
      data.birthDate = dto.birthDate ? new Date(dto.birthDate) : null;
    if (dto.address !== undefined) data.address = dto.address?.trim() || null;
    if (dto.city !== undefined) data.city = dto.city?.trim() || null;
    if (dto.status !== undefined) data.status = dto.status;
    if (dto.role !== undefined) data.role = dto.role ?? null;
    if (dto.cellId !== undefined)
      data.cell = dto.cellId
        ? { connect: { id: dto.cellId } }
        : { disconnect: true };
    if (dto.joinedAt !== undefined)
      data.joinedAt = dto.joinedAt ? new Date(dto.joinedAt) : null;

    return this.prisma.member.update({
      where: { id },
      data,
      include: memberInclude,
    });
  }

  async remove(churchId: string, id: string) {
    await this.findOne(churchId, id);
    await this.prisma.member.delete({ where: { id } });
    return { success: true };
  }

  async stats(churchId: string) {
    const [total, active, visitors, inactive, recent] =
      await this.prisma.$transaction([
        this.prisma.member.count({ where: { churchId } }),
        this.prisma.member.count({ where: { churchId, status: 'ACTIVE' } }),
        this.prisma.member.count({ where: { churchId, status: 'VISITOR' } }),
        this.prisma.member.count({ where: { churchId, status: 'INACTIVE' } }),
        this.prisma.member.findMany({
          where: { churchId },
          include: memberInclude,
          orderBy: { createdAt: 'desc' },
          take: 5,
        }),
      ]);

    return { total, active, visitors, inactive, recent };
  }
}
