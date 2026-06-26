import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, TransactionType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { QueryTransactionsDto } from './dto/query-transactions.dto';

@Injectable()
export class FinancialService {
  constructor(private readonly prisma: PrismaService) {}

  private buildWhere(
    churchId: string,
    query: Pick<QueryTransactionsDto, 'search' | 'type' | 'category' | 'from' | 'to'>,
  ): Prisma.TransactionWhereInput {
    const where: Prisma.TransactionWhereInput = { churchId };
    if (query.type) where.type = query.type;
    if (query.category) where.category = query.category;
    if (query.from || query.to) {
      where.date = {};
      if (query.from) where.date.gte = new Date(query.from);
      if (query.to) where.date.lte = new Date(query.to);
    }
    if (query.search) {
      const term = query.search.trim();
      where.OR = [
        { category: { contains: term, mode: 'insensitive' } },
        { description: { contains: term, mode: 'insensitive' } },
      ];
    }
    return where;
  }

  async findAll(churchId: string, query: QueryTransactionsDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;
    const where = this.buildWhere(churchId, query);

    const [data, total, income, expense] = await this.prisma.$transaction([
      this.prisma.transaction.findMany({
        where,
        orderBy: { date: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.transaction.count({ where }),
      this.prisma.transaction.aggregate({
        where: { ...where, type: TransactionType.INCOME },
        _sum: { amount: true },
      }),
      this.prisma.transaction.aggregate({
        where: { ...where, type: TransactionType.EXPENSE },
        _sum: { amount: true },
      }),
    ]);

    const totalIncome = Number(income._sum.amount ?? 0);
    const totalExpense = Number(expense._sum.amount ?? 0);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
      summary: {
        income: totalIncome,
        expense: totalExpense,
        balance: totalIncome - totalExpense,
      },
    };
  }

  async findOne(churchId: string, id: string) {
    const transaction = await this.prisma.transaction.findFirst({
      where: { id, churchId },
    });
    if (!transaction) {
      throw new NotFoundException('Lançamento não encontrado.');
    }
    return transaction;
  }

  async create(churchId: string, dto: CreateTransactionDto) {
    return this.prisma.transaction.create({
      data: {
        churchId,
        type: dto.type,
        category: dto.category.trim(),
        description: dto.description?.trim() || null,
        amount: new Prisma.Decimal(dto.amount),
        date: new Date(dto.date),
      },
    });
  }

  async update(churchId: string, id: string, dto: UpdateTransactionDto) {
    await this.findOne(churchId, id);
    const data: Prisma.TransactionUpdateInput = {};
    if (dto.type !== undefined) data.type = dto.type;
    if (dto.category !== undefined) data.category = dto.category.trim();
    if (dto.description !== undefined)
      data.description = dto.description?.trim() || null;
    if (dto.amount !== undefined) data.amount = new Prisma.Decimal(dto.amount);
    if (dto.date !== undefined) data.date = new Date(dto.date);

    return this.prisma.transaction.update({ where: { id }, data });
  }

  async remove(churchId: string, id: string) {
    await this.findOne(churchId, id);
    await this.prisma.transaction.delete({ where: { id } });
    return { success: true };
  }

  async stats(churchId: string) {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const [income, expense, monthIncome, monthExpense] =
      await this.prisma.$transaction([
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
      ]);

    const totalIncome = Number(income._sum.amount ?? 0);
    const totalExpense = Number(expense._sum.amount ?? 0);
    const mIncome = Number(monthIncome._sum.amount ?? 0);
    const mExpense = Number(monthExpense._sum.amount ?? 0);

    return {
      income: totalIncome,
      expense: totalExpense,
      balance: totalIncome - totalExpense,
      monthIncome: mIncome,
      monthExpense: mExpense,
      monthBalance: mIncome - mExpense,
    };
  }
}
