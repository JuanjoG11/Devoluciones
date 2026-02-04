import { formatPrice, formatDateTime } from '../../utils/formatters.js';
import { db } from '../../data.js';
import { Alert } from '../../utils/ui.js';

let filters = { search: '', dateFrom: '', dateTo: '', userId: '', reason: '' };
let filteredReturns = [];
let currentPage = 0;
const PAGE_SIZE = 50;

export const renderHistorial = (cache) => {
    const uniqueReasons = [...new Set(cache.returns.map(r => r.reason))].filter(Boolean);

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

export const initHistorial = (cache) => {
    const applyFilters = () => {
        let results = [...cache.returns];

        if (filters.search) {
            const search = filters.search.toLowerCase();
            results = results.filter(r =>
                (r.invoice && r.invoice.toLowerCase().includes(search)) ||
                (r.sheet && r.sheet.toLowerCase().includes(search)) ||
                (r.productName && r.productName.toLowerCase().includes(search)) ||
                (r.code && r.code.toLowerCase().includes(search))
            );
        }

        if (filters.dateFrom) {
            results = results.filter(r => {
                const itemDate = new Date(r.timestamp).toLocaleDateString('en-CA');
                return itemDate >= filters.dateFrom;
            });
        }

        if (filters.dateTo) {
            results = results.filter(r => {
                const itemDate = new Date(r.timestamp).toLocaleDateString('en-CA');
                return itemDate <= filters.dateTo;
            });
        }

        if (filters.userId) {
            results = results.filter(r => {
                // 1. Try directly mapped username (fastest)
                if (r.auxiliarUsername && String(r.auxiliarUsername) === String(filters.userId)) return true;

                // 2. Fallback: Search in routes cache using routeId
                const route = cache.routes.find(rt => rt.id === r.routeId);
                return route && (String(route.username) === String(filters.userId) || String(route.userId) === String(filters.userId));
            });
        }

        if (filters.reason) {
            results = results.filter(r => r.reason === filters.reason);
        }

        filteredReturns = results;
        currentPage = 0;
        renderResults();
    };

    const renderResults = () => {
        const container = document.getElementById('historial-results');
        const statsContainer = document.getElementById('historial-stats');
        if (!container || !statsContainer) return;

        const totalValue = filteredReturns.reduce((sum, r) => sum + (r.total || 0), 0);
        const totalCount = filteredReturns.length;

        statsContainer.innerHTML = `
            <div style="display: flex; gap: 24px; flex-wrap: wrap;">
                <div style="flex: 1; min-width: 200px; background: var(--grad-electric); padding: 20px; border-radius: 12px; color: white; box-shadow: var(--shadow-sm);">
                    <div style="font-size: 12px; opacity: 0.9; text-transform: uppercase; letter-spacing: 1px; font-weight: 700;">Total Devoluciones</div>
                    <div style="font-size: 32px; font-weight: 900; margin-top: 4px;">${totalCount}</div>
                </div>
                <div style="flex: 1; min-width: 200px; background: var(--grad-lava); padding: 20px; border-radius: 12px; color: white; box-shadow: var(--shadow-sm);">
                    <div style="font-size: 12px; opacity: 0.9; text-transform: uppercase; letter-spacing: 1px; font-weight: 700;">Valor Total</div>
                    <div style="font-size: 32px; font-weight: 900; margin-top: 4px;">${formatPrice(totalValue)}</div>
                </div>
            </div>
        `;

        const start = currentPage * PAGE_SIZE;
        const end = start + PAGE_SIZE;
        const pageReturns = filteredReturns.slice(start, end);

        if (pageReturns.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 60px 20px; opacity: 0.6;">
                    <span class="material-icons-round" style="font-size: 64px;">search_off</span>
                    <p style="margin-top: 16px; font-size: 16px;">No se encontraron devoluciones</p>
                </div>`;
            return;
        }

        container.innerHTML = `
            <div style="overflow-x: auto;">
                <table style="width: 100%; border-collapse: collapse; min-width: 800px;">
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
                            <th style="padding: 12px; text-align: center; width: 80px;">FOTO</th>
                            <th style="padding: 12px; text-align: center; width: 80px;">BORRAR</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${pageReturns.map(r => `
                            <tr style="border-bottom: 1px solid #e2e8f0;">
                                <td style="padding: 12px; font-size: 12px; white-space: nowrap;">${formatDateTime(r.timestamp)}</td>
                                <td style="padding: 12px; font-size: 12px; font-weight: 500;">${r.auxiliarName || 'N/A'}</td>
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
            ${filteredReturns.length > PAGE_SIZE ? `
                <div style="display: flex; justify-content: center; gap: 12px; margin: 24px 0; align-items: center;">
                    <button id="prevPage" class="btn btn-secondary" ${currentPage === 0 ? 'disabled' : ''}><span class="material-icons-round">chevron_left</span> Anterior</button>
                    <span style="color: #64748b; font-size: 14px; font-weight: 600;">Página ${currentPage + 1} de ${Math.ceil(filteredReturns.length / PAGE_SIZE)}</span>
                    <button id="nextPage" class="btn btn-secondary" ${end >= filteredReturns.length ? 'disabled' : ''}>Siguiente <span class="material-icons-round">chevron_right</span></button>
                </div>
            ` : ''}
        `;

        // Attach pagination events
        document.getElementById('prevPage')?.addEventListener('click', () => { if (currentPage > 0) { currentPage--; renderResults(); } });
        document.getElementById('nextPage')?.addEventListener('click', () => { if (end < filteredReturns.length) { currentPage++; renderResults(); } });

        // Attach delete events
        container.querySelectorAll('.delete-return-btn').forEach(btn => {
            btn.onclick = async () => {
                const id = btn.dataset.id;
                if (await Alert.confirm('¿Estás seguro de eliminar este registro? Esta acción no se puede deshacer.', 'Eliminar Devolución')) {
                    if (await db.deleteReturn(id)) {
                        Alert.success('Registro eliminado');
                        cache.returns = cache.returns.filter(r => String(r.id) !== String(id));
                        applyFilters();
                    }
                }
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
            searchDebounce = setTimeout(() => { filters.search = e.target.value; applyFilters(); }, 300);
        };
    }

    if (dateFromInput) dateFromInput.onchange = (e) => { filters.dateFrom = e.target.value; applyFilters(); };
    if (dateToInput) dateToInput.onchange = (e) => { filters.dateTo = e.target.value; applyFilters(); };
    if (userSelect) userSelect.onchange = (e) => { filters.userId = e.target.value; applyFilters(); };
    if (reasonSelect) reasonSelect.onchange = (e) => { filters.reason = e.target.value; applyFilters(); };

    if (clearBtn) {
        clearBtn.onclick = () => {
            filters = { search: '', dateFrom: '', dateTo: '', userId: '', reason: '' };
            if (searchInput) searchInput.value = '';
            if (dateFromInput) dateFromInput.value = '';
            if (dateToInput) dateToInput.value = '';
            if (userSelect) userSelect.value = '';
            if (reasonSelect) reasonSelect.value = '';
            applyFilters();
        };
    }

    // Initial run
    applyFilters();
};

