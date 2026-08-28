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
 * Inscrição em eventos com vagas. O ponto crítico é a ÚLTIMA VAGA: se duas
 * pessoas tocarem no botão ao mesmo tempo, só uma pode entrar — senão a
 * igreja recebe mais gente do que cabe no salão.
 */
describe('Inscrição em eventos', () => {
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

  const amanha = () => new Date(Date.now() + 86_400_000);

  async function criaEvento(capacity: number | null, quando = amanha()) {
    return prismaOf(app).event.create({
      data: {
        churchId: A.churchId,
        name: 'Encontro de casais',
        date: quando,
        capacity: capacity ?? undefined,
      },
    });
  }

  /** Cria um membro do portal com token, para simular várias pessoas. */
  async function membroComToken(nome: string) {
    const email = `${nome.toLowerCase().replace(/\W/g, '')}@teste.local`;
    await req(app, 'POST', '/v1/member-auth/register', undefined, {
      slug: A.slug,
      name: nome,
      email,
      password: 'Senha@12345',
    });
    await prismaOf(app).member.updateMany({
      where: { email },
      data: { portalStatus: 'APPROVED' },
    });
    const res = await req(app, 'POST', '/v1/member-auth/login', undefined, {
      slug: A.slug,
      email,
      password: 'Senha@12345',
    });
    return JSON.parse(res.body).accessToken as string;
  }

  const inscrever = (token: string, id: string) =>
    req(app, 'POST', `/v1/member-auth/events/${id}/register`, token, {});

  it('inscreve, mostra a vaga ocupada e não duplica em dois cliques', async () => {
    const ev = await criaEvento(10);

    const r1 = await inscrever(A.memberToken, ev.id);
    expect(r1.statusCode).toBe(200);
    const d1 = JSON.parse(r1.body);
    expect(d1.registered).toBe(true);
    expect(d1.registrations).toBe(1);
    expect(d1.spotsLeft).toBe(9);

    // Segundo clique (rede lenta, botão apertado duas vezes).
    const r2 = await inscrever(A.memberToken, ev.id);
    expect(r2.statusCode).toBe(200);
    expect(JSON.parse(r2.body).registrations).toBe(1);
    expect(await prismaOf(app).eventRegistration.count()).toBe(1);
  });

  it('cancelar libera a vaga', async () => {
    const ev = await criaEvento(2);
    await inscrever(A.memberToken, ev.id);
    const res = await req(
      app,
      'DELETE',
      `/v1/member-auth/events/${ev.id}/register`,
      A.memberToken,
    );
    expect(res.statusCode).toBe(200);
    const d = JSON.parse(res.body);
    expect(d.registered).toBe(false);
    expect(d.spotsLeft).toBe(2);
  });

  it('recusa quando as vagas acabam', async () => {
    const ev = await criaEvento(1);
    const outro = await membroComToken('Segunda Pessoa');

    expect((await inscrever(A.memberToken, ev.id)).statusCode).toBe(200);
    const res = await inscrever(outro, ev.id);
    expect(res.statusCode).toBe(400);
    expect(res.body).toContain('vagas');
    expect(await prismaOf(app).eventRegistration.count()).toBe(1);
  });

  it('ÚLTIMA VAGA: 5 pessoas ao mesmo tempo, só 1 entra', async () => {
    const ev = await criaEvento(1);
    const tokens = await Promise.all([
      membroComToken('Ana Um'),
      membroComToken('Bia Dois'),
      membroComToken('Caio Tres'),
      membroComToken('Davi Quatro'),
      membroComToken('Eva Cinco'),
    ]);

    // Todas as inscrições disparadas juntas, sem esperar uma pela outra.
    const respostas = await Promise.all(tokens.map((t) => inscrever(t, ev.id)));
    const aceitas = respostas.filter((r) => r.statusCode === 200).length;

    expect(aceitas).toBe(1);
    expect(await prismaOf(app).eventRegistration.count()).toBe(1);
  });

  it('evento sem limite de vagas aceita todo mundo', async () => {
    const ev = await criaEvento(null);
    const outro = await membroComToken('Sem Limite');
    expect((await inscrever(A.memberToken, ev.id)).statusCode).toBe(200);
    expect((await inscrever(outro, ev.id)).statusCode).toBe(200);
    const d = JSON.parse(
      (await req(app, 'GET', `/v1/member-auth/events/${ev.id}`, A.memberToken)).body,
    );
    expect(d.spotsLeft).toBeNull();
    expect(d.registrations).toBe(2);
  });

  it('recusa inscrição em evento que já passou', async () => {
    const ev = await criaEvento(10, new Date(Date.now() - 86_400_000));
    const res = await inscrever(A.memberToken, ev.id);
    expect(res.statusCode).toBe(400);
  });

  it('não inscreve em evento de OUTRA igreja', async () => {
    const ev = await criaEvento(10);
    const B = await criarIgreja(app, 'Igreja B');
    const res = await inscrever(B.memberToken, ev.id);
    expect(res.statusCode).toBe(404);
    expect(await prismaOf(app).eventRegistration.count()).toBe(0);
  });
});
