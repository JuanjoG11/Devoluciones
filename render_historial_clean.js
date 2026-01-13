const renderHistorial = () => {
    // State for filters
    let filters = {
        search: '',
        dateFrom: '',
        dateTo: '',
        userId: '',
        reason: ''
    };

    let currentPage = 0;
    const PAGE_SIZE = 50;
    let filteredReturns = [];

    const applyFilters = () => {
        let results = [...cache.returns];

        // Search filter
        if (filters.search) {
            const search = filters.search.toLowerCase();
            results = results.filter(r =>
                (r.invoice && r.invoice.toLowerCase().includes(search)) ||
                (r.sheet && r.sheet.toLowerCase().includes(search)) ||
                (r.product_name && r.product_name.toLowerCase().includes(search))
            );
        }

        // Date filters
        if (filters.dateFrom) {
            results = results.filter(r => new Date(r.created_at) >= new Date(filters.dateFrom));
        }
        if (filters.dateTo) {
            const dateTo = new Date(filters.dateTo);
            dateTo.setHours(23, 59, 59);
            results = results.filter(r => new Date(r.created_at) <= dateTo);
        }

        // User filter
        if (filters.userId) {
            const routeIds = cache.routes.filter(r => r.user_id === filters.userId).map(r => r.id);
            results = results.filter(r => routeIds.includes(r.route_id));
        }

        // Reason filter
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

        // Calculate stats
        const totalValue = filteredReturns.reduce((sum, r) => sum + (r.total || 0), 0);
        const totalCount = filteredReturns.length;

        // Update stats
        statsContainer.innerHTML = `
            <div style="display: flex; gap: 24px; flex-wrap: wrap;">
                <div style="flex: 1; min-width: 200px; background: var(--grad-electric); padding: 20px; border-radius: 12px; color: white;">
                    <div style="font-size: 12px; opacity: 0.9; text-transform: uppercase; letter-spacing: 1px; font-weight: 700;">Total Devoluciones</div>
                    <div style="font-size: 32px; font-weight: 900; margin-top: 4px;">${totalCount}</div>
                </div>
                <div style="flex: 1; min-width: 200px; background: var(--grad-lava); padding: 20px; border-radius: 12px; color: white;">
                    <div style="font-size: 12px; opacity: 0.9; text-transform: uppercase; letter-spacing: 1px; font-weight: 700;">Valor Total</div>
                    <div style="font-size: 32px; font-weight: 900; margin-top: 4px;">$ ${totalValue.toLocaleString()}</div>
                </div>
            </div>
        `;

        // Paginate
        const start = currentPage * PAGE_SIZE;
        const end = start + PAGE_SIZE;
        const pageReturns = filteredReturns.slice(start, end);

        if (pageReturns.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 60px 20px; opacity: 0.6;">
                    <span class="material-icons-round" style="font-size: 64px;">search_off</span>
                    <p style="margin-top: 16px; font-size: 16px;">No se encontraron devoluciones</p>
                </div>
            `;
            return;
        }

        // Render table
        container.innerHTML = `
            <div style="overflow-x: auto;">
                <table class="data-table" style="width: 100%; border-collapse: collapse;">
                    <thead>
                        <tr style="background: #f1f5f9;">
                            <th style="padding: 12px; text-align: left; font-weight: 600; font-size: 12px; text-transform: uppercase; color: #64748b;">Fecha</th>
                            <th style="padding: 12px; text-align: left; font-weight: 600; font-size: 12px; text-transform: uppercase; color: #64748b;">Auxiliar</th>
                            <th style="padding: 12px; text-align: left; font-weight: 600; font-size: 12px; text-transform: uppercase; color: #64748b;">Factura</th>
                            <th style="padding: 12px; text-align: left; font-weight: 600; font-size: 12px; text-transform: uppercase; color: #64748b;">Planilla</th>
                            <th style="padding: 12px; text-align: left; font-weight: 600; font-size: 12px; text-transform: uppercase; color: #64748b;">Producto</th>
                            <th style="padding: 12px; text-align: left; font-weight: 600; font-size: 12px; text-transform: uppercase; color: #64748b;">Cantidad</th>
                            <th style="padding: 12px; text-align: left; font-weight: 600; font-size: 12px; text-transform: uppercase; color: #64748b;">Motivo</th>
                            <th style="padding: 12px; text-align: right; font-weight: 600; font-size: 12px; text-transform: uppercase; color: #64748b;">Total</th>
                            <th style="padding: 12px; text-align: center; font-weight: 600; font-size: 12px; text-transform: uppercase; color: #64748b;">Foto</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${pageReturns.map(r => {
            const route = cache.routes.find(rt => rt.id === r.route_id);
            const date = new Date(r.created_at);
            return `
                                <tr style="border-bottom: 1px solid #e2e8f0;">
                                    <td style="padding: 12px; font-size: 13px;">${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                                    <td style="padding: 12px; font-size: 13px;">${route?.user_name || 'N/A'}</td>
                                    <td style="padding: 12px; font-size: 13px; font-weight: 600;">${r.invoice || '-'}</td>
                                    <td style="padding: 12px; font-size: 13px;">${r.sheet || '-'}</td>
                                    <td style="padding: 12px; font-size: 13px;">${r.product_name || '-'}</td>
                                    <td style="padding: 12px; font-size: 13px;">${r.quantity}</td>
                                    <td style="padding: 12px; font-size: 12px; color: #64748b;">${r.reason}</td>
                                    <td style="padding: 12px; font-size: 14px; font-weight: 600; text-align: right;">$ ${(r.total || 0).toLocaleString()}</td>
                                    <td style="padding: 12px; text-align: center;">
                                        ${r.evidence ? '<span class="material-icons-round" style="color: var(--accent-color); font-size: 18px;">photo_camera</span>' : '-'}
                                    </td>
                                </tr>
                            `;
        }).join('')}
                    </tbody>
                </table>
            </div>
            ${filteredReturns.length > PAGE_SIZE ? `
                <div style="display: flex; justify-content: center; gap: 12px; margin-top: 24px; align-items: center;">
                    <button id="prevPage" class="btn btn-secondary" ${currentPage === 0 ? 'disabled' : ''}>
                        <span class="material-icons-round">chevron_left</span> Anterior
                    </button>
                    <span style="color: #64748b; font-size: 14px;">
                        Página ${currentPage + 1} de ${Math.ceil(filteredReturns.length / PAGE_SIZE)}
                    </span>
                    <button id="nextPage" class="btn btn-secondary" ${end >= filteredReturns.length ? 'disabled' : ''}>
                        Siguiente <span class="material-icons-round">chevron_right</span>
                    </button>
                </div>
            ` : ''}
        `;

        // Attach pagination listeners
        document.getElementById('prevPage')?.addEventListener('click', () => {
            if (currentPage > 0) {
                currentPage--;
                renderResults();
            }
        });

        document.getElementById('nextPage')?.addEventListener('click', () => {
            if (end < filteredReturns.length) {
                currentPage++;
                renderResults();
            }
        });
    };

    // Initial render
    setTimeout(() => {
        applyFilters();

        // Attach filter listeners
        const searchInput = document.getElementById('historial-search');
        const dateFromInput = document.getElementById('historial-date-from');
        const dateToInput = document.getElementById('historial-date-to');
        const userSelect = document.getElementById('historial-user');
        const reasonSelect = document.getElementById('historial-reason');
        const clearBtn = document.getElementById('clear-filters');

        let searchDebounce;
        searchInput?.addEventListener('input', (e) => {
            clearTimeout(searchDebounce);
            searchDebounce = setTimeout(() => {
                filters.search = e.target.value;
                applyFilters();
            }, 300);
        });

        dateFromInput?.addEventListener('change', (e) => {
            filters.dateFrom = e.target.value;
            applyFilters();
        });

        dateToInput?.addEventListener('change', (e) => {
            filters.dateTo = e.target.value;
            applyFilters();
        });

        userSelect?.addEventListener('change', (e) => {
            filters.userId = e.target.value;
            applyFilters();
        });

        reasonSelect?.addEventListener('change', (e) => {
            filters.reason = e.target.value;
            applyFilters();
        });

        clearBtn?.addEventListener('click', () => {
            filters = { search: '', dateFrom: '', dateTo: '', userId: '', reason: '' };
            if (searchInput) searchInput.value = '';
            if (dateFromInput) dateFromInput.value = '';
            if (dateToInput) dateToInput.value = '';
            if (userSelect) userSelect.value = '';
            if (reasonSelect) reasonSelect.value = '';
            applyFilters();
        });
    }, 100);

    // Get unique reasons
    const uniqueReasons = [...new Set(cache.returns.map(r => r.reason))].filter(Boolean);

    return `
        <div style="padding: 24px;">
            <header style="margin-bottom: 24px;">
                <h1 style="font-size: 28px; font-weight: 800; margin: 0 0 8px 0; color: var(--text-primary);">
                    <span class="material-icons-round" style="vertical-align: middle; margin-right: 8px; color: var(--primary-color);">history</span>
                    Historial de Devoluciones
                </h1>
                <p style="color: #64748b; margin: 0;">Consulta y filtra todas las devoluciones registradas</p>
            </header>
            
            <!-- Filters -->
            <div class="card" style="margin-bottom: 24px; padding: 20px;">
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 16px;">
                    <div>
                        <label style="display: block; font-size: 12px; font-weight: 600; color: #64748b; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.5px;">Búsqueda</label>
                        <input type="text" id="historial-search" placeholder="Factura, planilla o producto..." class="input-field" style="width: 100%;">
                    </div>
                    <div>
                        <label style="display: block; font-size: 12px; font-weight: 600; color: #64748b; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.5px;">Desde</label>
                        <input type="date" id="historial-date-from" class="input-field" style="width: 100%;">
                    </div>
                    <div>
                        <label style="display: block; font-size: 12px; font-weight: 600; color: #64748b; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.5px;">Hasta</label>
                        <input type="date" id="historial-date-to" class="input-field" style="width: 100%;">
                    </div>
                    <div>
                        <label style="display: block; font-size: 12px; font-weight: 600; color: #64748b; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.5px;">Auxiliar</label>
                        <select id="historial-user" class="input-field" style="width: 100%;">
                            <option value="">Todos</option>
                            ${cache.users.filter(u => u.role === 'auxiliar').map(u => `
                                <option value="${u.id}">${u.name}</option>
                            `).join('')}
                        </select>
                    </div>
                    <div>
                        <label style="display: block; font-size: 12px; font-weight: 600; color: #64748b; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.5px;">Motivo</label>
                        <select id="historial-reason" class="input-field" style="width: 100%;">
                            <option value="">Todos</option>
                            ${uniqueReasons.map(r => `<option value="${r}">${r}</option>`).join('')}
                        </select>
                    </div>
                </div>
                <button id="clear-filters" class="btn btn-secondary" style="width: auto;">
                    <span class="material-icons-round">clear</span> Limpiar Filtros
                </button>
            </div>
            
            <!-- Stats -->
            <div id="historial-stats" style="margin-bottom: 24px;"></div>
            
            <!-- Results -->
            <div class="card" style="padding: 0; overflow: hidden;">
                <div id="historial-results"></div>
            </div>
        </div>
    `;
};
