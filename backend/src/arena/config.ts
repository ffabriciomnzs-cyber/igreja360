/**
 * Números da Arena, num lugar só.
 *
 * Existiam dentro de arena.service.ts, mas as temporadas também precisam deles
 * e o serviço das temporadas é usado pela Arena — importar de um para o outro
 * fecharia um ciclo entre os módulos. Constante não tem por que participar
 * dessa discussão.
 */

export const PERGUNTAS_POR_DIA = 12;
export const PONTOS_POR_ACERTO = 10;

/** Cronômetro: o relógio é do servidor (ver arena.service.ts). */
export const SEGUNDOS_POR_PERGUNTA = 20;
/** Folga para a rede: sem ela, 4G ruim tiraria ponto de quem sabia. */
export const TOLERANCIA_MS = 3_000;

/** A exigência de rodada completa não vale para trás (ver arena.service.ts). */
export const RODADA_COMPLETA_A_PARTIR_DE = '2026-09-06';
