const CACHE_NAME = 'devoluciones-kill-cache-v4';

self.addEventListener('install', (event) => {
    // Force immediate activation
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    // Delete ALL old caches to clear any corrupted state
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    console.log('Deleting cache:', cacheName);
                    return caches.delete(cacheName);
                })
            );
        })
    );
    self.clients.claim();
});

// fetch listener removed to disable all interception strategies.
// The app will behave like a normal website (Network Only).
