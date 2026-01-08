import { db } from '../data.js';
import { auth } from '../auth.js';

export const renderAdminDashboard = (container, user) => {
    container.classList.add('admin-mode');
    let activeSection = 'dashboard';
    let cache = { routes: [], returns: [], users: [], lastFetch: 0 };

    const fetchData = async () => {
        const contentArea = document.getElementById('admin-content');
        if (contentArea && cache.lastFetch === 0) {
            contentArea.innerHTML = '<div style="padding:80px; text-align:center; color: var(--primary-color);"><div class="spinner" style="margin: 0 auto 20px;"></div><p style="font-weight: 500;">Sincronizando información...</p></div>';
        }
        try {
            const [routes, returns, users] = await Promise.all([
                db.getRoutes(),
                db.getReturns(50),
                db.getUsers()
            ]);
            cache.routes = routes;
            cache.returns = returns;
            cache.users = users.filter(u => u.role === 'auxiliar');
            cache.lastFetch = Date.now();
        } catch (e) { console.error("Fetch error:", e); }
    };

    const setupRealtime = () => {
        if (!db.sb) return;
        return db.sb.channel('realtime-admin')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'return_items' }, async () => {
                await fetchData();
                renderSection();
            })
            .subscribe();
    };

    const realtimeChannel = setupRealtime();

    const render = async (skipFetch = false) => {
        if (!document.getElementById('admin-layout')) {
            renderShell();
        }
        if (!skipFetch && cache.lastFetch === 0) {
            await fetchData();
        }
        renderSection();
    };

    const renderShell = () => {
        container.innerHTML = `
            <div id="admin-layout" style="display: grid; grid-template-columns: 280px 1fr; width: 100%; height: 100vh; background: #f8fafc;">
                <aside class="admin-sidebar" style="display: flex; flex-direction: column; background: #0f172a; border-right: 1px solid rgba(255,255,255,0.1);">
                    <div style="padding: 24px; border-bottom: 1px solid rgba(255,255,255,0.1);">
                        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 8px;">
                            <span class="material-icons-round" style="color: var(--accent-color); font-size: 28px;">local_shipping</span>
                            <h2 style="color: white; font-size: 18px; margin: 0;">DevolucionesApp</h2>
                        </div>
                        <small style="color: rgba(255,255,255,0.6);">TAT DISTRIBUCIONES</small>
                    </div>
                    <nav id="admin-nav" style="flex-grow: 1; padding: 24px 12px;">
                        ${renderNavLinks()}
                    </nav>
                    <div style="padding: 24px; border-top: 1px solid rgba(255,255,255,0.1);">
                        <div style="display: flex; align-items: center; gap: 12px;">
                            <div style="width: 40px; height: 40px; background: var(--accent-color); border-radius: 12px; display: flex; align-items: center; justify-content: center; color: white; font-weight: 700;">${user.name.charAt(0)}</div>
                            <div style="overflow: hidden;">
                                <div style="color: white; font-weight: 600; font-size: 14px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${user.name}</div>
                                <div style="color: rgba(255,255,255,0.5); font-size: 12px;">Administrador</div>
                            </div>
                        </div>
                        <button id="logoutBtn" onclick="auth.logout()" class="btn" style="margin-top: 20px; background: rgba(239, 68, 68, 0.1); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.2); height: 44px; width: 100%; font-size: 13px;">
                            <span class="material-icons-round">logout</span> Cerrar Sesión
                        </button>
                    </div>
                </aside>
                <main id="admin-content" style="overflow-y: auto; padding: 40px;"></main>
            </div>
            <style>
                .sidebar-link { display: flex; align-items: center; gap: 12px; padding: 12px 16px; color: rgba(255,255,255,0.7); border-radius: 8px; margin-bottom: 8px; text-decoration: none; transition: 0.2s; font-weight: 500; }
                .sidebar-link:hover { background: rgba(255,255,255,0.05); color: white; }
                .sidebar-link.active { color: white; background: rgba(99, 102, 241, 0.2); border-left: 3px solid var(--accent-color); }
                .sidebar-link .material-icons-round { font-size: 20px; }
                .spinner { width: 32px; height: 32px; border: 3px solid #e2e8f0; border-top: 3px solid var(--primary-color); border-radius: 50%; animation: spin 1s linear infinite; }
                @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
            </style>
        `;
        document.getElementById('admin-nav').addEventListener('click', (e) => {
            const link = e.target.closest('[data-section]');
            if (link) {
                activeSection = link.dataset.section;
                document.getElementById('admin-nav').innerHTML = renderNavLinks();
                renderSection();
            }
        });
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
        const { routes, returns, users } = cache;
        const activeRoutes = routes.filter(r => r.date === new Date().toISOString().split('T')[0]);
        const totalValue = returns.reduce((sum, r) => sum + r.total, 0);

        contentArea.innerHTML = `
            ${activeSection === 'dashboard' ? renderDashboard(activeRoutes, returns, routes, users, totalValue) :
                activeSection === 'auxiliares' ? renderAuxiliares(users) :
                    activeSection === 'productos' ? renderProductos() : renderConfig()}
        `;
        attachEventListeners();
    };

    const renderDashboard = (activeRoutes, returns, routes, users, totalValue) => `
        <header style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 32px;">
            <div><h1 style="color: var(--primary-color);">Panel TAT DISTRIBUCIONES</h1><p>Gestión de Devoluciones y Registro Fotográfico</p></div>
            <button id="refreshBtn" class="btn btn-secondary" style="height: 48px; border-radius: 12px; display: flex; align-items: center; gap: 8px; background: white; border: 1px solid #e2e8f0; color: var(--primary-color); padding: 0 20px; font-weight: 600; cursor: pointer;">
                <span class="material-icons-round">refresh</span> Actualizar Datos
            </button>
        </header>
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; margin-bottom: 32px;">
            ${renderStatCard('Rutas Activas', `${activeRoutes.length} / ${users.length}`, 'local_shipping', 'var(--primary-color)')}
            ${renderStatCard('Valor Devoluciones', `$ ${totalValue.toLocaleString()}`, 'payments', 'var(--accent-color)')}
            ${renderStatCard('Items Recibidos', returns.length, 'shopping_bag', 'var(--success-color)')}
        </div>
        <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 24px;">
            <div class="card" style="padding: 0; overflow: hidden;">
                <div style="padding: 20px; border-bottom: 1px solid #e2e8f0; background: white;"><h3 style="margin: 0;">Últimas Devoluciones</h3></div>
                <div style="overflow-x: auto;">
                    <table style="width: 100%; border-collapse: collapse;">
                        <thead style="background: #f8fafc; color: var(--text-secondary); font-size: 12px; text-transform: uppercase;">
                            <tr><th style="padding: 16px; text-align: left;">Hora</th><th style="padding: 16px; text-align: left;">Auxiliar</th><th style="padding: 16px; text-align: left;">Producto / Factura</th><th style="padding: 16px; text-align: left;">Motivo</th><th style="padding: 16px; text-align: right;">Total</th><th style="padding: 16px; text-align: center;">Evidencia</th></tr>
                        </thead>
                        <tbody>
                            ${returns.slice().reverse().slice(0, 10).map(r => {
        const route = routes.find(rt => rt.id === r.routeId);
        return `<tr style="border-bottom: 1px solid #f1f5f9;">
                                    <td style="padding: 16px; color: var(--text-light);">${r.timestamp ? new Date(r.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}</td>
                                    <td style="padding: 16px; font-weight: 500;">${route ? route.userName : 'Desconocido'}</td>
                                    <td style="padding: 16px;"><div style="font-weight: 600;">${r.product_name || r.productName || 'N/A'}</div><small style="color: var(--text-light);">Doc: ${r.invoice}</small></td>
                                    <td style="padding: 16px;"><span style="background: #f1f5f9; color: var(--text-secondary); padding: 4px 8px; border-radius: 6px; font-size: 11px;">${r.reason}</span></td>
                                    <td style="padding: 16px; text-align: right; font-weight: 600;">$ ${r.total.toLocaleString()}</td>
                                    <td style="padding: 16px; text-align: center;">${r.evidence ? `<button class="view-photo-btn" data-photo="${r.evidence}" style="background: none; border: none; color: var(--accent-color); cursor: pointer;"><span class="material-icons-round">image</span></button>` : '—'}</td>
                                </tr>`;
    }).join('')}
                        </tbody>
                    </table>
                </div>
                ${returns.length === 0 ? '<div style="padding: 40px; text-align: center; color: var(--text-light);">No hay devoluciones registradas hoy.</div>' : ''}
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
        <div class="card" style="border-top: 4px solid ${color};">
            <div class="flex items-center gap-md">
                <div style="background: ${color}22; padding: 16px; border-radius: 12px; color: ${color};"><span class="material-icons-round" style="font-size: 32px;">${icon}</span></div>
                <div><h2 style="font-size: 24px; margin:0;">${val}</h2><p style="margin: 0; font-weight: 500; font-size: 14px; color: var(--text-light);">${title}</p></div>
            </div>
        </div>
    `;

    const renderAuxiliares = (users) => `
        <header class="mb-lg"><h1 style="color: var(--primary-color);">Gestión de Auxiliares</h1><p>Control de acceso para personal operativo</p></header>
        <div class="card" style="padding: 0;">
            <table style="width: 100%; border-collapse: collapse;">
                <thead style="background: #f8fafc; color: var(--text-secondary); font-size: 12px; text-transform: uppercase;">
                    <tr><th style="padding: 16px; text-align: left;">Nombre</th><th style="padding: 16px; text-align: left;">Usuario</th><th style="padding: 16px; text-align: center;">Estado</th><th style="padding: 16px; text-align: center;">Acción</th></tr>
                </thead>
                <tbody>
                    ${users.map(u => `
                        <tr style="border-bottom: 1px solid #f1f5f9; opacity: ${u.isActive ? '1' : '0.6'}">
                            <td style="padding: 16px;">${u.name}</td><td style="padding: 16px;">${u.username}</td>
                            <td style="padding: 16px; text-align: center;"><span style="background: ${u.isActive ? '#dcfce7' : '#fee2e2'}; color: ${u.isActive ? '#15803d' : '#991b1b'}; padding: 4px 12px; border-radius: 99px; font-size: 12px; font-weight: 600;">${u.isActive ? 'Activo' : 'Inactivo'}</span></td>
                            <td style="padding: 16px; text-align: center;"><button class="toggle-user-btn btn" data-user-id="${u.id}" data-active="${u.isActive}" style="background: none; border: 1px solid #ddd; color: ${u.isActive ? '#ef4444' : '#22c55e'}; height: 36px; padding: 0 12px;">${u.isActive ? 'Desactivar' : 'Activar'}</button></td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;

    const renderProductos = () => `
        <header style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 32px;">
            <div><h1 style="color: var(--primary-color);">Búsqueda de Productos</h1><p>Consulta rápida de catálogo e inventario</p></div>
            <div style="width: 350px;"><input type="text" id="productSearch" class="input-field" placeholder="Buscar por nombre o código..." style="height: 48px; border-radius: 12px;"></div>
        </header>
        <div class="card" style="padding: 0;"><div id="productTableContainer"><div style="padding: 60px; text-align: center; color: var(--text-light);"><span class="material-icons-round" style="font-size: 48px; opacity: 0.3;">search</span><p>Ingresa al menos 2 caracteres para buscar.</p></div></div></div>
    `;

    const renderConfig = () => `<div class="card" style="text-align: center; padding: 80px;"><span class="material-icons-round" style="font-size: 64px; color: var(--text-light); opacity: 0.2;">settings</span><h2>Configuración General</h2><p>Próximamente disponible</p></div>`;

    const attachEventListeners = () => {
        if (activeSection === 'dashboard') {
            document.getElementById('refreshBtn')?.addEventListener('click', async () => {
                await fetchData();
                renderSection();
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
        }

        if (activeSection === 'auxiliares') {
            document.querySelectorAll('.toggle-user-btn').forEach(btn => {
                btn.addEventListener('click', async () => {
                    const id = btn.dataset.userId;
                    const next = btn.dataset.active !== 'true';
                    if (confirm(`¿Deseas ${next ? 'activar' : 'desactivar'} este usuario?`)) {
                        await db.updateUserStatus(id, next);
                        await fetchData();
                        renderSection();
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
                    document.getElementById('productTableContainer').innerHTML = `
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
                }, 300);
            });
        }
    };

    const generatePrintReport = async (routes, id) => {
        const route = routes.find(r => r.id === id);
        const returns = await db.getRouteReturns(id);
        const printArea = document.getElementById('printArea');
        printArea.classList.remove('hidden');
        printArea.innerHTML = `
            <div style="border: 2px solid #000; padding: 20px; max-width: 800px; margin: 0 auto;">
                <h2 style="text-align: center; text-transform: uppercase;">Reporte de Devoluciones</h2>
                <div style="display: grid; grid-template-columns: 1fr 1fr; margin: 20px 0;">
                    <div><strong>Auxiliar:</strong> ${route.userName}</div>
                    <div style="text-align: right;"><strong>Fecha:</strong> ${route.date}</div>
                </div>
                <table style="width: 100%; border-collapse: collapse;">
                    <thead style="background: #eee;">
                        <tr><th style="border: 1px solid #000; padding: 8px;">Factura</th><th style="border: 1px solid #000; padding: 8px;">Producto</th><th style="border: 1px solid #000; padding: 8px;">Cant</th><th style="border: 1px solid #000; padding: 8px;">Total</th></tr>
                    </thead>
                    <tbody>
                        ${returns.map(r => `<tr><td style="border: 1px solid #000; padding: 8px;">${r.invoice}</td><td style="border: 1px solid #000; padding: 8px;">${r.product_name || 'N/A'}</td><td style="border: 1px solid #000; padding: 8px; text-align: center;">${r.quantity}</td><td style="border: 1px solid #000; padding: 8px; text-align: right;">$ ${r.total.toLocaleString()}</td></tr>`).join('')}
                    </tbody>
                </table>
            </div>
        `;
        window.print();
        printArea.classList.add('hidden');
    };

    render();
    window.onDisposeAdmin = () => {
        container.classList.remove('admin-mode');
        if (realtimeChannel) db.sb.removeChannel(realtimeChannel);
    };
};
