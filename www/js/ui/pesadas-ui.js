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

        main.innerHTML = `
            <div class="card card-fullscreen animate-in" style="border-top: 5px solid ${isEdit ? '#eab308' : 'var(--p-cork)'}; padding: 15px 20px;">
                <form id="form-pesada">
                    <!-- 1. Fecha y Nº Saca (contexto temporal, compacto) -->
                    <div class="grid-2" style="gap: 10px; margin-bottom: 10px;">
                        <div class="form-group" style="margin-bottom: 0;">
                            <label style="font-size: 0.75rem;">Fecha</label>
                            <input type="date" id="p-fecha" value="${d.fecha}" style="height: 48px; font-size: 0.95rem;">
                        </div>
                        <div class="form-group" style="margin-bottom: 0;">
                            <label style="font-size: 0.75rem;">Nº Saca</label>
                            <input type="number" id="p-saca" value="${d.saca}" style="height: 48px; font-size: 0.95rem;">
                        </div>
                    </div>

                    <!-- 2. Zona / Parcela -->
                    <div class="form-group centered" style="margin-bottom: 12px;">
                        <label style="font-size: 0.8rem; margin-bottom: 6px;">Zona / Parcela</label>
                        <select id="p-zona" style="height:56px; font-size:1.1rem; text-align-last:center;">
                            ${zonas.map(z => `<option value="${z.id}" ${curZona == z.id ? 'selected' : ''}>${Utils.escapeHtml(z.nombre)}</option>`).join('')}
                        </select>
                    </div>

                    <hr style="border:0; border-top:1px solid var(--border); margin:15px 0;">

                    <!-- 3. Peso Neto Directo (campo estrella centrado) -->
                    <div class="form-group centered" style="text-align:center; margin-bottom: 5px;">
                        <label style="font-size:1rem; margin-bottom: 5px;">⚖️ Peso Neto (kg)</label>
                        <input type="number" id="p-bruto" value="${d.bruto || d.pesoBruto || ''}" placeholder="0.0" step="0.1" required class="input-huge">
                    </div>
                    
                    <div id="p-validation-msg" style="text-align:center; font-weight:bold; font-size: 0.8rem; margin-bottom: 10px;">&nbsp;</div>

                    <!-- 4. Datos calculados: Quintales (antes de calidad) -->
                    <div class="card stat-grid" style="display:flex; justify-content:center; background: rgba(255,255,255,0.03); margin: 8px 0; padding: 10px !important;">
                        <div style="text-align:center;">
                            <div id="calc-q" class="stat-value" style="font-size: 2.2rem; color: #10b981; font-weight:900;">0.00</div>
                            <div class="stat-label" style="color:var(--text-s); font-size: 0.8rem;">Quintales</div>
                        </div>
                    </div>

                    <hr style="border:0; border-top:1px solid var(--border); margin:15px 0;">

                    <!-- 5. Selector de Calidad -->
                    <div class="form-group centered" style="margin-bottom: 10px;">
                        <label style="font-size: 0.85rem; margin-bottom: 8px;">Calidad del Corcho</label>
                        <div class="quality-selector-centered" style="display:flex; gap:10px;">
                            <button type="button" class="quality-btn ${d.calidad === 'primera' ? 'selected' : ''}" data-quality="primera" style="flex:1; height:56px; font-size:1rem; display:flex; align-items:center; justify-content:center; gap:6px;">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg> 1ª
                            </button>
                            <button type="button" class="quality-btn ${d.calidad === 'bornizo' ? 'selected' : ''}" data-quality="bornizo" style="flex:1; height:56px; font-size:1rem; display:flex; align-items:center; justify-content:center; gap:6px;">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10"/></svg> Bo
                            </button>
                            <button type="button" class="quality-btn ${d.calidad === 'refugo' ? 'selected' : ''}" data-quality="refugo" style="flex:1; height:56px; font-size:1rem; display:flex; align-items:center; justify-content:center; gap:6px;">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 22 12 12 22 2 12"/></svg> Re
                            </button>
                        </div>
                    </div>

                    <!-- BOTÓN GUARDAR (al final, natural) -->
                    <div style="margin-top: 15px; margin-bottom: 10px;">
                        <button type="submit" class="btn btn-primary" style="width:100%; height:80px; font-size:1.5rem; font-weight: 900;">💾 GUARDAR PESADA</button>
                    </div>

                    <div style="display: flex; flex-direction: column; gap: 8px;">
                        ${isEdit ? `<button type="button" class="btn btn-danger" data-action="App._deletePesada" data-id="${id}" style="width:100%; height:55px; font-size: 1rem;">🗑️ Eliminar Pesada</button>` : ''}
                        <button type="button" class="btn btn-outline" data-action="back" style="width:100%; height:55px; font-size: 1rem;">Cancelar</button>
                    </div>
                </form>
            </div>
        `;

        const inB = document.getElementById('p-bruto');
        const valMsg = document.getElementById('p-validation-msg');
        
        const up = async () => {
            const b = parseFloat(inB.value) || 0;
            const t = 0; // Tara removed
            const config = Fincas._activeCache || await Fincas.getActive();
            const factor = config ? config.factorQuintal : 46;
            const n = b - t;
            const qEl = document.getElementById('calc-q');
            
            if (qEl) qEl.textContent = Math.max(0, n / factor).toFixed(2);
            if (b > 1500) {
                if (qEl) qEl.style.color = "#eab308";
                valMsg.textContent = "⚠️ Peso inusualmente alto (>1500kg)";
                valMsg.style.color = "#eab308";
            } else {
                if (qEl) qEl.style.color = "#10b981";
                valMsg.innerHTML = "&nbsp;";
            }
        };
        inB.addEventListener('input', up);
        up();

        let selQ = d.calidad || 'primera';
        const upQ = () => document.querySelectorAll('.quality-btn').forEach(b => {
            if(b.dataset.quality === selQ) b.classList.add('selected');
            else b.classList.remove('selected');
        });
        document.querySelectorAll('.quality-btn').forEach(b => b.onclick = () => { selQ = b.dataset.quality; upQ(); });
        upQ();

        document.getElementById('form-pesada').onsubmit = async (e) => {
            e.preventDefault();
            const dt = document.getElementById('p-fecha').value;
            
            const b = parseFloat(inB.value) || 0;
            const t = 0;

            const dp = {
                id: isEdit ? parseInt(id) : undefined,
                zonaId: parseInt(document.getElementById('p-zona').value),
                fecha: dt || new Date().toISOString().split('T')[0],
                saca: parseInt(document.getElementById('p-saca').value),
                pesoBruto: b,
                tara: t,
                calidad: selQ
            };

            await Pesadas.save(dp);
            Utils.toast('✅ Guardada correctamente');
            window.location.hash = '#/lista';
        };

        // Autofocus y apertura de teclado numérico
        setTimeout(() => {
            if (inB) {
                inB.focus();
                inB.click(); // Algunos navegadores Android requieren click para el teclado
            }
        }, 300);
    },

    async _deletePesada(id) {
        const ok = await Utils.confirmDialog({
            title: 'Eliminar Pesada',
            message: '¿Estás seguro de que deseas eliminar esta pesada? Esta acción no se puede deshacer.',
            icon: '🗑️',
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
                icon: '⚖️',
                title: 'No hay pesadas',
                message: 'Registra tu primera pesada de corcho para empezar a llevar el control.',
                actionText: '➕ Nueva Pesada',
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
            <div class="ptr-indicator" id="ptr-indicator"><span>Desliza para actualizar</span></div>
            <div class="card" style="border-top: 5px solid var(--p-cork); padding: 25px; animation: fadeInUp 0.4s ease;">
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
            <div class="card" style="border-top: 5px solid var(--accent); text-align: center; padding: 25px; animation: fadeInUp 0.4s ease; animation-delay: 0.1s;">
                <h3 style="font-size: 1.5rem; margin-bottom: 15px; color: #fff; border:none;">Listado de Pesadas</h3>
                <div class="list-counter">${pesadas.length} pesada${pesadas.length !== 1 ? 's' : ''} registrada${pesadas.length !== 1 ? 's' : ''}</div>
                <button class="btn btn-secondary mt-1" data-action="Export.exportarPDF" data-tipo="lista">📄 Exportar a PDF</button>
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
        const starSVG = '<svg width="16" height="16" viewBox="0 0 24 24" fill="#10b981"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>';
        const circleSVG = '<svg width="14" height="14" viewBox="0 0 24 24" fill="#eab308"><circle cx="12" cy="12" r="10"/></svg>';
        const refSVG = '<svg width="14" height="14" viewBox="0 0 24 24" fill="#ef4444"><polygon points="12 2 22 12 12 22 2 12"/></svg>';
        return pesadas.map(p => { 
            const z = zonas.find(z => z.id == p.zonaId); 
            let svg = starSVG, cal = '1ª Calidad', col = '#10b981'; 
            if (p.pesadasPorCalidad.bornizo.kg > 0) { svg = circleSVG; cal = 'Bornizo'; col = '#eab308'; } 
            else if (p.pesadasPorCalidad.refugo.kg > 0) { svg = refSVG; cal = 'Refugo'; col = '#ef4444'; } 
            const fH = new Date(p.fecha).toLocaleString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }); 
            return `<div class="pesada-swipe-wrapper" data-id="${p.id}">
                <div class="pesada-swipe-actions swipe-edit" data-action-swipe="edit" data-id="${p.id}">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                </div>
                <div class="pesada-swipe-content" style="--card-color: ${col};">
                    <div class="pesada-card-content">
                        <div style="margin-bottom: 12px; display: flex; justify-content: space-between; align-items: center;">
                            <div class="pesada-saca-badge">SACA #${p.saca}</div>
                            <strong style="color: ${col}; font-size: 1.1rem; display:flex; align-items:center; gap:6px;">${svg} ${cal}</strong>
                        </div>
                        <div style="font-size: 1.1rem; margin-bottom: 12px; color: #fff;">
                            <strong>${Utils.escapeHtml(z ? z.nombre : '?')}</strong>
                        </div>
                        <table class="pesada-table-bordered">
                            <tr><th>FECHA Y HORA</th><td class="val-large">${fH}</td></tr>
                            <tr><th>PESO BRUTO</th><td class="val-large highlight">${p.kg.toFixed(1)} kg</td></tr>
                            <tr><th>PESO NETO</th><td class="val-large highlight">${p.quintales.toFixed(2)} Q</td></tr>
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
                btnContainer.innerHTML = '<div class="list-counter">Has llegado al final 🏁</div>';
                setTimeout(() => btnContainer.remove(), 3000);
            }
        }
    }
};
