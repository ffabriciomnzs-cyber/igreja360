import { memberApi } from './member-api';

/**
 * Cria um duelo e abre o compartilhamento.
 *
 * Vive fora dos componentes porque o mesmo gesto existe em dois lugares: no
 * card de duelos e na tela de "rodada concluída" — que é onde o convite faz
 * mais sentido, logo depois de a pessoa jogar.
 */
export async function desafiarAlguem(
  base: string,
  meuNome: string,
): Promise<void> {
  const { data } = await memberApi.post<{ token: string }>(
    '/member-auth/arena/duels',
  );
  const link = `${window.location.origin}${base}/arena/duelo/${data.token}`;
  const texto = `⚔️ ${meuNome} te desafiou na Arena Bíblica! 5 perguntas, 20 segundos cada. Aceita? ${link}`;
  if (navigator.share) {
    await navigator.share({ text: texto });
  } else {
    await navigator.clipboard.writeText(texto);
  }
}
