/**
 * Minimal cache-first service worker.
 * Data itself lives in localStorage on the client, so this only
 * needs to cache the app shell for offline loading.
 */
const CACHE = 'today-app-v1';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './css/variables.css',
  './css/main.css',
  './css/components.css',
  './css/animations.css',
  './js/app.js',
  './js/utils/date.js',
  './js/utils/dom.js',
  './js/storage/localStorageAdapter.js',
  './js/storage/noteStorage.js',
  './js/components/noteCard.js',
  './js/components/noteEditor.js',
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});
