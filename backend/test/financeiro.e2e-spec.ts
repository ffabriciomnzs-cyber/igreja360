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
 * Dinheiro precisa fechar exatamente. Estes testes cobrem a aritmética do
 * resumo (saldo = entradas − saídas), o arredondamento de centavos e a
 * validação de entrada. O isolamento entre igrejas já é coberto em
 * isolamento.e2e-spec.ts.
 */
describe('Financeiro', () => {
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

  function lancar(
    type: 'INCOME' | 'EXPENSE',
    amount: number,
    category = 'Geral',
  ) {
    return req(app, 'POST', '/v1/financial', A.adminToken, {
      type,
      category,
      amount,
      date: '2026-07-10T12:00:00.000Z',
    });
  }

  it('saldo = entradas − saídas, com centavos exatos', async () => {
    await lancar('INCOME', 1000.5, 'Dízimo');
    await lancar('INCOME', 250.25, 'Oferta');
    await lancar('EXPENSE', 300.75, 'Aluguel');

    const res = await req(app, 'GET', '/v1/financial/stats', A.adminToken);
    expect(res.statusCode).toBe(200);
    const s = JSON.parse(res.body);

    expect(s.income).toBeCloseTo(1250.75, 2);
    expect(s.expense).toBeCloseTo(300.75, 2);
    expect(s.balance).toBeCloseTo(950.0, 2);
  });

  it('soma muitos centavos sem erro de ponto flutuante', async () => {
    // 0.10 + 0.20 dá 0.30000000000000004 em float puro. O Decimal do banco
    // tem que entregar 0.30 certinho.
    await lancar('INCOME', 0.1);
    await lancar('INCOME', 0.2);

    const res = await req(app, 'GET', '/v1/financial/stats', A.adminToken);
    expect(JSON.parse(res.body).income).toBeCloseTo(0.3, 2);
  });

  it('começa zerado', async () => {
    const res = await req(app, 'GET', '/v1/financial/stats', A.adminToken);
    const s = JSON.parse(res.body);
    expect(s.income).toBe(0);
    expect(s.expense).toBe(0);
    expect(s.balance).toBe(0);
  });

  it('recusa valor zero ou negativo', async () => {
    expect((await lancar('INCOME', 0)).statusCode).toBe(400);
    expect((await lancar('INCOME', -50)).statusCode).toBe(400);
  });

  it('recusa mais de duas casas decimais', async () => {
    const res = await lancar('INCOME', 10.999);
    expect(res.statusCode).toBe(400);
  });

  it('recusa tipo inválido', async () => {
    const res = await req(app, 'POST', '/v1/financial', A.adminToken, {
      type: 'TRANSFER',
      category: 'X',
      amount: 10,
      date: '2026-07-10T12:00:00.000Z',
    });
    expect(res.statusCode).toBe(400);
  });

  it('exige autenticação', async () => {
    const res = await req(app, 'GET', '/v1/financial/stats');
    expect(res.statusCode).toBe(401);
  });

  it('excluir um lançamento recalcula o saldo', async () => {
    await lancar('INCOME', 500);
    const criar = await lancar('EXPENSE', 200);
    const despesaId = JSON.parse(criar.body).id;

    const del = await req(
      app,
      'DELETE',
      `/v1/financial/${despesaId}`,
      A.adminToken,
    );
    expect([200, 204]).toContain(del.statusCode);

    const res = await req(app, 'GET', '/v1/financial/stats', A.adminToken);
    expect(JSON.parse(res.body).balance).toBeCloseTo(500, 2);
  });
});
