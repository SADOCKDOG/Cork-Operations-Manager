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
            <div class="card" style="border-top: 5px solid var(--p-cork); padding: 25px; margin-bottom: 25px; animation: fadeInUp 0.4s ease;">
                <h3 style="text-align:center; color: #fff; font-size: 1.4rem; margin-bottom: 20px; border:none; padding:0;">Resumen Global de Campaña</h3>
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

            <div id="resumenHoy" class="card" style="border-top: 5px solid var(--p-cork); padding: 25px; animation: fadeInUp 0.4s ease; animation-delay: 0.1s;">
                <h3 style="text-align:center; color: #fff; font-size: 1.4rem; margin-bottom: 20px; border:none; padding:0;">Resumen Hoy</h3>
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
            </div>

            <div class="card" style="border-top: 5px solid var(--accent); padding: 25px; animation: fadeInUp 0.4s ease; animation-delay: 0.15s;">
                <h3 style="text-align:center; color: #fff; font-size: 1.4rem; margin-bottom: 20px; border:none; padding:0;">Acciones Rápidas</h3>
                <div class="grid-2">
                    <button class="btn btn-primary" style="height:100%; min-height:80px; font-size:1.1rem;" data-route="/nueva">➕ PESADA</button>
                    <button class="btn btn-secondary" style="height:100%; min-height:80px; font-size:1.1rem;" data-route="/lista">📋 LISTA</button>
                    <button class="btn btn-outline" style="height:100%; min-height:80px; font-size:1rem;" data-route="/informes">📊 INFORMES</button>
                    <button class="btn btn-outline" style="height:100%; min-height:80px; font-size:1rem;" data-route="/fincas">⚙️ FINCAS</button>
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
        const starSVG = '<svg width="16" height="16" viewBox="0 0 24 24" fill="#10b981"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>';
        const circleSVG = '<svg width="14" height="14" viewBox="0 0 24 24" fill="#eab308"><circle cx="12" cy="12" r="10"/></svg>';
        const refSVG = '<svg width="14" height="14" viewBox="0 0 24 24" fill="#ef4444"><polygon points="12 2 22 12 12 22 2 12"/></svg>';
        let h = `<div class="card" style="border-top: 5px solid #8e9eab; padding: 25px; animation: fadeInUp 0.4s ease; animation-delay: 0.2s;"><h3 style="text-align:center; color: #fff; font-size: 1.3rem; margin-bottom: 20px; border:none; padding:0;">Últimas Pesadas Registradas</h3><div class="lista-detallada">`;
        for (const p of recent) {
            let svg = starSVG, cal = '1ª Calidad', col = '#10b981';
            if (p.pesadasPorCalidad.bornizo.kg > 0) { svg = circleSVG; cal = 'Bornizo'; col = '#eab308'; }
            else if (p.pesadasPorCalidad.refugo.kg > 0) { svg = refSVG; cal = 'Refugo'; col = '#ef4444'; }
            const fh = new Date(p.fecha).toLocaleString('es-ES', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
            h += `<div class="pesada-card" style="--card-color: ${col}; cursor:pointer;" data-route="/pesada/${p.id}/editar"><div class="pesada-card-content"><div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;"><div class="pesada-saca-badge" style="font-size:0.8rem; padding:4px 8px;">SACA #${p.saca}</div><strong style="color: ${col}; font-size: 1rem; display:flex; align-items:center; gap:5px;">${svg} ${cal}</strong></div><div style="display:flex; justify-content:space-between; color:#fff; align-items:center;"><span>${fh}</span><strong style="font-size:1.2rem;">${p.kg.toFixed(1)} kg</strong></div></div></div>`;
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
