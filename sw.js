// VELANTRIM EITI — Service Worker v12.9.42
// Scope определяется динамически из self.location — работает на GitHub Pages и локально

var CACHE_NAME = 'eiti-v12.9.42';
// Определяем BASE динамически: папка где лежит sw.js
var BASE = self.location.pathname.replace(/sw\.js$/, '');

var CORE_FILES = [
    BASE,
    BASE + 'index.html',
    BASE + 'manifest.json',
    BASE + 'icon-192.png',
    BASE + 'icon-192-maskable.png',
    BASE + 'icon-512.png',
    BASE + 'icon-512-maskable.png'
];

// ── INSTALL: кэшируем ядро ──────────────────────────
self.addEventListener('install', function(e) {
    self.skipWaiting();
    e.waitUntil(
        caches.open(CACHE_NAME).then(function(cache) {
            return cache.addAll(CORE_FILES).catch(function(err) {
                console.warn('[SW] install cache error:', err);
            });
        })
    );
});

// ── ACTIVATE: удаляем старые кэши ───────────────────
self.addEventListener('activate', function(e) {
    e.waitUntil(
        caches.keys().then(function(keys) {
            return Promise.all(
                keys.filter(function(k) { return k !== CACHE_NAME; })
                    .map(function(k) { return caches.delete(k); })
            );
        }).then(function() {
            self.clients.claim();
            // Уведомляем клиентов об обновлении
            self.clients.matchAll().then(function(clients) {
                clients.forEach(function(client) {
                    client.postMessage({ type: 'SW_UPDATED', version: "12.9.42" });
                });
            });
        })
    );
});

// ── FETCH: network-first для HTML, cache-first для остального ──
self.addEventListener('fetch', function(e) {
    var url = e.request.url;

    // Пропускаем не-GET и внешние запросы (API, Telegram и т.д.)
    if (e.request.method !== 'GET') return;
    // Пропускаем всё что не в нашем origin — API-запросы к DeepSeek, OpenRouter, xAI и т.д.
    if (!url.startsWith(self.location.origin + BASE)) return;

    // HTML — всегда network-first (чтобы получать обновления)
    if (e.request.headers.get('accept') && e.request.headers.get('accept').indexOf('text/html') !== -1) {
        e.respondWith(
            fetch(e.request).then(function(resp) {
                var clone = resp.clone();
                caches.open(CACHE_NAME).then(function(cache) {
                    cache.put(e.request, clone);
                });
                return resp;
            }).catch(function() {
                return caches.match(e.request).then(function(cached) {
                    return cached || caches.match(BASE + 'index.html');
                });
            })
        );
        return;
    }

    // Остальное — cache-first
    e.respondWith(
        caches.match(e.request).then(function(cached) {
            if (cached) return cached;
            return fetch(e.request).then(function(resp) {
                if (resp && resp.status === 200) {
                    var clone = resp.clone();
                    caches.open(CACHE_NAME).then(function(cache) {
                        cache.put(e.request, clone);
                    });
                }
                return resp;
            });
        })
    );
});

// ── MESSAGE: принудительное обновление ──────────────
self.addEventListener('message', function(e) {
    if (e.data && e.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});
