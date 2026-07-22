import { NestFastifyApplication } from '@nestjs/platform-fastify';
import {
  createTestApp,
  criarIgreja,
  prismaOf,
  resetDb,
  req,
  IgrejaFixture,
} from './helpers';

describe('Autenticação', () => {
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

  it('recusa senha errada', async () => {
    const res = await req(app, 'POST', '/v1/auth/login', undefined, {
      email: A.adminEmail,
      password: 'senha-errada',
    });
    expect(res.statusCode).toBe(401);
  });

  it('recusa e-mail inexistente', async () => {
    const res = await req(app, 'POST', '/v1/auth/login', undefined, {
      email: 'ninguem@teste.local',
      password: 'Senha@12345',
    });
    expect(res.statusCode).toBe(401);
  });

  it('não revela se o e-mail existe (mesma mensagem nos dois casos)', async () => {
    const existe = await req(app, 'POST', '/v1/auth/login', undefined, {
      email: A.adminEmail,
      password: 'senha-errada',
    });
    const naoExiste = await req(app, 'POST', '/v1/auth/login', undefined, {
      email: 'ninguem@teste.local',
      password: 'senha-errada',
    });
    expect(JSON.parse(existe.body).message).toBe(
      JSON.parse(naoExiste.body).message,
    );
  });

  it('nunca devolve o hash da senha', async () => {
    const res = await req(app, 'POST', '/v1/auth/login', undefined, {
      email: A.adminEmail,
      password: 'Senha@12345',
    });
    expect(res.statusCode).toBe(200);
    expect(res.body).not.toContain('passwordHash');
    expect(res.body).not.toContain('$2a$');
    expect(res.body).not.toContain('$2b$');
  });

  it('recusa token adulterado', async () => {
    const res = await req(
      app,
      'GET',
      '/v1/members',
      A.adminToken.slice(0, -3) + 'aaa',
    );
    expect(res.statusCode).toBe(401);
  });

  it('recusa token assinado com outro segredo', async () => {
    // Token com payload válido mas assinatura de outro sistema.
    const falso =
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.' +
      'eyJzdWIiOiJxdWFscXVlciIsImNodXJjaElkIjoieCJ9.' +
      'assinatura-invalida';
    const res = await req(app, 'GET', '/v1/members', falso);
    expect(res.statusCode).toBe(401);
  });

  it('usuário desativado não entra', async () => {
    await prismaOf(app).user.updateMany({
      where: { email: A.adminEmail },
      data: { active: false },
    });
    const res = await req(app, 'POST', '/v1/auth/login', undefined, {
      email: A.adminEmail,
      password: 'Senha@12345',
    });
    expect(res.statusCode).toBe(401);
  });

  it('membro não entra na igreja errada, mesmo com a senha certa', async () => {
    const B = await criarIgreja(app, 'Igreja B');
    const res = await req(app, 'POST', '/v1/member-auth/login', undefined, {
      slug: B.slug, // igreja da B...
      email: A.memberEmail, // ...com membro da A
      password: 'Senha@12345',
    });
    expect(res.statusCode).toBe(401);
  });

  it('membro pendente de aprovação não entra', async () => {
    const prisma = prismaOf(app);
    await prisma.member.update({
      where: { id: A.memberId },
      data: { portalStatus: 'PENDING' },
    });
    const res = await req(app, 'POST', '/v1/member-auth/login', undefined, {
      slug: A.slug,
      email: A.memberEmail,
      password: 'Senha@12345',
    });
    expect(res.statusCode).not.toBe(200);
  });

  it('valida a entrada (campo desconhecido é rejeitado)', async () => {
    const res = await req(app, 'POST', '/v1/auth/login', undefined, {
      email: A.adminEmail,
      password: 'Senha@12345',
      role: 'ADMIN', // tentativa de escalar privilégio pelo corpo
    });
    expect(res.statusCode).toBe(400);
  });
});
