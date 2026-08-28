import { NestFastifyApplication } from '@nestjs/platform-fastify';
import {
  createTestApp,
  criarIgreja,
  prismaOf,
  resetDb,
  req,
  IgrejaFixture,
} from './helpers';

/**
 * Presença no culto.
 *
 * A regra que dá sentido ao número: o botão "Estou aqui" só abre DENTRO da
 * janela do culto. Sem isso, qualquer um marcaria presença de casa numa
 * quarta à tarde e a frequência não valeria nada para a liderança.
 */
describe('Presença no culto', () => {
  let app: NestFastifyApplication;
  let A: IgrejaFixture;

  beforeAll(async () => {
    app = await createTestApp();
  });
  afterAll(async () => {
    await app.close();
  });
  beforeEach(async () => {
    await resetDb(prismaOf(app));
    A = await criarIgreja(app, 'Igreja A');
  });

  /** Agora em Brasília, para montar horários relativos ao "hoje" real. */
  function brtAgora() {
    return new Date(Date.now() - 3 * 3600_000);
  }
  function hojeBrt() {
    return brtAgora().toISOString().slice(0, 10);
  }
  function horaComOffset(minutos: number): string {
    const d = new Date(brtAgora().getTime() + minutos * 60_000);
    return `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`;
  }

  /** Cria um horário fixo na agenda para hoje, deslocado em minutos. */
  async function agendaHoje(minutosAPartirDeAgora: number, nome = 'Culto de teste') {
    await prismaOf(app).serviceSchedule.create({
      data: {
        churchId: A.churchId,
        weekday: brtAgora().getUTCDay(),
        time: horaComOffset(minutosAPartirDeAgora),
        name: nome,
        active: true,
      },
    });
  }

  const status = (token = A.memberToken) =>
    req(app, 'GET', '/v1/member-auth/attendance', token);
  const marcar = (token = A.memberToken) =>
    req(app, 'POST', '/v1/member-auth/attendance', token, {});

  describe('Janela do culto', () => {
    it('sem culto hoje: botão fechado e presença recusada', async () => {
      const s = JSON.parse((await status()).body);
      expect(s.window.aberto).toBe(false);
      expect(s.checkedIn).toBe(false);

      const res = await marcar();
      expect(res.statusCode).toBe(400);
      expect(res.body).toContain('culto');
      expect(await prismaOf(app).attendance.count()).toBe(0);
    });

    it('culto daqui a 3 horas: ainda fechado, mas diz a que horas abre', async () => {
      await agendaHoje(180);
      const s = JSON.parse((await status()).body);
      expect(s.window.aberto).toBe(false);
      expect(s.window.abreEm).toBe(horaComOffset(120)); // 1h antes do culto
      expect((await marcar()).statusCode).toBe(400);
    });

    it('culto começando em 30 min: janela ABERTA', async () => {
      await agendaHoje(30, 'Culto de domingo');
      const s = JSON.parse((await status()).body);
      expect(s.window.aberto).toBe(true);
      expect(s.window.nome).toBe('Culto de domingo');
    });

    it('culto que começou há 1 hora: ainda dá para marcar', async () => {
      await agendaHoje(-60);
      expect(JSON.parse((await status()).body).window.aberto).toBe(true);
    });

    it('culto que acabou há muito tempo: janela fechada', async () => {
      await agendaHoje(-240); // 4h atrás (a janela fecha em 3h)
      expect(JSON.parse((await status()).body).window.aberto).toBe(false);
    });
  });

  describe('Marcar presença', () => {
    beforeEach(async () => {
      await agendaHoje(30, 'Culto de hoje');
    });

    it('marca uma vez e conta uma vez, mesmo com dois toques', async () => {
      const r1 = await marcar();
      expect(r1.statusCode).toBe(200);
      const d1 = JSON.parse(r1.body);
      expect(d1.checkedIn).toBe(true);
      expect(d1.todayCount).toBe(1);
      expect(d1.myMonthCount).toBe(1);

      const r2 = await marcar();
      expect(JSON.parse(r2.body).todayCount).toBe(1);
      expect(await prismaOf(app).attendance.count()).toBe(1);
    });

    it('a contagem do dia soma pessoas diferentes', async () => {
      const outro = await prismaOf(app).member.create({
        data: {
          churchId: A.churchId,
          name: 'Outro Membro',
          status: 'ACTIVE',
          portalStatus: 'APPROVED',
        },
      });
      await marcar();
      await prismaOf(app).attendance.create({
        data: { churchId: A.churchId, memberId: outro.id, day: hojeBrt() },
      });
      expect(JSON.parse((await status()).body).todayCount).toBe(2);
    });
  });

  describe('Painel', () => {
    it('lista quem esteve e marca quem foi na mão', async () => {
      await agendaHoje(30);
      await marcar();

      const semApp = await prismaOf(app).member.create({
        data: { churchId: A.churchId, name: 'Irmã Sem Celular', status: 'ACTIVE' },
      });
      const res = await req(
        app,
        'POST',
        `/v1/attendance/${semApp.id}`,
        A.adminToken,
        {},
      );
      expect(res.statusCode).toBe(200);
      const dia = JSON.parse(res.body);
      expect(dia.total).toBe(2);
      const manual = dia.members.find((m: { name: string }) =>
        m.name.includes('Sem Celular'),
      );
      expect(manual.manual).toBe(true);
    });

    it('desmarcar corrige um engano', async () => {
      await agendaHoje(30);
      await marcar();
      const res = await req(
        app,
        'DELETE',
        `/v1/attendance/${A.memberId}`,
        A.adminToken,
      );
      expect(JSON.parse(res.body).total).toBe(0);
    });

    it('aponta quem sumiu há mais de 3 semanas', async () => {
      const antigo = new Date(Date.now() - 30 * 86_400_000)
        .toISOString()
        .slice(0, 10);
      // O membro da fixture esteve há 30 dias — está sumido.
      await prismaOf(app).attendance.create({
        data: { churchId: A.churchId, memberId: A.memberId, day: antigo },
      });

      const stats = JSON.parse(
        (await req(app, 'GET', '/v1/attendance/stats', A.adminToken)).body,
      );
      expect(stats.totalSumidos).toBeGreaterThanOrEqual(1);
      expect(
        stats.sumidos.some((m: { id: string }) => m.id === A.memberId),
      ).toBe(true);

      // Quem veio há 10 dias NÃO é sumido: o limite é 3 semanas.
      const recente = await prismaOf(app).member.create({
        data: { churchId: A.churchId, name: 'Veio Semana Passada', status: 'ACTIVE' },
      });
      await prismaOf(app).attendance.create({
        data: {
          churchId: A.churchId,
          memberId: recente.id,
          day: new Date(Date.now() - 10 * 86_400_000).toISOString().slice(0, 10),
        },
      });
      const comRecente = JSON.parse(
        (await req(app, 'GET', '/v1/attendance/stats', A.adminToken)).body,
      );
      expect(
        comRecente.sumidos.some((m: { id: string }) => m.id === recente.id),
      ).toBe(false);

      // Marcou hoje: sai da lista de sumidos.
      await agendaHoje(30);
      await marcar();
      const depois = JSON.parse(
        (await req(app, 'GET', '/v1/attendance/stats', A.adminToken)).body,
      );
      expect(
        depois.sumidos.some((m: { id: string }) => m.id === A.memberId),
      ).toBe(false);
    });
  });

  describe('Isolamento', () => {
    it('a presença de uma igreja não aparece na outra', async () => {
      await agendaHoje(30);
      await marcar();
      const B = await criarIgreja(app, 'Igreja B');

      const dia = JSON.parse(
        (await req(app, 'GET', '/v1/attendance', B.adminToken)).body,
      );
      expect(dia.total).toBe(0);

      // E não dá para marcar presença de membro de outra igreja.
      const res = await req(
        app,
        'POST',
        `/v1/attendance/${A.memberId}`,
        B.adminToken,
        {},
      );
      expect(res.statusCode).toBe(404);
    });

    it('membro do portal não abre o painel de frequência', async () => {
      expect(
        (await req(app, 'GET', '/v1/attendance/stats', A.memberToken)).statusCode,
      ).toBe(401);
    });
  });
});
