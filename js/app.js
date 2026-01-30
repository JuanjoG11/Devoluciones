import { initializeData } from './data.js';
import { auth } from './auth.js';
import { renderLogin } from './views/login.js';
import { renderAdminDashboard } from './views/admin.js';
import { renderAuxiliarDashboard } from './views/auxiliar.js';

const app = document.getElementById('app');

const init = async () => {
    window.auth = auth;
    window.handleLogout = () => auth.logout();

    // PWA Installation Handling
    window.deferredPrompt = null;
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        window.deferredPrompt = e;
        // console.log('✅ PWA Install Prompt disponible');
        window.dispatchEvent(new CustomEvent('pwa-installable'));
    });

    // Global Installer Banner Injector
    window.showPwaBanner = (selector = '#pwa-install-banner') => {
        const container = document.querySelector(selector);
        if (!container || !window.deferredPrompt) return;

        container.style.display = 'block';
        container.innerHTML = `
            <div style="background: #0070f3; color: white; padding: 16px; display: flex; align-items: center; justify-content: space-between; gap: 12px; box-shadow: 0 4px 12px rgba(0,112,243,0.3); position: relative; z-index: 1000; border-bottom: 2px solid rgba(255,255,255,0.1);">
                <div style="display: flex; align-items: center; gap: 12px;">
                    <div style="background: white; color: #0070f3; width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center;">
                        <span class="material-icons-round">download</span>
                    </div>
                    <div>
                        <div style="font-weight: 800; font-size: 14px; line-height: 1.2;">INSTALAR DevolucionesApp</div>
                        <div style="font-size: 11px; opacity: 0.9;">Usa la App desde tu menú de inicio</div>
                    </div>
                </div>
                <button id="pwa-install-btn-action" style="background: white; color: #0070f3; border: none; padding: 10px 20px; border-radius: 99px; font-weight: 800; font-size: 13px; cursor: pointer; text-transform: uppercase;">
                    Instalar YA
                </button>
            </div>
        `;

        document.getElementById('pwa-install-btn-action')?.addEventListener('click', async () => {
            const promptEvent = window.deferredPrompt;
            if (!promptEvent) return;
            promptEvent.prompt();
            const { outcome } = await promptEvent.userChoice;
            if (outcome === 'accepted') {
                window.deferredPrompt = null;
                container.style.display = 'none';
            }
        });
    };

    // 1. Check Auth and Render UI immediately
    checkAuthAndRender();

    // 2. Initialize Data and Sync in the background (NON-BLOCKING)
    initializeData().then(() => {
        // console.log("Background data initialization complete.");
    });
};

const checkAuthAndRender = () => {
    // Show Loading Spinner immediately to prevent UI freeze/ghosting
    app.innerHTML = `
        <div style="height: 100vh; display: flex; align-items: center; justify-content: center; background: #f8fafc;">
            <div style="text-align: center;">
                <div style="width: 40px; height: 40px; border: 4px solid #e2e8f0; border-top: 4px solid var(--primary-color); border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 16px;"></div>
                <h3 style="color: var(--primary-color); margin: 0;">Cargando...</h3>
            </div>
            <style>@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }</style>
        </div>
    `;

    const user = auth.getCurrentUser();
    if (!user) {
        app.classList.remove('admin-mode'); // Ensure admin-mode is off if not logged in
        renderLogin(app);
    } else {
        if (user.role === 'admin') {
            app.classList.add('admin-mode');
            renderAdminDashboard(app, user);
        } else { // user.role === 'auxiliar'
            app.classList.remove('admin-mode');
            renderAuxiliarDashboard(app, user);
        }
    }
};

// Event Listener for Navigation
window.addEventListener('navigate', (e) => {
    checkAuthAndRender();
});

// Initial Load
init();

// Service Worker Registration with Auto-Update
if ('serviceWorker' in navigator) {
    let refreshing = false;

    // Detect when a new service worker takes control
    navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (refreshing) return;
        // console.log('Nueva versión disponible en segundo plano.');
        // We no longer reload automatically to prevent data loss for auxiliaries
        window.updateAvailable = true;
    });

    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                // console.log('SW registered:', registration);

                // Check for updates every 60 seconds
                setInterval(() => {
                    registration.update();
                }, 60000);

                // Listen for messages from service worker
                navigator.serviceWorker.addEventListener('message', (event) => {
                    if (event.data && event.data.type === 'RELOAD_PAGE') {
                        window.location.reload();
                    }
                });
            })
            .catch(error => {
                console.log('SW registration failed:', error);
            });
    });
}
