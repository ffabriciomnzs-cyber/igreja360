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
 * Banner de evento servido por URL pública. Dois riscos a travar:
 *  1) desempenho — o base64 não pode voltar a trafegar nas listagens;
 *  2) segurança — endpoint sem login não pode virar porta para XSS (SVG com
 *     script) nem servir imagem de membro.
 */
describe('Imagem de evento (URL pública)', () => {
  let app: NestFastifyApplication;
  let A: IgrejaFixture;

  // 1x1 PNG transparente, de verdade.
  const PNG_1X1 =
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
  const DATA_URL_PNG = `data:image/png;base64,${PNG_1X1}`;

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

  async function criarEvento(photo?: string) {
    const res = await req(app, 'POST', '/v1/events', A.adminToken, {
      name: 'Conferência',
      date: '2026-12-25T22:00:00.000Z',
      ...(photo ? { photo } : {}),
    });
    expect([200, 201]).toContain(res.statusCode);
    return JSON.parse(res.body);
  }

  describe('Desempenho: o base64 sai do JSON', () => {
    it('a listagem devolve photoUrl e NÃO o base64', async () => {
      await criarEvento(DATA_URL_PNG);

      const res = await req(app, 'GET', '/v1/events', A.adminToken);
      expect(res.statusCode).toBe(200);
      // O dado pesado não pode estar na resposta.
      expect(res.body).not.toContain('data:image');
      expect(res.body).not.toContain(PNG_1X1);

      const evento = JSON.parse(res.body).data[0];
      expect(evento.photo).toBeUndefined();
      expect(evento.photoUrl).toMatch(/^\/public\/events\/.+\/photo\?v=\d+$/);
    });

    it('o detalhe também não devolve o base64', async () => {
      const criado = await criarEvento(DATA_URL_PNG);
      const res = await req(
        app,
        'GET',
        `/v1/events/${criado.id}`,
        A.adminToken,
      );
      expect(res.body).not.toContain('data:image');
      expect(JSON.parse(res.body).photoUrl).toBeTruthy();
    });

    it('evento sem foto tem photoUrl nulo', async () => {
      const criado = await criarEvento();
      expect(criado.photoUrl).toBeNull();
    });
  });

  describe('Entrega da imagem', () => {
    it('serve os bytes da imagem, sem exigir login', async () => {
      const criado = await criarEvento(DATA_URL_PNG);

      // Sem token de propósito: a URL é pública.
      const res = await req(app, 'GET', `/v1${criado.photoUrl}`);
      expect(res.statusCode).toBe(200);
      expect(res.headers['content-type']).toBe('image/png');
      // Bytes reais do PNG (assinatura \x89PNG).
      expect(res.rawPayload.subarray(0, 4).toString('binary')).toBe('\x89PNG');
      expect(res.rawPayload.length).toBe(
        Buffer.from(PNG_1X1, 'base64').length,
      );
    });

    it('manda o navegador cachear (é o ganho de velocidade)', async () => {
      const criado = await criarEvento(DATA_URL_PNG);
      const res = await req(app, 'GET', `/v1${criado.photoUrl}`);
      expect(res.headers['cache-control']).toContain('max-age=31536000');
      expect(res.headers['cache-control']).toContain('immutable');
      expect(res.headers['etag']).toBeTruthy();
    });

    it('a URL muda quando a foto é trocada (não serve imagem velha)', async () => {
      const criado = await criarEvento(DATA_URL_PNG);
      const antes = criado.photoUrl;

      // Espera 1ms para o timestamp mudar de valor.
      await new Promise((r) => setTimeout(r, 5));
      const res = await req(app, 'PATCH', `/v1/events/${criado.id}`, A.adminToken, {
        photo: `data:image/jpeg;base64,${Buffer.from('outra').toString('base64')}`,
      });
      expect(res.statusCode).toBe(200);
      expect(JSON.parse(res.body).photoUrl).not.toBe(antes);
    });

    it('remover a foto zera a photoUrl', async () => {
      const criado = await criarEvento(DATA_URL_PNG);
      const res = await req(app, 'PATCH', `/v1/events/${criado.id}`, A.adminToken, {
        photo: '',
      });
      expect(JSON.parse(res.body).photoUrl).toBeNull();

      const img = await req(app, 'GET', `/v1${criado.photoUrl}`);
      expect(img.statusCode).toBe(404);
    });

    it('salvar sem mandar photo preserva a imagem', async () => {
      const criado = await criarEvento(DATA_URL_PNG);
      // A tela só envia `photo` quando o usuário troca a imagem.
      const res = await req(app, 'PATCH', `/v1/events/${criado.id}`, A.adminToken, {
        name: 'Conferência (novo nome)',
      });
      expect(res.statusCode).toBe(200);
      expect(JSON.parse(res.body).photoUrl).toBeTruthy();
    });

    it('404 para evento inexistente', async () => {
      const res = await req(app, 'GET', '/v1/public/events/nao-existe/photo');
      expect(res.statusCode).toBe(404);
    });
  });

  describe('Segurança', () => {
    it('RECUSA servir SVG (poderia conter script = XSS no nosso domínio)', async () => {
      const prisma = prismaOf(app);
      const svg = Buffer.from(
        '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>',
      ).toString('base64');

      const criado = await criarEvento(DATA_URL_PNG);
      // Simula alguém tendo conseguido gravar um SVG na coluna.
      await prisma.event.update({
        where: { id: criado.id },
        data: { photo: `data:image/svg+xml;base64,${svg}` },
      });

      const res = await req(app, 'GET', `/v1${criado.photoUrl}`);
      expect(res.statusCode).toBe(404);
      expect(res.body).not.toContain('script');
    });

    it('RECUSA conteúdo que não seja imagem (ex.: HTML)', async () => {
      const prisma = prismaOf(app);
      const criado = await criarEvento(DATA_URL_PNG);
      await prisma.event.update({
        where: { id: criado.id },
        data: {
          photo: `data:text/html;base64,${Buffer.from('<h1>oi</h1>').toString('base64')}`,
        },
      });

      const res = await req(app, 'GET', `/v1${criado.photoUrl}`);
      expect(res.statusCode).toBe(404);
    });

    it('permite que outro domínio EXIBA a imagem (painel e API são domínios diferentes)', async () => {
      // Sem Cross-Origin-Resource-Policy: cross-origin, o helmet marca a
      // resposta como same-origin e o navegador bloqueia a imagem com
      // ERR_BLOCKED_BY_RESPONSE.NotSameOrigin. Já aconteceu de verdade.
      const criado = await criarEvento(DATA_URL_PNG);
      const res = await req(app, 'GET', `/v1${criado.photoUrl}`);
      expect(res.headers['cross-origin-resource-policy']).toBe('cross-origin');
    });

    it('envia cabeçalhos que impedem execução do conteúdo', async () => {
      const criado = await criarEvento(DATA_URL_PNG);
      const res = await req(app, 'GET', `/v1${criado.photoUrl}`);
      expect(res.headers['x-content-type-options']).toBe('nosniff');
      expect(String(res.headers['content-security-policy'])).toContain(
        "default-src 'none'",
      );
    });

    it('a rota pública NÃO expõe outros dados do evento', async () => {
      const criado = await criarEvento(DATA_URL_PNG);
      const res = await req(app, 'GET', `/v1${criado.photoUrl}`);
      // Só a imagem: nada de nome, local, churchId...
      expect(res.body).not.toContain('Conferência');
      expect(res.body).not.toContain(A.churchId);
    });

    it('a listagem de eventos continua exigindo login', async () => {
      // O endpoint público é só a imagem; o resto do módulo segue protegido.
      const res = await req(app, 'GET', '/v1/events');
      expect(res.statusCode).toBe(401);
    });
  });
});
