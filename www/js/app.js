import './idb-local.js';
import './seed-zonas.js';

import { dbPromise } from './db.js';
import { Billing } from './core/billing.js';
import { Fincas } from './fincas.js';
import { Utils } from './core/utils.js';
import { Events } from './core/events.js';
import { Router } from './core/router.js';

// UI Modules
import { DashboardUI } from './ui/dashboard-ui.js';
import { PesadasUI } from './ui/pesadas-ui.js';
import { ZonasUI } from './ui/zonas-ui.js';
import { FincasUI } from './ui/fincas-ui.js';
import { GastosUI } from './ui/gastos-ui.js';
import { ReportesUI } from './ui/reportes-ui.js';

export const App = {
    ...Utils,
    ...Events,
    ...Router,
    ...Billing,
    ...DashboardUI,
    ...PesadasUI,
    ...ZonasUI,
    ...FincasUI,
    ...GastosUI,
    ...ReportesUI,

    _activeObjectUrls: [],
    
    _totalsCache: null,
    _lastPesadasHash: null,
    
    _calculateQualityTotals(pesadas) {
        if (!pesadas || !Array.isArray(pesadas)) return { primera: {kg:0, quintales:0}, bornizo: {kg:0, quintales:0}, refugo: {kg:0, quintales:0} };
        
        const hash = pesadas.length + '_' + (pesadas.length > 0 ? pesadas[pesadas.length - 1].id : 0) + '_' + (pesadas.length > 0 ? pesadas[0].id : 0);
        
        if (this._totalsCache && this._lastPesadasHash === hash) {
            return this._totalsCache;
        }

        let tp = {kg:0, quintales:0}, tb = {kg:0, quintales:0}, tr = {kg:0, quintales:0};
        pesadas.forEach(p => {
            if(p.pesadasPorCalidad) {
                if(p.pesadasPorCalidad.primera.kg > 0) { tp.kg += p.pesadasPorCalidad.primera.kg; tp.quintales += p.pesadasPorCalidad.primera.quintales; }
                if(p.pesadasPorCalidad.bornizo.kg > 0) { tb.kg += p.pesadasPorCalidad.bornizo.kg; tb.quintales += p.pesadasPorCalidad.bornizo.quintales; }
                if(p.pesadasPorCalidad.refugo.kg > 0) { tr.kg += p.pesadasPorCalidad.refugo.kg; tr.quintales += p.pesadasPorCalidad.refugo.quintales; }
            }
        });
        
        this._totalsCache = { primera: tp, bornizo: tb, refugo: tr };
        this._lastPesadasHash = hash;
        return this._totalsCache;
    },

    openManualZonas() {
        window.location.href = 'manual-zonas.html';
    },

    async updateHeader() {
        const finca = await Fincas.getActive();
        const headerEl = document.getElementById('nombre-finca-header');
        if (finca) headerEl.innerHTML = `<span data-route="/fincas" style="cursor:pointer">${Utils.escapeHtml(finca.nombre)}</span>`;
        else headerEl.innerHTML = `<span data-route="/fincas" style="cursor:pointer">➕ Crear Finca</span>`;
        
        const iconEl = document.getElementById('finca-icon');
        if (iconEl) iconEl.innerHTML = '🌿';
    },

    async init() {
        try {
            console.log("App: Iniciando v6.3.1 (Local Only)...");
            window.addEventListener('hashchange', () => App.route());
            window.addEventListener('fincaChanged', () => { App.updateHeader().then(() => App.route()); });
            
            App.initEvents();
            Billing.init();
            await dbPromise;

            await App.updateHeader();
            await App.route();

            // Gestión del botón retroceder de Android
            if (window.Capacitor && window.Capacitor.Plugins.App) {
                window.Capacitor.Plugins.App.addListener('backButton', () => {
                    const hash = window.location.hash;
                    if (hash === '' || hash === '#/') {
                        if (confirm('¿Deseas salir de la aplicación?')) {
                            window.Capacitor.Plugins.App.exitApp();
                        }
                    } else {
                        window.history.back();
                    }
                });
            }

            // Lógica de Pantalla de Bienvenida (Wizard)
            const allFincas = await Fincas.list();
            const hideWelcome = localStorage.getItem('cork_hide_welcome') === 'true';

            if (!hideWelcome || allFincas.length === 0) {
                App.showWelcomeWizard();
            }

        } catch (error) {
            console.error(error);
            const content = document.getElementById('app-content');
            if (content) content.innerHTML = `<div class="card error-card"><h2>Error de Inicio</h2><p>${Utils.escapeHtml(error.message)}</p></div>`;
        }
    },

    showWelcomeWizard() {
        if (document.getElementById('tour-overlay')) return;

        const steps = [
            {
                title: "🌳 Bienvenido a Cork Manager",
                text: "Tu ecosistema digital para la gestión profesional de pesadas de corcho. Diseñado por y para el trabajo en el monte."
            },
            {
                title: "📍 Paso 1: Crea tu Finca",
                text: "Lo primero es registrar tu explotación en el menú <strong>FINCAS</strong>. Podrás configurar los precios de mercado y datos del comprador."
            },
            {
                title: "⚖️ Paso 2: Pesa en Campo",
                text: "Usa el botón <strong>NUEVA PESADA</strong>. La app funciona sin internet y calculará automáticamente los quintales según el factor que elijas."
            },
            {
                title: "📄 Paso 3: Informes Listos",
                text: "Al terminar la saca, genera informes en <strong>PDF o EXCEL</strong> con un solo clic para enviarlos por WhatsApp a tus compradores."
            }
        ];

        let currentStep = 0;
        const overlay = document.createElement('div');
        overlay.id = 'tour-overlay';
        overlay.className = 'tour-overlay';

        const renderStep = () => {
            const step = steps[currentStep];
            const isLast = currentStep === steps.length - 1;

            overlay.innerHTML = `
                <div class="tour-modal animate-in">
                    <div class="tour-step-content">
                        <h3>${step.title}</h3>
                        <p>${step.text}</p>
                    </div>

                    <div class="tour-dots">
                        ${steps.map((_, i) => `<div class="tour-dot ${i === currentStep ? 'active' : ''}"></div>`).join('')}
                    </div>

                    <div style="display:flex; gap:12px;">
                        ${currentStep > 0 ? `<button class="btn btn-secondary" id="wiz-prev" style="flex:1;">Atrás</button>` : ''}
                        <button class="btn btn-primary" id="wiz-next" style="flex:2;">${isLast ? '¡EMPEZAR!' : 'Siguiente'}</button>
                    </div>

                    <div class="welcome-checkbox-container">
                        <input type="checkbox" id="stop-welcome">
                        <label for="stop-welcome">No mostrar más al iniciar</label>
                    </div>
                </div>
            `;

            if (!document.getElementById('tour-overlay')) {
                document.body.appendChild(overlay);
            }

            document.getElementById('wiz-next').onclick = () => {
                if (isLast) {
                    const stop = document.getElementById('stop-welcome').checked;
                    if (stop) localStorage.setItem('cork_hide_welcome', 'true');
                    overlay.remove();
                } else {
                    currentStep++;
                    renderStep();
                }
            };

            if (currentStep > 0) {
                document.getElementById('wiz-prev').onclick = () => {
                    currentStep--;
                    renderStep();
                };
            }
        };

        renderStep();
    }
};

window.App = App;
App.init();
