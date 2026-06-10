import { Export } from '../export.js';
import { App } from '../app.js';

export const Events = {
    initEvents() {
        document.body.addEventListener('click', (e) => {
            const btn = e.target.closest('[data-action], [data-route], [data-trigger]');
            if (!btn) return;
            if (btn.classList.contains('stop-prop')) e.stopPropagation();
            
            if (btn.dataset.route) {
                location.hash = btn.dataset.route;
            } else if (btn.dataset.trigger) {
                const target = document.getElementById(btn.dataset.trigger);
                if (target) target.click();
            } else if (btn.dataset.action) {
                App.dispatchAction(btn, e);
            }
        });
    },

    dispatchAction(btn, e) {
        const action = btn.dataset.action;
        if (action === 'back') history.back();
        else if (action === 'App._showFincaForm') App._showFincaForm(btn.dataset.id ? parseInt(btn.dataset.id) : null);
        else if (action === 'App._deletePesada') App._deletePesada(parseInt(btn.dataset.id));
        else if (action === 'Export.exportarPDF') Export.exportarPDF(btn.dataset.tipo);
        else if (action === 'App._selectFincaForLoad') App._selectFincaForLoad(btn.dataset.id, btn.dataset.name);
        else if (action === 'App._deleteFinca') App._deleteFinca(btn.dataset.id, btn.dataset.name);
        else if (action === 'App._deleteZona') App._deleteZona(btn.dataset.id);
        else if (action === 'App.renderReporteGlobal') App.renderReporteGlobal();
        else if (action === 'App.renderReporteEconomico') App.renderReporteEconomico();
        else if (action === 'App.renderMenuZonasReport') App.renderMenuZonasReport();
        else if (action === 'App.renderMenuCalidadesReport') App.renderMenuCalidadesReport();
        else if (action === 'App.renderGraficos') App.renderGraficos();
        else if (action === 'App.renderReportePorZona') {
            const sel = document.getElementById('sel-zona-rep');
            if (sel) App.renderReportePorZona(sel.value);
        }
        else if (action === 'App.renderReporteEconomicoPorCalidad') App.renderReporteEconomicoPorCalidad(btn.dataset.calidad);
        else if (action === 'App.openManualZonas') App.openManualZonas();
        else if (action === 'App._saveActiveFincaSettings') App._saveActiveFincaSettings();
        else if (action === 'App.renderFincasManager') App.renderFincasManager();
        else if (action === 'App.renderGastosManager') App.renderGastosManager();
        else if (action === 'App.loadMorePesadas') App.loadMorePesadas();
        else if (action === 'App._showGastoForm') App._showGastoForm(btn.dataset.id ? parseInt(btn.dataset.id) : null);
        else if (action === 'App._deleteGasto') App._deleteGasto(parseInt(btn.dataset.id));
        else if (action === 'Export.exportBackup') Export.exportBackup(btn.dataset.id ? [parseInt(btn.dataset.id)] : undefined);
        else if (action === 'Export.exportGlobalToExcel') Export.exportGlobalToExcel();
        else if (action === 'Export.exportEconomicoToExcel') Export.exportEconomicoToExcel();
    }
};
