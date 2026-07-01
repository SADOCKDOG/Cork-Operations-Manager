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
                    <span class="btn-icon" style="font-size:1.6rem; margin-bottom:2px; height:45px; width:45px;"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg></span>
                    <strong style="font-size:0.85rem;">Nueva Finca</strong>
                </button>
                <button class="report-select-btn theme-global" data-trigger="import-f-mgr" style="background: linear-gradient(135deg, rgba(160,103,58,0.5) 0%, rgba(212,163,115,0.5) 100%); border:none; box-shadow: 0 4px 15px rgba(160,103,58,0.15); min-height: 80px; padding: 10px;">
                    <span class="btn-icon" style="font-size:1.6rem; margin-bottom:2px; height:45px; width:45px;"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg></span>
                    <strong style="font-size:0.85rem;">Importar</strong>
                </button>
                <button class="report-select-btn theme-econ" data-action="Export.exportBackup" style="background: linear-gradient(135deg, rgba(44,62,80,0.5) 0%, rgba(76,161,175,0.5) 100%); border:none; box-shadow: 0 4px 15px rgba(44,62,80,0.15); min-height: 80px; padding: 10px;">
                    <span class="btn-icon" style="font-size:1.6rem; margin-bottom:2px; height:45px; width:45px;"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg></span>
                    <strong style="font-size:0.85rem;">Exportar Todo</strong>
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
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
                            </button>
                            <button class="btn-modern-action stop-prop" data-action="App._showFincaForm" data-id="${f.id}" title="Editar" style="background: rgba(255,255,255,0.05); border-radius:12px; width:45px; height:45px; display:flex; align-items:center; justify-content:center; border:1px solid rgba(255,255,255,0.1); cursor:pointer;">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                            </button>
                            <button class="btn-modern-action stop-prop" data-action="App._deleteFinca" data-id="${f.id}" data-name="${App.escapeHtml(f.nombre)}" title="Borrar" style="background: rgba(255,77,77,0.1); border-radius:12px; width:45px; height:45px; display:flex; align-items:center; justify-content:center; border:1px solid rgba(255,77,77,0.2); cursor:pointer; color:#ff4d4d;">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                            </button>
                        </div>
                    </div>`;
                }).join('')}
            </div>

            <div id="load-finca-footer" style="display:none; margin-top:20px;">
                <button id="btn-load-finca" class="btn btn-primary" style="height:65px; font-weight:900; font-size:1.1rem; border-radius:15px; box-shadow:0 10px 30px rgba(127,176,105,0.3); width:100%;">
                    CARGAR FINCA SELECCIONADA
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

            <div class="card" style="border: 2px solid var(--p-cork); border-left: 8px solid var(--p-cork); margin-bottom:16px;">
                <div style="display:flex; align-items:center; gap:10px; margin-bottom:15px;"><div style="width:4px; height:20px; background:var(--p-cork); border-radius:2px;"></div><h4 style="margin:0; font-size:0.9rem; text-transform:uppercase;">Datos del Propietario</h4></div>
                <div class="form-group"><label>Nombre Explotación</label><input type="text" value="${App.escapeHtml(finca.nombre)}" readonly style="opacity:0.6;"></div>
                <div class="form-group"><label>Nombre Propietario</label><input type="text" id="adj-prop" value="${finca.propietario||''}"></div>
                <div class="form-group"><label>Teléfono</label><input type="tel" id="adj-prop-tel" value="${finca.telefono||''}"></div>
            </div>

            <div class="card" style="border: 2px solid var(--accent); border-left: 8px solid var(--accent); margin-bottom:16px;">
                <div style="display:flex; align-items:center; gap:10px; margin-bottom:15px;"><div style="width:4px; height:20px; background:var(--accent); border-radius:2px;"></div><h4 style="margin:0; font-size:0.9rem; text-transform:uppercase;">Datos del Comprador</h4></div>
                <div class="form-group"><label>Empresa / Comprador</label><input type="text" id="adj-empresa" value="${comp.nombreEmpresa||''}"></div>
                <div class="form-group"><label>CIF/NIF Comprador</label><input type="text" id="adj-cif" value="${comp.cifNif||''}"></div>
                <div class="form-group"><label>Representante</label><input type="text" id="adj-representante" value="${comp.representante||''}"></div>
                <div class="grid-2">
                    <div class="form-group"><label>Teléfono</label><input type="tel" id="adj-tel" value="${comp.telefono||''}"></div>
                    <div class="form-group"><label>Correo Electrónico</label><input type="email" id="adj-email" value="${comp.email||''}"></div>
                </div>
                <div class="form-group"><label>Dirección Comercial</label><input type="text" id="adj-direccion" value="${comp.direccion||''}"></div>
            </div>

            <div class="card" style="border: 2px solid rgba(245,158,11,0.35); border-left: 8px solid rgba(245,158,11,0.6); margin-bottom:16px;">
                <div style="display:flex; align-items:center; gap:10px; margin-bottom:15px;"><div style="width:4px; height:20px; background:#f59e0b; border-radius:2px;"></div><h4 style="margin:0; font-size:0.9rem; text-transform:uppercase;">Contrato y Precios Acordados</h4></div>
                <div class="form-group"><label>Porcentaje de Oreo / Merma (%)</label><input type="number" step="0.1" id="adj-oreo" value="${finca.porcentajeOreo || 0}"></div>
                <div style="border-top:1px solid var(--border); padding-top:12px; margin-top:12px;">
                    <h5 style="margin:0 0 12px 0; color: #f59e0b; font-size:0.8rem; text-transform:uppercase; letter-spacing:0.5px;">Precios Acordados (€/Quintal)</h5>
                </div>
                <div class="grid-3" style="gap:10px;">
                    <div class="form-group"><label style="font-size:0.75rem;">1ª Calidad</label><input type="number" step="0.01" id="adj-p1" value="${precios.primera?.precioQuintal || ''}" style="text-align:center; font-size:0.95rem;"></div>
                    <div class="form-group"><label style="font-size:0.75rem;">Bornizo</label><input type="number" step="0.01" id="adj-pb" value="${precios.bornizo?.precioQuintal || ''}" style="text-align:center; font-size:0.95rem;"></div>
                    <div class="form-group"><label style="font-size:0.75rem;">Refugo</label><input type="number" step="0.01" id="adj-pr" value="${precios.refugo?.precioQuintal || ''}" style="text-align:center; font-size:0.95rem;"></div>
                </div>
            </div>

            <button class="btn btn-primary" style="width:100%; height:60px; margin-bottom:16px; font-size:1.1rem;" data-action="App._saveActiveFincaSettings">Guardar Ajustes</button>

            <div class="reportes-selector-grid" style="margin-bottom:16px;">
                <button class="report-select-btn theme-zona" data-route="/gastos"><span class="btn-icon"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="6" x2="12" y2="12"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg></span><strong>Control Gastos</strong></button>
                <button class="report-select-btn theme-global" data-route="/fincas"><span class="btn-icon"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg></span><strong>Gestor Fincas</strong></button>
            </div>

            <div class="card text-center" style="border-top: 2px solid var(--p-cork); padding:30px;">
                <p style="font-size: 0.85rem; color: var(--text-s); margin-bottom: 10px; text-transform: uppercase; letter-spacing: 1px;">Desarrollado por</p>
                <h4 style="color: #fff; margin-bottom: 10px; border:none; padding:0;">David Asuar Arteaga</h4>
                <img src="icons/Logo SDOGFARMCORE.png" style="width:160px; margin-bottom:15px; filter: drop-shadow(0 0 10px rgba(212,163,115,0.2));">
                <p style="font-weight:800; color:var(--p-cork); margin-bottom: 5px;">Ecosistema CORE de Gestión Inteligente</p>
                <div style="width: 40px; height: 2px; background: var(--border); margin: 15px auto;"></div>
                <h3 style="font-size: 1.1rem; color: #fff; margin-bottom: 5px; border:none; padding:0;">Licencia y Soporte</h3>
                <p style="font-size: 0.85rem; color: var(--text-s); line-height: 1.5;">
                    © 2026 Cork Manager. Todos los derechos reservados.<br>
                     Licencia de uso profesional v7.0.0<br>
                    <a href="https://github.com/SADOCKDOG/Cork-Operations-Manager" target="_blank" style="color:var(--accent); text-decoration:none; font-weight:bold; display:inline-block; margin-top:10px;">Repositorio en GitHub</a>
                </p>
                <p style="font-size: 0.85rem; color: var(--p-cork); margin-top: 15px; font-weight: 600;">
                    soporte.sdogfarm@gmail.com
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
                    <button type="submit" class="btn btn-primary mt-1">Guardar Finca</button>
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
            await Fincas.save(dS); App.toast("Éxito"); await App.renderFincasManager();
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

    async _confirmSwitchFinca(newId, nombre) {
        const ok = await Utils.confirmDialog({
            title: 'Cambiar Finca',
            message: `¿Cargar finca "${nombre}"?`,
            icon: '',
            confirmText: 'Cargar',
            variant: 'success'
        });
        if (ok) { await Fincas.setActiveId(newId); location.reload(); }
    },

    async _deleteFinca(id, nombre) {
        const ok = await Utils.confirmDialog({
            title: 'Eliminar Finca',
            message: `¿Borrar permanentemente "${nombre}"? Se eliminarán todas las pesadas asociadas.`,
            icon: '',
            confirmText: 'Eliminar',
            variant: 'danger'
        });
        if (ok) { await Fincas.delete(id); location.reload(); }
    },

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

        await Fincas.save(finca); App.toast("Ajustes guardados");
    },

    async _handleImportFile(file) {
        try {
            App.toast('Analizando backup...'); const data = await Export.parseBackupFile(file); if (!data || !data.fincas) throw new Error("Inválido");
            for (const fD of data.fincas) {
                const existing = (await Fincas.list()).find(f => f.nombre === fD.info.nombre);
                if (existing) {
                    const overwrite = await Utils.confirmDialog({
                        title: 'Finca Existente',
                        message: `La finca "${fD.info.nombre}" ya existe en el sistema. ¿Desea SOBREESCRIBIRLA?`,
                        icon: '',
                        confirmText: 'Sobreescribir',
                        variant: 'danger'
                    });
                    if (!overwrite) continue;
                    await Fincas.delete(existing.id);
                }
                await Export.saveImportedFincaData(fD);
            }
            App.toast('Importación completada'); setTimeout(() => location.reload(), 1000);
        } catch (e) { App.toastError(e.message); }
    }
};
