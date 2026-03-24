import { formatPrice, formatNumber, getLocalDateISO } from '../../utils/formatters.js';
import { db } from '../../data.js';

export const renderStatistics = (returns, routes, stats) => {
    const isDataEmpty = returns.length === 0;
    
    // Get unique months from returns for the filter
    const months = [...new Set(returns.map(r => {
        const date = new Date(r.timestamp);
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    }))].sort().reverse();

    const currentMonth = new Date().toISOString().slice(0, 7);
    if (!months.includes(currentMonth)) months.unshift(currentMonth);

    return `
    <div style="padding: 24px; max-width: 1400px; margin: 0 auto; min-height: 100vh; background: #0f172a; border-radius: 32px; color: #f8fafc; font-family: 'Inter', sans-serif; overflow: hidden; position: relative;">
        <!-- Kinetic Background -->
        <div style="position: absolute; top: -150px; left: -150px; width: 500px; height: 500px; background: radial-gradient(circle, rgba(99, 102, 241, 0.1) 0%, transparent 70%); pointer-events: none; animation: pulseGlow 10s infinite alternate;"></div>
        
        <header style="display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; margin-bottom: 40px; gap: 20px; padding-bottom: 30px; border-bottom: 1px solid rgba(255,255,255,0.05);">
            <div>
                <h1 style="margin: 0; font-size: 36px; font-weight: 950; letter-spacing: -2px; background: linear-gradient(to right, #00aeef, #6366f1); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">ESTADÍSTICAS ELITE</h1>
                <p style="color: #64748b; font-weight: 600; margin-top: 4px; text-transform: uppercase; letter-spacing: 1px; font-size: 12px;">Visualización avanzada de rendimiento</p>
            </div>
            
            <div style="display: flex; gap: 16px; flex-wrap: wrap; background: rgba(255,255,255,0.03); padding: 12px; border-radius: 20px; border: 1px solid rgba(255,255,255,0.05);">
                <div style="position: relative;">
                    <label style="display: block; font-size: 10px; font-weight: 800; color: #64748b; margin-bottom: 6px; text-transform: uppercase; padding-left: 4px;">Periodo (Mes)</label>
                    <select id="statsMonthFilter" style="background: #1e293b; color: white; border: 1px solid rgba(255,255,255,0.1); padding: 10px 16px; border-radius: 12px; font-weight: 700; cursor: pointer; min-width: 160px;">
                        <option value="all">Histórico Total</option>
                        ${months.map(m => `<option value="${m}">${m}</option>`).join('')}
                    </select>
                </div>
                <div style="position: relative;">
                    <label style="display: block; font-size: 10px; font-weight: 800; color: #64748b; margin-bottom: 6px; text-transform: uppercase; padding-left: 4px;">Causal</label>
                    <select id="statsCausalFilter" style="background: #1e293b; color: white; border: 1px solid rgba(255,255,255,0.1); padding: 10px 16px; border-radius: 12px; font-weight: 700; cursor: pointer; min-width: 160px;">
                        <option value="all">Todas las causales</option>
                    </select>
                </div>
            </div>
        </header>

        <div id="statsMainLoader" style="display: none; padding: 100px; text-align: center;">
            <div class="spinner" style="margin: 0 auto; border-color: rgba(255,255,255,0.1); border-top-color: #6366f1;"></div>
        </div>

        <!-- Initially hide empty state; it will appear only if no data loads -->
        <div id="statsEmpty" style="display: none; flex-direction: column; align-items: center; justify-content: center; padding: 80px 20px; text-align: center; background: rgba(255,255,255,0.02); border-radius: 40px; border: 2px dashed rgba(255,255,255,0.05);">
                <div style="width: 100px; height: 100px; background: rgba(99, 102, 241, 0.1); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-bottom: 24px;">
                    <span class="material-icons-round" style="font-size: 50px; color: #6366f1;">bar_chart</span>
                </div>
                <h2 style="font-size: 28px; color: #f8fafc; font-weight: 800; margin-bottom: 12px;">Sin registros detectados</h2>
                <p style="color: #64748b; max-width: 500px; margin-bottom: 32px; font-size: 16px; line-height: 1.6;">No hemos encontrado datos suficientes para este periodo. Activa el modo demostración para previsualizar las herramientas de análisis.</p>
                <button id="activateDemoBtn" style="background: linear-gradient(135deg, #00aeef, #6366f1); color: white; padding: 18px 45px; border-radius: 20px; font-weight: 900; border: none; cursor: pointer; box-shadow: 0 10px 25px rgba(99, 102, 241, 0.4); font-size: 16px; transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);">CARGAR DATOS DE MUESTRA</button>
            </div>

        <div id="statsDashboard">
            <!-- Top Section: KPIs -->
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 24px; margin-bottom: 40px;">
                <div class="kpi-card" style="background: linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(99, 102, 241, 0.02) 100%); padding: 30px; border-radius: 24px; border: 1px solid rgba(99, 102, 241, 0.2); backdrop-filter: blur(10px);">
                    <div style="color: #6366f1; font-size: 12px; font-weight: 900; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 15px;">Volumen Total</div>
                    <div id="statTotalItems" style="font-size: 52px; font-weight: 950; color: #fff; line-height: 1;">0</div>
                    <div style="margin-top: 15px; font-size: 13px; color: #94a3b8;">Items procesados en <b id="statTotalSheets">0</b> planillas</div>
                </div>
                <div class="kpi-card" style="background: linear-gradient(135deg, rgba(244, 63, 94, 0.1) 0%, rgba(244, 63, 94, 0.02) 100%); padding: 30px; border-radius: 24px; border: 1px solid rgba(244, 63, 94, 0.2); backdrop-filter: blur(10px);">
                    <div style="color: #f43f5e; font-size: 12px; font-weight: 900; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 15px;">Monto Total</div>
                    <div id="statTotalValue" style="font-size: 52px; font-weight: 950; color: #fff; line-height: 1;">$0</div>
                    <div style="margin-top: 15px; font-size: 13px; color: #94a3b8;">Pérdida operativa detectada</div>
                </div>
                <div class="kpi-card" style="background: linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(16, 185, 129, 0.02) 100%); padding: 30px; border-radius: 24px; border: 1px solid rgba(16, 185, 129, 0.2); backdrop-filter: blur(10px);">
                    <div style="color: #10b981; font-size: 12px; font-weight: 900; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 15px;">Eficiencia Auditoría</div>
                    <div id="statEfficiency" style="font-size: 52px; font-weight: 950; color: #fff; line-height: 1;">0%</div>
                    <div style="margin-top: 15px; width: 100%; height: 6px; background: rgba(255,255,255,0.05); border-radius: 10px; overflow: hidden;"><div id="statEfficiencyBar" style="width: 0%; height: 100%; background: #10b981; transition: width 1.5s ease;"></div></div>
                </div>
            </div>

            <!-- Charts Section -->
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 32px; margin-bottom: 40px;">
                <!-- Main Trend -->
                <div style="background: rgba(255,255,255,0.02); padding: 32px; border-radius: 32px; border: 1px solid rgba(255,255,255,0.05);">
                    <h3 style="font-size: 18px; font-weight: 900; color: #f1f5f9; margin-bottom: 24px; display: flex; align-items: center; gap: 10px;">
                        <span class="material-icons-round" style="color: #6366f1;">trending_up</span> TENDENCIA DIARIA
                    </h3>
                    <div style="height: 350px;"><canvas id="statsTrendChart"></canvas></div>
                </div>
                
                <!-- Auxiliary Ranking -->
                <div style="background: rgba(255,255,255,0.02); padding: 32px; border-radius: 32px; border: 1px solid rgba(255,255,255,0.05);">
                    <h3 style="font-size: 18px; font-weight: 900; color: #f1f5f9; margin-bottom: 24px; display: flex; align-items: center; gap: 10px;">
                        <span class="material-icons-round" style="color: #00aeef;">format_list_numbered</span> RANKING DE AUXILIARES
                    </h3>
                    <div style="height: 350px;"><canvas id="statsAuxiliarChart"></canvas></div>
                </div>
            </div>

            <!-- Management Composition & Causals -->
            <div style="display: grid; grid-template-columns: 1fr 1.5fr; gap: 32px; margin-bottom: 40px;">
                <div style="background: rgba(255,255,255,0.02); padding: 32px; border-radius: 32px; border: 1px solid rgba(255,255,255,0.05);">
                    <h3 style="font-size: 18px; font-weight: 900; color: #f1f5f9; margin-bottom: 24px; display: flex; align-items: center; gap: 10px;">
                        <span class="material-icons-round" style="color: #10b981;">pie_chart</span> TIPO DE GESTIÓN
                    </h3>
                    <div style="height: 250px;"><canvas id="statsTypeChart"></canvas></div>
                    <div id="statsTypeLegend" style="margin-top: 20px; display: flex; justify-content: space-around;"></div>
                </div>

                <div style="background: rgba(255,255,255,0.02); padding: 32px; border-radius: 32px; border: 1px solid rgba(255,255,255,0.05);">
                    <h3 style="font-size: 18px; font-weight: 900; color: #f1f5f9; margin-bottom: 24px; display: flex; align-items: center; gap: 10px;">
                        <span class="material-icons-round" style="color: #f59e0b;">donut_large</span> SEGMENTACIÓN POR CAUSAL
                    </h3>
                    <div style="height: 250px;"><canvas id="statsCausalChart"></canvas></div>
                    <div id="statsCausalLegend" style="margin-top: 24px; display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px;"></div>
                </div>
            </div>

            <!-- Prediction Footer -->
            <div style="background: linear-gradient(to right, rgba(99, 102, 241, 0.1), rgba(0, 174, 239, 0.1)); padding: 24px; border-radius: 24px; border: 1px solid rgba(255,255,255,0.05); display: flex; align-items: center; justify-content: center; gap: 30px;">
                <span class="material-icons-round" style="font-size: 48px; color: #6366f1; opacity: 0.5;">insights</span>
                <div style="text-align: left;">
                    <h4 style="font-size: 18px; font-weight: 900; color: #f1f5f9; margin: 0;">Predictor Inteligente del Periodo</h4>
                    <p style="color: #94a3b8; font-size: 14px; margin: 4px 0 0 0;">Basado en las tendencias actuales, se estima cerrar con un volumen de <b id="statsPrediction" style="color: #6366f1;">...</b> items.</p>
                </div>
            </div>
        </div>
        </div>
        
        <style>
            @keyframes pulseGlow { from { opacity: 0.5; transform: scale(1); } to { opacity: 0.8; transform: scale(1.2); } }
            .kpi-card { transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
            .kpi-card:hover { transform: translateY(-10px); box-shadow: 0 20px 30px -10px rgba(0,0,0,0.5); }
            select:focus { outline: none; border-color: #6366f1; }
        </style>
    </div>
`;
};

