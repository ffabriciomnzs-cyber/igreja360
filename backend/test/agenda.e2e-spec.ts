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
 * Agenda fixa de cultos e o evento visto pelo membro no portal.
 * O que não pode falhar: uma igreja NUNCA enxergar a agenda ou o evento da
 * outra, e a foto sair como URL (nunca base64 dentro do JSON da tela).
 */
describe('Agenda fixa e evento no portal', () => {
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

  const AGENDA = [
    { weekday: 2, time: '19:30', name: 'Culto de ensino' },
    { weekday: 4, time: '19:30', name: 'Culto de oração' },
    { weekday: 0, time: '18:00', name: 'Culto de família', note: 'Ceia no 1º domingo' },
  ];

  function salvarAgenda(token: string, schedules: unknown[]) {
    return req(app, 'PUT', '/v1/settings/service-schedules', token, {
      schedules,
    });
  }

  describe('Agenda fixa', () => {
    it('salva e devolve a agenda da igreja', async () => {
      const res = await salvarAgenda(A.adminToken, AGENDA);
      expect(res.statusCode).toBe(200);

      const lista = JSON.parse(
        (await req(app, 'GET', '/v1/settings/service-schedules', A.adminToken))
          .body,
      );
      expect(lista).toHaveLength(3);
      expect(lista[0].name).toBe('Culto de ensino');
      expect(lista[2].note).toBe('Ceia no 1º domingo');
    });

    it('substitui a agenda inteira (não acumula duplicado)', async () => {
      await salvarAgenda(A.adminToken, AGENDA);
      await salvarAgenda(A.adminToken, [
        { weekday: 6, time: '20:00', name: 'Vigília' },
      ]);
      const lista = JSON.parse(
        (await req(app, 'GET', '/v1/settings/service-schedules', A.adminToken))
          .body,
      );
      expect(lista).toHaveLength(1);
      expect(lista[0].name).toBe('Vigília');
    });

    it('recusa horário e dia inválidos', async () => {
      expect(
        (await salvarAgenda(A.adminToken, [
          { weekday: 2, time: '25:00', name: 'Culto' },
        ])).statusCode,
      ).toBe(400);
      expect(
        (await salvarAgenda(A.adminToken, [
          { weekday: 9, time: '19:00', name: 'Culto' },
        ])).statusCode,
      ).toBe(400);
    });

    it('o membro do portal vê a agenda na tela inicial', async () => {
      await salvarAgenda(A.adminToken, AGENDA);
      const home = JSON.parse(
        (await req(app, 'GET', '/v1/member-auth/home', A.memberToken)).body,
      );
      expect(home.schedules).toHaveLength(3);
      expect(home.schedules[0].time).toBe('19:30');
    });

    it('a agenda de uma igreja não vaza para a outra', async () => {
      await salvarAgenda(A.adminToken, AGENDA);
      const B = await criarIgreja(app, 'Igreja B');

      const daB = JSON.parse(
        (await req(app, 'GET', '/v1/settings/service-schedules', B.adminToken))
          .body,
      );
      expect(daB).toHaveLength(0);

      const homeB = JSON.parse(
        (await req(app, 'GET', '/v1/member-auth/home', B.memberToken)).body,
      );
      expect(homeB.schedules).toHaveLength(0);
    });

    it('membro do portal não altera a agenda (rota é do painel)', async () => {
      const res = await salvarAgenda(A.memberToken, AGENDA);
      expect(res.statusCode).toBe(401);
    });
  });

  describe('Evento no portal', () => {
    // 1x1 PNG — imagem válida mínima.
    const PNG =
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

    async function criarEvento(token: string, nome: string, comFoto = true) {
      const res = await req(app, 'POST', '/v1/events', token, {
        name: nome,
        description: 'Pregação: Pr. Roberto\nTema: Família',
        date: new Date(Date.now() + 86400000).toISOString(),
        location: 'Judeia - sede',
        ...(comFoto ? { photo: PNG } : {}),
      });
      return JSON.parse(res.body);
    }

    it('devolve o evento com descrição e URL da foto (sem base64)', async () => {
      const criado = await criarEvento(A.adminToken, 'Encontro de casais');
      const res = await req(
        app,
        'GET',
        `/v1/member-auth/events/${criado.id}`,
        A.memberToken,
      );
      expect(res.statusCode).toBe(200);

      const evento = JSON.parse(res.body);
      expect(evento.name).toBe('Encontro de casais');
      expect(evento.description).toContain('Pregação');
      expect(evento.photoUrl).toContain(`/public/events/${criado.id}/photo`);
      // A imagem NUNCA pode viajar dentro do JSON da tela.
      expect(res.body).not.toContain('iVBORw0KGgo');
    });

    it('a listagem da tela inicial já traz a URL da foto', async () => {
      await criarEvento(A.adminToken, 'Festividade da igreja');
      const home = JSON.parse(
        (await req(app, 'GET', '/v1/member-auth/home', A.memberToken)).body,
      );
      expect(home.events).toHaveLength(1);
      expect(home.events[0].photoUrl).toContain('/public/events/');
      expect(home.events[0].photo).toBeUndefined();
    });

    it('evento sem foto vem com photoUrl nulo', async () => {
      const criado = await criarEvento(A.adminToken, 'Reunião', false);
      const evento = JSON.parse(
        (
          await req(
            app,
            'GET',
            `/v1/member-auth/events/${criado.id}`,
            A.memberToken,
          )
        ).body,
      );
      expect(evento.photoUrl).toBeNull();
    });

    it('membro não abre evento de OUTRA igreja', async () => {
      const criado = await criarEvento(A.adminToken, 'Só da igreja A');
      const B = await criarIgreja(app, 'Igreja B');
      const res = await req(
        app,
        'GET',
        `/v1/member-auth/events/${criado.id}`,
        B.memberToken,
      );
      expect(res.statusCode).toBe(404);
    });

    it('exige estar logado', async () => {
      const criado = await criarEvento(A.adminToken, 'Evento');
      const res = await req(
        app,
        'GET',
        `/v1/member-auth/events/${criado.id}`,
        undefined,
      );
      expect(res.statusCode).toBe(401);
    });
  });
});

