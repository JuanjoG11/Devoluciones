import { formatPrice } from '../../utils/formatters.js';

export const renderStatistics = (returns, routes, stats) => `
    <header style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; background: var(--grad-electric); padding: 20px 24px; border-radius: 16px; color: white; box-shadow: var(--shadow-blue); position: relative; overflow: hidden;">
        <div style="position: absolute; right: -10px; top: -10px; opacity: 0.1;"><span class="material-icons-round" style="font-size: 100px;">insights</span></div>
        <div style="position: relative; z-index: 1;">
            <h1 style="color: white; margin: 0; font-size: 24px; letter-spacing: -0.5px; font-weight: 800;">Estadísticas de Devoluciones</h1>
            <p style="color: rgba(255,255,255,0.8); font-size: 13px; font-weight: 500; margin: 2px 0 0;">Análisis detallado de motivos y auxiliares</p>
        </div>
    </header>

    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 24px; margin-bottom: 32px;">
        <div class="card" style="padding: 24px; background: white; border-radius: 16px; box-shadow: var(--shadow-premium);">
            <h3 class="mb-lg" style="display: flex; align-items: center; gap: 8px;">
                <span class="material-icons-round" style="color: var(--primary-color);">pie_chart</span>
                Razones de Devolución
            </h3>
            <div style="position: relative; height: 350px;">
                <canvas id="reasonsChartFull"></canvas>
            </div>
        </div>

        <div class="card" style="padding: 24px; background: white; border-radius: 16px; box-shadow: var(--shadow-premium);">
            <h3 class="mb-lg" style="display: flex; align-items: center; gap: 8px;">
                <span class="material-icons-round" style="color: var(--accent-color);">bar_chart</span>
                Desempeño por Auxiliar
            </h3>
            <div style="position: relative; height: 350px;">
                <canvas id="auxiliariesChartFull"></canvas>
            </div>
        </div>
    </div>
`;

export const initStatisticsCharts = (returns, routes) => {
    setTimeout(() => {
        if (typeof Chart === 'undefined') return;

        // Calculate reasons
        const reasonCounts = {};
        returns.forEach(r => {
            const reason = r.reason || 'Sin especificar';
            reasonCounts[reason] = (reasonCounts[reason] || 0) + 1;
        });

        const sortedReasons = Object.entries(reasonCounts)
            .sort((a, b) => b[1] - a[1]);

        // Calculate auxiliaries
        const auxCounts = {};
        returns.forEach(r => {
            const route = routes.find(rt => String(rt.id) === String(r.routeId));
            const auxName = route ? route.userName : 'Desconocido';
            auxCounts[auxName] = (auxCounts[auxName] || 0) + 1;
        });

        const sortedAux = Object.entries(auxCounts)
            .sort((a, b) => b[1] - a[1]);

        // Reasons Chart
        const reasonsCtx = document.getElementById('reasonsChartFull');
        if (reasonsCtx && sortedReasons.length > 0) {
            new Chart(reasonsCtx, {
                type: 'doughnut',
                data: {
                    labels: sortedReasons.map(r => r[0]),
                    datasets: [{
                        data: sortedReasons.map(r => r[1]),
                        backgroundColor: [
                            'rgba(99, 102, 241, 0.8)',
                            'rgba(0, 174, 239, 0.8)',
                            'rgba(34, 197, 94, 0.8)',
                            'rgba(251, 146, 60, 0.8)',
                            'rgba(239, 68, 68, 0.8)',
                            '#cbd5e1'
                        ]
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { position: 'bottom' }
                    }
                }
            });
        }

        // Auxiliaries Chart
        const auxCtx = document.getElementById('auxiliariesChartFull');
        if (auxCtx && sortedAux.length > 0) {
            new Chart(auxCtx, {
                type: 'bar',
                data: {
                    labels: sortedAux.map(a => a[0]),
                    datasets: [{
                        label: 'Cant. Devoluciones',
                        data: sortedAux.map(a => a[1]),
                        backgroundColor: 'rgba(99, 102, 241, 0.8)',
                        borderRadius: 8
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    indexAxis: 'y',
                    plugins: {
                        legend: { display: false }
                    },
                    scales: {
                        x: { beginAtZero: true, ticks: { stepSize: 1 } },
                        y: { grid: { display: false } }
                    }
                }
            });
        }
    }, 100);
};
