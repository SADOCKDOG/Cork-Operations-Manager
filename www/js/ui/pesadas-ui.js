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
        const listPesadas = await Pesadas.list();
        const zonas = await Zonas.list();
        let maxS = listPesadas.length > 0 ? Math.max(...listPesadas.map(p => p.saca || 0)) : 0;
        let d = { 
            fecha: new Date().toISOString().split('T')[0], 
            saca: maxS + 1, 
            calidad: 'bornizo', 
            tara: 0, 
            bruto: '' 
        };
        let curZona = null;
        
        if (isEdit) {
            const p = await Pesadas.get(parseInt(id));
            if (!p) { App.toastError("No se encontró la pesada"); return App.route(); }
            d = p;
            if (d.fecha) d.fecha = new Date(d.fecha).toISOString().split('T')[0];
            if (d.pesadasPorCalidad) {
                if (d.pesadasPorCalidad.primera && d.pesadasPorCalidad.primera.kg > 0) d.calidad = 'primera';
                else if (d.pesadasPorCalidad.refugo && d.pesadasPorCalidad.refugo.kg > 0) d.calidad = 'refugo';
                else d.calidad = 'bornizo';
            }
            curZona = d.zonaId;
        }

        const main = document.getElementById('app-content');
        if (zonas.length === 0) {
            main.innerHTML = `<div class="card text-center"><p>Primero crea una zona.</p><button class="btn btn-primary" data-route="/zonas">Ir a Zonas</button></div>`;
            return;
        }

        main.innerHTML = `
            <div class="card" style="border-top: 5px solid ${isEdit ? '#eab308' : 'var(--p-cork)'}; padding: 25px;">
                <h2 style="color:#fff; margin-bottom:20px; font-size:1.5rem; border:none; padding:0; text-align:center;">${isEdit ? 'Editar' : 'Nueva'} Pesada</h2>
                <form id="form-pesada">
                    <!-- 1. Bruto y Tara en la parte superior -->
                    <div class="grid-2">
                        <div class="form-group">
                            <label>Bruto (kg)</label>
                            <input type="number" id="p-bruto" value="${d.bruto || d.pesoBruto || ''}" placeholder="0.0" step="0.1" required style="font-size:2.5rem; height:80px; font-weight:bold; color:var(--p-cork); text-align:center;">
                        </div>
                        <div class="form-group">
                            <label>Tara (kg)</label>
                            <input type="number" id="p-tara" value="${d.tara || 0}" step="0.1" required style="font-size:2.5rem; height:80px; text-align:center;">
                        </div>
                    </div>
                    
                    <div id="p-validation-msg" style="text-align:center; font-weight:bold; margin-top:5px; margin-bottom:15px;">&nbsp;</div>

                    <!-- 2. Zona -->
                    <div class="form-group">
                        <label>Zona / Parcela</label>
                        <select id="p-zona" style="height:60px; font-size:1.2rem;">
                            ${zonas.map(z => `<option value="${z.id}" ${curZona == z.id ? 'selected' : ''}>${Utils.escapeHtml(z.nombre)}</option>`).join('')}
                        </select>
                    </div>

                    <!-- 3. Selector de Calidad -->
                    <div class="form-group">
                        <label>Calidad del Corcho</label>
                        <div class="quality-selector" style="display:flex; gap:10px;">
                            <button type="button" class="quality-btn ${d.calidad === 'primera' ? 'selected' : ''}" data-quality="primera" style="flex:1; height:60px; font-size:1.2rem;">⭐ 1ª</button>
                            <button type="button" class="quality-btn ${d.calidad === 'bornizo' ? 'selected' : ''}" data-quality="bornizo" style="flex:1; height:60px; font-size:1.2rem;">🟡 Bo</button>
                            <button type="button" class="quality-btn ${d.calidad === 'refugo' ? 'selected' : ''}" data-quality="refugo" style="flex:1; height:60px; font-size:1.2rem;">🔴 Re</button>
                        </div>
                    </div>

                    <!-- 4. Datos calculados: Neto y Quintales -->
                    <div class="card stat-grid" style="display:flex; justify-content:space-around; background: rgba(255,255,255,0.03); margin: 15px 0;">
                        <div style="text-align:center;">
                            <div id="calc-neto" class="stat-value" style="font-size: 1.8rem; color: var(--accent); font-weight:900;">0.0</div>
                            <div class="stat-label" style="color:var(--text-s);">Neto (kg)</div>
                        </div>
                        <div style="text-align:center;">
                            <div id="calc-q" class="stat-value" style="font-size: 1.8rem; color: var(--p-cork); font-weight:900;">0.00</div>
                            <div class="stat-label" style="color:var(--text-s);">Quintales</div>
                        </div>
                    </div>

                    <!-- 5. Fecha y Nº Saca al final -->
                    <div class="grid-2">
                        <div class="form-group"><label>Fecha</label><input type="date" id="p-fecha" value="${d.fecha}"></div>
                        <div class="form-group"><label>Nº Saca</label><input type="number" id="p-saca" value="${d.saca}"></div>
                    </div>

                    <div style="margin-top: 20px;">
                        <button type="submit" class="btn btn-primary" style="width:100%; height:70px; font-size:1.3rem;">💾 Guardar Pesada</button>
                        ${isEdit ? `<button type="button" class="btn btn-danger mt-1" data-action="App._deletePesada" data-id="${id}" style="width:100%; height:60px;">🗑️ Eliminar</button>` : ''}
                        <button type="button" class="btn btn-outline mt-1" data-action="back" style="width:100%; height:60px;">Cancelar</button>
                    </div>
                </form>
            </div>
        `;

        const inB = document.getElementById('p-bruto'), inT = document.getElementById('p-tara');
        const valMsg = document.getElementById('p-validation-msg');
        
        const up = async () => {
            const b = parseFloat(inB.value) || 0;
            const t = parseFloat(inT.value) || 0;
            const config = Fincas._activeCache || await Fincas.getActive();
            const factor = config ? config.factorQuintal : 46;
            const n = b - t;
            const netoEl = document.getElementById('calc-neto');
            const qEl = document.getElementById('calc-q');
            
            if (b > 0 && t > b) {
                netoEl.textContent = "0.0";
                qEl.textContent = "0.00";
                netoEl.style.color = "#ef4444";
                qEl.style.color = "#ef4444";
                valMsg.textContent = "⚠️ La tara es mayor que el peso bruto";
                valMsg.style.color = "#ef4444";
            } else {
                netoEl.textContent = Math.max(0, n).toFixed(1);
                qEl.textContent = Math.max(0, n / factor).toFixed(2);
                if (b > 1500) {
                    netoEl.style.color = "#eab308";
                    qEl.style.color = "#eab308";
                    valMsg.textContent = "⚠️ Peso inusualmente alto (>1500kg)";
                    valMsg.style.color = "#eab308";
                } else {
                    netoEl.style.color = "var(--accent)";
                    qEl.style.color = "var(--p-cork)";
                    valMsg.innerHTML = "&nbsp;";
                }
            }
        };
        inB.addEventListener('input', up);
        inT.addEventListener('input', up);
        up();

        let selQ = d.calidad || 'bornizo';
        const upQ = () => document.querySelectorAll('.quality-btn').forEach(b => {
            if(b.dataset.quality === selQ) b.classList.add('selected');
            else b.classList.remove('selected');
        });
        document.querySelectorAll('.quality-btn').forEach(b => b.onclick = () => { selQ = b.dataset.quality; upQ(); });
        upQ();

        document.getElementById('form-pesada').onsubmit = async (e) => {
            e.preventDefault();
            const dt = document.getElementById('p-fecha').value;
            let finalDate = new Date().getTime();
            if (dt) {
                const parts = dt.split('-');
                finalDate = new Date(parts[0], parts[1] - 1, parts[2], 12, 0, 0).getTime();
            }
            
            const b = parseFloat(inB.value) || 0;
            const t = parseFloat(inT.value) || 0;
            const kg = b - t;
            const config = Fincas._activeCache || await Fincas.getActive();
            const factor = config ? config.factorQuintal : 46;
            const q = kg / factor;
            
            const dp = {
                id: isEdit ? parseInt(id) : undefined,
                zonaId: parseInt(document.getElementById('p-zona').value),
                fecha: finalDate,
                saca: parseInt(document.getElementById('p-saca').value),
                bruto: b,
                tara: t,
                kg: kg,
                quintales: q,
                calidad: selQ
            };
            
            dp.pesadasPorCalidad = { primera: {kg:0, quintales:0}, bornizo: {kg:0, quintales:0}, refugo: {kg:0, quintales:0} };
            dp.pesadasPorCalidad[selQ] = { kg: kg, quintales: q };

            await Pesadas.save(dp);
            Utils.toast('✅ Guardada correctamente');
            App.route('/lista');
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
