import { Zonas } from '../zonas.js';
import { Fincas } from '../fincas.js';
import { App } from '../app.js';
import { Utils } from '../core/utils.js';

export const ZonasUI = {
    async renderZonas() {
        const main = document.getElementById('app-content'), stats = await Zonas.getStats();
        main.innerHTML = `<div class="card"><div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;"><h3>Gestión de Zonas</h3><div data-action="App.openManualZonas" style="cursor:pointer; color:var(--p-cork); font-weight:bold; font-size:0.85rem;">Ayuda ➔ ❓</div></div><div class="grid-2" style="gap:10px;"><button class="btn btn-primary" data-route="/zona/nueva">➕ Nueva Zona</button><button class="btn btn-secondary" data-route="/importar-pdf">📥 Importar PDF</button></div></div>${stats.map(z => `<div class="card" data-route="/zona/${z.id}" style="cursor:pointer; border-top: 5px solid var(--p-cork); padding: 25px;"><h3 style="text-align:center; color: #fff; font-size: 1.4rem; margin-bottom: 20px; border:none;">${App.escapeHtml(z.nombre)}</h3><div class="summary-table-grid"><div class="summary-cell c-1a"><div class="s-lbl">1ª CAL</div><div class="s-val">${z.totalesPorCalidad.primera.quintales.toFixed(2)}<span style="font-size:0.5em; margin-left:2px;">Q</span></div></div><div class="summary-cell c-bo"><div class="s-lbl">BORNIZO</div><div class="s-val">${z.totalesPorCalidad.bornizo.quintales.toFixed(2)}<span style="font-size:0.5em; margin-left:2px;">Q</span></div></div><div class="summary-cell c-re"><div class="s-lbl">REFUGO</div><div class="s-val">${z.totalesPorCalidad.refugo.quintales.toFixed(2)}<span style="font-size:0.5em; margin-left:2px;">Q</span></div></div></div></div>`).join('')}`;
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
                        <tbody>${z.cultivos.map(c => `<tr><td>${c.letra || ''}</td><td>${App.escapeHtml(c.cultivo || '-')}</td><td>${App.escapeHtml(c.intensidad || '')}</td><td>${c.superficie || '0'}</td></tr>`).join('')}</tbody>
                    </table>
                </div>`;
        }

        main.innerHTML = `
            <div class="card">
                <h3>DATOS DESCRIPTIVOS INMUEBLE</h3>
                <div style="font-size:0.9rem; line-height:1.8;">
                    <p><strong>Referencia catastral:</strong> ${App.escapeHtml(z.refCatastral || '-')}</p>
                    <p><strong>Localización:</strong> Polígono ${z.poligono || '-'} Parcela ${z.parcela || '-'}<br>
                       <span class="text-muted">${App.escapeHtml(z.municipio || '-')}</span></p>
                    <p><strong>Clase:</strong> ${App.escapeHtml(z.clase || '-')}</p>
                    <p><strong>Uso principal:</strong> ${App.escapeHtml(z.usoPrincipal || '-')}</p>
                    <p><strong>Superficie gráfica:</strong> ${z.superficieGrafica ? z.superficieGrafica + ' m²' : '-'}</p>
                </div>
                <button class="btn btn-secondary mt-1" data-route="/zona/${z.id}/editar">✏️ Editar Zona</button>
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
            <button class="btn btn-outline" data-route="/zonas">Volver</button>`;
    },

    async renderFormZona(id = null) {
        const main = document.getElementById('app-content'); let isEdit = id !== null;
        let d = id ? await Zonas.get(parseInt(id)) : { nombre: '', paraje: '', municipio: '', provincia: '', refCatastral: '', poligono: '', parcela: '', superficieGrafica: '', usoPrincipal: '', clase: '' };
        main.innerHTML = `
            <div class="card">
                <h3>${isEdit ? 'Editar' : 'Nueva'} Zona</h3>
                <form id="form-zona">
                    <div class="form-group"><label>Nombre de la Zona*</label><input type="text" id="z-nom" value="${App.escapeHtml(d.nombre)}" required></div>
                    <h4>Datos Catastrales</h4>
                    <div class="form-group"><label>Referencia Catastral</label><input type="text" id="z-ref" value="${d.refCatastral || ''}"></div>
                    <div class="grid-2">
                        <div class="form-group"><label>Polígono</label><input type="number" id="z-pol" value="${d.poligono || ''}"></div>
                        <div class="form-group"><label>Parcela</label><input type="number" id="z-parcela" value="${d.parcela || ''}"></div>
                    </div>
                    <div class="grid-2">
                        <div class="form-group"><label>Municipio</label><input type="text" id="z-mun" value="${App.escapeHtml(d.municipio || '')}"></div>
                        <div class="form-group"><label>Superficie (m²)</label><input type="number" id="z-sup" value="${d.superficieGrafica || ''}"></div>
                    </div>
                    <div class="grid-2">
                        <div class="form-group"><label>Uso Principal</label><input type="text" id="z-uso" value="${App.escapeHtml(d.usoPrincipal || '')}"></div>
                        <div class="form-group"><label>Clase</label><input type="text" id="z-clase" value="${App.escapeHtml(d.clase || '')}"></div>
                    </div>
                    <button type="submit" class="btn btn-primary">Guardar Zona</button>
                    ${isEdit ? `<button type="button" class="btn btn-danger mt-1" data-action="App._deleteZona" data-id="${id}">🗑️ Eliminar Zona</button>` : ''}
                    <button type="button" class="btn btn-outline mt-1" data-action="back">Cancelar</button>
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
            <button class="btn btn-outline" data-route="/zonas">Volver a Zonas</button>
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
    },

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
    }
};
