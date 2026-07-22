import type { NestFastifyApplication } from '@nestjs/platform-fastify';

/**
 * Aqui o rate limit fica no valor REAL (os outros arquivos o afrouxam para não
 * derrubar a própria suíte). É a defesa contra força bruta no login: sem ela,
 * um atacante testa milhares de senhas por minuto.
 *
 * O limite é lido na hora em que a aplicação é carregada (o @Throttle é um
 * decorator), por isso a variável é definida ANTES e o módulo é importado de
 * forma dinâmica — um `import` no topo seria içado e leria o valor errado.
 */
process.env.THROTTLE_LOGIN_LIMIT = '10';

describe('Rate limit do login', () => {
  let app: NestFastifyApplication;
  let req: typeof import('./helpers').req;

  beforeAll(async () => {
    const helpers = await import('./helpers');
    req = helpers.req;
    app = await helpers.createTestApp();
    await helpers.resetDb(helpers.prismaOf(app));
  });

  afterAll(async () => {
    await app.close();
  });

  it('bloqueia depois de 10 tentativas erradas no mesmo minuto', async () => {
    const codigos: number[] = [];
    for (let i = 0; i < 15; i++) {
      const res = await req(app, 'POST', '/v1/auth/login', undefined, {
        email: 'atacante@teste.local',
        password: `tentativa-${i}`,
      });
      codigos.push(res.statusCode);
    }

    expect(codigos).toContain(429);
    // Travou cedo: no máximo 10 tentativas chegam a ser avaliadas.
    expect(codigos.filter((c) => c === 401).length).toBeLessThanOrEqual(10);
    // E depois de travar, continua travado até a janela expirar.
    expect(codigos[14]).toBe(429);
  });
});
