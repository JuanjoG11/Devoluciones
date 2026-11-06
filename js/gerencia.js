/**
 * Informe Diario de Gerencia
 * Página standalone que muestra causales de devolución por auxiliar.
 * No requiere login. Se actualiza automáticamente cada 60 segundos.
 *
 * TODO (futuro): agregar agrupación por zona cuando el campo exista en la BD.
 */
import { sb, withTimeout } from './supabase.js';
import { formatPrice, formatNumber, getLocalDateISO } from './utils/formatters.js';

// ===================== STATE =====================
let selectedDate = getLocalDateISO();
let allReturns = [];
let autoRefreshTimer = null;
let charts = {};
let lastUpdate = null;
let isLoading = false;

// ===================== CONSTANTS =====================
const REFRESH_INTERVAL = 60000; // 60 segundos
const PAGE_SIZE = 1000;
const CHART_COLORS = [
    '#00224D', '#00AEEF', '#F7941D', '#39B54A', '#EE1C25',
    '#FFC20E', '#8b5cf6', '#ec4899', '#14b8a6', '#64748b',
    '#f97316', '#3b82f6', '#a855f7', '#10b981', '#ef4444'
];

// ===================== DATA FETCHING =====================

/**
 * Fetch all returns for a given date (timezone-safe).
 * Queries a 3-day window then filters locally to avoid UTC edge cases.
 */
async function fetchReturns(date) {
    if (!sb) throw new Error('No hay conexión con la base de datos');

    // Build a 3-day window around the target date
    const target = new Date(date + 'T00:00:00');
    const dayBefore = new Date(target);
    dayBefore.setDate(dayBefore.getDate() - 1);
    const dayAfter = new Date(target);
    dayAfter.setDate(dayAfter.getDate() + 1);

    const fetchStart = getLocalDateISO(dayBefore) + 'T00:00:00';
    const fetchEnd = getLocalDateISO(dayAfter) + 'T23:59:59';

    let allData = [];
    let page = 0;
    let fetchMore = true;

    while (fetchMore) {
        const { data, error } = await withTimeout(
            sb.from('return_items')
                .select('*, routes(username, user_name)')
                .gte('created_at', fetchStart)
                .lte('created_at', fetchEnd)
                .order('created_at', { ascending: false })
                .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1),
            15000
        );

        if (error) throw error;

        allData = allData.concat(data || []);

        if (!data || data.length < PAGE_SIZE) {
            fetchMore = false;
        } else {
            page++;
        }
    }

    // Map + deduplicate + filter to the exact local date
    const mapped = mapReturns(allData);
    const deduped = deduplicateReturns(mapped);
    return deduped.filter(r => getLocalDateISO(r.timestamp) === date);
}

/**
 * Map raw Supabase rows to the app's return object shape.
 */
function mapReturns(rawData) {
    return (rawData || []).map(r => ({
        id: r.id,
        routeId: r.route_id,
        invoice: r.invoice,
        sheet: r.sheet,
        code: r.product_code,
        productName: r.product_name,
        quantity: r.quantity,
        total: r.total,
        reason: r.reason || 'Sin motivo',
        evidence: r.evidence,
        timestamp: r.created_at,
        isResale: !!r.is_resale,
        resaleCustomerCode: r.resale_customer_code,
        resaleTimestamp: r.resale_timestamp,
        auxiliarName: Array.isArray(r.routes) ? r.routes[0]?.user_name : r.routes?.user_name,
        auxiliarUsername: Array.isArray(r.routes) ? r.routes[0]?.username : r.routes?.username,
        verified: !!r.verified
    }));
}

/**
 * Deduplicate returns using the same key logic as the main app
 * (invoice + sheet + product + quantity + total + resale flag + time).
 */
