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
 * O teste mais importante do projeto: uma igreja NUNCA pode ler, alterar ou
 * apagar dado de outra. Vazamento aqui é irreversível — expõe PII (CPF,
 * endereço, telefone) de membros de terceiros.
 *
 * A estratégia é sempre a mesma: a igreja A cria um registro e a igreja B
 * tenta usá-lo pelo id. Toda tentativa tem que dar 404 (e não 200/204).
 */
describe('Isolamento entre igrejas (multi-tenant)', () => {
  let app: NestFastifyApplication;
  let A: IgrejaFixture;
  let B: IgrejaFixture;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await resetDb(prismaOf(app));
    A = await criarIgreja(app, 'Igreja A');
    B = await criarIgreja(app, 'Igreja B');
  });

  // [rota base, payload de criação] — o :id vem da resposta do POST.
  const recursos: [string, Record<string, unknown>][] = [
    ['/v1/events', { name: 'Evento da A', date: '2026-12-25T22:00:00.000Z' }],
    ['/v1/campaigns', { title: 'Campanha da A', type: 'Missões' }],
    ['/v1/worship', { title: 'Culto da A', date: '2026-12-25T22:00:00.000Z' }],
    ['/v1/cells', { name: 'Célula da A' }],
    [
      '/v1/communications',
      { title: 'Aviso da A', content: 'Conteudo do aviso' },
    ],
    // Dinheiro: a igreja B jamais pode enxergar o caixa da A.
    [
      '/v1/financial',
      {
        type: 'INCOME',
        category: 'Dízimo',
        amount: 1234.56,
        date: '2026-07-01T12:00:00.000Z',
      },
    ],
  ];

  describe.each(recursos)('%s', (rota, payload) => {
    let idDaA: string;

    beforeEach(async () => {
      const res = await req(app, 'POST', rota, A.adminToken, payload);
      expect([200, 201]).toContain(res.statusCode);
      idDaA = JSON.parse(res.body).id;
      expect(idDaA).toBeTruthy();
    });

    it('B não consegue LER o registro da A', async () => {
      const res = await req(app, 'GET', `${rota}/${idDaA}`, B.adminToken);
      expect(res.statusCode).toBe(404);
    });

    it('B não consegue ALTERAR o registro da A', async () => {
      // Corpo vazio de propósito: o que se testa é o acesso ao id de outra
      // igreja. Com campos inválidos a resposta seria 400 (validação) e o
      // teste passaria sem provar nada sobre isolamento.
      const res = await req(app, 'PATCH', `${rota}/${idDaA}`, B.adminToken, {});
      expect(res.statusCode).toBe(404);
    });

    it('B não consegue APAGAR o registro da A', async () => {
      const res = await req(app, 'DELETE', `${rota}/${idDaA}`, B.adminToken);
      expect(res.statusCode).toBe(404);

      // E o registro continua lá para a A — 404 não pode ser "apagou e mentiu".
      const ainda = await req(app, 'GET', `${rota}/${idDaA}`, A.adminToken);
      expect(ainda.statusCode).toBe(200);
    });

    it('a listagem da B não inclui nada da A', async () => {
      const res = await req(app, 'GET', rota, B.adminToken);
      expect(res.statusCode).toBe(200);
      expect(res.body).not.toContain(idDaA);
    });

    it('sem token, ninguém acessa', async () => {
      const res = await req(app, 'GET', rota);
      expect(res.statusCode).toBe(401);
    });
  });

  describe('/v1/members (dados pessoais)', () => {
    let membroDaA: string;

    beforeEach(async () => {
      const res = await req(app, 'POST', '/v1/members', A.adminToken, {
        name: 'Fulano da A',
        cpf: '12345678901',
        phone: '11999990000',
      });
      expect([200, 201]).toContain(res.statusCode);
      membroDaA = JSON.parse(res.body).id;
    });

    it('B não lê o membro da A', async () => {
      const res = await req(
        app,
        'GET',
        `/v1/members/${membroDaA}`,
        B.adminToken,
      );
      expect(res.statusCode).toBe(404);
    });

    it('B não emite a carteirinha do membro da A', async () => {
      const res = await req(
        app,
        'GET',
        `/v1/members/${membroDaA}/card`,
        B.adminToken,
      );
      expect(res.statusCode).toBe(404);
    });

    it('B não altera nem apaga o membro da A', async () => {
      const alterar = await req(
        app,
        'PATCH',
        `/v1/members/${membroDaA}`,
        B.adminToken,
        { name: 'invadido' },
      );
      expect(alterar.statusCode).toBe(404);

      const apagar = await req(
        app,
        'DELETE',
        `/v1/members/${membroDaA}`,
        B.adminToken,
      );
      expect(apagar.statusCode).toBe(404);
    });

    it('a listagem da B não traz o CPF de ninguém da A', async () => {
      const res = await req(app, 'GET', '/v1/members', B.adminToken);
      expect(res.statusCode).toBe(200);
      expect(res.body).not.toContain('12345678901');
      expect(res.body).not.toContain('Fulano da A');
    });
  });

  describe('Financeiro (valores não podem vazar)', () => {
    it('o resumo financeiro da B não soma nada da A', async () => {
      await req(app, 'POST', '/v1/financial', A.adminToken, {
        type: 'INCOME',
        category: 'Dízimo',
        amount: 9999.99,
        date: '2026-07-01T12:00:00.000Z',
      });

      // Os dois lados: se a A também não enxergasse o próprio valor, o
      // "não contém" da B passaria sem provar nada.
      const daA = await req(app, 'GET', '/v1/financial/stats', A.adminToken);
      expect(daA.statusCode).toBe(200);
      expect(daA.body).toContain('9999.99');

      const daB = await req(app, 'GET', '/v1/financial/stats', B.adminToken);
      expect(daB.statusCode).toBe(200);
      expect(daB.body).not.toContain('9999.99');
    });
  });

  describe('Portal do membro', () => {
    it('o membro da B não vê dados da A no início do portal', async () => {
      await req(app, 'POST', '/v1/communications', A.adminToken, { title: 'Aviso secreto da A', content: 'Conteudo do aviso' });

      const res = await req(app, 'GET', '/v1/member-auth/home', B.memberToken);
      expect(res.statusCode).toBe(200);
      expect(res.body).not.toContain('Aviso secreto da A');
    });

    it('token de membro não abre rota de administração', async () => {
      const res = await req(app, 'GET', '/v1/members', A.memberToken);
      expect(res.statusCode).toBe(401);
    });

    it('token de admin não abre rota do portal do membro', async () => {
      const res = await req(app, 'GET', '/v1/member-auth/me', A.adminToken);
      expect(res.statusCode).toBe(401);
    });
  });
});
