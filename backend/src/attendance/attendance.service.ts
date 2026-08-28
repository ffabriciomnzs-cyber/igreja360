import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Presença no culto.
 *
 * O membro toca em "Estou aqui" pelo app. O botão só existe DENTRO da janela
 * do culto — 1h antes até 3h depois do horário. Sem isso, "presença" viraria
 * um botão que qualquer um aperta de casa na quarta à tarde, e o número não
 * serviria para nada.
 *
 * A janela sai de duas fontes: a agenda fixa da igreja (terça/quinta/domingo)
 * e os cultos cadastrados com data. Basta uma delas para o botão abrir.
 */

const ABRE_ANTES_MIN = 60;
const FECHA_DEPOIS_MIN = 180;

/** Agora no fuso de Brasília, como um Date "deslocado" para facilitar contas. */
function agoraBrt(): Date {
  return new Date(Date.now() - 3 * 3600_000);
}

/** "AAAA-MM-DD" do dia de hoje em Brasília. */
export function hojeBrt(): string {
  return agoraBrt().toISOString().slice(0, 10);
}

function somaDias(day: string, delta: number): string {
  const [y, m, d] = day.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + delta)).toISOString().slice(0, 10);
}

export interface JanelaDeCulto {
  aberto: boolean;
  nome: string | null;
  /** Culto cadastrado, quando a janela veio de um. */
  worshipId: string | null;
  /** Quando o botão abre/fecha — a tela usa para explicar a espera. */
  abreEm: string | null;
  fechaEm: string | null;
}

@Injectable()
export class AttendanceService {
  constructor(private readonly prisma: PrismaService) {}

  /** Existe culto acontecendo agora? De onde vem a janela? */
  async janelaAgora(churchId: string): Promise<JanelaDeCulto> {
    const brt = agoraBrt();
    const hoje = hojeBrt();
    const minutosAgora = brt.getUTCHours() * 60 + brt.getUTCMinutes();

    const [agenda, cultos] = await this.prisma.$transaction([
      this.prisma.serviceSchedule.findMany({
        where: { churchId, active: true, weekday: brt.getUTCDay() },
        select: { name: true, time: true },
      }),
      this.prisma.worshipService.findMany({
        where: {
          churchId,
          date: {
            gte: new Date(`${hoje}T00:00:00.000Z`),
            lt: new Date(`${somaDias(hoje, 1)}T00:00:00.000Z`),
          },
        },
        select: { id: true, title: true, date: true },
      }),
    ]);

    const candidatos: { nome: string; inicio: number; worshipId: string | null }[] =
      [
        ...agenda.map((a) => {
          const [h, m] = a.time.split(':').map(Number);
          return { nome: a.name, inicio: h * 60 + m, worshipId: null };
        }),
        ...cultos.map((c) => {
          // A data do culto está em UTC no banco; o horário que a igreja
          // enxerga é o de Brasília.
          const d = new Date(c.date.getTime() - 3 * 3600_000);
          return {
            nome: c.title,
            inicio: d.getUTCHours() * 60 + d.getUTCMinutes(),
            worshipId: c.id,
          };
        }),
      ];

    const emJanela = candidatos.filter(
      (c) =>
        minutosAgora >= c.inicio - ABRE_ANTES_MIN &&
        minutosAgora <= c.inicio + FECHA_DEPOIS_MIN,
    );

    if (!emJanela.length) {
      // Nada agora: informa o próximo horário de hoje, se houver, para a tela
      // poder dizer "o check-in abre às 18h".
      const proximo = candidatos
        .filter((c) => c.inicio - ABRE_ANTES_MIN > minutosAgora)
        .sort((a, b) => a.inicio - b.inicio)[0];
      return {
        aberto: false,
        nome: proximo?.nome ?? null,
        worshipId: null,
        abreEm: proximo ? minutosParaHora(proximo.inicio - ABRE_ANTES_MIN) : null,
        fechaEm: null,
      };
    }

    // Culto cadastrado ganha do horário fixo: tem título de verdade.
    const escolhido =
      emJanela.find((c) => c.worshipId) ??
      emJanela.sort((a, b) => a.inicio - b.inicio)[0];

    return {
      aberto: true,
      nome: escolhido.nome,
      worshipId: escolhido.worshipId,
      abreEm: minutosParaHora(escolhido.inicio - ABRE_ANTES_MIN),
      fechaEm: minutosParaHora(escolhido.inicio + FECHA_DEPOIS_MIN),
    };
  }

