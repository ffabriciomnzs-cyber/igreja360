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
        baptismDate: dto.baptismDate ? new Date(dto.baptismDate) : null,
        address: dto.address?.trim() || null,
        city: dto.city?.trim() || null,
        rg: dto.rg?.trim() || null,
        maritalStatus: dto.maritalStatus?.trim() || null,
        profession: dto.profession?.trim() || null,
        photo: dto.photo || null,
        status: dto.status ?? 'ACTIVE',
        role: dto.role ?? null,
        cellId: dto.cellId || null,
        joinedAt: dto.joinedAt ? new Date(dto.joinedAt) : new Date(),
      },
      include: memberInclude,
    });
  }

  // Importação em massa (ex.: planilha). Ignora linhas sem nome válido.
  async importMany(churchId: string, rows: CreateMemberDto[]) {
    const toDate = (v?: string): Date | null => {
      if (!v) return null;
      const d = new Date(v);
      return isNaN(d.getTime()) ? null : d;
    };

    const data = rows
      .filter((r) => typeof r.name === 'string' && r.name.trim().length >= 2)
      .map((r) => ({
        churchId,
        name: r.name.trim(),
        email:
          r.email && r.email.includes('@')
            ? r.email.toLowerCase().trim()
            : null,
        phone: r.phone?.trim() || null,
        cpf: r.cpf?.trim() || null,
        birthDate: toDate(r.birthDate),
        baptismDate: toDate(r.baptismDate),
        address: r.address?.trim() || null,
        city: r.city?.trim() || null,
        rg: r.rg?.trim() || null,
        maritalStatus: r.maritalStatus?.trim() || null,
        profession: r.profession?.trim() || null,
        status: r.status ?? 'ACTIVE',
        role: r.role ?? null,
        joinedAt: new Date(),
      }));

    let created = 0;
    if (data.length > 0) {
      const result = await this.prisma.member.createMany({ data });
      created = result.count;
    }
    return { total: rows.length, created, skipped: rows.length - data.length };
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
    if (dto.baptismDate !== undefined)
      data.baptismDate = dto.baptismDate ? new Date(dto.baptismDate) : null;
    if (dto.address !== undefined) data.address = dto.address?.trim() || null;
    if (dto.city !== undefined) data.city = dto.city?.trim() || null;
    if (dto.rg !== undefined) data.rg = dto.rg?.trim() || null;
    if (dto.maritalStatus !== undefined)
      data.maritalStatus = dto.maritalStatus?.trim() || null;
    if (dto.profession !== undefined)
      data.profession = dto.profession?.trim() || null;
    if (dto.photo !== undefined) data.photo = dto.photo || null;
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

  // === Portal do membro: solicitações de acesso ===

  async portalPending(churchId: string) {
    return this.prisma.member.findMany({
      where: { churchId, portalStatus: 'PENDING' },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        createdAt: true,
      },
    });
  }

  async setPortalStatus(
    churchId: string,
    id: string,
    status: 'APPROVED' | 'REJECTED',
  ) {
    await this.findOne(churchId, id);
    await this.prisma.member.update({
      where: { id },
      data: { portalStatus: status },
    });
    return { success: true, status };
  }

  async card(churchId: string, id: string) {
    const member = await this.findOne(churchId, id);
    const church = await this.prisma.church.findUnique({
      where: { id: churchId },
      select: {
        id: true,
        name: true,
        logo: true,
        cardLogo: true,
        denomination: true,
        phone: true,
        address: true,
      },
    });

    return { member, church };
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

  // Aniversariantes do mês corrente (usa partes UTC para não deslocar a data).
  async birthdays(churchId: string) {
    const members = await this.prisma.member.findMany({
      where: { churchId, birthDate: { not: null } },
      select: { id: true, name: true, birthDate: true, status: true },
    });

    const currentMonth = new Date().getUTCMonth();

    return members
      .filter((m) => m.birthDate && m.birthDate.getUTCMonth() === currentMonth)
      .sort((a, b) => a.birthDate!.getUTCDate() - b.birthDate!.getUTCDate())
      .map((m) => ({
        id: m.id,
        name: m.name,
        birthDate: m.birthDate,
        status: m.status,
      }));
  }

  // Novos membros por mês nos últimos 6 meses (por joinedAt, ou createdAt).
  async growth(churchId: string) {
    const members = await this.prisma.member.findMany({
      where: { churchId },
      select: { joinedAt: true, createdAt: true },
    });

    const labels = [
      'jan', 'fev', 'mar', 'abr', 'mai', 'jun',
      'jul', 'ago', 'set', 'out', 'nov', 'dez',
    ];
    const now = new Date();
    const buckets = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (5 - i), 1),
      );
      const month = d.getUTCMonth();
      return {
        key: `${d.getUTCFullYear()}-${String(month + 1).padStart(2, '0')}`,
        label: labels[month],
        count: 0,
      };
    });
    const indexByKey = new Map(buckets.map((b, i) => [b.key, i]));

    for (const m of members) {
      const ref = m.joinedAt ?? m.createdAt;
      const key = `${ref.getUTCFullYear()}-${String(
        ref.getUTCMonth() + 1,
      ).padStart(2, '0')}`;
      const idx = indexByKey.get(key);
      if (idx !== undefined) buckets[idx].count += 1;
    }

    return buckets;
  }
}
