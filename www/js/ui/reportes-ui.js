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
<div class="bento-grid" style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin-bottom: 25px;">
<div class="card card-interactive" style="margin-bottom: 0; padding: 15px; text-align: center; cursor: pointer; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px;" data-action="App.renderReporteGlobal">
<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#CCFF00" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
<span style="color: #FFFFFF; font-weight: 700; font-size: 0.8rem;">GLOBAL</span>
</div>
<div class="card card-interactive" style="margin-bottom: 0; padding: 15px; text-align: center; cursor: pointer; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px;" data-action="App.renderReporteEconomico">
<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#CCFF00" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="6" x2="12" y2="12"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>
<span style="color: #FFFFFF; font-weight: 700; font-size: 0.8rem;">ECONÓMICA</span>
</div>
<div class="card card-interactive" style="margin-bottom: 0; padding: 15px; text-align: center; cursor: pointer; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px;" data-action="App.renderMenuZonasReport">
<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#CCFF00" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
<span style="color: #FFFFFF; font-weight: 700; font-size: 0.8rem;">PROD. ZONA</span>
</div>
<div class="card card-interactive" style="margin-bottom: 0; padding: 15px; text-align: center; cursor: pointer; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px;" data-action="App.renderMenuCalidadesReport">
<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#CCFF00" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
<span style="color: #FFFFFF; font-weight: 700; font-size: 0.8rem;">LIQ. CALIDAD</span>
</div>
<div class="card card-interactive" style="grid-column: span 2; margin-bottom: 0; padding: 15px; text-align: center; cursor: pointer; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px;" data-action="App.renderGraficos">
<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#CCFF00" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
<span style="color: #FFFFFF; font-weight: 700; font-size: 0.8rem;">PANEL GRÁFICOS</span>
</div>
</div>
<hr style="border:0; border-top:1px solid var(--border); margin:10px 0 25px 0;">
<div id="cont-rep"></div>`;
await App.renderReporteGlobal();
},

async renderReporteGlobal() {
const r = await Reportes.generarReporteGlobalCampaña(), finca = await Fincas.getActive(); if (!r || !finca) return;
const comp = finca.comprador || {};
let h = `<div class="reporte-container"><div style="display:flex; flex-wrap:wrap; gap:10px; justify-content:space-between; align-items:center; margin-bottom:25px;"><h2 style="margin:0; color:var(--p-cork); font-weight:800;">Balance de Campaña</h2><div style="display:flex; gap:10px;"><button class="btn btn-outline" style="height:40px; padding:0 15px; font-size:0.85rem; border-radius:10px; width:auto; flex:0 0 auto; white-space:nowrap;" data-action="Export.exportarPDF" data-tipo="global"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle; margin-right:4px;"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg> PDF</button><button class="btn btn-outline" style="height:40px; padding:0 15px; font-size:0.85rem; border-radius:10px; width:auto; flex:0 0 auto; white-space:nowrap;" data-action="Export.exportGlobalToExcel"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle; margin-right:4px;"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg> Excel</button></div></div>${App._getDualHeaderHtml(finca.nombre, finca.propietario||'-', finca.cif||'-', comp.nombreEmpresa||'Sin Empresa', comp.cifNif||'-', comp.representante||'-')}<div class="card"><h4>Resumen por Calidad</h4><div class="tabla-apilada" tabindex="0" role="region" aria-label="Resumen por Calidad"><table><caption>Resumen por Calidad</caption><thead><tr><th scope="col">Calidad</th><th scope="col" class="text-right">Quintales</th><th scope="col" class="text-right">Sacas</th></tr></thead><tbody><tr><th scope="row"><span class="bg-pill-lime text-lime" style="padding:4px 8px; border-radius:6px; font-weight:700;">1ª Calidad</span></th><td data-label="Quintales" style="font-weight:700;">${r.totalesGlobales.primera.quintales.toFixed(2)}</td><td data-label="Sacas" class="text-blue" style="font-weight:700;">${r.totalesGlobales.primera.sacas}</td></tr><tr><th scope="row"><span class="bg-pill-gold text-gold" style="padding:4px 8px; border-radius:6px; font-weight:700;">Bornizo</span></th><td data-label="Quintales" style="font-weight:700;">${r.totalesGlobales.bornizo.quintales.toFixed(2)}</td><td data-label="Sacas" class="text-blue" style="font-weight:700;">${r.totalesGlobales.bornizo.sacas}</td></tr><tr><th scope="row"><span class="bg-pill-red text-red" style="padding:4px 8px; border-radius:6px; font-weight:700;">Refugo</span></th><td data-label="Quintales" style="font-weight:700;">${r.totalesGlobales.refugo.quintales.toFixed(2)}</td><td data-label="Sacas" class="text-blue" style="font-weight:700;">${r.totalesGlobales.refugo.sacas}</td></tr></tbody><tfoot><tr><th scope="row" class="text-grey"><strong>TOTAL GENERAL</strong></th><td data-label="Quintales" class="text-lime text-right" style="font-size:1rem;"><strong>${(r.totalesGlobales.primera.quintales + r.totalesGlobales.bornizo.quintales + r.totalesGlobales.refugo.quintales).toFixed(2)} Q</strong></td><td data-label="Sacas" class="text-blue text-right" style="font-size:1rem;"><strong>${r.totalesGlobales.primera.sacas + r.totalesGlobales.bornizo.sacas + r.totalesGlobales.refugo.sacas}</strong></td></tr></tfoot></table></div></div><div class="card"><h4>Desglose por Zona (kg)</h4><div class="tabla-apilada" tabindex="0" role="region" aria-label="Desglose por Zona"><table><caption>Desglose por Zona (kg)</caption><thead><tr><th scope="col">Zona</th><th scope="col" class="text-lime text-right">1ª</th><th scope="col" class="text-gold text-right">Bo</th><th scope="col" class="text-red text-right">Re</th></tr></thead><tbody>${Object.values(r.reportePorZona).map(z => `<tr><th scope="row"><strong class="text-grey">${App.escapeHtml(z.nombre)}</strong></th><td data-label="1ª" class="text-lime text-right;">${Math.round(z.totales.primera.kg)}</td><td data-label="Bo" class="text-gold text-right;">${Math.round(z.totales.bornizo.kg)}</td><td data-label="Re" class="text-red text-right;">${Math.round(z.totales.refugo.kg)}</td></tr>`).join('')}</tbody></table></div></div></div>`;
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
<div class="tabla-apilada" tabindex="0" role="region" aria-label="Desglose de Gastos Campaña">
<table>
<caption>Desglose de Gastos Campaña</caption>
<thead>
<tr>
<th scope="col">Fecha</th>
<th scope="col">Naturaleza</th>
<th scope="col">Concepto</th>
<th scope="col" class="text-red text-right">Importe</th>
</tr>
</thead>
<tbody>
${listaGastos.map(g => `<tr>
<th scope="row">${new Date(g.fecha).toLocaleDateString()}</th>
<td data-label="Naturaleza">${Utils.escapeHtml(g.categoria || 'Otros')}</td>
<td data-label="Concepto" class="text-grey">${Utils.escapeHtml(g.concepto || '-')}</td>
<td data-label="Importe" class="text-red text-right" style="font-weight:700;">${parseFloat(g.monto).toFixed(2)}€</td>
</tr>`).join('')}
</tbody>
<tfoot>
<tr>
<th scope="row" colspan="3" class="text-grey"><strong>TOTAL GASTOS</strong></th>
<td data-label="Importe" class="text-red text-right"><strong>${totalGastos.toFixed(2)}€</strong></td>
</tr>
</tfoot>
</table>
</div>
</div>`;
}

