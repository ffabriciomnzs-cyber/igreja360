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
 * Trilhas temáticas do devocional (7 dias). O conteúdo mora no app; o que o
 * servidor guarda — e o que pode dar errado — é a POSIÇÃO do membro: avançar
 * duas vezes no mesmo dia, passar do fim, ou uma igreja enxergar a outra.
 */
describe('Devocional — trilhas', () => {
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

  const devocional = (token: string) =>
    req(app, 'GET', '/v1/member-auth/devotional', token);

  const escolher = (token: string, trailId: string) =>
    req(app, 'POST', '/v1/member-auth/devotional/trail', token, { trailId });

  const concluir = (token: string) =>
    req(app, 'POST', '/v1/member-auth/devotional/complete', token);

  it('começa sem trilha', async () => {
    const res = await devocional(A.memberToken);
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body).trail).toBeNull();
  });

  it('escolhe uma trilha e ela volta no devocional', async () => {
    const res = await escolher(A.memberToken, 'ansiedade');
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body)).toMatchObject({
      id: 'ansiedade',
      position: 0,
      todayIndex: 0,
      length: 7,
      finished: false,
    });

    const dev = JSON.parse((await devocional(A.memberToken)).body);
    expect(dev.trail.id).toBe('ansiedade');
  });

  it('recusa trilha que não existe', async () => {
    const res = await escolher(A.memberToken, 'trilha-inventada');
    expect(res.statusCode).toBe(400);
  });

  it('concluir avança a trilha uma vez — e só uma por dia', async () => {
    await escolher(A.memberToken, 'paz');

    const primeira = JSON.parse((await concluir(A.memberToken)).body);
    expect(primeira.trail.position).toBe(1);
    // Já leu hoje: continua vendo a leitura de hoje, não a de amanhã.
    expect(primeira.trail.todayIndex).toBe(0);

    const segunda = JSON.parse((await concluir(A.memberToken)).body);
    expect(segunda.trail.position).toBe(1);
  });

  it('marca como concluída ao chegar no sétimo dia e não passa disso', async () => {
    const prisma = prismaOf(app);
    await escolher(A.memberToken, 'forca');
    // Simula os 6 primeiros dias já lidos, em dias anteriores.
    await prisma.memberDevotionalTrail.update({
      where: { memberId: A.memberId },
      data: { position: 6, lastDay: '2020-01-01' },
    });

    const fim = JSON.parse((await concluir(A.memberToken)).body);
    expect(fim.trail.position).toBe(7);
    expect(fim.trail.finished).toBe(true);

    // Um novo dia não empurra além do fim.
    await prisma.memberDevotionalTrail.update({
      where: { memberId: A.memberId },
      data: { lastDay: '2020-01-02' },
    });
    const depois = JSON.parse((await concluir(A.memberToken)).body);
    expect(depois.trail.position).toBe(7);
  });

  it('trocar de trilha recomeça do dia 1', async () => {
    await escolher(A.memberToken, 'gratidao');
    await concluir(A.memberToken);

    const nova = JSON.parse(
      (await escolher(A.memberToken, 'recomeco')).body,
    );
    expect(nova).toMatchObject({ id: 'recomeco', position: 0 });
  });

  it('sair da trilha volta ao devocional do dia', async () => {
    await escolher(A.memberToken, 'fe');
    const res = await req(
      app,
      'DELETE',
      '/v1/member-auth/devotional/trail',
      A.memberToken,
    );
    expect(res.statusCode).toBe(200);
    expect(JSON.parse((await devocional(A.memberToken)).body).trail).toBeNull();
  });

  it('a trilha é de cada membro — a de um não vaza para o outro', async () => {
    const B = await criarIgreja(app, 'Igreja B');
    await escolher(A.memberToken, 'ansiedade');

    const devB = JSON.parse((await devocional(B.memberToken)).body);
    expect(devB.trail).toBeNull();
  });

  it('exige estar logado', async () => {
    const res = await req(
      app,
      'POST',
      '/v1/member-auth/devotional/trail',
      undefined,
      { trailId: 'paz' },
    );
    expect(res.statusCode).toBe(401);
  });
});
