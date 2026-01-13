import { db } from '../data.js';
import { auth } from '../auth.js';
import { Alert } from '../utils/ui.js';

export const renderAdminDashboard = (container, user) => {
    container.classList.add('admin-mode');
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
            contentArea.innerHTML = '<div style="padding:80px; text-align:center; color: var(--primary-color);"><div class="spinner" style="margin: 0 auto 20px;"></div><p style="font-weight: 500;">Sincronizando información...</p></div>';
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

    const setupRealtime = () => {
        if (!db.sb) return;
        let realtimeTimer;
        return db.sb.channel('realtime-admin')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'return_items' }, async () => {
                clearTimeout(realtimeTimer);
                realtimeTimer = setTimeout(async () => {
                    await fetchData();
                    renderSection();
                }, 1000); // Wait 1s for more changes before refetching
            })
            .subscribe();
    };

    const realtimeChannel = setupRealtime();

    const render = async (skipFetch = false) => {
        try {
            if (!document.getElementById('admin-layout')) {
                renderShell();
            }
            if (!skipFetch && cache.lastFetch === 0) {
                await fetchData();
            }
            renderSection();
        } catch (err) {
            console.error("Critical error in Admin Render:", err);
            container.innerHTML = `<div style="padding: 40px; text-align: center; color: #ef4444;">
                <span class="material-icons-round" style="font-size: 48px;">error_outline</span>
                <h2>Error al cargar el panel</h2>
                <p>${err.message}</p>
                <button onclick="location.reload()" class="btn btn-primary" style="margin-top: 20px;">Reintentar</button>
            </div>`;
        }
    };

    const renderShell = () => {
        container.innerHTML = `
            <div id="admin-layout" class="admin-shell">
                <!-- Mobile Header -->
                <header class="admin-mobile-header">
                    <button id="menuToggle" class="icon-btn">
                        <span class="material-icons-round">menu</span>
                    </button>
                    <div class="mobile-logo">DevolucionesApp</div>
                </header>

                <div class="admin-main-wrapper">
                    <aside class="admin-sidebar ${sidebarOpen ? 'mobile-open' : ''}">
                        <div class="sidebar-header">
                            <div class="sidebar-logo">
                                <span class="material-icons-round">local_shipping</span>
                                <h2>DevolucionesApp</h2>
                            </div>
                            <small>TAT DISTRIBUCIONES</small>
                        </div>
                        <nav id="admin-nav">
                            ${renderNavLinks()}
                        </nav>
                        <div class="sidebar-footer">
                            <div class="user-profile">
                                <div class="user-avatar">${(user.name || 'A').charAt(0)}</div>
                                <div class="user-info">
                                    <div class="user-name">${user.name || 'Administrador'}</div>
                                    <div class="user-role">Administrador</div>
                                </div>
                            </div>
                            <button id="logoutBtn" onclick="window.handleLogout()" class="btn-logout">
                                <span class="material-icons-round">logout</span> Cerrar Sesión
                            </button>
                        </div>
                    </aside>
                    
                    <div id="sidebarOverlay" class="sidebar-overlay ${sidebarOpen ? 'active' : ''}"></div>

                    <main id="admin-content" class="admin-content"></main>
                </div>
            </div>
        `;
        document.getElementById('admin-nav').addEventListener('click', (e) => {
            const link = e.target.closest('[data-section]');
            if (link) {
                activeSection = link.dataset.section;
                sidebarOpen = false; // Close on navigation
                renderSection();
                updateSidebarUI();
            }
        });

        document.getElementById('menuToggle')?.addEventListener('click', () => {
            sidebarOpen = !sidebarOpen;
            updateSidebarUI();
        });

        document.getElementById('sidebarOverlay')?.addEventListener('click', () => {
            sidebarOpen = false;
            updateSidebarUI();
        });
    };

    const updateSidebarUI = () => {
        const sidebar = document.querySelector('.admin-sidebar');
        const overlay = document.querySelector('.sidebar-overlay');
        const nav = document.getElementById('admin-nav');

        if (sidebar) sidebar.classList.toggle('mobile-open', sidebarOpen);
        if (overlay) overlay.classList.toggle('active', sidebarOpen);
        if (nav) nav.innerHTML = renderNavLinks();
    };

    const renderNavLinks = () => `
        <a href="#" data-section="dashboard" class="sidebar-link ${activeSection === 'dashboard' ? 'active' : ''}">
            <span class="material-icons-round">dashboard</span> <span>Panel General</span>
        </a>
        <a href="#" data-section="auxiliares" class="sidebar-link ${activeSection === 'auxiliares' ? 'active' : ''}">
            <span class="material-icons-round">people</span> <span>Auxiliares</span>
        </a>
        <a href="#" data-section="productos" class="sidebar-link ${activeSection === 'productos' ? 'active' : ''}">
            <span class="material-icons-round">inventory</span> <span>Productos</span>
        </a>
        <a href="#" data-section="config" class="sidebar-link ${activeSection === 'config' ? 'active' : ''}">
            <span class="material-icons-round">settings</span> <span>Configuración</span>
        </a>
    `;

    const renderSection = () => {
        const contentArea = document.getElementById('admin-content');
        if (!contentArea) return;
        const { routes, returns, users, stats } = cache;
        const activeRoutes = (routes || []).filter(r => r.date === new Date().toISOString().split('T')[0]);

        contentArea.innerHTML = `
            ${activeSection === 'dashboard' ? renderDashboard(activeRoutes, returns, routes, users, stats) :
                activeSection === 'auxiliares' ? renderAuxiliares(users) :
                    activeSection === 'productos' ? renderProductos() : renderConfig()}
        `;
        attachEventListeners();
    };

    const renderDashboard = (activeRoutes, returns, routes, users, stats) => `
        <header style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; background: var(--grad-electric); padding: 20px 24px; border-radius: 16px; color: white; box-shadow: var(--shadow-blue); border-bottom: 3px solid var(--secondary-accent); position: relative; overflow: hidden;">
            <div style="position: absolute; right: -10px; top: -10px; opacity: 0.1;"><span class="material-icons-round" style="font-size: 100px;">analytics</span></div>
            <div style="position: relative; z-index: 1;">
                <h1 style="color: white; margin: 0; font-size: 24px; letter-spacing: -0.5px; font-weight: 800;">CENTRO DE CONTROL TAT</h1>
                <p style="color: rgba(255,255,255,0.8); font-size: 13px; font-weight: 500; margin: 2px 0 0;">Gestión Inteligente de Devoluciones y Logística</p>
            </div>
            <div style="display: flex; gap: 12px; position: relative; z-index: 1; align-items: center;">
                <button id="exportCsvBtn" class="btn btn-primary" style="height: 40px; border-radius: 10px; padding: 0 16px; font-size: 13px; font-weight: 700; border: 1px solid rgba(255,255,255,0.2); display: flex; align-items: center; gap: 8px;">
                     <span class="material-icons-round" style="font-size: 18px;">file_download</span> Exportar Excel
                </button>
                <button id="refreshBtn" class="btn btn-secondary" style="height: 40px; width: 40px; border-radius: 10px; background: rgba(255,255,255,0.1); border: 1.5px solid rgba(255,255,255,0.3); color: white; padding: 0; display: flex; align-items: center; justify-content: center; font-weight: 700; cursor: pointer;">
                    <span class="material-icons-round" style="font-size: 20px;">refresh</span>
                </button>
            </div>
        </header>
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; margin-bottom: 32px;">
            ${renderStatCard('Rutas Activas', `${stats.active_routes_count} / ${users.length}`, 'local_shipping', 'var(--primary-color)')}
            ${renderStatCard('Valor Devoluciones', `$ ${Number(stats.total_returns_value).toLocaleString()}`, 'payments', 'var(--secondary-accent)')}
            ${renderStatCard('Items Recibidos', stats.total_returns_count, 'shopping_bag', 'var(--success-color)')}
        </div>
        <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 24px;">
            <div class="card" style="padding: 0; overflow: hidden;">
                <div style="padding: 20px; border-bottom: 1px solid #e2e8f0; background: white;"><h3 style="margin: 0;">Últimas Devoluciones</h3></div>
                <div style="overflow-x: auto;">
                    <table style="width: 100%; border-collapse: collapse;">
                        <thead style="background: rgba(0,34,77,0.03); color: var(--text-secondary); font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px;">
                            <tr>
                                <th style="padding: 12px 16px; text-align: left;">Hora</th>
                                <th style="padding: 12px 16px; text-align: left;">Auxiliar</th>
                                <th style="padding: 12px 16px; text-align: left;">Producto / Factura</th>
                                <th style="padding: 12px 16px; text-align: left;">Motivo</th>
                                <th style="padding: 12px 16px; text-align: right;">Total</th>
                                <th style="padding: 12px 16px; text-align: center;">Evidencia</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${returns.map(r => {
        const route = routes.find(rt => rt.id === r.routeId);
        return `<tr style="border-bottom: 1px solid #f1f5f9;">
                                    <td style="padding: 12px 16px; color: var(--text-light); font-size: 11px;">${r.timestamp ? new Date(r.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}</td>
                                    <td style="padding: 12px 16px; font-weight: 600; font-size: 12px;">${route ? route.userName : 'Desconocido'}</td>
                                    <td style="padding: 12px 16px;">
                                        <div style="font-weight: 700; font-size: 12px; color: var(--primary-color);">${r.productName || 'N/A'}</div>
                                        <small style="color: var(--text-light); font-size: 11px;">Doc: ${r.invoice}</small>
                                    </td>
                                    <td style="padding: 12px 16px;"><span style="background: rgba(0,34,77,0.05); color: var(--text-secondary); padding: 3px 8px; border-radius: 4px; font-size: 10px; font-weight: 700;">${r.reason}</span></td>
                                    <td style="padding: 12px 16px; text-align: right; font-weight: 700; font-size: 13px; color: var(--primary-color);">$ ${r.total.toLocaleString()}</td>
                                    <td style="padding: 12px 16px; text-align: center;">${r.evidence ? `<button class="view-photo-btn" data-photo="${r.evidence}" style="background: rgba(0,174,239,0.1); border: none; color: var(--accent-color); padding: 6px; border-radius: 8px; cursor: pointer;"><span class="material-icons-round" style="font-size: 18px;">image</span></button>` : '—'}</td>
                                </tr>`;
    }).join('')}
                        </tbody>
                    </table>
                </div>
                ${returns.length === 0 ? '<div style="padding: 40px; text-align: center; color: var(--text-light);">No hay devoluciones registradas.</div>' : ''}
                ${cache.hasMoreReturns ? `
                    <div style="padding: 20px; text-align: center; border-top: 1px solid #f1f5f9;">
                        <button id="loadMoreBtn" class="btn btn-secondary" style="font-size: 13px; font-weight: 600;">
                             Cargar más registros
                        </button>
                    </div>
                ` : ''}
            </div>
            <div class="card" style="height: fit-content;">
                <h3 class="mb-md">Estado de Rutas</h3>
                <div style="display: flex; flex-direction: column; gap: 8px;">
                    ${activeRoutes.map(r => `
                        <div style="display: flex; align-items: center; gap: 12px; padding: 12px; border: 1px solid ${r.status === 'completed' ? 'var(--primary-color)' : '#f1f5f9'}; border-radius: 12px; background: ${r.status === 'completed' ? 'rgba(99, 102, 241, 0.05)' : 'transparent'};">
                            <div style="width: 8px; height: 8px; background: ${r.status === 'completed' ? 'var(--primary-color)' : 'var(--success-color)'}; border-radius: 50%;"></div>
                            <div style="flex-grow: 1;">
                                <div style="font-weight: 600; font-size: 14px;">${r.userName}</div>
                                <small style="color: var(--text-light);">${r.startTime} ${r.endTime ? ' - ' + r.endTime : ''}</small>
                            </div>
                            <button class="print-route-btn" data-route-id="${r.id}" style="background: rgba(99, 102, 241, 0.1); border: none; color: var(--accent-color); padding: 8px; border-radius: 8px; cursor: pointer;"><span class="material-icons-round" style="font-size: 18px;">print</span></button>
                        </div>
                    `).join('')}
                    ${activeRoutes.length === 0 ? '<div style="text-align: center; color: var(--text-light); padding: 20px;">No hay rutas activas.</div>' : ''}
                </div>
            </div>
        </div>
        <div id="photoModal" class="hidden" style="position: fixed; inset: 0; background: rgba(0,0,0,0.85); z-index: 9999; display: flex; align-items: center; justify-content: center; padding: 20px; backdrop-filter: blur(5px);">
            <div class="card" style="max-width: 600px; width: 100%; padding: 0; overflow: hidden; background: white; border-radius: 16px;">
                <div style="padding: 16px; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; align-items: center;"><h3 style="margin: 0;">Evidencia</h3><button id="closeModal" style="border: none; background: #f1f5f9; width: 32px; height: 32px; border-radius: 50%; cursor: pointer;"><span class="material-icons-round">close</span></button></div>
                <div style="padding: 10px; background: #f8fafc; text-align: center;"><img id="modalImage" src="" style="max-width: 100%; max-height: 70vh; border-radius: 8px;"></div>
            </div>
        </div>
        <div id="printArea" class="hidden"></div>
    `;

    const renderStatCard = (title, val, icon, color) => `
        <div class="card" style="position: relative; overflow: hidden; border: none; padding: 32px; background: white; box-shadow: var(--shadow-premium);">
            <div style="position: absolute; right: -15px; bottom: -15px; color: ${color}; opacity: 0.05;"><span class="material-icons-round" style="font-size: 100px;">${icon}</span></div>
            <div class="flex items-center gap-md" style="position: relative; z-index: 1;">
                <div style="background: ${color}; width: 64px; height: 64px; border-radius: 20px; color: white; display: flex; align-items: center; justify-content: center; box-shadow: 0 10px 20px ${color}44;">
                    <span class="material-icons-round" style="font-size: 32px;">${icon}</span>
                </div>
                <div>
                    <h2 style="font-size: 28px; margin:0; font-weight: 900; color: var(--primary-color); letter-spacing: -1px;">${val}</h2>
                    <p style="margin: 0; font-weight: 700; font-size: 12px; color: var(--text-light); text-transform: uppercase; letter-spacing: 1px;">${title}</p>
                </div>
            </div>
            <div style="position: absolute; left: 0; bottom: 0; width: 100%; height: 4px; background: ${color};"></div>
        </div>
    `;

    const renderAuxiliares = (users) => {
        const filtered = users.filter(u =>
            u.name.toLowerCase().includes(filters.auxiliares.toLowerCase()) ||
            u.username.toLowerCase().includes(filters.auxiliares.toLowerCase())
        );

        return `
            <header style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 32px;">
                <div><h1 style="color: var(--primary-color);">Gestión de Auxiliares</h1><p>Control de acceso para personal operativo</p></div>
                <div style="width: 300px;">
                    <input type="text" id="auxiliarSearch" class="input-field" placeholder="Buscar auxiliar..." value="${filters.auxiliares}" style="height: 44px; border-radius: 10px;">
                </div>
            </header>
            <div class="card" style="padding: 0;">
                <table style="width: 100%; border-collapse: collapse;">
                    <thead style="background: #f8fafc; color: var(--text-secondary); font-size: 12px; text-transform: uppercase;">
                        <tr><th style="padding: 16px; text-align: left;">Nombre</th><th style="padding: 16px; text-align: left;">Usuario</th><th style="padding: 16px; text-align: center;">Estado today</th><th style="padding: 16px; text-align: center;">Estado Cuenta</th><th style="padding: 16px; text-align: center;">Acción</th></tr>
                    </thead>
                    <tbody>
                        ${filtered.map(u => {
            const todayRoute = cache.routes.find(r => r.userId === u.id && r.date === new Date().toISOString().split('T')[0]);
            const statusColor = todayRoute ? (todayRoute.status === 'completed' ? '#6366f1' : '#22c55e') : '#94a3b8';
            const statusText = todayRoute ? (todayRoute.status === 'completed' ? 'Finalizó' : 'En Ruta') : 'Inactivo';

            return `
                                <tr style="border-bottom: 1px solid #f1f5f9; opacity: ${u.isActive ? '1' : '0.6'}">
                                    <td style="padding: 16px; font-weight: 500;">${u.name}</td>
                                    <td style="padding: 16px;">${u.username}</td>
                                    <td style="padding: 16px; text-align: center;">
                                        <div style="display: flex; align-items: center; justify-content: center; gap: 6px; font-size: 12px; font-weight: 600; color: ${statusColor};">
                                            <span style="width: 6px; height: 6px; border-radius: 50%; background: ${statusColor};"></span>
                                            ${statusText}
                                        </div>
                                    </td>
                                    <td style="padding: 16px; text-align: center;"><span style="background: ${u.isActive ? '#dcfce7' : '#fee2e2'}; color: ${u.isActive ? '#15803d' : '#991b1b'}; padding: 4px 12px; border-radius: 99px; font-size: 11px; font-weight: 600;">${u.isActive ? 'Activo' : 'Suspendido'}</span></td>
                                    <td style="padding: 16px; text-align: center;"><button class="toggle-user-btn btn" data-user-id="${u.id}" data-active="${u.isActive}" style="background: none; border: 1px solid #ddd; color: ${u.isActive ? '#ef4444' : '#22c55e'}; height: 32px; padding: 0 10px; font-size: 12px;">${u.isActive ? 'Desactivar' : 'Reactivar'}</button></td>
                                </tr>`;
        }).join('')}
                    </tbody>
                </table>
            </div>
        `;
    };

    const renderProductos = () => `
        <header style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 32px;">
            <div><h1 style="color: var(--primary-color);">Búsqueda de Productos</h1><p>Consulta rápida de catálogo e inventario</p></div>
            <div style="width: 350px;"><input type="text" id="productSearch" class="input-field" placeholder="Buscar por nombre o código..." style="height: 48px; border-radius: 12px;"></div>
        </header>
        <div class="card" style="padding: 0;"><div id="productTableContainer"><div style="padding: 60px; text-align: center; color: var(--text-light);"><span class="material-icons-round" style="font-size: 48px; opacity: 0.3;">search</span><p>Ingresa al menos 2 caracteres para buscar.</p></div></div></div>
    `;

    const renderConfig = () => `
        <div style="max-width: 600px; margin: 0 auto; padding-top: 40px;">
            <header style="margin-bottom: 32px; text-align: left;">
                <h1 style="color: var(--primary-color);">Configuración Avanzada</h1>
                <p>Mantenimiento y limpieza del sistema</p>
            </header>
            
            <div class="card" style="padding: 32px; border-left: 4px solid #ef4444;">
                <div style="display: flex; gap: 24px; align-items: flex-start;">
                    <div style="background: #fee2e2; color: #ef4444; padding: 16px; border-radius: 12px;">
                        <span class="material-icons-round" style="font-size: 32px;">delete_forever</span>
                    </div>
                    <div>
                        <h3 style="margin: 0 0 8px; color: #991b1b;">Reiniciar Base de Datos</h3>
                        <p style="margin: 0 0 24px; color: #666; font-size: 14px; line-height: 1.5;">
                            Esta acción eliminará **todas las devoluciones y rutas registradas** hasta el momento. 
                            Úsala únicamente para limpiar datos de prueba antes de iniciar la operación oficial.
                        </p>
                        <button id="resetDataBtn" class="btn" style="background: #ef4444; color: white; height: 48px; padding: 0 24px; font-weight: 600; border-radius: 10px; border: none; cursor: pointer; display: flex; align-items: center; gap: 8px;">
                            <span class="material-icons-round">warning</span> Limpiar Todos los Datos
                        </button>
                    </div>
                </div>
            </div>
            
            <div class="card" style="margin-top: 24px; text-align: center; color: var(--text-light); border: 1px dashed #e2e8f0; background: transparent;">
                <p style="font-size: 13px; margin: 0;">Otras opciones de configuración (inventario, usuarios) próximamente.</p>
            </div>
        </div>
    `;

    const attachEventListeners = () => {
        if (activeSection === 'dashboard') {
            document.getElementById('refreshBtn')?.addEventListener('click', () => {
                window.location.reload();
            });

            document.getElementById('exportCsvBtn')?.addEventListener('click', () => {
                exportToCSV(cache.returns, cache.routes);
            });

            document.querySelectorAll('.print-route-btn').forEach(btn => {
                btn.addEventListener('click', async () => {
                    const id = btn.dataset.routeId;
                    await generatePrintReport(cache.routes, id);
                });
            });

            document.querySelectorAll('.view-photo-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const img = document.getElementById('modalImage');
                    img.src = btn.dataset.photo;
                    document.getElementById('photoModal').classList.remove('hidden');
                });
            });

            document.getElementById('closeModal')?.addEventListener('click', () => {
                document.getElementById('photoModal').classList.add('hidden');
            });

            document.getElementById('loadMoreBtn')?.addEventListener('click', async () => {
                const btn = document.getElementById('loadMoreBtn');
                btn.disabled = true;
                btn.innerHTML = '<div class="spinner" style="width:16px; height:16px; border-width:2px; margin:0 auto;"></div>';

                const moreReturns = await db.getReturns(50, cache.returnsOffset);
                if (moreReturns.length > 0) {
                    cache.returns = [...cache.returns, ...moreReturns];
                    cache.returnsOffset += moreReturns.length;
                    cache.hasMoreReturns = moreReturns.length === 50;
                } else {
                    cache.hasMoreReturns = false;
                }
                renderSection();
            });
        }

        if (activeSection === 'auxiliares') {
            const searchInput = document.getElementById('auxiliarSearch');
            searchInput?.addEventListener('input', (e) => {
                filters.auxiliares = e.target.value;
                renderSection();
                // Focus back to input
                document.getElementById('auxiliarSearch')?.focus();
            });

            document.querySelectorAll('.toggle-user-btn').forEach(btn => {
                btn.addEventListener('click', async () => {
                    const id = btn.dataset.userId;
                    const next = btn.dataset.active !== 'true';
                    const confirmed = await Alert.confirm(`¿Deseas ${next ? 'activar' : 'desactivar'} este usuario?`);
                    if (confirmed) {
                        await db.updateUserStatus(id, next);
                        await fetchData();
                        renderSection();
                        Alert.success(`Usuario ${next ? 'activado' : 'desactivado'} con éxito`);
                    }
                });
            });
        }

        if (activeSection === 'productos') {
            const input = document.getElementById('productSearch');
            let timer;
            input?.addEventListener('input', () => {
                clearTimeout(timer);
                timer = setTimeout(async () => {
                    if (input.value.length < 2) return;
                    const results = await db.searchProducts(input.value);
                    const container = document.getElementById('productTableContainer');
                    if (container) {
                        container.innerHTML = `
                            <table style="width: 100%; border-collapse: collapse;">
                                <thead style="background: #f8fafc; color: var(--text-secondary); font-size: 12px; text-transform: uppercase;">
                                    <tr><th style="padding: 16px; text-align: left;">Código</th><th style="padding: 16px; text-align: left;">Producto</th><th style="padding: 16px; text-align: right;">Precio</th></tr>
                                </thead>
                                <tbody>
                                    ${results.map(p => `<tr style="border-bottom: 1px solid #f1f5f9;"><td style="padding:16px;">${p.code}</td><td style="padding:16px;">${p.name}</td><td style="padding:16px; text-align:right;">$ ${p.price.toLocaleString()}</td></tr>`).join('')}
                                    ${results.length === 0 ? '<tr><td colspan="3" style="padding:40px; text-align:center;">No se encontraron productos.</td></tr>' : ''}
                                </tbody>
                            </table>
                        `;
                    }
                }, 300);
            });
        }

        if (activeSection === 'config') {
            document.getElementById('resetDataBtn')?.addEventListener('click', async () => {
                const confirmed = await Alert.confirm("Esta acción eliminará permanentemente todas las devoluciones y rutas de prueba. No se puede deshacer.", "¿LIMPIAR TODO EL SISTEMA?");
                if (confirmed) {
                    const btn = document.getElementById('resetDataBtn');
                    const originalHtml = btn.innerHTML;
                    btn.disabled = true;
                    btn.innerHTML = '<div class="spinner" style="width:20px; height:20px; border-width:2px; border-top-color:white;"></div> Limpiando...';

                    const success = await db.resetTestData();
                    if (success) {
                        Alert.success("Sistema reiniciado con éxito.");
                        cache.lastFetch = 0; // Force re-fetch
                        activeSection = 'dashboard';
                        render();
                    } else {
                        Alert.error("Hubo un error al intentar limpiar los datos.");
                        btn.disabled = false;
                        btn.innerHTML = originalHtml;
                    }
                }
            });
        }
    };


    const generatePrintReport = async (routes, id) => {
        const route = routes.find(r => r.id === id);
        const returns = await db.getRouteReturns(id);

        // FORCED ISOLATION: Always ensure printArea is a direct child of body and clear it
        let printArea = document.getElementById('printArea');
        if (printArea) printArea.remove();

        printArea = document.createElement('div');
        printArea.id = 'printArea';
        document.body.appendChild(printArea);

        const totalValue = returns.reduce((sum, r) => sum + (r.total || 0), 0);
        const totalItems = returns.reduce((sum, r) => sum + (parseInt(r.quantity) || 0), 0);
        const today = new Date().toLocaleDateString('es-CO');
        const planilla = returns.length > 0 ? (returns[0].sheet || 'N/A') : 'N/A';

        printArea.innerHTML = `
            <div class="print-main-container">
                <div class="report-box" style="font-family: 'Inter', Arial, sans-serif; padding: 30px;">
                    
                    <div style="text-align: center; border-bottom: 2px solid black; padding-bottom: 20px; margin-bottom: 25px;">
                        <h1 style="margin: 0; font-size: 18pt; font-weight: 800; text-transform: uppercase; letter-spacing: 2px;">CONCENTRADO DE DEVOLUCIONES</h1>
                        <h2 style="margin: 8px 0 0; font-size: 13pt; font-weight: 700;">TAT DISTRIBUCIONES</h2>
                        <p style="margin: 4px 0 0; font-size: 9pt; color: #333; letter-spacing: 1px;">Control Operativo y Logístico</p>
                    </div>

                    <div style="display: grid; grid-template-columns: 1.5fr 1fr 1fr; border-bottom: 1.5px solid black; padding: 15px 0; margin-bottom: 25px;">
                        <div style="font-size: 10pt;">
                            <span style="font-weight: 800; text-transform: uppercase; font-size: 8pt; color: #555; display: block; margin-bottom: 4px;">Auxiliar / Ruta</span>
                            <span style="font-weight: 700; font-size: 11pt;">${route.userName.toUpperCase()}</span>
                        </div>
                        <div style="text-align: center; font-size: 10pt;">
                            <span style="font-weight: 800; text-transform: uppercase; font-size: 8pt; color: #555; display: block; margin-bottom: 4px;">Planilla Nº</span>
                            <span style="font-weight: 700; font-size: 11pt;">${planilla}</span>
                        </div>
                        <div style="text-align: right; font-size: 10pt;">
                            <span style="font-weight: 800; text-transform: uppercase; font-size: 8pt; color: #555; display: block; margin-bottom: 4px;">Fecha</span>
                            <span style="font-weight: 700; font-size: 11pt;">${route.date || today}</span>
                        </div>
                    </div>

                    <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
                        <thead>
                            <tr style="background: #f4f4f4;">
                                <th style="border: 1.5px solid black; padding: 12px 8px; text-align: left; font-size: 9pt; font-weight: 800; text-transform: uppercase;">FACTURA</th>
                                <th style="border: 1.5px solid black; padding: 12px 8px; text-align: left; font-size: 9pt; font-weight: 800; text-transform: uppercase;">PRODUCTO</th>
                                <th style="border: 1.5px solid black; padding: 12px 8px; text-align: center; font-size: 9pt; font-weight: 800; text-transform: uppercase;">CANT</th>
                                <th style="border: 1.5px solid black; padding: 12px 8px; text-align: right; font-size: 9pt; font-weight: 800; text-transform: uppercase;">TOTAL</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${returns.map(r => `
                                <tr>
                                    <td style="border: 1px solid black; padding: 10px 8px; font-size: 10pt; font-weight: 700;">${r.invoice}</td>
                                    <td style="border: 1px solid black; padding: 10px 8px; font-size: 10pt;">${(r.product_name || r.name || 'N/A').toUpperCase()}</td>
                                    <td style="border: 1px solid black; padding: 10px 8px; text-align: center; font-size: 10pt; font-weight: 700;">${r.quantity}</td>
                                    <td style="border: 1px solid black; padding: 10px 8px; text-align: right; font-size: 10pt; font-weight: 700;">$ ${(r.total || 0).toLocaleString()}</td>
                                </tr>
                            `).join('')}
                            <tr style="background: #f9f9f9;">
                                <td colspan="2" style="border: 1.5px solid black; padding: 15px 10px; text-align: right; font-size: 10pt; font-weight: 800;">TOTAL DEVOLUCIÓN:</td>
                                <td style="border: 1.5px solid black; padding: 15px 10px; text-align: center; font-size: 11pt; font-weight: 800;">${totalItems}</td>
                                <td style="border: 1.5px solid black; padding: 15px 10px; text-align: right; font-size: 11pt; font-weight: 800;">$ ${totalValue.toLocaleString()}</td>
                            </tr>
                        </tbody>
                    </table>

                    <div style="margin-top: 100px; display: grid; grid-template-columns: 1fr 1fr; gap: 100px; padding: 0 50px 20px;">
                        <div style="text-align: center;">
                            <div style="border-top: 2px solid black; margin-bottom: 8px;"></div>
                            <div style="font-size: 10pt; font-weight: 700; text-transform: uppercase;">Firma Auxiliar</div>
                        </div>
                        <div style="text-align: center;">
                            <div style="border-top: 2px solid black; margin-bottom: 8px;"></div>
                            <div style="font-size: 10pt; font-weight: 700; text-transform: uppercase;">Firma Bodega</div>
                        </div>
                    </div>

                    <div style="margin-top: 50px; border-top: 1px dashed #bbb; padding-top: 10px; text-align: center;">
                        <p style="font-size: 8pt; color: #666; margin: 0; font-style: italic;">
                            * Soporte oficial TAT DISTRIBUCIONES - Generado el ${new Date().toLocaleString('es-CO')}
                        </p>
                    </div>
                </div>
            </div>
        `;

        // Smallest possible delay to trigger the rendering before the print dialog
        setTimeout(() => {
            window.print();
            // Optional: Clean up after print to prevent DOM bloat
            if (printArea) printArea.innerHTML = '';
        }, 150);
    };


    const exportToCSV = (returns, routes) => {
        const today = new Date().toISOString().split('T')[0];
        const rows = [
            ['Fecha', 'Auxiliar', 'Factura', 'Planilla', 'Codigo', 'Producto', 'Cantidad', 'Motivo', 'Total', 'Foto']
        ];

        returns.forEach(r => {
            const route = routes.find(rt => rt.id === r.routeId);
            rows.push([
                r.timestamp ? new Date(r.timestamp).toLocaleDateString() : today,
                route ? route.userName : 'N/A',
                r.invoice,
                r.sheet || '',
                r.product_code || r.code || '',
                r.product_name || r.name || '',
                r.quantity,
                r.reason,
                r.total,
                r.evidence || ''
            ]);
        });

        const csvContent = "data:text/csv;charset=utf-8,"
            + rows.map(e => e.join(",")).join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `Devoluciones_${today}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    render();

    window.handleLogout = async () => {
        const confirmed = await Alert.confirm('¿Deseas cerrar la sesión activa?');
        if (confirmed) auth.logout();
    };

    window.onDisposeAdmin = () => {
        container.classList.remove('admin-mode');
        if (realtimeChannel) db.sb.removeChannel(realtimeChannel);
        delete window.handleLogout;
    };
};
