// Notificações do PAINEL (pastor/secretaria/admin). O portal do membro tem o
// seu próprio arquivo (lib/push.ts) — a diferença é o endpoint e o token.
import { api } from './api';

export type AdminPushState =
  | 'unsupported'
  | 'ios-precisa-instalar'
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

function supported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
}

/**
 * No iPhone/iPad o Safari só expõe o PushManager depois que o site é
 * instalado na tela de início (iOS 16.4+).
 */
function precisaInstalarNoIos(): boolean {
  if (typeof window === 'undefined') return false;
  const ua = window.navigator.userAgent.toLowerCase();
  const isIOS =
    /iphone|ipad|ipod/.test(ua) ||
    (/macintosh/.test(ua) && navigator.maxTouchPoints > 1);
  if (!isIOS) return false;
  const instalado =
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as unknown as { standalone?: boolean }).standalone === true;
  return !instalado && !('PushManager' in window);
}

export async function getAdminPushState(): Promise<AdminPushState> {
  if (precisaInstalarNoIos()) return 'ios-precisa-instalar';
  if (!supported()) return 'unsupported';
  if (Notification.permission === 'denied') return 'denied';
  try {
    const reg = await navigator.serviceWorker.getRegistration();
    const sub = await reg?.pushManager.getSubscription();
    if (!sub) return 'available';
    // A inscrição do navegador pode ser do portal do membro (mesmo domínio):
    // só conta como ativa se o backend a reconhecer como do painel.
    const { data } = await api.post<{ subscribed: boolean }>('/push/status', {
      endpoint: sub.endpoint,
    });
    return data.subscribed ? 'subscribed' : 'available';
  } catch {
    return 'available';
  }
}

/** Pede permissão, inscreve o aparelho e registra no backend. */
export async function enableAdminPush(): Promise<AdminPushState> {
  if (precisaInstalarNoIos()) return 'ios-precisa-instalar';
  if (!supported()) return 'unsupported';

  const { data } = await api.get<{ key: string | null }>('/push/key');
  if (!data.key) {
    throw new Error('As notificações ainda não foram ativadas no servidor.');
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
  await api.post('/push/subscribe', {
    endpoint: sub.endpoint,
    keys: { p256dh: json.keys?.p256dh, auth: json.keys?.auth },
  });
  return 'subscribed';
}
