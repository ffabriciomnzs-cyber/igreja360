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

  describe('Esqueci minha senha (tela de entrada)', () => {
    function pedir(identifier: string, slug?: string) {
      return req(app, 'POST', '/v1/member-auth/password-reset-request', undefined, {
        slug: slug ?? A.slug,
        identifier,
      });
    }

    function listar(token: string) {
      return req(app, 'GET', '/v1/members/portal/reset-requests', token);
    }

    it('cria o pedido e ele aparece para a secretaria', async () => {
      const res = await pedir(A.memberEmail);
      expect(res.statusCode).toBe(200);

      const lista = JSON.parse((await listar(A.adminToken)).body);
      expect(lista).toHaveLength(1);
      expect(lista[0].member.email).toBe(A.memberEmail);
    });

    it('acha o membro pelo telefone com formatação diferente', async () => {
      await prismaOf(app).member.update({
        where: { id: A.memberId },
        data: { phone: '(11) 97777-1234' },
      });
      const res = await pedir('5511977771234');
      expect(res.statusCode).toBe(200);

      const lista = JSON.parse((await listar(A.adminToken)).body);
      expect(lista).toHaveLength(1);
    });

    it('responde IGUAL para cadastro inexistente (sem vazar quem existe) e não cria pedido', async () => {
      const ok = await pedir(A.memberEmail);
      const fake = await pedir('nao-existe@teste.local');
      expect(fake.statusCode).toBe(200);
      expect(fake.body).toBe(ok.body);

      const lista = JSON.parse((await listar(A.adminToken)).body);
      expect(lista).toHaveLength(1); // só o pedido real
    });

    it('não duplica pedido pendente do mesmo membro', async () => {
      await pedir(A.memberEmail);
      await pedir(A.memberEmail);
      const lista = JSON.parse((await listar(A.adminToken)).body);
      expect(lista).toHaveLength(1);
    });

    it('gerar a senha temporária fecha o pedido', async () => {
      await pedir(A.memberEmail);
      const res = await req(
        app,
        'POST',
        `/v1/members/${A.memberId}/portal/reset-password`,
        A.adminToken,
      );
      expect(res.statusCode).toBe(201);

      const lista = JSON.parse((await listar(A.adminToken)).body);
      expect(lista).toHaveLength(0);
    });

    it('admin de outra igreja não vê os pedidos', async () => {
      await pedir(A.memberEmail);
      const B = await criarIgreja(app, 'Igreja B');
      const lista = JSON.parse((await listar(B.adminToken)).body);
      expect(lista).toHaveLength(0);
    });
  });
});
