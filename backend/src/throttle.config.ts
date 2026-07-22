/**
 * Limites de requisição. Os padrões são os valores de PRODUÇÃO — as variáveis
 * de ambiente existem para que a suíte de testes, que faz dezenas de logins
 * seguidos, não seja barrada pela própria defesa que ela deveria proteger.
 *
 * Nunca afrouxe isso em produção: 10 logins/min por IP é o que impede um
 * atacante de varrer milhares de senhas.
 */
export const THROTTLE_GLOBAL = {
  ttl: 60_000,
  limit: Number(process.env.THROTTLE_LIMIT ?? 200),
};

export const THROTTLE_LOGIN = {
  default: {
    ttl: 60_000,
    limit: Number(process.env.THROTTLE_LOGIN_LIMIT ?? 10),
  },
};