/**
 * "Estou orando por você" no mural. O risco aqui é privacidade: um pedido
 * PRIVADO (que só a liderança vê) jamais pode ser alcançado por essa rota.
 */
describe('Estou orando (mural de oração)', () => {
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

  async function criarPedido(token: string, isPublic: boolean, title = 'Pelos enfermos') {
    const res = await req(app, 'POST', '/v1/member-auth/prayers', token, {
      title,
      description: 'Oremos crendo no milagre.',
      isPublic,
    });
    return JSON.parse(res.body);
  }

  function orar(token: string, prayerId: string) {
    return req(app, 'POST', `/v1/member-auth/prayers/${prayerId}/praying`, token);
  }

  function mural(token: string) {
    return req(app, 'GET', '/v1/member-auth/prayers/shared', token);
  }

  /** Outro membro aprovado da MESMA igreja. */
  async function outroMembro() {
    const prisma = prismaOf(app);
    const bcrypt = await import('bcryptjs');
    const email = 'outro@teste.local';
    await prisma.member.create({
      data: {
        churchId: A.churchId,
        name: 'Outro Irmão',
        email,
        passwordHash: await bcrypt.hash('Senha@12345', 4),
        portalStatus: 'APPROVED',
        status: 'ACTIVE',
      },
    });
    const res = await req(app, 'POST', '/v1/member-auth/login', undefined, {
      slug: A.slug,
      email,
      password: 'Senha@12345',
    });
    return JSON.parse(res.body).accessToken as string;
  }

  it('soma e desfaz o "estou orando"', async () => {
    const pedido = await criarPedido(A.memberToken, true);
    const outro = await outroMembro();

    const res1 = JSON.parse((await orar(outro, pedido.id)).body);
    expect(res1).toEqual({ prayingCount: 1, iAmPraying: true });

    const res2 = JSON.parse((await orar(outro, pedido.id)).body);
    expect(res2).toEqual({ prayingCount: 0, iAmPraying: false });
  });

  it('não conta duas vezes o mesmo membro', async () => {
    const pedido = await criarPedido(A.memberToken, true);
    const outro = await outroMembro();
    await orar(outro, pedido.id);
    await orar(outro, pedido.id); // desfaz
    await orar(outro, pedido.id); // refaz
    const lista = JSON.parse((await mural(A.memberToken)).body);
    expect(lista[0].prayingCount).toBe(1);
  });

  it('o mural mostra ao autor quem está orando e marca o pedido como dele', async () => {
    const pedido = await criarPedido(A.memberToken, true);
    const outro = await outroMembro();
    await orar(outro, pedido.id);

    const doAutor = JSON.parse((await mural(A.memberToken)).body)[0];
    expect(doAutor.isMine).toBe(true);
    expect(doAutor.prayingCount).toBe(1);
    expect(doAutor.iAmPraying).toBe(false);

    const doOutro = JSON.parse((await mural(outro)).body)[0];
    expect(doOutro.isMine).toBe(false);
    expect(doOutro.iAmPraying).toBe(true);
  });

  it('NÃO deixa orar em pedido privado (só a liderança vê)', async () => {
    const privado = await criarPedido(A.memberToken, false, 'Pedido reservado');
    const outro = await outroMembro();
    const res = await orar(outro, privado.id);
    expect(res.statusCode).toBe(404);
  });

  it('NÃO deixa orar em pedido de outra igreja', async () => {
    const pedido = await criarPedido(A.memberToken, true);
    const B = await criarIgreja(app, 'Igreja B');
    const res = await orar(B.memberToken, pedido.id);
    expect(res.statusCode).toBe(404);
  });

  it('exige estar logado', async () => {
    const pedido = await criarPedido(A.memberToken, true);
    const res = await req(
      app,
      'POST',
      `/v1/member-auth/prayers/${pedido.id}/praying`,
      undefined,
    );
    expect(res.statusCode).toBe(401);
  });
});
