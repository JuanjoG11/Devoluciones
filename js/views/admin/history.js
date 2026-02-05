import { formatPrice, formatDateTime } from '../../utils/formatters.js';
import { db } from '../../data.js';
import { Alert } from '../../utils/ui.js';

const getTodayDate = () => new Date().toLocaleDateString('en-CA');

let filters = {
    search: '',
    dateFrom: getTodayDate(),
    dateTo: getTodayDate(),
    userId: '',
    reason: ''
};
let filteredReturns = [];
let currentPage = 0;
const PAGE_SIZE = 50;

export const renderHistorial = (cache) => {
    const allReasons = [
        "Producto averiado", "Error de despacho", "Rechazo del cliente", "Sin dinero",
        "Error de facturación", "Error de vendedor", "Faltante", "Otro",
        "Negocio cerrado", "Fuera de ruta"
    ];
    const uniqueReasons = [...new Set([...allReasons, ...cache.returns.map(r => r.reason)])].filter(Boolean).sort();

    // We don't apply filters here, we just return the shell. 
    // The initHistorial will take care of the first run.
    return `
        <div style="padding: 24px;">
            <header style="margin-bottom: 24px;">
                <h1 style="font-size: 28px; font-weight: 800; margin: 0 0 8px 0; color: var(--text-primary);">
                    <span class="material-icons-round" style="vertical-align: middle; margin-right: 8px; color: var(--primary-color);">history</span>
                    Historial de Devoluciones
                </h1>
                <p style="color: #64748b; margin: 0;">Consulta y filtra todas las devoluciones registradas</p>
            </header>
            <div class="card" style="margin-bottom: 24px; padding: 20px;">
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 16px;">
                    <div><label style="display: block; font-size: 12px; font-weight: 600; color: #64748b; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.5px;">Búsqueda</label><input type="text" id="historial-search" value="${filters.search}" placeholder="Factura, planilla o producto..." class="input-field" style="width: 100%;"></div>
                    <div><label style="display: block; font-size: 12px; font-weight: 600; color: #64748b; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.5px;">Desde</label><input type="date" id="historial-date-from" value="${filters.dateFrom}" class="input-field" style="width: 100%;"></div>
                    <div><label style="display: block; font-size: 12px; font-weight: 600; color: #64748b; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.5px;">Hasta</label><input type="date" id="historial-date-to" value="${filters.dateTo}" class="input-field" style="width: 100%;"></div>
                    <div><label style="display: block; font-size: 12px; font-weight: 600; color: #64748b; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.5px;">Auxiliar</label><select id="historial-user" class="input-field" style="width: 100%;"><option value="">Todos</option>${cache.users.filter(u => u.role === 'auxiliar').map(u => `<option value="${u.username}" ${filters.userId === u.username ? 'selected' : ''}>${u.name}</option>`).join('')}</select></div>
                    <div><label style="display: block; font-size: 12px; font-weight: 600; color: #64748b; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.5px;">Motivo</label><select id="historial-reason" class="input-field" style="width: 100%;"><option value="">Todos</option>${uniqueReasons.map(r => `<option value="${r}" ${filters.reason === r ? 'selected' : ''}>${r}</option>`).join('')}</select></div>
                </div>
                <button id="clear-filters" class="btn btn-secondary" style="width: auto;"><span class="material-icons-round">clear</span> Limpiar Filtros</button>
            </div>
            <div id="historial-stats" style="margin-bottom: 24px;"></div>
            <div class="card" style="padding: 0; overflow: hidden;"><div id="historial-results"></div></div>
        </div>
    `;
};

