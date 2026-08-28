const CACHE = 'bistpicker-lab-v3';
const ASSETS = ['./', './index.html', './app.js', './manifest.json', './icon.svg'];

self.addEventListener('install', e => {
  // Yeni SW aktif olunca eski cache'leri sil, yeni ASSETS'i cache'le
  e.waitUntil(
    caches.keys().then(ks => Promise.all(ks.map(k => caches.delete(k))))
      .then(() => caches.open(CACHE).then(c => c.addAll(ASSETS)))
  );
  self.skipWaiting();
});
self.addEventListener('activate', e => {
  e.waitUntil(self.clients.claim());
});

// engine_v2_state.json: her zaman ağdan, başarısızsa cache
// HTML/JS/SVG: cache-first (offline), ağ başarısızsa cache'ten
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (url.pathname.endsWith('engine_v2_state.json')) {
    e.respondWith(fetch(e.request).then(r => {
      const cp = r.clone();
      caches.open(CACHE).then(c => c.put(e.request, cp));
      return r;
    }).catch(() => caches.match(e.request)));
  } else if (url.hostname === 'raw.githubusercontent.com') {
    // Manifest/state gibi uzak kaynaklar — ağ-first, başarısızsa cache
    e.respondWith(fetch(e.request).then(r => {
      const cp = r.clone();
      caches.open(CACHE).then(c => c.put(e.request, cp));
      return r;
    }).catch(() => caches.match(e.request)));
  } else {
    // Kendi dosyalarimiz: cache-first
    e.respondWith(caches.match(e.request).then(m => m || fetch(e.request)));
  }
});
