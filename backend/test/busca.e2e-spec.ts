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
 * Busca global (⌘K). O maior risco é vazamento entre igrejas: a busca varre
 * seis tabelas de uma vez, então uma query sem churchId aqui exporia tudo.
 */
describe('Busca global', () => {
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

    const prisma = prismaOf(app);
    await prisma.member.create({
      data: {
        churchId: A.churchId,
        name: 'Zeferino Procurável',
        phone: '(11) 91234-5678',
        status: 'ACTIVE',
      },
    });
    await prisma.event.create({
      data: {
        churchId: A.churchId,
        name: 'Conferência Procurável',
        date: new Date('2026-12-25T22:00:00Z'),
      },
    });
    await prisma.cell.create({
      data: { churchId: A.churchId, name: 'Célula Procurável' },
    });
  });

  it('encontra por nome em vários módulos de uma vez', async () => {
    const res = await req(
      app,
      'GET',
      '/v1/search?q=procur%C3%A1vel',
      A.adminToken,
    );
    expect(res.statusCode).toBe(200);
    const hits = JSON.parse(res.body) as { type: string; title: string }[];
    const tipos = hits.map((h) => h.type).sort();
    expect(tipos).toEqual(['cell', 'event', 'member']);
  });

  it('encontra membro por telefone', async () => {
    const res = await req(app, 'GET', '/v1/search?q=91234', A.adminToken);
    const hits = JSON.parse(res.body) as { title: string }[];
    expect(hits.some((h) => h.title === 'Zeferino Procurável')).toBe(true);
  });

  it('a igreja B NÃO encontra nada da A', async () => {
    const res = await req(
      app,
      'GET',
      '/v1/search?q=procur%C3%A1vel',
      B.adminToken,
    );
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body)).toEqual([]);
  });

  it('exige autenticação', async () => {
    const res = await req(app, 'GET', '/v1/search?q=zeferino');
    expect(res.statusCode).toBe(401);
  });

  it('consulta curta demais devolve vazio (não varre o banco à toa)', async () => {
    for (const q of ['', 'a', '%20%20']) {
      const res = await req(app, 'GET', `/v1/search?q=${q}`, A.adminToken);
      expect(res.statusCode).toBe(200);
      expect(JSON.parse(res.body)).toEqual([]);
    }
  });

  it('não trata a consulta como curinga de SQL/regex', async () => {
    // '%' em SQL LIKE casaria com tudo; o Prisma deve escapar.
    const res = await req(app, 'GET', '/v1/search?q=%25%25', A.adminToken);
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body)).toEqual([]);
  });
});
