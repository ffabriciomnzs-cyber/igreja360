import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { MemberStatus, VisitorStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { PushService } from '../push/push.service';
import { CreateVisitorDto } from './dto/visitor.dto';

/**
 * Visitantes.
 *
 * O visitante lê o QR code no culto e se cadastra sozinho — sem login, no
 * celular dele. A partir daí a liderança tem uma fila de acompanhamento até
 * a pessoa virar membro (ou não).
 *
 * ⚠️ O cadastro é uma rota PÚBLICA de escrita, a única do sistema. Por isso:
 * tamanho de campo limitado no DTO, limite de requisições no controller, e
 * ela NUNCA devolve dado de ninguém — só confirma que recebeu.
 */
@Injectable()
export class VisitorsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly push: PushService,
  ) {}

  /** Cadastro público (QR code). Devolve só uma confirmação. */
  async selfRegister(slug: string, dto: CreateVisitorDto) {
    const church = await this.prisma.church.findUnique({
      where: { slug: slug.trim() },
      select: { id: true, name: true },
    });
    if (!church) throw new NotFoundException('Igreja não encontrada.');

    const visitor = await this.prisma.visitor.create({
      data: {
        churchId: church.id,
        name: dto.name.trim(),
        phone: dto.phone?.trim() || null,
        email: dto.email?.trim().toLowerCase() || null,
        birthDate: dto.birthDate ? new Date(dto.birthDate) : null,
        city: dto.city?.trim() || null,
        howFound: dto.howFound?.trim() || null,
        invitedBy: dto.invitedBy?.trim() || null,
        prayerRequest: dto.prayerRequest?.trim() || null,
        wantsVisit: dto.wantsVisit ?? false,
      },
      select: { id: true, name: true, wantsVisit: true },
    });

    // Avisa a liderança na hora: visitante esfria rápido.
    const primeiroNome = visitor.name.split(/\s+/)[0];
    void this.push
      .notifyPortalManagers(church.id, {
        title: '👋 Novo visitante!',
        body: visitor.wantsVisit
          ? `${primeiroNome} se cadastrou e PEDIU uma visita.`
          : `${primeiroNome} se cadastrou no culto de hoje.`,
        url: '/visitors',
      })
      .catch(() => undefined);

    return {
      message: `Que bom ter você aqui, ${primeiroNome}! A ${church.name} vai entrar em contato.`,
    };
  }

  async findAll(churchId: string, status?: VisitorStatus) {
    return this.prisma.visitor.findMany({
      where: { churchId, ...(status ? { status } : {}) },
      orderBy: { createdAt: 'desc' },
      take: 300,
      include: {
        followUps: { orderBy: { createdAt: 'desc' }, take: 5 },
      },
    });
  }

  /** Contadores para o topo da tela e o selo do menu. */
  async stats(churchId: string) {
    const linhas = await this.prisma.visitor.groupBy({
      by: ['status'],
      where: { churchId },
      _count: { _all: true },
    });
    const porStatus = Object.fromEntries(
      linhas.map((l) => [l.status, l._count._all]),
    ) as Partial<Record<VisitorStatus, number>>;

    const trintaDias = new Date(Date.now() - 30 * 86_400_000);
    const noMes = await this.prisma.visitor.count({
      where: { churchId, createdAt: { gte: trintaDias } },
    });

    return {
      novos: porStatus.NEW ?? 0,
      contatados: porStatus.CONTACTED ?? 0,
      retornaram: porStatus.RETURNED ?? 0,
      viraramMembros: porStatus.MEMBER ?? 0,
      ultimos30Dias: noMes,
      // Quem pediu visita e ainda não foi contatado — a fila mais urgente.
      pediramVisita: await this.prisma.visitor.count({
        where: { churchId, wantsVisit: true, status: VisitorStatus.NEW },
      }),
    };
  }

  async setStatus(churchId: string, id: string, status: VisitorStatus) {
    const visitor = await this.prisma.visitor.findFirst({
      where: { id, churchId },
      select: { id: true, status: true },
    });
    if (!visitor) throw new NotFoundException('Visitante não encontrado.');
    if (status === VisitorStatus.MEMBER) {
      throw new BadRequestException(
        'Para marcar como membro, use a ação de converter em membro.',
      );
    }
    await this.prisma.visitor.update({ where: { id }, data: { status } });
    return this.findOne(churchId, id);
  }

  async addFollowUp(
    churchId: string,
    id: string,
    userId: string,
    note: string,
  ) {
    const visitor = await this.prisma.visitor.findFirst({
      where: { id, churchId },
      select: { id: true, status: true },
    });
    if (!visitor) throw new NotFoundException('Visitante não encontrado.');

    await this.prisma.$transaction([
      this.prisma.visitorFollowUp.create({
        data: { churchId, visitorId: id, userId, note: note.trim() },
      }),
      // Registrar um contato já move da fila "novos": foi o que aconteceu.
      ...(visitor.status === VisitorStatus.NEW
        ? [
            this.prisma.visitor.update({
              where: { id },
              data: { status: VisitorStatus.CONTACTED },
            }),
          ]
        : []),
    ]);
    return this.findOne(churchId, id);
  }

  /**
   * Converte o visitante em membro de verdade. Não apaga o visitante: o
   * histórico de como a pessoa chegou é justamente o que a liderança quer
   * olhar depois.
   */
  async convertToMember(churchId: string, id: string) {
    const visitor = await this.prisma.visitor.findFirst({
      where: { id, churchId },
    });
    if (!visitor) throw new NotFoundException('Visitante não encontrado.');
    if (visitor.memberId) {
      throw new BadRequestException('Este visitante já virou membro.');
    }

    const member = await this.prisma.member.create({
      data: {
        churchId,
        name: visitor.name,
        email: visitor.email,
        phone: visitor.phone,
        birthDate: visitor.birthDate,
        city: visitor.city,
        status: MemberStatus.ACTIVE,
        joinedAt: new Date(),
      },
      select: { id: true, name: true },
    });

    await this.prisma.visitor.update({
      where: { id },
      data: { status: VisitorStatus.MEMBER, memberId: member.id },
    });

    return { member, visitor: await this.findOne(churchId, id) };
  }

  async findOne(churchId: string, id: string) {
    const visitor = await this.prisma.visitor.findFirst({
      where: { id, churchId },
      include: { followUps: { orderBy: { createdAt: 'desc' } } },
    });
    if (!visitor) throw new NotFoundException('Visitante não encontrado.');
    return visitor;
  }

  async remove(churchId: string, id: string) {
    const visitor = await this.prisma.visitor.findFirst({
      where: { id, churchId },
      select: { id: true },
    });
    if (!visitor) throw new NotFoundException('Visitante não encontrado.');
    await this.prisma.visitor.delete({ where: { id } });
    return { success: true };
  }
}
