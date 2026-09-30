import { Fincas } from '../fincas.js';
import { Pesadas } from '../pesadas.js';
import { App } from '../app.js';
import { Utils } from '../core/utils.js';

export const DashboardUI = {
    async renderWelcomeWizard() {
        const main = document.getElementById('app-content');
        main.innerHTML = `
            <div class="card text-center welcome-wizard animate-in">
                <img src="icons/logo-header.png" style="width: 140px; margin-bottom: 25px; animation: fadeInUp 0.6s ease;">
                <h1 style="animation: fadeInUp 0.6s ease 0.1s both;">¡Bienvenido!</h1>
                <p style="animation: fadeInUp 0.6s ease 0.2s both;">Crea o importa una finca para comenzar.</p>
                <div class="wizard-actions mt-2" style="display:flex; flex-direction:column; gap:12px;">
                    <button class="btn btn-primary" data-action="App._showFincaForm" style="animation: fadeInUp 0.6s ease 0.3s both;">Crear Finca</button>
                    <button class="btn btn-secondary" data-trigger="import-wizard" style="animation: fadeInUp 0.6s ease 0.35s both;">Importar Backup Local</button>
                    <input type="file" id="import-wizard" accept=".json" style="display:none">
                </div>
            </div>`;
        const input = document.getElementById('import-wizard');
        if (input) input.onchange = async (e) => { if (e.target.files[0]) await App._handleImportFile(e.target.files[0]); };
    },

    async renderDashboard() {
        const main = document.getElementById('app-content');
        // Show skeleton while loading
        main.innerHTML = Utils.renderSkeletonDashboard();
        await new Promise(r => setTimeout(r, 50));

        const finca = await Fincas.getActive();
        const pesadas = await Pesadas.list();
        const tGlobal = App._calculateQualityTotals(pesadas);
        const totalQGlobal = (tGlobal.primera.quintales + tGlobal.bornizo.quintales + tGlobal.refugo.quintales).toFixed(2);

        main.innerHTML = `
            <div class="bento-grid" style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin-bottom: 24px; animation: fadeInUp 0.4s ease;">
                
                <!-- Resumen Global (Full width) -->
                <div class="card" style="grid-column: span 2; margin-bottom: 0; padding: 20px; text-align: center;">
                    <h3 style="color: #94A3B8; font-size: 0.8rem; text-transform: uppercase; margin-bottom: 15px; font-weight: 700; letter-spacing: 0.1em;">Resumen de Campaña</h3>
                    <div style="font-size: 2.5rem; font-weight: 800; line-height: 1; margin-bottom: 15px;" class="text-lime">${totalQGlobal} <span style="font-size: 0.5em;" class="text-grey">Q</span></div>
                    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; border-top: 1px solid #333333; padding-top: 15px;">
                        <div><div class="text-grey" style="font-size: 0.7rem; font-weight: 700; margin-bottom: 6px;">1ª CAL</div><div class="bg-pill-lime text-lime" style="font-weight: 800; padding: 4px 8px; border-radius: 6px; display: inline-block;">${tGlobal.primera.quintales.toFixed(2)}</div></div>
                        <div><div class="text-grey" style="font-size: 0.7rem; font-weight: 700; margin-bottom: 6px;">BORNIZO</div><div class="bg-pill-gold text-gold" style="font-weight: 800; padding: 4px 8px; border-radius: 6px; display: inline-block;">${tGlobal.bornizo.quintales.toFixed(2)}</div></div>
                        <div><div class="text-grey" style="font-size: 0.7rem; font-weight: 700; margin-bottom: 6px;">REFUGO</div><div class="bg-pill-red text-red" style="font-weight: 800; padding: 4px 8px; border-radius: 6px; display: inline-block;">${tGlobal.refugo.quintales.toFixed(2)}</div></div>
                    </div>
                </div>

                <!-- Resumen Hoy (Full width) -->
                <div id="resumenHoy" class="card" style="grid-column: span 2; margin-bottom: 0; padding: 20px; text-align: center;">
                    <h3 style="color: #94A3B8; font-size: 0.8rem; text-transform: uppercase; margin-bottom: 15px; font-weight: 700; letter-spacing: 0.1em;">Resumen Hoy</h3>
                    <div style="font-size: 2.5rem; font-weight: 800; color: #FFFFFF; line-height: 1; margin-bottom: 5px;"><span id="qTotal">0.0</span> <span style="font-size: 0.5em;" class="text-grey">Q</span></div>
                    <div style="font-size: 0.9rem; margin-bottom: 15px;" class="text-blue"><span id="kgTotal" style="font-weight: 700;">0</span> kg</div>
                    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; border-top: 1px solid #333333; padding-top: 15px;">
                        <div><div class="text-grey" style="font-size: 0.7rem; font-weight: 700; margin-bottom: 6px;">1ª CAL</div><div class="bg-pill-lime text-lime" style="font-weight: 800; padding: 4px 8px; border-radius: 6px; display: inline-block;"><span id="qPrimera">0.0</span></div><div class="text-grey" style="font-size:0.7rem; margin-top: 4px;"><span id="kgPrimera">0</span>kg</div></div>
                        <div><div class="text-grey" style="font-size: 0.7rem; font-weight: 700; margin-bottom: 6px;">BORNIZO</div><div class="bg-pill-gold text-gold" style="font-weight: 800; padding: 4px 8px; border-radius: 6px; display: inline-block;"><span id="qBornizo">0.0</span></div><div class="text-grey" style="font-size:0.7rem; margin-top: 4px;"><span id="kgBornizo">0</span>kg</div></div>
                        <div><div class="text-grey" style="font-size: 0.7rem; font-weight: 700; margin-bottom: 6px;">REFUGO</div><div class="bg-pill-red text-red" style="font-weight: 800; padding: 4px 8px; border-radius: 6px; display: inline-block;"><span id="qRefugo">0.0</span></div><div class="text-grey" style="font-size:0.7rem; margin-top: 4px;"><span id="kgRefugo">0</span>kg</div></div>
                    </div>
                </div>

                <!-- Acciones Bento (2 cols x 2 rows) -->
                <div class="card card-interactive" style="margin-bottom: 0; padding: 20px; text-align: center; cursor: pointer; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; background: #CCFF00; border: none;" data-route="/nueva">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#121212" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                    <span style="color: #121212; font-weight: 800; font-size: 0.9rem;">PESADA</span>
                </div>
                <div class="card card-interactive" style="margin-bottom: 0; padding: 20px; text-align: center; cursor: pointer; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px;" data-route="/lista">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#CCFF00" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>
                    <span style="color: #FFFFFF; font-weight: 700; font-size: 0.9rem;">LISTA</span>
                </div>
                <div class="card card-interactive" style="margin-bottom: 0; padding: 20px; text-align: center; cursor: pointer; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px;" data-route="/informes">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#CCFF00" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.21 15.89A10 10 0 1 1 8 2.83"></path><path d="M22 12A10 10 0 0 0 12 2v10z"></path></svg>
                    <span style="color: #FFFFFF; font-weight: 700; font-size: 0.9rem;">INFORMES</span>
                </div>
                <div class="card card-interactive" style="margin-bottom: 0; padding: 20px; text-align: center; cursor: pointer; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px;" data-route="/fincas">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#CCFF00" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
                    <span style="color: #FFFFFF; font-weight: 700; font-size: 0.9rem;">FINCAS</span>
                </div>
            </div>
            
            <div id="ultimas-pesadas-container"></div>
        `;
        await App.actualizarResumenHoy();
        await App.renderUltimasPesadas();
        
        if (!localStorage.getItem('cork_tour_completed')) {
            this._renderTourModal();
        }
    },

    async actualizarResumenHoy() {
        const pesadas = await Pesadas.list();
        const hoy = new Date().toDateString();
        const pesadasHoy = pesadas.filter(p => new Date(p.fecha).toDateString() === hoy);
        const t = App._calculateQualityTotals(pesadasHoy);
        const el = (id, val) => { const e = document.getElementById(id); if (e) e.textContent = val; };
        el('qPrimera', t.primera.quintales.toFixed(2)); el('kgPrimera', t.primera.kg.toFixed(0));
        el('qBornizo', t.bornizo.quintales.toFixed(2)); el('kgBornizo', t.bornizo.kg.toFixed(0));
        el('qRefugo', t.refugo.quintales.toFixed(2)); el('kgRefugo', t.refugo.kg.toFixed(0));
        const qTotal = (t.primera.quintales + t.bornizo.quintales + t.refugo.quintales).toFixed(2);
        const kgTotal = (t.primera.kg + t.bornizo.kg + t.refugo.kg).toFixed(0);
        el('qTotal', qTotal); el('kgTotal', kgTotal);
    },

    async renderUltimasPesadas() {
        const container = document.getElementById('ultimas-pesadas-container');
        if (!container) return;
        const pesadas = await Pesadas.list();
        if (pesadas.length === 0) { 
            container.innerHTML = Utils.renderEmptyState({
                icon: '',
                title: 'Sin actividad',
                message: 'Aún no has registrado ninguna pesada. ¡Empieza hoy!'
            });
            return; 
        }
        const limit = 5;
        const recent = pesadas.sort((a,b)=>b.fecha-a.fecha).slice(0, limit);
        const starSVG = '<svg width="16" height="16" viewBox="0 0 24 24" fill="#CCFF00"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>';
        const circleSVG = '<svg width="14" height="14" viewBox="0 0 24 24" fill="#FFD700"><circle cx="12" cy="12" r="10"/></svg>';
        const refSVG = '<svg width="14" height="14" viewBox="0 0 24 24" fill="#FF4444"><polygon points="12 2 22 12 12 22 2 12"/></svg>';
        let h = `<div class="card" style="border-top: 5px solid var(--accent); padding: 25px; animation: fadeInUp 0.4s ease; animation-delay: 0.2s;"><h3 style="text-align:center; color: #fff; font-size: 1.3rem; margin-bottom: 20px; border:none; padding:0;">Últimas Pesadas Registradas</h3><div class="lista-detallada">`;
        for (const p of recent) {
            let svg = starSVG, cal = '1ª Calidad', col = '#CCFF00', pillClass = 'bg-pill-lime text-lime';
            if (p.pesadasPorCalidad.bornizo.kg > 0) { svg = circleSVG; cal = 'Bornizo'; col = '#FFD700'; pillClass = 'bg-pill-gold text-gold'; }
            else if (p.pesadasPorCalidad.refugo.kg > 0) { svg = refSVG; cal = 'Refugo'; col = '#FF4444'; pillClass = 'bg-pill-red text-red'; }
            const fh = new Date(p.fecha).toLocaleString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
            h += `<div class="pesada-card" style="--card-color: ${col}; cursor:pointer;" data-route="/pesada/${p.id}/editar"><div class="pesada-card-content"><div style="margin-bottom: 12px; display: flex; justify-content: space-between; align-items: center;"><div class="pesada-saca-badge bg-pill-blue text-blue" style="border:none;">SACA #${p.saca}</div><strong class="${pillClass}" style="font-size: 1rem; display:flex; align-items:center; gap:5px; padding: 4px 8px; border-radius: 6px;">${svg} ${cal}</strong></div><table class="pesada-table-bordered"><tr><th class="text-grey">FECHA Y HORA</th><td class="val-large text-grey">${fh}</td></tr><tr><th class="text-grey">PESO BRUTO</th><td class="val-large highlight text-grey">${p.kg.toFixed(1)} kg</td></tr><tr><th class="text-grey">PESO NETO</th><td class="val-large highlight" style="color: ${col};">${p.quintales.toFixed(2)} Q</td></tr></table></div></div>`;
        }
        h += `</div><div class="text-center mt-2"><button class="btn btn-outline" style="font-size:0.9rem;" data-route="/lista">Ver Todo</button></div></div>`;
        container.innerHTML = h;
    },

    _renderTourModal() {
        if (document.getElementById('tour-overlay')) return;
        
        const steps = [
            { title: "Bienvenido a Cork Manager", text: "Esta aplicación te ayudará a gestionar tus pesadas de corcho de forma rápida y sin conexión a internet." },
            { title: "1. Crea tu Finca", text: "Antes de empezar a pesar, ve a la sección <strong>FINCAS</strong> para registrar los datos de tu explotación y compradores." },
            { title: "2. Registra Pesadas", text: "Usa el botón <strong>NUEVA PESADA</strong> en el campo. La app calculará automáticamente la merma y los quintales." },
            { title: "3. Saca Informes", text: "Cuando termines, ve a <strong>INFORMES</strong> para exportar el balance en PDF o Excel y enviarlo por WhatsApp." }
        ];
        
        let currentStep = 0;
        
        const overlay = document.createElement('div');
        overlay.id = 'tour-overlay';
        overlay.className = 'tour-overlay';
        
        const renderStep = () => {
            const step = steps[currentStep];
            const isLast = currentStep === steps.length - 1;
            
            overlay.innerHTML = `
                <div class="tour-modal">
                    <h3>${step.title}</h3>
                    <p>${step.text}</p>
                    <div class="tour-dots">
                        ${steps.map((_, i) => `<div class="tour-dot ${i === currentStep ? 'active' : ''}"></div>`).join('')}
                    </div>
                    <div style="display:flex; gap:10px; margin-top:20px;">
                        ${currentStep > 0 ? `<button class="btn btn-secondary" id="btn-tour-prev" style="flex:1;">Atrás</button>` : ''}
                        <button class="btn btn-primary" id="btn-tour-next" style="flex:2;">${isLast ? 'Empezar' : 'Siguiente'}</button>
                    </div>
                    <button class="btn btn-outline mt-2" id="btn-tour-skip" style="width:100%; border:none; margin-top:15px;">Saltar tour</button>
                </div>
            `;
            
            document.body.appendChild(overlay);
            
            if (currentStep > 0) {
                document.getElementById('btn-tour-prev').onclick = () => { currentStep--; renderStep(); };
            }
            
            document.getElementById('btn-tour-next').onclick = () => {
                if (isLast) finishTour();
                else { currentStep++; renderStep(); }
            };
            
            document.getElementById('btn-tour-skip').onclick = finishTour;
        };
        
        const finishTour = () => {
            localStorage.setItem('cork_tour_completed', 'true');
            overlay.remove();
        };
        
        renderStep();
    }
};
