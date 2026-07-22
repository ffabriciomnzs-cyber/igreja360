// Variáveis que a aplicação exige para subir. Segredos de teste são fixos e
// descartáveis — nunca reaproveite em produção.
process.env.DATABASE_URL =
  process.env.TEST_DATABASE_URL ??
  'postgresql://postgres@127.0.0.1:55433/igreja360_test';
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.JWT_REFRESH_SECRET = 'test-jwt-refresh-secret';
process.env.CORS_ORIGIN = '*';
// VAPID fica desligado: o PushService vira no-op e nenhum teste tenta falar
// com servidores de push de verdade.
delete process.env.VAPID_PUBLIC_KEY;
delete process.env.VAPID_PRIVATE_KEY;

// Limites de requisição folgados: a suíte faz dezenas de logins seguidos.
// O rate-limit REAL é verificado em rate-limit.e2e-spec.ts, que define os
// seus próprios valores antes de carregar a aplicação.
process.env.THROTTLE_LIMIT = process.env.THROTTLE_LIMIT ?? '1000000';
process.env.THROTTLE_LOGIN_LIMIT = process.env.THROTTLE_LOGIN_LIMIT ?? '1000000';
