import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/** Um resultado da busca global, já com a rota do painel para navegar. */
export interface SearchHit {
  type: 'member' | 'event' | 'worship' | 'campaign' | 'communication' | 'cell';
  id: string;
  title: string;
  subtitle: string | null;
  href: string;
}

const LIMITE_POR_TIPO = 5;

@Injectable()
export class SearchService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Busca global do painel (⌘K): nome/e-mail/telefone de membros e títulos de
   * eventos, cultos, campanhas, comunicados e células. TUDO escopado por
   * churchId — a busca é o lugar mais fácil de vazar dado entre igrejas.
   */
  async search(churchId: string, rawQuery: string): Promise<SearchHit[]> {
    // O Prisma NÃO escapa curingas de LIKE: "%" casaria com TUDO (verificado
    // em teste). Nomes de gente/evento não usam %_ — removê-los é seguro.
    const q = rawQuery.replace(/[%_]/g, ' ').trim();
    if (q.length < 2) return [];

    const contains = { contains: q, mode: 'insensitive' as const };

    const [members, events, worship, campaigns, communications, cells] =
      await this.prisma.$transaction([
        this.prisma.member.findMany({
          where: {
            churchId,
            OR: [{ name: contains }, { email: contains }, { phone: contains }],
          },
          select: { id: true, name: true, phone: true, email: true },
          take: LIMITE_POR_TIPO,
          orderBy: { name: 'asc' },
        }),
        this.prisma.event.findMany({
          where: { churchId, name: contains },
          select: { id: true, name: true, date: true, location: true },
          take: LIMITE_POR_TIPO,
          orderBy: { date: 'desc' },
        }),
        this.prisma.worshipService.findMany({
          where: { churchId, title: contains },
          select: { id: true, title: true, date: true },
          take: LIMITE_POR_TIPO,
          orderBy: { date: 'desc' },
        }),
        this.prisma.campaign.findMany({
          where: { churchId, title: contains },
          select: { id: true, title: true, type: true },
          take: LIMITE_POR_TIPO,
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.communication.findMany({
          where: { churchId, title: contains },
          select: { id: true, title: true, createdAt: true },
          take: LIMITE_POR_TIPO,
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.cell.findMany({
          where: { churchId, name: contains },
          select: { id: true, name: true, neighborhood: true },
          take: LIMITE_POR_TIPO,
          orderBy: { name: 'asc' },
        }),
      ]);

    const dataBr = (d: Date) =>
      d.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        timeZone: 'America/Sao_Paulo',
      });

    return [
      ...members.map<SearchHit>((m) => ({
        type: 'member',
        id: m.id,
        title: m.name,
        subtitle: m.phone || m.email,
        href: `/members/${m.id}`,
      })),
      ...events.map<SearchHit>((e) => ({
        type: 'event',
        id: e.id,
        title: e.name,
        subtitle: [dataBr(e.date), e.location].filter(Boolean).join(' · '),
        href: `/events/${e.id}`,
      })),
      ...worship.map<SearchHit>((w) => ({
        type: 'worship',
        id: w.id,
        title: w.title,
        subtitle: dataBr(w.date),
        href: `/worship/${w.id}`,
      })),
      ...campaigns.map<SearchHit>((c) => ({
        type: 'campaign',
        id: c.id,
        title: c.title,
        subtitle: c.type,
        href: `/campaigns/${c.id}`,
      })),
      ...communications.map<SearchHit>((c) => ({
        type: 'communication',
        id: c.id,
        title: c.title,
        subtitle: dataBr(c.createdAt),
        href: `/communications/${c.id}`,
      })),
      ...cells.map<SearchHit>((c) => ({
        type: 'cell',
        id: c.id,
        title: c.name,
        subtitle: c.neighborhood,
        href: `/cells/${c.id}`,
      })),
    ];
  }
}
