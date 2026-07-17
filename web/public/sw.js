// Service worker do Igreja360.
// - Torna o portal "instalável" (Android/Chrome oferece "Adicionar à tela").
// - Recebe notificações push (avisos da igreja) e trata o clique.
// NÃO faz cache — deixa tudo passar pela rede, para evitar conteúdo desatualizado.

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Handler de fetch presente (requisito de instalabilidade), sem interceptar.
self.addEventListener('fetch', () => {
  // passthrough: o navegador resolve normalmente pela rede
});

// Notificação push recebida (ex.: novo aviso da igreja).
self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    data = { title: 'Igreja360', body: event.data ? event.data.text() : '' };
  }
  const title = data.title || 'Igreja360';
  const options = {
    body: data.body || '',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    vibrate: [120, 60, 120],
    data: { url: data.url || '/' },
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

// Clique na notificação: abre/foca o portal na URL indicada.
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || '/';
  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientsArr) => {
        for (const client of clientsArr) {
          if ('focus' in client) {
            client.navigate(url);
            return client.focus();
          }
        }
        if (self.clients.openWindow) return self.clients.openWindow(url);
        return undefined;
      }),
  );
});