let h = `<div class="reporte-container"><div style="display:flex; flex-wrap:wrap; gap:10px; justify-content:space-between; align-items:center; margin-bottom:25px;"><h2 style="margin:0; color:var(--p-cork); font-weight:800;">Liquidación Final</h2><div style="display:flex; gap:10px;"><button class="btn btn-outline" style="height:40px; padding:0 18px; border-radius:10px;" data-action="Export.exportarPDF" data-tipo="economico"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle; margin-right:4px;"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg> PDF</button><button class="btn btn-outline" style="height:40px; padding:0 18px; border-radius:10px;" data-action="Export.exportEconomicoToExcel"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle; margin-right:4px;"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg> Excel</button></div></div>${App._getDualHeaderHtml(finca.nombre, finca.propietario||'-', finca.cif||'-', comp.nombreEmpresa||'Sin Empresa', comp.cifNif||'-', comp.representante||'-')}<div class="card"><h4>Ingresos por Calidad</h4><div class="tabla-apilada" tabindex="0" role="region" aria-label="Ingresos por Calidad"><table><caption>Ingresos por Calidad</caption><thead><tr><th scope="col">Calidad</th><th scope="col">Precio</th><th scope="col">Q.Bruto</th><th scope="col" class="text-orange">Oreo</th><th scope="col">Q.Neto</th><th scope="col" class="text-lime text-right">Total</th></tr></thead><tbody><tr><th scope="row"><span class="bg-pill-lime text-lime" style="padding:4px 8px; border-radius:6px; font-weight:700;">1ª</span></th><td data-label="Precio" class="text-grey">${(r.precios.primera?.precioQuintal || 0).toFixed(2)}€</td><td data-label="Q.Bruto">${r.totales.primera.bruto.toFixed(2)}</td><td data-label="Oreo" class="text-orange">${r.totales.primera.merma.toFixed(2)}</td><td data-label="Q.Neto">${r.totales.primera.neto.toFixed(2)}</td><td data-label="Total" class="text-lime text-right" style="font-weight:800;">${r.totales.primera.valor.toFixed(2)}€</td></tr><tr><th scope="row"><span class="bg-pill-gold text-gold" style="padding:4px 8px; border-radius:6px; font-weight:700;">Bornizo</span></th><td data-label="Precio" class="text-grey">${(r.precios.bornizo?.precioQuintal || 0).toFixed(2)}€</td><td data-label="Q.Bruto">${r.totales.bornizo.bruto.toFixed(2)}</td><td data-label="Oreo" class="text-orange">${r.totales.bornizo.merma.toFixed(2)}</td><td data-label="Q.Neto">${r.totales.bornizo.neto.toFixed(2)}</td><td data-label="Total" class="text-lime text-right" style="font-weight:800;">${r.totales.bornizo.valor.toFixed(2)}€</td></tr><tr><th scope="row"><span class="bg-pill-red text-red" style="padding:4px 8px; border-radius:6px; font-weight:700;">Refugo</span></th><td data-label="Precio" class="text-grey">${(r.precios.refugo?.precioQuintal || 0).toFixed(2)}€</td><td data-label="Q.Bruto">${r.totales.refugo.bruto.toFixed(2)}</td><td data-label="Oreo" class="text-orange">${r.totales.refugo.merma.toFixed(2)}</td><td data-label="Q.Neto">${r.totales.refugo.neto.toFixed(2)}</td><td data-label="Total" class="text-lime text-right" style="font-weight:800;">${r.totales.refugo.valor.toFixed(2)}€</td></tr></tbody><tfoot><tr><th scope="row" colspan="2" class="text-grey">SUBTOTALES INGRESOS</th><td data-label="Q.Bruto">${r.brutoTotal.toFixed(2)}</td><td data-label="Oreo" class="text-orange">${(r.brutoTotal - r.netoTotal).toFixed(2)}</td><td data-label="Q.Neto">${r.netoTotal.toFixed(2)}</td><td data-label="Total" class="text-lime text-right" style="font-size:1rem;">${r.valorTotal.toFixed(2)}€</td></tr></tfoot></table></div></div>${gastosHtml}<div class="card-finance" style="background: var(--surface); border: 1px solid var(--border); padding:25px; margin-top:20px;"><div style="display:flex; justify-content:space-between; margin-bottom:10px;"><span class="text-grey">Ingresos Brutos</span><span class="text-lime">${r.valorTotal.toFixed(2)}€</span></div><div style="display:flex; justify-content:space-between; margin-bottom:15px;"><span class="text-red">Gastos Campaña (-)</span><span class="text-red">-${totalGastos.toFixed(2)}€</span></div><hr style="opacity:0.3; margin-bottom:15px;"><div style="display:flex; justify-content:space-between; align-items:center;"><span class="text-grey" style="font-weight:900; font-size:1.1rem;">BENEFICIO NETO REAL</span><span class="total-neto text-lime" style="font-size:1.8rem; font-weight:900;">${beneficioNeto.toFixed(2)}€</span></div></div></div>`;
document.getElementById('cont-rep').innerHTML = h;
},

