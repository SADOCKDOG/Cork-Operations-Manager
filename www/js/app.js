/**
 * App.js - Router y Orquestador (Version 5.9.3 - Multi-finca, Ediciones, Sincronización)
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
        '/importar-pdf': 'renderImportarPdf'
    },

    async init() {
        try {
            console.log("App: Iniciando v5.9.3...");
            window.addEventListener('hashchange', () => App.route());
            window.addEventListener('fincaChanged', () => {
                App.updateHeader().then(() => App.route());
            });
            this._activeObjectUrls = [];

            await window.dbPromise;
            console.log("App: Base de datos lista.");

            await App.updateHeader();
            await App.route();
        } catch (error) {
            console.error("Error crítico durante la inicialización:", error);
            const content = document.getElementById('app-content');
            if (content) {
                content.innerHTML = `
                    <div class="card error-card">
                        <h2>Error de Inicio</h2>
                        <p>No se pudo iniciar la aplicación correctamente.</p>
                        <code>${error.message}</code>
                        <button class="btn btn-primary mt-1" onclick="location.reload()">Reintentar</button>
                    </div>`;
            }
        }
    },

    async updateHeader() {
        const finca = await Fincas.getActive();
        const headerEl = document.getElementById('nombre-finca-header');

        if (finca) {
            headerEl.innerHTML = `<span onclick="location.hash='/fincas'" style="cursor:pointer">📍 ${finca.nombre}</span>`;
        } else {
            headerEl.innerHTML = `<span onclick="location.hash='/fincas'" style="cursor:pointer">➕ Crear Finca</span>`;
        }
    },

    async route() {
        this._activeObjectUrls.forEach(url => URL.revokeObjectURL(url));
        this._activeObjectUrls = [];
        const hash = window.location.hash.slice(1) || '/';
        let path = hash, id = null, action = null;

        if (hash.startsWith('/zona/')) {
            const parts = hash.split('/'); path = '/zona'; id = parts[2]; if (parts[3] === 'editar') action = 'editar';
        } else if (hash.startsWith('/pesada/')) {
            const parts = hash.split('/'); path = '/pesada'; id = parts[2]; if (parts[3] === 'editar') action = 'editar';
        }

        document.querySelectorAll('.nav-item').forEach(el => {
            const base = (path === '/zona' || path === '/importar-pdf') ? '/zonas' : path;
            el.classList.toggle('active', el.getAttribute('href') === `#${base}`);
        });

        const main = document.getElementById('app-content');
        const allFincas = await Fincas.list();
        if (allFincas.length === 0) {
            return await App.renderWelcomeWizard();
        }

        const fincaId = await Fincas.getActiveId();
        if (!fincaId && path !== '/fincas') {
            return await App.renderFincasManager();
        }

        main.innerHTML = '<div class="loader">Cargando...</div>';

        try { 
            if (path === '/zona' && id) {
                if (action === 'editar' || id === 'nueva') await App.renderFormZona(id === 'nueva' ? null : id);
                else await App.renderFichaZona(id);
            } else if (path === '/pesada' && id && action === 'editar') {
                await App.renderFormPesada(id);
            } else if (App.routes[path]) {
                await App[App.routes[path]]();
            } else {
                main.innerHTML = '<h2>404</h2>';
            }
        } catch (error) { 
            console.error(error);
            main.innerHTML = `<div class="card error-card"><h2>Error</h2><p>${error.message}</p></div>`;
        }
    },

    async renderWelcomeWizard() {
        const main = document.getElementById('app-content');
        if (!main) return;
        main.innerHTML = `
            <div class="card text-center welcome-wizard">
                <img src="icons/Chamorro´s Cork Manager.png" style="width: 120px; margin-bottom: 20px;">
                <h1>¡Bienvenido!</h1>
                <p>Gracias por elegir <strong>Chamorro´s Cork Manager</strong>.</p>
                <p class="text-muted">Para comenzar a gestionar tus sacas de corcho, primero necesitas crear o importar una finca.</p>

                <div class="wizard-actions mt-2" style="display:flex; flex-direction:column; gap:10px;">
                    <button class="btn btn-primary" onclick="App._showFincaForm()">➕ Crear mi primera finca</button>
                    <button class="btn btn-secondary" onclick="document.getElementById('import-wizard').click()">📥 Importar desde un backup</button>
                    <input type="file" id="import-wizard" accept=".json" style="display:none">
                </div>
            </div>
        `;
        const input = document.getElementById('import-wizard');
        if (input) {
            input.onchange = async (e) => {
                if (e.target.files[0]) await App._handleImportFile(e.target.files[0]);
            };
        }
    },

    toast(msg) {
        const container = document.getElementById('toast-container');
        const t = document.createElement('div'); t.className = 'toast'; t.textContent = msg;
        container.appendChild(t); setTimeout(() => t.remove(), 3000);
    },

    toastError(msg) {
        const container = document.getElementById('toast-container');
        const t = document.createElement('div'); t.className = 'toast error'; t.textContent = `❌ ${msg}`;
        container.appendChild(t); setTimeout(() => t.remove(), 4000);
    },

    async renderDashboard() {
        const main = document.getElementById('app-content');
        main.innerHTML = `
            <div id="resumenHoy" class="card text-center">
                <h2 style="text-align: center; margin-bottom: 25px;">📅 Resumen Hoy</h2>
                <div class="dashboard-summary">
                    <div class="summary-item">
                        <div class="summary-title" style="color: #7fb069; font-size: 1.6rem; margin-bottom: 5px;">⭐ 1ª Calidad</div>
                        <div class="summary-val" style="font-size: 2.2rem; font-weight: 800; letter-spacing: -1px;">
                            <span id="kgPrimera">0</span> <small style="font-size: 1rem; color: var(--text-s);">kg</small> |
                            <span id="qPrimera">0.0</span> <small style="font-size: 1rem; color: var(--text-s);">Q</small>
                        </div>
                    </div>
                    <hr class="summary-divider">
                    <div class="summary-item">
                        <div class="summary-title" style="color: #d4a373; font-size: 1.6rem; margin-bottom: 5px;">🟡 Bornizo</div>
                        <div class="summary-val" style="font-size: 2.2rem; font-weight: 800; letter-spacing: -1px;">
                            <span id="kgBornizo">0</span> <small style="font-size: 1rem; color: var(--text-s);">kg</small> |
                            <span id="qBornizo">0.0</span> <small style="font-size: 1rem; color: var(--text-s);">Q</small>
                        </div>
                    </div>
                    <hr class="summary-divider">
                    <div class="summary-item">
                        <div class="summary-title" style="color: #ff4d4d; font-size: 1.6rem; margin-bottom: 5px;">🔴 Refugo</div>
                        <div class="summary-val" style="font-size: 2.2rem; font-weight: 800; letter-spacing: -1px;">
                            <span id="kgRefugo">0</span> <small style="font-size: 1rem; color: var(--text-s);">kg</small> |
                            <span id="qRefugo">0.0</span> <small style="font-size: 1rem; color: var(--text-s);">Q</small>
                        </div>
                    </div>
                    <hr class="summary-divider" style="border-top: 2px solid var(--p-cork); opacity: 0.5;">
                    <div class="summary-item total">
                        <div class="summary-title" style="font-size: 1.1rem; text-transform: uppercase; letter-spacing: 2px; color: var(--text-s);">TOTAL (HOY)</div>
                        <div class="summary-val" style="font-size: 2.8rem; font-weight: 900; color: var(--p-cork); letter-spacing: -2px;">
                            <span id="kgTotal">0</span> <small style="font-size: 1.2rem; opacity: 0.7;">kg</small> |
                            <span id="qTotal">0.0</span> <small style="font-size: 1.2rem; opacity: 0.7;">Q</small>
                        </div>
                    </div>
                </div>
                <p id="pesadasHoyCount" class="text-muted" style="margin-top: 25px; font-size: 1.1rem; font-weight: bold; border-top: 1px solid var(--border); padding-top: 15px;"></p>
            </div>
            <button class="btn btn-primary" onclick="location.hash='/nueva'">➕ NUEVA PESADA</button>
            <div class="card"><h3>Últimas Pesadas</h3><div id="recent-list" class="lista-detallada"></div></div>
        `;
        await App.actualizarResumenHoy(); await App.renderUltimasPesadas();
    },

    async actualizarResumenHoy() {
        const hoy = new Date().toISOString().split('T')[0];
        const pesadas = (await Pesadas.list()).filter(p => p.fecha.startsWith(hoy));
        const totales = App._calculateQualityTotals(pesadas);
        document.getElementById('kgPrimera').textContent = Math.round(totales.primera.kg);
        document.getElementById('qPrimera').textContent = totales.primera.quintales.toFixed(1);
        document.getElementById('kgBornizo').textContent = Math.round(totales.bornizo.kg);
        document.getElementById('qBornizo').textContent = totales.bornizo.quintales.toFixed(1);
        document.getElementById('kgRefugo').textContent = Math.round(totales.refugo.kg);
        document.getElementById('qRefugo').textContent = totales.refugo.quintales.toFixed(1);
        const kgTotal = totales.primera.kg + totales.bornizo.kg + totales.refugo.kg;
        const qTotal = totales.primera.quintales + totales.bornizo.quintales + totales.refugo.quintales;
        document.getElementById('kgTotal').textContent = Math.round(kgTotal);
        document.getElementById('qTotal').textContent = qTotal.toFixed(1);
        document.getElementById('pesadasHoyCount').textContent = `${pesadas.length} sacas hoy.`;
    },

    _calculateQualityTotals(pesadas) {
        const totales = { primera: { kg: 0, quintales: 0 }, bornizo: { kg: 0, quintales: 0 }, refugo: { kg: 0, quintales: 0 } };
        pesadas.forEach(p => {
            ['primera', 'bornizo', 'refugo'].forEach(cal => {
                totales[cal].kg += p.pesadasPorCalidad[cal]?.kg || 0;
                totales[cal].quintales += p.pesadasPorCalidad[cal]?.quintales || 0;
            });
        });
        return totales;
    },

    async renderUltimasPesadas() {
        const pesadas = (await Pesadas.list()).slice(0, 5);
        const zonas = await Zonas.list();
        const recentListEl = document.getElementById('recent-list');
        if (!recentListEl) return;
        recentListEl.innerHTML = pesadas.length ? pesadas.map(p => {
            const zona = zonas.find(z => Number(z.id) === Number(p.zonaId));
            const zNom = zona ? (zona.nombre || `P${zona.poligono}/P${zona.parcela}`) : '?';
            let em = '⭐', cal = '1ª Calidad', cl = 'p1';
            if (p.pesadasPorCalidad.bornizo.kg > 0) { em = '🟡'; cal = 'Bornizo'; cl = 'pb'; }
            else if (p.pesadasPorCalidad.refugo.kg > 0) { em = '🔴'; cal = 'Refugo'; cl = 'pr'; }
            const fH = new Date(p.fecha).toLocaleString('es-ES', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
            return `
                <div class="list-item-detallado" onclick="location.hash='/pesada/${p.id}/editar'">
                    <div>
                        <strong>Saca ${p.saca}</strong> (${zNom})<br>
                        <small class="${cl}">${em} ${cal} | ${fH}</small>
                        ${p.notas ? `<br><small class="text-muted"><em>Nota: ${p.notas}</em></small>` : ''}
                    </div>
                    <div class="text-right">
                        <strong>${p.kg.toFixed(1)} kg</strong><br>
                        <small>${p.quintales.toFixed(2)} Q</small>
                    </div>
                </div>`;
        }).join('') : '<p class="text-center text-muted">Sin pesadas.</p>';
    },

    async renderFormPesada(id = null) {
        const main = document.getElementById('app-content');
        const listPesadas = await Pesadas.list();
        const zonas = await Zonas.list();
        const finca = await Fincas.getActive();

        let isEdit = id !== null;
        const maxSaca = listPesadas.length > 0 ? Math.max(...listPesadas.map(p => p.saca || 0)) : 0;

        let data = {
            fecha: new Date().toISOString().split('T')[0],
            saca: maxSaca + 1,
            calidad: 'bornizo',
            tara: 0,
            pesoBruto: ''
        };

        if (isEdit) {
            const p = await Pesadas.get(parseInt(id));
            if (p) {
                data = { ...p, fecha: p.fecha.split('T')[0] };
                if (p.pesadasPorCalidad.primera.kg > 0) data.calidad = 'primera';
                else if (p.pesadasPorCalidad.refugo.kg > 0) data.calidad = 'refugo';
            }
        }
        if (zonas.length === 0) { main.innerHTML = `<div class="card text-center"><p>Necesitas zonas primero.</p><button class="btn btn-primary" onclick="location.hash='/zonas'">Ir a Zonas</button></div>`; return; }
        main.innerHTML = `
            <div class="card">
                <h2>${isEdit ? 'Editar' : 'Nueva'} Pesada</h2>
                <form id="form-pesada">
                    <div class="form-group"><label>Zona</label><select id="p-zona">${zonas.map(z => `<option value="${z.id}" ${data.zonaId == z.id ? 'selected' : ''}>${z.nombre || `Pol.${z.poligono}/Par.${z.parcela}`}</option>`).join('')}</select></div>
                    <div class="grid-2"><div class="form-group"><label>Fecha</label><input type="date" id="p-fecha" value="${data.fecha}"></div><div class="form-group"><label>Nº Saca</label><input type="number" id="p-saca" value="${data.saca}"></div></div>
                    <div class="grid-2"><div class="form-group"><label>Bruto (kg)</label><input type="number" id="p-bruto" value="${data.pesoBruto || ''}"></div><div class="form-group"><label>Tara (kg)</label><input type="number" id="p-tara" value="${data.tara || 0}"></div></div>
                    <div class="card stat-grid" style="display:flex; justify-content:space-around;"><div><div id="calc-neto" class="stat-value">0.0</div><div class="stat-label">Neto (kg)</div></div><div><div id="calc-q" class="stat-value">0.00</div><div class="stat-label">Quintales</div></div></div>
                    <div class="form-group"><label>Calidad</label><div class="quality-selector"><button type="button" class="quality-btn" data-quality="primera">⭐ 1ª Calidad</button><button type="button" class="quality-btn" data-quality="bornizo">🟡 Bornizo</button><button type="button" class="quality-btn" data-quality="refugo">🔴 Refugo</button></div></div>
                    <div class="form-group"><label>Notas</label><textarea id="p-notas">${data.notas || ''}</textarea></div>

                    <button type="submit" class="btn btn-primary">Guardar</button>
                    ${isEdit ? `<button type="button" class="btn btn-danger mt-1" onclick="App._deletePesada(${id})">🗑️ Eliminar Pesada</button>` : ''}
                    <button type="button" class="btn btn-outline mt-1" onclick="history.back()">Cancelar</button>
                </form>
            </div>
        `;
        const inB = document.getElementById('p-bruto'), inT = document.getElementById('p-tara'), up = () => {
            const n = (parseFloat(inB.value) || 0) - (parseFloat(inT.value) || 0);
            document.getElementById('calc-neto').textContent = n.toFixed(1);
            document.getElementById('calc-q').textContent = (n / finca.factorQuintal).toFixed(2);
        };
        inB.oninput = inT.oninput = up; up();
        let selQ = data.calidad;
        const upQ = () => document.querySelectorAll('.quality-btn').forEach(b => b.classList.toggle('selected', b.dataset.quality === selQ));
        document.querySelectorAll('.quality-btn').forEach(b => b.onclick = () => { selQ = b.dataset.quality; upQ(); });
        upQ();
        document.getElementById('form-pesada').onsubmit = async (e) => {
            e.preventDefault();
            const dSave = { id: isEdit ? data.id : undefined, zonaId: document.getElementById('p-zona').value, fecha: document.getElementById('p-fecha').value, saca: document.getElementById('p-saca').value, pesoBruto: inB.value, tara: inT.value, calidad: selQ, notas: document.getElementById('p-notas').value };
            await Pesadas.save(dSave); App.toast('✅ Pesada guardada'); location.hash = '/lista';
        };
    },

    async _deletePesada(id) {
        if (confirm("¿Seguro que desea eliminar esta pesada?")) {
            await Pesadas.delete(id);
            App.toast("✅ Pesada eliminada");
            location.hash = '/lista';
        }
    },

    async renderLista() {
        const main = document.getElementById('app-content');
        const pesadas = await Pesadas.list(); const zonas = await Zonas.list();
        main.innerHTML = `
            <div class="card"><h3>Listado de Pesadas</h3><button class="btn btn-secondary mt-1" onclick="App.exportarPDF('lista')">📄 Exportar a PDF</button></div>
            <div class="lista-detallada">${pesadas.map(p => {
                const z = zonas.find(z => z.id == p.zonaId);
                let em = '⭐', cal = '1ª Calidad', cl = 'p1';
                if (p.pesadasPorCalidad.bornizo.kg > 0) { em = '🟡'; cal = 'Bornizo'; cl = 'pb'; }
                else if (p.pesadasPorCalidad.refugo.kg > 0) { em = '🔴'; cal = 'Refugo'; cl = 'pr'; }
                const fH = new Date(p.fecha).toLocaleString('es-ES', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
                return `
                    <div class="list-item-detallado" onclick="location.hash='/pesada/${p.id}/editar'">
                        <div>
                            <strong>Saca #${p.saca}</strong> (${z ? z.nombre : '?'})<br>
                            <small class="${cl}">${em} ${cal} | ${fH}</small>
                            ${p.notas ? `<br><small class="text-muted"><em>Nota: ${p.notas}</em></small>` : ''}
                        </div>
                        <div class="text-right">
                            <strong>${p.kg.toFixed(1)} kg</strong><br>
                            <small>${p.quintales.toFixed(2)} Q</small>
                        </div>
                    </div>`;
            }).join('')}</div>
        `;
    },

    async renderZonas() {
        const main = document.getElementById('app-content');
        const stats = await Zonas.getStats();
        main.innerHTML = `
            <div class="card">
                <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:10px;">
                    <h3 style="margin:0; border:none; padding:0;">Gestión de Zonas</h3>
                    <div onclick="App.openManualZonas()" style="cursor:pointer; display:flex; align-items:center; gap:5px; color:var(--p-cork); font-weight:bold; font-size:0.85rem; background:rgba(212, 163, 115, 0.1); padding:6px 12px; border-radius:20px; border:1px solid var(--p-cork-dark);">
                        Ayuda ➔ <span style="font-size:1.1rem; filter:drop-shadow(0 0 2px rgba(0,0,0,0.5));">❓</span>
                    </div>
                </div>
                <p class="text-muted" style="font-size:0.9em; margin-bottom:15px;">
                    Resumen de producción por zona. Utilice el botón para añadir nuevas parcelas. El botón de <strong>Ayuda</strong> abre el manual técnico.
                </p>
                <div class="grid-2" style="gap:10px; margin-bottom:15px;">
                    <button class="btn btn-primary" onclick="location.hash='/zona/nueva'">➕ Nueva Zona</button>
                    <button class="btn btn-secondary" onclick="location.hash='/importar-pdf'">📥 Importar PDF</button>
                </div>
            </div>
            ${stats.map(z => {
                const t = z.totalesPorCalidad;
                return `
                <div class="card text-center" onclick="location.hash='/zona/${z.id}'" style="cursor:pointer; padding: 25px;">
                    <strong style="font-size: 1.3rem; display: block; margin-bottom: 10px;">${z.nombre || `P${z.poligono}/P${z.parcela}`}</strong>
                    <small class="text-muted" style="display: block; margin-bottom: 15px;">${z.paraje || ''}</small>
                    <div class="quality-summary-compact" style="grid-template-columns: 1fr 1fr 1fr; gap: 12px;">
                        <div class="q-pill p1" style="font-size: 1rem; padding: 12px; border-width: 2px;">1ª: ${t.primera.quintales.toFixed(2)}Q</div>
                        <div class="q-pill pb" style="font-size: 1rem; padding: 12px; border-width: 2px;">Bo: ${t.bornizo.quintales.toFixed(2)}Q</div>
                        <div class="q-pill pr" style="font-size: 1rem; padding: 12px; border-width: 2px;">Re: ${t.refugo.quintales.toFixed(2)}Q</div>
                    </div>
                </div>`;
            }).join('')}
        `;
    },

    async renderFichaZona(id) {
        const main = document.getElementById('app-content');
        const z = await Zonas.get(parseInt(id));
        if (!z) return location.hash = '/zonas';

        const pesadas = await db.getAllFromIndex('pesadas', 'zonaId', z.id);
        const t = { primera: 0, bornizo: 0, refugo: 0 };
        pesadas.forEach(p => {
            t.primera += p.pesadasPorCalidad.primera.quintales || 0;
            t.bornizo += p.pesadasPorCalidad.bornizo.quintales || 0;
            t.refugo += p.pesadasPorCalidad.refugo.quintales || 0;
        });

        let croquisHtml = z.croquisBlob ? `<div class="croquis-container" style="text-align:center; margin-bottom:20px;"><img src="${URL.createObjectURL(z.croquisBlob)}" style="max-width:100%; border-radius:8px; border:1px solid var(--border);"></div>` : '';

        let cultivosHtml = '';
        if (z.cultivos && z.cultivos.length > 0) {
            cultivosHtml = `
                <div class="card">
                    <h4>CULTIVO</h4>
                    <table class="reporte-table" style="font-size:0.8rem;">
                        <thead><tr><th>Sub</th><th>Cultivo/Aprovechamiento</th><th>Int</th><th>Superficie m²</th></tr></thead>
                        <tbody>
                            ${z.cultivos.map(c => `
                                <tr>
                                    <td>${c.subparcela || c.letra || ''}</td>
                                    <td>${c.cultivo || '-'}</td>
                                    <td>${c.intensidad || ''}</td>
                                    <td>${c.superficie ? Number(c.superficie).toLocaleString('es-ES') : '0'}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>`;
        }

        main.innerHTML = `
            <div class="card">
                <h3 style="margin-bottom:5px;">DATOS DESCRIPTIVOS DEL INMUEBLE</h3>
                <div style="font-size:0.9rem; line-height:1.8;">
                    <p><strong>Referencia catastral:</strong> ${z.refCatastral || '-'}</p>
                    <p><strong>Localización:</strong> Polígono ${z.poligono || '-'} Parcela ${z.parcela || '-'}<br>
                       <span class="text-muted">${z.municipio || '-'}</span></p>
                    <p><strong>Clase:</strong> ${z.clase || '-'}</p>
                    <p><strong>Uso principal:</strong> ${z.usoPrincipal || '-'}</p>
                </div>
                <button class="btn btn-secondary mt-1" onclick="location.hash='/zona/${z.id}/editar'">✏️ Editar Datos Zona</button>
            </div>

            <div class="card">
                <h3>PARCELA CATASTRAL</h3>
                ${croquisHtml}
                <div style="font-size:0.9rem; border-top:1px solid var(--border); padding-top:10px;">
                    <p><strong>Superficie gráfica:</strong> ${z.superficieGrafica ? Number(z.superficieGrafica).toLocaleString('es-ES') + ' m²' : '-'}</p>
                </div>
            </div>

            ${cultivosHtml}

            <div class="card text-center" style="padding: 25px;">
                <h4 style="margin-bottom: 20px;">PRODUCCIÓN ACUMULADA (Quintales)</h4>
                <div class="quality-summary-compact" style="grid-template-columns: 1fr 1fr 1fr; gap: 12px;">
                    <div class="q-pill p1" style="font-size: 1.1rem; padding: 15px; border-width: 2px;">1ª: ${t.primera.toFixed(2)}Q</div>
                    <div class="q-pill pb" style="font-size: 1.1rem; padding: 15px; border-width: 2px;">Bo: ${t.bornizo.toFixed(2)}Q</div>
                    <div class="q-pill pr" style="font-size: 1.1rem; padding: 15px; border-width: 2px;">Re: ${t.refugo.toFixed(2)}Q</div>
                </div>
            </div>

            <div class="card">
                <h4>Estimaciones Corcho</h4>
                <div class="grid-2">
                    <p><strong>Alcornoques:</strong> ${z.alcornoquesEstimados || '-'}</p>
                    <p><strong>Última Saca:</strong> ${z.ultimoDescorche || '-'}</p>
                </div>
                <p><strong>Próxima Saca:</strong> ${z.proximoDescorche || '-'}</p>
            </div>

            <div class="card">
                <h4>Notas</h4>
                <p>${z.notas || 'Sin notas.'}</p>
            </div>

            <button class="btn btn-outline" onclick="location.hash='/zonas'">Volver</button>
            <button class="btn btn-outline mt-1" style="color:#ff4d4d; border-color:#ff4d4d;"
                onclick="App._deleteZona(${z.id}, '${z.nombre || 'esta zona'}')">🗑️ Eliminar Zona</button>
        `;
    },

    async renderFormZona(id = null) {
        const main = document.getElementById('app-content');
        let isEdit = id !== null;
        let data = {
            nombre: '', paraje: '', municipio: '', provincia: '', refCatastral: '',
            poligono: '', parcela: '', superficieGrafica: '', usoPrincipal: '', clase: '',
            alcornoquesEstimados: '', ultimoDescorche: '', proximoDescorche: '', notas: '',
            superficieConstruida: '', anoConstruccion: '', localizacion: ''
        };

        if (isEdit) {
            const z = await Zonas.get(parseInt(id));
            if (z) data = z;
        }

        main.innerHTML = `
            <div class="card">
                <h3>${isEdit ? 'Editar' : 'Nueva'} Zona</h3>
                <form id="form-zona">
                    <div class="form-group"><label>Nombre de la Zona *</label><input type="text" id="z-nom" value="${data.nombre || ''}" required placeholder="Ej: Las Solanas"></div>

                    <h4>Datos Catastrales</h4>
                    <div class="form-group"><label>Referencia Catastral</label><input type="text" id="z-ref" value="${data.refCatastral || ''}"></div>
                    <div class="grid-2">
                        <div class="form-group"><label>Polígono</label><input type="number" id="z-pol" value="${data.poligono || ''}"></div>
                        <div class="form-group"><label>Parcela</label><input type="number" id="z-parcela" value="${data.parcela || ''}"></div>
                    </div>
                    <div class="form-group"><label>Localización (PDF)</label><input type="text" id="z-loc" value="${data.localizacion || ''}"></div>
                    <div class="grid-2">
                        <div class="form-group"><label>Paraje</label><input type="text" id="z-par" value="${data.paraje || ''}"></div>
                        <div class="form-group"><label>Municipio</label><input type="text" id="z-mun" value="${data.municipio || ''}"></div>
                    </div>
                    <div class="grid-2">
                        <div class="form-group"><label>Provincia</label><input type="text" id="z-prov" value="${data.provincia || ''}"></div>
                        <div class="form-group"><label>Clase</label><input type="text" id="z-clase" value="${data.clase || ''}"></div>
                    </div>
                    <div class="grid-2">
                        <div class="form-group"><label>Uso Principal</label><input type="text" id="z-uso" value="${data.usoPrincipal || ''}"></div>
                        <div class="form-group"><label>Superficie Gráfica (m²)</label><input type="number" id="z-sup" value="${data.superficieGrafica || ''}"></div>
                    </div>

                    <hr style="border:0; border-top:1px solid #333; margin:20px 0;">
                    <h4>Información de Explotación</h4>
                    <div class="grid-2">
                        <div class="form-group"><label>Nº Alcornoques (est.)</label><input type="number" id="z-alc" value="${data.alcornoquesEstimados || ''}"></div>
                        <div class="form-group"><label>Última Saca (año)</label><input type="number" id="z-ult" value="${data.ultimoDescorche || ''}"></div>
                    </div>
                    <div class="form-group"><label>Próxima Saca (año)</label><input type="number" id="z-prox" value="${data.proximoDescorche || ''}"></div>
                    <div class="form-group"><label>Notas</label><textarea id="z-notas" rows="3">${data.notas || ''}</textarea></div>

                    <div class="form-actions mt-1">
                        <button type="submit" class="btn btn-primary">💾 Guardar Zona</button>
                        <button type="button" class="btn btn-outline" onclick="history.back()">Cancelar</button>
                    </div>
                </form>
            </div>
        `;

        document.getElementById('form-zona').onsubmit = async (e) => {
            e.preventDefault();
            const dSave = {
                ...data,
                id: isEdit ? data.id : undefined,
                nombre: document.getElementById('z-nom').value.trim(),
                refCatastral: document.getElementById('z-ref').value.trim(),
                poligono: document.getElementById('z-pol').value,
                parcela: document.getElementById('z-parcela').value,
                localizacion: document.getElementById('z-loc').value.trim(),
                paraje: document.getElementById('z-par').value.trim(),
                municipio: document.getElementById('z-mun').value.trim(),
                provincia: document.getElementById('z-prov').value.trim(),
                clase: document.getElementById('z-clase').value.trim(),
                usoPrincipal: document.getElementById('z-uso').value.trim(),
                superficieGrafica: document.getElementById('z-sup').value,
                alcornoquesEstimados: document.getElementById('z-alc').value,
                ultimoDescorche: document.getElementById('z-ult').value,
                proximoDescorche: document.getElementById('z-prox').value,
                notas: document.getElementById('z-notas').value
            };
            await Zonas.save(dSave);
            App.toast('✅ Zona guardada');
            location.hash = '/zonas';
        };
    },

    async _deleteZona(id, nombre) {
        if (confirm(`¿Eliminar la zona "${nombre}"? No debe tener pesadas asociadas.`)) {
            try {
                await Zonas.delete(id);
                App.toast('✅ Zona eliminada');
                location.hash = '/zonas';
            } catch (e) {
                App.toastError(e.message);
            }
        }
    },

    async renderReportesView() {
        const main = document.getElementById('app-content');
        main.innerHTML = `
            <h1>📊 Informes</h1>
            <div class="reportes-menu" style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:20px;">
                <button class="btn-secondary" onclick="App.renderReporteGlobal()">🌍 Global</button>
                <button class="btn-secondary" onclick="App.renderReporteEconomico()">💶 Económico</button>
                <button class="btn-secondary" onclick="App.renderMenuZonasReport()">🌲 Por Zona</button>
                <button class="btn-secondary" onclick="App.renderMenuCalidadesReport()">⭐ Por Calidad</button>
            </div>
            <div id="cont-rep"></div>
        `;
        await App.renderReporteGlobal();
    },

    async renderReporteGlobal() {
        const r = await Reportes.generarReporteGlobalCampaña();
        let h = `
            <div class="reporte-container">
                <h3>Global de Campaña</h3>
                <button class="btn btn-outline mb-1" onclick="App.exportarPDF('global')">📄 PDF Global</button>
                <div class="card" style="background:var(--surface-light);">
                    <h4>Resumen por Calidad (Quintales)</h4>
                    <table class="reporte-table">
                        <thead><tr><th>Calidad</th><th>Quintales</th><th>Sacas</th></tr></thead>
                        <tbody>
                            <tr><td>⭐ 1ª Calidad</td><td>${r.totalesGlobales.primera.quintales.toFixed(2)}</td><td>${r.totalesGlobales.primera.sacas}</td></tr>
                            <tr><td>🟡 Bornizo</td><td>${r.totalesGlobales.bornizo.quintales.toFixed(2)}</td><td>${r.totalesGlobales.bornizo.sacas}</td></tr>
                            <tr><td>🔴 Refugo</td><td>${r.totalesGlobales.refugo.quintales.toFixed(2)}</td><td>${r.totalesGlobales.refugo.sacas}</td></tr>
                        </tbody>
                        <tfoot>
                            <tr><td><strong>TOTAL</strong></td><td><strong>${(r.totalesGlobales.primera.quintales + r.totalesGlobales.bornizo.quintales + r.totalesGlobales.refugo.quintales).toFixed(2)}</strong></td><td><strong>${r.totalesGlobales.primera.sacas + r.totalesGlobales.bornizo.sacas + r.totalesGlobales.refugo.sacas}</strong></td></tr>
                        </tfoot>
                    </table>
                </div>
                <div class="card">
                    <h4>Desglose por Zona (KG)</h4>
                    <table class="reporte-table">
                        <thead><tr><th>Zona</th><th>1ª</th><th>Bo</th><th>Re</th></tr></thead>
                        <tbody>
                            ${Object.values(r.reportePorZona).map(z => `
                                <tr>
                                    <td>${z.nombre}</td>
                                    <td>${Math.round(z.totales.primera.kg)}</td>
                                    <td>${Math.round(z.totales.bornizo.kg)}</td>
                                    <td>${Math.round(z.totales.refugo.kg)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>`;
        document.getElementById('cont-rep').innerHTML = h;
    },

    async renderReporteEconomico() {
        const r = await Reportes.generarReporteEconomicoGlobal();
        if (!r) return;

        let h = `
            <div class="reporte-container">
                <h3>Informe Económico Global</h3>
                <p class="text-muted"><small>Merma por Oreo aplicada: ${r.oreo}%</small></p>
                <button class="btn btn-outline mb-1" onclick="App.exportarPDF('economico')">📄 PDF Económico</button>
                <table class="reporte-table">
                    <thead><tr><th>Calidad</th><th>Q. Bruto</th><th>Merma</th><th>Q. Neto</th><th>Total</th></tr></thead>
                    <tbody>
                        <tr><td>1ª Calidad</td><td>${r.totales.primera.bruto.toFixed(2)}</td><td>${r.totales.primera.merma.toFixed(2)}</td><td>${r.totales.primera.neto.toFixed(2)}</td><td>${r.totales.primera.valor.toFixed(2)}€</td></tr>
                        <tr><td>Bornizo</td><td>${r.totales.bornizo.bruto.toFixed(2)}</td><td>${r.totales.bornizo.merma.toFixed(2)}</td><td>${r.totales.bornizo.neto.toFixed(2)}</td><td>${r.totales.bornizo.valor.toFixed(2)}€</td></tr>
                        <tr><td>Refugo</td><td>${r.totales.refugo.bruto.toFixed(2)}</td><td>${r.totales.refugo.merma.toFixed(2)}</td><td>${r.totales.refugo.neto.toFixed(2)}</td><td>${r.totales.refugo.valor.toFixed(2)}€</td></tr>
                    </tbody>
                    <tfoot><tr><td><strong>TOTAL</strong></td><td><strong>${r.brutoTotal.toFixed(2)}</strong></td><td><strong>${(r.brutoTotal - r.netoTotal).toFixed(2)}</strong></td><td><strong>${r.netoTotal.toFixed(2)}</strong></td><td><strong>${r.valorTotal.toFixed(2)}€</strong></td></tr></tfoot>
                </table>
            </div>`;
        document.getElementById('cont-rep').innerHTML = h;
    },

    async renderMenuZonasReport() {
        const zonas = await Zonas.list();
        let h = `
            <div class="card">
                <h3>Seleccionar Zona</h3>
                <select id="sel-zona-rep" class="mb-1">
                    ${zonas.map(z => `<option value="${z.id}">${z.nombre}</option>`).join('')}
                </select>
                <button class="btn btn-primary" onclick="App.renderReportePorZona(document.getElementById('sel-zona-rep').value)">Generar Informe</button>
            </div>`;
        document.getElementById('cont-rep').innerHTML = h;
    },

    async renderReportePorZona(zonaId) {
        const r = await Reportes.generarReportePorZona(zonaId);
        if (!r) return;

        let h = `
            <div class="reporte-container">
                <h3>Producción: ${r.zona.nombre}</h3>
                <button class="btn btn-outline mb-1" onclick="App.exportarPDF('zona')">📄 PDF Zona</button>
                <div class="card">
                    <h4>Listado de Pesadas</h4>
                    <table class="reporte-table">
                        <thead><tr><th>Fecha</th><th>Saca</th><th>KG</th><th>Calidad</th></tr></thead>
                        <tbody>
                            ${r.pesadas.map(p => {
                                let cal = p.pesadasPorCalidad.primera.kg > 0 ? '1ª' : p.pesadasPorCalidad.bornizo.kg > 0 ? 'Bo' : 'Re';
                                return `<tr><td>${new Date(p.fecha).toLocaleDateString()}</td><td>#${p.saca}</td><td>${p.kg.toFixed(1)}</td><td>${cal}</td></tr>`;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
                <div class="card">
                    <h4>Totales Zona</h4>
                    <p>1ª Calidad: ${Math.round(r.totales.primera.kg)} kg (${r.totales.primera.quintales.toFixed(2)} Q)</p>
                    <p>Bornizo: ${Math.round(r.totales.bornizo.kg)} kg (${r.totales.bornizo.quintales.toFixed(2)} Q)</p>
                    <p>Refugo: ${Math.round(r.totales.refugo.kg)} kg (${r.totales.refugo.quintales.toFixed(2)} Q)</p>
                </div>
            </div>`;
        document.getElementById('cont-rep').innerHTML = h;
    },

    async renderMenuCalidadesReport() {
        let h = `
            <div class="card">
                <h3>Seleccionar Calidad</h3>
                <div class="grid-2" style="gap:10px;">
                    <button class="btn btn-secondary" onclick="App.renderReporteEconomicoPorCalidad('primera')">⭐ 1ª Calidad</button>
                    <button class="btn btn-secondary" onclick="App.renderReporteEconomicoPorCalidad('bornizo')">🟡 Bornizo</button>
                    <button class="btn btn-secondary" onclick="App.renderReporteEconomicoPorCalidad('refugo')">🔴 Refugo</button>
                </div>
            </div>`;
        document.getElementById('cont-rep').innerHTML = h;
    },

    async renderReporteEconomicoPorCalidad(calidad) {
        const r = await Reportes.generarReporteEconomicoPorCalidad(calidad);
        if (!r) return;

        let h = `
            <div class="reporte-container">
                <h3>Liquidación: ${r.nombreCalidad}</h3>
                <p>Precio pactado: ${r.precioQuintal} €/Q | Oreo: ${r.oreo}%</p>
                <button class="btn btn-outline mb-1" onclick="App.exportarPDF('calidad')">📄 PDF Calidad</button>
                <table class="reporte-table">
                    <thead><tr><th>Zona</th><th>Sacas</th><th>Q. Bruto</th><th>Merma</th><th>Q. Neto</th><th>Valor</th></tr></thead>
                    <tbody>
                        ${Object.values(r.reportePorZona).filter(z => z.sacas > 0).map(z => `
                            <tr><td>${z.nombre}</td><td>${z.sacas}</td><td>${z.bruto.toFixed(2)}</td><td>${z.merma.toFixed(2)}</td><td>${z.neto.toFixed(2)}</td><td>${z.valor.toFixed(2)}€</td></tr>
                        `).join('')}
                    </tbody>
                    <tfoot>
                        <tr><td><strong>TOTAL</strong></td><td><strong>${r.totales.sacas}</strong></td><td><strong>${r.totales.bruto.toFixed(2)}</strong></td><td><strong>${(r.totales.bruto - r.totales.neto).toFixed(2)}</strong></td><td><strong>${r.totales.neto.toFixed(2)}</strong></td><td>${r.totales.valor.toFixed(2)}€</td></tr>
                    </tfoot>
                </table>
            </div>`;
        document.getElementById('cont-rep').innerHTML = h;
    },

    async renderFincasManager() {
        const main = document.getElementById('app-content');
        const allFincas = await Fincas.list();
        const activeId = await Fincas.getActiveId();

        main.innerHTML = `
            <div class="card">
                <h3>Gestión de Fincas</h3>
                <div class="grid-2" style="gap:10px; margin-bottom:15px;">
                    <button class="btn btn-primary" onclick="App._showFincaForm()">➕ Nueva</button>
                    <button class="btn btn-secondary" onclick="App._triggerImportFincaManager()">📥 Importar</button>
                </div>
                <button id="btn-load-finca" class="btn btn-primary" style="width:100%;" disabled>
                    Cargar Finca Seleccionada
                </button>
                <input type="file" id="import-f-mgr" accept=".json" style="display:none">
            </div>
            <div id="fincas-list-container">
                ${allFincas.map(f => `
                    <div class="card list-item-detallado finca-card" id="finca-card-${f.id}"
                         onclick="App._selectFincaForLoad(${f.id}, '${f.nombre}')">
                        <div style="flex:1;">
                            <strong>${f.nombre}</strong> ${Number(f.id) === Number(activeId) ? '<small>(Actual)</small>' : ''}<br>
                            <small class="text-muted">Prop: ${f.propietario || '-'}</small>
                        </div>
                        <div style="display:flex; flex-direction:column; gap:5px;">
                            <button class="btn-icon" onclick="event.stopPropagation(); App._showFincaForm(${f.id})">✏️</button>
                            <button class="btn-icon" style="color:#ff4d4d;" onclick="event.stopPropagation(); App._deleteFinca(${f.id}, '${f.nombre}')">🗑️</button>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;

        document.getElementById('import-f-mgr').onchange = async (e) => {
            if (e.target.files[0]) {
                await App._handleImportFile(e.target.files[0]);
                e.target.value = '';
            }
        };

        document.getElementById('btn-load-finca').onclick = () => {
            if (this._pendingFincaId) {
                App._confirmSwitchFinca(this._pendingFincaId, this._pendingFincaNombre);
            }
        };
    },

    _selectFincaForLoad(id, nombre) {
        document.querySelectorAll('.finca-card').forEach(el => el.classList.remove('selected-finca'));
        const card = document.getElementById(`finca-card-${id}`);
        if(card) card.classList.add('selected-finca');
        const btn = document.getElementById('btn-load-finca');
        if(btn) btn.disabled = false;
        this._pendingFincaId = id;
        this._pendingFincaNombre = nombre;
    },

    async _confirmSwitchFinca(newId, nombre) {
        const currentFinca = await Fincas.getActive();
        if (currentFinca && currentFinca.id === newId) return;

        if (confirm(`¿Cambiar a "${nombre}"?`)) {
            await Fincas.setActiveId(newId);
            App.toast(`Cargada finca: ${nombre}`);
            setTimeout(() => location.reload(), 500);
        }
    },

    _triggerImportFincaManager() {
        alert("Aviso: Elija el archivo de backup para importar como nueva finca.");
        document.getElementById('import-f-mgr').click();
    },

    async _handleImportFile(file) {
        try {
            App.toast('Procesando archivo...');
            const importData = await Export.parseBackupFile(file);

            if (!importData || !importData.fincas || importData.fincas.length === 0) {
                throw new Error("El archivo de backup no contiene fincas válidas.");
            }

            const allFincas = await Fincas.list();
            const fincasToImport = importData.fincas;
            const existingFincas = [];

            for (const fincaToImport of fincasToImport) {
                const existing = allFincas.find(f => f.nombre === fincaToImport.info.nombre);
                if (existing) {
                    existingFincas.push({ ...fincaToImport, existingId: existing.id });
                }
            }

            let importConfirmed = true;
            if (existingFincas.length > 0) {
                const fincaNames = existingFincas.map(f => f.info.nombre).join(', ');
                const message = `La(s) finca(s) "${fincaNames}" ya existe(n). ¿Desea sobreescribirla(s)? Esta acción es irreversible.`;
                importConfirmed = confirm(message);
            }

            if (!importConfirmed) {
                App.toast("Importación cancelada por el usuario.");
                return;
            }

            // Eliminar fincas existentes si se confirma la sobreescritura
            for (const fincaToDelete of existingFincas) {
                await Fincas.delete(fincaToDelete.existingId);
            }

            // Importar todas las fincas del backup
            let newActiveFincaId = null;
            for (const fincaData of fincasToImport) {
                const newId = await Export.saveImportedFincaData(fincaData);
                if (!newActiveFincaId) {
                    newActiveFincaId = newId;
                }
            }

            App.toast(`✅ ${fincasToImport.length} finca(s) importada(s) con éxito.`);
            
            // Si es la primera importación o se sobreescribió la activa, se establece una nueva y se recarga
            const currentActiveId = await Fincas.getActiveId();
            if (!currentActiveId && newActiveFincaId) {
                await Fincas.setActiveId(newActiveFincaId);
            }
            
            // Recargar la app para reflejar los cambios
            setTimeout(() => window.location.reload(), 1000);

        } catch (e) {
            App.toastError(e.message);
            console.error(e);
        }
    },

    async _deleteFinca(id, nombre) {
        if (confirm(`¿Eliminar la finca "${nombre}"?`)) {
            await Fincas.delete(id);
            location.reload();
        }
    },

    async _showFincaForm(id = null) {
        let f = id ? await Fincas.get(id) : {
            nombre: '', propietario: '', direccion: '', cif: '', telefono: '',
            factorQuintal: 46, unidadMedida: 'quintal_castellano', porcentajeOreo: 0,
            precios: {
                primera: { precioQuintal: 80 },
                bornizo: { precioQuintal: 45 },
                refugo: { precioQuintal: 25 }
            }
        };
        const main = document.getElementById('app-content');
        main.innerHTML = `
            <div class="card">
                <h3>${id ? 'Editar' : 'Nueva'} Finca</h3>
                <form id="form-finca">
                    <div class="form-group"><label>Nombre de la Finca *</label><input type="text" id="f-nom" value="${f.nombre || ''}" required placeholder="Ej: El Chamorro"></div>
                    <div class="form-group"><label>Propietario *</label><input type="text" id="f-prop" value="${f.propietario || ''}" required></div>
                    <div class="form-group"><label>Dirección</label><input type="text" id="f-dir" value="${f.direccion || ''}"></div>
                    <div class="grid-2">
                        <div class="form-group"><label>CIF/NIF</label><input type="text" id="f-cif" value="${f.cif || ''}"></div>
                        <div class="form-group"><label>Teléfono</label><input type="tel" id="f-tel" value="${f.telefono || ''}"></div>
                    </div>

                    <div class="form-group">
                        <label>Unidad de Medida</label>
                        <select id="f-uni" onchange="App._onUnitChangeForm(this.value)">
                            <option value="quintal_castellano" ${f.unidadMedida === 'quintal_castellano' ? 'selected' : ''}>Quintal Castellano (46 kg)</option>
                            <option value="quintal_metrico" ${f.unidadMedida === 'quintal_metrico' ? 'selected' : ''}>Quintal Métrico (100 kg)</option>
                            <option value="arroba" ${f.unidadMedida === 'arroba' ? 'selected' : ''}>Arroba (11.5 kg)</option>
                            <option value="manual" ${f.unidadMedida === 'manual' ? 'selected' : ''}>Manual (Personalizado)</option>
                        </select>
                    </div>

                    <div class="grid-2">
                        <div class="form-group" id="f-factor-group" style="${f.unidadMedida === 'manual' ? '' : 'display:none;'}">
                            <label>Factor (kg)</label>
                            <input type="number" step="0.001" id="f-fac" value="${f.factorQuintal}">
                        </div>
                        <div class="form-group">
                            <label>% Oreo (Merma)</label>
                            <input type="number" step="0.1" id="f-oreo" value="${f.porcentajeOreo}">
                        </div>
                    </div>

                    <h4>Precios (€/Unidad)</h4>
                    <div class="grid-2">
                        <div class="form-group"><label>1ª Calidad</label><input type="number" id="f-p1" value="${f.precios?.primera?.precioQuintal || 0}"></div>
                        <div class="form-group"><label>Bornizo</label><input type="number" id="f-pb" value="${f.precios?.bornizo?.precioQuintal || 0}"></div>
                    </div>
                    <div class="form-group"><label>Refugo</label><input type="number" id="f-pr" value="${f.precios?.refugo?.precioQuintal || 0}"></div>

                    <div class="form-actions mt-1">
                        <button type="submit" class="btn btn-primary">💾 Guardar Finca</button>
                        <button type="button" class="btn btn-outline" onclick="App.renderFincasManager()">Cancelar</button>
                    </div>
                </form>
            </div>
        `;

        document.getElementById('form-finca').onsubmit = async (e) => {
            e.preventDefault();
            await App._saveFinca(id);
        };
    },

    _onUnitChangeForm(val) {
        const factorGroup = document.getElementById('f-factor-group');
        const factorInput = document.getElementById('f-fac');
        if (!factorGroup || !factorInput) return;

        if (val === 'manual') {
            factorGroup.style.display = 'block';
        } else {
            factorGroup.style.display = 'none';
            if (val === 'quintal_castellano') factorInput.value = 46;
            else if (val === 'quintal_metrico') factorInput.value = 100;
            else if (val === 'arroba') factorInput.value = 11.5;
        }
    },

    async _saveFinca(id) {
        try {
            const nombre = document.getElementById('f-nom').value.trim();
            const propietario = document.getElementById('f-prop').value.trim();

            if (!nombre || !propietario) {
                return App.toastError("Nombre y Propietario son obligatorios");
            }

            const unit = document.getElementById('f-uni').value;
            let factor = 46;
            if (unit === 'quintal_castellano') factor = 46;
            else if (unit === 'quintal_metrico') factor = 100;
            else if (unit === 'arroba') factor = 11.5;
            else factor = parseFloat(document.getElementById('f-fac').value) || 46;

            const finca = {
                id: id ? Number(id) : undefined,
                nombre: nombre,
                propietario: propietario,
                direccion: document.getElementById('f-dir').value.trim(),
                cif: document.getElementById('f-cif').value.trim(),
                telefono: document.getElementById('f-tel').value.trim(),
                unidadMedida: unit,
                factorQuintal: factor,
                porcentajeOreo: parseFloat(document.getElementById('f-oreo').value) || 0,
                precios: {
                    primera: { precioQuintal: parseFloat(document.getElementById('f-p1').value) || 0 },
                    bornizo: { precioQuintal: parseFloat(document.getElementById('f-pb').value) || 0 },
                    refugo: { precioQuintal: parseFloat(document.getElementById('f-pr').value) || 0 }
                }
            };

            await Fincas.save(finca);
            App.toast("✅ Finca guardada");
            await App.renderFincasManager();
        } catch (error) {
            console.error("Error guardando finca:", error);
            App.toastError("Error al guardar: " + error.message);
        }
    },

    async renderAjustes() {
        const main = document.getElementById('app-content'); 
        const activeFinca = await Fincas.getActive();
        if (!activeFinca) return App.renderFincasManager();

        // Asegurarse de que el objeto comprador y sus propiedades existan
        const comprador = activeFinca.comprador || {};

        main.innerHTML = `
            <div class="card">
                <h3>Ajustes de ${activeFinca.nombre}</h3>
                
                <div class="card">
                    <h4>Datos Comprador</h4>
                    <div class="form-group"><label>Nombre de la Empresa</label><input type="text" id="adj-empresa" value="${comprador.nombreEmpresa || ''}"></div>
                    <div class="grid-2">
                        <div class="form-group"><label>CIF/NIF</label><input type="text" id="adj-cif" value="${comprador.cifNif || ''}"></div>
                        <div class="form-group"><label>Representante</label><input type="text" id="adj-representante" value="${comprador.representante || ''}"></div>
                    </div>
                    <div class="form-group"><label>Dirección</label><input type="text" id="adj-direccion" value="${comprador.direccion || ''}"></div>
                    <div class="grid-2">
                        <div class="form-group"><label>Nº de Teléfono</label><input type="tel" id="adj-telefono" value="${comprador.telefono || ''}"></div>
                        <div class="form-group"><label>Correo Electrónico</label><input type="email" id="adj-email" value="${comprador.email || ''}"></div>
                    </div>
                </div>

                <div class="form-group">
                    <label>Unidad de Medida</label>
                    <select id="adj-uni" onchange="App._onUnitChange(this.value)">
                        <option value="quintal_castellano" ${activeFinca.unidadMedida === 'quintal_castellano' ? 'selected' : ''}>Quintal Castellano (46 kg)</option>
                        <option value="quintal_metrico" ${activeFinca.unidadMedida === 'quintal_metrico' ? 'selected' : ''}>Quintal Métrico (100 kg)</option>
                        <option value="arroba" ${activeFinca.unidadMedida === 'arroba' ? 'selected' : ''}>Arroba (11.5 kg)</option>
                        <option value="manual" ${activeFinca.unidadMedida === 'manual' ? 'selected' : ''}>Manual (Personalizado)</option>
                    </select>
                </div>
                <div class="grid-2">
                    <div class="form-group" id="factor-group" style="${activeFinca.unidadMedida === 'manual' ? '' : 'display:none;'}">
                        <label>Factor (kg)</label>
                        <input type="number" step="0.001" id="adj-fac" value="${activeFinca.factorQuintal}">
                    </div>
                    <div class="form-group">
                        <label>% Oreo (Merma)</label>
                        <input type="number" step="0.1" id="adj-oreo" value="${activeFinca.porcentajeOreo}">
                    </div>
                </div>
                <h4>Precios por Defecto (€/Unidad)</h4>
                <div class="grid-2">
                    <div class="form-group"><label>1ª Calidad</label><input type="number" id="adj-p1" value="${activeFinca.precios?.primera?.precioQuintal || 0}"></div>
                    <div class="form-group"><label>Bornizo</label><input type="number" id="adj-pb" value="${activeFinca.precios?.bornizo?.precioQuintal || 0}"></div>
                </div>
                <div class="form-group"><label>Refugo</label><input type="number" id="adj-pr" value="${activeFinca.precios?.refugo?.precioQuintal || 0}"></div>

                <button class="btn btn-primary" onclick="App._saveActiveFincaSettings()">💾 Guardar Ajustes</button>
            </div>

            <div class="card">
                <h3>Mantenimiento de Zonas</h3>
                <p class="text-muted small">Escanea la carpeta local /ZONAS para importar o actualizar parcelas automáticamente.</p>
                <button class="btn btn-secondary" onclick="App._syncZonasFromFolder()">🔄 Sincronizar Zonas (Carpeta ZONAS)</button>
            </div>

            <div class="card">
                <h3>Copia de Seguridad (Backup)</h3>
                <p class="text-muted small">Exporte o importe todos los datos asociados a esta finca.</p>
                <div class="grid-2" style="gap:10px;">
                    <button class="btn btn-outline" onclick="Export.exportBackup([${activeFinca.id}])">💾 Exportar Finca</button>
                    <button class="btn btn-secondary" onclick="document.getElementById('import-f-mgr').click()">📥 Importar Finca</button>
                </div>
                <button class="btn btn-outline mt-1" style="width:100%" onclick="Export.exportBackup()">📄 Exportar Todo (Multi-Finca)</button>
            </div>
            <div class="card">
                <button class="btn btn-secondary" onclick="location.hash='/fincas'">📍 Administrar Todas las Fincas</button>
            </div>

            <div class="card text-center" style="border-top: 2px solid var(--p-cork);">
                <img src="icons/logo-header.png" style="width:120px; margin-bottom:15px; filter: drop-shadow(0 0 5px rgba(212, 163, 115, 0.3));">
                <h3>Acerca de</h3>
                <p style="font-size:0.9rem;"><strong>Chamorro´s Cork Manager</strong> v5.9.3</p>
                <p class="text-muted" style="font-size:0.8rem; margin-top:10px;">
                    Desarrollado para la gestión profesional de sacas de corcho.<br>
                    © 2024 David Asuar. Todos los derechos reservados.<br>
                    Licencia: Uso Exclusivo Familiar.
                </p>
                <hr style="border:0; border-top:1px solid var(--border); margin:15px 0;">
                <p style="font-size:0.8rem;">
                    <strong>Contacto y Soporte:</strong><br>
                    📧 david.asuar@gmail.com
                </p>
            </div>
        `;
    },

    async _syncZonasFromFolder() {
        App.toast("Iniciando sincronización...");
        try {
            const res = await Zonas.syncFromPdfDirectory();
            App.toast(`✅ Sincronización completada. Agregadas: ${res.agregadas}, Actualizadas: ${res.actualizadas}`);
            // Recargar si estamos en la vista de zonas
            if(location.hash === '#/zonas') App.route();
        } catch (e) {
            App.toastError("Error en la sincronización automática");
            console.error(e);
        }
    },

    async _onUnitChange(val) {
        const factorGroup = document.getElementById('factor-group');
        const factorInput = document.getElementById('adj-fac');
        if (!factorGroup || !factorInput) return;

        if (val === 'manual') {
            factorGroup.style.display = 'block';
        } else {
            factorGroup.style.display = 'none';
            if (val === 'quintal_castellano') factorInput.value = 46;
            else if (val === 'quintal_metrico') factorInput.value = 100;
            else if (val === 'arroba') factorInput.value = 11.5;
        }
    },

    async _saveActiveFincaSettings() {
        const finca = await Fincas.getActive();
        if (!finca) return;

        finca.comprador = {
            nombreEmpresa: document.getElementById('adj-empresa').value.trim(),
            cifNif: document.getElementById('adj-cif').value.trim(),
            representante: document.getElementById('adj-representante').value.trim(),
            direccion: document.getElementById('adj-direccion').value.trim(),
            telefono: document.getElementById('adj-telefono').value.trim(),
            email: document.getElementById('adj-email').value.trim()
        };

        const unit = document.getElementById('adj-uni').value;
        finca.unidadMedida = unit;

        if (unit === 'quintal_castellano') finca.factorQuintal = 46;
        else if (unit === 'quintal_metrico') finca.factorQuintal = 100;
        else if (unit === 'arroba') finca.factorQuintal = 11.5;
        else finca.factorQuintal = parseFloat(document.getElementById('adj-fac').value) || 46;

        finca.porcentajeOreo = parseFloat(document.getElementById('adj-oreo').value) || 0;

        finca.precios = {
            primera: { precioQuintal: parseFloat(document.getElementById('adj-p1').value) || 0 },
            bornizo: { precioQuintal: parseFloat(document.getElementById('adj-pb').value) || 0 },
            refugo: { precioQuintal: parseFloat(document.getElementById('adj-pr').value) || 0 }
        };

        await Fincas.save(finca);
        App.toast("✅ Ajustes guardados correctamente");
    },

    openManualZonas() {
        window.open('manual-zonas.html', 'Manual Zonas', 'width=900,height=800,scrollbars=yes');
    },

    async exportarPDF(tipo) {
        const finca = await Fincas.getActive();
        const ahora = new Date().toLocaleString('es-ES');
        let titulo = "", contenidoHtml = "";

        if (tipo === 'global') { titulo = "Informe Global de Campaña"; contenidoHtml = document.getElementById('cont-rep').innerHTML; }
        else if (tipo === 'economico') { titulo = "Informe Económico de Campaña"; contenidoHtml = document.getElementById('cont-rep').innerHTML; }
        else if (tipo === 'zona') { titulo = "Informe de Producción por Zona"; contenidoHtml = document.getElementById('cont-rep').innerHTML; }
        else if (tipo === 'calidad') { titulo = "Informe de Liquidación por Calidad"; contenidoHtml = document.getElementById('cont-rep').innerHTML; }
        else if (tipo === 'lista') { titulo = "Listado de Pesadas"; contenidoHtml = document.querySelector('.lista-detallada').innerHTML; }

        const temp = document.createElement('div');
        temp.innerHTML = contenidoHtml;
        temp.querySelectorAll('button, select').forEach(el => el.remove());

        const comprador = finca.comprador || {};
        const compradorHtml = `
            <div style="text-align: left; margin-top: 15px; padding-top: 10px; border-top: 1px solid #ccc;">
                <h3 style="color: #a0673a; margin-bottom: 10px;">Datos del Comprador</h3>
                <p style="margin: 2px;"><strong>Empresa:</strong> ${comprador.nombreEmpresa || ''}</p>
                <p style="margin: 2px;"><strong>CIF/NIF:</strong> ${comprador.cifNif || ''}</p>
                <p style="margin: 2px;"><strong>Representante:</strong> ${comprador.representante || ''}</p>
                <p style="margin: 2px;"><strong>Dirección:</strong> ${comprador.direccion || ''}</p>
                <p style="margin: 2px;"><strong>Teléfono:</strong> ${comprador.telefono || ''}</p>
                <p style="margin: 2px;"><strong>Email:</strong> ${comprador.email || ''}</p>
            </div>
        `;

        const plantilla = `
            <div class="pdf-export-container" style="font-family: Arial, sans-serif; padding: 10mm; background: #fff; color: #000;">
                <div style="text-align: center; margin-bottom: 20px;">
                    <img src="icons/logo-header.png" style="width: 60mm; display: block; margin: 0 auto 10px auto;">
                    <h1 style="color: #a0673a; margin: 10px 0;">${finca.nombre.toUpperCase()}</h1>
                    <p style="margin: 2px;">Prop: ${finca.propietario || ''} | Dir: ${finca.direccion || ''}</p>
                    <h2 style="margin-top: 15px; border-top: 2pt solid #a0673a; padding-top: 10px;">${titulo}</h2>
                    <p style="font-size: 8pt; color: #666;">Impreso: ${ahora}</p>
                </div>
                ${(tipo === 'economico' || tipo === 'calidad') ? compradorHtml : ''}
                <div class="pdf-content" style="color:#000; font-weight: bold;">
                    ${temp.innerHTML}
                </div>
                <div style="margin-top: 20px; border-top: 1pt solid #eee; text-align: center; font-size: 7pt; color: #999;">Chamorro´s Cork Manager - David Asuar</div>
            </div>
            <style>
                .pdf-export-container * { background-color: #fff !important; color: #000 !important; border-color: #ccc !important; }
                .pdf-export-container table { width: 100%; border-collapse: collapse; margin-top: 10px; }
                .pdf-export-container th { border-bottom: 1.5pt solid #000 !important; text-align: left; padding: 8px; font-weight: bold; background: #f0f0f0 !important; }
                .pdf-export-container td { border-bottom: 1px solid #eee !important; padding: 8px; font-size: 9pt; font-weight: bold; }
                .pdf-export-container .card { border: 1px solid #ddd !important; padding: 10px; margin-bottom: 15px; border-radius: 4px; }
                .pdf-export-container h3, .pdf-export-container h4 { color: #a0673a !important; margin: 10px 0; }
                .pdf-export-container .q-pill { border: 1px solid #ccc !important; padding: 2px 5px; display: inline-block; margin-right: 5px; }
            </style>
        `;

        if (window.isNative) {
            App._exportNativePDF(tipo, plantilla);
        } else {
            html2pdf().set({
                margin: 5,
                filename: 'Cork_' + tipo + '_' + finca.nombre.replace(/\s/g, '_') + '.pdf',
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { scale: 2, logging: false, useCORS: true },
                jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
            }).from(plantilla).save();
        }
    },

    async _exportNativePDF(tipo, html) {
        try {
            const pdf = await html2pdf().from(html).set({ margin: 0, html2canvas: { scale: 2 } }).outputPdf('datauristring');
            const saved = await Capacitor.Plugins.Filesystem.writeFile({ path: 'Reporte_' + tipo + '_' + Date.now() + '.pdf', data: pdf.split(',')[1], directory: 'CACHE' });
            await Capacitor.Plugins.Share.share({ url: saved.uri });
        } catch (e) { App.toastError("Fallo en Android"); }
    },

    async renderImportarPdf() {
        const main = document.getElementById('app-content');
        main.innerHTML = `<div class="card"><h2>Importar PDF</h2><input type="file" id="pdf-input" accept=".pdf" multiple class="mt-1"><div id="pdf-preview" class="mt-1"></div><button id="btn-import-all" class="btn btn-primary mt-1" style="display:none; width:100%;">💾 Guardar</button></div>`;
        const input = document.getElementById('pdf-input'), prev = document.getElementById('pdf-preview'), btn = document.getElementById('btn-import-all');
        let parsed = [];
        input.onchange = async (e) => {
            parsed = []; prev.innerHTML = '<div class="loader">Procesando...</div>';
            for (const f of e.target.files) {
                const data = await parsePdfCatastro(f);
                if (data) { data._tempId = Math.random().toString(36).substr(2, 9); parsed.push(data); }
            }
            prev.innerHTML = parsed.map(z => `<div class="card mt-1"><strong>Ref: ${z.refCatastral}</strong><br><small>Pol.${z.poligono}/Par.${z.parcela}</small><input type="text" placeholder="Nombre..." id="name-${z._tempId}" value="${z.nombre}"></div>`);
            if (parsed.length) btn.style.display = 'block';
        };
        btn.onclick = async () => {
            for (const item of parsed) { item.nombre = document.getElementById('name-' + item._tempId).value || 'Zona ' + item.poligono + '/' + item.parcela; delete item._tempId; await Zonas.save(item); }
            App.toast('✅ Importado'); location.hash = '/zonas';
        };
    },

    async renderWelcomeWizard() {
        console.log("Wizard cargado!");
        const main = document.getElementById('app-content');
        if (!main) return;
        main.innerHTML = `
            <div class="card text-center welcome-wizard">
                <img src="icons/logo-header.png" style="max-height: 100px; width: auto; margin-bottom: 20px;">
                <h1>¡Bienvenido!</h1>
                <p>Gracias por elegir <strong>Chamorro´s Cork Manager</strong>.</p>
                <p class="text-muted">Para comenzar a gestionar tus sacas de corcho, primero necesitas crear o importar una finca.</p>

                <div class="wizard-actions mt-2" style="display:flex; flex-direction:column; gap:10px;">
                    <button class="btn btn-primary" onclick="App._showFincaForm()">➕ Crear mi primera finca</button>
                    <button class="btn btn-secondary" onclick="document.getElementById('import-wizard').click()">📥 Importar desde un backup</button>
                    <input type="file" id="import-wizard" accept=".json" style="display:none">
                </div>
            </div>
        `;
        const input = document.getElementById('import-wizard');
        if (input) {
            input.onchange = async (e) => {
                if (e.target.files[0]) await App._handleImportFile(e.target.files[0]);
            };
        }
    },

    async clearAll() { if (confirm('¿BORRAR TODO?')) { await db.clearAllData(); location.reload(); } }
};

window.App = App;
App.init();
