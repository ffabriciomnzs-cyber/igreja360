import { Injectable } from '@nestjs/common';
import { TransactionType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

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
}
