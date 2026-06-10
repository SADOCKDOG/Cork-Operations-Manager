import { Fincas } from '../fincas.js';
import { App } from '../app.js';
import { Utils } from './utils.js';

export const Router = {
    routes: {
        '/': 'renderDashboard',
        '/nueva': 'renderFormPesada',
        '/lista': 'renderLista',
        '/zonas': 'renderZonas',
        '/zona': 'renderFichaZona',
        '/informes': 'renderReportesView',
        '/ajustes': 'renderAjustes',
        '/fincas': 'renderFincasManager',
        '/gastos': 'renderGastosManager',
        '/importar-pdf': 'renderImportarPdf'
    },

    async route() {
        if (!App._activeObjectUrls) App._activeObjectUrls = [];
        App._activeObjectUrls.forEach(url => URL.revokeObjectURL(url));
        App._activeObjectUrls = [];
        
        const hash = window.location.hash.slice(1) || '/';
        let path = hash, id = null, action = null;
        if (hash.startsWith('/zona/')) { const parts = hash.split('/'); path = '/zona'; id = parts[2]; if (parts[3] === 'editar') action = 'editar'; }
        else if (hash.startsWith('/pesada/')) { const parts = hash.split('/'); path = '/pesada'; id = parts[2]; if (parts[3] === 'editar') action = 'editar'; }

        const isFullScreenForm = path === '/nueva' || (path === '/pesada' && action === 'editar');
        document.body.classList.toggle('full-screen-mode', isFullScreenForm);

        document.querySelectorAll('.nav-item').forEach(el => { const base = (path === '/zona' || path === '/importar-pdf') ? '/zonas' : path; el.classList.toggle('active', el.getAttribute('href') === `#${base}`); });
        const main = document.getElementById('app-content');
        const allFincas = await Fincas.list();
        if (allFincas.length === 0) return await App.renderWelcomeWizard();
        const fincaId = await Fincas.getActiveId();
        if (!fincaId && path !== '/fincas') return await App.renderFincasManager();
        
        main.innerHTML = '<div class="loader">Cargando...</div>';
        try {
            if (path === '/zona' && id) { if (action === 'editar' || id === 'nueva') await App.renderFormZona(id === 'nueva' ? null : id); else await App.renderFichaZona(id); }
            else if (path === '/pesada' && id && action === 'editar') await App.renderFormPesada(id);
            else if (Router.routes[path]) await App[Router.routes[path]]();
            else main.innerHTML = '<h2>404</h2>';
        } catch (error) { 
            console.error(error); 
            main.innerHTML = `<div class="card error-card"><h2>Error</h2><p>${Utils.escapeHtml(error.message)}</p></div>`; 
        }
    }
};
