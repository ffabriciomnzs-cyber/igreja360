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
 * Transmissão ao vivo: o painel guarda o link do YouTube e o portal embute o
 * player. O link é colado por gente com pressa, minutos antes do culto — por
 * isso aceitamos as várias formas do YouTube e recusamos o resto com uma
 * mensagem clara em vez de mostrar tela preta para a igreja inteira.
 */
describe('Transmissão ao vivo', () => {
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

  const ligar = (url: string, title = 'Culto de domingo', token = A.adminToken) =>
    req(app, 'PUT', '/v1/settings/live', token, { url, title, active: true });

  const home = (token = A.memberToken) =>
    req(app, 'GET', '/v1/member-auth/home', token);

  it('aceita as várias formas de link do YouTube e gera o player', async () => {
    const casos: [string, string][] = [
      ['https://www.youtube.com/watch?v=abc123XYZ_-', 'abc123XYZ_-'],
      ['https://youtu.be/abc123XYZ_-', 'abc123XYZ_-'],
      ['https://www.youtube.com/live/abc123XYZ_-', 'abc123XYZ_-'],
      ['https://www.youtube.com/watch?v=abc123XYZ_-&t=42s', 'abc123XYZ_-'],
    ];
    for (const [url, id] of casos) {
      const res = await ligar(url);
      expect(res.statusCode).toBe(200);
      const d = JSON.parse(res.body);
      expect(d.active).toBe(true);
      expect(d.embedUrl).toContain(`/embed/${id}`);
      expect(d.watchUrl).toBe(url);
    }
  });

  it('aceita link de canal (transmissão contínua)', async () => {
    const res = await ligar('https://www.youtube.com/@igrejajudeia');
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body).embedUrl).toContain('live_stream');
  });

  it('recusa link que não é do YouTube', async () => {
    const res = await ligar('https://meusite.com/transmissao');
    expect(res.statusCode).toBe(400);
    expect(res.body).toContain('YouTube');
  });

  it('recusa entrar ao vivo sem link', async () => {
    const res = await req(app, 'PUT', '/v1/settings/live', A.adminToken, {
      url: '',
      active: true,
    });
    expect(res.statusCode).toBe(400);
  });

  it('o membro só vê a transmissão quando ela está ligada', async () => {
    // Desligada: nada aparece.
    let d = JSON.parse((await home()).body);
    expect(d.live.active).toBe(false);
    expect(d.live.embedUrl).toBeNull();

    await ligar('https://www.youtube.com/watch?v=abc123XYZ_-', 'Culto de gratidão');
    d = JSON.parse((await home()).body);
    expect(d.live.active).toBe(true);
    expect(d.live.title).toBe('Culto de gratidão');
    expect(d.live.embedUrl).toContain('/embed/abc123XYZ_-');

    // Encerrada: some da tela do membro.
    await req(app, 'PUT', '/v1/settings/live', A.adminToken, { active: false });
    d = JSON.parse((await home()).body);
    expect(d.live.active).toBe(false);
  });

  it('a transmissão de uma igreja NÃO aparece na outra', async () => {
    await ligar('https://www.youtube.com/watch?v=abc123XYZ_-');
    const B = await criarIgreja(app, 'Igreja B');
    const d = JSON.parse((await home(B.memberToken)).body);
    expect(d.live.active).toBe(false);
    expect(JSON.stringify(d)).not.toContain('abc123XYZ_-');
  });

  it('membro do portal não consegue ligar a transmissão', async () => {
    const res = await ligar(
      'https://www.youtube.com/watch?v=abc123XYZ_-',
      'x',
      A.memberToken,
    );
    expect(res.statusCode).toBe(401);
  });
});
