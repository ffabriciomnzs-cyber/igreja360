import { Injectable, Logger } from '@nestjs/common';
import webpush from 'web-push';
import { PrismaService } from '../prisma/prisma.service';

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
}

@Injectable()
export class PushService {
  private readonly logger = new Logger('PushService');
  private configured = false;
  private readonly publicKey: string;

  constructor(private readonly prisma: PrismaService) {
    const pub = process.env.VAPID_PUBLIC_KEY ?? '';
    const priv = process.env.VAPID_PRIVATE_KEY ?? '';
    const subject = process.env.VAPID_SUBJECT ?? 'mailto:contato@igreja360.app';
    this.publicKey = pub;
    if (pub && priv) {
      try {
        webpush.setVapidDetails(subject, pub, priv);
        this.configured = true;
      } catch (err) {
        this.logger.warn('VAPID inválido; push desativado.');
      }
    }
  }

  /** Chave pública VAPID (para o frontend inscrever o membro). Null se não configurado. */
  getPublicKey(): string | null {
    return this.configured ? this.publicKey : null;
  }

  async saveSubscription(
    churchId: string,
    memberId: string,
    sub: { endpoint: string; keys: { p256dh: string; auth: string } },
  ): Promise<void> {
    if (!sub?.endpoint || !sub.keys?.p256dh || !sub.keys?.auth) return;
    await this.prisma.pushSubscription.upsert({
      where: { endpoint: sub.endpoint },
      create: {
        churchId,
        memberId,
        endpoint: sub.endpoint,
        p256dh: sub.keys.p256dh,
        auth: sub.keys.auth,
      },
      update: { churchId, memberId, p256dh: sub.keys.p256dh, auth: sub.keys.auth },
    });
  }

  async removeSubscription(endpoint: string): Promise<void> {
    if (!endpoint) return;
    await this.prisma.pushSubscription
      .deleteMany({ where: { endpoint } })
      .catch(() => undefined);
  }

  /** Envia uma notificação para todos os membros inscritos da igreja. No-op se VAPID não configurado. */
  // Atalho para avisar a igreja sobre um novo registro (campanha, culto,
  // evento, aviso...). Resolve o link do portal e é best-effort: nunca lança,
  // para não quebrar a criação do registro caso o push falhe.
  async notifyChurch(
    churchId: string,
    title: string,
    body: string,
  ): Promise<void> {
    try {
      const church = await this.prisma.church.findUnique({
        where: { id: churchId },
        select: { slug: true },
      });
      await this.sendToChurch(churchId, {
        title,
        body,
        url: church?.slug ? `/portal/${church.slug}/inicio` : undefined,
      });
    } catch {
      /* push é best-effort */
    }
  }

  async sendToChurch(churchId: string, payload: PushPayload): Promise<void> {
    if (!this.configured) return;
    const subs = await this.prisma.pushSubscription.findMany({
      where: { churchId },
    });
    const body = JSON.stringify(payload);
    await Promise.all(
      subs.map((s) =>
        webpush
          .sendNotification(
            { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
            body,
          )
          .catch(async (err: { statusCode?: number }) => {
            // 404/410 = inscrição expirada/revogada → limpa
            if (err?.statusCode === 404 || err?.statusCode === 410) {
              await this.prisma.pushSubscription
                .delete({ where: { id: s.id } })
                .catch(() => undefined);
            }
          }),
      ),
    );
  }
}
