// Service worker mínimo do Igreja360.
// Existe apenas para tornar o portal "instalável" (Android/Chrome oferece
// "Adicionar à tela inicial"). NÃO faz cache — deixa tudo passar pela rede,
// para evitar conteúdo desatualizado.
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
