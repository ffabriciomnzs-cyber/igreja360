import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, TransactionType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePayableDto, PayInstallmentDto } from './dto/payable.dto';

/**
 * Contas parceladas.
 *
 * REGRA CENTRAL: cadastrar uma conta NÃO mexe no saldo. Cada parcela só vira
 * despesa (Transaction) no dia em que é paga — regime de caixa, que é como a
 * igreja enxerga o dinheiro. Isso evita contar a compra duas vezes e mantém
 * corretos os relatórios que já existem.
 */

/** Meia-noite em Brasília (UTC-3) do dia informado, guardada em UTC. */
function diaBR(iso: string): Date {
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d, 3, 0, 0));
}

/**
 * Vencimento da parcela N a partir do primeiro. Mantém o dia do mês e, quando
 * o mês não tem esse dia (dia 31 em fevereiro), cai no último dia do mês —
 * nunca "pula" para o mês seguinte.
 */
function vencimento(primeiro: Date, avancoEmMeses: number): Date {
  const ano = primeiro.getUTCFullYear();
  const mes = primeiro.getUTCMonth() + avancoEmMeses;
  const dia = primeiro.getUTCDate();
  const ultimoDiaDoMes = new Date(Date.UTC(ano, mes + 1, 0)).getUTCDate();
  return new Date(Date.UTC(ano, mes, Math.min(dia, ultimoDiaDoMes), 3, 0, 0));
}

function hojeBR(): Date {
  const br = new Date(Date.now() - 3 * 60 * 60 * 1000);
  return new Date(
    Date.UTC(br.getUTCFullYear(), br.getUTCMonth(), br.getUTCDate(), 3, 0, 0),
  );
}

@Injectable()
export class PayablesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(churchId: string, userId: string, dto: CreatePayableDto) {
    const primeiro = diaBR(dto.firstDueDate);
    if (Number.isNaN(primeiro.getTime())) {
      throw new BadRequestException('Data do primeiro vencimento inválida.');
    }

