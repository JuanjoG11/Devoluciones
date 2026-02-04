const CACHE_NAME = 'devoluciones-v23'; // Updated: PWA Install Reliability Fix
const ASSETS = [
    '/',
    '/index.html',
    '/css/styles.css',
    '/css/components.css',
    '/css/ui.css',
    '/css/variables.css',
    '/js/app.js',
    '/js/data.js',
    '/js/auth.js',
    '/js/supabase.js',
    '/js/seed_data.js',
    '/js/utils/ui.js',
    '/js/utils/formatters.js',
    '/js/views/login.js',
    '/js/views/admin.js',
    '/js/views/auxiliar.js',
    '/js/views/auxiliar/dashboard.js',
    '/js/views/auxiliar/form.js',
    '/js/views/auxiliar/resale.js',
    '/js/views/admin/dashboard.js',
    '/js/views/admin/history.js',
    '/js/views/admin/reports.js',
    '/js/views/admin/statistics.js',
    '/js/views/admin/users.js',
    '/js/views/admin/refacturacion.js',
    '/logo-app.png'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('Caching assets...');
            return cache.addAll(ASSETS);
        })
    );
    // Force immediate activation
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
            );
        })
    );
    // Take control of all clients immediately
    self.clients.claim();

    // Notify all clients to reload
    self.clients.matchAll().then(clients => {
        clients.forEach(client => {
            client.postMessage({ type: 'RELOAD_PAGE' });
        });
    });
});

self.addEventListener('fetch', (event) => {
    if (!event.request.url.startsWith('http')) return;
    if (event.request.url.includes('supabase.co')) return;

    // Network-First strategy for index.html (ensure latest entry point)
    if (event.request.mode === 'navigate' || event.request.url.includes('index.html')) {
        event.respondWith(
            fetch(event.request)
                .then((response) => {
                    return caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, response.clone());
                        return response;
                    });
                })
                .catch(() => caches.match(event.request))
        );
        return;
    }

    event.respondWith(
        caches.match(event.request).then((response) => {
            return response || fetch(event.request).then((fetchRes) => {
                return caches.open(CACHE_NAME).then((cache) => {
                    if (event.request.method === 'GET' &&
                        (event.request.url.includes('.js') ||
                            event.request.url.includes('.css') ||
                            event.request.url.includes('.png'))) {
                        cache.put(event.request, fetchRes.clone());
                    }
                    return fetchRes;
                });
            });
        }).catch(() => {
            if (event.request.mode === 'navigate') {
                return caches.match('/index.html');
            }
        })
    );
});

// Windows PWA Standalone Notification Click Handler
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            if (clientList.length > 0) {
                let client = clientList[0];
                for (let i = 0; i < clientList.length; i++) {
                    if (clientList[i].focused) {
                        client = clientList[i];
                    }
                }
                return client.focus();
            }
            return clients.openWindow('/');
        })
    );
});
