// ══ DIn Tracker — Service Worker ══
// Estratégia: cache-first para os arquivos do app (funciona 100% offline depois
// do primeiro carregamento), com atualização em segundo plano quando online.

const CACHE_NAME = 'din-tracker-v14';
const CORE_ASSETS = [
  './din_ufrj_tracker_13.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './icon-512-maskable.png',
];

// Instala e pré-cacheia os arquivos principais
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(CORE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Remove caches de versões antigas
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Cache-first: responde do cache imediatamente; busca na rede em paralelo
// para manter o cache atualizado (stale-while-revalidate simplificado)
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  event.respondWith(
    caches.match(req).then((cached) => {
      const networkFetch = fetch(req).then((res) => {
        if (res && res.status === 200) {
          const resClone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, resClone));
        }
        return res;
      }).catch(() => cached); // offline → usa cache

      return cached || networkFetch;
    })
  );
});

// Permite que a página force a ativação imediata de uma nova versão
self.addEventListener('message', (event) => {
  if (event.data === 'skipWaiting') self.skipWaiting();
});
