import { Fincas } from '../fincas.js';
import { Pesadas } from '../pesadas.js';
import { Zonas } from '../zonas.js';
import { App } from '../app.js';
import { Utils } from '../core/utils.js';

export const PesadasUI = {
    _todas: [],
    _page: 1,
    _perPage: 20,
    _zonas: [],

    async renderFormPesada(id = null) {
        const isEdit = id != null;
        let p = { bruto: '', tara: '', calidad: 'primera', saca: '', kg: 0, quintales: 0, observacion: '', fotoUrl: null };
        let finca = await Fincas.getActive();
        let comps = finca ? finca.compradores || [] : [];
        let curComp = null, curZona = null;
        if (isEdit) {
            p = await Pesadas.get(parseInt(id));
            if (!p) { App.toastError("No se encontró la pesada"); return App.route(); }
            if (p.pesadasPorCalidad) {
                if (p.pesadasPorCalidad.primera.kg > 0) p.calidad = 'primera';
                else if (p.pesadasPorCalidad.bornizo.kg > 0) p.calidad = 'bornizo';
                else if (p.pesadasPorCalidad.refugo.kg > 0) p.calidad = 'refugo';
            } else p.calidad = 'primera';
            curComp = p.compradorId;
            curZona = p.zonaId;
        } else {
            p.saca = (await Pesadas.list()).length + 1;
            const config = await Fincas.getActive();
            if (config && config.comprador) curComp = config.comprador.id;
        }

        const compOpts = comps.map(c => `<option value="${c.id}" ${curComp == c.id ? 'selected' : ''}>${Utils.escapeHtml(c.nombreEmpresa)}</option>`).join('');
        const zonas = await Zonas.list();

        const main = document.getElementById('app-content');
        main.innerHTML = `
            <div class="card" style="border-top: 5px solid ${isEdit ? '#eab308' : 'var(--p-cork)'}; padding: 25px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                    <h3 style="margin: 0; color: #fff; border:none; padding:0; font-size: 1.5rem;">${isEdit ? '✏️ Editar Pesada #' + p.saca : '➕ Nueva Pesada'}</h3>
                    <button class="btn btn-outline" style="padding: 5px 15px;" data-action="back">❌ Cancelar</button>
                </div>
                <form id="form-pesada">
                    <div class="grid-2">
                        <div class="form-group">
                            <label>Comprador / Lote</label>
                            <select id="p-comprador" style="height:70px; font-size:1.3rem;">
                                ${compOpts || '<option value="">Sin comprador registrado</option>'}
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Zona / Parcela</label>
                            <select id="p-zona" style="height:70px; font-size:1.3rem;">
                                ${zonas.map(z => `<option value="${z.id}" ${curZona == z.id ? 'selected' : ''}>${Utils.escapeHtml(z.nombre)}</option>`).join('')}
                            </select>
                        </div>
                    </div>
                    
                    <div class="grid-3" style="gap:15px;">
                        <div class="form-group">
                            <label>Nº Saca</label>
                            <input type="number" id="p-saca" value="${p.saca}" required style="font-size:2rem; height:80px; text-align:center;">
                        </div>
                        <div class="form-group">
                            <label>Calidad</label>
                            <select id="p-calidad" style="font-size:1.5rem; height:80px; text-align:center;">
                                <option value="primera" ${p.calidad === 'primera' ? 'selected' : ''}>⭐ 1ª Calidad</option>
                                <option value="bornizo" ${p.calidad === 'bornizo' ? 'selected' : ''}>🟡 Bornizo</option>
                                <option value="refugo" ${p.calidad === 'refugo' ? 'selected' : ''}>🔴 Refugo</option>
                            </select>
                        </div>
                    </div>

                    <div class="peso-container card" style="background: rgba(0,0,0,0.2); padding: 25px; margin-top: 10px; margin-bottom: 25px; border: 1px solid rgba(255,255,255,0.1);">
                        <div class="grid-2">
                            <div class="form-group">
                                <label style="font-size:1.2rem;">Peso BRUTO (kg)</label>
                                <input type="number" id="p-bruto" step="0.1" value="${p.bruto}" required style="font-size: 2.5rem; height: 90px; color: var(--p-cork); font-weight:800; background:#fff; text-align:right; padding-right:20px;">
                            </div>
                            <div class="form-group">
                                <label style="font-size:1.2rem;">Tara Palet/Saca (kg)</label>
                                <input type="number" id="p-tara" step="0.1" value="${p.tara}" required style="font-size: 2.5rem; height: 90px; text-align:right; padding-right:20px;">
                            </div>
                        </div>
                        <div class="resultado-neto" style="margin-top:20px; text-align:center; padding-top:20px; border-top:1px dashed rgba(255,255,255,0.2);">
                            <span style="font-size:1.2rem; color:var(--text-s);">NETO ESTIMADO</span><br>
                            <span id="p-neto-calc" style="font-size: 3rem; font-weight: 900; color: #10b981;">0.00</span> <span id="p-neto-lbl" style="font-size:1.5rem; color:#10b981;">Quintales</span>
                            <div id="p-validation-msg" style="margin-top:10px; font-weight:bold; min-height:24px;"></div>
                        </div>
                    </div>

                    <div class="form-group">
                        <label>Notas / Observaciones</label>
                        <textarea id="p-obs" rows="2">${Utils.escapeHtml(p.observacion || '')}</textarea>
                    </div>

                    <div style="display: flex; gap: 10px; margin-top: 30px;">
                        <button type="submit" class="btn btn-primary" style="flex: 2; height: 70px; font-size: 1.3rem;">💾 GUARDAR PESADA</button>
                        ${isEdit ? `<button type="button" class="btn btn-danger" data-action="App._deletePesada" data-id="${id}">🗑️ Eliminar Pesada</button>` : ''}
                    </div>
                </form>
            </div>
        `;

        const form = document.getElementById('form-pesada');
        const bruto = document.getElementById('p-bruto');
        const tara = document.getElementById('p-tara');
        const calcNeto = () => {
            const b = parseFloat(bruto.value) || 0; 
            const t = parseFloat(tara.value) || 0;
            const config = Fincas._activeCache; 
            const factor = config ? config.factorQuintal : 46;
            const n = b - t;
            const netoEl = document.getElementById('p-neto-calc');
            const netoLbl = document.getElementById('p-neto-lbl');
            const valMsg = document.getElementById('p-validation-msg');
            
            if (b > 0 && t > b) {
                netoEl.textContent = "0.00";
                netoEl.style.color = "#ef4444";
                netoLbl.style.color = "#ef4444";
                valMsg.textContent = "⚠️ La tara es mayor que el peso bruto";
                valMsg.style.color = "#ef4444";
            } else {
                netoEl.textContent = Math.max(0, n / factor).toFixed(2);
                if (b > 1500) {
                    netoEl.style.color = "#eab308";
                    netoLbl.style.color = "#eab308";
                    valMsg.textContent = "⚠️ Peso inusualmente alto (>1500kg)";
                    valMsg.style.color = "#eab308";
                } else {
                    netoEl.style.color = "#10b981";
                    netoLbl.style.color = "#10b981";
                    valMsg.textContent = "";
                }
            }
        };
        bruto.addEventListener('input', calcNeto); 
        tara.addEventListener('input', calcNeto);
        if (isEdit) calcNeto();
        
        form.onsubmit = async (e) => {
            e.preventDefault();
            const b = parseFloat(bruto.value), t = parseFloat(tara.value);
            if (b <= t) { Utils.toastError("Bruto debe ser mayor que tara"); return; }
            
            const config = await Fincas.getActive();
            const factor = config ? config.factorQuintal : 46;
            const kg = b - t;
            const q = kg / factor;
            
            const dp = {
                saca: parseInt(document.getElementById('p-saca').value),
                bruto: b, tara: t, kg: kg, quintales: q,
                calidad: document.getElementById('p-calidad').value,
                observacion: document.getElementById('p-obs').value,
                compradorId: document.getElementById('p-comprador').value,
                zonaId: parseInt(document.getElementById('p-zona').value),
                fecha: isEdit ? p.fecha : Date.now()
            };
            
            dp.pesadasPorCalidad = { primera: {kg:0, quintales:0}, bornizo: {kg:0, quintales:0}, refugo: {kg:0, quintales:0} };
            dp.pesadasPorCalidad[dp.calidad] = { kg: kg, quintales: q };

            if (isEdit) { dp.id = parseInt(id); await Pesadas.save(dp); }
            else await Pesadas.save(dp);
            
            Utils.toast('✅ Guardada correctamente');
            App.route();
        };
    },

    async renderLista() {
        const pesadas = await Pesadas.list();
        const zonas = await Zonas.list();
        const main = document.getElementById('app-content');
        if (pesadas.length === 0) {
            main.innerHTML = `<div class="card text-center" style="padding: 40px 20px;">
                <h3 style="color:#fff;">No hay pesadas registradas</h3>
                <button class="btn btn-primary mt-2" data-route="/nueva">➕ Crear la primera pesada</button>
            </div>`;
            return;
        }

        // Initialize state
        this._todas = pesadas.sort((a,b) => b.fecha - a.fecha); // Ordenar más recientes primero
        this._zonas = zonas;
        this._page = 1;

        const t = App._calculateQualityTotals(pesadas);
        const totalQ = (t.primera.quintales + t.bornizo.quintales + t.refugo.quintales).toFixed(2);

        main.innerHTML = `<div class="card" style="border-top: 5px solid var(--p-cork); padding: 25px;">
            <h3 style="text-align:center; color: #fff; font-size: 1.4rem; margin-bottom: 20px; border:none;">Resumen Global de Pesadas</h3>
            <div class="summary-table-grid">
                <div class="summary-cell c-1a"><div class="s-lbl">1ª CAL</div><div class="s-val">${t.primera.quintales.toFixed(2)}<span style="font-size:0.5em; margin-left:2px;">Q</span></div></div>
                <div class="summary-cell c-bo"><div class="s-lbl">BORNIZO</div><div class="s-val">${t.bornizo.quintales.toFixed(2)}<span style="font-size:0.5em; margin-left:2px;">Q</span></div></div>
                <div class="summary-cell c-re"><div class="s-lbl">REFUGO</div><div class="s-val">${t.refugo.quintales.toFixed(2)}<span style="font-size:0.5em; margin-left:2px;">Q</span></div></div>
            </div>
            <div style="text-align: center; margin-top: 20px; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 15px;">
                <span style="font-size: 0.9rem; color: var(--text-s); text-transform: uppercase; font-weight:800; letter-spacing:1px;">Total Acumulado</span><br>
                <strong style="font-size: 2.2rem; color: var(--p-cork);">${totalQ} <span style="font-size:0.6em">Q</span></strong>
            </div>
        </div>
        <button class="btn btn-primary" style="margin-bottom: 25px; height: 60px; font-size: 1.1rem; box-shadow: 0 8px 20px rgba(212, 163, 115, 0.4);" data-route="/nueva">➕ NUEVA PESADA</button>
        <div class="card" style="border-top: 5px solid var(--accent); text-align: center; padding: 25px;">
            <h3 style="font-size: 1.5rem; margin-bottom: 15px; color: #fff; border:none;">Listado de Pesadas</h3>
            <button class="btn btn-secondary mt-1" data-action="Export.exportarPDF" data-tipo="lista">📄 Exportar a PDF</button>
        </div>
        <div class="lista-detallada" id="lista-pesadas-container">
            ${this._renderPesadasHTML(pesadas.slice(0, this._perPage), zonas)}
        </div>
        ${pesadas.length > this._perPage ? `<div id="load-more-container" style="text-align:center; padding:20px;"><button class="btn btn-outline" data-action="App.loadMorePesadas">Cargar más (${pesadas.length - this._perPage} restantes)</button></div>` : ''}`;
    },

    _renderPesadasHTML(pesadas, zonas) {
        return pesadas.map(p => { 
            const z = zonas.find(z => z.id == p.zonaId); 
            let em = '⭐', cal = '1ª Calidad', col = '#10b981'; 
            if (p.pesadasPorCalidad.bornizo.kg > 0) { em = '🟡'; cal = 'Bornizo'; col = '#eab308'; } 
            else if (p.pesadasPorCalidad.refugo.kg > 0) { em = '🔴'; cal = 'Refugo'; col = '#ef4444'; } 
            const fH = new Date(p.fecha).toLocaleString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }); 
            return `<div class="pesada-card" style="--card-color: ${col};" data-route="/pesada/${p.id}/editar">
                <div class="pesada-card-content">
                    <div style="margin-bottom: 12px; display: flex; justify-content: space-between; align-items: center;">
                        <div class="pesada-saca-badge">SACA #${p.saca}</div>
                        <strong style="color: ${col}; font-size: 1.3rem;">${em} ${cal}</strong>
                    </div>
                    <div style="font-size: 1.1rem; margin-bottom: 12px; color: #fff;">
                        <strong>🌲 ${Utils.escapeHtml(z ? z.nombre : '?')}</strong>
                    </div>
                    <table class="pesada-table-bordered">
                        <tr><th>FECHA Y HORA</th><td class="val-large">${fH}</td></tr>
                        <tr><th>PESO BRUTO</th><td class="val-large highlight">${p.kg.toFixed(1)} kg</td></tr>
                        <tr><th>PESO NETO</th><td class="val-large highlight">${p.quintales.toFixed(2)} Q</td></tr>
                    </table>
                </div>
            </div>`; 
        }).join('');
    },

    loadMorePesadas() {
        this._page++;
        const startIndex = (this._page - 1) * this._perPage;
        const endIndex = startIndex + this._perPage;
        const nextBatch = this._todas.slice(startIndex, endIndex);
        
        const container = document.getElementById('lista-pesadas-container');
        if (container && nextBatch.length > 0) {
            container.insertAdjacentHTML('beforeend', this._renderPesadasHTML(nextBatch, this._zonas));
        }

        const remaining = this._todas.length - endIndex;
        const btnContainer = document.getElementById('load-more-container');
        if (btnContainer) {
            if (remaining > 0) {
                btnContainer.innerHTML = `<button class="btn btn-outline" data-action="App.loadMorePesadas">Cargar más (${remaining} restantes)</button>`;
            } else {
                btnContainer.remove();
            }
        }
    }
};
