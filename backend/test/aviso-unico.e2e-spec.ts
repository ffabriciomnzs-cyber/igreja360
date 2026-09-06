import { NestFastifyApplication } from '@nestjs/platform-fastify';
import { createTestApp, criarIgreja, prismaOf, resetDb } from './helpers';
import { AnnounceService } from '../src/push/announce.service';
import { PushService } from '../src/push/push.service';

/**
 * Aviso pontual do deploy.
 *
 * O risco aqui é um só e é grave: mandar a mesma notificação duas vezes para a
 * igreja inteira. Acontece sozinho se a API reiniciar, se o deploy repetir ou
 * se houver duas réplicas. A trava tem que ser no banco, não na memória.
 */
describe('Aviso único do deploy', () => {
  let app: NestFastifyApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });
  afterAll(async () => {
    await app.close();
  });
  beforeEach(async () => {
    await resetDb(prismaOf(app));
  });

  it('envia uma vez e NUNCA repete, mesmo com a API reiniciando', async () => {
    await criarIgreja(app, 'Igreja A');
    const aviso = app.get(AnnounceService);
    const push = app.get(PushService);

    const enviados: string[] = [];
    jest
      .spyOn(push, 'notifyChurch')
      .mockImplementation(async (_c, titulo) => {
        enviados.push(titulo);
      });

    // Primeira subida da API.
    await aviso.onApplicationBootstrap();
    expect(enviados).toHaveLength(1);
    expect(enviados[0]).toContain('Arena');
    // Aviso de sistema NÃO vira comunicado: a mural da igreja é da liderança.
    expect(await prismaOf(app).communication.count()).toBe(0);

    // Reinício, deploy repetido, segunda réplica: nada de novo pode sair.
    await aviso.onApplicationBootstrap();
    await aviso.onApplicationBootstrap();
    expect(enviados).toHaveLength(1);
    expect(await prismaOf(app).communication.count()).toBe(0);
  });

  it('avisa cada igreja uma vez (uma instalação com mais de uma)', async () => {
    await criarIgreja(app, 'Igreja A');
    await criarIgreja(app, 'Igreja B');
    const aviso = app.get(AnnounceService);
    const push = app.get(PushService);

    const igrejasAvisadas: string[] = [];
    jest
      .spyOn(push, 'notifyChurch')
      .mockImplementation(async (churchId) => {
        igrejasAvisadas.push(churchId);
      });

    await aviso.onApplicationBootstrap();
    expect(new Set(igrejasAvisadas).size).toBe(2);
    expect(igrejasAvisadas).toHaveLength(2);
  });

  it('uma falha no envio NÃO derruba a subida da API', async () => {
    await criarIgreja(app, 'Igreja A');
    const aviso = app.get(AnnounceService);
    jest
      .spyOn(app.get(PushService), 'notifyChurch')
      .mockRejectedValue(new Error('push fora do ar'));

    // Se isto lançar, a API não sobe e a igreja fica sem sistema por um aviso.
    await expect(aviso.onApplicationBootstrap()).resolves.toBeUndefined();
  });
});
