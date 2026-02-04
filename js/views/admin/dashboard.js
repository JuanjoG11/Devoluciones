import { formatPrice, formatTime12h } from '../../utils/formatters.js';

export const renderStatCard = (title, val, icon, color) => `
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

export const renderDashboard = (activeRoutes, recentReturns, routes, users, stats, hasMoreReturns, user) => `
    <header style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; background: var(--grad-electric); padding: 20px 24px; border-radius: 16px; color: white; box-shadow: var(--shadow-blue); border-bottom: 3px solid var(--secondary-accent); position: relative; overflow: hidden;">
        <div style="position: absolute; right: -10px; top: -10px; opacity: 0.1;"><span class="material-icons-round" style="font-size: 100px;">analytics</span></div>
        <div style="position: relative; z-index: 1;">
            <h1 style="color: white; margin: 0; font-size: 24px; letter-spacing: -0.5px; font-weight: 800;">${(user.organization === 'TYM' || user.username === 'admin_tym') ? 'CENTRO DE CONTROL TYM' : 'CENTRO DE CONTROL TAT'}</h1>
            <p style="color: rgba(255,255,255,0.8); font-size: 13px; font-weight: 500; margin: 2px 0 0;">Gestión Inteligente de Devoluciones y Logística</p>
        </div>
        <div style="display: flex; gap: 12px; position: relative; z-index: 1; align-items: center;">
            <div style="background: rgba(255,255,255,0.15); padding: 8px 16px; border-radius: 99px; font-size: 13px; font-weight: 600; border: 1px solid rgba(255,255,255,0.2); display: flex; align-items: center; gap: 8px;">
                 <span class="material-icons-round" style="font-size: 16px;">person</span> Administrador
            </div>
            <button id="refreshBtn" class="btn btn-secondary" style="height: 40px; width: 40px; border-radius: 10px; background: rgba(255,255,255,0.1); border: 1.5px solid rgba(255,255,255,0.3); color: white; padding: 0; display: flex; align-items: center; justify-content: center; font-weight: 700; cursor: pointer;">
                <span class="material-icons-round" style="font-size: 20px;">refresh</span>
            </button>
        </div>
    </header>

    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 24px; margin-bottom: 32px;">
        ${renderStatCard('Rutas Activas', `${stats.active_routes_count} / ${users.length}`, 'local_shipping', 'var(--primary-color)')}
        ${renderStatCard('Valor Devoluciones', formatPrice(stats.total_returns_value), 'payments', 'var(--secondary-accent)')}
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
                        ${recentReturns.map(r => {
    const route = routes.find(rt => rt.id === r.routeId);
    return `
                                <tr style="border-bottom: 1px solid #f1f5f9;">
                                    <td style="padding: 12px 16px; color: var(--text-light); font-size: 11px;">
                                        ${r.timestamp ? new Date(r.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }) : '—'}
                                    </td>
                                    <td style="padding: 12px 16px; font-weight: 600; font-size: 12px;">${route ? route.userName : 'Desconocido'}</td>
                                    <td style="padding: 12px 16px;">
                                        <div style="font-weight: 700; font-size: 12px; color: var(--primary-color);">${r.productName || 'N/A'}</div>
                                        <small style="color: var(--text-light); font-size: 11px;">Doc: ${r.invoice}</small>
                                    </td>
                                    <td style="padding: 12px 16px;">
                                        <span style="background: rgba(0,34,77,0.05); color: var(--text-secondary); padding: 3px 8px; border-radius: 4px; font-size: 10px; font-weight: 700;">${r.reason}</span>
                                    </td>
                                    <td style="padding: 12px 16px; text-align: right; font-weight: 700; font-size: 13px; color: var(--primary-color);">
                                        ${formatPrice(r.total)}
                                    </td>
                                    <td style="padding: 12px 16px; text-align: center;">
                                        ${r.evidence ? `<button class="view-photo-btn" data-photo="${r.evidence}" style="background: rgba(0,174,239,0.1); border: none; color: var(--accent-color); padding: 6px; border-radius: 8px; cursor: pointer;"><span class="material-icons-round" style="font-size: 18px;">image</span></button>` : '—'}
                                    </td>
                                </tr>`;
}).join('')}
                    </tbody>
                </table>
            </div>
            ${recentReturns.length === 0 ? '<div style="padding: 40px; text-align: center; color: var(--text-light);">No hay devoluciones registradas.</div>' : ''}
            ${hasMoreReturns ? `
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
                            <small style="color: var(--text-light);">${formatTime12h(r.startTime)}${r.endTime ? ' - ' + formatTime12h(r.endTime) : ''}</small>
                        </div>
                        <div style="display: flex; gap: 8px;">
                            ${r.status === 'completed' ? `
                                <button class="reactivate-route-btn" data-route-id="${r.id}" title="Reactivar Ruta" style="background: rgba(34, 197, 94, 0.1); border: none; color: var(--success-color); padding: 8px; border-radius: 8px; cursor: pointer;">
                                    <span class="material-icons-round" style="font-size: 18px;">restore</span>
                                </button>
                            ` : ''}
                            <button class="print-route-btn" data-route-id="${r.id}" title="Imprimir Reporte" style="background: rgba(99, 102, 241, 0.1); border: none; color: var(--accent-color); padding: 8px; border-radius: 8px; cursor: pointer;">
                                <span class="material-icons-round" style="font-size: 18px;">print</span>
                            </button>
                        </div>
                    </div>
                `).join('')}
                ${activeRoutes.length === 0 ? '<div style="text-align: center; color: var(--text-light); padding: 20px;">No hay rutas activas.</div>' : ''}
            </div>
        </div>
    </div>
`;

// Export empty init function to maintain compatibility until admin.js is updated
export const initDashboardCharts = () => { };
