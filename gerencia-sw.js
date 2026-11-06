// Service Worker para gerencia.html
// Su único propósito es desregistrarse a sí mismo y limpiar el caché
// para que la página de gerencia nunca quede bloqueada offline.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => {
    event.waitUntil(
        self.registration.unregister().then(() => self.clients.matchAll()).then(clients => {
            clients.forEach(c => c.navigate(c.url));
        })
    );
});
