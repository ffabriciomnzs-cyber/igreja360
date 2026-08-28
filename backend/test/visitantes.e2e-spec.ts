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
 * Visitantes.
 *
 * O cadastro é a ÚNICA rota pública de escrita do sistema — quem tem o
 * endereço pode gravar no banco. Por isso os testes aqui olham menos para o
 * caminho feliz e mais para o que um curioso conseguiria fazer com ela.
 */
describe('Visitantes', () => {
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

  const cadastrar = (dados: Record<string, unknown>, slug = A.slug) =>
    req(app, 'POST', `/v1/public/visitors/${slug}`, undefined, dados);

  const listar = (token = A.adminToken, status?: string) =>
    req(
      app,
      'GET',
      `/v1/visitors${status ? `?status=${status}` : ''}`,
      token,
    );

  describe('Cadastro pelo QR code (público)', () => {
    it('cadastra sem login e responde sem vazar dado de ninguém', async () => {
      const res = await cadastrar({
        name: 'Maria Visitante',
        phone: '(21) 99999-1111',
        howFound: 'Convite de um amigo',
        invitedBy: 'João',
        wantsVisit: true,
        prayerRequest: 'Orem pela minha família',
      });
      expect(res.statusCode).toBe(200);

      const corpo = JSON.parse(res.body);
      expect(corpo.message).toContain('Maria');
      // A resposta pública não pode devolver id nem lista de visitantes.
      expect(corpo.id).toBeUndefined();
      expect(Object.keys(corpo)).toEqual(['message']);

      const salvos = await prismaOf(app).visitor.findMany();
      expect(salvos).toHaveLength(1);
      expect(salvos[0].churchId).toBe(A.churchId);
      expect(salvos[0].status).toBe('NEW');
      expect(salvos[0].wantsVisit).toBe(true);
    });

    it('só o nome é obrigatório', async () => {
      expect((await cadastrar({ name: 'Só Nome' })).statusCode).toBe(200);
      expect((await cadastrar({ phone: '21999998888' })).statusCode).toBe(400);
      expect((await cadastrar({ name: 'A' })).statusCode).toBe(400);
    });

    it('recusa e-mail no campo nome e texto gigante', async () => {
      expect(
        (await cadastrar({ name: 'fulano@email.com' })).statusCode,
      ).toBe(400);
      expect(
        (await cadastrar({ name: 'Teste', prayerRequest: 'x'.repeat(501) }))
          .statusCode,
      ).toBe(400);
    });

    it('igreja inexistente não cria nada', async () => {
      const res = await cadastrar({ name: 'Ninguém' }, 'igreja-que-nao-existe');
      expect(res.statusCode).toBe(404);
      expect(await prismaOf(app).visitor.count()).toBe(0);
    });

    it('o cadastro público NÃO serve para ler visitantes', async () => {
      await cadastrar({ name: 'Maria Visitante', phone: '(21) 99999-1111' });
      // Sem token, nenhuma rota de leitura responde.
      expect((await req(app, 'GET', '/v1/visitors')).statusCode).toBe(401);
      expect(
        (await req(app, 'GET', '/v1/public/visitors/' + A.slug)).statusCode,
      ).toBe(404);
    });
  });

  describe('Acompanhamento no painel', () => {
    async function umVisitante(nome = 'Maria Visitante') {
      await cadastrar({ name: nome, phone: '(21) 99999-1111' });
      const lista = JSON.parse((await listar()).body);
      return lista[0];
    }

    it('registrar um contato move da fila de novos', async () => {
      const v = await umVisitante();
      expect(v.status).toBe('NEW');

      const res = await req(
        app,
        'POST',
        `/v1/visitors/${v.id}/follow-up`,
        A.adminToken,
        { note: 'Liguei, atendeu, vem no domingo' },
      );
      expect(res.statusCode).toBe(200);
      const atualizado = JSON.parse(res.body);
      expect(atualizado.status).toBe('CONTACTED');
      expect(atualizado.followUps).toHaveLength(1);
      expect(atualizado.followUps[0].note).toContain('Liguei');
    });

    it('converter cria o membro de verdade e guarda o histórico', async () => {
      const v = await umVisitante('Maria Aparecida Silva');
      const res = await req(
        app,
        'POST',
        `/v1/visitors/${v.id}/convert`,
        A.adminToken,
      );
      expect(res.statusCode).toBe(200);
      const { member } = JSON.parse(res.body);

      const membro = await prismaOf(app).member.findUnique({
        where: { id: member.id },
      });
      expect(membro?.name).toBe('Maria Aparecida Silva');
      expect(membro?.phone).toBe('(21) 99999-1111');
      expect(membro?.status).toBe('ACTIVE');

      // O visitante continua no histórico, agora marcado como membro.
      const visitante = await prismaOf(app).visitor.findUnique({
        where: { id: v.id },
      });
      expect(visitante?.status).toBe('MEMBER');
      expect(visitante?.memberId).toBe(member.id);
    });

    it('não converte duas vezes (não duplica o membro)', async () => {
      const v = await umVisitante();
      await req(app, 'POST', `/v1/visitors/${v.id}/convert`, A.adminToken);
      const segunda = await req(
        app,
        'POST',
        `/v1/visitors/${v.id}/convert`,
        A.adminToken,
      );
      expect(segunda.statusCode).toBe(400);
      expect(await prismaOf(app).member.count({ where: { name: 'Maria Visitante' } })).toBe(1);
    });

    it('os contadores refletem a fila real', async () => {
      await cadastrar({ name: 'Um Visitante', wantsVisit: true });
      await cadastrar({ name: 'Dois Visitante' });
      const stats = JSON.parse(
        (await req(app, 'GET', '/v1/visitors/stats', A.adminToken)).body,
      );
      expect(stats.novos).toBe(2);
      expect(stats.pediramVisita).toBe(1);
      expect(stats.ultimos30Dias).toBe(2);
    });
  });

  describe('Isolamento entre igrejas', () => {
    it('a igreja B não vê nem mexe no visitante da A', async () => {
      await cadastrar({ name: 'Maria Visitante', phone: '(21) 99999-1111' });
      const v = JSON.parse((await listar()).body)[0];
      const B = await criarIgreja(app, 'Igreja B');

      const listaB = JSON.parse((await listar(B.adminToken)).body);
      expect(listaB).toHaveLength(0);

      expect(
        (await req(app, 'GET', `/v1/visitors/${v.id}`, B.adminToken)).statusCode,
      ).toBe(404);
      expect(
        (
          await req(
            app,
            'POST',
            `/v1/visitors/${v.id}/convert`,
            B.adminToken,
          )
        ).statusCode,
      ).toBe(404);
      // Nenhum membro foi criado na igreja errada.
      expect(
        await prismaOf(app).member.count({ where: { churchId: B.churchId, name: 'Maria Visitante' } }),
      ).toBe(0);
    });

    it('membro do portal não acessa a fila de visitantes', async () => {
      expect((await listar(A.memberToken)).statusCode).toBe(401);
    });
  });
});
