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
            calidad: 'primera', 
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

        let selQ = d.calidad || 'primera';
        const pesoInicial = d.bruto ?? d.pesoBruto ?? '';

        main.innerHTML = `
            <div class="pesada-view animate-in">
                <div class="pesada-topbar">
                    <button type="button" class="pesada-cancel" data-route="/lista">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="18" height="18" aria-hidden="true"><polyline points="15 18 9 12 15 6"></polyline></svg>
                        Cancelar
                    </button>
                    <h1 class="pesada-topbar__title">${isEdit ? 'Editar pesada' : 'Nueva pesada'}</h1>
                </div>

                <form id="form-pesada" class="pesada-form${isEdit ? ' pesada-form--edit' : ''}" novalidate>
                    <!-- 1. Fecha y Nº Saca -->
                    <div class="grid-2 pesada-meta">
                        <div class="form-group">
                            <label class="pesada-label" for="p-fecha">Fecha</label>
                            <input type="date" id="p-fecha" value="${d.fecha}" class="pesada-input">
                        </div>
                        <div class="form-group">
                            <label class="pesada-label" for="p-saca">Nº Saca</label>
                            <input type="number" id="p-saca" value="${d.saca}" inputmode="numeric" class="pesada-input pesada-input--saca">
                        </div>
                    </div>

                    <!-- 2. Zona / Parcela -->
                    <div class="form-group">
                        <label class="pesada-label" for="p-zona">Zona / Parcela</label>
                        <select id="p-zona" class="pesada-select">
                            ${zonas.map(z => `<option value="${z.id}" ${curZona == z.id ? 'selected' : ''}>${Utils.escapeHtml(z.nombre)}</option>`).join('')}
                        </select>
                    </div>

                    <!-- 3. Peso neto (campo héroe) -->
                    <div class="pesada-hero">
                        <label class="pesada-hero__label" for="p-peso">Peso neto (kg)</label>
                        <input type="text" id="p-peso" class="input-hero pesada-hero__input"
                               inputmode="decimal" enterkeyhint="done" autocomplete="off"
                               pattern="[0-9]*[.,]?[0-9]*" placeholder="0.0"
                               value="${pesoInicial}" aria-describedby="p-validation-msg">
                        <p id="p-validation-msg" class="pesada-msg" role="alert" aria-live="polite"></p>
                    </div>

                    <!-- 4. Quintales calculados -->
                    <div class="pesada-calc">
                        <span id="calc-q" class="pesada-calc__value">0.00</span>
                        <span class="pesada-calc__label">quintales</span>
                    </div>

                    <!-- 5. Calidad -->
                    <fieldset class="pesada-quality">
                        <legend class="pesada-label">Calidad del corcho</legend>
                        <div class="quality-selector quality-selector--wide" role="group" aria-label="Calidad del corcho">
                            <button type="button" class="quality-btn quality-btn--wide" data-quality="primera" aria-pressed="${selQ === 'primera'}">1ª Calidad</button>
                            <button type="button" class="quality-btn quality-btn--wide" data-quality="bornizo" aria-pressed="${selQ === 'bornizo'}">Bornizo</button>
                            <button type="button" class="quality-btn quality-btn--wide" data-quality="refugo" aria-pressed="${selQ === 'refugo'}">Refugo</button>
                        </div>
                    </fieldset>

                    ${isEdit ? `<button type="button" class="btn btn-danger pesada-delete" data-action="App._deletePesada" data-id="${id}">Eliminar pesada</button>` : ''}

                    <!-- 6. CTA fija sobre la barra inferior -->
                    <div class="pesada-cta-wrap">
                        <button type="submit" class="btn btn-primary pesada-cta">Guardar pesada</button>
                    </div>
                </form>
            </div>
        `;

        const inP = document.getElementById('p-peso');
        const valMsg = document.getElementById('p-validation-msg');
        const qEl = document.getElementById('calc-q');

        // Acepta coma o punto decimal (teclados en español envían coma).
        const leerPeso = () => {
            const n = parseFloat(String(inP.value).replace(',', '.'));
            return Number.isFinite(n) ? n : 0;
        };

        let factorQuintal = 46;
        const up = async () => {
            const b = leerPeso();
            let config;
            try { config = Fincas._activeCache || await Fincas.getActive(); } catch (e) { config = null; }
            factorQuintal = config ? config.factorQuintal : 46;
            qEl.textContent = Math.max(0, b / factorQuintal).toFixed(2);

            if (b > 1500) {
                qEl.classList.add('is-warn');
                valMsg.textContent = 'Peso inusualmente alto (más de 1500 kg). Revisa la báscula.';
                valMsg.className = 'pesada-msg is-warn';
            } else {
                qEl.classList.remove('is-warn');
                valMsg.textContent = '';
                valMsg.className = 'pesada-msg';
            }
        };
        inP.addEventListener('input', up);
        up();

        const upQ = () => document.querySelectorAll('.quality-btn--wide').forEach(b => {
            const on = b.dataset.quality === selQ;
            b.classList.toggle('selected', on);
            b.setAttribute('aria-pressed', String(on));
        });
        document.querySelectorAll('.quality-btn--wide').forEach(b => b.onclick = () => {
            Utils.vibrate(15);
            selQ = b.dataset.quality;
            upQ();
        });
        upQ();

        document.getElementById('form-pesada').onsubmit = async (e) => {
            e.preventDefault();
            const b = leerPeso();

            // Punto 6: validación bloqueante. No se guarda nada inválido.
            if (!(b > 0)) {
                valMsg.textContent = 'Introduce un peso mayor que 0.';
                valMsg.className = 'pesada-msg is-error';
                inP.focus();
                Utils.vibrate([40, 60, 40]);
                return;
            }
            if (b > 1500) {
                const ok = await Utils.confirmDialog({
                    title: 'Peso muy alto',
                    message: `${b.toLocaleString('es-ES')} kg supera los 1500 kg. ¿Seguro que es correcto?`,
                    confirmText: 'Guardar igualmente',
                    variant: 'danger'
                });
                if (!ok) { inP.focus(); return; }
            }

            const dt = document.getElementById('p-fecha').value;
            const saca = parseInt(document.getElementById('p-saca').value);
            const dp = {
                id: isEdit ? parseInt(id) : undefined,
                zonaId: parseInt(document.getElementById('p-zona').value),
                fecha: dt || new Date().toISOString().split('T')[0],
                saca: saca,
                pesoBruto: b,
                tara: 0,
                calidad: selQ
            };

            await Pesadas.save(dp);
            Utils.toast('Guardada correctamente');
            this._renderOk({ saca, quintales: (b / factorQuintal).toFixed(2), calidad: selQ, isEdit });
        };

        // Con el teclado abierto la barra inferior y la CTA fija taparían el campo.
        // El WebView se redimensiona, así que se detecta por la altura del viewport.
        if (this._kbHandler && window.visualViewport) {
            window.visualViewport.removeEventListener('resize', this._kbHandler);
        }
        const vv = window.visualViewport;
        if (vv) {
            const base = vv.height;
            this._kbHandler = () => {
                const abierto = vv.height < base - 120;
                document.body.classList.toggle('kb-open', abierto);
                if (abierto && document.activeElement === inP) {
                    inP.scrollIntoView({ block: 'center', behavior: 'smooth' });
                }
            };
            vv.addEventListener('resize', this._kbHandler);
        }

        // Autofocus: deja el cursor y el campo listo. El WebView no abre el IME
        // sin un gesto del usuario, pero al tocarlo aparece en modo decimal.
        setTimeout(() => {
            if (inP) { inP.focus(); }
        }, 300);
    },

    // Punto 5: confirmación tras guardar, con los datos que el operario necesita
    // para cotejar con la báscula, y acceso directo a la siguiente pesada.
    _renderOk({ saca, quintales, calidad, isEdit }) {
        const nombres = { primera: '1ª calidad', bornizo: 'Bornizo', refugo: 'Refugo' };
        const main = document.getElementById('app-content');
        main.innerHTML = `
            <div class="card pesada-ok animate-in" role="status" aria-live="polite">
                <div class="pesada-ok__icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" width="34" height="34"><polyline points="20 6 9 17 4 12"></polyline></svg>
                </div>
                <h2 class="pesada-ok__title">${isEdit ? 'Pesada actualizada' : 'Pesada guardada'}</h2>
                <dl class="pesada-ok__data">
                    <div><dt>Nº saca</dt><dd>${saca}</dd></div>
                    <div><dt>Quintales</dt><dd>${quintales} q</dd></div>
                    <div><dt>Calidad</dt><dd>${nombres[calidad] || calidad}</dd></div>
                </dl>
                <button class="btn btn-primary" id="ok-nueva">Nueva pesada</button>
                <button class="btn btn-outline mt-1" data-route="/lista">Ver lista</button>
            </div>
        `;

        // El hash ya vale #/nueva: un data-route no dispararía hashchange,
        // así que se renderiza el formulario directamente.
        const btnNueva = main.querySelector('#ok-nueva');
        if (btnNueva) btnNueva.onclick = () => { this.renderFormPesada(); };
    },

    async _deletePesada(id) {
        const ok = await Utils.confirmDialog({
            title: 'Eliminar Pesada',
            message: '¿Estás seguro de que deseas eliminar esta pesada? Esta acción no se puede deshacer.',
            icon: '',
            confirmText: 'Eliminar',
            variant: 'danger'
        });
        if (ok) {
            await Pesadas.delete(id);
            Utils.toast('Pesada eliminada');
            window.location.hash = '#/lista';
        }
    },

    async renderLista() {
        const main = document.getElementById('app-content');
        // Show skeleton while loading
        main.innerHTML = Utils.renderSkeletonList();

        const pesadas = await Pesadas.list();
        const zonas = await Zonas.list();
        
        if (pesadas.length === 0) {
            main.innerHTML = Utils.renderEmptyState({
                icon: '',
                title: 'No hay pesadas',
                message: 'Registra tu primera pesada de corcho para empezar a llevar el control.',
                actionText: 'Nueva Pesada',
                actionRoute: '/nueva'
            });
            return;
        }

        // Initialize state
        this._todas = pesadas.sort((a,b) => b.fecha - a.fecha);
        this._zonas = zonas;
        this._page = 1;

        const t = App._calculateQualityTotals(pesadas);
        const totalQ = (t.primera.quintales + t.bornizo.quintales + t.refugo.quintales).toFixed(2);

        main.innerHTML = `<div class="ptr-container" id="ptr-list">
            <div class="ptr-indicator" id="ptr-indicator"><span></span></div>
            <div class="card" style="border-top: 5px solid var(--p-cork); padding: 25px; animation: fadeInUp 0.4s ease;">
                <div style="display:flex; align-items:center; gap:10px; margin-bottom:20px; justify-content:center;"><div style="width:4px; height:20px; background:var(--p-cork); border-radius:2px;"></div><h4 class="text-lime" style="margin:0; font-size:1rem; text-transform:uppercase; font-weight:800; letter-spacing: 1px;">Resumen Global</h4></div>
                <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; padding-top: 5px;">
                    <div><div class="text-grey" style="font-size: var(--fs-xs); font-weight: 800; letter-spacing:1px; margin-bottom: 6px;">1ª CAL</div><div class="bg-pill-lime text-lime" style="font-weight: 800; padding: 4px 8px; border-radius: 6px; display: inline-block;">${t.primera.quintales.toFixed(2)}</div></div>
                    <div><div class="text-grey" style="font-size: var(--fs-xs); font-weight: 800; letter-spacing:1px; margin-bottom: 6px;">BORNIZO</div><div class="bg-pill-gold text-gold" style="font-weight: 800; padding: 4px 8px; border-radius: 6px; display: inline-block;">${t.bornizo.quintales.toFixed(2)}</div></div>
                    <div><div class="text-grey" style="font-size: var(--fs-xs); font-weight: 800; letter-spacing:1px; margin-bottom: 6px;">REFUGO</div><div class="bg-pill-red text-red" style="font-weight: 800; padding: 4px 8px; border-radius: 6px; display: inline-block;">${t.refugo.quintales.toFixed(2)}</div></div>
                </div>
                <div style="text-align: center; margin-top: 20px; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 15px;">
                    <span class="text-grey" style="font-size: 0.8rem; text-transform: uppercase; font-weight:800; letter-spacing:1px;">Total Acumulado</span><br>
                    <strong class="text-lime" style="font-size: 2.2rem; text-shadow: 0 0 10px rgba(204,255,0,0.3);">${totalQ} <span style="font-size:0.5em; color:var(--text-s);">Q</span></strong>
                </div>
            </div>
            <div class="card" style="border-top: 5px solid #4FACFE; text-align: center; padding: 25px; animation: fadeInUp 0.4s ease; animation-delay: 0.1s;">
                <div style="display:flex; align-items:center; gap:10px; margin-bottom:15px; justify-content:center;"><div style="width:4px; height:20px; background:#4FACFE; border-radius:2px;"></div><h4 class="text-blue" style="margin:0; font-size:1rem; text-transform:uppercase; font-weight:800; letter-spacing: 1px;">Listado de Pesadas</h4></div>
                <div class="list-counter">${pesadas.length} pesada${pesadas.length !== 1 ? 's' : ''} registrada${pesadas.length !== 1 ? 's' : ''}</div>
                <button class="btn btn-secondary mt-1" data-action="Export.exportarPDF" data-tipo="lista"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle; margin-right:4px;"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>Exportar a PDF</button>
            </div>
            <div class="lista-detallada" id="lista-pesadas-container">
                ${this._renderPesadasHTML(pesadas.slice(0, this._perPage), zonas)}
            </div>
            ${pesadas.length > this._perPage ? `<div id="load-more-container" style="text-align:center; padding:20px;"><button class="btn btn-outline" data-action="App.loadMorePesadas">Cargar más (${pesadas.length - this._perPage} restantes)</button></div>` : ''}
        </div>`;

        // Setup swipe on initial batch
        this._setupSwipeOnCards();
        this._setupPullToRefresh();
    },

    _renderPesadasHTML(pesadas, zonas) {
        const starSVG = '<svg width="16" height="16" viewBox="0 0 24 24" fill="#CCFF00"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>';
        const circleSVG = '<svg width="14" height="14" viewBox="0 0 24 24" fill="#FFD700"><circle cx="12" cy="12" r="10"/></svg>';
        const refSVG = '<svg width="14" height="14" viewBox="0 0 24 24" fill="#FF4444"><polygon points="12 2 22 12 12 22 2 12"/></svg>';
        return pesadas.map(p => { 
            const z = zonas.find(z => z.id == p.zonaId); 
            let svg = starSVG, cal = '1ª Calidad', col = '#CCFF00', pillClass = 'bg-pill-lime text-lime'; 
            if (p.pesadasPorCalidad.bornizo.kg > 0) { svg = circleSVG; cal = 'Bornizo'; col = '#FFD700'; pillClass = 'bg-pill-gold text-gold'; } 
            else if (p.pesadasPorCalidad.refugo.kg > 0) { svg = refSVG; cal = 'Refugo'; col = '#FF4444'; pillClass = 'bg-pill-red text-red'; } 
            const fH = new Date(p.fecha).toLocaleString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }); 
            return `<div class="pesada-swipe-wrapper" data-id="${p.id}">
                <div class="pesada-swipe-actions swipe-edit" data-action-swipe="edit" data-id="${p.id}">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                </div>
                <div class="pesada-swipe-content" style="--card-color: ${col};">
                    <div class="pesada-card-content">
                        <div style="margin-bottom: 12px; display: flex; justify-content: space-between; align-items: center;">
                            <div class="pesada-saca-badge bg-pill-blue text-blue" style="border:none;">SACA #${p.saca}</div>
                            <strong class="${pillClass}" style="font-size: 1.1rem; display:flex; align-items:center; gap:6px; padding: 4px 8px; border-radius: 6px;">${svg} ${cal}</strong>
                        </div>
                        <div style="font-size: 1.1rem; margin-bottom: 12px; color: #fff;">
                            <strong>${Utils.escapeHtml(z ? z.nombre : '?')}</strong>
                        </div>
                        <table class="pesada-table-bordered">
                            <tr><th class="text-grey">FECHA Y HORA</th><td class="val-large text-grey">${fH}</td></tr>
                            <tr><th class="text-grey">PESO BRUTO</th><td class="val-large highlight text-grey">${p.kg.toFixed(1)} kg</td></tr>
                            <tr><th class="text-grey">PESO NETO</th><td class="val-large highlight" style="color: ${col};">${p.quintales.toFixed(2)} Q</td></tr>
                        </table>
                    </div>
                </div>
            </div>`; 
        }).join('');
    },

    _setupSwipeOnCards() {
        const wrappers = document.querySelectorAll('.pesada-swipe-wrapper');
        wrappers.forEach(w => {
            const id = w.dataset.id;
            const content = w.querySelector('.pesada-swipe-content');
            const editBtn = w.querySelector('.swipe-edit');
            if (!content || !editBtn) return;

            let startX = 0, startY = 0, currentX = 0, isDragging = false, swiped = false;

            const reset = () => {
                content.style.transition = 'transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)';
                content.style.transform = 'translateX(0)';
                content.classList.remove('swiped-left', 'swiped-right');
                swiped = false;
            };

            content.addEventListener('touchstart', (e) => {
                if (e.target.closest('button, [data-action], [data-route]')) return;
                startX = e.touches[0].clientX;
                startY = e.touches[0].clientY;
                content.style.transition = 'none';
                isDragging = true;
            }, { passive: true });

            content.addEventListener('touchmove', (e) => {
                if (!isDragging) return;
                const dx = e.touches[0].clientX - startX;
                const dy = e.touches[0].clientY - startY;
                if (Math.abs(dy) > Math.abs(dx)) { reset(); isDragging = false; return; }
                currentX = Math.max(-85, Math.min(0, dx));
                content.style.transform = `translateX(${currentX}px)`;
            }, { passive: true });

            content.addEventListener('touchend', () => {
                if (!isDragging) return;
                isDragging = false;
                content.style.transition = 'transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)';
                if (currentX < -40) {
                    content.style.transform = 'translateX(-75px)';
                    content.classList.add('swiped-left');
                    swiped = true;
                    App.vibrate(20);
                } else {
                    reset();
                }
                currentX = 0;
            });

            content.addEventListener('click', (e) => {
                if (swiped) {
                    e.preventDefault();
                    e.stopPropagation();
                    reset();
                    return;
                }
                location.hash = `/pesada/${id}/editar`;
            });

            editBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                location.hash = `/pesada/${id}/editar`;
            });

            // Reset swipe on scroll
            document.addEventListener('scroll', () => { if (swiped) reset(); }, { passive: true });
        });
    },

    _setupPullToRefresh() {
        const container = document.getElementById('ptr-list');
        const indicator = document.getElementById('ptr-indicator');
        if (!container || !indicator) return;

        let startY = 0, pulling = false, refreshing = false;

        container.addEventListener('touchstart', (e) => {
            if (container.scrollTop > 0) return;
            startY = e.touches[0].clientY;
            pulling = true;
        }, { passive: true });

        container.addEventListener('touchmove', (e) => {
            if (!pulling || refreshing) return;
            const dy = e.touches[0].clientY - startY;
            if (dy > 30) {
                indicator.classList.add('visible');
                indicator.innerHTML = '<span>Suelta para actualizar</span>';
            }
        }, { passive: true });

        container.addEventListener('touchend', async () => {
            if (!pulling || refreshing) return;
            const dy = indicator.classList.contains('visible');
            pulling = false;

            if (dy && container.scrollTop === 0) {
                refreshing = true;
                indicator.innerHTML = '<div class="ptr-spinner"></div><span>Actualizando...</span>';
                App.vibrate(15);
                await this.renderLista();
                refreshing = false;
                indicator.classList.remove('visible');
            } else {
                indicator.classList.remove('visible');
            }
        });
    },

    loadMorePesadas() {
        this._page++;
        const startIndex = (this._page - 1) * this._perPage;
        const endIndex = startIndex + this._perPage;
        const nextBatch = this._todas.slice(startIndex, endIndex);
        
        const container = document.getElementById('lista-pesadas-container');
        if (container && nextBatch.length > 0) {
            container.insertAdjacentHTML('beforeend', this._renderPesadasHTML(nextBatch, this._zonas));
            this._setupSwipeOnCards();
        }

        const remaining = this._todas.length - endIndex;
        const btnContainer = document.getElementById('load-more-container');
        if (btnContainer) {
            if (remaining > 0) {
                btnContainer.innerHTML = `<button class="btn btn-outline" data-action="App.loadMorePesadas">Cargar más (${remaining} restantes)</button>`;
            } else {
                btnContainer.innerHTML = '<div class="list-counter">Has llegado al final</div>';
                setTimeout(() => btnContainer.remove(), 3000);
            }
        }
    }
};
