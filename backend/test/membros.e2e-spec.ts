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
 * Cobre a anti-duplicidade de membros — onde já morou um bug real (o mesmo
 * membro aparecendo duas vezes) — e a mesclagem, que reatribui chaves
 * estrangeiras e apaga um cadastro. Erro aqui perde dado de gente de verdade.
 */
describe('Membros', () => {
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

  async function registrar(payload: Record<string, unknown>) {
    return req(app, 'POST', '/v1/member-auth/register', undefined, {
      slug: A.slug,
      ...payload,
    });
  }

  describe('Auto-cadastro (anti-duplicidade)', () => {
    it('vincula ao cadastro que a igreja já tinha, em vez de duplicar (por e-mail)', async () => {
      const prisma = prismaOf(app);
      const jaExiste = await prisma.member.create({
        data: {
          churchId: A.churchId,
          name: 'Maria Cadastrada',
          email: 'maria@teste.local',
          status: 'ACTIVE',
        },
      });

      const res = await registrar({
        name: 'Maria S.',
        email: 'maria@teste.local',
        password: 'SenhaDela@123',
      });
      expect([200, 201]).toContain(res.statusCode);

      // Continua sendo UM cadastro só, agora com senha e aguardando aprovação.
      const comEsseEmail = await prisma.member.findMany({
        where: { churchId: A.churchId, email: 'maria@teste.local' },
      });
      expect(comEsseEmail).toHaveLength(1);
      expect(comEsseEmail[0].id).toBe(jaExiste.id);
      expect(comEsseEmail[0].passwordHash).toBeTruthy();
      expect(comEsseEmail[0].portalStatus).toBe('PENDING');
    });

    it('reconhece a pessoa pelo TELEFONE mesmo com formatação diferente', async () => {
      const prisma = prismaOf(app);
      const jaExiste = await prisma.member.create({
        data: {
          churchId: A.churchId,
          name: 'João Telefone',
          phone: '(11) 98888-7777', // cadastrado pela igreja com máscara
          status: 'ACTIVE',
        },
      });

      // Mesmo número, digitado com +55 e sem máscara.
      const res = await registrar({
        name: 'João',
        email: 'joao@teste.local',
        phone: '5511988887777',
        password: 'SenhaDele@123',
      });
      expect([200, 201]).toContain(res.statusCode);

      const todos = await prisma.member.findMany({
        where: { churchId: A.churchId },
      });
      // Só o admin+membro da fixture e o João — nada duplicado.
      const joaos = todos.filter((m) => m.phone && m.name.includes('João'));
      expect(joaos).toHaveLength(1);
      expect(joaos[0].id).toBe(jaExiste.id);
      expect(joaos[0].email).toBe('joao@teste.local'); // preencheu o que faltava
    });

    it('não sobrescreve dados que a igreja já havia cadastrado', async () => {
      const prisma = prismaOf(app);
      await prisma.member.create({
        data: {
          churchId: A.churchId,
          name: 'Nome Oficial',
          email: 'pessoa@teste.local',
          phone: '(11) 97777-6666',
          status: 'ACTIVE',
        },
      });

      await registrar({
        name: 'Apelido Qualquer',
        email: 'pessoa@teste.local',
        phone: '11999990000', // telefone diferente
        password: 'Senha@123',
      });

      const m = await prisma.member.findFirst({
        where: { churchId: A.churchId, email: 'pessoa@teste.local' },
      });
      // O telefone original é preservado (não vira o novo).
      expect(m?.phone).toBe('(11) 97777-6666');
    });

    it('recusa novo cadastro quando já existe conta COM senha', async () => {
      await registrar({
        name: 'Primeiro',
        email: 'dono@teste.local',
        password: 'Senha@123',
      });
      const segundo = await registrar({
        name: 'Segundo',
        email: 'dono@teste.local',
        password: 'Outra@456',
      });
      expect(segundo.statusCode).toBe(400);
    });

    it('cria um novo cadastro quando ninguém corresponde', async () => {
      const prisma = prismaOf(app);
      const res = await registrar({
        name: 'Gente Nova',
        email: 'nova@teste.local',
        password: 'Senha@123',
      });
      expect([200, 201]).toContain(res.statusCode);
      const m = await prisma.member.findFirst({
        where: { churchId: A.churchId, email: 'nova@teste.local' },
      });
      expect(m?.portalStatus).toBe('PENDING');
      expect(m?.status).toBe('VISITOR');
    });
  });

  describe('Login por e-mail ou telefone', () => {
    beforeEach(async () => {
      // Aprova o cadastro para poder logar.
      const prisma = prismaOf(app);
      await registrar({
        name: 'Acesso',
        email: 'acesso@teste.local',
        phone: '(11) 96666-5555',
        password: 'MinhaSenha@123',
      });
      await prisma.member.updateMany({
        where: { email: 'acesso@teste.local' },
        data: { portalStatus: 'APPROVED' },
      });
    });

    async function login(identificador: string, senha: string) {
      return req(app, 'POST', '/v1/member-auth/login', undefined, {
        slug: A.slug,
        email: identificador,
        password: senha,
      });
    }

    it('entra pelo e-mail', async () => {
      const res = await login('acesso@teste.local', 'MinhaSenha@123');
      expect(res.statusCode).toBe(200);
      expect(JSON.parse(res.body).accessToken).toBeTruthy();
    });

    it('entra pelo telefone, com formatação diferente da cadastrada', async () => {
      const res = await login('5511966665555', 'MinhaSenha@123');
      expect(res.statusCode).toBe(200);
      expect(JSON.parse(res.body).accessToken).toBeTruthy();
    });

    it('recusa a senha errada', async () => {
      const res = await login('acesso@teste.local', 'errada');
      expect(res.statusCode).toBe(401);
    });
  });

  describe('Mesclar duplicados', () => {
    it('junta os dois cadastros preservando dados e atividade', async () => {
      const prisma = prismaOf(app);
      // keep: cadastro "pobre" (sem telefone/cidade). drop: tem os extras.
      const keep = await prisma.member.create({
        data: { churchId: A.churchId, name: 'Ana', email: 'ana@teste.local', status: 'VISITOR' },
      });
      const drop = await prisma.member.create({
        data: {
          churchId: A.churchId,
          name: 'Ana Maria',
          phone: '(11) 95555-4444',
          city: 'São Paulo',
          status: 'ACTIVE',
        },
      });
      // Atividade pendurada no drop: precisa migrar para o keep.
      await prisma.prayer.create({
        data: { churchId: A.churchId, memberId: drop.id, title: 'Oração da Ana' },
      });

      const res = await req(app, 'POST', '/v1/members/merge', A.adminToken, {
        keepId: keep.id,
        dropId: drop.id,
      });
      expect([200, 201]).toContain(res.statusCode);

      // O drop some.
      const dropAinda = await prisma.member.findUnique({ where: { id: drop.id } });
      expect(dropAinda).toBeNull();

      // O keep herda o que faltava e o status mais ativo.
      const final = await prisma.member.findUnique({ where: { id: keep.id } });
      expect(final?.phone).toBe('(11) 95555-4444');
      expect(final?.city).toBe('São Paulo');
      expect(final?.status).toBe('ACTIVE');

      // A oração foi reatribuída (não sumiu junto com o drop).
      const oracao = await prisma.prayer.findFirst({
        where: { title: 'Oração da Ana' },
      });
      expect(oracao?.memberId).toBe(keep.id);
    });

    it('não mescla cadastro de outra igreja', async () => {
      const prisma = prismaOf(app);
      const B = await criarIgreja(app, 'Igreja B');
      const meu = await prisma.member.create({
        data: { churchId: A.churchId, name: 'Meu', status: 'ACTIVE' },
      });
      const deB = await prisma.member.create({
        data: { churchId: B.churchId, name: 'Alheio', status: 'ACTIVE' },
      });

      const res = await req(app, 'POST', '/v1/members/merge', A.adminToken, {
        keepId: meu.id,
        dropId: deB.id, // membro de OUTRA igreja
      });
      expect(res.statusCode).toBe(404);

      // Nada foi apagado.
      expect(await prisma.member.findUnique({ where: { id: deB.id } })).not.toBeNull();
    });

    it('recusa mesclar um cadastro com ele mesmo', async () => {
      const prisma = prismaOf(app);
      const m = await prisma.member.create({
        data: { churchId: A.churchId, name: 'Solo', status: 'ACTIVE' },
      });
      const res = await req(app, 'POST', '/v1/members/merge', A.adminToken, {
        keepId: m.id,
        dropId: m.id,
      });
      expect(res.statusCode).toBe(400);
    });
  });
});

describe('Nome não pode ser e-mail (validação nos 3 caminhos)', () => {
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

  it('auto-cadastro do portal recusa e-mail no campo nome', async () => {
    const res = await req(app, 'POST', '/v1/member-auth/register', undefined, {
      slug: A.slug,
      name: 'fulano@teste.local',
      email: 'fulano@teste.local',
      password: 'Senha@123',
    });
    expect(res.statusCode).toBe(400);
    expect(res.body).toContain('nome');
  });

  it('edição de perfil recusa e-mail no campo nome', async () => {
    const res = await req(app, 'PATCH', '/v1/member-auth/profile', A.memberToken, {
      name: 'novo@email.com',
    });
    expect(res.statusCode).toBe(400);
  });

  it('cadastro pelo admin recusa e-mail no campo nome', async () => {
    const res = await req(app, 'POST', '/v1/members', A.adminToken, {
      name: 'pessoa@igreja.com',
    });
    expect(res.statusCode).toBe(400);
  });

  it('nomes normais continuam passando', async () => {
    const res = await req(app, 'POST', '/v1/members', A.adminToken, {
      name: "Maria D'Ávila de Souza",
    });
    expect([200, 201]).toContain(res.statusCode);
  });
});
