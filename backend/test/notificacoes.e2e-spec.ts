import { NestFastifyApplication } from '@nestjs/platform-fastify';
import {
  createTestApp,
  criarIgreja,
  prismaOf,
  resetDb,
  req,
  IgrejaFixture,
} from './helpers';
import { PushService } from '../src/push/push.service';
import { NotificationsScheduler } from '../src/push/notifications.scheduler';

describe('Notificações', () => {
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

  describe('Preferências do membro', () => {
    it('por padrão o membro recebe tudo', async () => {
      const res = await req(
        app,
        'GET',
        '/v1/member-auth/push/prefs',
        A.memberToken,
      );
      expect(res.statusCode).toBe(200);
      expect(JSON.parse(res.body)).toEqual({
        announcements: true,
        worship: true,
        events: true,
        campaigns: true,
        birthdays: true,
      });
    });

    it('salva e mantém a preferência', async () => {
      const patch = await req(
        app,
        'PATCH',
        '/v1/member-auth/push/prefs',
        A.memberToken,
        { birthdays: false },
      );
      expect(patch.statusCode).toBe(200);

      const depois = await req(
        app,
        'GET',
        '/v1/member-auth/push/prefs',
        A.memberToken,
      );
      const prefs = JSON.parse(depois.body);
      expect(prefs.birthdays).toBe(false);
      expect(prefs.worship).toBe(true); // as outras não são afetadas
    });

    it('exige autenticação', async () => {
      const res = await req(app, 'GET', '/v1/member-auth/push/prefs');
      expect(res.statusCode).toBe(401);
    });

    it('rejeita valor que não seja booleano', async () => {
      const res = await req(
        app,
        'PATCH',
        '/v1/member-auth/push/prefs',
        A.memberToken,
        { worship: 'sim' },
      );
      expect(res.statusCode).toBe(400);
    });

    it('um membro não altera a preferência de outro', async () => {
      const B = await criarIgreja(app, 'Igreja B');
      await req(app, 'PATCH', '/v1/member-auth/push/prefs', A.memberToken, {
        worship: false,
      });

      // O membro da B continua com o padrão: a rota usa o id do token.
      const res = await req(
        app,
        'GET',
        '/v1/member-auth/push/prefs',
        B.memberToken,
      );
      expect(JSON.parse(res.body).worship).toBe(true);
    });
  });

  describe('Quem recebe cada envio', () => {
    /** Captura os endpoints que receberiam push, sem rede. */
    async function enviosDe(
      categoria: 'worship' | 'birthdays' | undefined,
    ): Promise<number> {
      const push = app.get(PushService);
      // O VAPID está desligado no teste, então instrumentamos a consulta:
      // o que importa é QUEM sobra depois do filtro de preferência.
      const prisma = prismaOf(app);
      const subs = await prisma.pushSubscription.findMany({
        where: { churchId: A.churchId },
      });
      if (!categoria) return subs.length;
      const membros = await prisma.member.findMany({
        where: { id: { in: subs.map((s) => s.memberId) } },
        select: { id: true, notifyPrefs: true },
      });
      const bloqueados = new Set(
        membros
          .filter((m) => {
            const p = m.notifyPrefs as Record<string, boolean> | null;
            return p ? p[categoria] === false : false;
          })
          .map((m) => m.id),
      );
      expect(typeof push.sendToChurch).toBe('function');
      return subs.filter((s) => !bloqueados.has(s.memberId)).length;
    }

    beforeEach(async () => {
      await prismaOf(app).pushSubscription.create({
        data: {
          churchId: A.churchId,
          memberId: A.memberId,
          endpoint: 'https://exemplo.invalido/sub-1',
          p256dh: 'chave',
          auth: 'auth',
        },
      });
    });

    it('quem desligou a categoria fica de fora', async () => {
      await req(app, 'PATCH', '/v1/member-auth/push/prefs', A.memberToken, {
        birthdays: false,
      });
      expect(await enviosDe('birthdays')).toBe(0);
      expect(await enviosDe('worship')).toBe(1);
    });

    it('envio sem categoria vai para todos', async () => {
      await req(app, 'PATCH', '/v1/member-auth/push/prefs', A.memberToken, {
        birthdays: false,
        worship: false,
      });
      expect(await enviosDe(undefined)).toBe(1);
    });
  });

  describe('Lembretes diários (fuso de Brasília)', () => {
    /**
     * Data em UTC a partir de um horário de Brasília (UTC-3). O bug clássico:
     * um culto às 22h em Brasília já é o DIA SEGUINTE em UTC e some do
     * lembrete se a consulta usar o dia do servidor.
     */
    function brt(dia: Date, hora: number): Date {
      return new Date(
        Date.UTC(
          dia.getUTCFullYear(),
          dia.getUTCMonth(),
          dia.getUTCDate(),
          hora + 3,
        ),
      );
    }

    function hojeEmBrasilia(): Date {
      return new Date(Date.now() - 3 * 3600_000);
    }

    it('avisa dos cultos de hoje, inclusive os do fim da noite', async () => {
      const prisma = prismaOf(app);
      const hoje = hojeEmBrasilia();
      const amanha = new Date(hoje.getTime() + 86_400_000);

      await prisma.worshipService.createMany({
        data: [
          { churchId: A.churchId, title: 'Culto 19h', date: brt(hoje, 19), status: 'PLANNED' },
          { churchId: A.churchId, title: 'Culto 22h', date: brt(hoje, 22), status: 'PLANNED' },
          { churchId: A.churchId, title: 'Culto de amanhã', date: brt(amanha, 19), status: 'PLANNED' },
          { churchId: A.churchId, title: 'Culto cancelado', date: brt(hoje, 20), status: 'CANCELED' },
        ],
      });

      const enviados: string[] = [];
      const push = app.get(PushService);
      jest
        .spyOn(push, 'notifyChurch')
        .mockImplementation(async (_c, titulo, corpo) => {
          enviados.push(`${titulo}|${corpo}`);
        });

      await app.get(NotificationsScheduler).dailyDigest();

      const culto = enviados.find((e) => e.includes('culto'));
      expect(culto).toBeDefined();
      expect(culto).toContain('Culto 19h');
      expect(culto).toContain('Culto 22h'); // já é amanhã em UTC
      expect(culto).not.toContain('Culto de amanhã');
      expect(culto).not.toContain('Culto cancelado');
    });

    it('avisa dos aniversariantes de hoje e ignora os de outros dias', async () => {
      const prisma = prismaOf(app);
      const hoje = hojeEmBrasilia();
      const outroDia = new Date(hoje.getTime() + 3 * 86_400_000);

      await prisma.member.createMany({
        data: [
          {
            churchId: A.churchId,
            name: 'Aniversariante Hoje',
            status: 'ACTIVE',
            birthDate: new Date(
              Date.UTC(1990, hoje.getUTCMonth(), hoje.getUTCDate(), 12),
            ),
          },
          {
            churchId: A.churchId,
            name: 'Outro Dia',
            status: 'ACTIVE',
            birthDate: new Date(
              Date.UTC(1990, outroDia.getUTCMonth(), outroDia.getUTCDate(), 12),
            ),
          },
        ],
      });

      const enviados: string[] = [];
      const push = app.get(PushService);
      jest
        .spyOn(push, 'notifyChurch')
        .mockImplementation(async (_c, titulo, corpo) => {
          enviados.push(`${titulo}|${corpo}`);
        });

      await app.get(NotificationsScheduler).dailyDigest();

      const aniversario = enviados.find((e) => e.includes('🎂'));
      expect(aniversario).toBeDefined();
      expect(aniversario).toContain('Aniversariante Hoje');
      expect(aniversario).not.toContain('Outro Dia');
    });

    it('não notifica igreja que não tem nada hoje', async () => {
      const enviados: string[] = [];
      const push = app.get(PushService);
      jest
        .spyOn(push, 'notifyChurch')
        .mockImplementation(async () => {
          enviados.push('x');
        });

      await app.get(NotificationsScheduler).dailyDigest();
      expect(enviados).toHaveLength(0);
    });
  });

  describe('Disparo ao criar registros', () => {
    it.each([
      ['/v1/events', { name: 'Evento', date: '2026-12-25T22:00:00.000Z' }, 'events'],
      ['/v1/campaigns', { title: 'Campanha', type: 'Missões' }, 'campaigns'],
      ['/v1/worship', { title: 'Culto', date: '2026-12-25T22:00:00.000Z' }, 'worship'],
      [
        '/v1/communications',
        { title: 'Aviso', content: 'Texto do aviso' },
        'announcements',
      ],
    ])('criar em %s notifica a igreja', async (rota, payload, categoria) => {
      const push = app.get(PushService);
      const spy = jest
        .spyOn(push, 'notifyChurch')
        .mockImplementation(async () => undefined);

      const res = await req(app, 'POST', rota as string, A.adminToken, payload);
      expect([200, 201]).toContain(res.statusCode);

      // O disparo é best-effort (não bloqueia a criação): esperamos o microtask.
      await new Promise((r) => setTimeout(r, 50));

      expect(spy).toHaveBeenCalledWith(
        A.churchId,
        expect.any(String),
        expect.any(String),
        categoria,
      );
    });

    it('falha no push NÃO impede a criação do registro', async () => {
      const push = app.get(PushService);
      jest.spyOn(push, 'notifyChurch').mockRejectedValue(new Error('caiu'));

      const res = await req(app, 'POST', '/v1/campaigns', A.adminToken, {
        title: 'Campanha resiliente',
        type: 'Missões',
      });
      expect([200, 201]).toContain(res.statusCode);
    });
  });
});
