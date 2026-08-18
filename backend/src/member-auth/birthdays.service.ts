import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PushService } from '../push/push.service';

/**
 * Aniversários no portal do membro.
 *
 * O aniversário já existia como notificação e morria ali. Aqui ele vira ação:
 * a igreja deixa recados e o aniversariante encontra tudo reunido ao abrir o
 * app.
 *
 * ⚠️ Privacidade: a listagem NUNCA devolve telefone. Quem quiser mandar
 * mensagem privada passa por `whatsappLink`, que entrega um número por vez —
 * assim ninguém baixa a agenda inteira da igreja numa requisição só.
 */

/** Data de hoje no fuso de Brasília. */
function hojeBrt(): { ano: number; mes: number; dia: number } {
  const brt = new Date(Date.now() - 3 * 3600_000);
  return {
    ano: brt.getUTCFullYear(),
    mes: brt.getUTCMonth(),
    dia: brt.getUTCDate(),
  };
}

/** Dia do ano (0-365) ignorando o ano — para ordenar "próximos da semana". */
function diaDoAno(mes: number, dia: number): number {
  return mes * 31 + dia;
}

@Injectable()
export class BirthdaysService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly push: PushService,
  ) {}

  /**
   * Aniversariantes de hoje e dos próximos 7 dias + os recados que o próprio
   * membro recebeu (se hoje for o aniversário dele).
   */
  async list(churchId: string, memberId: string) {
    const { ano, mes, dia } = hojeBrt();

    const membros = await this.prisma.member.findMany({
      where: { churchId, birthDate: { not: null }, status: 'ACTIVE' },
      select: { id: true, name: true, photo: true, birthDate: true },
    });

    const deHoje = membros.filter(
      (m) =>
        m.birthDate!.getUTCMonth() === mes && m.birthDate!.getUTCDate() === dia,
    );

    // Próximos 7 dias (sem hoje), na ordem em que chegam.
    const proximos: typeof membros = [];
    for (let i = 1; i <= 7; i++) {
      const d = new Date(Date.UTC(ano, mes, dia + i));
      const achados = membros.filter(
        (m) =>
          m.birthDate!.getUTCMonth() === d.getUTCMonth() &&
          m.birthDate!.getUTCDate() === d.getUTCDate(),
      );
      proximos.push(...achados);
    }

    // Recados já deixados hoje, para mostrar quem participou e se eu já fui.
    const recados = deHoje.length
      ? await this.prisma.birthdayGreeting.findMany({
          where: {
            churchId,
            year: ano,
            memberId: { in: deHoje.map((m) => m.id) },
          },
          select: { memberId: true, authorId: true },
        })
      : [];

    const autoresPorAniversariante = new Map<string, string[]>();
    for (const r of recados) {
      const lista = autoresPorAniversariante.get(r.memberId) ?? [];
      lista.push(r.authorId);
      autoresPorAniversariante.set(r.memberId, lista);
    }

    // Iniciais de quem parabenizou (as bolinhas do cartão).
    const idsAutores = [...new Set(recados.map((r) => r.authorId))];
    const autores = idsAutores.length
      ? await this.prisma.member.findMany({
          where: { id: { in: idsAutores }, churchId },
          select: { id: true, name: true, photo: true },
        })
      : [];
    const autorPorId = new Map(autores.map((a) => [a.id, a]));

    const today = deHoje.map((m) => {
      const quemParabenizou = autoresPorAniversariante.get(m.id) ?? [];
      return {
        memberId: m.id,
        name: m.name,
        photo: m.photo,
        isMe: m.id === memberId,
        greetings: quemParabenizou.length,
        iGreeted: quemParabenizou.includes(memberId),
        greeters: quemParabenizou.slice(0, 3).map((id) => ({
          name: autorPorId.get(id)?.name ?? 'Membro',
          photo: autorPorId.get(id)?.photo ?? null,
        })),
      };
    });

    return {
      today,
      week: proximos.map((m) => ({
        memberId: m.id,
        name: m.name,
        photo: m.photo,
        month: m.birthDate!.getUTCMonth() + 1,
        day: m.birthDate!.getUTCDate(),
      })),
      mine: deHoje.some((m) => m.id === memberId)
        ? await this.recadosRecebidos(churchId, memberId, ano)
        : null,
    };
  }

  /** Os recados que o aniversariante recebeu neste ano. */
  private async recadosRecebidos(
    churchId: string,
    memberId: string,
    ano: number,
  ) {
    const recados = await this.prisma.birthdayGreeting.findMany({
      where: { churchId, memberId, year: ano },
      orderBy: { createdAt: 'asc' },
      select: { authorId: true, message: true, createdAt: true },
    });
    if (!recados.length) return { total: 0, messages: [] };

    const autores = await this.prisma.member.findMany({
      where: { id: { in: recados.map((r) => r.authorId) }, churchId },
      select: { id: true, name: true, photo: true },
    });
    const porId = new Map(autores.map((a) => [a.id, a]));

    return {
      total: recados.length,
      messages: recados
        .filter((r) => r.message)
        .map((r) => ({
          authorName: porId.get(r.authorId)?.name ?? 'Membro',
          authorPhoto: porId.get(r.authorId)?.photo ?? null,
          message: r.message as string,
          createdAt: r.createdAt,
        })),
    };
  }

  /**
   * Deixa (ou atualiza) o recado de aniversário. Só vale no dia certo: fora
   * dele o "parabéns" não faria sentido e poluiria o histórico.
   */
  async greet(
    churchId: string,
    authorId: string,
    memberId: string,
    message?: string,
  ) {
    if (authorId === memberId) {
      throw new BadRequestException(
        'Você não pode se parabenizar — mas feliz aniversário! 🎉',
      );
    }

    const aniversariante = await this.prisma.member.findFirst({
      where: { id: memberId, churchId },
      select: { id: true, name: true, birthDate: true },
    });
    if (!aniversariante?.birthDate) {
      throw new NotFoundException('Membro não encontrado.');
    }

    const { ano, mes, dia } = hojeBrt();
    const ehHoje =
      aniversariante.birthDate.getUTCMonth() === mes &&
      aniversariante.birthDate.getUTCDate() === dia;
    if (!ehHoje) {
      throw new BadRequestException('Hoje não é o aniversário desta pessoa.');
    }

    const texto = (message ?? '').trim().slice(0, 300) || null;
    const jaExistia = await this.prisma.birthdayGreeting.findUnique({
      where: {
        memberId_authorId_year: { memberId, authorId, year: ano },
      },
      select: { id: true },
    });

    await this.prisma.birthdayGreeting.upsert({
      where: { memberId_authorId_year: { memberId, authorId, year: ano } },
      create: { churchId, memberId, authorId, year: ano, message: texto },
      update: { message: texto },
    });

    const total = await this.prisma.birthdayGreeting.count({
      where: { churchId, memberId, year: ano },
    });

    // Avisa o aniversariante SÓ no primeiro recado: um toque de alegria, não
    // um bombardeio a cada pessoa que parabeniza.
    if (!jaExistia && total === 1) {
      const autor = await this.prisma.member.findUnique({
        where: { id: authorId },
        select: { name: true },
      });
      const primeiroNome = autor?.name?.trim().split(/\s+/)[0] ?? 'Alguém';
      void this.push
        .notifyMember(memberId, {
          title: '🎉 Feliz aniversário!',
          body: `${primeiroNome} deixou um recado para você. Abra o app para ver.`,
        })
        .catch(() => undefined);
    }

    return { greetings: total, iGreeted: true };
  }

  /**
   * Link do WhatsApp de UM aniversariante. Fica fora da listagem de propósito:
   * evita entregar a agenda telefônica inteira da igreja numa requisição.
   */
  async whatsappLink(churchId: string, memberId: string) {
    const membro = await this.prisma.member.findFirst({
      where: { id: memberId, churchId },
      select: { name: true, phone: true, birthDate: true },
    });
    if (!membro) throw new NotFoundException('Membro não encontrado.');

    const { mes, dia } = hojeBrt();
    const ehHoje =
      membro.birthDate?.getUTCMonth() === mes &&
      membro.birthDate?.getUTCDate() === dia;
    if (!ehHoje) {
      throw new BadRequestException('Hoje não é o aniversário desta pessoa.');
    }
    if (!membro.phone) return { url: null };

    let digitos = membro.phone.replace(/\D/g, '');
    if (digitos.length <= 11) digitos = `55${digitos}`;
    const primeiroNome = membro.name.trim().split(/\s+/)[0];
    const texto = encodeURIComponent(
      `Feliz aniversário, ${primeiroNome}! Que Deus te abençoe muito. 🎉`,
    );
    return { url: `https://wa.me/${digitos}?text=${texto}` };
  }
}
