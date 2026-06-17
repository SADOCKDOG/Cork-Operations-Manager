import { Reportes } from '../reportes.js';
import { Fincas } from '../fincas.js';
import { Pesadas } from '../pesadas.js';
import { Zonas } from '../zonas.js';
import { Gastos } from '../gastos.js';
import { App } from '../app.js';
import { Utils } from '../core/utils.js';
import { Charts } from '../charts.js';

export const ReportesUI = {
    async renderReportesView() {
        const main = document.getElementById('app-content');
        main.innerHTML = `
            <div style="display:flex; align-items:center; gap:12px; margin-bottom:25px;">
                <div style="width:5px; height:30px; background:var(--p-cork); border-radius:3px;"></div>
                <h2 style="margin:0; border:none; padding:0; color:var(--text-p); font-weight:800;">Central de Informes</h2>
            </div>
            <div class="reportes-selector-grid">
                <button class="report-select-btn theme-global" data-action="App.renderReporteGlobal">
                    <span class="btn-icon">🌍</span>
                    <strong>Balance Global</strong>
                </button>
                <button class="report-select-btn theme-econ" data-action="App.renderReporteEconomico">
                    <span class="btn-icon">💶</span>
                    <strong>Liq. Económica</strong>
                </button>
                <button class="report-select-btn theme-zona" data-action="App.renderMenuZonasReport">
                    <span class="btn-icon">🌲</span>
                    <strong>Prod. Zona</strong>
                </button>
                <button class="report-select-btn theme-calidad" data-action="App.renderMenuCalidadesReport">
                    <span class="btn-icon">⭐</span>
                    <strong>Liq. Calidad</strong>
                </button>
                <button class="report-select-btn theme-graficos" data-action="App.renderGraficos">
                    <span class="btn-icon">📈</span>
                    <strong>Panel Gráficos</strong>
                </button>
            </div>
            <hr style="border:0; border-top:1px solid var(--border); margin:25px 0;">
            <div id="cont-rep"></div>`;
        await App.renderReporteGlobal();
    },

    async renderReporteGlobal() {
        const r = await Reportes.generarReporteGlobalCampaña(), finca = await Fincas.getActive(); if (!r || !finca) return;
        const comp = finca.comprador || {};
        let h = `<div class="reporte-container"><div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:25px;"><h2 style="margin:0; color:var(--p-cork); font-weight:800;">🌍 Balance de Campaña</h2><div style="display:flex; gap:10px;"><button class="btn btn-outline" style="height:40px; padding:0 15px; font-size:0.85rem; border-radius:10px;" data-action="Export.exportarPDF" data-tipo="global">📄 PDF</button><button class="btn btn-outline" style="height:40px; padding:0 15px; font-size:0.85rem; border-radius:10px;" data-action="Export.exportGlobalToExcel">📊 Excel</button></div></div>${App._getDualHeaderHtml(finca.nombre, finca.propietario||'-', finca.cif||'-', comp.nombreEmpresa||'Sin Empresa', comp.cifNif||'-', comp.representante||'-')}<div class="card"><h4>Resumen por Calidad</h4><div class="table-responsive"><table class="reporte-table"><thead><tr><th>Calidad</th><th style="text-align:right;">Quintales</th><th style="text-align:right;">Sacas</th></tr></thead><tbody><tr><td><span class="q-pill p1">⭐ 1ª Calidad</span></td><td style="text-align:right; font-weight:700;">${r.totalesGlobales.primera.quintales.toFixed(2)}</td><td style="text-align:right;">${r.totalesGlobales.primera.sacas}</td></tr><tr><td><span class="q-pill pb">🟡 Bornizo</span></td><td style="text-align:right; font-weight:700;">${r.totalesGlobales.bornizo.quintales.toFixed(2)}</td><td style="text-align:right;">${r.totalesGlobales.bornizo.sacas}</td></tr><tr><td><span class="q-pill pr">🔴 Refugo</span></td><td style="text-align:right; font-weight:700;">${r.totalesGlobales.refugo.quintales.toFixed(2)}</td><td style="text-align:right;">${r.totalesGlobales.refugo.sacas}</td></tr></tbody><tfoot><tr><td><strong>TOTAL GENERAL</strong></td><td style="text-align:right; color:var(--p-cork); font-size:1rem;"><strong>${(r.totalesGlobales.primera.quintales + r.totalesGlobales.bornizo.quintales + r.totalesGlobales.refugo.quintales).toFixed(2)} Q</strong></td><td style="text-align:right;"><strong>${r.totalesGlobales.primera.sacas + r.totalesGlobales.bornizo.sacas + r.totalesGlobales.refugo.sacas}</strong></td></tr></tfoot></table></div></div><div class="card"><h4>Desglose por Zona (kg)</h4><div class="table-responsive"><table class="reporte-table"><thead><tr><th>Zona</th><th style="text-align:right;">1ª</th><th style="text-align:right;">Bo</th><th style="text-align:right;">Re</th></tr></thead><tbody>${Object.values(r.reportePorZona).map(z => `<tr><td><strong>${App.escapeHtml(z.nombre)}</strong></td><td style="text-align:right;">${Math.round(z.totales.primera.kg)}</td><td style="text-align:right;">${Math.round(z.totales.bornizo.kg)}</td><td style="text-align:right;">${Math.round(z.totales.refugo.kg)}</td></tr>`).join('')}</tbody></table></div></div></div>`;
        document.getElementById('cont-rep').innerHTML = h;
    },

    async renderReporteEconomico() {
        const r = await Reportes.generarReporteEconomicoGlobal(), finca = await Fincas.getActive(); if (!r || !finca) return;
        const totalGastos = await Gastos.getTotal(), beneficioNeto = r.valorTotal - totalGastos, comp = finca.comprador || {};
        const listaGastos = await Gastos.list();
        
        let gastosHtml = '';
        if (listaGastos.length > 0) {
            gastosHtml = `<div class="card" style="margin-top:20px;">
                <h4>Desglose de Gastos Campaña</h4>
                <div class="table-responsive">
                    <table class="reporte-table">
                        <thead>
                            <tr>
                                <th>Fecha</th>
                                <th>Naturaleza</th>
                                <th>Concepto</th>
                                <th style="text-align:right;">Importe</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${listaGastos.map(g => `<tr>
                                <td>${new Date(g.fecha).toLocaleDateString()}</td>
                                <td>${Utils.escapeHtml(g.categoria || 'Otros')}</td>
                                <td>${Utils.escapeHtml(g.concepto || '-')}</td>
                                <td style="text-align:right; font-weight:700; color:#ff4d4d;">${parseFloat(g.monto).toFixed(2)}€</td>
                            </tr>`).join('')}
                        </tbody>
                        <tfoot>
                            <tr>
                                <td colspan="3"><strong>TOTAL GASTOS</strong></td>
                                <td style="text-align:right; color:#ff4d4d;"><strong>${totalGastos.toFixed(2)}€</strong></td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>`;
        }

        let h = `<div class="reporte-container"><div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:25px;"><h2 style="margin:0; color:var(--p-cork); font-weight:800;">💶 Liquidación Final</h2><div style="display:flex; gap:10px;"><button class="btn btn-outline" style="height:40px; padding:0 15px; border-radius:10px;" data-action="Export.exportarPDF" data-tipo="economico">📄 PDF</button><button class="btn btn-outline" style="height:40px; padding:0 15px; border-radius:10px;" data-action="Export.exportEconomicoToExcel">📊 Excel</button></div></div>${App._getDualHeaderHtml(finca.nombre, finca.propietario||'-', finca.cif||'-', comp.nombreEmpresa||'Sin Empresa', comp.cifNif||'-', comp.representante||'-')}<div class="card"><h4>Ingresos por Calidad</h4><div class="table-responsive"><table class="reporte-table"><thead><tr><th>Calidad</th><th>Precio</th><th>Q.Bruto</th><th style="color:#ff9800;">Oreo</th><th>Q.Neto</th><th style="text-align:right;">Total</th></tr></thead><tbody><tr><td><span class="q-pill p1">⭐ 1ª</span></td><td>${(r.precios.primera?.precioQuintal || 0).toFixed(2)}€</td><td>${r.totales.primera.bruto.toFixed(2)}</td><td style="color:#ff9800;">${r.totales.primera.merma.toFixed(2)}</td><td>${r.totales.primera.neto.toFixed(2)}</td><td style="text-align:right; font-weight:800;">${r.totales.primera.valor.toFixed(2)}€</td></tr><tr><td><span class="q-pill pb">🟡 Bo</span></td><td>${(r.precios.bornizo?.precioQuintal || 0).toFixed(2)}€</td><td>${r.totales.bornizo.bruto.toFixed(2)}</td><td style="color:#ff9800;">${r.totales.bornizo.merma.toFixed(2)}</td><td>${r.totales.bornizo.neto.toFixed(2)}</td><td style="text-align:right; font-weight:800;">${r.totales.bornizo.valor.toFixed(2)}€</td></tr><tr><td><span class="q-pill pr">🔴 Re</span></td><td>${(r.precios.refugo?.precioQuintal || 0).toFixed(2)}€</td><td>${r.totales.refugo.bruto.toFixed(2)}</td><td style="color:#ff9800;">${r.totales.refugo.merma.toFixed(2)}</td><td>${r.totales.refugo.neto.toFixed(2)}</td><td style="text-align:right; font-weight:800;">${r.totales.refugo.valor.toFixed(2)}€</td></tr></tbody><tfoot><tr><td colspan="2">SUBTOTALES INGRESOS</td><td>${r.brutoTotal.toFixed(2)}</td><td style="color:#ff9800;">${(r.brutoTotal - r.netoTotal).toFixed(2)}</td><td>${r.netoTotal.toFixed(2)}</td><td style="text-align:right; color:var(--p-cork); font-size:1rem;">${r.valorTotal.toFixed(2)}€</td></tr></tfoot></table></div></div>${gastosHtml}<div class="card-finance" style="background: linear-gradient(135deg, #1a1a1a 0%, #000 100%); border: 1px solid var(--border); padding:25px; margin-top:20px;"><div style="display:flex; justify-content:space-between; margin-bottom:10px;"><span class="text-muted">Ingresos Brutos</span><span>${r.valorTotal.toFixed(2)}€</span></div><div style="display:flex; justify-content:space-between; margin-bottom:15px;"><span style="color:#ff4d4d;">Gastos Campaña (-)</span><span style="color:#ff4d4d;">-${totalGastos.toFixed(2)}€</span></div><hr style="opacity:0.3; margin-bottom:15px;"><div style="display:flex; justify-content:space-between; align-items:center;"><span style="color:var(--accent); font-weight:900; font-size:1.1rem;">BENEFICIO NETO REAL</span><span class="total-neto" style="color:var(--accent); font-size:1.8rem; font-weight:900;">${beneficioNeto.toFixed(2)}€</span></div></div></div>`;
        document.getElementById('cont-rep').innerHTML = h;
    },

    async renderMenuZonasReport() {
        const zonas = await Zonas.list();
        let h = `<div class="card"><h3>🌲 Selección de Zona</h3><select id="sel-zona-rep" style="height:50px; margin-bottom:15px; background:var(--surface); color:white; width:100%; padding:0 15px; border-radius:12px; border:1px solid var(--border);">${zonas.map(z => `<option value="${z.id}">${App.escapeHtml(z.nombre)}</option>`).join('')}</select><button class="btn btn-primary" data-action="App.renderReportePorZona">Generar Informe de Zona</button></div>`;
        document.getElementById('cont-rep').innerHTML = h;
    },

    async renderReportePorZona(zonaId) {
        const r = await Reportes.generarReportePorZona(zonaId), finca = await Fincas.getActive(); if (!r || !finca) return;
        let h = `<div class="reporte-container"><div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:25px;"><h2 style="margin:0; color:var(--p-cork); font-weight:800;">🌲 Informe: ${App.escapeHtml(r.zona.nombre)}</h2><button class="btn btn-outline" style="height:40px; padding:0 15px; border-radius:10px;" data-action="Export.exportarPDF" data-tipo="zona">📄 PDF</button></div>${App._getDualHeaderHtml(finca.nombre, 'Explotación Activa', finca.cif||'-', 'ZONA DE SACA', `Pol.${r.zona.poligono} / Par.${r.zona.parcela}`, r.zona.municipio||'-')}<div class="card"><h4>Historial de Sacas</h4><div class="table-responsive"><table class="reporte-table"><thead><tr><th>Fecha</th><th>Saca</th><th style="text-align:right;">Peso (kg)</th><th>Cal</th></tr></thead><tbody>${r.pesadas.map(p => { let em = p.pesadasPorCalidad.primera.kg > 0 ? '⭐' : p.pesadasPorCalidad.bornizo.kg > 0 ? '🟡' : '🔴'; return `<tr><td>${new Date(p.fecha).toLocaleDateString()}</td><td>#${p.saca}</td><td style="text-align:right;"><strong>${p.kg.toFixed(1)}</strong></td><td>${em}</td></tr>`; }).join('')}</tbody></table></div></div><div class="card-finance" style="background:var(--surface-light); padding:20px;"><div style="display:flex; justify-content:space-around; text-align:center;"><div><div class="stat-value">${r.totales.primera.quintales.toFixed(2)}</div><div class="stat-label">1ª (Q)</div></div><div><div class="stat-value">${r.totales.bornizo.quintales.toFixed(2)}</div><div class="stat-label">Bo (Q)</div></div><div><div class="stat-value">${r.totales.refugo.quintales.toFixed(2)}</div><div class="stat-label">Re (Q)</div></div></div></div></div>`;
        document.getElementById('cont-rep').innerHTML = h;
    },

    async renderMenuCalidadesReport() {
        let h = `<div class="card"><h3>⭐ Selección de Calidad</h3><div class="reportes-selector-grid" style="margin-top:15px;"><button class="report-select-btn theme-calidad" data-action="App.renderReporteEconomicoPorCalidad" data-calidad="primera"><span class="btn-icon">⭐</span><strong>1ª Calidad</strong></button><button class="report-select-btn theme-econ" data-action="App.renderReporteEconomicoPorCalidad" data-calidad="bornizo"><span class="btn-icon">🟡</span><strong>Bornizo</strong></button><button class="report-select-btn theme-graficos" data-action="App.renderReporteEconomicoPorCalidad" data-calidad="refugo"><span class="btn-icon">🔴</span><strong>Refugo</strong></button></div></div>`;
        document.getElementById('cont-rep').innerHTML = h;
    },

    async renderReporteEconomicoPorCalidad(calidad) {
        const r = await Reportes.generarReporteEconomicoPorCalidad(calidad), finca = await Fincas.getActive(); if (!r || !finca) return;
        const totalG = await Gastos.getTotal(), repG = await Reportes.generarReporteEconomicoGlobal(), bNetoT = repG.valorTotal - totalG, comp = finca.comprador || {};
        let h = `<div class="reporte-container"><div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:25px;"><h2 style="margin:0; color:var(--p-cork); font-weight:800;">⭐ Liq. ${r.nombreCalidad}</h2><button class="btn btn-outline" style="height:40px; padding:0 15px; border-radius:10px;" data-action="Export.exportarPDF" data-tipo="calidad">📄 PDF</button></div>${App._getDualHeaderHtml(finca.nombre, finca.propietario||'-', finca.cif||'-', comp.nombreEmpresa||'-', comp.cifNif||'-', comp.representante||'-')}<div class="card-finance" style="background:var(--surface-light); padding:20px;"><small class="text-muted">BENEFICIO NETO CAMP. (GLOBAL)</small><br><strong style="color:var(--accent); font-size:1.4rem;">${bNetoT.toFixed(2)}€</strong></div><div class="card"><div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;"><h4>Detalle por Zonas</h4><small class="text-muted">Precio: ${r.precioQuintal}€/Q</small></div><div class="table-responsive"><table class="reporte-table"><thead><tr><th>Zona</th><th>Sacas</th><th>Q.Neto</th><th style="text-align:right;">Valor</th></tr></thead><tbody>${Object.values(r.reportePorZona).filter(z => z.sacas > 0).map(z => `<tr><td><strong>${App.escapeHtml(z.nombre)}</strong></td><td>${z.sacas}</td><td><strong>${z.neto.toFixed(2)}</strong></td><td style="text-align:right; font-weight:700;">${z.valor.toFixed(2)}€</td></tr>`).join('')}</tbody><tfoot><tr><td>TOTAL</td><td>${r.totales.sacas}</td><td>${r.totales.neto.toFixed(2)}</td><td style="text-align:right; color:var(--p-cork);"><strong>${r.totales.valor.toFixed(2)}€</strong></td></tr></tfoot></table></div></div></div>`;
        document.getElementById('cont-rep').innerHTML = h;
    },

    async renderGraficos() {
        const cont = document.getElementById('cont-rep');
        cont.innerHTML = `<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:25px;"><h2 style="margin:0; color:var(--accent); font-weight:800;">📈 Panel de Gráficos</h2><button class="btn btn-outline" style="height:40px; padding:0 15px; border-radius:10px;" data-action="Export.exportarPDF" data-tipo="graficos">📄 PDF</button></div><div class="graficos-grid"><div class="card"><h4>Evolución 30 días</h4><div style="position:relative; height:220px;"><canvas id="chart-trend"></canvas></div></div><div class="card"><h4>Distribución Calidad</h4><div style="position:relative; height:220px;"><canvas id="chart-quality"></canvas></div></div><div class="card"><h4>Producción por Zona</h4><div style="position:relative; height:220px;"><canvas id="chart-zones"></canvas></div></div><div class="card"><h4>Valor Económico</h4><div style="position:relative; height:220px;"><canvas id="chart-economic"></canvas></div></div></div>`;
        setTimeout(async () => { await Charts.renderTrendChart('chart-trend'); await Charts.renderQualityChart('chart-quality'); await Charts.renderZonesChart('chart-zones'); await Charts.renderEconomicChart('chart-economic'); }, 100);
    }
};
