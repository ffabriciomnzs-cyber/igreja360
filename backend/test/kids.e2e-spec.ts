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
 * Ministério infantil — o módulo mais sério do sistema.
 *
 * A pergunta que estes testes respondem é uma só: **alguém consegue levar
 * uma criança sem o código certo?** Tudo aqui gira em torno disso.
 */
describe('Kids — check-in seguro', () => {
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

  async function criaCrianca(
    nome = 'Sofia Menezes',
    extra: Record<string, unknown> = {},
    token = A.adminToken,
  ) {
    const res = await req(app, 'POST', '/v1/kids/children', token, {
      name: nome,
      guardians: [{ name: 'Maria Menezes', relation: 'mãe', phone: '21999990000' }],
      ...extra,
    });
    const lista = JSON.parse(res.body);
    return Array.isArray(lista)
      ? lista.find((c: { name: string }) => c.name === nome)
      : null;
  }

  const entregar = (childId: string, quem = 'Maria Menezes', token = A.adminToken) =>
    req(app, 'POST', '/v1/kids/checkin', token, {
      childId,
      checkedInBy: quem,
      room: 'Kids 1',
    });

  const retirar = (code: string, quem = 'Maria Menezes', token = A.adminToken) =>
    req(app, 'POST', '/v1/kids/checkout', token, { code, checkedOutBy: quem });

  describe('Cadastro', () => {
    it('exige pelo menos um responsável', async () => {
      const res = await req(app, 'POST', '/v1/kids/children', A.adminToken, {
        name: 'Criança Sem Responsável',
      });
      expect(res.statusCode).toBe(400);
      expect(res.body).toContain('responsável');
      expect(await prismaOf(app).child.count()).toBe(0);
    });

    it('guarda alergia e restrição de retirada', async () => {
      const c = await criaCrianca('Sofia Menezes', {
        notes: 'Alergia a amendoim',
        restrictions: 'O pai não pode retirar (decisão judicial)',
      });
      expect(c.notes).toBe('Alergia a amendoim');
      expect(c.restrictions).toContain('não pode retirar');
      expect(c.guardians).toHaveLength(1);
    });

    it('excluir NÃO apaga o histórico — apenas desativa', async () => {
      const c = await criaCrianca();
      await entregar(c.id);
      await req(app, 'DELETE', `/v1/kids/children/${c.id}`, A.adminToken);

      expect(await prismaOf(app).child.count()).toBe(1); // continua no banco
      expect(await prismaOf(app).kidsCheckin.count()).toBe(1); // registro mantido
      const lista = JSON.parse(
        (await req(app, 'GET', '/v1/kids/children', A.adminToken)).body,
      );
      expect(lista).toHaveLength(0); // some da tela
    });
  });

  describe('Entrega', () => {
    it('gera código de 4 dígitos e coloca a criança na sala', async () => {
      const c = await criaCrianca();
      const res = await entregar(c.id);
      expect(res.statusCode).toBe(200);

      const { code, childName, room } = JSON.parse(res.body);
      expect(code).toMatch(/^\d{4}$/);
      expect(childName).toBe('Sofia Menezes');
      expect(room).toBe('Kids 1');

      const hoje = JSON.parse(
        (await req(app, 'GET', '/v1/kids/today', A.adminToken)).body,
      );
      expect(hoje.inside).toHaveLength(1);
      expect(hoje.inside[0].checkedInBy).toBe('Maria Menezes');
      expect(hoje.left).toHaveLength(0);
    });

    it('exige saber quem está entregando', async () => {
      const c = await criaCrianca();
      const res = await req(app, 'POST', '/v1/kids/checkin', A.adminToken, {
        childId: c.id,
        checkedInBy: '',
      });
      expect(res.statusCode).toBe(400);
    });

    it('não entrega a mesma criança duas vezes sem retirar', async () => {
      const c = await criaCrianca();
      await entregar(c.id);
      const res = await entregar(c.id);
      expect(res.statusCode).toBe(400);
      expect(res.body).toContain('já está na sala');
      expect(await prismaOf(app).kidsCheckin.count()).toBe(1);
    });

    it('duas crianças na sala nunca ficam com o mesmo código', async () => {
      const codigos = new Set<string>();
      for (let i = 0; i < 12; i++) {
        const c = await criaCrianca(`Criança ${i}`);
        const { code } = JSON.parse((await entregar(c.id)).body);
        expect(codigos.has(code)).toBe(false);
        codigos.add(code);
      }
      expect(codigos.size).toBe(12);
    });
  });

  describe('Retirada — a trava de segurança', () => {
    it('CÓDIGO ERRADO NÃO LEVA A CRIANÇA', async () => {
      const c = await criaCrianca();
      const { code } = JSON.parse((await entregar(c.id)).body);
      const errado = code === '0000' ? '1111' : '0000';

      const res = await retirar(errado, 'Estranho Qualquer');
      expect(res.statusCode).toBe(400);
      expect(res.body).toContain('não confere');
      // A resposta não pode dar pista do código certo.
      expect(res.body).not.toContain(code);
      // E a criança continua na sala.
      const hoje = JSON.parse(
        (await req(app, 'GET', '/v1/kids/today', A.adminToken)).body,
      );
      expect(hoje.inside).toHaveLength(1);
      expect(hoje.left).toHaveLength(0);
    });

    it('código certo retira e registra quem levou', async () => {
      const c = await criaCrianca();
      const { code } = JSON.parse((await entregar(c.id)).body);

      const res = await retirar(code, 'Maria Menezes');
      expect(res.statusCode).toBe(200);
      expect(JSON.parse(res.body).childName).toBe('Sofia Menezes');

      const hoje = JSON.parse(
        (await req(app, 'GET', '/v1/kids/today', A.adminToken)).body,
      );
      expect(hoje.inside).toHaveLength(0);
      expect(hoje.left).toHaveLength(1);
      expect(hoje.left[0].checkedOutBy).toBe('Maria Menezes');
      expect(hoje.left[0].checkedOutAt).toBeTruthy();
    });

    it('o mesmo código não serve duas vezes', async () => {
      const c = await criaCrianca();
      const { code } = JSON.parse((await entregar(c.id)).body);
      await retirar(code);
      const segunda = await retirar(code, 'Outra Pessoa');
      expect(segunda.statusCode).toBe(400);
    });

    it('mostra a restrição de retirada para a equipe', async () => {
      const c = await criaCrianca('Sofia Menezes', {
        restrictions: 'O pai não pode retirar (decisão judicial)',
      });
      const { code } = JSON.parse((await entregar(c.id)).body);

      // Aparece na lista da sala...
      const hoje = JSON.parse(
        (await req(app, 'GET', '/v1/kids/today', A.adminToken)).body,
      );
      expect(hoje.inside[0].restrictions).toContain('não pode retirar');

      // ...e na confirmação da retirada.
      const res = await retirar(code);
      expect(JSON.parse(res.body).restrictions).toContain('não pode retirar');
    });

    it('exige saber quem está retirando', async () => {
      const c = await criaCrianca();
      const { code } = JSON.parse((await entregar(c.id)).body);
      const res = await retirar(code, '');
      expect(res.statusCode).toBe(400);
      const hoje = JSON.parse(
        (await req(app, 'GET', '/v1/kids/today', A.adminToken)).body,
      );
      expect(hoje.inside).toHaveLength(1);
    });
  });

  describe('Isolamento e acesso', () => {
    it('o código de uma igreja NÃO retira criança de outra', async () => {
      const c = await criaCrianca();
      const { code } = JSON.parse((await entregar(c.id)).body);
      const B = await criarIgreja(app, 'Igreja B');

      const res = await retirar(code, 'Alguém da B', B.adminToken);
      expect(res.statusCode).toBe(400);

      const hoje = JSON.parse(
        (await req(app, 'GET', '/v1/kids/today', A.adminToken)).body,
      );
      expect(hoje.inside).toHaveLength(1); // segue na sala
    });

    it('a igreja B não vê as crianças da A', async () => {
      await criaCrianca();
      const B = await criarIgreja(app, 'Igreja B');
      const lista = JSON.parse(
        (await req(app, 'GET', '/v1/kids/children', B.adminToken)).body,
      );
      expect(lista).toHaveLength(0);
    });

    it('membro do portal NÃO acessa nada do Kids', async () => {
      const c = await criaCrianca();
      expect(
        (await req(app, 'GET', '/v1/kids/children', A.memberToken)).statusCode,
      ).toBe(401);
      expect(
        (await req(app, 'GET', '/v1/kids/today', A.memberToken)).statusCode,
      ).toBe(401);
      expect((await entregar(c.id, 'Maria', A.memberToken)).statusCode).toBe(401);
    });
  });
});
