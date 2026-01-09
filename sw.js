const CACHE_NAME = 'devoluciones-v1';
const ASSETS = [
    '/',
    '/index.html',
    '/css/variables.css',
    '/css/styles.css',
    '/css/components.css',
    '/css/print.css',
    '/js/app.js',
    '/js/auth.js',
    '/js/supabase.js',
    '/js/data.js',
    '/js/views/login.js',
    '/js/views/admin.js',
    '/js/views/auxiliar.js',
    'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap',
    'https://fonts.googleapis.com/icon?family=Material+Icons+Round'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS);
        })
    );
});

self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then((response) => {
            return response || fetch(event.request);
        })
    );
});
