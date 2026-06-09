import { Chart, registerables } from 'chart.js';
import { Pesadas } from './pesadas';
import { Zonas } from './zonas';
import { Reportes } from './reportes';

Chart.register(...registerables);

class ChartManager {
    private _instances: Record<string, Chart> = {};

    private _destroyChart(id: string) {
        if (this._instances[id]) {
            this._instances[id].destroy();
            delete this._instances[id];
        }
    }

    async renderTrendChart(containerId: string) {
        this._destroyChart(containerId);
        const pesadas = await Pesadas.list();
        const hoy = new Date();
        const dias: string[] = [], valores: number[] = [];

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

        const canvasEl = document.getElementById(containerId) as HTMLCanvasElement;
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
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: true, position: 'top' },
                },
                scales: {
                    y: { beginAtZero: true }
                }
            }
        });
    }

    async renderQualityChart(containerId: string) {
        this._destroyChart(containerId);
        const pesadas = await Pesadas.list();
        const totales = { primera: 0, bornizo: 0, refugo: 0 };
        pesadas.forEach(p => {
            totales.primera += p.pesadasPorCalidad?.primera?.kg || 0;
            totales.bornizo += p.pesadasPorCalidad?.bornizo?.kg || 0;
            totales.refugo += p.pesadasPorCalidad?.refugo?.kg || 0;
        });
        const canvasEl = document.getElementById(containerId) as HTMLCanvasElement;
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
                plugins: { legend: { position: 'bottom' } }
            }
        });
    }

    async renderZonesChart(containerId: string) {
        this._destroyChart(containerId);
        const stats = await Zonas.getStats();
        const zonas = stats.map(z => z.nombre);
        const kg = stats.map(z => z.totalKg);
        const colores = ['#7fb069', '#d4a373', '#ff4d4d', '#4CAF50', '#FF9800'];
        const canvasEl = document.getElementById(containerId) as HTMLCanvasElement;
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
                scales: { x: { beginAtZero: true } }
            }
        });
    }

    async renderEconomicChart(containerId: string) {
        this._destroyChart(containerId);
        const reporte = await Reportes.generarReporteEconomicoGlobal();
        if (!reporte) return;
        const canvasEl = document.getElementById(containerId) as HTMLCanvasElement;
        if (!canvasEl) return;
        this._instances[containerId] = new Chart(canvasEl, {
            type: 'bar',
            data: {
                labels: ['⭐ 1ª Calidad', '🟡 Bornizo', '🔴 Refugo'],
                datasets: [{
                    label: 'Valor Económico (€)',
                    data: [reporte.totales.primera.valor, reporte.totales.bornizo.valor, reporte.totales.refugo.valor],
                    backgroundColor: ['#7fb069', '#d4a373', '#ff4d4d'],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: { y: { beginAtZero: true } }
            }
        });
    }
}

export const Charts = new ChartManager();
export default Charts;
