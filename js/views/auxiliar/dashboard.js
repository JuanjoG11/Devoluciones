import { db } from '../../data.js';
import { Alert } from '../../utils/ui.js';
import { formatPrice, formatTime12h } from '../../utils/formatters.js';

export const renderDashboard = (container, user, state, returns, currentRoute, render, updateSyncUI) => {
    const activeReturns = returns.filter(r => !r.isResale);
    const totalValue = activeReturns.reduce((sum, r) => sum + r.total, 0);
    const resoldReturns = returns.filter(r => r.isResale);

    const isSelecting = state.view === 'dashboard' && state.isSelectingForResale;
    if (!state.selectedItems) state.selectedItems = [];

    container.innerHTML = `
        <div id="pwa-install-banner" style="display:none;"></div>
        <header class="app-header">
            <div style="flex: 1; min-width: 0;">
                <h3 style="color: white; margin: 0; font-size: 1.1rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                    ${(user.name || 'Auxiliar').split(' ')[0]}
                </h3>
                <div id="syncStatus" style="font-size: 10px; opacity: 0.8; display: flex; align-items: center; gap: 4px;">
                    <span class="material-icons-round" style="font-size: 12px;">cloud_done</span>
                    Sincronizado
                </div>
            </div>
            <div class="header-actions">
                ${currentRoute && currentRoute.status !== 'completed' ? `
                    <button id="endRouteBtn" style="background: var(--secondary-accent); border: none; color: white; padding: 8px 16px; border-radius: 10px; cursor: pointer; font-size: 12px; font-weight: 900; box-shadow: 0 4px 12px var(--secondary-glow); text-transform: uppercase; letter-spacing: 0.5px;">
                        FINALIZAR RUTA
                    </button>
                ` : ''}
                ${currentRoute && currentRoute.status === 'completed' ? `
                    <div style="background: var(--success-color); color: white; padding: 6px 12px; border-radius: 6px; font-size: 10px; font-weight: 800; white-space: nowrap;">
                        FINALIZADO
                    </div>
                ` : ''}
                <button id="logoutBtn" onclick="window.handleLogout()" style="background:none; border:none; color:white; padding: 4px; display: flex; align-items: center; cursor: pointer;">
                    <span class="material-icons-round">logout</span>
                </button>
            </div>
        </header>

        <div class="main-content" style="padding: 16px 12px; padding-bottom: 100px;">
            ${!state.routeStarted ? `
                <div class="card text-center" style="margin-top: 40px;">
                    <span class="material-icons-round" style="font-size: 64px; color: var(--primary-light); opacity: 0.5;">commute</span>
                    <h2 class="mt-md">Iniciar Ruta</h2>
                    <p class="mb-md">Debes iniciar tu ruta para poder registrar devoluciones.</p>
                    <button id="startRouteBtn" class="btn btn-primary">
                        <span class="material-icons-round">play_arrow</span>
                        COMENZAR JORNADA
                    </button>
                </div>
            ` : `
                <div id="offlineBanner" class="card" style="display: none; background: #fff3cd; color: #856404; padding: 10px; margin-bottom: 16px; font-size: 13px; border: 1px solid #ffeeba;">
                    <span class="material-icons-round" style="font-size: 16px; vertical-align: middle;">offline_bolt</span>
                    Sin conexión. Guardando de forma local.
                </div>

                <div class="card" style="background: var(--grad-electric); color: white; margin-bottom: 32px; padding: 32px 24px; border: none; box-shadow: var(--shadow-blue); position: relative; overflow: hidden; border-bottom: 6px solid var(--secondary-accent); border-radius: 28px;">
                    <div style="position: absolute; right: -20px; top: -20px; opacity: 0.1;"><span class="material-icons-round" style="font-size: 120px;">payments</span></div>
                    <div class="flex justify-between items-center" style="gap: 16px; position: relative; z-index: 1;">
                        <div style="flex: 1; min-width: 0;">
                            <small style="opacity: 0.9; text-transform: uppercase; letter-spacing: 1.5px; font-weight: 800; font-size: 10px;">TOTAL COBRADO</small>
                            <h2 style="color: white; font-size: 32px; margin: 4px 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-weight: 900; letter-spacing: -1.5px;">${formatPrice(totalValue)}</h2>
                            ${resoldReturns.length > 0 ? `<div style="font-size: 10px; font-weight: 700; background: rgba(0,0,0,0.2); padding: 4px 8px; border-radius: 10px; display: inline-block;">-${formatPrice(returns.reduce((s, r) => r.isResale ? s + r.total : s, 0))} REVENTA</div>` : ''}
                        </div>
                        <div style="text-align: right; background: var(--grad-lava); padding: 12px 16px; border-radius: 20px; box-shadow: var(--shadow-orange); flex-shrink: 0; min-width: 70px;">
                            <div style="font-size: 24px; font-weight: 900; color: white; line-height: 1;">${activeReturns.length}</div>
                            <small style="color: rgba(255,255,255,0.9); font-weight: 800; font-size: 10px; text-transform: uppercase;">Activos</small>
                        </div>
                    </div>
                </div>

                ${returns.length === 0 ? `
                    <div class="text-center" style="margin-top: 60px; opacity: 0.6;">
                        <span class="material-icons-round" style="font-size: 48px;">inventory_2</span>
                        <p>No tienes devoluciones registradas</p>
                    </div>
                ` : `
                    <div class="flex flex-col gap-sm" id="returnsList">
                        ${returns.map(r => {
        const isSelected = state.selectedItems.includes(r.id);
        const isResold = !!r.isResale;
        const isTotal = (r.productName || r.name) === 'DEVOLUCIÓN TOTAL';
        return `
                            <div class="list-item ${isSelected ? 'selected-for-resale' : ''} ${isResold ? 'resold-item' : ''} ${isTotal ? 'total-return-item' : ''}" 
                                 data-id="${r.id}" 
                                 data-resold="${isResold}"
                                 data-is-total="${isTotal}"
                                 style="padding: 12px; border-radius: 12px; cursor: ${isResold || (isSelecting && isTotal) ? 'default' : 'pointer'}; border: 2px solid ${isSelected ? 'var(--secondary-accent)' : 'transparent'}; transition: all 0.2s ease; opacity: ${isResold || (isSelecting && isTotal) ? '0.75' : '1'}; background: ${isResold ? 'rgba(34, 197, 94, 0.03)' : 'white'};">
                                ${isSelecting && !isResold ? `
                                    <div style="margin-right: 12px; display: flex; align-items: center;">
                                        <span class="material-icons-round" style="color: ${isTotal ? '#f1f5f9' : (isSelected ? 'var(--secondary-accent)' : '#ddd')}; font-size: 24px;">
                                            ${isTotal ? 'block' : (isSelected ? 'check_box' : 'check_box_outline_blank')}
                                        </span>
                                    </div>
                                ` : (isSelecting && isResold ? `<div style="margin-right: 12px; width: 24px;"></div>` : '')}
                                <div style="flex: 1; min-width: 0; padding-right: 8px;">
                                    <div style="display: flex; align-items: center; gap: 6px;">
                                        <div style="font-weight: 600; font-size: 13px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${r.productName || r.name || 'Producto'}</div>
                                        ${isResold ? `<span style="background: var(--success-color); color: white; font-size: 9px; font-weight: 900; padding: 3px 8px; border-radius: 6px; text-transform: uppercase; letter-spacing: 0.5px; box-shadow: 0 2px 4px rgba(34, 197, 94, 0.3);">REVENTA</span>` : ''}
                                    </div>
                                    <small style="font-size: 11px;"><b>Fac: ${r.invoice || '—'}</b> ${isResold ? `• <b style="color: var(--success-color);">Cli: ${r.resaleCustomerCode}</b>` : `• ${r.reason}`} • Cant: ${r.quantity}</small>
                                </div>
                                <div style="text-align: right; flex-shrink: 0;">
                                    <div style="font-weight: 600; font-size: 14px;">${formatPrice(r.total)}</div>
                                    <div style="display: flex; justify-content: flex-end; gap: 4px; margin-top: 4px;">
                                        ${r.pending ? '<span class="material-icons-round" style="font-size: 14px; color: #ffa500;" title="Pendiente de sincronizar">sync_problem</span>' : ''}
                                        ${r.evidence ? '<span class="material-icons-round" style="font-size: 14px; color: var(--accent-color);">photo_camera</span>' : ''}
                                    </div>
                                </div>
                            </div>
                        `}).join('')}
                    </div>
                `}
                
                <div style="position: fixed; bottom: 24px; left: 24px; right: 24px; display: flex; justify-content: space-between; pointer-events: none;">
                    <div>
                        ${!isSelecting ? `
                            <button id="resaleModeBtn" class="btn" style="pointer-events: auto; background: var(--secondary-accent); color: white; border-radius: 99px; height: 56px; padding: 0 24px; font-weight: 800; box-shadow: var(--shadow-orange); display: flex; align-items: center; gap: 8px; border: none;">
                                <span class="material-icons-round">swap_horiz</span>
                                REVENDER
                            </button>
                        ` : `
                            <button id="cancelResaleBtn" class="btn" style="pointer-events: auto; background: #94a3b8; color: white; border-radius: 99px; height: 56px; padding: 0 24px; font-weight: 800; display: flex; align-items: center; gap: 8px; border: none;">
                                <span class="material-icons-round">close</span>
                                CANCELAR
                            </button>
                        `}
                    </div>
                    <div>
                        ${isSelecting ? `
                            <button id="continueResaleBtn" class="btn" style="pointer-events: auto; background: var(--success-color); color: white; border-radius: 99px; height: 56px; padding: 0 24px; font-weight: 800; box-shadow: 0 4px 12px rgba(34, 197, 94, 0.3); display: flex; align-items: center; gap: 8px; border: none; ${state.selectedItems.length === 0 ? 'opacity: 0.5; pointer-events: none;' : ''}">
                                <span class="material-icons-round">arrow_forward</span>
                                CONTINUAR (${state.selectedItems.length})
                            </button>
                        ` : `
                            <button id="addReturnBtn" class="fab" style="pointer-events: auto; position: static; display: ${currentRoute && currentRoute.status === 'completed' ? 'none' : 'flex'}">
                                <span class="material-icons-round">add</span>
                            </button>
                        `}
                    </div>
                </div>
            `}
        </div>
    `;

    // Event Listeners
    if (!state.routeStarted) {
        document.getElementById('startRouteBtn')?.addEventListener('click', async () => {
            const newRoute = {
                userId: user.id, username: user.username, userName: user.name,
                startTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }),
                date: new Date().toLocaleDateString('en-CA')
            };
            console.log("[startRouteBtn] Creating route with data:", newRoute);
            const createdRoute = await db.addRoute(newRoute);
            console.log("[startRouteBtn] Created route:", createdRoute);
            if (createdRoute) {
                state.routeStarted = true;
                state.currentRouteId = createdRoute.id;
                Alert.success("Ruta iniciada. ¡Buen camino!");
                console.log("[startRouteBtn] Reloading page in 1.5s...");
                setTimeout(() => window.location.reload(), 1500);
            } else {
                console.error("[startRouteBtn] Failed to create route");
                Alert.error("Error al iniciar ruta.");
            }
        });
    } else {
        updateSyncUI();
        document.getElementById('endRouteBtn')?.addEventListener('click', async () => {
            const confirmed = await Alert.confirm("¿Estás seguro de finalizar tu jornada? No podrás registrar más devoluciones.", "Finalizar Jornada");
            if (confirmed) {
                const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
                if (await db.updateRoute(state.currentRouteId, { status: 'completed', endTime: now })) {
                    Alert.success("Jornada finalizada.");
                    setTimeout(() => window.location.reload(), 1500);
                } else {
                    Alert.error("Error al finalizar.");
                }
            }
        });

        document.getElementById('addReturnBtn')?.addEventListener('click', () => {
            state.view = 'form';
            render();
        });

        document.getElementById('resaleModeBtn')?.addEventListener('click', () => {
            state.isSelectingForResale = true;
            state.selectedItems = [];
            render();
        });

        document.getElementById('cancelResaleBtn')?.addEventListener('click', () => {
            state.isSelectingForResale = false;
            state.selectedItems = [];
            render();
        });

        document.getElementById('continueResaleBtn')?.addEventListener('click', () => {
            state.view = 'resale';
            render();
        });

        document.getElementById('returnsList')?.addEventListener('click', (e) => {
            if (!state.isSelectingForResale) return;
            const item = e.target.closest('.list-item');
            if (item) {
                if (item.dataset.resold === 'true') return;
                if (item.dataset.isTotal === 'true') {
                    Alert.error("Las devoluciones TOTALES no pueden ser revendidas. Solo las parciales.");
                    return;
                }
                const id = item.dataset.id;
                const index = state.selectedItems.indexOf(id);
                if (index > -1) state.selectedItems.splice(index, 1);
                else state.selectedItems.push(id);
                render();
            }
        });

        // Try showing banner
        if (window.showPwaBanner) {
            window.showPwaBanner();
            window.addEventListener('pwa-installable', () => window.showPwaBanner());
        }
    }
};