async renderMenuZonasReport() {
const zonas = await Zonas.list();
let h = `<div class="card"><h3>Selección de Zona</h3><select id="sel-zona-rep" style="height:50px; margin-bottom:15px; background:var(--surface); color:white; width:100%; padding:0 15px; border-radius:12px; border:1px solid var(--border);">${zonas.map(z => `<option value="${z.id}">${App.escapeHtml(z.nombre)}</option>`).join('')}</select><button class="btn btn-primary" data-action="App.renderReportePorZona">Generar Informe de Zona</button></div>`;
document.getElementById('cont-rep').innerHTML = h;
},

async renderReportePorZona(zonaId) {
const r = await Reportes.generarReportePorZona(zonaId), finca = await Fincas.getActive(); if (!r || !finca) return;
let h = `<div class="reporte-container"><div style="display:flex; flex-wrap:wrap; gap:10px; justify-content:space-between; align-items:center; margin-bottom:25px;"><h2 style="margin:0; color:var(--p-cork); font-weight:800;">Informe: ${App.escapeHtml(r.zona.nombre)}</h2><button class="btn btn-outline" style="height:40px; padding:0 18px; border-radius:10px;" data-action="Export.exportarPDF" data-tipo="zona"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle; margin-right:4px;"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg> PDF</button></div>${App._getDualHeaderHtml(finca.nombre, 'Explotación Activa', finca.cif||'-', 'ZONA DE SACA', `Pol.${r.zona.poligono} / Par.${r.zona.parcela}`, r.zona.municipio||'-')}<div class="card"><h4>Historial de Sacas</h4><div class="tabla-apilada" tabindex="0" role="region" aria-label="Historial de Sacas"><table><caption>Historial de Sacas</caption><thead><tr><th scope="col">Fecha</th><th scope="col">Saca</th><th scope="col">Peso (kg)</th><th scope="col">Cal</th></tr></thead><tbody>${r.pesadas.map(p => { const cal = p.pesadasPorCalidad; let calLabel; if (cal.primera.kg > 0) calLabel = '1ª Cal'; else if (cal.bornizo.kg > 0) calLabel = 'Bornizo'; else calLabel = 'Refugo'; return `<tr><th scope="row">${new Date(p.fecha).toLocaleDateString()}</th><td data-label="Saca">#${p.saca}</td><td data-label="Peso (kg)"><strong>${p.kg.toFixed(1)}</strong></td><td data-label="Cal">${calLabel}</td></tr>`; }).join('')}</tbody></table></div></div><div class="card-finance" style="background:var(--surface-light); padding:20px;"><div style="display:flex; justify-content:space-around; text-align:center;"><div><div class="stat-value">${r.totales.primera.quintales.toFixed(2)}</div><div class="stat-label">1ª (Q)</div></div><div><div class="stat-value">${r.totales.bornizo.quintales.toFixed(2)}</div><div class="stat-label">Bo (Q)</div></div><div><div class="stat-value">${r.totales.refugo.quintales.toFixed(2)}</div><div class="stat-label">Re (Q)</div></div></div></div></div>`;
document.getElementById('cont-rep').innerHTML = h;
},