  /** O que o app mostra: janela + se já marquei + números do mês. */
  async statusDoMembro(churchId: string, memberId: string) {
    const hoje = hojeBrt();
    const janela = await this.janelaAgora(churchId);

    const [minha, hojeTotal, minhasDoMes] = await this.prisma.$transaction([
      this.prisma.attendance.findUnique({
        where: { memberId_day: { memberId, day: hoje } },
        select: { id: true },
      }),
      this.prisma.attendance.count({ where: { churchId, day: hoje } }),
      this.prisma.attendance.count({
        where: { memberId, day: { gte: `${hoje.slice(0, 7)}-01` } },
      }),
    ]);

    return {
      window: janela,
      checkedIn: !!minha,
      todayCount: hojeTotal,
      myMonthCount: minhasDoMes,
    };
  }

  /** "Estou aqui" — só dentro da janela do culto. */
  async checkIn(churchId: string, memberId: string) {
    const janela = await this.janelaAgora(churchId);
    if (!janela.aberto) {
      throw new BadRequestException(
        janela.abreEm
          ? `O check-in abre às ${janela.abreEm}, uma hora antes do culto.`
          : 'Não há culto agora. O check-in abre uma hora antes de cada culto.',
      );
    }

    const hoje = hojeBrt();
    await this.prisma.attendance.upsert({
      where: { memberId_day: { memberId, day: hoje } },
      create: {
        churchId,
        memberId,
        day: hoje,
        worshipId: janela.worshipId,
      },
      update: {},
    });
    return this.statusDoMembro(churchId, memberId);
  }

  // ---------- Painel ----------

  /** Presenças de um dia, com nome de quem esteve. */
  async doDia(churchId: string, day?: string) {
    const dia = day ?? hojeBrt();
    const presencas = await this.prisma.attendance.findMany({
      where: { churchId, day: dia },
      orderBy: { createdAt: 'asc' },
    });
    if (!presencas.length) return { day: dia, total: 0, members: [] };

    const membros = await this.prisma.member.findMany({
      where: { id: { in: presencas.map((p) => p.memberId) }, churchId },
      select: { id: true, name: true, photo: true },
    });
    const porId = new Map(membros.map((m) => [m.id, m]));

    return {
      day: dia,
      total: presencas.length,
      members: presencas.map((p) => ({
        memberId: p.memberId,
        name: porId.get(p.memberId)?.name ?? 'Membro',
        photo: porId.get(p.memberId)?.photo ?? null,
        manual: !!p.markedBy,
        at: p.createdAt,
      })),
    };
  }

  /**
   * O número que a liderança realmente quer: quem sumiu.
   * Membros ativos sem NENHUMA presença nos últimos 21 dias.
   */
  async stats(churchId: string) {
    const hoje = hojeBrt();
    const tresSemanas = somaDias(hoje, -21);

    const [hojeTotal, ultimos, ativos, presencasRecentes] =
      await this.prisma.$transaction([
        this.prisma.attendance.count({ where: { churchId, day: hoje } }),
        this.prisma.attendance.groupBy({
          by: ['day'],
          where: { churchId, day: { gte: somaDias(hoje, -35) } },
          _count: true,
          orderBy: { day: 'desc' },
        }),
        this.prisma.member.findMany({
          where: { churchId, status: 'ACTIVE' },
          select: { id: true, name: true, phone: true, photo: true },
        }),
        this.prisma.attendance.findMany({
          where: { churchId, day: { gte: tresSemanas } },
          select: { memberId: true },
          distinct: ['memberId'],
        }),
      ]);

    const presentes = new Set(presencasRecentes.map((p) => p.memberId));
    const sumidos = ativos.filter((m) => !presentes.has(m.id));

    return {
      hoje: hojeTotal,
      ultimosCultos: ultimos.slice(0, 8).map((u) => ({
        day: u.day,
        total: u._count,
      })),
      membrosAtivos: ativos.length,
      // Só os primeiros: a ideia é dar uma fila para trabalhar, não um relatório.
      sumidos: sumidos.slice(0, 40),
      totalSumidos: sumidos.length,
    };
  }

  /** Marcação manual: quem não usa o aplicativo também conta. */
  async marcarManual(
    churchId: string,
    userId: string,
    memberId: string,
    day?: string,
  ) {
    const membro = await this.prisma.member.findFirst({
      where: { id: memberId, churchId },
      select: { id: true },
    });
    if (!membro) throw new NotFoundException('Membro não encontrado.');

    const dia = day ?? hojeBrt();
    await this.prisma.attendance.upsert({
      where: { memberId_day: { memberId, day: dia } },
      create: { churchId, memberId, day: dia, markedBy: userId },
      update: {},
    });
    return this.doDia(churchId, dia);
  }

  async desmarcar(churchId: string, memberId: string, day?: string) {
    const dia = day ?? hojeBrt();
    await this.prisma.attendance.deleteMany({
      where: { churchId, memberId, day: dia },
    });
    return this.doDia(churchId, dia);
  }
}

/** 1110 → "18:30" */
function minutosParaHora(min: number): string {
  const m = ((min % 1440) + 1440) % 1440;
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
}
