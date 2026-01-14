import { db } from '../data.js';
import { auth } from '../auth.js';
import { Alert } from '../utils/ui.js';
import { formatTime12h } from '../utils/formatters.js';

// Modular Sections
import { renderDashboard } from './admin/dashboard.js';
import { renderHistorial } from './admin/history.js';
import { renderAuxiliares } from './admin/users.js';
import { renderProductos } from './admin/products.js';
import { renderConfig } from './admin/config.js';
import { generatePrintReport, exportToCSV } from './admin/reports.js';

/**
 * Admin Dashboard View Orchestrator
 */
export const renderAdminDashboard = (container, user) => {
    container.classList.add('admin-mode');

    // Internal State
    let activeSection = 'dashboard';
    let sidebarOpen = false;
    let cache = {
        routes: [],
        returns: [],
        users: [],
        stats: { active_routes_count: 0, total_returns_count: 0, total_returns_value: 0 },
        lastFetch: 0,
        returnsOffset: 0,
        hasMoreReturns: true
    };
    let filters = { auxiliares: '', products: '' };

    const fetchData = async () => {
        const contentArea = document.getElementById('admin-content');
        if (contentArea && cache.lastFetch === 0) {
            contentArea.innerHTML = `
                <div style="padding:80px; text-align:center; color: var(--primary-color);">
                    <div class="spinner" style="margin: 0 auto 20px;"></div>
                    <p style="font-weight: 500;">Sincronizando información...</p>
                </div>`;
        }
        try {
            const today = new Date().toISOString().split('T')[0];
            const [routes, returns, users, stats] = await Promise.all([
                db.getRoutes(),
                db.getReturns(50, 0),
                db.getUsers(),
                db.getDashboardStats(today)
            ]);
            cache.routes = routes;
            cache.returns = returns;
            cache.users = users.filter(u => u.role === 'auxiliar');
            cache.stats = stats || cache.stats;
            cache.lastFetch = Date.now();
            cache.returnsOffset = returns.length;
            cache.hasMoreReturns = returns.length === 50;
        } catch (e) { console.error("Fetch error:", e); }
    };

    // --- Notifications ---
    const playNotificationSound = () => {
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (!AudioContext) return;
            const ctx = new AudioContext();
            const oscillator = ctx.createOscillator();
            const gainNode = ctx.createGain();
            oscillator.connect(gainNode);
            gainNode.connect(ctx.destination);
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(523.25, ctx.currentTime);
            oscillator.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1);
            oscillator.frequency.setValueAtTime(783.99, ctx.currentTime + 0.2);
            gainNode.gain.setValueAtTime(0.15, ctx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
            oscillator.start(); oscillator.stop(ctx.currentTime + 0.6);
        } catch (e) { }
    };

    const showNotification = (title, body) => {
        playNotificationSound();
        if (document.hidden && 'Notification' in window && Notification.permission === 'granted') {
            new Notification(title, { body: body, icon: '/logo-tat.png' });
        }
        Alert.success(body);
    };

    const setupRealtime = () => {
        if (!db.sb) return;
        const channel = db.sb.channel('devolucion-alerts', { config: { broadcast: { self: true } } })
            .on('broadcast', { event: 'nueva-devolucion' }, (payload) => {
                showNotification('🔔 Nueva Devolución', 'Se ha registrado una nueva devolución');
                setTimeout(async () => { await fetchData(); renderSection(); }, 1000);
            })
            .on('broadcast', { event: 'ruta-completada' }, (payload) => {
                showNotification('✅ Ruta Finalizada', `La ruta de ${payload.payload?.userName || 'un auxiliar'} ha terminado`);
                fetchData().then(() => renderSection());
            })
            .subscribe();
        return channel;
    };

    const realtimeChannel = setupRealtime();

    // --- Core Rendering ---
    const render = async (skipFetch = false) => {
        if (!document.getElementById('admin-layout')) renderShell();
        if (!skipFetch && cache.lastFetch === 0) await fetchData();
        renderSection();
    };

    const renderShell = () => {
        container.innerHTML = `
            <div id="pwa-install-banner" style="display:none;"></div>
            <div id="admin-layout" class="admin-shell">
                <header class="admin-mobile-header">
                    <button id="menuToggle" class="icon-btn"><span class="material-icons-round">menu</span></button>
                    <div class="mobile-logo">DevolucionesApp</div>
                </header>
                <div class="admin-main-wrapper">
                    <aside class="admin-sidebar ${sidebarOpen ? 'mobile-open' : ''}">
                        <div class="sidebar-header">
                            <div class="sidebar-logo"><span class="material-icons-round">local_shipping</span><h2>DevolucionesApp</h2></div>
                            <small>TAT DISTRIBUCIONES</small>
                        </div>
                        <nav id="admin-nav">${renderNavLinks()}</nav>
                        <div class="sidebar-footer">
                            <button id="exportCsvBtn" class="btn" style="background: rgba(34, 139, 34, 0.15); color: #22c55e; border: 1px solid rgba(34, 197, 94, 0.3); width: 100%; margin-bottom: 12px; justify-content: center; padding: 12px; border-radius: 12px;"><span class="material-icons-round">description</span></button>
                            <button id="logoutBtn" onclick="window.handleLogout()" class="btn-logout"><span class="material-icons-round">logout</span> Cerrar Sesión</button>
                        </div>
                    </aside>
                    <div id="sidebarOverlay" class="sidebar-overlay ${sidebarOpen ? 'active' : ''}"></div>
                    <main id="admin-content" class="admin-content"></main>
                </div>
            </div>
            <div id="photoModal" class="hidden modal-overlay-fixed"><div class="modal-card"><div class="modal-header"><h3 style="margin:0">Evidencia</h3><button id="closeModal" class="circle-btn"><span class="material-icons-round">close</span></button></div><div class="modal-body-img"><img id="modalImage" src=""></div></div></div>
            <div id="printArea" class="hidden"></div>
        `;

        // PWA Banner support
        if (window.showPwaBanner) {
            window.showPwaBanner();
            window.addEventListener('pwa-installable', () => window.showPwaBanner());
        }

        // Event Listeners for Shell
        document.getElementById('admin-nav').addEventListener('click', (e) => {
            const link = e.target.closest('[data-section]');
            if (link) {
                e.preventDefault();
                activeSection = link.dataset.section;
                sidebarOpen = false;
                renderSection();
                updateSidebarUI();
            }
        });

        document.getElementById('menuToggle').onclick = () => {
            sidebarOpen = !sidebarOpen;
            console.log('Sidebar toggled:', sidebarOpen);
            updateSidebarUI();
        };
        document.getElementById('sidebarOverlay').onclick = () => {
            sidebarOpen = false;
            updateSidebarUI();
        };
        document.getElementById('exportCsvBtn').onclick = () => exportToCSV(cache.returns, cache.routes);

        container.addEventListener('click', (e) => {
            const photoBtn = e.target.closest('.view-photo-btn');
            if (photoBtn) {
                const img = document.getElementById('modalImage');
                if (img) img.src = photoBtn.dataset.photo;
                document.getElementById('photoModal').classList.remove('hidden');
            }
            if (photoBtn || e.target.closest('#closeModal') || e.target.id === 'photoModal') {
                if (!photoBtn) document.getElementById('photoModal').classList.add('hidden');
            }
        });
    };

    const updateSidebarUI = () => {
        document.querySelector('.admin-sidebar')?.classList.toggle('mobile-open', sidebarOpen);
        document.querySelector('.sidebar-overlay')?.classList.toggle('active', sidebarOpen);
        const nav = document.getElementById('admin-nav');
        if (nav) nav.innerHTML = renderNavLinks();
    };

    const renderNavLinks = () => `
        <a href="#" data-section="dashboard" class="sidebar-link ${activeSection === 'dashboard' ? 'active' : ''}"><span class="material-icons-round">dashboard</span> <span>Panel General</span></a>
        <a href="#" data-section="historial" class="sidebar-link ${activeSection === 'historial' ? 'active' : ''}"><span class="material-icons-round">history</span> <span>Historial</span></a>
        <a href="#" data-section="auxiliares" class="sidebar-link ${activeSection === 'auxiliares' ? 'active' : ''}"><span class="material-icons-round">people</span> <span>Auxiliares</span></a>
        <a href="#" data-section="productos" class="sidebar-link ${activeSection === 'productos' ? 'active' : ''}"><span class="material-icons-round">inventory</span> <span>Productos</span></a>
        <a href="#" data-section="config" class="sidebar-link ${activeSection === 'config' ? 'active' : ''}"><span class="material-icons-round">settings</span> <span>Configuración</span></a>
    `;

    const renderSection = () => {
        const contentArea = document.getElementById('admin-content');
        if (!contentArea) return;
        const todayStr = new Date().toISOString().split('T')[0];
        const activeRoutes = cache.routes.filter(r => r.date === todayStr);

        switch (activeSection) {
            case 'dashboard': contentArea.innerHTML = renderDashboard(activeRoutes, cache.returns, cache.routes, cache.users, cache.stats, cache.hasMoreReturns); break;
            case 'historial': contentArea.innerHTML = renderHistorial(cache); break;
            case 'auxiliares': contentArea.innerHTML = renderAuxiliares(cache.users, cache.routes, filters.auxiliares); break;
            case 'productos': contentArea.innerHTML = renderProductos(); break;
            case 'config': contentArea.innerHTML = renderConfig(); break;
        }
        attachEventListeners();
    };

    const attachEventListeners = () => {
        document.getElementById('refreshBtn')?.addEventListener('click', () => location.reload());

        document.getElementById('loadMoreBtn')?.addEventListener('click', async (e) => {
            e.target.disabled = true;
            e.target.textContent = 'Cargando...';
            const more = await db.getReturns(50, cache.returnsOffset);
            cache.returns = [...cache.returns, ...more];
            cache.returnsOffset += more.length;
            cache.hasMoreReturns = more.length === 50;
            renderSection();
        });

        document.querySelectorAll('.print-route-btn').forEach(btn => {
            btn.onclick = () => generatePrintReport(cache.routes, btn.dataset.routeId);
        });

        const auxSearch = document.getElementById('auxiliarSearch');
        if (auxSearch) {
            auxSearch.addEventListener('input', (e) => {
                filters.auxiliares = e.target.value;
                const area = document.getElementById('admin-content');
                // Partial re-render specifically for the table if we want, but renderSection is fine for now
                renderSection();
                document.getElementById('auxiliarSearch').focus(); // Keep focus
            });
        }

        document.querySelectorAll('.toggle-user-btn').forEach(btn => {
            btn.onclick = async () => {
                const userId = btn.dataset.userId;
                const currentActive = btn.dataset.active === 'true';
                if (await db.updateUserStatus(userId, !currentActive)) {
                    await fetchData();
                    renderSection();
                }
            };
        });

        const prodSearch = document.getElementById('productSearch');
        if (prodSearch) {
            let debounce;
            prodSearch.addEventListener('input', (e) => {
                clearTimeout(debounce);
                debounce = setTimeout(async () => {
                    const query = e.target.value;
                    const container = document.getElementById('productTableContainer');
                    if (query.length < 2) return;
                    container.innerHTML = '<div style="padding:40px; text-align:center;"><div class="spinner" style="margin:auto"></div></div>';
                    const results = await db.searchProducts(query);
                    if (results.length === 0) {
                        container.innerHTML = '<div style="padding:40px; text-align:center;">No se encontraron productos.</div>';
                    } else {
                        container.innerHTML = `
                            <table style="width:100%; border-collapse:collapse;">
                                <thead style="background:#f8fafc; font-size:12px; text-transform:uppercase;">
                                    <tr><th style="padding:12px; text-align:left;">Código</th><th style="padding:12px; text-align:left;">Nombre</th><th style="padding:12px; text-align:right;">Precio</th></tr>
                                </thead>
                                <tbody>
                                    ${results.map(p => `
                                        <tr style="border-bottom:1px solid #f1f5f9;">
                                            <td style="padding:12px; font-weight:600;">${p.code}</td>
                                            <td style="padding:12px;">${p.name}</td>
                                            <td style="padding:12px; text-align:right; font-weight:700;">$ ${p.price.toLocaleString()}</td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>`;
                    }
                }, 300);
            });
        }

        document.getElementById('resetDataBtn')?.addEventListener('click', async () => {
            if (await Alert.confirm('¿Estás seguro de que deseas eliminar TODOS los datos de devoluciones y rutas?', 'Reiniciar Sistema')) {
                if (await db.resetTestData()) {
                    Alert.success('Datos eliminados correctamente');
                    location.reload();
                }
            }
        });
    };

    // Initialize
    render();

    return {
        dispose: () => {
            if (realtimeChannel) realtimeChannel.unsubscribe();
        }
    };
};
