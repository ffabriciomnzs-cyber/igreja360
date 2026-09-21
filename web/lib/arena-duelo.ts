import { memberApi } from './member-api';

export interface DesafioCriado {
  token: string;
  id: string;
  link: string;
  texto: string;
}

/** Cria o desafio e devolve o convite pronto — sem compartilhar nada ainda. */
export async function criaDesafio(
  base: string,
  meuNome: string,
  opponentId?: string,
): Promise<DesafioCriado> {
  const { data } = await memberApi.post<{ token: string; id: string }>(
    '/member-auth/arena/duels',
    opponentId ? { opponentId } : {},
  );
  const link = `${window.location.origin}${base}/arena/duelo/${data.token}`;
  return {
    ...data,
    link,
    texto: `⚔️ ${meuNome} te desafiou na Arena Bíblica! Aceita o desafio:\n${link}`,
  };
}

/**
 * Compartilha o convite. DEVE ser chamado direto de um toque.
 *
 * Aqui estava o bug: o app criava o desafio (uma ida à rede) e só então
 * chamava `navigator.share`. No iOS isso não funciona — a folha de
 * compartilhamento exige um toque "fresco", e a espera da rede consome essa
 * permissão, fazendo a chamada falhar em silêncio. Por isso criar e
 * compartilhar viraram dois gestos: o segundo botão nasce com a permissão
 * intacta.
 *
 * Devolve como terminou, para a tela poder dizer o que aconteceu — um botão
 * que não faz nada e não explica nada é pior do que um erro.
 */
export async function compartilha(
  convite: DesafioCriado,
): Promise<'compartilhado' | 'copiado' | 'cancelado' | 'falhou'> {
  if (navigator.share) {
    try {
      await navigator.share({ text: convite.texto });
      return 'compartilhado';
    } catch (err) {
      // Cancelar não é erro e não deve virar mensagem de falha.
      if ((err as { name?: string })?.name === 'AbortError') return 'cancelado';
    }
  }
  try {
    await navigator.clipboard.writeText(convite.texto);
    return 'copiado';
  } catch {
    return 'falhou';
  }
}

/** Sempre existe um caminho: o WhatsApp abre com o texto pronto. */
export function linkDoWhatsApp(convite: DesafioCriado): string {
  return `https://wa.me/?text=${encodeURIComponent(convite.texto)}`;
}
