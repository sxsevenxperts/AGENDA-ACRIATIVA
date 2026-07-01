const CACHE_NAME = 'agenda-sobral-v5';
const ASSETS = [
  './',
  './index.html',
  './css/variables.css',
  './css/base.css',
  './css/components.css',
  './css/layout.css',
  './css/pages.css',
  './css/premium.css',
  './js/scraped_data.js',
  './js/data.js',
  './js/utils.js',
  './js/config.example.js',
  './js/supabaseClient.js',
  './js/storage.js',
  './js/auth.js',
  './js/scheduling.js',
  './js/admin.js',
  './js/app.js',
  './assets/logo.png',
  './assets/brasao-sobral.png',
  './assets/logo-sobral-light.png',
  './manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Estratégia network-first: sempre busca a versão mais recente e usa o
// cache apenas como fallback offline. Evita servir código desatualizado.
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then((fetchResponse) => {
        if (event.request.url.startsWith(self.location.origin) && fetchResponse.ok) {
          const clone = fetchResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return fetchResponse;
      })
      .catch(() =>
        caches.match(event.request).then((cached) => {
          if (cached) return cached;
          if (event.request.mode === 'navigate') return caches.match('./index.html');
          return Response.error();
        })
      )
  );
});
