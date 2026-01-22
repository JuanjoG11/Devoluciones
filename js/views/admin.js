import { db } from '../data.js';
import { auth } from '../auth.js';
import { Alert } from '../utils/ui.js';
import { formatTime12h, formatPrice } from '../utils/formatters.js';
import { CONFIG } from '../config.js';

// Modular Sections
import { renderDashboard } from './admin/dashboard.js';
import { renderHistorial } from './admin/history.js';
import { renderAuxiliares, renderAuxiliaresTable } from './admin/users.js';
import { renderProductos } from './admin/products.js';
import { renderConfig } from './admin/config.js';
import { renderRefacturacion } from './admin/refacturacion.js';
import { generatePrintReport, exportToCSV } from './admin/reports.js';

/**
 * Admin Dashboard View Orchestrator
 */
export const renderAdminDashboard = (container, user) => {
    container.classList.add('admin-mode');

    // Request Notification Permissions
    if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
    }

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
        hasMoreReturns: true,
        resales: []
    };
    let filters = { auxiliares: '', products: '' };

    const fetchData = async (force = false) => {
        const contentArea = document.getElementById('admin-content');
        if (contentArea && (cache.lastFetch === 0 || force)) {
            if (cache.lastFetch === 0) {
                contentArea.innerHTML = `
                    <div style="padding:80px; text-align:center; color: var(--primary-color);">
                        <div class="spinner" style="margin: 0 auto 20px;"></div>
                        <p style="font-weight: 500;">Sincronizando información...</p>
                    </div>`;
            }
            try {
                const today = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD local format
                const org = user.organization || 'TAT';

                // 1. Fetch main data sets with optimized queries
                // Use default 7-day filter for routes to reduce load
                const [routes, returns, users, resales] = await Promise.all([
                    db.getRoutes(org), // Uses CONFIG.PERFORMANCE.DEFAULT_DAYS_FILTER internally
                    db.getReturns(CONFIG.PERFORMANCE.DASHBOARD_RETURNS_LIMIT, 0, org),
                    db.getUsers(org),
                    db.getResoldReturns(org)
                ]);

                // 2. Compute stats locally for reliability
                // Routes use YYYY-MM-DD from toISOString().split('T')[0] but we should be careful.
                // Actually, because auxiliaries use .toISOString().split('T')[0], they store UTC date.
                // So we MUST use UTC date for routes.
                const todayUTC = new Date().toISOString().split('T')[0];
                const todaysRoutes = routes.filter(r => r.date === todayUTC);
                const activeCount = todaysRoutes.filter(r => r.status === 'active').length;

                // For returns, we strictly use the local business day (en-CA -> YYYY-MM-DD)
                const todaysReturns = returns.filter(r => {
                    if (!r.timestamp) return false;
                    return new Date(r.timestamp).toLocaleDateString('en-CA') === todayUTC;
                });

                const stats = {
                    active_routes_count: activeCount,
                    total_returns_count: todaysReturns.length,
                    total_returns_value: todaysReturns.reduce((sum, r) => sum + r.total, 0)
                };

                cache.routes = routes;
                cache.returns = returns;
                cache.users = users.filter(u => u.role === 'auxiliar');
                cache.resales = resales;
                cache.stats = stats;
                cache.lastFetch = Date.now();
                cache.returnsOffset = returns.length;
                cache.hasMoreReturns = returns.length >= 100;
            } catch (e) {
                console.error("Fetch error:", e);
            }
        }
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

    const showNotification = async (title, body) => {
        playNotificationSound();
        const options = {
            body: body,
            icon: 'logo-app.png',
            badge: 'logo-app.png',
            vibrate: [200, 100, 200],
            requireInteraction: true // Keeps notification visible on Windows until user acts
        };

        if ('serviceWorker' in navigator && Notification.permission === 'granted') {
            const registration = await navigator.serviceWorker.ready;
            registration.showNotification(title, options);
        } else if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(title, options);
        }
        Alert.success(body);
    };

    const setupRealtime = () => {
        if (!db.sb) return;
        const userOrg = user.organization || 'TAT';
        const channel = db.sb.channel('devolucion-alerts', { config: { broadcast: { self: true } } })
            .on('broadcast', { event: 'nueva-devolucion' }, (payload) => {
                if (payload.payload?.organization === userOrg) {
                    showNotification('🔔 Nueva Devolución', 'Se ha registrado una nueva devolución');
                    setTimeout(async () => { await fetchData(); renderSection(); }, 1000);
                }
            })
            .on('broadcast', { event: 'ruta-completada' }, (payload) => {
                if (payload.payload?.organization === userOrg) {
                    showNotification('✅ Ruta Finalizada', `La ruta de ${payload.payload?.userName || 'un auxiliar'} ha terminado`);
                    fetchData().then(() => renderSection());
                }
            })
            .on('broadcast', { event: 'nueva-reventa' }, (payload) => {
                if (payload.payload?.organization === userOrg) {
                    const count = payload.payload?.itemsCount || 1;
                    showNotification('🔄 REVENTA REGISTRADA', `Auxiliar reportó reventa de ${count} item(s) al cliente ${payload.payload?.customerCode || 'N/A'}`);
                    fetchData(true).then(() => renderSection());
                }
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
                            <div class="sidebar-logo"><span class="material-icons-round">local_shipping</span><h2>Devoluciones</h2></div>
                            <small>${user.organization === 'TYM' ? 'TIENDAS Y MARCAS' : 'TAT DISTRIBUCIONES'}</small>
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
            <div id="photoModal" class="hidden modal-overlay-fixed">
                <div class="modal-card">
                    <div class="modal-header">
                        <h3 style="margin:0">Evidencia</h3>
                        <div style="display: flex; gap: 8px;">
                            <button id="rotatePhoto" class="circle-btn" style="background: var(--primary-color); color: white;">
                                <span class="material-icons-round">rotate_right</span>
                            </button>
                            <button id="closeModal" class="circle-btn">
                                <span class="material-icons-round">close</span>
                            </button>
                        </div>
                    </div>
                    <div class="modal-body-img">
                        <img id="modalImage" src="" style="transition: transform 0.3s ease;">
                    </div>
                </div>
            </div>
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

        let currentRotation = 0;
        container.addEventListener('click', (e) => {
            const photoBtn = e.target.closest('.view-photo-btn');
            if (photoBtn) {
                const img = document.getElementById('modalImage');
                if (img) {
                    img.src = photoBtn.dataset.photo;
                    currentRotation = 0;
                    img.style.transform = `rotate(${currentRotation}deg)`;
                }
                document.getElementById('photoModal').classList.remove('hidden');
            }

            const rotateBtn = e.target.closest('#rotatePhoto');
            if (rotateBtn) {
                const img = document.getElementById('modalImage');
                if (img) {
                    currentRotation = (currentRotation + 90) % 360;
                    img.style.transform = `rotate(${currentRotation}deg)`;
                }
            }

            if (photoBtn || e.target.closest('#closeModal') || e.target.id === 'photoModal') {
                if (!photoBtn && !rotateBtn) document.getElementById('photoModal').classList.add('hidden');
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
        <a href="#" data-section="refacturacion" class="sidebar-link ${activeSection === 'refacturacion' ? 'active' : ''}"><span class="material-icons-round">receipt_long</span> <span>Refacturación</span></a>
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
            case 'dashboard': contentArea.innerHTML = renderDashboard(activeRoutes, cache.returns, cache.routes, cache.users, cache.stats, cache.hasMoreReturns, user); break;
            case 'historial': contentArea.innerHTML = renderHistorial(cache); break;
            case 'refacturacion': contentArea.innerHTML = renderRefacturacion(cache); break;
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
            const org = user.organization || 'TAT';
            const more = await db.getReturns(50, cache.returnsOffset, org);
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
                const tableContainer = document.getElementById('auxiliarTableContainer');
                if (tableContainer) {
                    tableContainer.innerHTML = renderAuxiliaresTable(cache.users, cache.routes, filters.auxiliares);

                    // Re-bind action buttons since we replaced the table content
                    tableContainer.querySelectorAll('.toggle-user-btn').forEach(btn => {
                        btn.onclick = async () => {
                            const userId = btn.dataset.userId;
                            const currentActive = btn.dataset.active === 'true';
                            if (await db.updateUserStatus(userId, !currentActive)) {
                                await fetchData();
                                renderSection();
                            }
                        };
                    });
                }
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

        // PRODUCT SEARCH LOGIC
        const prodSearch = document.getElementById('productSearch');
        if (prodSearch) {
            let debounceTimer;
            prodSearch.addEventListener('input', (e) => {
                const query = e.target.value.trim();
                clearTimeout(debounceTimer);
                debounceTimer = setTimeout(async () => {
                    const container = document.getElementById('productTableContainer');
                    if (query.length < 2) {
                        container.innerHTML = `
                            <div style="padding: 60px; text-align: center; color: var(--text-light);">
                                <span class="material-icons-round" style="font-size: 48px; opacity: 0.3;">search</span>
                                <p>Ingresa al menos 2 caracteres para buscar.</p>
                            </div>`;
                        return;
                    }

                    container.innerHTML = `<div class="spinner" style="margin: 40px auto;"></div>`;

                    const org = user.organization || 'TAT';
                    const results = await db.searchProducts(query, org, user.username);

                    if (results.length === 0) {
                        container.innerHTML = `<div style="padding: 40px; text-align: center; color: var(--text-light);">No se encontraron productos.</div>`;
                    } else {
                        container.innerHTML = `
                            <div style="overflow-x: auto;">
                                <table style="width: 100%; border-collapse: collapse;">
                                    <thead style="background: #f8fafc; color: var(--text-secondary); font-size: 11px; text-transform: uppercase;">
                                        <tr>
                                            <th style="padding: 12px 16px; text-align: left;">Código</th>
                                            <th style="padding: 12px 16px; text-align: left;">Nombre</th>
                                            <th style="padding: 12px 16px; text-align: right;">Precio</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${results.map(p => `
                                            <tr style="border-bottom: 1px solid #f1f5f9;">
                                                <td style="padding: 12px 16px; font-weight: 600; font-size: 13px;">${p.code}</td>
                                                <td style="padding: 12px 16px; font-size: 13px;">${p.name}</td>
                                                <td style="padding: 12px 16px; text-align: right; font-weight: 700;">${formatPrice(p.price)}</td>
                                            </tr>
                                        `).join('')}
                                    </tbody>
                                </table>
                            </div>
                        `;
                    }
                    // Keep focus? No need, we are just rendering table below
                }, 400);
            });
            prodSearch.focus();
        }



        document.getElementById('resetDataBtn')?.addEventListener('click', async () => {
            const org = user.organization || 'TAT';
            if (await Alert.confirm(`¿Estás seguro de que deseas eliminar TODOS los datos de ${org}?`, 'Reiniciar Sistema')) {
                if (await db.resetTestData(org)) {
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
