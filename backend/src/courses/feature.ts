/**
 * Cursos ainda não liberados para a igreja.
 *
 * Esconder o menu não basta: enquanto a decisão não é tomada, a API também
 * não responde. "Desativado" precisa valer para quem chega pela porta dos
 * fundos, senão é só um botão escondido.
 *
 * Os TESTES ligam por variável de ambiente. Desligar uma funcionalidade não
 * pode significar parar de testá-la — senão ela apodrece em silêncio e, no
 * dia de ligar, ninguém sabe se ainda funciona.
 */
const LIGADO_PARA_A_IGREJA = false;

export const CURSOS_HABILITADO =
  LIGADO_PARA_A_IGREJA || process.env.CURSOS_FORCE === 'on';
