import { db } from '../data.js';
import { auth } from '../auth.js';
import { Alert } from '../utils/ui.js';

// Modular Sections
import { renderDashboard } from './auxiliar/dashboard.js';
import { renderForm } from './auxiliar/form.js';

/**
 * Auxiliary View Orchestrator
 */
export const renderAuxiliarDashboard = (container, user) => {
    container.classList.add('auxiliar-mode');

    // Internal State
    const state = {
        view: 'dashboard', // 'dashboard' or 'form'
        routeStarted: false,
        currentRouteId: null,
        lastFetch: 0
    };

    const render = async () => {
        try {
            // 1. Fetch current route and returns
            console.log("[auxiliar render] Fetching route for user:", user.id, user.username);
            const currentRoute = await db.getTodaysRoute(user.id);
            console.log("[auxiliar render] Current route:", currentRoute);
            state.routeStarted = !!currentRoute;
            state.currentRouteId = currentRoute ? currentRoute.id : null;
            console.log("[auxiliar render] Route started:", state.routeStarted, "Route ID:", state.currentRouteId);

            let returns = [];
            if (state.currentRouteId) {
                const remoteReturns = await db.getRouteReturns(state.currentRouteId);
                const pending = await db.getPendingReturns();

                // Deduplicate: Only add pending if it doesn't already exist in remote
                // Match by invoice + sheet + productCode
                const routePending = pending.filter(p => {
                    if (p.routeId !== state.currentRouteId) return false;
                    const isAlreadyRemote = remoteReturns.some(r =>
                        String(r.invoice || '').trim() === String(p.invoice || '').trim() &&
                        String(r.sheet || '').trim() === String(p.sheet || '').trim() &&
                        String(r.productCode || '').trim() === String(p.productCode || '').trim()
                    );
                    return !isAlreadyRemote;
                });

                returns = [...routePending.map(p => ({ ...p, pending: true })), ...remoteReturns];
            }

            // 2. Clear and Render based on view
            container.innerHTML = '';
            if (state.view === 'dashboard') {
                renderDashboard(container, user, state, returns, currentRoute, render, updateSyncUI);
            } else {
                renderForm(container, user, state, render);
            }

            // 3. Network listeners
            window.addEventListener('online', updateSyncUI);
            window.addEventListener('offline', updateSyncUI);

        } catch (err) {
            console.error("Auxiliar Render Error:", err);
            container.innerHTML = `<div class="card m-lg text-center"><h3>Error al cargar</h3><button onclick="location.reload()" class="btn btn-primary mt-md">Reintentar</button></div>`;
        }
    };

    // --- Sync & Network Logic ---
    const updateSyncUI = async () => {
        const banner = document.getElementById('offlineBanner');
        const syncStatus = document.getElementById('syncStatus');
        const isOnline = navigator.onLine;

        if (banner) banner.style.display = isOnline ? 'none' : 'flex';

        if (isOnline) {
            const pending = await db.getPendingReturns();
            if (pending.length > 0) {
                if (syncStatus) syncStatus.innerHTML = `<span class="material-icons-round rotating" style="font-size:12px; color:var(--accent-color)">sync</span> Sincronizando ${pending.length}...`;
                await triggerSync();
            } else if (syncStatus) {
                syncStatus.innerHTML = '<span class="material-icons-round" style="font-size:12px; color:var(--success-color)">cloud_done</span> Sincronizado';
            }
        } else if (syncStatus) {
            syncStatus.innerHTML = '<span class="material-icons-round" style="font-size:12px; color:#991b1b">cloud_off</span> Modo Offline';
        }
    };

    const triggerSync = async () => {
        if (!navigator.onLine) return;
        const count = await db.syncOfflineReturns();
        if (count > 0) {
            console.log(`Synced ${count} items`);
            await render(); // Refresh list after sync
        }
    };

    // Initialize
    render();

    return {
        dispose: () => {
            window.removeEventListener('online', updateSyncUI);
            window.removeEventListener('offline', updateSyncUI);
        }
    };
};
