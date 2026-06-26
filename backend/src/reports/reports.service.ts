import { Injectable } from '@nestjs/common';
import {
  MemberRole,
  MemberStatus,
  Prisma,
  TransactionType,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

const MONTH_LABELS = [
  'jan', 'fev', 'mar', 'abr', 'mai', 'jun',
  'jul', 'ago', 'set', 'out', 'nov', 'dez',
];

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  // Intervalo de datas inclusivo (fim do dia em "to").
  private range(from?: string, to?: string): Prisma.DateTimeFilter | undefined {
    const filter: Prisma.DateTimeFilter = {};
    if (from) filter.gte = new Date(from);
    if (to) {
      const end = new Date(to);
      end.setHours(23, 59, 59, 999);
      filter.lte = end;
    }
    return Object.keys(filter).length ? filter : undefined;
  }

  async overview(churchId: string) {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
      23,
      59,
      59,
    );

    const [
      totalMembers,
      activeMembers,
      visitors,
      totalCells,
      activeCells,
      membersInCells,
      income,
      expense,
      monthIncome,
      monthExpense,
      upcomingEvents,
      activeCampaigns,
      activePrayers,
      answeredPrayers,
      byCategory,
    ] = await this.prisma.$transaction([
      this.prisma.member.count({ where: { churchId } }),
      this.prisma.member.count({ where: { churchId, status: 'ACTIVE' } }),
      this.prisma.member.count({ where: { churchId, status: 'VISITOR' } }),
      this.prisma.cell.count({ where: { churchId } }),
      this.prisma.cell.count({ where: { churchId, active: true } }),
      this.prisma.member.count({ where: { churchId, cellId: { not: null } } }),
      this.prisma.transaction.aggregate({
        where: { churchId, type: TransactionType.INCOME },
        _sum: { amount: true },
      }),
      this.prisma.transaction.aggregate({
        where: { churchId, type: TransactionType.EXPENSE },
        _sum: { amount: true },
      }),
      this.prisma.transaction.aggregate({
        where: {
          churchId,
          type: TransactionType.INCOME,
          date: { gte: monthStart, lte: monthEnd },
        },
        _sum: { amount: true },
      }),
      this.prisma.transaction.aggregate({
        where: {
          churchId,
          type: TransactionType.EXPENSE,
          date: { gte: monthStart, lte: monthEnd },
        },
        _sum: { amount: true },
      }),
      this.prisma.event.count({ where: { churchId, date: { gte: now } } }),
      this.prisma.campaign.count({ where: { churchId, status: 'ACTIVE' } }),
      this.prisma.prayer.count({ where: { churchId, status: 'ACTIVE' } }),
      this.prisma.prayer.count({ where: { churchId, status: 'ANSWERED' } }),
      this.prisma.transaction.groupBy({
        by: ['category', 'type'],
        where: { churchId },
        _sum: { amount: true },
        orderBy: { category: 'asc' },
      }),
    ]);

    const totalIncome = Number(income._sum.amount ?? 0);
    const totalExpense = Number(expense._sum.amount ?? 0);
    const mIncome = Number(monthIncome._sum.amount ?? 0);
    const mExpense = Number(monthExpense._sum.amount ?? 0);

    const categories = byCategory
      .map((c) => ({
        category: c.category,
        type: c.type,
        amount: Number(c._sum?.amount ?? 0),
      }))
      .sort((a, b) => b.amount - a.amount);

    return {
      members: {
        total: totalMembers,
        active: activeMembers,
        visitors,
        inactive: totalMembers - activeMembers - visitors,
      },
      cells: { total: totalCells, active: activeCells, membersInCells },
      financial: {
        income: totalIncome,
        expense: totalExpense,
        balance: totalIncome - totalExpense,
        monthIncome: mIncome,
        monthExpense: mExpense,
        monthBalance: mIncome - mExpense,
      },
      events: { upcoming: upcomingEvents },
      campaigns: { active: activeCampaigns },
      prayers: { active: activePrayers, answered: answeredPrayers },
      categories,
    };
  }

  // === PESSOAS ===

  async members(
    churchId: string,
    status?: string,
    cellId?: string,
    role?: string,
  ) {
    const where: Prisma.MemberWhereInput = { churchId };
    if (status) where.status = status as MemberStatus;
    if (role) where.role = role as MemberRole;
    if (cellId) where.cellId = cellId === 'none' ? null : cellId;

    const members = await this.prisma.member.findMany({
      where,
      include: { cell: { select: { name: true } } },
      orderBy: { name: 'asc' },
    });

    return members.map((m) => ({
      id: m.id,
      name: m.name,
      email: m.email,
      phone: m.phone,
      city: m.city,
      status: m.status,
      role: m.role,
      cell: m.cell?.name ?? null,
      joinedAt: m.joinedAt,
      birthDate: m.birthDate,
      baptismDate: m.baptismDate,
    }));
  }

  // Aniversariantes (nascimento ou batismo) de um mês (1-12; padrão: atual).
  async birthdays(churchId: string, type = 'birth', month?: number) {
    const isBaptism = type === 'baptism';
    const field = isBaptism ? 'baptismDate' : 'birthDate';
    const members = await this.prisma.member.findMany({
      where: { churchId, [field]: { not: null } },
      select: {
        id: true,
        name: true,
        phone: true,
        birthDate: true,
        baptismDate: true,
      },
    });

    const target =
      month && month >= 1 && month <= 12
        ? month - 1
        : new Date().getUTCMonth();

    return members
      .map((m) => ({
        id: m.id,
        name: m.name,
        phone: m.phone,
        date: isBaptism ? m.baptismDate : m.birthDate,
      }))
      .filter((m) => m.date && m.date.getUTCMonth() === target)
      .sort((a, b) => a.date!.getUTCDate() - b.date!.getUTCDate());
  }

  async newMembers(churchId: string, from?: string, to?: string) {
    const members = await this.prisma.member.findMany({
      where: { churchId },
      include: { cell: { select: { name: true } } },
    });

    const fromDate = from ? new Date(from) : null;
    const toDate = to ? new Date(`${to}T23:59:59.999`) : null;

    const filtered = members
      .map((m) => ({
        id: m.id,
        name: m.name,
        status: m.status,
        cell: m.cell?.name ?? null,
        ref: m.joinedAt ?? m.createdAt,
      }))
      .filter(
        (m) =>
          (!fromDate || m.ref >= fromDate) && (!toDate || m.ref <= toDate),
      )
      .sort((a, b) => b.ref.getTime() - a.ref.getTime());

    const monthly = new Map<string, number>();
    for (const m of filtered) {
      const key = `${m.ref.getUTCFullYear()}-${String(
        m.ref.getUTCMonth() + 1,
      ).padStart(2, '0')}`;
      monthly.set(key, (monthly.get(key) ?? 0) + 1);
    }

    return {
      total: filtered.length,
      monthly: Array.from(monthly.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, count]) => ({
          key,
          label: `${MONTH_LABELS[Number(key.slice(5)) - 1]}/${key.slice(2, 4)}`,
          count,
        })),
      members: filtered.map((m) => ({
        id: m.id,
        name: m.name,
        status: m.status,
        cell: m.cell,
        joinedAt: m.ref,
      })),
    };
  }

  async membersByCell(churchId: string) {
    const [cells, withoutCell] = await this.prisma.$transaction([
      this.prisma.cell.findMany({
        where: { churchId },
        select: {
          id: true,
          name: true,
          active: true,
          _count: { select: { members: true } },
        },
        orderBy: { name: 'asc' },
      }),
      this.prisma.member.count({ where: { churchId, cellId: null } }),
    ]);

    return {
      cells: cells.map((c) => ({
        id: c.id,
        name: c.name,
        active: c.active,
        count: c._count.members,
      })),
      withoutCell,
    };
  }

  async inactiveMembers(churchId: string) {
    const members = await this.prisma.member.findMany({
      where: { churchId, status: MemberStatus.INACTIVE },
      include: { cell: { select: { name: true } } },
      orderBy: { name: 'asc' },
    });
    return members.map((m) => ({
      id: m.id,
      name: m.name,
      phone: m.phone,
      city: m.city,
      cell: m.cell?.name ?? null,
      joinedAt: m.joinedAt,
    }));
  }

  async membersByCity(churchId: string) {
    const grouped = await this.prisma.member.groupBy({
      by: ['city'],
      where: { churchId },
      _count: { _all: true },
    });
    return grouped
      .map((g) => ({
        city: g.city ?? 'Não informado',
        count: g._count._all,
      }))
      .sort((a, b) => b.count - a.count);
  }

  // === FINANCEIRO ===

  async financial(churchId: string, from?: string, to?: string) {
    const dateRange = this.range(from, to);
    const where: Prisma.TransactionWhereInput = { churchId };
    if (dateRange) where.date = dateRange;

    const [transactions, income, expense, byCategory] =
      await this.prisma.$transaction([
        this.prisma.transaction.findMany({
          where,
          orderBy: { date: 'desc' },
        }),
        this.prisma.transaction.aggregate({
          where: { ...where, type: TransactionType.INCOME },
          _sum: { amount: true },
        }),
        this.prisma.transaction.aggregate({
          where: { ...where, type: TransactionType.EXPENSE },
          _sum: { amount: true },
        }),
        this.prisma.transaction.groupBy({
          by: ['category', 'type'],
          where,
          _sum: { amount: true },
          orderBy: { category: 'asc' },
        }),
      ]);

    const totalIncome = Number(income._sum.amount ?? 0);
    const totalExpense = Number(expense._sum.amount ?? 0);

    return {
      summary: {
        income: totalIncome,
        expense: totalExpense,
        balance: totalIncome - totalExpense,
      },
      byCategory: byCategory
        .map((c) => ({
          category: c.category,
          type: c.type,
          amount: Number(c._sum?.amount ?? 0),
        }))
        .sort((a, b) => b.amount - a.amount),
      transactions: transactions.map((t) => ({
        id: t.id,
        date: t.date,
        type: t.type,
        category: t.category,
        description: t.description,
        amount: Number(t.amount),
      })),
    };
  }

  async cashflow(churchId: string, months = 12) {
    const span = Math.min(Math.max(months, 1), 24);
    const now = new Date();
    const start = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (span - 1), 1),
    );

    const transactions = await this.prisma.transaction.findMany({
      where: { churchId, date: { gte: start } },
      select: { date: true, type: true, amount: true },
    });

    const buckets = Array.from({ length: span }, (_, i) => {
      const d = new Date(
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (span - 1) + i, 1),
      );
      const month = d.getUTCMonth();
      return {
        key: `${d.getUTCFullYear()}-${String(month + 1).padStart(2, '0')}`,
        label: `${MONTH_LABELS[month]}/${String(d.getUTCFullYear()).slice(2)}`,
        income: 0,
        expense: 0,
        balance: 0,
      };
    });
    const indexByKey = new Map(buckets.map((b, i) => [b.key, i]));

    for (const t of transactions) {
      const key = `${t.date.getUTCFullYear()}-${String(
        t.date.getUTCMonth() + 1,
      ).padStart(2, '0')}`;
      const idx = indexByKey.get(key);
      if (idx === undefined) continue;
      const value = Number(t.amount);
      if (t.type === TransactionType.INCOME) buckets[idx].income += value;
      else buckets[idx].expense += value;
    }
    for (const b of buckets) b.balance = b.income - b.expense;

    return buckets;
  }

  // === CÉLULAS ===

  async cells(churchId: string) {
    const cells = await this.prisma.cell.findMany({
      where: { churchId },
      select: {
        id: true,
        name: true,
        active: true,
        dayOfWeek: true,
        time: true,
        neighborhood: true,
        _count: { select: { members: true, meetings: true } },
      },
      orderBy: { name: 'asc' },
    });
    return cells.map((c) => ({
      id: c.id,
      name: c.name,
      active: c.active,
      dayOfWeek: c.dayOfWeek,
      time: c.time,
      neighborhood: c.neighborhood,
      memberCount: c._count.members,
      meetingCount: c._count.meetings,
    }));
  }

  // === EVENTOS ===

  async events(churchId: string, from?: string, to?: string) {
    const dateRange = this.range(from, to);
    const where: Prisma.EventWhereInput = { churchId };
    if (dateRange) where.date = dateRange;

    const events = await this.prisma.event.findMany({
      where,
      orderBy: { date: 'desc' },
    });
    return events.map((e) => ({
      id: e.id,
      name: e.name,
      date: e.date,
      type: e.type,
      location: e.location,
      capacity: e.capacity,
    }));
  }

  // === CAMPANHAS ===

  async campaigns(churchId: string) {
    const campaigns = await this.prisma.campaign.findMany({
      where: { churchId },
      orderBy: { createdAt: 'desc' },
    });
    return campaigns.map((c) => {
      const goal = Number(c.goal ?? 0);
      const current = Number(c.current ?? 0);
      return {
        id: c.id,
        title: c.title,
        type: c.type,
        status: c.status,
        goal,
        current,
        progress: goal > 0 ? Math.round((current / goal) * 100) : 0,
        startDate: c.startDate,
        endDate: c.endDate,
      };
    });
  }

  // === ORAÇÃO ===

  async prayers(churchId: string, from?: string, to?: string) {
    const dateRange = this.range(from, to);
    const where: Prisma.PrayerWhereInput = { churchId };
    if (dateRange) where.createdAt = dateRange;

    const prayers = await this.prisma.prayer.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    const counts = { active: 0, answered: 0, archived: 0 };
    for (const p of prayers) {
      if (p.status === 'ACTIVE') counts.active += 1;
      else if (p.status === 'ANSWERED') counts.answered += 1;
      else counts.archived += 1;
    }

    return {
      counts,
      prayers: prayers.map((p) => ({
        id: p.id,
        title: p.title,
        status: p.status,
        createdAt: p.createdAt,
      })),
    };
  }
}
