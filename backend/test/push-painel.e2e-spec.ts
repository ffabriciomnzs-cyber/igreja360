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
 * Notificações do PAINEL. O aparelho de quem administra a igreja se inscreve
 * na mesma tabela dos membros — o risco real é misturar as duas caixas
 * (secretaria recebendo aviso de devocional, ou membro recebendo pedido de
 * senha alheio). É isso que estes testes travam.
 */
describe('Push do painel', () => {
  let app: NestFastifyApplication;
  let A: IgrejaFixture;

  const APARELHO = {
    endpoint: 'https://push.exemplo/painel-1',
    keys: { p256dh: 'chave-publica', auth: 'segredo' },
  };

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

  function inscrever(token: string, body: unknown = APARELHO) {
    return req(app, 'POST', '/v1/push/subscribe', token, body);
  }

  it('inscreve o aparelho da conta do painel (com userId, sem memberId)', async () => {
    const res = await inscrever(A.adminToken);
    expect(res.statusCode).toBe(200);

    const sub = await prismaOf(app).pushSubscription.findFirstOrThrow({
      where: { endpoint: APARELHO.endpoint },
    });
    expect(sub.userId).toBeTruthy();
    expect(sub.memberId).toBeNull();
    expect(sub.churchId).toBe(A.churchId);
  });

  it('exige estar logado no painel', async () => {
    const res = await req(app, 'POST', '/v1/push/subscribe', undefined, APARELHO);
    expect(res.statusCode).toBe(401);
  });

  it('token de MEMBRO não serve para inscrever no painel', async () => {
    const res = await inscrever(A.memberToken);
    expect(res.statusCode).toBe(401);
  });

  it('o mesmo aparelho migra de membro para painel sem duplicar', async () => {
    // Primeiro o aparelho estava logado no portal do membro...
    const comoMembro = await req(
      app,
      'POST',
      '/v1/member-auth/push/subscribe',
      A.memberToken,
      APARELHO,
    );
    expect(comoMembro.statusCode).toBe(200);

    // ...e agora a secretaria entra no painel no MESMO aparelho.
    expect((await inscrever(A.adminToken)).statusCode).toBe(200);

    const subs = await prismaOf(app).pushSubscription.findMany({
      where: { endpoint: APARELHO.endpoint },
    });
    expect(subs).toHaveLength(1);
    expect(subs[0].userId).toBeTruthy();
    expect(subs[0].memberId).toBeNull(); // não recebe mais as da igreja toda
  });

  it('status responde se ESTE aparelho já está inscrito no painel', async () => {
    const antes = await req(app, 'POST', '/v1/push/status', A.adminToken, {
      endpoint: APARELHO.endpoint,
    });
    expect(JSON.parse(antes.body).subscribed).toBe(false);

    await inscrever(A.adminToken);

    const depois = await req(app, 'POST', '/v1/push/status', A.adminToken, {
      endpoint: APARELHO.endpoint,
    });
    expect(JSON.parse(depois.body).subscribed).toBe(true);
  });

  it('status não confunde aparelho de OUTRA conta do painel', async () => {
    await inscrever(A.adminToken);
    const B = await criarIgreja(app, 'Igreja B');
    const res = await req(app, 'POST', '/v1/push/status', B.adminToken, {
      endpoint: APARELHO.endpoint,
    });
    expect(JSON.parse(res.body).subscribed).toBe(false);
  });
});
