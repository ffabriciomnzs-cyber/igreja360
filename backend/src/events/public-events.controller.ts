import { Controller, Get, Param, Res } from '@nestjs/common';
import { FastifyReply } from 'fastify';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Serve o banner do evento como imagem de verdade, em endereço PÚBLICO.
 *
 * Por que público: o banner é material de divulgação — feito para circular em
 * grupo de WhatsApp, story, etc. Em troca, a imagem sai do JSON e passa a ser
 * cacheada pelo navegador, o que era o gargalo de performance.
 *
 * Este controller é DELIBERADAMENTE separado do EventsController, que tem
 * `@UseGuards(JwtAuthGuard, RolesGuard)` na classe. Aqui não há guarda, então
 * a separação deixa isso explícito — e garante que nenhuma rota administrativa
 * fique pública por descuido.
 *
 * ⚠️ Só banner de evento. Foto de membro e carteirinha contêm dado pessoal e
 * continuam exigindo login. Não estenda este controller para elas.
 */

/**
 * Formatos aceitos: só raster. **SVG está fora de propósito** — um SVG pode
 * conter <script> e, servido do nosso domínio, viraria XSS armazenado contra
 * quem abrisse a imagem.
 */
const MIMES_PERMITIDOS = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
]);

/** Aceita apenas `data:<mime>;base64,<dados>`, sem espaço nem parâmetro extra. */
const DATA_URL = /^data:([a-z]+\/[a-z0-9.+-]+);base64,([A-Za-z0-9+/=]+)$/;

@Controller('public/events')
export class PublicEventsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get(':id/photo')
  async photo(
    @Param('id') id: string,
    @Res() reply: FastifyReply,
  ): Promise<void> {
    const event = await this.prisma.event.findUnique({
      where: { id },
      select: { photo: true, photoUpdatedAt: true },
    });

    const match = event?.photo ? DATA_URL.exec(event.photo) : null;
    const mime = match?.[1];
    if (!match || !mime || !MIMES_PERMITIDOS.has(mime)) {
      // Mesma resposta para "não existe" e "formato recusado": não vale a pena
      // detalhar para quem não está autenticado.
      reply.code(404).send({ message: 'Imagem não encontrada.' });
      return;
    }

    const bytes = Buffer.from(match[2], 'base64');
    const etag = `"${event?.photoUpdatedAt?.getTime() ?? 0}-${bytes.length}"`;

    reply
      .header('Content-Type', mime)
      // A URL carrega ?v=<data da troca>, então o conteúdo desta URL nunca
      // muda: pode cachear por um ano. Trocar a foto gera outra URL.
      .header('Cache-Control', 'public, max-age=31536000, immutable')
      .header('ETag', etag)
      // O helmet marca tudo como `same-origin` por padrão, e o painel/portal
      // roda em outro domínio que a API — sem esta linha o navegador BLOQUEIA
      // a imagem (ERR_BLOCKED_BY_RESPONSE.NotSameOrigin). Aqui é intencional:
      // o banner é público. NÃO copie isto para respostas com dado privado.
      .header('Cross-Origin-Resource-Policy', 'cross-origin')
      // Defesa em profundidade: sem sniffing de tipo e sem executar nada,
      // caso algum dia um formato indevido escape da lista acima.
      .header('X-Content-Type-Options', 'nosniff')
      .header('Content-Security-Policy', "default-src 'none'; sandbox")
      .header('Content-Disposition', 'inline')
      .send(bytes);
  }
}