async renderMenuCalidadesReport() {
let h = `<div class="card"><h3>Selección de Calidad</h3>
<div class="bento-grid" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-top: 15px;">
<div class="card card-interactive" style="margin-bottom: 0; padding: 15px 5px; text-align: center; cursor: pointer; display: flex; flex-direction: column; align-items: center; gap: 8px;" data-action="App.renderReporteEconomicoPorCalidad" data-calidad="primera">
<div style="width:24px;height:24px;border-radius:50%;background:#64DD17;margin:auto;"></div>
<span style="color: #FFFFFF; font-weight: 700; font-size: 0.75rem;">1ª CALIDAD</span>
</div>
<div class="card card-interactive" style="margin-bottom: 0; padding: 15px 5px; text-align: center; cursor: pointer; display: flex; flex-direction: column; align-items: center; gap: 8px;" data-action="App.renderReporteEconomicoPorCalidad" data-calidad="bornizo">
<div style="width:24px;height:24px;border-radius:50%;background:#FFD600;margin:auto;"></div>
<span style="color: #FFFFFF; font-weight: 700; font-size: 0.75rem;">BORNIZO</span>
</div>
<div class="card card-interactive" style="margin-bottom: 0; padding: 15px 5px; text-align: center; cursor: pointer; display: flex; flex-direction: column; align-items: center; gap: 8px;" data-action="App.renderReporteEconomicoPorCalidad" data-calidad="refugo">
<div style="width:24px;height:24px;border-radius:50%;background:#FF5252;margin:auto;"></div>
<span style="color: #FFFFFF; font-weight: 700; font-size: 0.75rem;">REFUGO</span>
</div>
</div>
</div>`;
document.getElementById('cont-rep').innerHTML = h;
},

