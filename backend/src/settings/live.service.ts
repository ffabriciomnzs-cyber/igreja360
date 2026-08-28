import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PushService } from '../push/push.service';

/**
 * Transmissão ao vivo.
 *
 * A igreja transmite pelo YouTube (que aguenta qualquer audiência de graça) e
 * o app só EMBUTE o player. Guardamos o link cru como veio e derivamos o
 * endereço de incorporação na hora de responder — assim, se o pastor colar um
 * link encurtado, um /live ou um endereço de estúdio, tudo funciona igual.
 */

/** Extrai o id do vídeo das formas que o YouTube usa. */
function idDoVideo(url: string): string | null {
  const limpo = url.trim();
  const padroes = [
    /[?&]v=([A-Za-z0-9_-]{6,})/, // youtube.com/watch?v=ID
    /youtu\.be\/([A-Za-z0-9_-]{6,})/, // youtu.be/ID
    /youtube\.com\/live\/([A-Za-z0-9_-]{6,})/, // youtube.com/live/ID
    /youtube\.com\/embed\/([A-Za-z0-9_-]{6,})/, // já embutido
    /youtube\.com\/shorts\/([A-Za-z0-9_-]{6,})/,
  ];
  for (const p of padroes) {
    const m = limpo.match(p);
    if (m) return m[1];
  }
  return null;
}

/** Canal (@handle ou /channel/ID) para transmissão contínua. */
function canalDoLink(url: string): string | null {
  const m =
    url.match(/youtube\.com\/(@[A-Za-z0-9_.-]+)/) ??
    url.match(/youtube\.com\/channel\/([A-Za-z0-9_-]+)/);
  return m ? m[1] : null;
}

export interface LivePayload {
  active: boolean;
  title: string | null;
  /** Endereço para o <iframe> dentro do app. */
  embedUrl: string | null;
  /** Link original, para o botão "abrir no YouTube". */
  watchUrl: string | null;
  startedAt: Date | null;
}

export function montaLive(church: {
  liveUrl: string | null;
  liveTitle: string | null;
  liveActive: boolean;
  liveStartedAt: Date | null;
}): LivePayload {
  if (!church.liveActive || !church.liveUrl) {
    return { active: false, title: null, embedUrl: null, watchUrl: null, startedAt: null };
  }
  const id = idDoVideo(church.liveUrl);
  const canal = !id ? canalDoLink(church.liveUrl) : null;

  let embedUrl: string | null = null;
  if (id) {
    embedUrl = `https://www.youtube.com/embed/${id}?rel=0&playsinline=1`;
  } else if (canal) {
    // Canal: o YouTube resolve sozinho qual é a transmissão do momento.
    embedUrl = canal.startsWith('@')
      ? `https://www.youtube.com/embed/live_stream?channel=&user=${encodeURIComponent(canal.slice(1))}`
      : `https://www.youtube.com/embed/live_stream?channel=${canal}`;
  }

  return {
    active: true,
    title: church.liveTitle,
    embedUrl,
    watchUrl: church.liveUrl,
    startedAt: church.liveStartedAt,
  };
}

@Injectable()
export class LiveService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly push: PushService,
  ) {}

  async get(churchId: string): Promise<LivePayload & { url: string | null }> {
    const church = await this.prisma.church.findUniqueOrThrow({
      where: { id: churchId },
      select: {
        liveUrl: true,
        liveTitle: true,
        liveActive: true,
        liveStartedAt: true,
      },
    });
    return { ...montaLive(church), url: church.liveUrl };
  }

  /**
   * Liga ou desliga a transmissão. Ao LIGAR (e só na transição), avisa a
   * igreja — ligar duas vezes por engano não manda duas notificações.
   */
  async set(
    churchId: string,
    dto: { url?: string; title?: string; active: boolean },
  ) {
    const atual = await this.prisma.church.findUniqueOrThrow({
      where: { id: churchId },
      select: { liveActive: true, liveUrl: true, name: true },
    });

    const url = (dto.url ?? atual.liveUrl ?? '').trim();
    if (dto.active) {
      if (!url) {
        throw new BadRequestException('Cole o link do YouTube antes de entrar ao vivo.');
      }
      if (!/^https?:\/\/(www\.)?(youtube\.com|youtu\.be)\//i.test(url)) {
        throw new BadRequestException(
          'Por enquanto aceitamos apenas link do YouTube.',
        );
      }
      if (!idDoVideo(url) && !canalDoLink(url)) {
        throw new BadRequestException(
          'Não reconheci esse link do YouTube. Use o link do vídeo ou do canal.',
        );
      }
    }

    const church = await this.prisma.church.update({
      where: { id: churchId },
      data: {
        liveUrl: url || null,
        liveTitle: dto.title?.trim() || null,
        liveActive: dto.active,
        liveStartedAt: dto.active && !atual.liveActive ? new Date() : undefined,
      },
      select: {
        liveUrl: true,
        liveTitle: true,
        liveActive: true,
        liveStartedAt: true,
      },
    });

    if (dto.active && !atual.liveActive) {
      void this.push
        .notifyChurch(
          churchId,
          '🔴 Estamos ao vivo!',
          dto.title?.trim() || 'A transmissão começou. Toque para assistir.',
          'worship',
        )
        .catch(() => undefined);
    }

    return { ...montaLive(church), url: church.liveUrl };
  }
}
