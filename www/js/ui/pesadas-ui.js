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
                            <label class="text-grey" style="font-size: 0.75rem; font-weight:800; letter-spacing:1px;">Fecha</label>
                            <input type="date" id="p-fecha" value="${d.fecha}" style="height: 48px; font-size: 0.95rem; font-weight:600;">
                        </div>
                        <div class="form-group" style="margin-bottom: 0;">
                            <label class="text-grey" style="font-size: 0.75rem; font-weight:800; letter-spacing:1px;">Nº Saca</label>
                            <input type="number" id="p-saca" value="${d.saca}" style="height: 48px; font-size: 1.1rem; font-weight:800; color:#4FACFE; border-left:3px solid #4FACFE;">
                        </div>
                    </div>

                    <!-- 2. Zona / Parcela -->
                    <div class="form-group centered" style="margin-bottom: 12px;">
                        <label class="text-grey" style="font-size: 0.8rem; margin-bottom: 6px; font-weight:800; letter-spacing:1px;">Zona / Parcela</label>
                        <select id="p-zona" style="height:56px; font-size:1.1rem; font-weight:700; text-align-last:center; border-left:3px solid #F97316;">
                            ${zonas.map(z => `<option value="${z.id}" ${curZona == z.id ? 'selected' : ''}>${Utils.escapeHtml(z.nombre)}</option>`).join('')}
                        </select>
                    </div>

                    <hr style="border:0; border-top:1px solid var(--border); margin:15px 0;">

                    <!-- 3. Peso Neto Directo (campo estrella centrado) -->
                    <div class="form-group" style="text-align:center; margin: 20px 0;">
                        <label class="text-lime" style="font-size:1rem; margin-bottom: 10px; display:block; font-weight:800; letter-spacing:1px;">PESO NETO (KG)</label>
                        <input type="number" id="p-bruto" value="${d.bruto || d.pesoBruto || ''}" placeholder="0.0" step="0.1" required class="input-hero" style="text-align:center; font-size:3rem; height:100px; width:100%; font-weight:900; color:#CCFF00; background:rgba(204,255,0,0.05); border:2px solid rgba(204,255,0,0.2); box-shadow:inset 0 4px 10px rgba(0,0,0,0.5); border-radius:12px;">
                    </div>
                    
                    <div id="p-validation-msg" style="text-align:center; font-weight:bold; font-size: 0.9rem; margin-bottom: 15px; min-height:1.2em;">&nbsp;</div>

                    <!-- 4. Datos calculados: Quintales (antes de calidad) -->
                    <div class="card stat-grid" style="display:flex; justify-content:center; background: rgba(255,255,255,0.03); margin: 8px 0; padding: 10px !important;">
                        <div style="text-align:center;">
                            <div id="calc-q" class="stat-value" style="font-size: 2.2rem; color: #CCFF00; font-weight:900; text-shadow: 0 0 10px rgba(204,255,0,0.3);">0.00</div>
                            <div class="stat-label text-grey" style="font-size: 0.8rem; font-weight:800; letter-spacing:1px;">QUINTALES</div>
                        </div>
                    </div>

                    <hr style="border:0; border-top:1px solid var(--border); margin:15px 0;">

                    <!-- 5. Selector de Calidad -->
                    <div class="form-group centered" style="margin-bottom: 10px;">
                        <label class="text-grey" style="font-size: 0.85rem; margin-bottom: 8px; font-weight:800; letter-spacing:1px;">Calidad del Corcho</label>
                        <div class="quality-selector-centered" style="display:flex; justify-content: center; gap: 20px;">
                            <button type="button" class="quality-btn ${d.calidad === 'primera' ? 'selected' : ''}" data-quality="primera">
                                1ª
                            </button>
                            <button type="button" class="quality-btn ${d.calidad === 'bornizo' ? 'selected' : ''}" data-quality="bornizo">
                                Bo
                            </button>
                            <button type="button" class="quality-btn ${d.calidad === 'refugo' ? 'selected' : ''}" data-quality="refugo">
                                Re
                            </button>
                        </div>
                    </div>

                    <!-- BOTÓN GUARDAR (al final, natural) -->
                    <div style="margin-top: 15px; margin-bottom: 10px;">
                        <button type="submit" class="btn btn-primary" style="width:100%; height:80px; font-size:1.5rem; font-weight: 900;">GUARDAR PESADA</button>
                    </div>

                    <div style="display: flex; flex-direction: column; gap: 8px;">
                        ${isEdit ? `<button type="button" class="btn btn-danger" data-action="App._deletePesada" data-id="${id}" style="width:100%; height:55px; font-size: 1rem;">Eliminar Pesada</button>` : ''}
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
                if (qEl) { qEl.style.color = "#FFD700"; qEl.style.textShadow = "0 0 10px rgba(255,215,0,0.3)"; }
                valMsg.textContent = "Peso inusualmente alto (>1500kg)";
                valMsg.style.color = "#FFD700";
            } else {
                if (qEl) { qEl.style.color = "#CCFF00"; qEl.style.textShadow = "0 0 10px rgba(204,255,0,0.3)"; }
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
        document.querySelectorAll('.quality-btn').forEach(b => b.onclick = () => { 
            try { App.vibrate(15); } catch(e) {}
            selQ = b.dataset.quality; 
            upQ(); 
        });
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
            Utils.toast('Guardada correctamente');
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
                    <div><div class="text-grey" style="font-size: 0.7rem; font-weight: 800; letter-spacing:1px; margin-bottom: 6px;">1ª CAL</div><div class="bg-pill-lime text-lime" style="font-weight: 800; padding: 4px 8px; border-radius: 6px; display: inline-block;">${t.primera.quintales.toFixed(2)}</div></div>
                    <div><div class="text-grey" style="font-size: 0.7rem; font-weight: 800; letter-spacing:1px; margin-bottom: 6px;">BORNIZO</div><div class="bg-pill-gold text-gold" style="font-weight: 800; padding: 4px 8px; border-radius: 6px; display: inline-block;">${t.bornizo.quintales.toFixed(2)}</div></div>
                    <div><div class="text-grey" style="font-size: 0.7rem; font-weight: 800; letter-spacing:1px; margin-bottom: 6px;">REFUGO</div><div class="bg-pill-red text-red" style="font-weight: 800; padding: 4px 8px; border-radius: 6px; display: inline-block;">${t.refugo.quintales.toFixed(2)}</div></div>
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
