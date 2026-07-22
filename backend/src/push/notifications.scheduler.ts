import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { Prisma, WorshipStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { PushService } from './push.service';

/** Fuso da igreja. O Brasil não tem mais horário de verão (desde 2019). */
const TZ = 'America/Sao_Paulo';
const TZ_OFFSET_HOURS = -3;

/**
 * Início e fim do dia de hoje **no fuso de Brasília**, em UTC — as datas ficam
 * gravadas em UTC no banco, então comparar com o "hoje" do servidor (que roda
 * em UTC) erraria os cultos entre 21h e 00h.
 */
function todayRangeUtc(now: Date): { start: Date; end: Date } {
  const local = new Date(now.getTime() + TZ_OFFSET_HOURS * 3600_000);
  const startLocal = Date.UTC(
    local.getUTCFullYear(),
    local.getUTCMonth(),
    local.getUTCDate(),
  );
  const start = new Date(startLocal - TZ_OFFSET_HOURS * 3600_000);
  return { start, end: new Date(start.getTime() + 86_400_000) };
}

@Injectable()
export class NotificationsScheduler {
  private readonly logger = new Logger('NotificationsScheduler');

  constructor(
    private readonly prisma: PrismaService,
    private readonly push: PushService,
  ) {}

  /** Todo dia às 8h de Brasília: lembretes do dia. */
  @Cron('0 8 * * *', { timeZone: TZ })
  async dailyDigest(): Promise<void> {
    await this.worshipReminders();
    await this.birthdayReminders();
  }

  /** "Hoje tem culto" — só para cultos planejados com data de hoje. */
  private async worshipReminders(): Promise<void> {
    try {
      const { start, end } = todayRangeUtc(new Date());
      const services = await this.prisma.worshipService.findMany({
        where: {
          date: { gte: start, lt: end },
          status: WorshipStatus.PLANNED,
        },
        select: { churchId: true, title: true, date: true },
        orderBy: { date: 'asc' },
      });

      // Uma notificação por igreja, mesmo que haja mais de um culto no dia.
      const porIgreja = new Map<string, typeof services>();
      for (const s of services) {
        const lista = porIgreja.get(s.churchId) ?? [];
        lista.push(s);
        porIgreja.set(s.churchId, lista);
      }

      for (const [churchId, lista] of porIgreja) {
        const corpo = lista
          .map((s) => {
            const hora = s.date.toLocaleTimeString('pt-BR', {
              hour: '2-digit',
              minute: '2-digit',
              timeZone: TZ,
            });
            return `${hora} — ${s.title}`;
          })
          .join(' • ');
        await this.push.notifyChurch(
          churchId,
          '⛪ Hoje tem culto',
          corpo,
          'worship',
        );
      }
      this.logger.log(`Lembrete de culto: ${porIgreja.size} igreja(s).`);
    } catch (err) {
      this.logger.warn(`Falha no lembrete de culto: ${String(err)}`);
    }
  }

  /** "Aniversariantes de hoje" — compara dia/mês, ignorando o ano. */
  private async birthdayReminders(): Promise<void> {
    try {
      const local = new Date(Date.now() + TZ_OFFSET_HOURS * 3600_000);
      const dia = local.getUTCDate();
      const mes = local.getUTCMonth() + 1;

      // Prisma não filtra por parte de data; SQL parametrizado (sem interpolar).
      const rows = await this.prisma.$queryRaw<
        { churchId: string; name: string }[]
      >(Prisma.sql`
        SELECT "churchId", "name"
        FROM "Member"
        WHERE "birthDate" IS NOT NULL
          AND "status" = 'ACTIVE'
          AND EXTRACT(DAY FROM "birthDate") = ${dia}
          AND EXTRACT(MONTH FROM "birthDate") = ${mes}
        ORDER BY "name"
      `);

      const porIgreja = new Map<string, string[]>();
      for (const r of rows) {
        const nomes = porIgreja.get(r.churchId) ?? [];
        nomes.push(r.name);
        porIgreja.set(r.churchId, nomes);
      }

      for (const [churchId, nomes] of porIgreja) {
        // No máximo 3 nomes no corpo, para caber na notificação do celular.
        const mostrados = nomes.slice(0, 3).join(', ');
        const resto = nomes.length - 3;
        const corpo = resto > 0 ? `${mostrados} e mais ${resto}` : mostrados;
        await this.push.notifyChurch(
          churchId,
          nomes.length > 1 ? '🎂 Aniversariantes de hoje' : '🎂 Aniversário',
          corpo,
          'birthdays',
        );
      }
      this.logger.log(`Aniversariantes: ${porIgreja.size} igreja(s).`);
    } catch (err) {
      this.logger.warn(`Falha no aviso de aniversário: ${String(err)}`);
    }
  }
}
