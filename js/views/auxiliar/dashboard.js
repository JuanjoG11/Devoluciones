import { db } from '../../data.js';
import { Alert } from '../../utils/ui.js';
import { formatPrice, formatTime12h } from '../../utils/formatters.js';

export const renderDashboard = (container, user, state, returns, currentRoute, render, updateSyncUI) => {
    const totalValue = returns.reduce((sum, r) => sum + r.total, 0);

    container.innerHTML = `
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
                            <small style="opacity: 0.9; text-transform: uppercase; letter-spacing: 1.5px; font-weight: 800; font-size: 10px;">VALOR DEVOLUCIONES</small>
                            <h2 style="color: white; font-size: 32px; margin: 4px 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-weight: 900; letter-spacing: -1.5px;">${formatPrice(totalValue)}</h2>
                        </div>
                        <div style="text-align: right; background: var(--grad-lava); padding: 12px 16px; border-radius: 20px; box-shadow: var(--shadow-orange); flex-shrink: 0; min-width: 70px;">
                            <div style="font-size: 24px; font-weight: 900; color: white; line-height: 1;">${returns.length}</div>
                            <small style="color: rgba(255,255,255,0.9); font-weight: 800; font-size: 10px; text-transform: uppercase;">Items</small>
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
                        ${returns.map(r => `
                            <div class="swipe-item" data-id="${r.id}" data-pending="${!!r.pending}">
                                <div class="swipe-action">
                                    <span class="material-icons-round">delete</span>
                                </div>
                                <div class="swipe-content list-item" style="padding: 12px; margin-bottom: 0; border-radius: 0;">
                                    <div style="flex: 1; min-width: 0; padding-right: 8px;">
                                        <div style="font-weight: 600; font-size: 13px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${r.productName || r.name || 'Producto'}</div>
                                        <small style="font-size: 11px;"><b>Fac: ${r.invoice || '—'}</b> • ${r.reason} • Cant: ${r.quantity}</small>
                                    </div>
                                    <div style="text-align: right; flex-shrink: 0;">
                                        <div style="font-weight: 600; font-size: 14px;">${formatPrice(r.total)}</div>
                                        <div style="display: flex; justify-content: flex-end; gap: 4px; margin-top: 4px;">
                                            ${r.pending ? '<span class="material-icons-round" style="font-size: 14px; color: #ffa500;" title="Pendiente de sincronizar">sync_problem</span>' : ''}
                                            ${r.evidence ? '<span class="material-icons-round" style="font-size: 14px; color: var(--accent-color);">photo_camera</span>' : ''}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                `}
                
                <button id="addReturnBtn" class="fab" style="display: ${currentRoute && currentRoute.status === 'completed' ? 'none' : 'flex'}">
                    <span class="material-icons-round">add</span>
                </button>
            `}
        </div>
    `;

    // Event Listeners
    if (!state.routeStarted) {
        document.getElementById('startRouteBtn')?.addEventListener('click', async () => {
            const newRoute = {
                userId: user.id, username: user.username, userName: user.name,
                startTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }),
                date: new Date().toISOString().split('T')[0]
            };
            const createdRoute = await db.addRoute(newRoute);
            if (createdRoute) {
                state.routeStarted = true;
                state.currentRouteId = createdRoute.id;
                Alert.success("Ruta iniciada. ¡Buen camino!");
                setTimeout(() => window.location.reload(), 1500);
            } else {
                Alert.error("Error al iniciar ruta.");
            }
        });
    } else {
        updateSyncUI();
        setupSwipeToDelete(state, render);
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
    }
};

const setupSwipeToDelete = (state, render) => {
    const list = document.getElementById('returnsList');
    if (!list) return;

    let touchStartX = 0;
    let currentItem = null;
    let currentContent = null;
    let isSwiping = false;

    list.addEventListener('touchstart', (e) => {
        currentItem = e.target.closest('.swipe-item');
        if (!currentItem) return;
        currentContent = currentItem.querySelector('.swipe-content');
        touchStartX = e.touches[0].clientX;
        isSwiping = true;
        currentContent.style.transition = 'none';
    }, { passive: true });

    list.addEventListener('touchmove', (e) => {
        if (!isSwiping || !currentContent) return;
        const touchX = e.touches[0].clientX;
        const diff = touchX - touchStartX;

        // Only allow swiping to the left (negative diff)
        if (diff < 0) {
            const translate = Math.max(diff, -100); // Limit swipe distance
            currentContent.style.transform = `translateX(${translate}px)`;
        }
    }, { passive: true });

    list.addEventListener('touchend', async (e) => {
        if (!isSwiping || !currentContent) return;
        isSwiping = false;

        const diff = e.changedTouches[0].clientX - touchStartX;
        currentContent.style.transition = 'transform 0.3s ease';

        if (diff < -70) {
            // Trigger Delete
            currentContent.style.transform = 'translateX(-100%)';
            const returnId = currentItem.dataset.id;
            const isPending = currentItem.dataset.pending === 'true';

            const confirmed = await Alert.confirm("¿Deseas eliminar esta devolución?", "Eliminar Registro");
            if (confirmed) {
                const success = await db.deleteReturn(returnId, isPending);
                if (success) {
                    Alert.success("Eliminado correctamente");
                    render(); // Refresh list
                } else {
                    Alert.error("Error al eliminar");
                    currentContent.style.transform = 'translateX(0)';
                }
            } else {
                currentContent.style.transform = 'translateX(0)';
            }
        } else {
            // Reset position
            currentContent.style.transform = 'translateX(0)';
        }
    });

    list.addEventListener('touchcancel', () => {
        if (currentContent) {
            currentContent.style.transition = 'transform 0.3s ease';
            currentContent.style.transform = 'translateX(0)';
        }
        isSwiping = false;
    });
};
