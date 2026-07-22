import { memberApi } from './member-api';

export type PushState =
  | 'unsupported'
  | 'denied'
  | 'available'
  | 'subscribed';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}

export type PushEnvironment = 'ok' | 'ios-precisa-instalar';

/**
 * No iPhone/iPad o Safari só expõe o PushManager quando o site está instalado
 * na tela de início (iOS 16.4+). Sem isso o estado vira 'unsupported' e o
 * membro nunca receberia nada — por isso detectamos e mostramos como instalar.
 */
export function pushEnvironment(): PushEnvironment {
  if (typeof window === 'undefined') return 'ok';
  const ua = window.navigator.userAgent.toLowerCase();
  const isIOS =
    /iphone|ipad|ipod/.test(ua) ||
    // iPad moderno se anuncia como Mac; o toque o denuncia.
    (/macintosh/.test(ua) && navigator.maxTouchPoints > 1);
  if (!isIOS) return 'ok';

  const instalado =
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as unknown as { standalone?: boolean }).standalone === true;
  if (instalado) return 'ok';

  return 'PushManager' in window ? 'ok' : 'ios-precisa-instalar';
}

function supported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
}

export async function getPushState(): Promise<PushState> {
  if (!supported()) return 'unsupported';
  if (Notification.permission === 'denied') return 'denied';
  try {
    const reg = await navigator.serviceWorker.getRegistration();
    const sub = await reg?.pushManager.getSubscription();
    return sub ? 'subscribed' : 'available';
  } catch {
    return 'available';
  }
}

// Pede permissão, inscreve o navegador e envia a inscrição ao backend.
export async function enablePush(): Promise<PushState> {
  if (!supported()) return 'unsupported';

  const { data } = await memberApi.get<{ key: string | null }>(
    '/member-auth/push/key',
  );
  if (!data.key) {
    throw new Error('As notificações ainda não foram ativadas pela igreja.');
  }

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    return permission === 'denied' ? 'denied' : 'available';
  }

  const reg = await navigator.serviceWorker.register('/sw.js');
  await navigator.serviceWorker.ready;

  let sub = await reg.pushManager.getSubscription();
  if (!sub) {
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(data.key) as BufferSource,
    });
  }

  const json = sub.toJSON();
  await memberApi.post('/member-auth/push/subscribe', {
    endpoint: sub.endpoint,
    keys: { p256dh: json.keys?.p256dh, auth: json.keys?.auth },
  });
  return 'subscribed';
}