    const payable = await this.prisma.payable.create({
      data: {
        churchId,
        description: dto.description.trim(),
        creditor: dto.creditor?.trim() || null,
        category: dto.category.trim(),
        installments: dto.installments,
        note: dto.note?.trim() || null,
        createdBy: userId,
        items: {
          create: Array.from({ length: dto.installments }, (_, i) => ({
            churchId,
            number: i + 1,
            dueDate: vencimento(primeiro, i),
            amount: new Prisma.Decimal(dto.amount),
          })),
        },
      },
      include: { items: { orderBy: { number: 'asc' } } },
    });
    return this.formata(payable);
  }

  async findAll(churchId: string) {
    const rows = await this.prisma.payable.findMany({
      where: { churchId },
      orderBy: { createdAt: 'desc' },
      include: { items: { orderBy: { number: 'asc' } } },
    });
    return rows.map((p) => this.formata(p));
  }

  async findOne(churchId: string, id: string) {
    const payable = await this.prisma.payable.findFirst({
      where: { id, churchId },
      include: { items: { orderBy: { number: 'asc' } } },
    });
    if (!payable) throw new NotFoundException('Conta não encontrada.');
    return this.formata(payable);
  }

  /** Totais do topo da aba: quanto falta, quanto vence no mês, atrasadas. */
  async stats(churchId: string) {
    const hoje = hojeBR();
    const fimDoMes = new Date(
      Date.UTC(hoje.getUTCFullYear(), hoje.getUTCMonth() + 1, 1, 3, 0, 0) - 1,
    );

    const [aberto, doMes, atrasadas] = await this.prisma.$transaction([
      this.prisma.payableInstallment.aggregate({
        where: { churchId, paidAt: null },
        _sum: { amount: true },
        _count: true,
      }),
      this.prisma.payableInstallment.aggregate({
        where: { churchId, paidAt: null, dueDate: { lte: fimDoMes } },
        _sum: { amount: true },
        _count: true,
      }),
      this.prisma.payableInstallment.aggregate({
        where: { churchId, paidAt: null, dueDate: { lt: hoje } },
        _sum: { amount: true },
        _count: true,
      }),
    ]);

    return {
      openAmount: Number(aberto._sum.amount ?? 0),
      openCount: aberto._count,
      monthAmount: Number(doMes._sum.amount ?? 0),
      monthCount: doMes._count,
      overdueAmount: Number(atrasadas._sum.amount ?? 0),
      overdueCount: atrasadas._count,
    };
  }

  /**
   * Paga uma parcela: cria a despesa no caixa e amarra as duas pontas.
   * Só aqui o saldo da igreja muda.
   */
  async pay(
    churchId: string,
    installmentId: string,
    dto: PayInstallmentDto,
    userId: string,
  ) {
    const parcela = await this.prisma.payableInstallment.findFirst({
      where: { id: installmentId, churchId },
      include: { payable: true },
    });
    if (!parcela) throw new NotFoundException('Parcela não encontrada.');
    if (parcela.paidAt) {
      throw new BadRequestException('Esta parcela já está paga.');
    }

    const valor = new Prisma.Decimal(dto.amount ?? Number(parcela.amount));
    const data = dto.date ? diaBR(dto.date) : hojeBR();

    // Transação de banco: ou grava a despesa E marca a parcela, ou nada.
    // Sem isso, uma falha no meio deixaria dinheiro "pago" sem lançamento.
    await this.prisma.$transaction(async (tx) => {
      const despesa = await tx.transaction.create({
        data: {
          churchId,
          type: TransactionType.EXPENSE,
          category: parcela.payable.category,
          description: `${parcela.payable.description} — parcela ${parcela.number}/${parcela.payable.installments}`,
          amount: valor,
          date: data,
          createdBy: userId,
        },
      });
      await tx.payableInstallment.update({
        where: { id: parcela.id },
        data: {
          paidAt: data,
          paidAmount: valor,
          transactionId: despesa.id,
        },
      });
    });

    return this.findOne(churchId, parcela.payableId);
  }

  /** Desfaz o pagamento: apaga a despesa gerada e reabre a parcela. */
  async unpay(churchId: string, installmentId: string) {
    const parcela = await this.prisma.payableInstallment.findFirst({
      where: { id: installmentId, churchId },
    });
    if (!parcela) throw new NotFoundException('Parcela não encontrada.');
    if (!parcela.paidAt) {
      throw new BadRequestException('Esta parcela não está paga.');
    }

    await this.prisma.$transaction(async (tx) => {
      if (parcela.transactionId) {
        // deleteMany (e não delete) para não estourar se o lançamento já
        // tiver sido apagado à mão no extrato.
        await tx.transaction.deleteMany({
          where: { id: parcela.transactionId, churchId },
        });
      }
      await tx.payableInstallment.update({
        where: { id: parcela.id },
        data: { paidAt: null, paidAmount: null, transactionId: null },
      });
    });

    return this.findOne(churchId, parcela.payableId);
  }

  /**
   * Apaga a conta inteira. Se já houver parcela paga, recusa: apagar
   * silenciosamente sumiria com despesas reais do caixa.
   */
  async remove(churchId: string, id: string) {
    const payable = await this.prisma.payable.findFirst({
      where: { id, churchId },
      include: { items: true },
    });
    if (!payable) throw new NotFoundException('Conta não encontrada.');
    const pagas = payable.items.filter((i) => i.paidAt).length;
    if (pagas > 0) {
      throw new BadRequestException(
        `Esta conta já tem ${pagas} parcela(s) paga(s). Desfaça os pagamentos antes de excluir, para não sumir com despesas já lançadas.`,
      );
    }
    await this.prisma.payable.delete({ where: { id } });
    return { success: true };
  }

  private formata(
    payable: Prisma.PayableGetPayload<{ include: { items: true } }>,
  ) {
    const hoje = hojeBR();
    const items = [...payable.items].sort((a, b) => a.number - b.number);
    const pagas = items.filter((i) => i.paidAt);
    const abertas = items.filter((i) => !i.paidAt);
    const atrasadas = abertas.filter((i) => i.dueDate < hoje);
    const proxima = abertas[0] ?? null;

    return {
      id: payable.id,
      description: payable.description,
      creditor: payable.creditor,
      category: payable.category,
      installments: payable.installments,
      note: payable.note,
      createdAt: payable.createdAt,
      installmentAmount: Number(items[0]?.amount ?? 0),
      totalAmount: items.reduce((s, i) => s + Number(i.amount), 0),
      paidAmount: pagas.reduce(
        (s, i) => s + Number(i.paidAmount ?? i.amount),
        0,
      ),
      openAmount: abertas.reduce((s, i) => s + Number(i.amount), 0),
      paidCount: pagas.length,
      overdueCount: atrasadas.length,
      finished: abertas.length === 0,
      nextDueDate: proxima?.dueDate ?? null,
      items: items.map((i) => ({
        id: i.id,
        number: i.number,
        dueDate: i.dueDate,
        amount: Number(i.amount),
        paidAt: i.paidAt,
        paidAmount: i.paidAmount ? Number(i.paidAmount) : null,
        overdue: !i.paidAt && i.dueDate < hoje,
      })),
    };
  }
}
