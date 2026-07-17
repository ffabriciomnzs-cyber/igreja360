import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMemberDto } from './dto/create-member.dto';
import { UpdateMemberDto } from './dto/update-member.dto';
import { QueryMembersDto } from './dto/query-members.dto';

const memberInclude = {
  cell: { select: { id: true, name: true } },
} satisfies Prisma.MemberInclude;

// Chave de comparação de telefone: só dígitos, sem o código do país (55).
function phoneKey(v?: string | null): string {
  let d = (v ?? '').replace(/\D/g, '');
  if (d.length > 11 && d.startsWith('55')) d = d.slice(2);
  return d;
}

// Ranking de status para escolher o "mais ativo" ao mesclar.
const STATUS_RANK: Record<string, number> = {
  ACTIVE: 5,
  VISITOR: 4,
  INACTIVE: 3,
  TRANSFERRED: 2,
  DECEASED: 1,
};

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
        gender: dto.gender ?? null,
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
    if (dto.gender !== undefined) data.gender = dto.gender ?? null;
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

  // Detecta grupos de cadastros que parecem a MESMA pessoa (mesmo telefone
  // normalizado OU mesmo e-mail). Usa union-find para juntar grupos que se
  // conectam por telefone e/ou e-mail.
  async duplicates(churchId: string) {
    const members = await this.prisma.member.findMany({
      where: { churchId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        gender: true,
        status: true,
        role: true,
        portalStatus: true,
        photo: true,
        city: true,
        createdAt: true,
        joinedAt: true,
        cell: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'asc' },
    });

    const parent = new Map<string, string>();
    const find = (x: string): string => {
      let r = x;
      while (parent.get(r) !== r) r = parent.get(r) as string;
      let c = x;
      while (parent.get(c) !== r) {
        const n = parent.get(c) as string;
        parent.set(c, r);
        c = n;
      }
      return r;
    };
    const union = (a: string, b: string): void => {
      parent.set(find(a), find(b));
    };
    members.forEach((m) => parent.set(m.id, m.id));

    const byPhone = new Map<string, string>();
    const byEmail = new Map<string, string>();
    for (const m of members) {
      const pk = phoneKey(m.phone);
      if (pk) {
        if (byPhone.has(pk)) union(m.id, byPhone.get(pk) as string);
        else byPhone.set(pk, m.id);
      }
      const ek = (m.email ?? '').toLowerCase().trim();
      if (ek) {
        if (byEmail.has(ek)) union(m.id, byEmail.get(ek) as string);
        else byEmail.set(ek, m.id);
      }
    }

    const groups = new Map<string, typeof members>();
    for (const m of members) {
      const root = find(m.id);
      const arr = groups.get(root) ?? [];
      arr.push(m);
      groups.set(root, arr);
    }

    return [...groups.values()]
      .filter((g) => g.length > 1)
      .map((g) => ({
        // sugere manter o mais antigo (cadastro original da igreja)
        suggestedKeepId: g[0].id,
        members: g,
      }));
  }

  // Mescla o cadastro `dropId` no `keepId`: preenche campos faltantes, reatribui
  // toda a atividade (orações, cultos, devocional) e apaga o duplicado.
  async merge(churchId: string, keepId: string, dropId: string) {
    if (keepId === dropId) {
      throw new BadRequestException('Selecione dois cadastros diferentes.');
    }
    const keep = await this.prisma.member.findFirst({
      where: { id: keepId, churchId },
    });
    const drop = await this.prisma.member.findFirst({
      where: { id: dropId, churchId },
    });
    if (!keep || !drop) {
      throw new NotFoundException('Cadastro não encontrado.');
    }

    const data: Prisma.MemberUpdateInput = {};
    const inherit: (keyof typeof keep)[] = [
      'email',
      'phone',
      'cpf',
      'gender',
      'birthDate',
      'baptismDate',
      'address',
      'city',
      'rg',
      'maritalStatus',
      'profession',
      'photo',
      'role',
      'passwordHash',
      'joinedAt',
    ];
    for (const f of inherit) {
      if (keep[f] == null && drop[f] != null) {
        (data as Record<string, unknown>)[f] = drop[f];
      }
    }
    if (!keep.cellId && drop.cellId) {
      data.cell = { connect: { id: drop.cellId } };
    }
    if (keep.portalStatus === 'NONE' && drop.portalStatus !== 'NONE') {
      data.portalStatus = drop.portalStatus;
    }
    if ((STATUS_RANK[drop.status] ?? 0) > (STATUS_RANK[keep.status] ?? 0)) {
      data.status = drop.status;
    }

    await this.prisma.$transaction(async (tx) => {
      // Tabelas sem restrição única: reatribui direto.
      await tx.prayer.updateMany({
        where: { memberId: dropId },
        data: { memberId: keepId },
      });
      await tx.worshipParticipant.updateMany({
        where: { memberId: dropId },
        data: { memberId: keepId },
      });

      // Tabelas de devocional únicas por dia: move o que o keeper não tem e
      // apaga o resto do drop (evita violar @@unique([memberId, day])).
      const dpDays = (
        await tx.devotionalPrayer.findMany({
          where: { memberId: keepId },
          select: { day: true },
        })
      ).map((r) => r.day);
      await tx.devotionalPrayer.updateMany({
        where: { memberId: dropId, day: { notIn: dpDays } },
        data: { memberId: keepId },
      });
      await tx.devotionalPrayer.deleteMany({ where: { memberId: dropId } });

      const dcDays = (
        await tx.devotionalCompletion.findMany({
          where: { memberId: keepId },
          select: { day: true },
        })
      ).map((r) => r.day);
      await tx.devotionalCompletion.updateMany({
        where: { memberId: dropId, day: { notIn: dcDays } },
        data: { memberId: keepId },
      });
      await tx.devotionalCompletion.deleteMany({ where: { memberId: dropId } });

      const dnDays = (
        await tx.devotionalNote.findMany({
          where: { memberId: keepId },
          select: { day: true },
        })
      ).map((r) => r.day);
      await tx.devotionalNote.updateMany({
        where: { memberId: dropId, day: { notIn: dnDays } },
        data: { memberId: keepId },
      });
      await tx.devotionalNote.deleteMany({ where: { memberId: dropId } });

      const drDays = (
        await tx.devotionalReaction.findMany({
          where: { memberId: keepId },
          select: { day: true },
        })
      ).map((r) => r.day);
      await tx.devotionalReaction.updateMany({
        where: { memberId: dropId, day: { notIn: drDays } },
        data: { memberId: keepId },
      });
      await tx.devotionalReaction.deleteMany({ where: { memberId: dropId } });

      // Plan progress: único por (memberId, planId, dayNumber).
      const keepProg = await tx.devotionalPlanProgress.findMany({
        where: { memberId: keepId },
        select: { planId: true, dayNumber: true },
      });
      const seen = new Set(keepProg.map((p) => `${p.planId}|${p.dayNumber}`));
      const dropProg = await tx.devotionalPlanProgress.findMany({
        where: { memberId: dropId },
        select: { id: true, planId: true, dayNumber: true },
      });
      const moveIds = dropProg
        .filter((p) => !seen.has(`${p.planId}|${p.dayNumber}`))
        .map((p) => p.id);
      if (moveIds.length) {
        await tx.devotionalPlanProgress.updateMany({
          where: { id: { in: moveIds } },
          data: { memberId: keepId },
        });
      }
      await tx.devotionalPlanProgress.deleteMany({
        where: { memberId: dropId },
      });

      await tx.member.update({ where: { id: keepId }, data });
      await tx.member.delete({ where: { id: dropId } });
    });

    return this.findOne(churchId, keepId);
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
