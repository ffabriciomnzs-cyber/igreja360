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
 * Troca de senha do portal (pelo próprio membro) e redefinição pelo admin.
 * Senha é a porta de entrada: erro aqui vira conta invadida ou membro
 * trancado para fora — por isso cobrimos também o isolamento entre igrejas.
 */
describe('Senha do portal do membro', () => {
  let app: NestFastifyApplication;
  let A: IgrejaFixture;

  const SENHA_ATUAL = 'Senha@12345'; // a que criarIgreja cadastra

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

  function trocar(token: string, atual: string, nova: string) {
    return req(app, 'PATCH', '/v1/member-auth/password', token, {
      currentPassword: atual,
      newPassword: nova,
    });
  }

  function login(senha: string) {
    return req(app, 'POST', '/v1/member-auth/login', undefined, {
      slug: A.slug,
      email: A.memberEmail,
      password: senha,
    });
  }

  describe('Troca pelo próprio membro', () => {
    it('troca a senha: a antiga para de valer e a nova entra', async () => {
      const res = await trocar(A.memberToken, SENHA_ATUAL, 'NovaSenha@99');
      expect(res.statusCode).toBe(200);

      expect((await login(SENHA_ATUAL)).statusCode).toBe(401);
      expect((await login('NovaSenha@99')).statusCode).toBe(200);
    });

    it('recusa quando a senha atual está errada', async () => {
      const res = await trocar(A.memberToken, 'chute-errado', 'NovaSenha@99');
      expect(res.statusCode).toBe(401);
      // Nada mudou: a senha original continua valendo.
      expect((await login(SENHA_ATUAL)).statusCode).toBe(200);
    });

    it('recusa nova senha curta demais', async () => {
      const res = await trocar(A.memberToken, SENHA_ATUAL, '12345');
      expect(res.statusCode).toBe(400);
    });

    it('recusa nova senha igual à atual', async () => {
      const res = await trocar(A.memberToken, SENHA_ATUAL, SENHA_ATUAL);
      expect(res.statusCode).toBe(400);
    });

    it('exige estar logado', async () => {
      const res = await req(app, 'PATCH', '/v1/member-auth/password', undefined, {
        currentPassword: SENHA_ATUAL,
        newPassword: 'NovaSenha@99',
      });
      expect(res.statusCode).toBe(401);
    });
  });

  describe('Redefinição pelo admin', () => {
    function redefinir(token: string, memberId: string) {
      return req(
        app,
        'POST',
        `/v1/members/${memberId}/portal/reset-password`,
        token,
      );
    }

    it('gera senha temporária que funciona no login (e derruba a antiga)', async () => {
      const res = await redefinir(A.adminToken, A.memberId);
      expect(res.statusCode).toBe(201);
      const { tempPassword } = JSON.parse(res.body);
      expect(tempPassword).toHaveLength(10);

      expect((await login(SENHA_ATUAL)).statusCode).toBe(401);
      expect((await login(tempPassword)).statusCode).toBe(200);
    });

    it('não redefine membro de OUTRA igreja', async () => {
      const B = await criarIgreja(app, 'Igreja B');
      const res = await redefinir(B.adminToken, A.memberId);
      expect(res.statusCode).toBe(404);
      // Senha do membro da igreja A permanece intacta.
      expect((await login(SENHA_ATUAL)).statusCode).toBe(200);
    });

    it('recusa quando o membro nunca criou acesso ao portal', async () => {
      const prisma = prismaOf(app);
      const semAcesso = await prisma.member.create({
        data: {
          churchId: A.churchId,
          name: 'Sem Portal',
          email: 'sem-portal@teste.local',
          status: 'ACTIVE',
        },
      });
      const res = await redefinir(A.adminToken, semAcesso.id);
      expect(res.statusCode).toBe(400);
    });

    it('membro comum não redefine senha de ninguém (rota é do painel)', async () => {
      const res = await redefinir(A.memberToken, A.memberId);
      expect(res.statusCode).toBe(401);
    });
  });
});
