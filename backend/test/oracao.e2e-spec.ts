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
 * Mural de oração da tela inicial. É conteúdo sensível: o pedido que o autor
 * NÃO compartilhou só pode ser visto pela liderança no painel. Um vazamento
 * aqui expõe a intimidade de gente de verdade — por isso cada regra tem teste.
 */
describe('Mural de oração (tela inicial)', () => {
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

  function mural(token: string) {
    return req(app, 'GET', '/v1/member-auth/prayers/shared', token);
  }

  function enviar(token: string, body: Record<string, unknown>) {
    return req(app, 'POST', '/v1/member-auth/prayers', token, body);
  }

  it('mostra o pedido compartilhado, com o primeiro nome do autor', async () => {
    await enviar(A.memberToken, {
      title: 'Pela saúde da minha mãe',
      description: 'Ela está internada.',
      isPublic: true,
    });

    const lista = JSON.parse((await mural(A.memberToken)).body);
    expect(lista).toHaveLength(1);
    expect(lista[0].title).toBe('Pela saúde da minha mãe');
    // criarIgreja cadastra "Membro Igreja A" → só o primeiro nome sai.
    expect(lista[0].authorName).toBe('Membro');
  });

  it('NÃO mostra pedido que o autor deixou privado', async () => {
    await enviar(A.memberToken, {
      title: 'Assunto delicado da minha família',
      isPublic: false,
    });

    const lista = JSON.parse((await mural(A.memberToken)).body);
    expect(lista).toHaveLength(0);
  });

  it('não mostra pedido já respondido/arquivado', async () => {
    await enviar(A.memberToken, { title: 'Por um emprego', isPublic: true });
    await prismaOf(app).prayer.updateMany({ data: { status: 'ANSWERED' } });

    const lista = JSON.parse((await mural(A.memberToken)).body);
    expect(lista).toHaveLength(0);
  });

  it('não mostra pedido de OUTRA igreja', async () => {
    const B = await criarIgreja(app, 'Igreja B');
    await enviar(B.memberToken, {
      title: 'Pedido da igreja B',
      isPublic: true,
    });

    const lista = JSON.parse((await mural(A.memberToken)).body);
    expect(lista).toHaveLength(0);
  });

  it('exige estar logado', async () => {
    const res = await req(app, 'GET', '/v1/member-auth/prayers/shared');
    expect(res.statusCode).toBe(401);
  });
});
