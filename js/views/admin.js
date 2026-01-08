import { db } from '../data.js';
import { auth } from '../auth.js';

export const renderAdminDashboard = (container, user) => {
    let activeSection = 'dashboard';

    // Cache data to prevent re-fetching on every tab switch
    let cache = {
        routes: [],
        returns: [],
        users: [],
        lastFetch: 0
    };

    const fetchData = async () => {
        if (cache.lastFetch === 0) {
            container.innerHTML = '<div style="padding:40px; text-align:center;">Cargando datos...</div>';
        }
        const [routes, returns, users] = await Promise.all([
            db.getRoutes(),
            db.getReturns(),
            db.getUsers()
        ]);
        cache.routes = routes;
        cache.returns = returns;
        cache.users = users.filter(u => u.role === 'auxiliar');
        cache.lastFetch = Date.now();
    };

    // --- REALTIME SUBSCRIPTION ---
    const setupRealtime = () => {
        if (!db.sb) return;

        const channel = db.sb.channel('realtime-returns')
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'return_items'
            }, async (payload) => {
                console.log('¡Nueva devolución detectada!', payload);
                // Option: Partial update or full fetch
                // Given the app structure, full fetch is safest for UI consistency
                await fetchData();
                await render(true);
            })
            .subscribe();

        return channel;
    };

    const realtimeChannel = setupRealtime();

    const render = async (skipFetch = false) => {
        if (!skipFetch && cache.lastFetch === 0) {
            await fetchData();
        }

        const { routes, returns, users } = cache;
        const activeRoutes = routes.filter(r => r.date === new Date().toISOString().split('T')[0]);
        const totalValue = returns.reduce((sum, r) => sum + r.total, 0);
        const productSearchTerm = '';

        const getSidebarLinkClass = (section) => {
            return activeSection === section
                ? 'sidebar-link active" style="display: flex; align-items: center; gap: 12px; padding: 12px 16px; color: white; background: rgba(99, 102, 241, 0.2); border-radius: 8px; margin-bottom: 8px; border-left: 3px solid var(--accent-color); text-decoration: none;'
                : 'sidebar-link" style="display: flex; align-items: center; gap: 12px; padding: 12px 16px; color: rgba(255,255,255,0.7); border-radius: 8px; margin-bottom: 8px; text-decoration: none; transition: 0.2s;';
        };

        container.innerHTML = `
            <!-- Sidebar -->
            <aside class="admin-sidebar" style="display: flex; flex-direction: column;">
                <div style="padding: 24px; border-bottom: 1px solid rgba(255,255,255,0.1);">
                    <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 8px;">
                        <span class="material-icons-round" style="color: var(--accent-color); font-size: 28px;">local_shipping</span>
                        <h2 style="color: white; font-size: 18px; margin: 0;">DevolucionesApp</h2>
                    </div>
                    <small style="color: rgba(255,255,255,0.6);">TAT DISTRIBUCIONES</small>
                </div>

                <nav style="flex-grow: 1; padding: 24px 12px;">
                    <a href="#" data-section="dashboard" class="${getSidebarLinkClass('dashboard')}">
                        <span class="material-icons-round" style="color: ${activeSection === 'dashboard' ? 'var(--accent-color)' : 'inherit'};">dashboard</span>
                        <span style="font-weight: 500;">Panel General</span>
                    </a>
                    <a href="#" data-section="auxiliares" class="${getSidebarLinkClass('auxiliares')}">
                        <span class="material-icons-round">people</span>
                        <span>Auxiliares</span>
                    </a>
                    <a href="#" data-section="productos" class="${getSidebarLinkClass('productos')}">
                        <span class="material-icons-round">inventory</span>
                        <span>Productos</span>
                    </a>
                    <a href="#" data-section="config" class="${getSidebarLinkClass('config')}">
                        <span class="material-icons-round">settings</span>
                        <span>Configuración</span>
                    </a>
                </nav>

                <div style="padding: 24px; border-top: 1px solid rgba(255,255,255,0.1);">
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <div style="width: 36px; height: 36px; background: var(--accent-color); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold;">A</div>
                        <div style="flex-grow: 1;">
                            <div style="font-size: 14px; font-weight: 600;">Administrador</div>
                            <small style="color: rgba(255,255,255,0.6);">Sesión Activa</small>
                        </div>
                        <button id="logoutBtn" style="background: none; border: none; color: white; cursor: pointer; opacity: 0.7;">
                            <span class="material-icons-round">logout</span>
                        </button>
                    </div>
                </div>
            </aside>

            <!-- Main Content -->
            <main class="admin-content">
                ${activeSection === 'dashboard' ? `
                    <header style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 32px;">
                        <div>
                            <h1 style="color: var(--primary-color);">Panel TAT DISTRIBUCIONES</h1>
                            <p>Gestión de Devoluciones y Registro Fotográfico</p>
                        </div>
                        <div style="display: flex; gap: 16px;">
                            <button id="refreshBtn" class="btn btn-secondary" style="height: 48px; border-radius: 12px; display: flex; align-items: center; gap: 8px; background: white; border: 1px solid #e2e8f0; color: var(--primary-color); padding: 0 20px; font-weight: 600; cursor: pointer;">
                                <span class="material-icons-round">refresh</span>
                                Actualizar Datos
                            </button>
                        </div>
                    </header>

                    <!-- Stats Grid -->
                    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; margin-bottom: 32px;">
                        <div class="card" style="border-top: 4px solid var(--primary-color);">
                            <div class="flex items-center gap-md">
                                <div style="background: rgba(15, 23, 42, 0.1); padding: 16px; border-radius: 12px; color: var(--primary-color);">
                                    <span class="material-icons-round" style="font-size: 32px;">local_shipping</span>
                                </div>
                                <div style="color: var(--primary-color);">
                                    <h2 style="font-size: 28px; margin:0;">${activeRoutes.length} <small style="font-size: 16px; color: var(--text-light);">/ ${users.length}</small></h2>
                                    <p style="margin: 0; font-weight: 500;">Rutas Activas</p>
                                </div>
                            </div>
                        </div>

                        <div class="card" style="border-top: 4px solid var(--accent-color);">
                            <div class="flex items-center gap-md">
                                 <div style="background: rgba(45, 212, 191, 0.1); padding: 16px; border-radius: 12px; color: var(--accent-color);">
                                    <span class="material-icons-round" style="font-size: 32px;">payments</span>
                                </div>
                                <div style="color: var(--primary-color);">
                                    <h2 style="font-size: 28px; margin:0;">$ ${totalValue.toLocaleString()}</h2>
                                    <p style="margin: 0; font-weight: 500;">Valor Devoluciones</p>
                                </div>
                            </div>
                        </div>

                        <div class="card" style="border-top: 4px solid var(--success-color);">
                            <div class="flex items-center gap-md">
                                <div style="background: rgba(74, 222, 128, 0.1); padding: 16px; border-radius: 12px; color: var(--success-color);">
                                    <span class="material-icons-round" style="font-size: 32px;">shopping_bag</span>
                                </div>
                                <div style="color: var(--primary-color);">
                                    <h2 style="font-size: 28px; margin:0;">${returns.length}</h2>
                                    <p style="margin: 0; font-weight: 500;">Items Recibidos</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 24px;">
                        <!-- Returns Table -->
                        <div class="card" style="padding: 0; overflow: hidden;">
                            <div style="padding: 20px; border-bottom: 1px solid #e2e8f0; background: white; display: flex; justify-content: space-between; align-items: center;">
                                 <h3 style="margin: 0;">Últimas Devoluciones</h3>
                            </div>
                            <div style="overflow-x: auto;">
                                <table style="width: 100%; border-collapse: collapse;">
                                    <thead style="background: #f8fafc; color: var(--text-secondary); font-size: 12px; text-transform: uppercase;">
                                        <tr>
                                            <th style="padding: 16px; text-align: left;">Hora</th>
                                            <th style="padding: 16px; text-align: left;">Auxiliar</th>
                                            <th style="padding: 16px; text-align: left;">Producto / Factura</th>
                                            <th style="padding: 16px; text-align: left;">Motivo</th>
                                            <th style="padding: 16px; text-align: right;">Total</th>
                                            <th style="padding: 16px; text-align: center;">Evidencia</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${returns.slice().reverse().slice(0, 10).map(r => {
            const route = routes.find(rt => rt.id === r.routeId);
            const auxName = route ? route.userName : 'Desconocido';
            return `
                                                <tr style="border-bottom: 1px solid #f1f5f9; transition: 0.2s;">
                                                    <td style="padding: 16px; color: var(--text-light);">${r.timestamp ? new Date(r.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}</td>
                                                    <td style="padding: 16px;">
                                                        <div style="font-weight: 500;">${auxName}</div>
                                                    </td>
                                                    <td style="padding: 16px;">
                                                        <div style="font-weight: 500;">${r.product_name || r.productName || 'N/A'}</div>
                                                        <div style="font-size: 12px; color: var(--text-light);">Doc: ${r.invoice}</div>
                                                    </td>
                                                    <td style="padding: 16px;">
                                                        <span style="background: #f1f5f9; color: var(--text-secondary); padding: 4px 8px; border-radius: 6px; font-size: 11px;">${r.reason}</span>
                                                    </td>
                                                    <td style="padding: 16px; text-align: right; font-weight: 600;">$ ${r.total.toLocaleString()}</td>
                                                    <td style="padding: 16px; text-align: center;">
                                                         ${r.evidence ? `<button class="view-photo-btn" data-photo="${r.evidence}" style="background: none; border: none; color: var(--accent-color); cursor: pointer;"><span class="material-icons-round">image</span></button>` : '—'}
                                                    </td>
                                                </tr>
                                            `;
        }).join('')}
                                    </tbody>
                                </table>
                            </div>
                            ${returns.length === 0 ? '<div style="padding: 40px; text-align: center; color: var(--text-light);">No hay devoluciones registradas hoy.</div>' : ''}
                        </div>

                        <!-- Routes Status -->
                        <div class="card" style="height: fit-content;">
                            <h3 class="mb-md">Estado de Rutas</h3>
                                 ${activeRoutes.map(r => `
                                    <div style="display: flex; align-items: center; gap: 12px; padding: 12px; border: 1px solid ${r.status === 'completed' ? 'var(--primary-color)' : '#f1f5f9'}; border-radius: 12px; background: ${r.status === 'completed' ? 'rgba(99, 102, 241, 0.05)' : 'transparent'};">
                                        <div style="width: 8px; height: 8px; background: ${r.status === 'completed' ? 'var(--primary-color)' : 'var(--success-color)'}; border-radius: 50%;"></div>
                                        <div style="flex-grow: 1;">
                                            <div style="font-weight: 600; font-size: 14px; color: ${r.status === 'completed' ? 'var(--primary-color)' : 'inherit'};">
                                                ${r.userName}
                                                ${r.status === 'completed' ? '<span style="font-size:10px; background:var(--primary-color); color:white; padding:2px 6px; border-radius:4px; margin-left:8px;">FINALIZADO</span>' : ''}
                                            </div>
                                            <small style="color: var(--text-light);">${r.startTime} ${r.endTime ? ' - ' + r.endTime : ''}</small>
                                        </div>
                                        <button class="print-route-btn" data-route-id="${r.id}" style="background: rgba(99, 102, 241, 0.1); border: none; color: var(--accent-color); padding: 8px; border-radius: 8px; cursor: pointer; display: flex; align-items: center; justify-content: center;">
                                            <span class="material-icons-round" style="font-size: 18px;">print</span>
                                        </button>
                                    </div>
                                 `).join('')}
                                 ${activeRoutes.length === 0 ? '<div style="text-align: center; color: var(--text-light); padding: 20px;">No hay rutas activas.</div>' : ''}
                            </div>
                        </div>
                    </div>
                ` : activeSection === 'auxiliares' ? `
                    <header class="mb-lg">
                        <h1 style="color: var(--primary-color);">Gestión de Auxiliares</h1>
                        <p>Listado de personal operativo registrado</p>
                    </header>
                    <div class="card" style="padding: 0;">
                        <table style="width: 100%; border-collapse: collapse;">
                            <thead style="background: #f8fafc; color: var(--text-secondary); font-size: 12px; text-transform: uppercase;">
                                <tr>
                                    <th style="padding: 16px; text-align: left;">Nombre Completo</th>
                                    <th style="padding: 16px; text-align: left;">Cédula / Usuario</th>
                                    <th style="padding: 16px; text-align: center;">Estado</th>
                                    <th style="padding: 16px; text-align: center;">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${users.map(u => `
                                    <tr style="border-bottom: 1px solid #f1f5f9; opacity: ${u.isActive ? '1' : '0.6'}">
                                        <td style="padding: 16px; font-weight: 500;">${u.name}</td>
                                        <td style="padding: 16px; color: var(--text-secondary);">${u.username}</td>
                                        <td style="padding: 16px; text-align: center;">
                                            <span style="background: ${u.isActive ? 'rgba(74, 222, 128, 0.1)' : 'rgba(239, 68, 68, 0.1)'}; color: ${u.isActive ? 'var(--success-color)' : 'var(--danger-color)'}; padding: 4px 12px; border-radius: 99px; font-size: 12px; font-weight: 600;">
                                                ${u.isActive ? 'Activo' : 'Inactivo'}
                                            </span>
                                        </td>
                                        <td style="padding: 16px; text-align: center;">
                                            <button class="toggle-user-btn btn-icon" data-user-id="${u.id}" data-active="${u.isActive}" style="background: none; border: 1px solid #ddd; border-radius: 8px; padding: 6px; cursor: pointer; color: ${u.isActive ? 'var(--danger-color)' : 'var(--success-color)'};">
                                                <span class="material-icons-round" style="font-size: 20px;">${u.isActive ? 'block' : 'check_circle'}</span>
                                            </button>
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                ` : activeSection === 'productos' ? `
                    <header class="mb-lg" style="display: flex; justify-content: space-between; align-items: flex-end;">
                        <div>
                            <h1 style="color: var(--primary-color);">Catálogo de Productos</h1>
                            <p>Inventario de TAT DISTRIBUCIONES - Búsqueda Rápida</p>
                        </div>
                        <div style="width: 300px;">
                            <div class="input-group" style="margin: 0;">
                                <input type="text" id="productSearch" class="input-field" placeholder="Buscar producto o código..." style="padding: 10px 16px;" value="${productSearchTerm}">
                            </div>
                        </div>
                    </header>
                    <div class="card" style="padding: 0;">
                         <div id="productTableContainer">
                             <div style="padding: 40px; text-align: center; color: var(--text-light);">
                                <span class="material-icons-round" style="font-size: 48px; opacity: 0.5;">search</span>
                                <p>Ingresa un término para buscar productos.</p>
                             </div>
                         </div>
                    </div>
                ` : `
                    <div class="card" style="margin-top: 40px; text-align: center; padding: 60px;">
                        <span class="material-icons-round" style="font-size: 64px; color: var(--text-light); opacity: 0.3;">construction</span>
                        <h2 style="margin-top: 24px;">Sección en Desarrollo</h2>
                        <p style="color: var(--text-light);">La sección de Configuración estará disponible próximamente.</p>
                        <button class="btn btn-primary mt-md" style="max-width: 200px; margin: 24px auto;" onclick="renderWithSection('dashboard')">
                            Volver al Panel
                        </button>
                    </div>
                `}
            </main>

            <!-- Photo Modal -->
            <div id="photoModal" class="hidden" style="position: fixed; inset: 0; background: rgba(0,0,0,0.85); z-index: 9999; display: flex; align-items: center; justify-content: center; padding: 20px; backdrop-filter: blur(5px);">
                <div class="card" style="max-width: 600px; width: 100%; position: relative; padding: 0; overflow: hidden; background: white; border-radius: 16px;">
                    <div style="padding: 16px; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; align-items: center;">
                        <h3 style="margin: 0; color: var(--primary-color);">Evidencia Fotográfica</h3>
                        <button id="closeModal" style="border: none; background: #f1f5f9; width: 32px; height: 32px; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center;">
                            <span class="material-icons-round" style="font-size: 20px;">close</span>
                        </button>
                    </div>
                    <div style="padding: 10px; background: #f8fafc; display: flex; justify-content: center; align-items: center;">
                        <img id="modalImage" src="" style="max-width: 100%; border-radius: 8px; max-height: 70vh; object-fit: contain; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
                    </div>
                </div>
            </div>
            
            <div id="printArea" class="hidden"></div>
        `;

        // Event Listeners
        document.getElementById('logoutBtn').addEventListener('click', () => {
            auth.logout();
        });

        // Sidebar Navigation
        document.querySelectorAll('.sidebar-link').forEach(link => {
            link.addEventListener('click', async (e) => {
                e.preventDefault();
                activeSection = link.dataset.section;
                // Use cache for instant switching
                await render(true);
            });
        });

        if (activeSection === 'dashboard') {
            // Refresh Button
            const refreshBtn = document.getElementById('refreshBtn');
            if (refreshBtn) {
                refreshBtn.addEventListener('click', async () => {
                    const originalHTML = refreshBtn.innerHTML;
                    refreshBtn.innerHTML = '<span class="material-icons-round spin">refresh</span>...';
                    refreshBtn.style.opacity = '0.5';
                    refreshBtn.disabled = true;

                    await fetchData();
                    await render(true); // Re-render with new data from cache
                });
            }
            // Updated to be async compatible, though simpler here

            // Individual Print Buttons
            document.querySelectorAll('.print-route-btn').forEach(btn => {
                btn.addEventListener('click', async () => {
                    const routeId = btn.getAttribute('data-route-id');
                    // Add loading state to button
                    const originalContent = btn.innerHTML;
                    btn.innerHTML = '...';
                    await generatePrintReport(routes, routeId);
                    btn.innerHTML = originalContent;
                });
            });

            // Photo Modal Logic
            const modal = document.getElementById('photoModal');
            const modalImg = document.getElementById('modalImage');

            document.querySelectorAll('.view-photo-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const photo = btn.getAttribute('data-photo');
                    if (photo && photo !== 'null') {
                        modalImg.src = photo;
                        modal.classList.remove('hidden');
                    } else {
                        alert("No hay foto disponible para esta devolución.");
                    }
                });
            });

            document.getElementById('closeModal').addEventListener('click', () => {
                modal.classList.add('hidden');
            });

            // Close modal on click outside
            modal.addEventListener('click', (e) => {
                if (e.target === modal) modal.classList.add('hidden');
            });
        }


        if (activeSection === 'productos') {
            const searchInput = document.getElementById('productSearch');
            let debounceTimer;

            searchInput.addEventListener('input', (e) => {
                const term = e.target.value;
                if (term.length < 2) return;

                clearTimeout(debounceTimer);
                debounceTimer = setTimeout(async () => {
                    const results = await db.searchProducts(term);
                    document.getElementById('productTableContainer').innerHTML = renderProductTable(results);
                }, 300);
            });
        }

        if (activeSection === 'auxiliares') {
            document.querySelectorAll('.toggle-user-btn').forEach(btn => {
                btn.addEventListener('click', async () => {
                    const userId = btn.dataset.userId;
                    const currentlyActive = btn.dataset.active === 'true';
                    const newStatus = !currentlyActive;

                    if (confirm(`¿Estás seguro de que deseas ${newStatus ? 'activar' : 'inactivar'} a este auxiliar?`)) {
                        const success = await db.updateUserStatus(userId, newStatus);
                        if (success) {
                            // Update local cache and re-render
                            const userToUpdate = cache.users.find(u => u.id === userId);
                            if (userToUpdate) userToUpdate.isActive = newStatus;
                            await render(true);
                        } else {
                            alert("Error al actualizar el estado del usuario.");
                        }
                    }
                });
            });
        }
    };


    const renderProductTable = (products) => {
        return `
            <table style="width: 100%; border-collapse: collapse;">
                <thead style="background: #f8fafc; color: var(--text-secondary); font-size: 12px; text-transform: uppercase;">
                    <tr>
                        <th style="padding: 16px; text-align: left;">Código</th>
                        <th style="padding: 16px; text-align: left;">Descripción</th>
                        <th style="padding: 16px; text-align: right;">Precio</th>
                    </tr>
                </thead>
                <tbody>
                    ${products.map(p => `
                        <tr style="border-bottom: 1px solid #f1f5f9;">
                            <td style="padding: 16px; font-weight: 600; color: var(--text-secondary);">${p.code}</td>
                            <td style="padding: 16px;">${p.name}</td>
                            <td style="padding: 16px; text-align: right; font-weight: 600;">$ ${p.price.toLocaleString()}</td>
                        </tr>
                    `).join('')}
                    ${products.length === 0 ? '<tr><td colspan="3" style="padding: 40px; text-align: center; color: var(--text-light);">No se encontraron productos.</td></tr>' : ''}
                </tbody>
            </table>
        `;
    };

    const renderWithSection = async (section) => {
        activeSection = section;
        await render();
    };
    window.renderWithSection = renderWithSection; // Make it accessible locally for buttons

    const generatePrintReport = async (routes, specificRouteId) => {
        const printArea = document.getElementById('printArea');
        printArea.classList.remove('hidden');

        const route = routes.find(r => r.id === specificRouteId);
        if (!route) {
            alert("Error: Ruta no encontrada.");
            return;
        }

        // FETCH COMPLETE DATA FOR THIS SPECIFIC ROUTE
        // This fixes the bug where returns were missing due to limits or filtering
        const routeReturns = await db.getRouteReturns(specificRouteId);

        if (routeReturns.length === 0) {
            alert("Esta ruta no tiene devoluciones registradas.");
            printArea.classList.add('hidden');
            return;
        }

        const planilla = routeReturns[0]?.sheet || 'N/A';
        const totalValue = routeReturns.reduce((sum, r) => sum + r.total, 0);

        let html = `
                <div class="print-header page-break">
                    <div style="border: 2px solid #000; padding: 20px; max-width: 800px; margin: 0 auto; box-sizing: border-box;">
                        <div style="border-bottom: 2px solid #000; padding-bottom: 15px; margin-bottom: 20px; text-align: center;">
                            <h2 style="margin: 0; font-size: 20px; font-weight: 800; text-transform: uppercase;">Formato de Devolución de Mercancía</h2>
                            <h3 style="margin: 5px 0 0; font-size: 16px; font-weight: 600;">TAT DISTRIBUCIONES</h3>
                            <p style="margin: 5px 0 0; font-size: 12px; color: #444;">Control Operativo y Logístico</p>
                        </div>
                        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px; margin-bottom: 20px; border: 1px solid #000; padding: 10px;">
                            <div>
                                <div style="font-size: 11px; font-weight: bold;">Auxiliar / Ruta:</div>
                                <div style="font-size: 14px; font-weight: bold;">${route.userName.toUpperCase()}</div>
                            </div>
                            <div style="text-align: center;">
                                <div style="font-size: 11px; font-weight: bold;">Planilla N°:</div>
                                <div style="font-size: 16px; font-weight: 900;">${planilla}</div>
                            </div>
                            <div style="text-align: right;">
                                <div style="font-size: 11px; font-weight: bold;">Fecha:</div>
                                <div style="font-size: 14px;">${route.date}</div>
                            </div>
                        </div>
                        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 11px;">
                            <thead>
                                <tr style="background: #e5e5e5;">
                                    <th style="padding: 6px; border: 1px solid #000; text-align: left;">FACTURA</th>
                                    <th style="padding: 6px; border: 1px solid #000; text-align: left;">PRODUCTO</th>
                                    <th style="padding: 6px; border: 1px solid #000; text-align: center;">CANT</th>
                                    <th style="padding: 6px; border: 1px solid #000; text-align: right;">TOTAL</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${routeReturns.map(r => `
                                    <tr>
                                        <td style="padding: 5px; border: 1px solid #000;">${r.invoice}</td>
                                        <td style="padding: 5px; border: 1px solid #000;">${r.product_name || r.name || 'N/A'}</td>
                                        <td style="padding: 5px; border: 1px solid #000; text-align: center;">${r.quantity}</td>
                                        <td style="padding: 5px; border: 1px solid #000; text-align: right;">$ ${r.total.toLocaleString()}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                            <tfoot>
                                <tr style="font-weight: bold;">
                                    <td colspan="3" style="padding: 8px; border: 1px solid #000; text-align: right;">TOTAL:</td>
                                    <td style="padding: 8px; border: 1px solid #000; text-align: right;">$ ${totalValue.toLocaleString()}</td>
                                </tr>
                            </tfoot>
                        </table>
                        <div style="margin-top: 40px; display: grid; grid-template-columns: 1fr 1fr; gap: 40px; text-align: center;">
                            <div><div style="border-bottom: 1px solid #000; height: 40px;"></div><small>Firma Auxiliar</small></div>
                            <div><div style="border-bottom: 1px solid #000; height: 40px;"></div><small>Firma Bodega</small></div>
                        </div>
                    </div>
                </div>
            `;

        printArea.innerHTML = html;
        window.print();
        setTimeout(() => {
            printArea.innerHTML = '';
            printArea.classList.add('hidden');
        }, 1000);
    };

    render();

    // Export a cleanup function if needed, but for this SPA simple closure works
    window.onDisposeAdmin = () => {
        if (realtimeChannel) db.sb.removeChannel(realtimeChannel);
    };
};
