const CACHE_NAME = 'devoluciones-v29';

// Archivos a pre-cachear en la instalación
const PRECACHE_ASSETS = [
    'index.html',
    'css/styles.css',
    'css/components.css',
    'css/ui.css',
    'css/variables.css',
    'css/print.css',
    'js/app.js',
    'js/data.js',
    'js/auth.js',
    'js/supabase.js',
    'js/seed_data.js',
    'js/utils/ui.js',
    'js/utils/formatters.js',
    'js/utils/imageCompression.js',
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
    'js/views/admin/products.js',
    'js/views/admin/config.js',
    'js/views/admin/refacturacion.js',
    'logo-app.png'
    // NOTA: gerencia.html y js/gerencia.js se excluyen intencionalmente
    // para que siempre vayan a la red (informe en tiempo real).
];

// ─── INSTALL ──────────────────────────────────────────────────────────────────
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => cache.addAll(PRECACHE_ASSETS))
            .catch((err) => console.warn('SW: precache partial failure', err))
    );
    self.skipWaiting();
});

// ─── ACTIVATE ─────────────────────────────────────────────────────────────────
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
        )
    );
    self.clients.claim();

    // Notificar a los clientes que hay versión nueva
    self.clients.matchAll({ type: 'window' }).then(clients => {
        clients.forEach(client => client.postMessage({ type: 'RELOAD_PAGE' }));
    });
});

// ─── FETCH ────────────────────────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
    const url = event.request.url;

    // 1. Solo interceptar GET
    if (event.request.method !== 'GET') return;

    // 2. Dejar pasar sin intervención:
    //    - Supabase API
    //    - CDNs externos (fonts, chart.js, supabase-js)
    //    - La página de gerencia y su JS (siempre desde red, es un informe en vivo)
    const BYPASS = [
        'supabase.co',
        'fonts.googleapis.com',
        'fonts.gstatic.com',
        'cdn.jsdelivr.net',
        '/gerencia.html',
        '/js/gerencia.js'
    ];
    if (BYPASS.some(pattern => url.includes(pattern))) return;

    // 3. Para todo lo demás: Network-first → Cache fallback
    event.respondWith(
        fetch(event.request)
            .then((networkResponse) => {
                // Guardar copia fresca en caché si es válida
                if (networkResponse && networkResponse.status === 200) {
                    const clone = networkResponse.clone();
                    caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
                }
                return networkResponse;
            })
            .catch(() =>
                // Red no disponible → intentar caché
                caches.match(event.request).then(cached =>
                    cached || new Response('Sin conexión', {
                        status: 503,
                        headers: { 'Content-Type': 'text/plain; charset=utf-8' }
                    })
                )
            )
    );
});

// ─── NOTIFICATION CLICK ───────────────────────────────────────────────────────
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            const focused = clientList.find(c => c.focused) || clientList[0];
            if (focused) return focused.focus();
            return clients.openWindow('/');
        })
    );
});
