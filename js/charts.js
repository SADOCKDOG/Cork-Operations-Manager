/**
 * Charts.js - Visualización de datos con Chart.js (v5.9.3)
 * Gráficos para reportes: tendencias, calidades, zonas, económicos
 */

const Charts = {
    // Referencias a instancias de Chart para destruirlas al cambiar de vista
    _instances: {},

    /**
     * Destruye gráfico anterior si existe
     */
    _destroyChart(id) {
        if (this._instances[id] && typeof this._instances[id].destroy === 'function') {
            this._instances[id].destroy();
            delete this._instances[id];
        }
    },

    /**
     * Gráfico: Tendencia de producción (últimos 30 días)
     * Muestra kg acumulados por día
     */
    async renderTrendChart(containerId) {
        this._destroyChart(containerId);
        
        const pesadas = await Pesadas.list();
        const hoy = new Date();
        const dias = [], valores = [];
        
        for (let i = 29; i >= 0; i--) {
            const d = new Date();
            d.setDate(hoy.getDate() - i);
            const fechaStr = d.toISOString().split('T')[0];
            const totalDia = pesadas
                .filter(p => p.fecha.startsWith(fechaStr))
                .reduce((acc, p) => acc + (p.kg || 0), 0);
            
            const diaNombre = d.toLocaleDateString('es-ES', { month: 'short', day: 'numeric' });
            dias.push(diaNombre);
            valores.push(totalDia);
        }

        const canvasEl = document.getElementById(containerId);
        if (!canvasEl) return;

        this._instances[containerId] = new Chart(canvasEl, {
            type: 'line',
            data: {
                labels: dias,
                datasets: [{
                    label: 'Producción Diaria (kg)',
                    data: valores,
                    borderColor: '#7fb069',
                    backgroundColor: 'rgba(127, 176, 105, 0.1)',
                    borderWidth: 2,
                    tension: 0.4,
                    fill: true,
                    pointBackgroundColor: '#7fb069',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointRadius: 4,
                    pointHoverRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: true, position: 'top' },
                    title: { display: true, text: 'Tendencia: Últimos 30 días' }
                },
                scales: {
                    y: { beginAtZero: true, title: { display: true, text: 'KG' } }
                }
            }
        });
    },

    /**
     * Gráfico: Distribución por calidad (pie chart)
     * Muestra % de cada calidad
     */
    async renderQualityChart(containerId) {
        this._destroyChart(containerId);

        const pesadas = await Pesadas.list();
        const totales = {
            primera: 0,
            bornizo: 0,
            refugo: 0
        };

        pesadas.forEach(p => {
            totales.primera += p.pesadasPorCalidad?.primera?.kg || 0;
            totales.bornizo += p.pesadasPorCalidad?.bornizo?.kg || 0;
            totales.refugo += p.pesadasPorCalidad?.refugo?.kg || 0;
        });

        const canvasEl = document.getElementById(containerId);
        if (!canvasEl) return;

        this._instances[containerId] = new Chart(canvasEl, {
            type: 'doughnut',
            data: {
                labels: ['⭐ 1ª Calidad', '🟡 Bornizo', '🔴 Refugo'],
                datasets: [{
                    data: [totales.primera, totales.bornizo, totales.refugo],
                    backgroundColor: ['#7fb069', '#d4a373', '#ff4d4d'],
                    borderColor: ['#6fa65f', '#c4945f', '#e63d3d'],
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'bottom' },
                    tooltip: { callbacks: { label: (ctx) => `${ctx.label}: ${ctx.parsed} kg` } }
                }
            }
        });
    },

    /**
     * Gráfico: Comparativa zonas (bar chart horizontal)
     * Muestra producción por zona
     */
    async renderZonesChart(containerId) {
        this._destroyChart(containerId);

        const stats = await Zonas.getStats();
        const zonas = stats.map(z => z.nombre);
        const kg = stats.map(z => z.totalKg);
        const colores = ['#7fb069', '#d4a373', '#ff4d4d', '#4CAF50', '#FF9800'];

        const canvasEl = document.getElementById(containerId);
        if (!canvasEl) return;

        this._instances[containerId] = new Chart(canvasEl, {
            type: 'bar',
            data: {
                labels: zonas,
                datasets: [{
                    label: 'Producción por Zona (kg)',
                    data: kg,
                    backgroundColor: colores.slice(0, zonas.length),
                    borderColor: '#333',
                    borderWidth: 1
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: true },
                    tooltip: { callbacks: { label: (ctx) => `${Math.round(ctx.parsed.x)} kg` } }
                },
                scales: {
                    x: { beginAtZero: true, title: { display: true, text: 'KG' } }
                }
            }
        });
    },

    /**
     * Gráfico: Valor económico por calidad
     * Muestra valor en euros por calidad
     */
    async renderEconomicChart(containerId) {
        this._destroyChart(containerId);

        const reporte = await Reportes.generarReporteEconomicoGlobal();
        if (!reporte) return;

        const canvasEl = document.getElementById(containerId);
        if (!canvasEl) return;

        const datos = [
            reporte.totales.primera.valor,
            reporte.totales.bornizo.valor,
            reporte.totales.refugo.valor
        ];

        this._instances[containerId] = new Chart(canvasEl, {
            type: 'bar',
            data: {
                labels: ['⭐ 1ª Calidad', '🟡 Bornizo', '🔴 Refugo'],
                datasets: [{
                    label: 'Valor Económico (€)',
                    data: datos,
                    backgroundColor: ['#7fb069', '#d4a373', '#ff4d4d'],
                    borderColor: ['#6fa65f', '#c4945f', '#e63d3d'],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: true },
                    tooltip: { callbacks: { label: (ctx) => `${ctx.parsed.y.toFixed(2)}€` } }
                },
                scales: {
                    y: { beginAtZero: true, title: { display: true, text: 'Euros (€)' } }
                }
            }
        });
    },

    /**
     * Gráfico: Merma vs Neto (comparativa)
     * Muestra impacto del oreo
     */
    async renderMermaChart(containerId) {
        this._destroyChart(containerId);

        const reporte = await Reportes.generarReporteEconomicoGlobal();
        if (!reporte) return;

        const canvasEl = document.getElementById(containerId);
        if (!canvasEl) return;

        const brutos = [
            reporte.totales.primera.bruto,
            reporte.totales.bornizo.bruto,
            reporte.totales.refugo.bruto
        ];
        const mermas = [
            reporte.totales.primera.merma,
            reporte.totales.bornizo.merma,
            reporte.totales.refugo.merma
        ];

        this._instances[containerId] = new Chart(canvasEl, {
            type: 'bar',
            data: {
                labels: ['⭐ 1ª', '🟡 Bornizo', '🔴 Refugo'],
                datasets: [
                    {
                        label: 'Bruto (Q)',
                        data: brutos,
                        backgroundColor: '#7fb069',
                        borderWidth: 0
                    },
                    {
                        label: 'Merma (Q)',
                        data: mermas,
                        backgroundColor: '#ff6b6b',
                        borderWidth: 0
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                indexAxis: 'x',
                scales: {
                    x: { stacked: false },
                    y: { stacked: false, beginAtZero: true }
                },
                plugins: {
                    tooltip: { callbacks: { label: (ctx) => `${ctx.parsed.y.toFixed(2)} Q` } }
                }
            }
        });
    },

    /**
     * Gráfico: Producción por saca (últimas 20)
     * Muestra evolución temporal
     */
    async renderSacasChart(containerId) {
        this._destroyChart(containerId);

        const pesadas = await Pesadas.list();
        const ultimas = pesadas.slice(0, 20).reverse();
        
        const canvasEl = document.getElementById(containerId);
        if (!canvasEl) return;

        this._instances[containerId] = new Chart(canvasEl, {
            type: 'bar',
            data: {
                labels: ultimas.map((p, i) => `#${p.saca || i}`),
                datasets: [{
                    label: 'KG por Saca',
                    data: ultimas.map(p => p.kg),
                    backgroundColor: ultimas.map(p => {
                        const cal = p.pesadasPorCalidad;
                        if ((cal?.primera?.kg || 0) > 0) return '#7fb069';
                        if ((cal?.bornizo?.kg || 0) > 0) return '#d4a373';
                        return '#ff4d4d';
                    }),
                    borderWidth: 0
                }]
            },
            options: {
                indexAxis: 'x',
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: { y: { beginAtZero: true } }
            }
        });
    }
};

window.Charts = Charts;
