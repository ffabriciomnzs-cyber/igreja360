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
 * Trava o teto de tamanho de corpo (2 MB). Sem ele, um corpo gigante — por
 * exemplo uma imagem de dezenas de MB — infla o banco ou derruba o processo.
 * Uma foto ou banner legítimo fica bem abaixo do limite e passa.
 */
describe('Limite de tamanho de requisição', () => {
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

  it('aceita um evento com banner de tamanho realista (~400 KB)', async () => {
    const base64 = 'a'.repeat(400 * 1024); // ~400 KB, dentro do teto
    const res = await req(app, 'POST', '/v1/events', A.adminToken, {
      name: 'Evento com banner',
      date: '2026-12-25T22:00:00.000Z',
      photo: `data:image/jpeg;base64,${base64}`,
    });
    expect([200, 201]).toContain(res.statusCode);
  });

  it('rejeita um corpo acima do teto (~3 MB)', async () => {
    const base64 = 'a'.repeat(3 * 1024 * 1024); // ~3 MB, acima do teto
    const res = await req(app, 'POST', '/v1/events', A.adminToken, {
      name: 'Evento gigante',
      date: '2026-12-25T22:00:00.000Z',
      photo: `data:image/jpeg;base64,${base64}`,
    });
    // Fastify responde 413 (Payload Too Large) antes de tocar no banco.
    expect(res.statusCode).toBe(413);

    // E nada foi gravado.
    const eventos = await prismaOf(app).event.count({
      where: { churchId: A.churchId },
    });
    expect(eventos).toBe(0);
  });
});