function deduplicateReturns(returns) {
    const seen = new Set();
    return returns.filter(r => {
        const timeKey = r.timestamp ? String(r.timestamp).substring(0, 16) : 'no-time';
        const keyCol = r.code || r.productName;
        const key = `${r.invoice}-${r.sheet}-${keyCol}-${r.quantity}-${r.total}-${r.isResale}-${timeKey}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
}

// ===================== DATA AGGREGATION =====================

/**
 * Build a pivot matrix: rows = auxiliaries, columns = causals.
 * Returns { auxiliaries, causals, matrix, rowTotals, colTotals, grandTotal, rowValues }
 */
function buildPivot(returns) {
    // Unique auxiliaries sorted alphabetically
    const auxiliaries = [...new Set(returns.map(r => r.auxiliarName || 'Desconocido'))].sort((a, b) =>
        a.localeCompare(b, 'es', { sensitivity: 'base' })
    );

    // Unique causals sorted by total frequency (descending)
    const causalCounts = {};
    returns.forEach(r => {
        const reason = r.reason || 'Sin motivo';
        causalCounts[reason] = (causalCounts[reason] || 0) + 1;
    });
    const causals = Object.entries(causalCounts)
        .sort((a, b) => b[1] - a[1])
        .map(([reason]) => reason);

    // Build matrix: matrix[auxiliar][causal] = count
    const matrix = {};
    const rowTotals = {};
    const rowValues = {};
    const colTotals = {};

    auxiliaries.forEach(aux => {
        matrix[aux] = {};
        rowTotals[aux] = 0;
        rowValues[aux] = 0;
    });

    causals.forEach(c => { colTotals[c] = 0; });

    returns.forEach(r => {
        const aux = r.auxiliarName || 'Desconocido';
        const reason = r.reason || 'Sin motivo';
        matrix[aux][reason] = (matrix[aux][reason] || 0) + 1;
        rowTotals[aux]++;
        rowValues[aux] += (r.total || 0);
        colTotals[reason]++;
    });

    const grandValue = returns.reduce((sum, r) => sum + (r.total || 0), 0);

    return { auxiliaries, causals, matrix, rowTotals, colTotals, grandTotal: returns.length, grandValue, rowValues };
}

// ===================== RENDERING =====================

function renderShell() {
    const app = document.getElementById('gerencia-app');
    app.innerHTML = `
        <!-- Header -->
        <header class="gerencia-header">
            <div>
                <h1><span class="material-icons-round">insights</span> Informe Diario de Gerencia</h1>
                <p class="subtitle">Causales de devolución por auxiliar</p>
            </div>
            <div class="header-controls">
                <div class="date-picker-wrapper">
                    <label for="datePicker">Fecha</label>
                    <input type="date" id="datePicker" value="${selectedDate}">
                </div>
                <button class="header-btn" id="refreshBtn">
                    <span class="material-icons-round" style="font-size:18px;">refresh</span> Actualizar
                </button>
                <button class="header-btn" id="exportCsvBtn">
                    <span class="material-icons-round" style="font-size:18px;">download</span> CSV
                </button>
                <button class="header-btn" id="printBtn">
                    <span class="material-icons-round" style="font-size:18px;">print</span> Imprimir
                </button>
                <div class="refresh-indicator" id="refreshIndicator">
                    <span class="dot"></span>
                    <span id="refreshLabel">Actualizado</span>
                </div>
            </div>
        </header>

        <!-- Content -->
        <div class="gerencia-content" id="gerenciaContent">
            <div class="loading-overlay">
                <div class="spinner"></div>
                <p style="font-weight: 600;">Cargando informe...</p>
            </div>
        </div>
    `;
}

function renderKPIs(returns) {
    const totalItems = returns.length;
    const totalValue = returns.reduce((sum, r) => sum + (r.total || 0), 0);
    const uniqueAuxiliaries = new Set(returns.map(r => r.auxiliarName || 'Desconocido')).size;

    // Most frequent causal
    const causalCounts = {};
    returns.forEach(r => {
        const reason = r.reason || 'Sin motivo';
        causalCounts[reason] = (causalCounts[reason] || 0) + 1;
    });
    const topCausal = Object.entries(causalCounts).sort((a, b) => b[1] - a[1])[0];
    const topCausalName = topCausal ? topCausal[0] : '—';
    const topCausalCount = topCausal ? topCausal[1] : 0;

    return `
        <div class="kpi-grid">
            <div class="kpi-card primary">
                <span class="material-icons-round kpi-icon">inventory_2</span>
                <div class="kpi-label">Devoluciones del Día</div>
                <div class="kpi-value">${formatNumber(totalItems)}</div>
                <div class="kpi-sub">items registrados</div>
            </div>
            <div class="kpi-card accent">
                <span class="material-icons-round kpi-icon">payments</span>
                <div class="kpi-label">Valor Total</div>
                <div class="kpi-value">${formatPrice(totalValue)}</div>
                <div class="kpi-sub">en devoluciones</div>
            </div>
            <div class="kpi-card green">
                <span class="material-icons-round kpi-icon">group</span>
                <div class="kpi-label">Auxiliares Activos</div>
                <div class="kpi-value">${uniqueAuxiliaries}</div>
                <div class="kpi-sub">con devoluciones hoy</div>
            </div>
            <div class="kpi-card orange">
                <span class="material-icons-round kpi-icon">warning</span>
                <div class="kpi-label">Causal Principal</div>
                <div class="kpi-value" style="font-size:20px; line-height:1.2;">${topCausalName}</div>
                <div class="kpi-sub">${topCausalCount} devoluciones</div>
            </div>
        </div>
    `;
}

function renderPivotTable(pivot) {
    const { auxiliaries, causals, matrix, rowTotals, colTotals, grandTotal, grandValue, rowValues } = pivot;

    if (auxiliaries.length === 0) {
        return `<div class="empty-state">
            <span class="material-icons-round">bar_chart</span>
            <h3>Sin devoluciones</h3>
            <p>No hay registros para esta fecha.</p>
        </div>`;
    }

    // Determine heat level for a cell count
    const maxCount = Math.max(...causals.map(c => colTotals[c]), 1);
    const heatClass = (count) => {
        if (count === 0) return 'zero';
        const ratio = count / maxCount;
        if (ratio > 0.75) return 'heat-5';
        if (ratio > 0.5) return 'heat-4';
        if (ratio > 0.35) return 'heat-3';
        if (ratio > 0.15) return 'heat-2';
        return 'heat-1';
    };

    let html = `
        <div class="pivot-scroll">
            <table class="pivot-table">
                <thead>
                    <tr>
                        <th class="aux-col">Auxiliar</th>
                        <th class="zone-col">Zona</th>
                        ${causals.map(c => `<th>${c}</th>`).join('')}
                        <th style="background:var(--primary-light);">Total Items</th>
                        <th style="background:var(--primary-light);">Valor</th>
                    </tr>
                </thead>
                <tbody>
    `;

    auxiliaries.forEach(aux => {
        html += `<tr>
            <td class="aux-col">${aux}</td>
            <td class="zone-col">—</td>
            ${causals.map(c => {
                const count = matrix[aux][c] || 0;
                return `<td class="num ${count === 0 ? 'zero' : heatClass(count)}">${count === 0 ? '—' : count}</td>`;
            }).join('')}
            <td class="total-col">${rowTotals[aux]}</td>
            <td class="total-col" style="text-align:right; font-size:12px;">${formatPrice(rowValues[aux])}</td>
        </tr>`;
    });

    // Totals row
    html += `
                </tbody>
                <tfoot>
                    <tr>
                        <td class="aux-col">TOTAL</td>
                        <td class="zone-col"></td>
                        ${causals.map(c => `<td>${colTotals[c]}</td>`).join('')}
                        <td>${grandTotal}</td>
                        <td style="text-align:right;">${formatPrice(grandValue)}</td>
                    </tr>
                </tfoot>
            </table>
        </div>
    `;

    return html;
}

function renderCharts(returns) {
    return `
        <div class="charts-row">
            <div class="section-card">
                <div class="section-card-header">
                    <h2><span class="material-icons-round">donut_large</span> Distribución por Causal</h2>
                </div>
                <div class="section-card-body" style="height:320px;">
                    <canvas id="causalChart"></canvas>
                </div>
            </div>
            <div class="section-card">
                <div class="section-card-header">
                    <h2><span class="material-icons-round">format_list_numbered</span> Devoluciones por Auxiliar</h2>
                </div>
                <div class="section-card-body" style="height:320px;">
                    <canvas id="auxiliarChart"></canvas>
                </div>
            </div>
        </div>
    `;
}

function renderDetailTable(returns) {
    if (returns.length === 0) return '';

    // Sort by timestamp descending
    const sorted = [...returns].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    return `
        <div class="section-card">
            <div class="section-card-header">
                <h2><span class="material-icons-round">list_alt</span> Detalle de Devoluciones</h2>
                <button class="collapse-toggle" id="detailToggle">
                    <span class="material-icons-round" style="font-size:16px;">expand_less</span> Contraer
                </button>
            </div>
            <div class="section-card-body collapsible-content" id="detailContent" style="padding:0;">
                <div class="detail-scroll">
                    <table class="detail-table">
                        <thead>
                            <tr>
                                <th>Hora</th>
                                <th>Auxiliar</th>
                                <th>Zona</th>
                                <th>Factura</th>
                                <th>Planilla</th>
                                <th>Producto</th>
                                <th>Causal</th>
                                <th style="text-align:center;">Cant</th>
                                <th style="text-align:right;">Total</th>
                                <th style="text-align:center;">OK</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${sorted.map(r => `
                                <tr>
                                    <td style="white-space:nowrap; color:var(--text-light);">${r.timestamp ? new Date(r.timestamp).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', hour12: true }) : '—'}</td>
                                    <td style="font-weight:600;">${r.auxiliarName || 'Desconocido'}</td>
                                    <td style="color:var(--text-light); font-style:italic;">—</td>
                                    <td>${r.invoice}</td>
                                    <td>${r.sheet || '—'}</td>
                                    <td>
                                        ${r.isResale ? '<span class="badge-resale">Reventa</span> ' : ''}
                                        ${r.code ? r.code + ' - ' : ''}${(r.productName || 'N/A').toUpperCase().substring(0, 40)}${r.productName && r.productName.length > 40 ? '...' : ''}
                                    </td>
                                    <td><span class="badge-reason">${r.reason}</span></td>
                                    <td style="text-align:center; font-weight:600;">${r.quantity}</td>
                                    <td class="total-cell">${formatPrice(r.total)}</td>
                                    <td style="text-align:center;">${r.verified ? '<span class="verified-check">✓</span>' : ''}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;
}

// ===================== CHART BUILDERS =====================

function destroyCharts() {
    Object.values(charts).forEach(c => { try { c.destroy(); } catch (e) {} });
    charts = {};
}

function buildCharts(returns) {
    destroyCharts();
    if (typeof Chart === 'undefined' || returns.length === 0) return;

    // --- Causal distribution (doughnut) ---
    const causalCounts = {};
    returns.forEach(r => {
        const reason = r.reason || 'Sin motivo';
        causalCounts[reason] = (causalCounts[reason] || 0) + 1;
    });
    const sortedCausals = Object.entries(causalCounts).sort((a, b) => b[1] - a[1]);

    const causalCtx = document.getElementById('causalChart');
    if (causalCtx) {
        charts.causal = new Chart(causalCtx, {
            type: 'doughnut',
            data: {
                labels: sortedCausals.map(c => c[0]),
                datasets: [{
                    data: sortedCausals.map(c => c[1]),
                    backgroundColor: sortedCausals.map((_, i) => CHART_COLORS[i % CHART_COLORS.length]),
                    borderWidth: 2,
                    borderColor: '#fff',
                    spacing: 3
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '55%',
                plugins: {
                    legend: {
                        position: 'right',
                        labels: { font: { size: 11, weight: '600' }, color: '#475569', padding: 10, boxWidth: 12 }
                    },
                    tooltip: {
                        callbacks: {
                            label: (ctx) => `${ctx.label}: ${ctx.raw} (${Math.round(ctx.raw / returns.length * 100)}%)`
                        }
                    }
                }
            }
        });
    }

    // --- Returns by auxiliary (horizontal bar) ---
    const auxCounts = {};
    returns.forEach(r => {
        const name = r.auxiliarName || 'Desconocido';
        auxCounts[name] = (auxCounts[name] || 0) + 1;
    });
    const sortedAux = Object.entries(auxCounts).sort((a, b) => b[1] - a[1]).slice(0, 15);

    const auxCtx = document.getElementById('auxiliarChart');
    if (auxCtx) {
        charts.auxiliar = new Chart(auxCtx, {
            type: 'bar',
            data: {
                labels: sortedAux.map(a => a[0].length > 22 ? a[0].substring(0, 20) + '...' : a[0]),
                datasets: [{
                    data: sortedAux.map(a => a[1]),
                    backgroundColor: 'rgba(0, 174, 239, 0.7)',
                    hoverBackgroundColor: '#00AEEF',
                    borderRadius: 6,
                    barThickness: 'flex'
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    x: { grid: { color: '#f1f5f9' }, ticks: { color: '#94a3b8', font: { weight: '600' } } },
                    y: { grid: { display: false }, ticks: { color: '#0f172a', font: { size: 11, weight: '600' } } }
                }
            }
        });
    }
}

// ===================== CSV EXPORT =====================

function exportCSV(returns) {
    if (returns.length === 0) return;

    const headers = ['Fecha', 'Hora', 'Auxiliar', 'Zona', 'Factura', 'Planilla', 'Codigo', 'Producto', 'Causal', 'Cantidad', 'Total', 'Reventa', 'Verificado'];
    const rows = returns.map(r => [
        r.timestamp ? getLocalDateISO(r.timestamp) : selectedDate,
        r.timestamp ? new Date(r.timestamp).toLocaleTimeString('es-CO') : '',
        r.auxiliarName || 'Desconocido',
        '', // Zona placeholder
        r.invoice,
        r.sheet || '',
        r.code || '',
        (r.productName || '').replace(/,/g, ';'),
        r.reason || '',
        r.quantity,
        r.total,
        r.isResale ? 'S' : 'N',
        r.verified ? 'S' : 'N'
    ]);

    const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Informe_Gerencia_${selectedDate}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

// ===================== MAIN LOAD & RENDER =====================

async function loadAndRender() {
    isLoading = true;
    updateRefreshIndicator();

    try {
        allReturns = await fetchReturns(selectedDate);
        lastUpdate = new Date();
        renderContent();
    } catch (e) {
        console.error('Error cargando informe:', e);
        const content = document.getElementById('gerenciaContent');
        if (content) {
            content.innerHTML = `
                <div class="empty-state">
                    <span class="material-icons-round" style="color:#EE1C25;">error_outline</span>
                    <h3>Error al cargar</h3>
                    <p>No se pudo obtener la información. ${e.message}</p>
                    <p style="margin-top:12px; font-size:13px;">Reintentando automáticamente...</p>
                </div>
            `;
        }
    } finally {
        isLoading = false;
        updateRefreshIndicator();
    }
}

function renderContent() {
    const content = document.getElementById('gerenciaContent');
    if (!content) return;

    if (allReturns.length === 0) {
        content.innerHTML = `
            ${renderKPIs(allReturns)}
            <div class="section-card">
                <div class="section-card-body">
                    <div class="empty-state">
                        <span class="material-icons-round">event_busy</span>
                        <h3>Sin devoluciones</h3>
                        <p>No se registraron devoluciones para el ${selectedDate}.</p>
                    </div>
                </div>
            </div>
        `;
        return;
    }

    const pivot = buildPivot(allReturns);

    content.innerHTML = `
        ${renderKPIs(allReturns)}
        <div class="section-card">
            <div class="section-card-header">
                <h2><span class="material-icons-round">grid_on</span> Causales por Auxiliar</h2>
            </div>
            <div class="section-card-body">
                ${renderPivotTable(pivot)}
            </div>
        </div>
        ${renderCharts(allReturns)}
        ${renderDetailTable(allReturns)}
    `;

    // Build charts after DOM is ready
    requestAnimationFrame(() => {
        buildCharts(allReturns);
        setupDetailToggle();
    });
}

function setupDetailToggle() {
    const toggle = document.getElementById('detailToggle');
    const content = document.getElementById('detailContent');
    if (!toggle || !content) return;

    toggle.onclick = () => {
        const collapsed = content.classList.toggle('collapsed');
        toggle.innerHTML = collapsed
            ? '<span class="material-icons-round" style="font-size:16px;">expand_more</span> Expandir'
            : '<span class="material-icons-round" style="font-size:16px;">expand_less</span> Contraer';
    };
}

function updateRefreshIndicator() {
    const indicator = document.getElementById('refreshIndicator');
    const label = document.getElementById('refreshLabel');
    if (!indicator || !label) return;

    if (isLoading) {
        indicator.classList.add('loading');
        label.textContent = 'Actualizando...';
    } else {
        indicator.classList.remove('loading');
        const time = lastUpdate ? lastUpdate.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }) : '';
        label.textContent = `Actualizado ${time}`;
    }
}

// ===================== EVENT LISTENERS =====================

function setupEventListeners() {
    // Date picker
    const datePicker = document.getElementById('datePicker');
    if (datePicker) {
        datePicker.addEventListener('change', (e) => {
            selectedDate = e.target.value || getLocalDateISO();
            loadAndRender();
        });
    }

    // Manual refresh
    const refreshBtn = document.getElementById('refreshBtn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', () => loadAndRender());
    }

    // Print
    const printBtn = document.getElementById('printBtn');
    if (printBtn) {
        printBtn.addEventListener('click', () => window.print());
    }

    // CSV Export
    const exportBtn = document.getElementById('exportCsvBtn');
    if (exportBtn) {
        exportBtn.addEventListener('click', () => exportCSV(allReturns));
    }
}

// ===================== AUTO REFRESH =====================

function startAutoRefresh() {
    stopAutoRefresh();
    autoRefreshTimer = setInterval(() => loadAndRender(), REFRESH_INTERVAL);
}

function stopAutoRefresh() {
    if (autoRefreshTimer) {
        clearInterval(autoRefreshTimer);
        autoRefreshTimer = null;
    }
}

// ===================== INIT =====================

async function init() {
    console.log('%c Informe Gerencia v27 ', 'background: #00224D; color: #00AEEF; font-weight: bold; padding: 4px; border-radius: 4px;');
    renderShell();
    setupEventListeners();
    await loadAndRender();
    startAutoRefresh();
}

init();
