const CACHE_NAME = 'devoluciones-v26';
const ASSETS = [
    '/',
    'index.html',
    'css/styles.css',
    'css/components.css',
    'css/ui.css',
    'css/variables.css',
    'js/app.js',
    'js/data.js',
    'js/auth.js',
    'js/supabase.js',
    'js/seed_data.js',
    'js/utils/ui.js',
    'js/utils/formatters.js',
    'js/views/login.js',
    'js/views/admin.js',
    'js/views/auxiliar.js',
    'js/views/auxiliar/dashboard.js',
    'js/views/auxiliar/form.js',
    'js/views/auxiliar/resale.js',
    'js/views/admin/dashboard.js',
    'js/views/admin/history.js',
    'js/views/admin/reports.js',
    'js/views/admin/statistics.js',
    'js/views/admin/users.js',
    'js/views/admin/refacturacion.js',
    'logo-app.png'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('Caching assets...');
            return cache.addAll(ASSETS);
        })
    );
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
    self.clients.claim();
    
    // Broadcast reload to all clients after activation of NEW version
    self.clients.matchAll().then(clients => {
        clients.forEach(client => {
            client.postMessage({ type: 'RELOAD_PAGE' });
        });
    });
});

self.addEventListener('fetch', (event) => {
    // Skip external or special requests
    if (!event.request.url.startsWith('http')) return;
    if (event.request.url.includes('supabase.co')) return;

    // STRATEGY: Stale-While-Revalidate for most assets
    // This allows immediate load from cache but fetches update in background
    event.respondWith(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.match(event.request).then((cachedResponse) => {
                const fetchPromise = fetch(event.request).then((networkResponse) => {
                    // Cache the new version for next time
                    if (event.request.method === 'GET' && networkResponse.ok) {
                        cache.put(event.request, networkResponse.clone());
                    }
                    return networkResponse;
                }).catch(() => {
                    // Offline - nothing more we can do
                });

                // Return cached response immediately if available, or wait for network
                return cachedResponse || fetchPromise;
            });
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
