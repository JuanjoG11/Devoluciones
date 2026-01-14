const CACHE_NAME = 'devoluciones-v5';
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
    'https://cdn-icons-png.flaticon.com/512/2312/2312733.png'
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
});

self.addEventListener('fetch', (event) => {
    // Skip Supabase API calls
    if (event.request.url.includes('supabase.co')) return;

    event.respondWith(
        caches.match(event.request).then((response) => {
            return response || fetch(event.request).then((fetchRes) => {
                return caches.open(CACHE_NAME).then((cache) => {
                    // Cache new static assets on the fly
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
            // Fallback for navigation
            if (event.request.mode === 'navigate') {
                return caches.match('/index.html');
            }
        })
    );
});
