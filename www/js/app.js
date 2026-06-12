import './idb-local.js';
import './seed-zonas.js';

import { dbPromise } from './db.js';
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
            await dbPromise;

            await App.updateHeader();
            await App.route();

        } catch (error) {
            console.error(error);
            const content = document.getElementById('app-content');
            if (content) content.innerHTML = `<div class="card error-card"><h2>Error de Inicio</h2><p>${Utils.escapeHtml(error.message)}</p></div>`;
        }
    }
};

window.App = App;
App.init();