export const initHistorial = (cache, org) => {
    let hasMore = true;
    let isLoading = false;

    const applyFilters = async (isLoadMore = false) => {
        if (isLoading) return;
        isLoading = true;

        if (!isLoadMore) {
            filteredReturns = [];
            renderLoading();
        }

        const offset = filteredReturns.length;
        const limit = PAGE_SIZE;

        const results = await db.getReturns(limit, offset, org, filters);

        if (isLoadMore) {
            filteredReturns = [...filteredReturns, ...results];
        } else {
            filteredReturns = results;
        }

        hasMore = results.length === limit;
        isLoading = false;
        renderResults();
    };

    const renderLoading = () => {
        const container = document.getElementById('historial-results');
        if (container) {
            container.innerHTML = `
                <div style="text-align: center; padding: 60px 20px;">
                    <div class="spinner" style="margin: 0 auto 20px;"></div>
                    <p style="color: #64748b;">Buscando en toda la base de datos...</p>
                </div>`;
        }
    };

    const renderResults = () => {
        const container = document.getElementById('historial-results');
        const statsContainer = document.getElementById('historial-stats');
        if (!container || !statsContainer) return;

        // Note: Stats here only represent LOADED data.
        // For full stats, we would need a separate RPC, but for history visibility, this matches the user request.
        const totalValue = filteredReturns.reduce((sum, r) => sum + (r.total || 0), 0);
        const totalCount = filteredReturns.length;

        statsContainer.innerHTML = `
            <div style="display: flex; gap: 24px; flex-wrap: wrap;">
                <div style="flex: 1; min-width: 200px; background: var(--grad-electric); padding: 20px; border-radius: 12px; color: white; box-shadow: var(--shadow-sm);">
                    <div style="font-size: 12px; opacity: 0.9; text-transform: uppercase; letter-spacing: 1px; font-weight: 700;">Mostrando Registros</div>
                    <div style="font-size: 32px; font-weight: 900; margin-top: 4px;">${totalCount}</div>
                </div>
                <div style="flex: 1; min-width: 200px; background: var(--grad-lava); padding: 20px; border-radius: 12px; color: white; box-shadow: var(--shadow-sm);">
                    <div style="font-size: 12px; opacity: 0.9; text-transform: uppercase; letter-spacing: 1px; font-weight: 700;">Valor de Vista</div>
                    <div style="font-size: 32px; font-weight: 900; margin-top: 4px;">${formatPrice(totalValue)}</div>
                </div>
            </div>
        `;

        if (filteredReturns.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 60px 20px; opacity: 0.6;">
                    <span class="material-icons-round" style="font-size: 64px;">search_off</span>
                    <p style="margin-top: 16px; font-size: 16px;">No se encontraron resultados en toda la base de datos</p>
                </div>`;
            return;
        }

        container.innerHTML = `
            <div style="overflow-x: auto;">
                <table style="width: 100%; border-collapse: collapse; min-width: 1000px;">
                    <thead>
                        <tr style="background: #f8fafc; color: #64748b; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 2px solid #e2e8f0;">
                            <th style="padding: 12px; text-align: left;">Fecha / Hora</th>
                            <th style="padding: 12px; text-align: left;">Auxiliar</th>
                            <th style="padding: 12px; text-align: left;">Factura</th>
                            <th style="padding: 12px; text-align: left;">Planilla</th>
                            <th style="padding: 12px; text-align: left;">CÓDIGO</th>
                            <th style="padding: 12px; text-align: left;">Producto</th>
                            <th style="padding: 12px; text-align: middle;">Cant</th>
                            <th style="padding: 12px; text-align: left;">Motivo</th>
                            <th style="padding: 12px; text-align: right; width: 120px;">Total</th>
                            <th style="padding: 12px; text-align: center; width: 50px;">FOTO</th>
                            <th style="padding: 12px; text-align: center; width: 50px;">BORRAR</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${filteredReturns.map(r => `
                            <tr style="border-bottom: 1px solid #e2e8f0;">
                                <td style="padding: 12px; font-size: 11px; white-space: nowrap;">${formatDateTime(r.timestamp)}</td>
                                <td style="padding: 12px; font-size: 12px; font-weight: 600;">${r.auxiliarName || 'N/A'}</td>
                                <td style="padding: 12px; font-size: 12px; font-weight: 700;">${r.invoice || '-'}</td>
                                <td style="padding: 12px; font-size: 12px;">${r.sheet || '-'}</td>
                                <td style="padding: 12px; font-size: 12px; font-weight: 700; color: var(--primary-color);">${r.code || '-'}</td>
                                <td style="padding: 12px; font-size: 12px;">${r.productName || '-'}</td>
                                <td style="padding: 12px; font-size: 12px; text-align: center;">${r.quantity}</td>
                                <td style="padding: 12px; font-size: 11px; color: #64748b;">${r.reason}</td>
                                <td style="padding: 12px; font-size: 13px; font-weight: 700; text-align: right;">${formatPrice(r.total)}</td>
                                <td style="padding: 12px; text-align: center;">
                                    ${r.evidence ? `<button class="view-photo-btn" data-photo="${r.evidence}" style="background: rgba(0,174,239,0.1); border: none; color: var(--accent-color); padding: 8px; border-radius: 8px; cursor: pointer;"><span class="material-icons-round" style="font-size: 18px;">image</span></button>` : '-'}
                                </td>
                                <td style="padding: 12px; text-align: center;">
                                    <button class="delete-return-btn" data-id="${r.id}" style="background: rgba(239,68,68,0.1); border: none; color: #ef4444; padding: 8px; border-radius: 8px; cursor: pointer;">
                                        <span class="material-icons-round" style="font-size: 18px;">delete</span>
                                    </button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
             </div>
            ${hasMore ? `
                <div style="text-align: center; padding: 24px;">
                    <button id="loadMoreHistory" class="btn btn-secondary" style="width: auto; padding: 12px 32px;">
                        <span class="material-icons-round">expand_more</span> Cargar más registros antiguos
                    </button>
                </div>
            ` : (filteredReturns.length > 0 ? `<div style="text-align: center; padding: 24px; color: #64748b; font-size: 13px; opacity: 0.7;">— Fin del historial —</div>` : '')}
        `;

        // Attach pagination events
        document.getElementById('loadMoreHistory')?.addEventListener('click', () => applyFilters(true));

        // Attach delete events
        container.querySelectorAll('.delete-return-btn').forEach(btn => {
            btn.onclick = async () => {
                const id = btn.dataset.id;
                if (await Alert.confirm('¿Estás seguro de eliminar este registro? Esta acción no se puede deshacer.', 'Eliminar Devolución')) {
                    if (await db.deleteReturn(id)) {
                        Alert.success('Registro eliminado');
                        filteredReturns = filteredReturns.filter(r => String(r.id) !== String(id));
                        renderResults();
                    } else {
                        Alert.error('No se pudo eliminar el registro del historial');
                    }
                }
            };
        });


        // Photo view listener
        container.querySelectorAll('.view-photo-btn').forEach(btn => {
            btn.onclick = () => {
                const photo = btn.dataset.photo;
                const overlay = document.createElement('div');
                overlay.style = 'position:fixed; top:0; left:0; right:0; bottom:0; background:rgba(0,0,0,0.9); z-index:10000; display:flex; flex-direction:column; align-items:center; justify-content:center; padding:20px;';
                overlay.innerHTML = `
                    <div style="position:relative; max-width:100%; max-height:100%;">
                        <img src="${photo}" style="max-width:100%; max-height:80vh; border-radius:12px; box-shadow:0 20px 25px -5px rgba(0,0,0,0.5);">
                        <button id="close-photo" style="position:absolute; top:-40px; right:0; background:white; border:none; border-radius:50%; padding:8px; cursor:pointer;"><span class="material-icons-round">close</span></button>
                    </div>
                `;
                document.body.appendChild(overlay);
                document.getElementById('close-photo').onclick = () => overlay.remove();
                overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };
            };
        });
    };

    // Main setup
    const searchInput = document.getElementById('historial-search');
    const dateFromInput = document.getElementById('historial-date-from');
    const dateToInput = document.getElementById('historial-date-to');
    const userSelect = document.getElementById('historial-user');
    const reasonSelect = document.getElementById('historial-reason');
    const clearBtn = document.getElementById('clear-filters');

    if (searchInput) {
        let searchDebounce;
        searchInput.oninput = (e) => {
            clearTimeout(searchDebounce);
            searchDebounce = setTimeout(() => { filters.search = e.target.value; applyFilters(); }, 400);
        };
    }

    if (dateFromInput) dateFromInput.onchange = (e) => { filters.dateFrom = e.target.value; applyFilters(); };
    if (dateToInput) dateToInput.onchange = (e) => { filters.dateTo = e.target.value; applyFilters(); };
    if (userSelect) userSelect.onchange = (e) => { filters.userId = e.target.value; applyFilters(); };
    if (reasonSelect) reasonSelect.onchange = (e) => { filters.reason = e.target.value; applyFilters(); };

    if (clearBtn) {
        clearBtn.onclick = () => {
            const today = getTodayDate();
            filters = { search: '', dateFrom: today, dateTo: today, userId: '', reason: '' };
            if (searchInput) searchInput.value = '';
            if (dateFromInput) dateFromInput.value = today;
            if (dateToInput) dateToInput.value = today;
            if (userSelect) userSelect.value = '';
            if (reasonSelect) reasonSelect.value = '';
            applyFilters();
        };
    }

    // Initial run
    applyFilters();
};