let chartInstances = {};

export const initStatisticsCharts = (originalData, routes, organization = null) => {
    let filteringMonth = 'all';
    let filteringCausal = 'all';
    const org = organization;  // Use directly from caller (admin user's org)
    let lastSummary = null;

    const mainReasons = [
        "Producto averiado", "Error de despacho", "Rechazo del cliente", 
        "Sin dinero", "Error de facturación", "Error de vendedor", 
        "Faltante", "Negocio cerrado", "Fuera de ruta"
    ];

    const cleanData = (rawData) => {
        const seenItems = new Set();
        return rawData
            .filter(r => {
                // Same deduplication logic as History, Reports and Data Summary
            // Case-sensitive deduplication to match data.js/history.js
            const timeKey = r.timestamp ? String(r.timestamp).substring(0, 16) : 'no-time';
            const keyCol = (r.product_code || r.product_name) ? (r.product_code || r.product_name) : (r.code || r.productName);
            const key = `${r.invoice}-${r.sheet}-${keyCol}-${r.quantity}-${r.total}-${timeKey}`;
            if (seenItems.has(key)) return false;
            seenItems.add(key);
            return true;
            })
            .map(r => {
                let reason = (r.reason || 'Otros').trim();
                const matched = mainReasons.find(m => m.toLowerCase() === reason.toLowerCase());
                if (matched && !reason.toLowerCase().includes('otro')) {
                    reason = matched;
                } else {
                    reason = 'Otros';
                }
                return { ...r, reason };
            });
    };

    let currentData = cleanData(originalData);

    const getStatsArea = () => {
        let filtered = [...currentData];
        if (filteringMonth !== 'all') {
            filtered = filtered.filter(r => getLocalDateISO(r.timestamp).startsWith(filteringMonth));
        }
        if (filteringCausal !== 'all') {
            filtered = filtered.filter(r => r.reason === filteringCausal);
        }
        return filtered;
    };

    const loadFullMonthData = async (month) => {
        const dashboard = document.getElementById('statsDashboard');
        const loader = document.getElementById('statsMainLoader');
        if (loader) loader.style.display = 'block';
        if (dashboard) dashboard.style.opacity = '0.3';
        
        let filters = {};
        if (month !== 'all') {
            filters.dateFrom = `${month}-01`;
            const [y, m] = month.split('-').map(Number);
            const lastDay = new Date(y, m, 0).getDate();
            filters.dateTo = `${month}-${lastDay}`;
        }
        
        try {
            // Parallel fetch for speed: Details (for charts) and Summary (total truth)
            const [fullData, summary] = await Promise.all([
                db.getReturns(6000, 0, org, filters),
                db.getReturnsSummary(org, filters)
            ]);
            
            currentData = cleanData(fullData || []);
            lastSummary = summary;
            
            if (loader) loader.style.display = 'none';
            if (dashboard) dashboard.style.opacity = '1';

            // Show/hide empty state based on whether we actually got data
            const emptyEl = document.getElementById('statsEmpty');
            const hasFreshData = currentData.length > 0;
            if (emptyEl) emptyEl.style.display = hasFreshData ? 'none' : 'flex';
            if (dashboard) dashboard.style.display = hasFreshData ? 'block' : 'none';
            
            // Re-populate months dropdown if new months are found in full data
            updateMonthsDropdown();
            
            setupSelectors();
            runAnalytics(lastSummary);
        } catch (e) {
            console.error("Error loading stats data:", e);
            if (loader) loader.style.display = 'none';
            if (dashboard) dashboard.style.opacity = '1';
        }
    };

    const updateMonthsDropdown = () => {
        const monthSel = document.getElementById('statsMonthFilter');
        if (!monthSel) return;
        
        const foundMonths = [...new Set(currentData.map(r => {
            const date = new Date(r.timestamp);
            return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        }))].sort().reverse();
        
        const currentVal = monthSel.value;
        const existingOptions = Array.from(monthSel.options).map(o => o.value);
        
        let needsUpdate = false;
        foundMonths.forEach(m => {
            if (!existingOptions.includes(m)) needsUpdate = true;
        });
        
        if (needsUpdate) {
            const allMonths = [...new Set([...existingOptions.filter(m => m !== 'all'), ...foundMonths])].sort().reverse();
            monthSel.innerHTML = '<option value="all">Histórico Total</option>' + 
                allMonths.map(m => `<option value="${m}">${m}</option>`).join('');
            monthSel.value = currentVal;
            console.log("Updated months dropdown with new data:", allMonths);
        }
    };

    const runAnalytics = (summary = null) => {
        if (summary) lastSummary = summary;
        const s = lastSummary;
        
        const data = getStatsArea();
        
        const dashboard = document.getElementById('statsDashboard');

        // Destroy previous charts
        Object.values(chartInstances).forEach(c => c.destroy());
        chartInstances = {};

        // KPIs: Use server-side summary if available, otherwise fallback to local reduction
        // CRITICAL: summary.total is now deduplicated in data.js
        const totalValue = (s && filteringCausal === 'all') ? s.total : data.reduce((sum, r) => sum + (r.total || 0), 0);
        const recordCount = (s && filteringCausal === 'all') ? s.count : data.length;
        
        // Items vs Records: We want to show the sum of physical quantities if possible
        const totalPhysicalItems = data.reduce((sum, r) => sum + (parseInt(r.quantity) || 1), 0);
        
        const verifiedCount = data.filter(r => r.verified).length;
        const efficiency = data.length > 0 ? Math.round((verifiedCount / data.length) * 100) : 0;
        const uniqueSheets = new Set(data.map(r => r.sheet || r.invoice)).size;

        const animateKPI = (id, target, prefix = '') => {
            const el = document.getElementById(id);
            if (!el) return;
            let start = 0;
            const step = target / 30;
            if (target === 0) { el.textContent = prefix + '0'; return; }
            const timer = setInterval(() => {
                start += step;
                if (start >= target) {
                    el.textContent = prefix + (prefix === '$' ? formatNumber(Math.round(target)) : formatNumber(target));
                    clearInterval(timer);
                } else {
                    el.textContent = prefix + formatNumber(Math.round(start));
                }
            }, 20);
        };

        // If we have a summary, use it for the big numbers to be 100% real
        animateKPI('statTotalItems', summary ? summary.count : totalPhysicalItems);
        animateKPI('statTotalValue', totalValue, '$');
        
        const sheetsEl = document.getElementById('statTotalSheets');
        if (sheetsEl) sheetsEl.textContent = formatNumber(uniqueSheets);

        const effText = document.getElementById('statEfficiency');
        if (effText) effText.textContent = efficiency + '%';
        const effBar = document.getElementById('statEfficiencyBar');
        if (effBar) setTimeout(() => effBar.style.width = efficiency + '%', 100);

        // Leaderboard (Auxiliaries - High Impact)
        const auxPerf = {};
        data.forEach(r => {
            const name = r.auxiliarName || 'Desconocido';
            auxPerf[name] = (auxPerf[name] || 0) + 1;
        });
        const sortedAux = Object.entries(auxPerf).sort((a,b) => b[1] - a[1]).slice(0, 10);

        const auxCtx = document.getElementById('statsAuxiliarChart');
        if (auxCtx) {
            chartInstances.aux = new Chart(auxCtx, {
                type: 'bar',
                data: {
                    labels: sortedAux.map(a => a[0]),
                    datasets: [{
                        label: 'Devoluciones',
                        data: sortedAux.map(a => a[1]),
                        backgroundColor: 'rgba(0, 174, 239, 0.7)',
                        hoverBackgroundColor: '#00aeef',
                        borderRadius: 10,
                        barThickness: 15
                    }]
                },
                options: {
                    indexAxis: 'y', responsive: true, maintainAspectRatio: false,
                    animation: { duration: 1500, easing: 'easeOutElastic' },
                    plugins: { legend: { display: false } },
                    scales: { 
                        x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#64748b' } },
                        y: { grid: { display: false }, ticks: { color: '#f1f5f9', font: { weight: '700' } } }
                    }
                }
            });
        }

        // Trend Chart
        const dates = [...new Set(data.map(r => getLocalDateISO(r.timestamp)))].sort();
        const dailyCounts = dates.map(d => data.filter(r => getLocalDateISO(r.timestamp) === d).length);
        
        const trendCtx = document.getElementById('statsTrendChart');
        if (trendCtx) {
            chartInstances.trend = new Chart(trendCtx, {
                type: 'line',
                data: {
                    labels: dates.map(d => d.split('-').slice(1).reverse().join('/')),
                    datasets: [{
                        label: 'Volumen',
                        data: dailyCounts,
                        borderColor: '#6366f1',
                        backgroundColor: 'rgba(99, 102, 241, 0.1)',
                        fill: true, tension: 0.4, pointRadius: 4, pointHoverRadius: 8
                    }]
                },
                options: {
                    responsive: true, maintainAspectRatio: false,
                    animation: { duration: 2000, easing: 'easeOutQuart' },
                    scales: {
                        y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#64748b' } },
                        x: { grid: { display: false }, ticks: { color: '#64748b' } }
                    },
                    plugins: { legend: { display: false } }
                }
            });
        }

        // Type Composition (Partial vs Total)
        const partials = data.filter(r => !String(r.productName || '').toUpperCase().includes('TOTAL'));
        const totals = data.filter(r => String(r.productName || '').toUpperCase().includes('TOTAL'));
        const typeCtx = document.getElementById('statsTypeChart');
        if (typeCtx) {
            chartInstances.type = new Chart(typeCtx, {
                type: 'pie',
                data: {
                    labels: ['Parciales', 'Totales'],
                    datasets: [{
                        data: [partials.length, totals.length],
                        backgroundColor: ['#6366f1', '#10b981'],
                        borderWidth: 0
                    }]
                },
                options: {
                    responsive: true, maintainAspectRatio: false,
                    plugins: { legend: { display: false } }
                }
            });
            const typeLeg = document.getElementById('statsTypeLegend');
            if (typeLeg) {
                typeLeg.innerHTML = `
                    <div style="font-size: 12px; color: #94a3b8; font-weight: 700;"><span style="color: #6366f1;">●</span> Parciales: ${partials.length}</div>
                    <div style="font-size: 12px; color: #94a3b8; font-weight: 700;"><span style="color: #10b981;">●</span> Totales: ${totals.length}</div>
                `;
            }
        }

        // Causal Chart (Now uses pre-processed clean data)
        const causalCounts = {};
        data.forEach(r => { 
            causalCounts[r.reason] = (causalCounts[r.reason] || 0) + 1; 
        });
        const sortedCausals = Object.entries(causalCounts).sort((a,b) => b[1] - a[1]);
        const colors = ['#6366f1', '#00aeef', '#10b981', '#f59e0b', '#f43f5e', '#8b5cf6', '#64748b'];

        const causalCtx = document.getElementById('statsCausalChart');
        if (causalCtx) {
            chartInstances.causal = new Chart(causalCtx, {
                type: 'doughnut',
                data: {
                    labels: sortedCausals.map(c => c[0]),
                    datasets: [{
                        data: sortedCausals.map(c => c[1]),
                        backgroundColor: colors,
                        borderWidth: 0,
                        borderRadius: 5,
                        spacing: 4
                    }]
                },
                options: {
                    responsive: true, maintainAspectRatio: false, cutout: '70%',
                    plugins: { legend: { display: false } }
                }
            });

            const leg = document.getElementById('statsCausalLegend');
            if (leg) {
                leg.innerHTML = sortedCausals.map((c, i) => `
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <span style="width: 10px; height: 10px; border-radius: 50%; background: ${colors[i%colors.length]};"></span>
                        <div style="font-size: 11px; color: #94a3b8; font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 120px;">${c[0]} <span style="color: #64748b;">(${c[1]})</span></div>
                    </div>
                `).join('');
            }
        }

        // Prediction
        const predicEl = document.getElementById('statsPrediction');
        if (predicEl) predicEl.textContent = formatNumber(Math.round(data.length * 1.3));
    };

    const setupSelectors = () => {
        const monthSel = document.getElementById('statsMonthFilter');
        const causalSel = document.getElementById('statsCausalFilter');

        // Populate Causal Filter with already cleaned data
        if (causalSel) {
            const uniqueCausals = [...new Set(currentData.map(r => r.reason))].sort();
            
            causalSel.innerHTML = '<option value="all">Todas las causales</option>' + 
                uniqueCausals.map(c => `<option value="${c}">${c}</option>`).join('');
            
            causalSel.value = filteringCausal; // Keep the current causal filter selection
        }

        if (monthSel) monthSel.onchange = (e) => { 
            filteringMonth = e.target.value; 
            loadFullMonthData(filteringMonth); 
        };
        if (causalSel) causalSel.onchange = (e) => { filteringCausal = e.target.value; runAnalytics(); };
    };

    setTimeout(async () => {
        if (typeof Chart === 'undefined') return;
        
        setupSelectors();

        // Step 1: Load all available historical months from DB (lightweight query)
        const monthSel = document.getElementById('statsMonthFilter');
        try {
            const availableMonths = await db.getAvailableMonths(org);
            if (monthSel && availableMonths.length > 0) {
                const currentVal = monthSel.value;
                const existingOptions = new Set(Array.from(monthSel.options).map(o => o.value));
                
                // Add months not already in dropdown
                availableMonths.forEach(m => {
                    if (!existingOptions.has(m)) {
                        const opt = document.createElement('option');
                        opt.value = m;
                        opt.textContent = m;
                        monthSel.appendChild(opt);
                    }
                });

                // Sort options: "Histórico Total" first, then months desc
                const allOptions = Array.from(monthSel.options)
                    .filter(o => o.value !== 'all')
                    .sort((a, b) => b.value.localeCompare(a.value));
                monthSel.innerHTML = '<option value="all">Histórico Total</option>' +
                    allOptions.map(o => `<option value="${o.value}">${o.value}</option>`).join('');
            }
        } catch(e) {
            console.warn('[Stats] Could not load historical months:', e);
        }

        // Step 2: Auto-load current month data
        const now = new Date();
        const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        if (monthSel) {
            monthSel.value = currentMonthStr;
            filteringMonth = currentMonthStr;
            loadFullMonthData(currentMonthStr);
        } else if (currentData.length > 0) {
            runAnalytics();
        }

        const demoBtn = document.getElementById('activateDemoBtn');
        if (demoBtn) {
            demoBtn.onclick = () => {
                demoBtn.textContent = 'SIMULANDO...';
                const mock = [];
                const aus = ['Juan Perez', 'Maria Gomez', 'Andres Lopez', 'Carlos Ruiz', 'Sofia Paez'];
                const reasons = ['Producto averiado', 'Error de despacho', 'Rechazo del cliente', 'Sin dinero', 'Faltante'];
                
                for(let i=0; i<120; i++) {
                    const daysAgo = Math.floor(Math.random() * 60);
                    mock.push({
                        timestamp: new Date(Date.now() - (daysAgo * 24 * 60 * 60 * 1000)).toISOString(),
                        total: 20000 + Math.random() * 150000,
                        reason: reasons[Math.floor(Math.random() * reasons.length)],
                        auxiliarName: aus[Math.floor(Math.random() * aus.length)],
                        productName: Math.random() > 0.3 ? "Producto X" : "DEVOLUCIÓN TOTAL",
                        verified: Math.random() > 0.4
                    });
                }
                currentData = mock;
                setupSelectors(); 
                runAnalytics();
            };
        }
    }, 200);
};