async renderReporteEconomicoPorCalidad(calidad) {
const r = await Reportes.generarReporteEconomicoPorCalidad(calidad), finca = await Fincas.getActive(); if (!r || !finca) return;
const totalG = await Gastos.getTotal(), repG = await Reportes.generarReporteEconomicoGlobal(), bNetoT = repG.valorTotal - totalG, comp = finca.comprador || {};
let h = `<div class="reporte-container"><div style="display:flex; flex-wrap:wrap; gap:10px; justify-content:space-between; align-items:center; margin-bottom:25px;"><h2 style="margin:0; color:var(--p-cork); font-weight:800;">Liquidación ${r.nombreCalidad}</h2><button class="btn btn-outline" style="height:40px; padding:0 18px; border-radius:10px;" data-action="Export.exportarPDF" data-tipo="calidad"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle; margin-right:4px;"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg> PDF</button></div>${App._getDualHeaderHtml(finca.nombre, finca.propietario||'-', finca.cif||'-', comp.nombreEmpresa||'-', comp.cifNif||'-', comp.representante||'-')}<div class="card-finance" style="background:var(--surface-light); padding:20px;"><small class="text-muted">BENEFICIO NETO CAMP. (GLOBAL)</small><br><strong style="color:var(--p-cork); font-size:1.4rem;">${bNetoT.toFixed(2)}€</strong></div><div class="card"><div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;"><h4>Detalle por Zonas</h4><small class="text-muted">Precio: ${r.precioQuintal}€/Q</small></div><div class="tabla-apilada" tabindex="0" role="region" aria-label="Detalle por Zonas"><table><caption>Detalle por Zonas</caption><thead><tr><th scope="col">Zona</th><th scope="col">Sacas</th><th scope="col">Q.Neto</th><th scope="col">Valor</th></tr></thead><tbody>${Object.values(r.reportePorZona).filter(z => z.sacas > 0).map(z => `<tr><th scope="row"><strong>${App.escapeHtml(z.nombre)}</strong></th><td data-label="Sacas">${z.sacas}</td><td data-label="Q.Neto"><strong>${z.neto.toFixed(2)}</strong></td><td data-label="Valor" style="font-weight:700;">${z.valor.toFixed(2)}€</td></tr>`).join('')}</tbody><tfoot><tr><th scope="row">TOTAL</th><td data-label="Sacas">${r.totales.sacas}</td><td data-label="Q.Neto">${r.totales.neto.toFixed(2)}</td><td data-label="Valor" class="text-lime text-right"><strong>${r.totales.valor.toFixed(2)}€</strong></td></tr></tfoot></table></div></div></div>`;
document.getElementById('cont-rep').innerHTML = h;
},

async renderGraficos() {
const cont = document.getElementById('cont-rep');
cont.innerHTML = `<div style="display:flex; flex-wrap:wrap; gap:10px; justify-content:space-between; align-items:center; margin-bottom:25px;"><h2 style="margin:0; color:var(--p-cork); font-weight:800;">Panel de Gráficos</h2><button class="btn btn-outline" style="height:40px; padding:0 18px; border-radius:10px;" data-action="Export.exportarPDF" data-tipo="graficos"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle; margin-right:4px;"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg> PDF</button></div><div class="graficos-grid"><div class="card"><h4>Evolución 30 días</h4><div style="position:relative; height:220px;"><canvas id="chart-trend"></canvas></div></div><div class="card"><h4>Distribución Calidad</h4><div style="position:relative; height:220px;"><canvas id="chart-quality"></canvas></div></div><div class="card"><h4>Producción por Zona</h4><div style="position:relative; height:220px;"><canvas id="chart-zones"></canvas></div></div><div class="card"><h4>Valor Económico</h4><div style="position:relative; height:220px;"><canvas id="chart-economic"></canvas></div></div></div>`;
setTimeout(async () => { await Charts.renderTrendChart('chart-trend'); await Charts.renderQualityChart('chart-quality'); await Charts.renderZonesChart('chart-zones'); await Charts.renderEconomicChart('chart-economic'); }, 100);
}
};
