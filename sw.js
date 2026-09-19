const CACHE_NAME = 'smart-stash-v1';
const BASE = '/curio';

const PRECACHE_URLS = [
  BASE + '/',
  BASE + '/index.html',
  BASE + '/favicon.ico',
  BASE + '/manifest.json',
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Network-first for API calls, cache-first for static assets
  const url = new URL(event.request.url);
  
  if (event.request.method !== 'GET') return;

  // For navigation requests, serve index.html
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() =>
        caches.match(BASE + '/index.html')
      )
    );
    return;
  }

  // Cache-first for static assets (_expo bundles, fonts, icons)
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      });
    })
  );
});
