import { Injectable, Logger } from '@nestjs/common';
import webpush from 'web-push';
import { PrismaService } from '../prisma/prisma.service';

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
}

/** Categorias que o membro pode ligar/desligar em Perfil → Notificações. */
export const NOTIFY_CATEGORIES = [
  'announcements',
  'worship',
  'events',
  'campaigns',
  'birthdays',
] as const;
export type NotifyCategory = (typeof NOTIFY_CATEGORIES)[number];

/** Prefs ausentes ou campo ausente = recebe (opt-out, não opt-in). */
function wantsCategory(prefs: unknown, category?: NotifyCategory): boolean {
  if (!category || !prefs || typeof prefs !== 'object') return true;
  const value = (prefs as Record<string, unknown>)[category];
  return value !== false;
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

  /** Preferências do membro, já com o padrão (tudo ligado) preenchido. */
  async getPrefs(memberId: string): Promise<Record<NotifyCategory, boolean>> {
    const member = await this.prisma.member.findUnique({
      where: { id: memberId },
      select: { notifyPrefs: true },
    });
    const saved = member?.notifyPrefs;
    return Object.fromEntries(
      NOTIFY_CATEGORIES.map((c) => [c, wantsCategory(saved, c)]),
    ) as Record<NotifyCategory, boolean>;
  }

  /** Grava as preferências. Só aceita as categorias conhecidas. */
  async setPrefs(
    memberId: string,
    patch: Partial<Record<NotifyCategory, boolean>>,
  ): Promise<Record<NotifyCategory, boolean>> {
    const atuais = await this.getPrefs(memberId);
    const novas = { ...atuais };
    for (const c of NOTIFY_CATEGORIES) {
      if (typeof patch[c] === 'boolean') novas[c] = patch[c];
    }
    await this.prisma.member.update({
      where: { id: memberId },
      data: { notifyPrefs: novas },
    });
    return novas;
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
    category?: NotifyCategory,
  ): Promise<void> {
    try {
      const church = await this.prisma.church.findUnique({
        where: { id: churchId },
        select: { slug: true },
      });
      await this.sendToChurch(
        churchId,
        {
          title,
          body,
          url: church?.slug ? `/portal/${church.slug}/inicio` : undefined,
        },
        category,
      );
    } catch {
      /* push é best-effort */
    }
  }

  async sendToChurch(
    churchId: string,
    payload: PushPayload,
    category?: NotifyCategory,
  ): Promise<void> {
    if (!this.configured) return;
    let subs = await this.prisma.pushSubscription.findMany({
      where: { churchId },
    });

    // Respeita quem desligou essa categoria em Perfil → Notificações.
    if (category && subs.length) {
      const members = await this.prisma.member.findMany({
        where: { id: { in: subs.map((s) => s.memberId) } },
        select: { id: true, notifyPrefs: true },
      });
      const optedOut = new Set(
        members
          .filter((m) => !wantsCategory(m.notifyPrefs, category))
          .map((m) => m.id),
      );
      subs = subs.filter((s) => !optedOut.has(s.memberId));
    }

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
