import { Fincas } from '../fincas.js';
import { App } from '../app.js';
import { Utils } from '../core/utils.js';
import { Export } from '../export.js';

export const FincasUI = {
    async renderFincasManager() {
        const main = document.getElementById('app-content'), allFincas = await Fincas.list(), activeId = await Fincas.getActiveId();
        main.innerHTML = `
            <div style="display:flex; align-items:center; gap:12px; margin-bottom:25px;">
                <div style="width:5px; height:30px; background:var(--accent); border-radius:3px;"></div>
                <h2 style="margin:0; border:none; padding:0; font-weight:800;">Gestión de Fincas</h2>
            </div>

            <div class="reportes-selector-grid">
                <button class="report-select-btn theme-calidad" data-action="App._showFincaForm" style="background: linear-gradient(135deg, rgba(127,176,105,0.5) 0%, rgba(141,179,105,0.5) 100%); border:none; box-shadow: 0 4px 15px rgba(127,176,105,0.15); min-height: 80px; padding: 10px;">
                    <span class="btn-icon" style="font-size:1.6rem; margin-bottom:2px; height:45px; width:45px;">➕</span>
                    <strong style="font-size:0.85rem;">Nueva Finca</strong>
                </button>
                <button class="report-select-btn theme-global" data-trigger="import-f-mgr" style="background: linear-gradient(135deg, rgba(160,103,58,0.5) 0%, rgba(212,163,115,0.5) 100%); border:none; box-shadow: 0 4px 15px rgba(160,103,58,0.15); min-height: 80px; padding: 10px;">
                    <span class="btn-icon" style="font-size:1.6rem; margin-bottom:2px; height:45px; width:45px;">📥</span>
                    <strong style="font-size:0.85rem;">Importar</strong>
                </button>
                <button class="report-select-btn theme-econ" data-action="Export.exportBackup" style="background: linear-gradient(135deg, rgba(44,62,80,0.5) 0%, rgba(76,161,175,0.5) 100%); border:none; box-shadow: 0 4px 15px rgba(44,62,80,0.15); min-height: 80px; padding: 10px;">
                    <span class="btn-icon" style="font-size:1.6rem; margin-bottom:2px; height:45px; width:45px;">📄</span>
                    <strong style="font-size:0.85rem;">Exportar Todo 🔒</strong>
                </button>
            </div>

            <div id="fincas-list-container" style="margin-top:25px; display:flex; flex-direction:column; gap:15px;">
                ${allFincas.map(f => {
                    const isActive = Number(f.id) === Number(activeId);
                    return `
                    <div class="card finca-card ${isActive ? 'active-finca' : ''}"
                         data-action="App._selectFincaForLoad" data-id="${f.id}" data-name="${App.escapeHtml(f.nombre)}"
                         style="display:flex; align-items:center; padding:20px; border-left:8px solid ${isActive ? 'var(--accent)' : 'var(--border)'}; transition: transform 0.2s;">

                        <div style="flex:1;">
                            <strong style="font-size:1.2rem; color:white;">${App.escapeHtml(f.nombre)}</strong><br>
                            <small class="text-muted">Prop: ${App.escapeHtml(f.propietario || '-')}</small>
                        </div>

                        <div style="display:flex; gap:12px; align-items:center;">
                            <button class="btn-modern-action stop-prop" data-action="Export.exportBackup" data-id="${f.id}" title="Exportar" style="background: rgba(255,255,255,0.05); border-radius:12px; width:45px; height:45px; display:flex; align-items:center; justify-content:center; border:1px solid rgba(255,255,255,0.1); cursor:pointer;">
                                <span style="font-size:1.4rem;">💾</span>
                            </button>
                            <button class="btn-modern-action stop-prop" data-action="App._showFincaForm" data-id="${f.id}" title="Editar" style="background: rgba(255,255,255,0.05); border-radius:12px; width:45px; height:45px; display:flex; align-items:center; justify-content:center; border:1px solid rgba(255,255,255,0.1); cursor:pointer;">
                                <span style="font-size:1.4rem;">✏️</span>
                            </button>
                            <button class="btn-modern-action stop-prop" data-action="App._deleteFinca" data-id="${f.id}" data-name="${App.escapeHtml(f.nombre)}" title="Borrar" style="background: rgba(255,77,77,0.1); border-radius:12px; width:45px; height:45px; display:flex; align-items:center; justify-content:center; border:1px solid rgba(255,77,77,0.2); cursor:pointer; color:#ff4d4d;">
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

            <button class="btn btn-outline mt-2" data-route="/ajustes" style="width:100%;">Volver a Ajustes</button>
            <input type="file" id="import-f-mgr" accept=".json" style="display:none">
        `;
        document.getElementById('import-f-mgr').onchange = async (e) => { if (e.target.files[0]) await App._handleImportFile(e.target.files[0]); };
        document.getElementById('btn-load-finca').onclick = () => { if (this._pendingFincaId) App._confirmSwitchFinca(this._pendingFincaId, this._pendingFincaNombre); };
    },

    async renderAjustes() {
        const main = document.getElementById('app-content'), finca = await Fincas.getActive(); if (!finca) return App.renderFincasManager();
        const comp = finca.comprador || {};
        const precios = finca.precios || {};

        main.innerHTML = `
            <div style="display:flex; align-items:center; gap:12px; margin-bottom:25px;"><div style="width:5px; height:30px; background:var(--p-cork); border-radius:3px;"></div><h2 style="margin:0; border:none; padding:0; color:var(--text-p); font-weight:800;">Ajustes de Finca</h2></div>

            <div class="card" style="border: 2px solid var(--p-cork); border-left: 8px solid var(--p-cork);">
                <div style="display:flex; align-items:center; gap:10px; margin-bottom:15px;"><div style="width:4px; height:20px; background:var(--p-cork); border-radius:2px;"></div><h4 style="margin:0; font-size:0.9rem; text-transform:uppercase;">Datos Propietario</h4></div>
                <div class="form-group"><label>Nombre Explotación</label><input type="text" value="${App.escapeHtml(finca.nombre)}" readonly style="opacity:0.6;"></div>
                <div class="form-group"><label>Nombre Propietario</label><input type="text" id="adj-prop" value="${finca.propietario||''}"></div>
                <div class="form-group"><label>Teléfono</label><input type="tel" id="adj-prop-tel" value="${finca.telefono||''}"></div>
            </div>

            <div class="card" style="border: 2px solid var(--accent); border-left: 8px solid var(--accent);">
                <div style="display:flex; align-items:center; gap:10px; margin-bottom:15px;"><div style="width:4px; height:20px; background:var(--accent); border-radius:2px;"></div><h4 style="margin:0; font-size:0.9rem; text-transform:uppercase;">Datos Comprador y Precios</h4></div>
                <div class="form-group"><label>Empresa / Comprador</label><input type="text" id="adj-empresa" value="${comp.nombreEmpresa||''}"></div>
                <div class="form-group"><label>CIF/NIF Comprador</label><input type="text" id="adj-cif" value="${comp.cifNif||''}"></div>
                <div class="form-group"><label>Representante</label><input type="text" id="adj-representante" value="${comp.representante||''}"></div>
                <div class="form-group"><label>Porcentaje de Oreo (%)</label><input type="number" step="0.1" id="adj-oreo" value="${finca.porcentajeOreo || 0}"></div>
                <div class="form-group"><label>Teléfono</label><input type="tel" id="adj-tel" value="${comp.telefono||''}"></div>
                <div class="form-group"><label>Correo Electrónico</label><input type="email" id="adj-email" value="${comp.email||''}"></div>
                <div class="form-group"><label>Dirección Comercial</label><input type="text" id="adj-direccion" value="${comp.direccion||''}"></div>

                <h5 style="margin: 15px 0 10px 0; color: var(--accent); border-bottom: 1px solid var(--border); padding-bottom: 5px;">Precios de Mercado (€/Q)</h5>
                <div class="form-group"><label>Precio 1ª</label><input type="number" step="0.01" id="adj-p1" value="${precios.primera?.precioQuintal || ''}"></div>
                <div class="form-group"><label>Precio Bornizo</label><input type="number" step="0.01" id="adj-pb" value="${precios.bornizo?.precioQuintal || ''}"></div>
                <div class="form-group"><label>Precio Refugo</label><input type="number" step="0.01" id="adj-pr" value="${precios.refugo?.precioQuintal || ''}"></div>

                <button class="btn btn-primary" style="width:100%; margin-top:20px;" data-action="App._saveActiveFincaSettings">💾 Guardar Ajustes</button>
            </div>

            <div class="reportes-selector-grid" style="margin-top:20px;">
                <button class="report-select-btn theme-zona" data-route="/gastos"><span class="btn-icon">💸</span><strong>Control Gastos</strong></button>
                <button class="report-select-btn theme-global" data-route="/fincas"><span class="btn-icon">📍</span><strong>Gestor Fincas</strong></button>
                <button class="report-select-btn" data-route="/usuarios" style="background: rgba(160, 103, 58, 0.15); border: 2px solid var(--p-cork); color: var(--text-p);"><span class="btn-icon">👥</span><strong>Usuarios y Roles</strong></button>
            </div>

            <div style="margin-top: 20px; display: flex; flex-direction: column; gap: 10px;">
                <button class="btn btn-primary" style="width: 100%; padding: 12px; font-weight: 600;" onclick="App.toast('Sincronizando...'); window.App.CloudSync.syncNow().then(() => { App.toast('✅ Sincronizado'); document.getElementById('btn-ver-drive').style.display='block'; }).catch(e => App.toastError(e.message))">
                    <span style="margin-right: 5px;">☁️</span> Forzar Sincronización a Drive
                </button>
                <button id="btn-ver-drive" class="btn btn-secondary" style="width: 100%; padding: 12px; font-weight: 600; display: ${localStorage.getItem('cloudSync_driveFileId') ? 'block' : 'none'}; background: #4285F4; color: white; border: none;" onclick="window.open('https://drive.google.com/file/d/' + localStorage.getItem('cloudSync_driveFileId') + '/view', '_blank')">
                    <span style="margin-right: 5px;">👁️</span> Ver archivo en Google Drive (Web)
                </button>
                <button class="btn btn-secondary" style="width: 100%; border: 1px solid #ff4444; color: #ff4444; background: transparent; padding: 12px; font-weight: 600;" onclick="App.logout()">
                    <span style="margin-right: 5px;">🚪</span> Cerrar Sesión (Google)
                </button>
            </div>

            <div class="card text-center" style="border-top: 2px solid var(--p-cork); margin-top:30px; padding:30px;">
                <p style="font-size: 0.85rem; color: var(--text-s); margin-bottom: 10px; text-transform: uppercase; letter-spacing: 1px;">Desarrollado por</p>
                <img src="icons/Logo SDOGFARMCORE.png" style="width:160px; margin-bottom:15px; filter: drop-shadow(0 0 10px rgba(212,163,115,0.2));">
                <p style="font-weight:800; color:var(--p-cork); margin-bottom: 5px;">Ecosistema CORE de Gestión Inteligente</p>
                <div style="width: 40px; height: 2px; background: var(--border); margin: 15px auto;"></div>
                <h3 style="font-size: 1.1rem; color: #fff; margin-bottom: 5px; border:none; padding:0;">📄 Licencia y Soporte</h3>
                <p style="font-size: 0.85rem; color: var(--text-s); line-height: 1.5;">
                    © 2026 Cork Manager. Todos los derechos reservados.<br>
                    Licencia de uso profesional v6.3.1
                </p>
                <p style="font-size: 0.85rem; color: var(--p-cork); margin-top: 15px; font-weight: 600;">
                    📩 soporte.sdogfarm@gmail.com
                </p>
            </div>`;
    },

    async _showFincaForm(id = null) {
        let f = id ? await Fincas.get(id) : { nombre: '', propietario: '', cif: '', direccion: '', telefono: '', email: '' };
        const main = document.getElementById('app-content');
        main.innerHTML = `
            <div class="card">
                <h3>${id?'Editar':'Nueva'} Finca</h3>
                <form id="form-finca">
                    <div class="form-group"><label>Nombre de la Finca*</label><input type="text" id="f-nom" value="${App.escapeHtml(f.nombre)}" required></div>
                    <div class="form-group"><label>Titular / Propietario*</label><input type="text" id="f-prop" value="${App.escapeHtml(f.propietario)}" required></div>
                    <div class="form-group"><label>DNI / CIF</label><input type="text" id="f-cif" value="${f.cif || ''}"></div>
                    <div class="form-group"><label>Dirección</label><input type="text" id="f-dir" value="${f.direccion || ''}"></div>
                    <div class="grid-2">
                        <div class="form-group"><label>Teléfono</label><input type="tel" id="f-tel" value="${f.telefono || ''}"></div>
                        <div class="form-group"><label>Correo Electrónico</label><input type="email" id="f-email" value="${f.email || ''}"></div>
                    </div>
                    <button type="submit" class="btn btn-primary mt-1">💾 Guardar Finca</button>
                    <button type="button" class="btn btn-outline mt-1" data-action="App.renderFincasManager">Cancelar</button>
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

    _selectFincaForLoad(id, nombre) {
        this._pendingFincaId = id;
        this._pendingFincaNombre = nombre;
        document.querySelectorAll('.finca-card').forEach(c => {
            if (c.dataset.id == id) {
                c.style.borderLeft = '8px solid var(--accent)';
            } else if (!c.classList.contains('active-finca')) {
                c.style.borderLeft = '8px solid var(--border)';
            }
        });
        const footer = document.getElementById('load-finca-footer');
        if (footer) footer.style.display = 'block';
    },

    async _confirmSwitchFinca(newId, nombre) { if (confirm(`¿Cargar finca "${nombre}"?`)) { await Fincas.setActiveId(newId); location.reload(); } },

    async _deleteFinca(id, nombre) { if (confirm(`¿Borrar permanentemente ${nombre}?`)) { await Fincas.delete(id); location.reload(); } },

    async _saveActiveFincaSettings() {
        const finca = await Fincas.getActive(); if (!finca) return;
        finca.propietario = document.getElementById('adj-prop').value;
        finca.telefono = document.getElementById('adj-prop-tel').value;
        finca.porcentajeOreo = parseFloat(document.getElementById('adj-oreo').value) || 0;
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
    }
};
