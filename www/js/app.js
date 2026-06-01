/**
 * App.js - Router y Orquestador (Version 6.2.4 - UI & Data Fields Update)
 * Actualización de campos en Ajustes y Gestión de Fincas.
 */

const App = {
    routes: {
        '/': 'renderDashboard',
        '/nueva': 'renderFormPesada',
        '/lista': 'renderLista',
        '/zonas': 'renderZonas',
        '/zona': 'renderFichaZona',
        '/informes': 'renderReportesView',
        '/ajustes': 'renderAjustes',
        '/fincas': 'renderFincasManager',
        '/gastos': 'renderGastosManager',
        '/importar-pdf': 'renderImportarPdf'
    },

    async init() {
        try {
            console.log("App: Iniciando v6.2.4...");
            window.addEventListener('hashchange', () => App.route());
            window.addEventListener('fincaChanged', () => { App.updateHeader().then(() => App.route()); });
            this._activeObjectUrls = [];
            await window.dbPromise;
            await App.updateHeader();
            await App.route();
        } catch (error) {
            console.error(error);
            const content = document.getElementById('app-content');
            if (content) content.innerHTML = `<div class="card error-card"><h2>Error de Inicio</h2><p>${error.message}</p></div>`;
        }
    },

    async updateHeader() {
        const finca = await Fincas.getActive();
        const headerEl = document.getElementById('nombre-finca-header');
        if (finca) headerEl.innerHTML = `<span onclick="location.hash='/fincas'" style="cursor:pointer">📍 ${finca.nombre}</span>`;
        else headerEl.innerHTML = `<span onclick="location.hash='/fincas'" style="cursor:pointer">➕ Crear Finca</span>`;
    },

    async route() {
        this._activeObjectUrls.forEach(url => URL.revokeObjectURL(url));
        this._activeObjectUrls = [];
        const hash = window.location.hash.slice(1) || '/';
        let path = hash, id = null, action = null;
        if (hash.startsWith('/zona/')) { const parts = hash.split('/'); path = '/zona'; id = parts[2]; if (parts[3] === 'editar') action = 'editar'; }
        else if (hash.startsWith('/pesada/')) { const parts = hash.split('/'); path = '/pesada'; id = parts[2]; if (parts[3] === 'editar') action = 'editar'; }
        document.querySelectorAll('.nav-item').forEach(el => { const base = (path === '/zona' || path === '/importar-pdf') ? '/zonas' : path; el.classList.toggle('active', el.getAttribute('href') === `#${base}`); });
        const main = document.getElementById('app-content');
        const allFincas = await Fincas.list();
        if (allFincas.length === 0) return await App.renderWelcomeWizard();
        const fincaId = await Fincas.getActiveId();
        if (!fincaId && path !== '/fincas') return await App.renderFincasManager();
        main.innerHTML = '<div class="loader">Cargando...</div>';
        try {
            if (path === '/zona' && id) { if (action === 'editar' || id === 'nueva') await App.renderFormZona(id === 'nueva' ? null : id); else await App.renderFichaZona(id); }
            else if (path === '/pesada' && id && action === 'editar') await App.renderFormPesada(id);
            else if (App.routes[path]) await App[App.routes[path]]();
            else main.innerHTML = '<h2>404</h2>';
        } catch (error) { console.error(error); main.innerHTML = `<div class="card error-card"><h2>Error</h2><p>${error.message}</p></div>`; }
    },

    async renderWelcomeWizard() {
        const main = document.getElementById('app-content');
        main.innerHTML = `<div class="card text-center welcome-wizard"><img src="icons/logo-header.png" style="width: 140px; margin-bottom: 25px;"><h1>¡Bienvenido!</h1><p>Crea o importa una finca para comenzar.</p><div class="wizard-actions mt-2" style="display:flex; flex-direction:column; gap:12px;"><button class="btn btn-primary" onclick="App._showFincaForm()">➕ Crear Finca</button><button class="btn btn-secondary" onclick="document.getElementById('import-wizard').click()">📥 Importar Backup</button><input type="file" id="import-wizard" accept=".json" style="display:none"></div></div>`;
        const input = document.getElementById('import-wizard');
        if (input) input.onchange = async (e) => { if (e.target.files[0]) await App._handleImportFile(e.target.files[0]); };
    },

    toast(msg) { const container = document.getElementById('toast-container'); const t = document.createElement('div'); t.className = 'toast'; t.textContent = msg; container.appendChild(t); setTimeout(() => t.remove(), 3000); },
    toastError(msg) { const container = document.getElementById('toast-container'); const t = document.createElement('div'); t.className = 'toast error'; t.textContent = `❌ ${msg}`; container.appendChild(t); setTimeout(() => t.remove(), 4000); },

    async renderDashboard() {
        const main = document.getElementById('app-content');
        const finca = await Fincas.getActive();
        const pesadas = await Pesadas.list();
        const tGlobal = App._calculateQualityTotals(pesadas);
        const totalQGlobal = (tGlobal.primera.quintales + tGlobal.bornizo.quintales + tGlobal.refugo.quintales).toFixed(2);

        main.innerHTML = `
            <div style="text-align: center; margin-bottom: 30px; margin-top: 10px;">
                <h1 style="color: var(--p-cork); font-size: 2.2rem; margin: 0; font-weight: 900; letter-spacing: -1px; text-transform: uppercase;">
                    ${finca ? finca.nombre : 'SIN FINCA'}
                </h1>
                <div style="width: 60px; height: 4px; background: var(--p-cork); margin: 10px auto; border-radius: 2px; opacity: 0.6;"></div>
            </div>

            <div class="card" style="border-top: 5px solid var(--p-cork); padding: 25px; margin-bottom: 25px;">
                <h3 style="text-align:center; color: #fff; font-size: 1.4rem; margin-bottom: 20px; border:none; padding:0;">Resumen Global de Pesadas</h3>
                <div class="summary-table-grid">
                    <div class="summary-cell c-1a"><div class="s-lbl">1ª CAL</div><div class="s-val">${tGlobal.primera.quintales.toFixed(2)}<span style="font-size:0.5em; margin-left:2px;">Q</span></div></div>
                    <div class="summary-cell c-bo"><div class="s-lbl">BORNIZO</div><div class="s-val">${tGlobal.bornizo.quintales.toFixed(2)}<span style="font-size:0.5em; margin-left:2px;">Q</span></div></div>
                    <div class="summary-cell c-re"><div class="s-lbl">REFUGO</div><div class="s-val">${tGlobal.refugo.quintales.toFixed(2)}<span style="font-size:0.5em; margin-left:2px;">Q</span></div></div>
                </div>
                <div style="text-align: center; margin-top: 20px; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 15px;">
                    <span style="font-size: 0.9rem; color: var(--text-s); text-transform: uppercase; font-weight:800; letter-spacing:1px;">Total Acumulado</span><br>
                    <strong style="font-size: 2.2rem; color: var(--p-cork);">${totalQGlobal} <span style="font-size:0.6em">Q</span></strong>
                </div>
            </div>

            <div id="resumenHoy" class="card" style="border-top: 5px solid var(--p-cork); padding: 25px;">
                <h3 style="text-align:center; color: #fff; font-size: 1.4rem; margin-bottom: 20px; border:none; padding:0;">📅 Resumen Hoy</h3>
                <div class="summary-table-grid">
                    <div class="summary-cell c-1a">
                        <div class="s-lbl">1ª CAL</div>
                        <div class="s-val"><span id="qPrimera">0.0</span><span style="font-size:0.5em; margin-left:2px;">Q</span></div>
                        <div style="font-size:0.8rem; opacity:0.8;"><span id="kgPrimera">0</span> kg</div>
                    </div>
                    <div class="summary-cell c-bo">
                        <div class="s-lbl">BORNIZO</div>
                        <div class="s-val"><span id="qBornizo">0.0</span><span style="font-size:0.5em; margin-left:2px;">Q</span></div>
                        <div style="font-size:0.8rem; opacity:0.8;"><span id="kgBornizo">0</span> kg</div>
                    </div>
                    <div class="summary-cell c-re">
                        <div class="s-lbl">REFUGO</div>
                        <div class="s-val"><span id="qRefugo">0.0</span><span style="font-size:0.5em; margin-left:2px;">Q</span></div>
                        <div style="font-size:0.8rem; opacity:0.8;"><span id="kgRefugo">0</span> kg</div>
                    </div>
                </div>
                <div style="text-align: center; margin-top: 20px; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 15px;">
                    <span style="font-size: 0.9rem; color: var(--text-s); text-transform: uppercase; font-weight:800; letter-spacing:1px;">Total (Hoy)</span><br>
                    <strong style="font-size: 2.2rem; color: var(--p-cork);"><span id="qTotal">0.0</span> <span style="font-size:0.6em">Q</span></strong><br>
                    <span style="font-size:0.9rem; opacity:0.8;"><span id="kgTotal">0</span> kg</span>
                </div>
                <p id="pesadasHoyCount" class="text-muted" style="text-align:center; margin-top: 15px; font-size: 0.9rem;"></p>
            </div>
        `;
        await App.actualizarResumenHoy();
    },

    async actualizarResumenHoy() {
        const hoy = new Date().toISOString().split('T')[0], pesadas = (await Pesadas.list()).filter(p => p.fecha.startsWith(hoy));
        const t = App._calculateQualityTotals(pesadas);
        document.getElementById('kgPrimera').textContent = Math.round(t.primera.kg); document.getElementById('qPrimera').textContent = t.primera.quintales.toFixed(1);
        document.getElementById('kgBornizo').textContent = Math.round(t.bornizo.kg); document.getElementById('qBornizo').textContent = t.bornizo.quintales.toFixed(1);
        document.getElementById('kgRefugo').textContent = Math.round(t.refugo.kg); document.getElementById('qRefugo').textContent = t.refugo.quintales.toFixed(1);
        document.getElementById('kgTotal').textContent = Math.round(t.primera.kg + t.bornizo.kg + t.refugo.kg);
        document.getElementById('qTotal').textContent = (t.primera.quintales + t.bornizo.quintales + t.refugo.quintales).toFixed(1);
        document.getElementById('pesadasHoyCount').textContent = `${pesadas.length} sacas hoy.`;
    },

    _calculateQualityTotals(pesadas) {
        const t = { primera: { kg: 0, quintales: 0 }, bornizo: { kg: 0, quintales: 0 }, refugo: { kg: 0, quintales: 0 } };
        pesadas.forEach(p => { ['primera', 'bornizo', 'refugo'].forEach(cal => { t[cal].kg += p.pesadasPorCalidad[cal]?.kg || 0; t[cal].quintales += p.pesadasPorCalidad[cal]?.quintales || 0; }); });
        return t;
    },

    async renderUltimasPesadas() {
        const pesadas = (await Pesadas.list()).slice(0, 5), zonas = await Zonas.list(), listEl = document.getElementById('recent-list');
        if (!listEl) return;
        listEl.innerHTML = pesadas.length ? pesadas.map(p => {
            const z = zonas.find(z => Number(z.id) === Number(p.zonaId)), fH = new Date(p.fecha).toLocaleString('es-ES', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
            let em = '⭐', cal = '1ª Calidad', col = '#10b981';
            if (p.pesadasPorCalidad.bornizo.kg > 0) { em = '🟡'; cal = 'Bornizo'; col = '#d4a373'; } else if (p.pesadasPorCalidad.refugo.kg > 0) { em = '🔴'; cal = 'Refugo'; col = '#ef4444'; }
            return `<div class="pesada-card" style="--card-color: ${col};" onclick="location.hash='/pesada/${p.id}/editar'"><div class="pesada-card-left"><small>${fH}</small><strong>${z?z.nombre:'?'}</strong><div class="pesada-saca-badge">SACA #${p.saca}</div></div><div class="pesada-card-right"><table class="pesada-data-table"><tr><td class="pesada-data-label">Calidad</td><td class="pesada-data-value">${em} ${cal}</td></tr><tr><td class="pesada-data-label">Bruto</td><td class="pesada-data-value highlight-kg">${p.kg.toFixed(1)} kg</td></tr><tr><td class="pesada-data-label">Neto</td><td class="pesada-data-value highlight-q">${p.quintales.toFixed(2)} Q</td></tr></table></div></div>`;
        }).join('') : '<p class="text-center text-muted">Sin pesadas.</p>';
    },

    async renderFormPesada(id = null) {
        const main = document.getElementById('app-content'), finca = await Fincas.getActive(), listPesadas = await Pesadas.list(), zonas = await Zonas.list();
        let isEdit = id !== null, maxS = listPesadas.length > 0 ? Math.max(...listPesadas.map(p => p.saca || 0)) : 0;
        let d = id ? await Pesadas.get(parseInt(id)) : { fecha: new Date().toISOString().split('T')[0], saca: maxS + 1, calidad: 'bornizo', tara: 0, pesoBruto: '' };
        if (isEdit && d) { d.fecha = d.fecha.split('T')[0]; if (d.pesadasPorCalidad.primera.kg > 0) d.calidad = 'primera'; else if (d.pesadasPorCalidad.refugo.kg > 0) d.calidad = 'refugo'; }
        if (zonas.length === 0) { main.innerHTML = `<div class="card text-center"><p>Primero crea una zona.</p><button class="btn btn-primary" onclick="location.hash='/zonas'">Ir a Zonas</button></div>`; return; }

        main.innerHTML = `
            <div class="card">
                <h2>${isEdit ? 'Editar' : 'Nueva'} Pesada</h2>
                <form id="form-pesada">
                    <!-- 1. Bruto y Tara en la parte superior -->
                    <div class="grid-2">
                        <div class="form-group"><label>Bruto (kg)</label><input type="number" id="p-bruto" value="${d.pesoBruto || ''}" placeholder="0.0"></div>
                        <div class="form-group"><label>Tara (kg)</label><input type="number" id="p-tara" value="${d.tara || 0}"></div>
                    </div>

                    <!-- 2. Zona -->
                    <div class="form-group">
                        <label>Zona / Parcela</label>
                        <select id="p-zona">${zonas.map(z => `<option value="${z.id}" ${d.zonaId == z.id ? 'selected' : ''}>${z.nombre}</option>`).join('')}</select>
                    </div>

                    <!-- 3. Selector de Calidad -->
                    <div class="form-group">
                        <label>Calidad del Corcho</label>
                        <div class="quality-selector" style="display:flex; gap:10px;">
                            <button type="button" class="quality-btn" data-quality="primera" style="flex:1;">⭐ 1ª</button>
                            <button type="button" class="quality-btn" data-quality="bornizo" style="flex:1;">🟡 Bo</button>
                            <button type="button" class="quality-btn" data-quality="refugo" style="flex:1;">🔴 Re</button>
                        </div>
                    </div>

                    <!-- 4. Datos calculados: Neto y Quintales -->
                    <div class="card stat-grid" style="display:flex; justify-content:space-around; background: rgba(255,255,255,0.03); margin: 15px 0;">
                        <div style="text-align:center;">
                            <div id="calc-neto" class="stat-value" style="font-size: 1.8rem; color: var(--accent);">0.0</div>
                            <div class="stat-label">Neto (kg)</div>
                        </div>
                        <div style="text-align:center;">
                            <div id="calc-q" class="stat-value" style="font-size: 1.8rem; color: var(--p-cork);">0.00</div>
                            <div class="stat-label">Quintales</div>
                        </div>
                    </div>

                    <!-- 5. Fecha y Nº Saca al final -->
                    <div class="grid-2">
                        <div class="form-group"><label>Fecha</label><input type="date" id="p-fecha" value="${d.fecha}"></div>
                        <div class="form-group"><label>Nº Saca</label><input type="number" id="p-saca" value="${d.saca}"></div>
                    </div>

                    <div style="margin-top: 20px;">
                        <button type="submit" class="btn btn-primary">💾 Guardar Pesada</button>
                        ${isEdit ? `<button type="button" class="btn btn-danger mt-1" onclick="App._deletePesada(${id})">🗑️ Eliminar</button>` : ''}
                        <button type="button" class="btn btn-outline mt-1" onclick="history.back()">Cancelar</button>
                    </div>
                </form>
            </div>`;

        const inB = document.getElementById('p-bruto'), inT = document.getElementById('p-tara');
        const up = () => {
            const n = (parseFloat(inB.value) || 0) - (parseFloat(inT.value) || 0);
            document.getElementById('calc-neto').textContent = n.toFixed(1);
            document.getElementById('calc-q').textContent = (n / (finca.factorQuintal || 46)).toFixed(2);
        };
        inB.oninput = inT.oninput = up; up();

        let selQ = d.calidad || 'bornizo';
        const upQ = () => document.querySelectorAll('.quality-btn').forEach(b => b.classList.toggle('selected', b.dataset.quality === selQ));
        document.querySelectorAll('.quality-btn').forEach(b => b.onclick = () => { selQ = b.dataset.quality; upQ(); });
        upQ();

        document.getElementById('form-pesada').onsubmit = async (e) => {
            e.preventDefault();
            const dS = {
                id: isEdit ? d.id : undefined,
                zonaId: document.getElementById('p-zona').value,
                fecha: document.getElementById('p-fecha').value,
                saca: document.getElementById('p-saca').value,
                pesoBruto: inB.value,
                tara: inT.value,
                calidad: selQ
            };
            await Pesadas.save(dS);
            App.toast('✅ Guardada correctamente');
            location.hash = '/lista';
        };
    },

    async _deletePesada(id) { if (confirm("¿Eliminar pesada?")) { await Pesadas.delete(id); App.toast("✅ Eliminada"); location.hash = '/lista'; } },

    async _deleteZona(id) {
        if (confirm("¿Eliminar zona permanentemente?")) {
            try {
                await Zonas.delete(id);
                App.toast("✅ Zona eliminada");
                location.hash = '/zonas';
            } catch (e) {
                App.toastError(e.message);
            }
        }
    },

    async renderLista() {
        const main = document.getElementById('app-content'), pesadas = await Pesadas.list(), zonas = await Zonas.list();
        const t = App._calculateQualityTotals(pesadas);
        const totalQ = (t.primera.quintales + t.bornizo.quintales + t.refugo.quintales).toFixed(2);
        main.innerHTML = `<div class="card" style="border-top: 5px solid var(--p-cork); padding: 25px;"><h3 style="text-align:center; color: #fff; font-size: 1.4rem; margin-bottom: 20px; border:none;">Resumen Global de Pesadas</h3><div class="summary-table-grid"><div class="summary-cell c-1a"><div class="s-lbl">1ª CAL</div><div class="s-val">${t.primera.quintales.toFixed(2)}<span style="font-size:0.5em; margin-left:2px;">Q</span></div></div><div class="summary-cell c-bo"><div class="s-lbl">BORNIZO</div><div class="s-val">${t.bornizo.quintales.toFixed(2)}<span style="font-size:0.5em; margin-left:2px;">Q</span></div></div><div class="summary-cell c-re"><div class="s-lbl">REFUGO</div><div class="s-val">${t.refugo.quintales.toFixed(2)}<span style="font-size:0.5em; margin-left:2px;">Q</span></div></div></div><div style="text-align: center; margin-top: 20px; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 15px;"><span style="font-size: 0.9rem; color: var(--text-s); text-transform: uppercase; font-weight:800; letter-spacing:1px;">Total Acumulado</span><br><strong style="font-size: 2.2rem; color: var(--p-cork);">${totalQ} <span style="font-size:0.6em">Q</span></strong></div></div><button class="btn btn-primary" style="margin-bottom: 25px; height: 60px; font-size: 1.1rem; box-shadow: 0 8px 20px rgba(212, 163, 115, 0.4);" onclick="location.hash='/nueva'">➕ NUEVA PESADA</button><div class="card" style="border-top: 5px solid var(--accent); text-align: center; padding: 25px;"><h3 style="font-size: 1.5rem; margin-bottom: 15px; color: #fff; border:none;">Listado de Pesadas</h3><button class="btn btn-secondary mt-1" onclick="App.exportarPDF('lista')">📄 Exportar a PDF</button></div><div class="lista-detallada">${pesadas.map(p => { const z = zonas.find(z => z.id == p.zonaId); let em = '⭐', cal = '1ª Calidad', col = '#10b981'; if (p.pesadasPorCalidad.bornizo.kg > 0) { em = '🟡'; cal = 'Bornizo'; col = '#eab308'; } else if (p.pesadasPorCalidad.refugo.kg > 0) { em = '🔴'; cal = 'Refugo'; col = '#ef4444'; } const fH = new Date(p.fecha).toLocaleString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }); return `<div class="pesada-card" style="--card-color: ${col};" onclick="location.hash='/pesada/${p.id}/editar'"><div class="pesada-card-content"><div style="margin-bottom: 12px; display: flex; justify-content: space-between; align-items: center;"><div class="pesada-saca-badge">SACA #${p.saca}</div><strong style="color: ${col}; font-size: 1.3rem;">${em} ${cal}</strong></div><div style="font-size: 1.1rem; margin-bottom: 12px; color: #fff;"><strong>🌲 ${z ? z.nombre : '?'}</strong></div><table class="pesada-table-bordered"><tr><th>FECHA Y HORA</th><td class="val-large">${fH}</td></tr><tr><th>PESO BRUTO</th><td class="val-large highlight">${p.kg.toFixed(1)} kg</td></tr><tr><th>PESO NETO</th><td class="val-large highlight">${p.quintales.toFixed(2)} Q</td></tr></table></div></div>`; }).join('')}</div>`;
    },

    async renderZonas() {
        const main = document.getElementById('app-content'), stats = await Zonas.getStats();
        main.innerHTML = `<div class="card"><div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;"><h3>Gestión de Zonas</h3><div onclick="App.openManualZonas()" style="cursor:pointer; color:var(--p-cork); font-weight:bold; font-size:0.85rem;">Ayuda ➔ ❓</div></div><div class="grid-2" style="gap:10px;"><button class="btn btn-primary" onclick="location.hash='/zona/nueva'">➕ Nueva Zona</button><button class="btn btn-secondary" onclick="location.hash='/importar-pdf'">📥 Importar PDF</button></div></div>${stats.map(z => `<div class="card" onclick="location.hash='/zona/${z.id}'" style="cursor:pointer; border-top: 5px solid var(--p-cork); padding: 25px;"><h3 style="text-align:center; color: #fff; font-size: 1.4rem; margin-bottom: 20px; border:none;">${z.nombre}</h3><div class="summary-table-grid"><div class="summary-cell c-1a"><div class="s-lbl">1ª CAL</div><div class="s-val">${z.totalesPorCalidad.primera.quintales.toFixed(2)}<span style="font-size:0.5em; margin-left:2px;">Q</span></div></div><div class="summary-cell c-bo"><div class="s-lbl">BORNIZO</div><div class="s-val">${z.totalesPorCalidad.bornizo.quintales.toFixed(2)}<span style="font-size:0.5em; margin-left:2px;">Q</span></div></div><div class="summary-cell c-re"><div class="s-lbl">REFUGO</div><div class="s-val">${z.totalesPorCalidad.refugo.quintales.toFixed(2)}<span style="font-size:0.5em; margin-left:2px;">Q</span></div></div></div></div>`).join('')}`;
    },

    async renderFichaZona(id) {
        const main = document.getElementById('app-content'), z = await Zonas.get(parseInt(id)); if (!z) return location.hash = '/zonas';
        const pesadas = await db.getAllFromIndex('pesadas', 'zonaId', z.id), t = { primera: 0, bornizo: 0, refugo: 0 };
        pesadas.forEach(p => { t.primera += p.pesadasPorCalidad.primera.quintales || 0; t.bornizo += p.pesadasPorCalidad.bornizo.quintales || 0; t.refugo += p.pesadasPorCalidad.refugo.quintales || 0; });
        let croquisHtml = z.croquisBlob ? `<div style="text-align:center; margin-bottom:20px;"><img src="${URL.createObjectURL(z.croquisBlob)}" style="max-width:100%; border-radius:12px; border:1px solid var(--border);"></div>` : '';

        let cultivosHtml = '';
        if (z.cultivos && z.cultivos.length > 0) {
            cultivosHtml = `
                <div class="card">
                    <h4>CULTIVO SIGPAC</h4>
                    <table class="reporte-table" style="font-size:0.8rem;">
                        <thead><tr><th>Sub</th><th>Aprovechamiento</th><th>Int</th><th>Sup. m²</th></tr></thead>
                        <tbody>${z.cultivos.map(c => `<tr><td>${c.letra || ''}</td><td>${c.cultivo || '-'}</td><td>${c.intensidad || ''}</td><td>${c.superficie || '0'}</td></tr>`).join('')}</tbody>
                    </table>
                </div>`;
        }

        main.innerHTML = `
            <div class="card">
                <h3>DATOS DESCRIPTIVOS INMUEBLE</h3>
                <div style="font-size:0.9rem; line-height:1.8;">
                    <p><strong>Referencia catastral:</strong> ${z.refCatastral || '-'}</p>
                    <p><strong>Localización:</strong> Polígono ${z.poligono || '-'} Parcela ${z.parcela || '-'}<br>
                       <span class="text-muted">${z.municipio || '-'}</span></p>
                    <p><strong>Clase:</strong> ${z.clase || '-'}</p>
                    <p><strong>Uso principal:</strong> ${z.usoPrincipal || '-'}</p>
                    <p><strong>Superficie gráfica:</strong> ${z.superficieGrafica ? z.superficieGrafica + ' m²' : '-'}</p>
                </div>
                <button class="btn btn-secondary mt-1" onclick="location.hash='/zona/${z.id}/editar'">✏️ Editar Zona</button>
            </div>

            <div class="card">
                <h3>PARCELA CATASTRAL</h3>
                ${croquisHtml}
            </div>

            ${cultivosHtml}

            <div class="card" style="border-top: 5px solid var(--p-cork); padding:25px;">
                <h4 style="text-align:center; color: #fff; font-size: 1.4rem; margin-bottom: 20px; border:none;">Producción Acumulada</h4>
                <div class="summary-table-grid">
                    <div class="summary-cell c-1a"><div class="s-lbl">1ª CAL</div><div class="s-val">${t.primera.toFixed(2)}<span style="font-size:0.5em; margin-left:2px;">Q</span></div></div>
                    <div class="summary-cell c-bo"><div class="s-lbl">BORNIZO</div><div class="s-val">${t.bornizo.toFixed(2)}<span style="font-size:0.5em; margin-left:2px;">Q</span></div></div>
                    <div class="summary-cell c-re"><div class="s-lbl">REFUGO</div><div class="s-val">${t.refugo.toFixed(2)}<span style="font-size:0.5em; margin-left:2px;">Q</span></div></div>
                </div>
            </div>
            <button class="btn btn-outline" onclick="location.hash='/zonas'">Volver</button>`;
    },

    async renderFormZona(id = null) {
        const main = document.getElementById('app-content'); let isEdit = id !== null;
        let d = id ? await Zonas.get(parseInt(id)) : { nombre: '', paraje: '', municipio: '', provincia: '', refCatastral: '', poligono: '', parcela: '', superficieGrafica: '', usoPrincipal: '', clase: '' };
        main.innerHTML = `
            <div class="card">
                <h3>${isEdit ? 'Editar' : 'Nueva'} Zona</h3>
                <form id="form-zona">
                    <div class="form-group"><label>Nombre de la Zona*</label><input type="text" id="z-nom" value="${d.nombre}" required></div>
                    <h4>Datos Catastrales</h4>
                    <div class="form-group"><label>Referencia Catastral</label><input type="text" id="z-ref" value="${d.refCatastral || ''}"></div>
                    <div class="grid-2">
                        <div class="form-group"><label>Polígono</label><input type="number" id="z-pol" value="${d.poligono || ''}"></div>
                        <div class="form-group"><label>Parcela</label><input type="number" id="z-parcela" value="${d.parcela || ''}"></div>
                    </div>
                    <div class="grid-2">
                        <div class="form-group"><label>Municipio</label><input type="text" id="z-mun" value="${d.municipio || ''}"></div>
                        <div class="form-group"><label>Superficie (m²)</label><input type="number" id="z-sup" value="${d.superficieGrafica || ''}"></div>
                    </div>
                    <div class="grid-2">
                        <div class="form-group"><label>Uso Principal</label><input type="text" id="z-uso" value="${d.usoPrincipal || ''}"></div>
                        <div class="form-group"><label>Clase</label><input type="text" id="z-clase" value="${d.clase || ''}"></div>
                    </div>
                    <button type="submit" class="btn btn-primary">Guardar Zona</button>
                    ${isEdit ? `<button type="button" class="btn btn-danger mt-1" onclick="App._deleteZona(${id})">🗑️ Eliminar Zona</button>` : ''}
                    <button type="button" class="btn btn-outline mt-1" onclick="history.back()">Cancelar</button>
                </form>
            </div>`;
        document.getElementById('form-zona').onsubmit = async (e) => {
            e.preventDefault();
            const dS = {
                ...d,
                id: isEdit ? d.id : undefined,
                nombre: document.getElementById('z-nom').value.trim(),
                refCatastral: document.getElementById('z-ref').value.trim(),
                poligono: document.getElementById('z-pol').value,
                parcela: document.getElementById('z-parcela').value,
                municipio: document.getElementById('z-mun').value.trim(),
                superficieGrafica: document.getElementById('z-sup').value,
                usoPrincipal: document.getElementById('z-uso').value.trim(),
                clase: document.getElementById('z-clase').value.trim()
            };
            await Zonas.save(dS); App.toast('✅ Guardada'); location.hash = '/zonas';
        };
    },

    async renderReportesView() {
        const main = document.getElementById('app-content');
        main.innerHTML = `
            <div style="display:flex; align-items:center; gap:12px; margin-bottom:25px;">
                <div style="width:5px; height:30px; background:var(--p-cork); border-radius:3px;"></div>
                <h2 style="margin:0; border:none; padding:0; color:var(--text-p); font-weight:800;">Central de Informes</h2>
            </div>
            <div class="reportes-selector-grid">
                <button class="report-select-btn" onclick="App.renderReporteGlobal()" style="background: linear-gradient(135deg, rgba(160,103,58,0.5) 0%, rgba(212,163,115,0.5) 100%); border:none; box-shadow: 0 4px 15px rgba(160,103,58,0.15); min-height: 80px; padding: 10px;">
                    <span class="btn-icon" style="font-size:1.6rem; margin-bottom:2px; height:45px; width:45px;">🌍</span>
                    <strong style="font-size:0.85rem;">Balance Global</strong>
                </button>
                <button class="report-select-btn" onclick="App.renderReporteEconomico()" style="background: linear-gradient(135deg, rgba(44,62,80,0.5) 0%, rgba(76,161,175,0.5) 100%); border:none; box-shadow: 0 4px 15px rgba(44,62,80,0.15); min-height: 80px; padding: 10px;">
                    <span class="btn-icon" style="font-size:1.6rem; margin-bottom:2px; height:45px; width:45px;">💶</span>
                    <strong style="font-size:0.85rem;">Liq. Económica</strong>
                </button>
                <button class="report-select-btn" onclick="App.renderMenuZonasReport()" style="background: linear-gradient(135deg, rgba(19,78,94,0.5) 0%, rgba(113,178,128,0.5) 100%); border:none; box-shadow: 0 4px 15px rgba(19,78,94,0.15); min-height: 80px; padding: 10px;">
                    <span class="btn-icon" style="font-size:1.6rem; margin-bottom:2px; height:45px; width:45px;">🌲</span>
                    <strong style="font-size:0.85rem;">Prod. Zona</strong>
                </button>
                <button class="report-select-btn" onclick="App.renderMenuCalidadesReport()" style="background: linear-gradient(135deg, rgba(127,176,105,0.5) 0%, rgba(141,179,105,0.5) 100%); border:none; box-shadow: 0 4px 15px rgba(127,176,105,0.15); min-height: 80px; padding: 10px;">
                    <span class="btn-icon" style="font-size:1.6rem; margin-bottom:2px; height:45px; width:45px;">⭐</span>
                    <strong style="font-size:0.85rem;">Liq. Calidad</strong>
                </button>
                <button class="report-select-btn" onclick="App.renderGraficos()" style="background: linear-gradient(135deg, rgba(106,17,203,0.5) 0%, rgba(37,117,252,0.5) 100%); border:none; box-shadow: 0 4px 15px rgba(106,17,203,0.15); min-height: 80px; padding: 10px;">
                    <span class="btn-icon" style="font-size:1.6rem; margin-bottom:2px; height:45px; width:45px;">📈</span>
                    <strong style="font-size:0.85rem;">Panel Gráficos</strong>
                </button>
            </div>
            <hr style="border:0; border-top:1px solid var(--border); margin:25px 0;">
            <div id="cont-rep"></div>`;
        await App.renderReporteGlobal();
    },

    _getDualHeaderHtml(vNom, vProp, vCIF, cNom, cCIF, cRef) {
        return `<div class="dual-entity-grid"><div class="entity-card vendedor"><small>Emisor / Vendedor</small><strong>${vNom.toUpperCase()}</strong><p>${vProp}<br>CIF: ${vCIF}</p></div><div class="entity-card comprador"><small>Receptor / Comprador</small><strong>${cNom.toUpperCase()}</strong><p>CIF: ${cCIF}<br>Ref: ${cRef}</p></div></div>`;
    },

    async renderReporteGlobal() {
        const r = await Reportes.generarReporteGlobalCampaña(), finca = await Fincas.getActive(); if (!r || !finca) return;
        const comp = finca.comprador || {};
        let h = `<div class="reporte-container"><div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:25px;"><h2 style="margin:0; color:var(--p-cork); font-weight:800;">🌍 Balance de Campaña</h2><div style="display:flex; gap:10px;"><button class="btn btn-outline" style="height:40px; padding:0 15px; font-size:0.85rem; border-radius:10px;" onclick="App.exportarPDF('global')">📄 PDF</button><button class="btn btn-outline" style="height:40px; padding:0 15px; font-size:0.85rem; border-radius:10px;" onclick="Export.exportGlobalToExcel()">📊 Excel</button></div></div>${App._getDualHeaderHtml(finca.nombre, finca.propietario||'-', finca.cif||'-', comp.nombreEmpresa||'Sin Empresa', comp.cifNif||'-', comp.representante||'-')}<div class="card"><h4>Resumen por Calidad</h4><div class="table-responsive"><table class="reporte-table"><thead><tr><th>Calidad</th><th style="text-align:right;">Quintales</th><th style="text-align:right;">Sacas</th></tr></thead><tbody><tr><td><span class="q-pill p1">⭐ 1ª Calidad</span></td><td style="text-align:right; font-weight:700;">${r.totalesGlobales.primera.quintales.toFixed(2)}</td><td style="text-align:right;">${r.totalesGlobales.primera.sacas}</td></tr><tr><td><span class="q-pill pb">🟡 Bornizo</span></td><td style="text-align:right; font-weight:700;">${r.totalesGlobales.bornizo.quintales.toFixed(2)}</td><td style="text-align:right;">${r.totalesGlobales.bornizo.sacas}</td></tr><tr><td><span class="q-pill pr">🔴 Refugo</span></td><td style="text-align:right; font-weight:700;">${r.totalesGlobales.refugo.quintales.toFixed(2)}</td><td style="text-align:right;">${r.totalesGlobales.refugo.sacas}</td></tr></tbody><tfoot><tr><td><strong>TOTAL GENERAL</strong></td><td style="text-align:right; color:var(--p-cork); font-size:1rem;"><strong>${(r.totalesGlobales.primera.quintales + r.totalesGlobales.bornizo.quintales + r.totalesGlobales.refugo.quintales).toFixed(2)} Q</strong></td><td style="text-align:right;"><strong>${r.totalesGlobales.primera.sacas + r.totalesGlobales.bornizo.sacas + r.totalesGlobales.refugo.sacas}</strong></td></tr></tfoot></table></div></div><div class="card"><h4>Desglose por Zona (kg)</h4><div class="table-responsive"><table class="reporte-table"><thead><tr><th>Zona</th><th style="text-align:right;">1ª</th><th style="text-align:right;">Bo</th><th style="text-align:right;">Re</th></tr></thead><tbody>${Object.values(r.reportePorZona).map(z => `<tr><td><strong>${z.nombre}</strong></td><td style="text-align:right;">${Math.round(z.totales.primera.kg)}</td><td style="text-align:right;">${Math.round(z.totales.bornizo.kg)}</td><td style="text-align:right;">${Math.round(z.totales.refugo.kg)}</td></tr>`).join('')}</tbody></table></div></div></div>`;
        document.getElementById('cont-rep').innerHTML = h;
    },

    async renderReporteEconomico() {
        const r = await Reportes.generarReporteEconomicoGlobal(), finca = await Fincas.getActive(); if (!r || !finca) return;
        const totalGastos = await Gastos.getTotal(), beneficioNeto = r.valorTotal - totalGastos, comp = finca.comprador || {};
        let h = `<div class="reporte-container"><div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:25px;"><h2 style="margin:0; color:var(--p-cork); font-weight:800;">💶 Liquidación Final</h2><div style="display:flex; gap:10px;"><button class="btn btn-outline" style="height:40px; padding:0 15px; border-radius:10px;" onclick="App.exportarPDF('economico')">📄 PDF</button><button class="btn btn-outline" style="height:40px; padding:0 15px; border-radius:10px;" onclick="Export.exportEconomicoToExcel()">📊 Excel</button></div></div>${App._getDualHeaderHtml(finca.nombre, finca.propietario||'-', finca.cif||'-', comp.nombreEmpresa||'Sin Empresa', comp.cifNif||'-', comp.representante||'-')}<div class="card"><h4>Desglose Económico</h4><div class="table-responsive"><table class="reporte-table"><thead><tr><th>Calidad</th><th>Precio</th><th>Q.Bruto</th><th style="color:#ff9800;">Oreo</th><th>Q.Neto</th><th style="text-align:right;">Total</th></tr></thead><tbody><tr><td><span class="q-pill p1">⭐ 1ª</span></td><td>${(r.precios.primera?.precioQuintal || 0).toFixed(2)}€</td><td>${r.totales.primera.bruto.toFixed(2)}</td><td style="color:#ff9800;">${r.totales.primera.merma.toFixed(2)}</td><td>${r.totales.primera.neto.toFixed(2)}</td><td style="text-align:right; font-weight:800;">${r.totales.primera.valor.toFixed(2)}€</td></tr><tr><td><span class="q-pill pb">🟡 Bo</span></td><td>${(r.precios.bornizo?.precioQuintal || 0).toFixed(2)}€</td><td>${r.totales.bornizo.bruto.toFixed(2)}</td><td style="color:#ff9800;">${r.totales.bornizo.merma.toFixed(2)}</td><td>${r.totales.bornizo.neto.toFixed(2)}</td><td style="text-align:right; font-weight:800;">${r.totales.bornizo.valor.toFixed(2)}€</td></tr><tr><td><span class="q-pill pr">🔴 Re</span></td><td>${(r.precios.refugo?.precioQuintal || 0).toFixed(2)}€</td><td>${r.totales.refugo.bruto.toFixed(2)}</td><td style="color:#ff9800;">${r.totales.refugo.merma.toFixed(2)}</td><td>${r.totales.refugo.neto.toFixed(2)}</td><td style="text-align:right; font-weight:800;">${r.totales.refugo.valor.toFixed(2)}€</td></tr></tbody><tfoot><tr><td colspan="2">SUBTOTALES</td><td>${r.brutoTotal.toFixed(2)}</td><td style="color:#ff9800;">${(r.brutoTotal - r.netoTotal).toFixed(2)}</td><td>${r.netoTotal.toFixed(2)}</td><td style="text-align:right; color:var(--p-cork); font-size:1rem;">${r.valorTotal.toFixed(2)}€</td></tr></tfoot></table></div></div><div class="card-finance" style="background: linear-gradient(135deg, #1a1a1a 0%, #000 100%); border: 1px solid var(--border); padding:25px;"><div style="display:flex; justify-content:space-between; margin-bottom:10px;"><span class="text-muted">Ingresos Brutos</span><span>${r.valorTotal.toFixed(2)}€</span></div><div style="display:flex; justify-content:space-between; margin-bottom:15px;"><span style="color:#ff4d4d;">Gastos Campaña (-)</span><span style="color:#ff4d4d;">-${totalGastos.toFixed(2)}€</span></div><hr style="opacity:0.3; margin-bottom:15px;"><div style="display:flex; justify-content:space-between; align-items:center;"><span style="color:var(--accent); font-weight:900; font-size:1.1rem;">BENEFICIO NETO REAL</span><span class="total-neto" style="color:var(--accent); font-size:1.8rem; font-weight:900;">${beneficioNeto.toFixed(2)}€</span></div></div></div>`;
        document.getElementById('cont-rep').innerHTML = h;
    },

    async renderMenuZonasReport() {
        const zonas = await Zonas.list();
        let h = `<div class="card"><h3>🌲 Selección de Zona</h3><select id="sel-zona-rep" style="height:50px; margin-bottom:15px; background:var(--surface); color:white; width:100%; padding:0 15px; border-radius:12px; border:1px solid var(--border);">${zonas.map(z => `<option value="${z.id}">${z.nombre}</option>`).join('')}</select><button class="btn btn-primary" onclick="App.renderReportePorZona(document.getElementById('sel-zona-rep').value)">Generar Informe de Zona</button></div>`;
        document.getElementById('cont-rep').innerHTML = h;
    },

    async renderReportePorZona(zonaId) {
        const r = await Reportes.generarReportePorZona(zonaId), finca = await Fincas.getActive(); if (!r || !finca) return;
        let h = `<div class="reporte-container"><div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:25px;"><h2 style="margin:0; color:var(--p-cork); font-weight:800;">🌲 Informe: ${r.zona.nombre}</h2><button class="btn btn-outline" style="height:40px; padding:0 15px; border-radius:10px;" onclick="App.exportarPDF('zona')">📄 PDF</button></div>${App._getDualHeaderHtml(finca.nombre, 'Explotación Activa', finca.cif||'-', 'ZONA DE SACA', `Pol.${r.zona.poligono} / Par.${r.zona.parcela}`, r.zona.municipio||'-')}<div class="card"><h4>Historial de Sacas</h4><div class="table-responsive"><table class="reporte-table"><thead><tr><th>Fecha</th><th>Saca</th><th style="text-align:right;">Peso (kg)</th><th>Cal</th></tr></thead><tbody>${r.pesadas.map(p => { let em = p.pesadasPorCalidad.primera.kg > 0 ? '⭐' : p.pesadasPorCalidad.bornizo.kg > 0 ? '🟡' : '🔴'; return `<tr><td>${new Date(p.fecha).toLocaleDateString()}</td><td>#${p.saca}</td><td style="text-align:right;"><strong>${p.kg.toFixed(1)}</strong></td><td>${em}</td></tr>`; }).join('')}</tbody></table></div></div><div class="card-finance" style="background:var(--surface-light); padding:20px;"><div style="display:flex; justify-content:space-around; text-align:center;"><div><div class="stat-value">${r.totales.primera.quintales.toFixed(2)}</div><div class="stat-label">1ª (Q)</div></div><div><div class="stat-value">${r.totales.bornizo.quintales.toFixed(2)}</div><div class="stat-label">Bo (Q)</div></div><div><div class="stat-value">${r.totales.refugo.quintales.toFixed(2)}</div><div class="stat-label">Re (Q)</div></div></div></div></div>`;
        document.getElementById('cont-rep').innerHTML = h;
    },

    async renderMenuCalidadesReport() {
        let h = `<div class="card"><h3>⭐ Selección de Calidad</h3><div class="reportes-selector-grid" style="margin-top:15px;"><button class="report-select-btn theme-calidad" onclick="App.renderReporteEconomicoPorCalidad('primera')"><span class="btn-icon">⭐</span><strong>1ª Calidad</strong></button><button class="report-select-btn theme-econ" onclick="App.renderReporteEconomicoPorCalidad('bornizo')"><span class="btn-icon">🟡</span><strong>Bornizo</strong></button><button class="report-select-btn theme-graficos" onclick="App.renderReporteEconomicoPorCalidad('refugo')"><span class="btn-icon">🔴</span><strong>Refugo</strong></button></div></div>`;
        document.getElementById('cont-rep').innerHTML = h;
    },

    async renderReporteEconomicoPorCalidad(calidad) {
        const r = await Reportes.generarReporteEconomicoPorCalidad(calidad), finca = await Fincas.getActive(); if (!r || !finca) return;
        const totalG = await Gastos.getTotal(), repG = await Reportes.generarReporteEconomicoGlobal(), bNetoT = repG.valorTotal - totalG, comp = finca.comprador || {};
        let h = `<div class="reporte-container"><div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:25px;"><h2 style="margin:0; color:var(--p-cork); font-weight:800;">⭐ Liq. ${r.nombreCalidad}</h2><button class="btn btn-outline" style="height:40px; padding:0 15px; border-radius:10px;" onclick="App.exportarPDF('calidad')">📄 PDF</button></div>${App._getDualHeaderHtml(finca.nombre, finca.propietario||'-', finca.cif||'-', comp.nombreEmpresa||'-', comp.cifNif||'-', comp.representante||'-')}<div class="card-finance" style="background:var(--surface-light); padding:20px;"><small class="text-muted">BENEFICIO NETO CAMP. (GLOBAL)</small><br><strong style="color:var(--accent); font-size:1.4rem;">${bNetoT.toFixed(2)}€</strong></div><div class="card"><div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;"><h4>Detalle por Zonas</h4><small class="text-muted">Precio: ${r.precioQuintal}€/Q</small></div><div class="table-responsive"><table class="reporte-table"><thead><tr><th>Zona</th><th>Sacas</th><th>Q.Neto</th><th style="text-align:right;">Valor</th></tr></thead><tbody>${Object.values(r.reportePorZona).filter(z => z.sacas > 0).map(z => `<tr><td><strong>${z.nombre}</strong></td><td>${z.sacas}</td><td><strong>${z.neto.toFixed(2)}</strong></td><td style="text-align:right; font-weight:700;">${z.valor.toFixed(2)}€</td></tr>`).join('')}</tbody><tfoot><tr><td>TOTAL</td><td>${r.totales.sacas}</td><td>${r.totales.neto.toFixed(2)}</td><td style="text-align:right; color:var(--p-cork);"><strong>${r.totales.valor.toFixed(2)}€</strong></td></tr></tfoot></table></div></div></div>`;
        document.getElementById('cont-rep').innerHTML = h;
    },

    async renderGraficos() {
        const cont = document.getElementById('cont-rep');
        cont.innerHTML = `<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:25px;"><h2 style="margin:0; color:var(--accent); font-weight:800;">📈 Panel de Gráficos</h2><button class="btn btn-outline" style="height:40px; padding:0 15px; border-radius:10px;" onclick="App.exportarPDF('graficos')">📄 PDF</button></div><div class="graficos-grid"><div class="card"><h4>Evolución 30 días</h4><div style="position:relative; height:220px;"><canvas id="chart-trend"></canvas></div></div><div class="card"><h4>Distribución Calidad</h4><div style="position:relative; height:220px;"><canvas id="chart-quality"></canvas></div></div><div class="card"><h4>Producción por Zona</h4><div style="position:relative; height:220px;"><canvas id="chart-zones"></canvas></div></div><div class="card"><h4>Valor Económico</h4><div style="position:relative; height:220px;"><canvas id="chart-economic"></canvas></div></div></div>`;
        setTimeout(async () => { await Charts.renderTrendChart('chart-trend'); await Charts.renderQualityChart('chart-quality'); await Charts.renderZonesChart('chart-zones'); await Charts.renderEconomicChart('chart-economic'); }, 100);
    },

    async renderAjustes() {
        const main = document.getElementById('app-content'), finca = await Fincas.getActive(); if (!finca) return App.renderFincasManager();
        const comp = finca.comprador || {};
        const precios = finca.precios || {};

        main.innerHTML = `
            <div style="display:flex; align-items:center; gap:12px; margin-bottom:25px;"><div style="width:5px; height:30px; background:var(--p-cork); border-radius:3px;"></div><h2 style="margin:0; border:none; padding:0; color:var(--text-p); font-weight:800;">Ajustes de Finca</h2></div>

            <div class="card" style="border: 2px solid var(--p-cork); border-left: 8px solid var(--p-cork);">
                <div style="display:flex; align-items:center; gap:10px; margin-bottom:15px;"><div style="width:4px; height:20px; background:var(--p-cork); border-radius:2px;"></div><h4 style="margin:0; font-size:0.9rem; text-transform:uppercase;">Datos Propietario</h4></div>
                <div class="form-group"><label>Nombre Explotación</label><input type="text" value="${finca.nombre}" readonly style="opacity:0.6;"></div>
                <div class="form-group"><label>Nombre Propietario</label><input type="text" id="adj-prop" value="${finca.propietario||''}"></div>
                <div class="form-group"><label>Teléfono</label><input type="tel" id="adj-prop-tel" value="${finca.telefono||''}"></div>
            </div>

            <div class="card" style="border: 2px solid var(--accent); border-left: 8px solid var(--accent);">
                <div style="display:flex; align-items:center; gap:10px; margin-bottom:15px;"><div style="width:4px; height:20px; background:var(--accent); border-radius:2px;"></div><h4 style="margin:0; font-size:0.9rem; text-transform:uppercase;">Datos Comprador y Precios</h4></div>
                <div class="form-group"><label>Empresa / Comprador</label><input type="text" id="adj-empresa" value="${comp.nombreEmpresa||''}"></div>
                <div class="form-group"><label>CIF/NIF Comprador</label><input type="text" id="adj-cif" value="${comp.cifNif||''}"></div>
                <div class="form-group"><label>Representante</label><input type="text" id="adj-representante" value="${comp.representante||''}"></div>
                <div class="form-group"><label>Teléfono</label><input type="tel" id="adj-tel" value="${comp.telefono||''}"></div>
                <div class="form-group"><label>Correo Electrónico</label><input type="email" id="adj-email" value="${comp.email||''}"></div>
                <div class="form-group"><label>Dirección Comercial</label><input type="text" id="adj-direccion" value="${comp.direccion||''}"></div>

                <h5 style="margin: 15px 0 10px 0; color: var(--accent); border-bottom: 1px solid var(--border); padding-bottom: 5px;">Precios de Mercado (€/Q)</h5>
                <div class="form-group"><label>Precio 1ª</label><input type="number" step="0.01" id="adj-p1" value="${precios.primera?.precioQuintal || ''}"></div>
                <div class="form-group"><label>Precio Bornizo</label><input type="number" step="0.01" id="adj-pb" value="${precios.bornizo?.precioQuintal || ''}"></div>
                <div class="form-group"><label>Precio Refugo</label><input type="number" step="0.01" id="adj-pr" value="${precios.refugo?.precioQuintal || ''}"></div>

                <button class="btn btn-primary" style="width:100%; margin-top:20px;" onclick="App._saveActiveFincaSettings()">💾 Guardar Ajustes</button>
            </div>

            <div class="reportes-selector-grid" style="margin-top:20px;">
                <button class="report-select-btn theme-zona" onclick="location.hash='/gastos'"><span class="btn-icon">💸</span><strong>Control Gastos</strong></button>
                <button class="report-select-btn theme-global" onclick="location.hash='/fincas'"><span class="btn-icon">📍</span><strong>Gestor Fincas</strong></button>
            </div>

            <div class="card text-center" style="border-top: 2px solid var(--p-cork); margin-top:30px; padding:30px;"><img src="icons/logo-header.png" style="width:140px; margin-bottom:20px;"><p style="font-weight:800; color:var(--p-cork);">Chamorro´s Cork Manager v6.2.4</p></div>`;
    },

    async renderFincasManager() {
        const main = document.getElementById('app-content'), allFincas = await Fincas.list(), activeId = await Fincas.getActiveId();
        main.innerHTML = `
            <div style="display:flex; align-items:center; gap:12px; margin-bottom:25px;">
                <div style="width:5px; height:30px; background:var(--accent); border-radius:3px;"></div>
                <h2 style="margin:0; border:none; padding:0; font-weight:800;">Gestión de Fincas</h2>
            </div>

            <div class="reportes-selector-grid">
                <button class="report-select-btn theme-calidad" onclick="App._showFincaForm()" style="background: linear-gradient(135deg, rgba(127,176,105,0.5) 0%, rgba(141,179,105,0.5) 100%); border:none; box-shadow: 0 4px 15px rgba(127,176,105,0.15); min-height: 80px; padding: 10px;">
                    <span class="btn-icon" style="font-size:1.6rem; margin-bottom:2px; height:45px; width:45px;">➕</span>
                    <strong style="font-size:0.85rem;">Nueva Finca</strong>
                </button>
                <button class="report-select-btn theme-global" onclick="document.getElementById('import-f-mgr').click()" style="background: linear-gradient(135deg, rgba(160,103,58,0.5) 0%, rgba(212,163,115,0.5) 100%); border:none; box-shadow: 0 4px 15px rgba(160,103,58,0.15); min-height: 80px; padding: 10px;">
                    <span class="btn-icon" style="font-size:1.6rem; margin-bottom:2px; height:45px; width:45px;">📥</span>
                    <strong style="font-size:0.85rem;">Importar</strong>
                </button>
                <button class="report-select-btn theme-econ" onclick="Export.exportBackup()" style="background: linear-gradient(135deg, rgba(44,62,80,0.5) 0%, rgba(76,161,175,0.5) 100%); border:none; box-shadow: 0 4px 15px rgba(44,62,80,0.15); min-height: 80px; padding: 10px;">
                    <span class="btn-icon" style="font-size:1.6rem; margin-bottom:2px; height:45px; width:45px;">📄</span>
                    <strong style="font-size:0.85rem;">Exportar Todo</strong>
                </button>
            </div>

            <div id="fincas-list-container" style="margin-top:25px; display:flex; flex-direction:column; gap:15px;">
                ${allFincas.map(f => {
                    const isActive = Number(f.id) === Number(activeId);
                    return `
                    <div class="card finca-card ${isActive ? 'active-finca' : ''}"
                         onclick="App._selectFincaForLoad(${f.id}, '${f.nombre}')"
                         style="display:flex; align-items:center; padding:20px; border-left:8px solid ${isActive ? 'var(--accent)' : 'var(--border)'}; transition: transform 0.2s;">

                        <div style="flex:1;">
                            <strong style="font-size:1.2rem; color:white;">${f.nombre}</strong><br>
                            <small class="text-muted">Prop: ${f.propietario || '-'}</small>
                        </div>

                        <div style="display:flex; gap:12px; align-items:center;">
                            <button class="btn-modern-action" onclick="event.stopPropagation(); Export.exportBackup([${f.id}])" title="Exportar" style="background: rgba(255,255,255,0.05); border-radius:12px; width:45px; height:45px; display:flex; align-items:center; justify-content:center; border:1px solid rgba(255,255,255,0.1); cursor:pointer;">
                                <span style="font-size:1.4rem;">💾</span>
                            </button>
                            <button class="btn-modern-action" onclick="event.stopPropagation(); App._showFincaForm(${f.id})" title="Editar" style="background: rgba(255,255,255,0.05); border-radius:12px; width:45px; height:45px; display:flex; align-items:center; justify-content:center; border:1px solid rgba(255,255,255,0.1); cursor:pointer;">
                                <span style="font-size:1.4rem;">✏️</span>
                            </button>
                            <button class="btn-modern-action" onclick="event.stopPropagation(); App._deleteFinca(${f.id}, '${f.nombre}')" title="Borrar" style="background: rgba(255,77,77,0.1); border-radius:12px; width:45px; height:45px; display:flex; align-items:center; justify-content:center; border:1px solid rgba(255,77,77,0.2); cursor:pointer; color:#ff4d4d;">
                                <span style="font-size:1.4rem;">🗑️</span>
                            </button>
                        </div>
                    </div>`;
                }).join('')}
            </div>

            <div id="load-finca-footer" style="display:none; margin-top:20px;">
                <button id="btn-load-finca" class="btn btn-primary" style="height:65px; font-weight:900; font-size:1.1rem; border-radius:15px; box-shadow:0 10px 30px rgba(127,176,105,0.3); width:100%;">
                    🚀 CARGAR FINCA SELECCIONADA
                </button>
            </div>

            <button class="btn btn-outline mt-2" onclick="location.hash='/ajustes'" style="width:100%;">Volver a Ajustes</button>
            <input type="file" id="import-f-mgr" accept=".json" style="display:none">
        `;
        document.getElementById('import-f-mgr').onchange = async (e) => { if (e.target.files[0]) await App._handleImportFile(e.target.files[0]); };
        document.getElementById('btn-load-finca').onclick = () => { if (this._pendingFincaId) App._confirmSwitchFinca(this._pendingFincaId, this._pendingFincaNombre); };
    },

    _selectFincaForLoad(id, nombre) {
        document.querySelectorAll('.finca-card').forEach(el => el.classList.remove('selected-finca'));
        this._pendingFincaId = id; this._pendingFincaNombre = nombre;
        document.getElementById('load-finca-footer').style.display = 'block';
    },

    async _confirmSwitchFinca(newId, nombre) { if (confirm(`¿Cargar finca "${nombre}"?`)) { await Fincas.setActiveId(newId); location.reload(); } },

    async _handleImportFile(file) {
        try {
            App.toast('Analizando backup...'); const data = await Export.parseBackupFile(file); if (!data || !data.fincas) throw new Error("Inválido");
            for (const fD of data.fincas) {
                const existing = (await Fincas.list()).find(f => f.nombre === fD.info.nombre);
                if (existing) { if (!confirm(`La finca "${fD.info.nombre}" ya existe en el sistema. ¿Desea SOBREESCRIBIRLA?`)) continue; await Fincas.delete(existing.id); }
                await Export.saveImportedFincaData(fD);
            }
            App.toast('✅ Importación completada'); setTimeout(() => location.reload(), 1000);
        } catch (e) { App.toastError(e.message); }
    },

    async _deleteFinca(id, nombre) { if (confirm(`¿Borrar permanentemente ${nombre}?`)) { await Fincas.delete(id); location.reload(); } },

    async _showFincaForm(id = null) {
        let f = id ? await Fincas.get(id) : { nombre: '', propietario: '', cif: '', direccion: '', telefono: '', email: '' };
        const main = document.getElementById('app-content');
        main.innerHTML = `
            <div class="card">
                <h3>${id?'Editar':'Nueva'} Finca</h3>
                <form id="form-finca">
                    <div class="form-group"><label>Nombre de la Finca*</label><input type="text" id="f-nom" value="${f.nombre}" required></div>
                    <div class="form-group"><label>Titular / Propietario*</label><input type="text" id="f-prop" value="${f.propietario}" required></div>
                    <div class="form-group"><label>DNI / CIF</label><input type="text" id="f-cif" value="${f.cif || ''}"></div>
                    <div class="form-group"><label>Dirección</label><input type="text" id="f-dir" value="${f.direccion || ''}"></div>
                    <div class="grid-2">
                        <div class="form-group"><label>Teléfono</label><input type="tel" id="f-tel" value="${f.telefono || ''}"></div>
                        <div class="form-group"><label>Correo Electrónico</label><input type="email" id="f-email" value="${f.email || ''}"></div>
                    </div>
                    <button type="submit" class="btn btn-primary mt-1">💾 Guardar Finca</button>
                    <button type="button" class="btn btn-outline mt-1" onclick="App.renderFincasManager()">Cancelar</button>
                </form>
            </div>`;
        document.getElementById('form-finca').onsubmit = async (e) => {
            e.preventDefault();
            const dS = {
                ...f,
                nombre: document.getElementById('f-nom').value.trim(),
                propietario: document.getElementById('f-prop').value.trim(),
                cif: document.getElementById('f-cif').value.trim(),
                direccion: document.getElementById('f-dir').value.trim(),
                telefono: document.getElementById('f-tel').value.trim(),
                email: document.getElementById('f-email').value.trim()
            };
            await Fincas.save(dS); App.toast("✅ Éxito"); await App.renderFincasManager();
        };
    },

    async _saveActiveFincaSettings() {
        const finca = await Fincas.getActive(); if (!finca) return;
        finca.propietario = document.getElementById('adj-prop').value;
        finca.telefono = document.getElementById('adj-prop-tel').value;
        finca.comprador = {
            nombreEmpresa: document.getElementById('adj-empresa').value,
            cifNif: document.getElementById('adj-cif').value,
            representante: document.getElementById('adj-representante').value,
            direccion: document.getElementById('adj-direccion').value,
            telefono: document.getElementById('adj-tel').value,
            email: document.getElementById('adj-email').value
        };

        // Guardar precios
        finca.precios = {
            primera: { precioQuintal: parseFloat(document.getElementById('adj-p1').value) || 0 },
            bornizo: { precioQuintal: parseFloat(document.getElementById('adj-pb').value) || 0 },
            refugo: { precioQuintal: parseFloat(document.getElementById('adj-pr').value) || 0 }
        };

        await Fincas.save(finca); App.toast("✅ Ajustes guardados");
    },

    openManualZonas() { window.open('manual-zonas.html', 'Manual', 'width=900,height=800'); },

    async exportarPDF(tipo) {
        const finca = await Fincas.getActive(), ahora = new Date().toLocaleString('es-ES');
        let titulo = "", contenidoHtml = "";
        const titulos = { 'global': 'Informe Global de Campaña', 'economico': 'Informe Económico de Campaña', 'zona': 'Informe de Producción por Zona', 'calidad': 'Informe de Liquidación por Calidad', 'lista': 'Listado de Pesadas', 'graficos': 'Panel de Análisis Gráfico' };
        titulo = titulos[tipo] || "Informe Detallado";
        if (tipo === 'lista') { const listEl = document.querySelector('.lista-detallada'); contenidoHtml = listEl ? listEl.innerHTML : ""; }
        else if (tipo === 'graficos') {
            const originalCont = document.getElementById('cont-rep');
            if (originalCont) {
                const clone = originalCont.cloneNode(true);
                originalCont.querySelectorAll('canvas').forEach((canv, idx) => { const img = document.createElement('img'); img.src = canv.toDataURL('image/png'); img.style.width = '100%'; img.style.height = 'auto'; img.style.display = 'block'; clone.querySelectorAll('canvas')[idx].parentNode.replaceChild(img, clone.querySelectorAll('canvas')[idx]); });
                contenidoHtml = clone.innerHTML;
            }
        } else { const contRep = document.getElementById('cont-rep'); contenidoHtml = contRep ? contRep.innerHTML : ""; }
        if (!contenidoHtml) { App.toastError("No hay contenido"); return; }
        const printContainer = document.createElement('div');
        printContainer.style.position = 'absolute'; printContainer.style.left = '-9999px'; printContainer.style.width = '800px';
        printContainer.innerHTML = contenidoHtml; document.body.appendChild(printContainer);
        printContainer.querySelectorAll('button, select, .reporte-header, h2').forEach(el => el.remove());
        printContainer.querySelectorAll('.card-finance, .card, .entity-card').forEach(el => { el.style.background = 'white'; el.style.color = '#333'; el.style.border = '0.5pt solid #eee'; el.style.boxShadow = 'none'; });

        const comp = finca.comprador || {};
        const plantilla = `<div class="pdf-export-container" style="font-family:Helvetica,Arial; padding:10mm; background:#fff; color:#333; width:800px;"><div style="text-align:center; margin-bottom:8mm;"><img src="icons/logo-header.png" style="width:55mm; margin:0 auto;"></div><div style="display:table; width:100%; border-bottom:0.5pt solid #eee; padding-bottom:8mm; margin-bottom:10mm;"><div style="display:table-row;"><div style="display:table-cell; width:48%; vertical-align:top;"><div style="font-size:7pt; color:#a0673a; font-weight:bold; text-transform:uppercase;">Emisor / Vendedor</div><div style="font-size:12pt; font-weight:bold;">${finca.nombre.toUpperCase()}</div><div style="font-size:9pt;">Titular: ${finca.propietario||'-'}<br>CIF/NIF: ${finca.cif||'-'}<br>${finca.direccion||'-'}</div></div><div style="display:table-cell; width:4%;"></div><div style="display:table-cell; width:48%; vertical-align:top;"><div style="font-size:7pt; color:#a0673a; font-weight:bold; text-transform:uppercase;">Receptor / Comprador</div><div style="font-size:12pt; font-weight:bold;">${comp.nombreEmpresa?.toUpperCase()||'-'}</div><div style="font-size:9pt;">CIF: ${comp.cifNif||'-'}<br>Ref: ${comp.representante||'-'}<br>${comp.direccion||'-'}</div></div></div></div><div style="text-align:center; margin-bottom:10mm;"><h1 style="font-size:18pt; border-bottom:2pt solid #a0673a; display:inline-block; padding:0 10mm 2mm 10mm;">${titulo.toUpperCase()}</h1><div style="font-size:8pt; color:#999; margin-top:3mm;">Documento Oficial • Generado el ${ahora}</div></div><div class="pdf-content" style="padding-bottom:20mm;">${printContainer.innerHTML}</div><div style="margin-top:10mm; border-top:0.5pt solid #eee; padding-top:5mm; text-align:center; font-size:7pt; color:#bbb;">Chamorro´s Cork Manager v6.1.5 • Liquidación Oficial • Sdog Farm Software Factory</div></div><style>.pdf-export-container * { background-color:transparent !important; color:#333 !important; box-shadow:none !important; } .pdf-export-container table { width:100%; border-collapse:collapse; margin:5mm 0; border:0.1pt solid #eee; page-break-inside:auto; } .pdf-export-container tr { page-break-inside:avoid; } .pdf-export-container th { background-color:#fafafa !important; border-bottom:0.8pt solid #a0673a !important; text-align:left; padding:3mm 2mm; font-size:8pt; font-weight:bold; text-transform:uppercase; color:#a0673a !important; } .pdf-export-container td { border-bottom:0.1pt solid #f0f0f0 !important; padding:3mm 2mm; font-size:9pt; } .pdf-export-container .card, .pdf-export-container .card-finance, .pdf-export-container .entity-card { background:#fff !important; border:0.5pt solid #eee !important; padding:6mm; margin-bottom:8mm; border-radius:2mm; page-break-inside:avoid; } .pdf-export-container h3, .pdf-export-container h4 { color:#000 !important; font-size:10pt; margin-bottom:5mm; text-transform:uppercase; border-left:4pt solid #a0673a; padding-left:3mm; } .pdf-export-container .total-neto { font-size:15pt !important; color:#4a7c2c !important; font-weight:900 !important; } .pdf-export-container .q-pill { display:inline-block; padding:1mm 2mm; border:0.2pt solid #ccc !important; border-radius:1mm; font-size:8pt; font-weight:bold; } .pdf-export-container img { max-width:100%; height:auto; display:block; margin:5mm auto; }</style>`;
        const opt = { margin:[15,10,20,10], filename:'Cork_'+tipo+'_'+finca.nombre.replace(/\s/g,'_')+'.pdf', image:{type:'jpeg',quality:1}, html2canvas:{scale:2, logging:false, useCORS:true, width:800}, jsPDF:{unit:'mm',format:'a4',orientation:'portrait'}, pagebreak:{mode:['avoid-all','css','legacy']} };
        try { if (window.isNative) await App._exportNativePDF(tipo, plantilla); else await html2pdf().set(opt).from(plantilla).toPdf().get('pdf').then(() => document.body.removeChild(printContainer)).save(); } catch (e) { App.toastError("Error al generar PDF"); }
    },

    async _exportNativePDF(tipo, html) {
        try {
            const pdf = await html2pdf().from(html).set({ margin:0, html2canvas:{scale:2} }).outputPdf('datauristring');
            const data = pdf.split(',')[1];
            const fileName = `Reporte_${tipo}_${Date.now()}.pdf`;
            const saved = await Capacitor.Plugins.Filesystem.writeFile({ path: fileName, data: data, directory: 'CACHE' });
            await Capacitor.Plugins.Share.share({ url: saved.uri });
        } catch (e) { console.error(e); throw e; }
    },

    async _syncZonasFromFolder() { App.toast("Iniciando..."); try { const res = await Zonas.syncFromPdfDirectory(); App.toast(`✅ Éxito: +${res.agregadas}`); if(location.hash==='/zonas') App.route(); } catch(e){ App.toastError("Fallo"); } },
    async clearAll() { if (confirm('¿BORRAR TODO?')) { await db.clearAllData(); location.reload(); } },

    async renderGastosManager() {
        const main = document.getElementById('app-content'), gastos = await Gastos.list(), total = await Gastos.getTotal();
        main.innerHTML = `<div class="card"><div style="display:flex; justify-content:space-between; align-items:center;"><h3>Control Gastos</h3><div style="font-weight:800; color:#ff4d4d; font-size:1.2rem;">Total: ${total.toFixed(2)}€</div></div><button class="btn btn-primary mt-1" onclick="App._showGastoForm()">➕ Añadir Gasto</button></div><div class="lista-detallada">${gastos.length ? gastos.map(g => `<div class="list-item-detallado" onclick="App._showGastoForm(${g.id})"><div><strong>${g.concepto || 'Sin concepto'}</strong><br><small class="text-muted">${g.categoria} | ${new Date(g.fecha).toLocaleDateString()}</small></div><div style="text-align:right;"><strong style="color:#ff4d4d;">-${parseFloat(g.monto).toFixed(2)}€</strong></div></div>`).join('') : '<p class="text-center text-muted">No hay gastos registrados.</p>'}</div><button class="btn btn-outline" onclick="location.hash='/ajustes'">Volver a Ajustes</button>`;
    },

    async _showGastoForm(id = null) {
        const categories = Gastos.getCategories(); let d = id ? await Gastos.get(id) : { concepto:'', monto:'', categoria:'Otros', fecha:new Date().toISOString().split('T')[0] };
        const main = document.getElementById('app-content');
        main.innerHTML = `<div class="card"><h3>${id?'Editar':'Nuevo'} Gasto</h3><form id="form-gasto" onsubmit="App._handleGastoSubmit(event, ${id})"><div class="form-group"><label>Concepto</label><input type="text" id="g-con" value="${d.concepto}" required></div><div class="grid-2"><div class="form-group"><label>Monto (€)</label><input type="number" step="0.01" id="g-mon" value="${d.monto}" required></div><div class="form-group"><label>Fecha</label><input type="date" id="g-fec" value="${d.fecha}" required></div></div><div class="form-group"><label>Categoría</label><select id="g-cat">${categories.map(c => `<option value="${c}" ${d.categoria===c?'selected':''}>${c}</option>`).join('')}</select></div><div class="form-actions mt-1"><button type="submit" class="btn btn-primary">💾 Guardar Gasto</button>${id ? `<button type="button" class="btn btn-danger mt-1" onclick="App._deleteGasto(${id})">🗑️ Eliminar</button>` : ''}<button type="button" class="btn btn-outline mt-1" onclick="App.renderGastosManager()">Cancelar</button></div></form></div>`;
    },

    async _handleGastoSubmit(e, id) { e.preventDefault(); try { const dS = { id: id?Number(id):undefined, concepto: document.getElementById('g-con').value.trim(), monto: document.getElementById('g-mon').value, categoria: document.getElementById('g-cat').value, fecha: document.getElementById('g-fec').value }; await Gastos.save(dS); App.toast('✅ Gasto guardado'); await App.renderGastosManager(); } catch(err){ App.toastError(err.message); } },

    async _deleteGasto(id) { if (confirm("¿Eliminar gasto?")) { await Gastos.delete(id); App.toast('✅ Eliminado'); App.renderGastosManager(); } },

    async renderImportarPdf() {
        const main = document.getElementById('app-content');
        main.innerHTML = `
            <div class="card animate-in">
                <h3>📥 Importar Zonas (SIGPAC/Catastro)</h3>
                <p class="text-muted small">Seleccione uno o varios archivos PDF oficiales del Catastro para extraer automáticamente los datos de las parcelas.</p>
                <input type="file" id="pdf-input" accept=".pdf" multiple class="mt-1" style="height: auto; padding: 20px 0;">
                <div id="pdf-preview-container" class="mt-2" style="display:none;">
                    <h4>Zonas Detectadas</h4>
                    <div id="pdf-items-list"></div>
                    <button id="btn-save-imported-zonas" class="btn btn-primary mt-2">💾 Guardar Zonas en Base de Datos</button>
                </div>
            </div>
            <button class="btn btn-outline" onclick="location.hash='/zonas'">Volver a Zonas</button>
        `;

        const input = document.getElementById('pdf-input'), container = document.getElementById('pdf-preview-container'), list = document.getElementById('pdf-items-list'), btnSave = document.getElementById('btn-save-imported-zonas');
        let zonesToSave = [];

        input.onchange = async (e) => {
            if (!e.target.files.length) return;
            zonesToSave = []; list.innerHTML = '<div class="loader">Procesando documentos...</div>'; container.style.display = 'block';

            for (const file of e.target.files) {
                try {
                    const data = await parsePdfCatastro(file);
                    if (data) {
                        data._tempId = Math.random().toString(36).substr(2, 9);
                        zonesToSave.push(data);
                    }
                } catch (err) { App.toastError(`Error en ${file.name}`); }
            }

            if (zonesToSave.length === 0) { list.innerHTML = '<p class="text-center text-muted">No se detectaron datos válidos en los PDFs.</p>'; return; }

            list.innerHTML = zonesToSave.map(z => `
                <div class="card" style="background: rgba(255,255,255,0.03); margin-bottom: 10px; border-left: 4px solid var(--p-cork);">
                    <div style="font-size: 0.8rem; margin-bottom: 5px; color: var(--text-s);">Ref: ${z.refCatastral}</div>
                    <strong>Pol. ${z.poligono} / Par. ${z.parcela}</strong>
                    <input type="text" placeholder="Asignar nombre (ej: Las Solanas)" id="name-${z._tempId}" value="${z.nombre || ''}" class="mt-1" style="height: 45px; font-size: 0.9rem;">
                </div>
            `).join('');
        };

        btnSave.onclick = async () => {
            for (const z of zonesToSave) {
                z.nombre = document.getElementById(`name-${z._tempId}`).value.trim() || `Zona ${z.poligono}/${z.parcela}`;
                delete z._tempId;
                await Zonas.save(z);
            }
            App.toast(`✅ ${zonesToSave.length} zonas añadadidas correctamente`);
            location.hash = '/zonas';
        };
    }
};

window.App = App;
App.init();
