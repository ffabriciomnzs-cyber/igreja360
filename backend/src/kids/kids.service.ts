import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomInt } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Ministério infantil com check-in seguro.
 *
 * A regra que rege tudo aqui: **ninguém retira uma criança sem o código**
 * gerado na entrega. Não é controle de presença — é segurança. Por isso:
 *
 * - o código é sorteado com gerador criptográfico (não com Math.random);
 * - a conferência é feita no servidor, nunca na tela;
 * - código errado é recusado sem dizer qual seria o certo;
 * - fica registrado quem entregou e quem retirou, com horário.
 *
 * `restrictions` (guarda judicial, quem NÃO pode buscar) aparece em destaque
 * para a equipe no momento da retirada.
 */

function hojeBrt(): string {
  return new Date(Date.now() - 3 * 3600_000).toISOString().slice(0, 10);
}

/** Código de 4 dígitos, sorteado de forma segura. */
function geraCodigo(): string {
  return String(randomInt(0, 10_000)).padStart(4, '0');
}

@Injectable()
export class KidsService {
  constructor(private readonly prisma: PrismaService) {}

  // ---------- Cadastro ----------

  async listChildren(churchId: string, search?: string) {
    const termo = search?.trim();
    return this.prisma.child.findMany({
      where: {
        churchId,
        active: true,
        ...(termo ? { name: { contains: termo, mode: 'insensitive' } } : {}),
      },
      orderBy: { name: 'asc' },
      take: 100,
      include: { guardians: true },
    });
  }

  async createChild(
    churchId: string,
    dto: {
      name: string;
      birthDate?: string;
      notes?: string;
      restrictions?: string;
      guardians?: { name: string; phone?: string; relation?: string }[];
    },
  ) {
    const nome = dto.name?.trim() ?? '';
    if (nome.length < 2) throw new BadRequestException('Informe o nome da criança.');

    const responsaveis = (dto.guardians ?? []).filter((g) => g.name?.trim());
    if (!responsaveis.length) {
      throw new BadRequestException(
        'Cadastre pelo menos um responsável — é quem poderá retirar a criança.',
      );
    }

    await this.prisma.child.create({
      data: {
        churchId,
        name: nome,
        birthDate: dto.birthDate ? new Date(dto.birthDate) : null,
        notes: dto.notes?.trim() || null,
        restrictions: dto.restrictions?.trim() || null,
        guardians: {
          create: responsaveis.map((g) => ({
            churchId,
            name: g.name.trim(),
            phone: g.phone?.trim() || null,
            relation: g.relation?.trim() || null,
          })),
        },
      },
    });
    return this.listChildren(churchId);
  }

  async removeChild(churchId: string, childId: string) {
    const crianca = await this.prisma.child.findFirst({
      where: { id: childId, churchId },
      select: { id: true },
    });
    if (!crianca) throw new NotFoundException('Criança não encontrada.');
    // Desativa em vez de apagar: o histórico de entrada e saída é registro
    // de segurança e não deve sumir.
    await this.prisma.child.update({
      where: { id: childId },
      data: { active: false },
    });
    return this.listChildren(churchId);
  }

  // ---------- Entrega ----------

  /** Entrega a criança e devolve o código de retirada. */
  async checkIn(
    churchId: string,
    userId: string,
    dto: { childId: string; checkedInBy: string; room?: string },
  ) {
    const crianca = await this.prisma.child.findFirst({
      where: { id: dto.childId, churchId, active: true },
      select: { id: true, name: true },
    });
    if (!crianca) throw new NotFoundException('Criança não encontrada.');

    const quemEntregou = dto.checkedInBy?.trim() ?? '';
    if (quemEntregou.length < 2) {
      throw new BadRequestException('Informe quem está entregando a criança.');
    }

    const dia = hojeBrt();
    const jaDentro = await this.prisma.kidsCheckin.findFirst({
      where: { churchId, childId: dto.childId, day: dia, checkedOutAt: null },
      select: { id: true },
    });
    if (jaDentro) {
      throw new BadRequestException('Esta criança já está na sala hoje.');
    }

    // Código único entre as crianças que estão DENTRO agora: a equipe digita
    // 4 dígitos, e dois códigos iguais na sala tornariam a conferência
    // ambígua justamente na hora da entrega.
    const emUso = new Set(
      (
        await this.prisma.kidsCheckin.findMany({
          where: { churchId, day: dia, checkedOutAt: null },
          select: { code: true },
        })
      ).map((c) => c.code),
    );
    let codigo = geraCodigo();
    for (let i = 0; i < 50 && emUso.has(codigo); i++) codigo = geraCodigo();
    if (emUso.has(codigo)) {
      throw new BadRequestException(
        'Muitas crianças na sala. Faça algumas retiradas antes de continuar.',
      );
    }

    const registro = await this.prisma.kidsCheckin.create({
      data: {
        churchId,
        childId: dto.childId,
        day: dia,
        code: codigo,
        room: dto.room?.trim() || null,
        checkedInBy: quemEntregou,
        checkedInByUserId: userId,
      },
    });

    return {
      id: registro.id,
      childName: crianca.name,
      code: registro.code,
      room: registro.room,
    };
  }

  // ---------- Retirada ----------

  /**
   * Retira a criança. O código é conferido AQUI, no servidor.
   * Código errado é recusado sem pista nenhuma sobre o correto.
   */
  async checkOut(
    churchId: string,
    userId: string,
    dto: { code: string; checkedOutBy: string },
  ) {
    const codigo = (dto.code ?? '').trim();
    const quemRetirou = (dto.checkedOutBy ?? '').trim();
    if (!codigo) throw new BadRequestException('Informe o código de retirada.');
    if (quemRetirou.length < 2) {
      throw new BadRequestException('Informe quem está retirando a criança.');
    }

    const registro = await this.prisma.kidsCheckin.findFirst({
      where: { churchId, day: hojeBrt(), code: codigo, checkedOutAt: null },
      include: { child: { include: { guardians: true } } },
    });
    if (!registro) {
      throw new BadRequestException(
        'Código não confere. Chame um responsável do Kids.',
      );
    }

    await this.prisma.kidsCheckin.update({
      where: { id: registro.id },
      data: {
        checkedOutAt: new Date(),
        checkedOutBy: quemRetirou,
        checkedOutByUserId: userId,
      },
    });

    return {
      childName: registro.child.name,
      restrictions: registro.child.restrictions,
      guardians: registro.child.guardians.map((g) => ({
        name: g.name,
        relation: g.relation,
        canPickup: g.canPickup,
      })),
    };
  }

  /** Quem está na sala agora e quem já saiu hoje. */
  async today(churchId: string) {
    const registros = await this.prisma.kidsCheckin.findMany({
      where: { churchId, day: hojeBrt() },
      orderBy: { checkedInAt: 'desc' },
      include: { child: { include: { guardians: true } } },
    });

    const mapa = (r: (typeof registros)[number]) => ({
      id: r.id,
      childId: r.childId,
      childName: r.child.name,
      notes: r.child.notes,
      restrictions: r.child.restrictions,
      code: r.code,
      room: r.room,
      checkedInBy: r.checkedInBy,
      checkedInAt: r.checkedInAt,
      checkedOutBy: r.checkedOutBy,
      checkedOutAt: r.checkedOutAt,
      guardians: r.child.guardians.map((g) => ({
        name: g.name,
        relation: g.relation,
        phone: g.phone,
      })),
    });

    return {
      day: hojeBrt(),
      inside: registros.filter((r) => !r.checkedOutAt).map(mapa),
      left: registros.filter((r) => r.checkedOutAt).map(mapa),
    };
  }
}
