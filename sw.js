const CACHE_NAME = 'agenda-sobral-v4';
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

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        return response || fetch(event.request).then((fetchResponse) => {
          return caches.open(CACHE_NAME).then((cache) => {
            // Only cache valid responses from the same origin to avoid caching errors
            if (event.request.url.startsWith(self.location.origin) && fetchResponse.ok) {
              cache.put(event.request, fetchResponse.clone());
            }
            return fetchResponse;
          });
        });
      })
      .catch(() => {
        // Fallback for offline if something isn't in cache
        if (event.request.mode === 'navigate') {
          return caches.match('./index.html');
        }
      })
  );
});
