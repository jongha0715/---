// All thing — minimal service worker.
// Its only job is to exist (installable PWAs on Android/Chrome require one registered)
// and let the app open offline. It deliberately favors FRESH content over cached content:
// network-first, cache only as an offline fallback — an actively-updated app should never
// show a stale cached version just because a service worker got in the way.
//
// IMPORTANT: bump CACHE_NAME (v2 -> v3 -> ...) any time app.js/index.html changes, so old
// caches get thrown away on the next visit instead of silently lingering.
const CACHE_NAME = 'allthing-shell-v2';
const SHELL_FILES = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('message', (event) => {
  if(event.data === 'skipWaiting') self.skipWaiting();
});

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => Promise.allSettled(SHELL_FILES.map((f) => cache.add(f))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    fetch(event.request)
      .then((res) => {
        if (res && res.ok) {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        }
        return res;
      })
      .catch(() => caches.match(event.request))
  );
});

