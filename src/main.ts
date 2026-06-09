import './styles/styles.css';
import { Auth } from './modules/auth';
import { initDB, migrateLegacyData } from './modules/db';
import { Fincas } from './modules/fincas';
import { Zonas } from './modules/zonas';
import { Pesadas } from './modules/pesadas';
import { Reportes } from './modules/reportes';
import { Gastos } from './modules/gastos';
import { Export } from './modules/export';
import { Drive } from './modules/drive';
import { Sync } from './modules/sync';
import { PdfImport } from './modules/pdf-import';
import { Charts } from './modules/charts';
import { Network } from '@capacitor/network';

declare global {
    interface Window {
        isNative: boolean;
        Capacitor: any;
        html2pdf: any;
    }
}

const App = {
    async init() {
        try {
            console.log("App: Iniciando v7.0.0 (Vite + TS)...");

            await Drive.init();
            await migrateLegacyData();
            const isAuthenticated = await Auth.init();

            window.addEventListener('hashchange', () => this.route());
            window.addEventListener('fincaChanged', () => {
                this.updateHeader().then(() => this.route());
            });

            if (!isAuthenticated) {
                this.renderLogin();
            } else {
                const user = Auth.getCurrentUser();
                await initDB(user?.id);

                if (localStorage.getItem('theme-sun') === 'true') {
                    document.body.classList.add('theme-sun');
                }

                await this.updateHeader();
                await this.route();
            }
        } catch (error: any) {
            console.error(error);
            const content = document.getElementById('app-content');
            if (content) content.innerHTML = `<div class="card error-card"><h2>Error de Inicio</h2><p>${error.message}</p></div>`;
        }
    },

    renderLogin() {
        const main = document.getElementById('app-content');
        if (!main) return;
        main.innerHTML = `
            <div class="card login-card animate-in">
                <div style="text-align:center; margin-bottom:30px;">
                    <img src="icons/logo-header.png" style="width:160px;">
                    <h2 style="border:none;">Acceso al Sistema</h2>
                </div>
                <form id="login-form">
                    <div class="form-group"><label>Correo Electrónico</label><input type="email" id="login-email" required></div>
                    <div class="form-group"><label>Contraseña</label><input type="password" id="login-pass" required></div>
                    <button type="submit" class="btn btn-primary" style="height:60px; font-size:1.1rem; margin-top:20px;">ENTRAR</button>
                </form>
                <p style="text-align:center; margin-top:20px; font-size:0.9rem;">
                    <span class="text-muted">¿No tienes cuenta?</span>
                    <a href="javascript:void(0)" id="btn-show-register" style="color:var(--p-cork); font-weight:bold;">Regístrate</a>
                </p>
            </div>
        `;
        document.getElementById('login-form')?.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = (document.getElementById('login-email') as HTMLInputElement).value;
            const pass = (document.getElementById('login-pass') as HTMLInputElement).value;
            try { await Auth.login(email, pass); location.reload(); } catch (err: any) { this.toastError(err.message); }
        });
        document.getElementById('btn-show-register')?.addEventListener('click', () => this.renderRegister());
    },

    renderRegister() {
        const main = document.getElementById('app-content');
        if (!main) return;
        main.innerHTML = `
            <div class="card login-card animate-in">
                <div style="text-align:center; margin-bottom:30px;"><h2 style="border:none;">Nuevo Usuario</h2></div>
                <form id="register-form">
                    <div class="form-group"><label>Nombre Completo</label><input type="text" id="reg-nombre" required></div>
                    <div class="form-group"><label>Correo Electrónico</label><input type="email" id="reg-email" required></div>
                    <div class="form-group"><label>Contraseña</label><input type="password" id="reg-pass" required></div>
                    <button type="submit" class="btn btn-primary" style="height:60px; font-size:1.1rem; margin-top:20px;">REGISTRAR Y ENTRAR</button>
                </form>
                <p style="text-align:center; margin-top:20px; font-size:0.9rem;"><a href="javascript:void(0)" id="btn-show-login" style="color:var(--text-s);">Volver</a></p>
            </div>
        `;
        document.getElementById('register-form')?.addEventListener('submit', async (e) => {
            e.preventDefault();
            const nombre = (document.getElementById('reg-nombre') as HTMLInputElement).value;
            const email = (document.getElementById('reg-email') as HTMLInputElement).value;
            const pass = (document.getElementById('reg-pass') as HTMLInputElement).value;
            try { await Auth.register(nombre, email, pass, 'admin'); await Auth.login(email, pass); location.reload(); } catch (err: any) { this.toastError(err.message); }
        });
        document.getElementById('btn-show-login')?.addEventListener('click', () => this.renderLogin());
    },

    async updateHeader() {
        const finca = await Fincas.getActive();
        const headerEl = document.getElementById('nombre-finca-header');
        if (headerEl) {
            headerEl.innerHTML = finca ? `<span style="cursor:pointer">${finca.nombre}</span>` : `<span style="cursor:pointer">➕ Crear Finca</span>`;
            headerEl.onclick = () => { location.hash = '/fincas'; };
        }
    },

    async route() {
        const hash = window.location.hash.slice(1) || '/';
        let path = hash, id: string | null = null, action: string | null = null;
        
        if (hash.startsWith('/zona/')) { 
            const parts = hash.split('/'); 
            path = '/zona'; 
            id = parts[2]; 
            if (parts[3] === 'editar') action = 'editar'; 
        }
        else if (hash.startsWith('/pesada/')) { 
            const parts = hash.split('/'); 
            path = '/pesada'; 
            id = parts[2]; 
            if (parts[3] === 'editar') action = 'editar'; 
        }

        const main = document.getElementById('app-content');
        if (!main) return;

        const allFincas = await Fincas.list();
        if (allFincas.length === 0 && path !== '/fincas') return this.renderWelcomeWizard();

        const fincaId = await Fincas.getActiveId();
        if (!fincaId && path !== '/fincas') return this.renderFincasManager();

        main.innerHTML = '<div class="loader">Cargando...</div>';
        try {
            if (path === '/zona' && id) { 
                if (action === 'editar' || id === 'nueva') await this.renderFormZona(id === 'nueva' ? null : id); 
                else await this.renderFichaZona(id); 
            }
            else if (path === '/pesada' && id && action === 'editar') await this.renderFormPesada(id);
            else if (path === '/' ) await this.renderDashboard();
            else if (path === '/nueva') await this.renderFormPesada();
            else if (path === '/lista') await this.renderLista();
            else if (path === '/zonas') await this.renderZonas();
            else if (path === '/ajustes') await this.renderAjustes();
            else if (path === '/fincas') await this.renderFincasManager();
            else if (path === '/gastos') await this.renderGastosManager();
            else if (path === '/informes') await this.renderReportesView();
            else if (path === '/importar-pdf') await this.renderImportarPdf();
            else main.innerHTML = `<h2>Ruta ${path} en construcción</h2>`;
        } catch (error: any) {
            console.error(error);
            main.innerHTML = `<div class="card error-card"><h2>Error</h2><p>${error.message}</p></div>`;
        }
    },

    renderWelcomeWizard() {
        const main = document.getElementById('app-content');
        if (!main) return;
        main.innerHTML = `
            <div class="card text-center welcome-wizard animate-in">
                <img src="icons/logo-header.png" style="width: 140px; margin-bottom: 25px;">
                <h1>¡Bienvenido!</h1>
                <p>Crea tu primera finca o importa tus datos para comenzar.</p>

                <div class="wizard-actions mt-2" style="display:flex; flex-direction:column; gap:12px;">
                    <button class="btn btn-primary" id="btn-wizard-create">➕ Crear Nueva Finca</button>
                    <button class="btn btn-secondary" id="btn-wizard-import">📥 Importar Backup (.json)</button>
                    <button class="btn btn-outline" id="btn-wizard-sync" style="border-color:var(--accent); color:var(--accent);">🔄 Sincronizar desde la Nube</button>
                    <input type="file" id="import-wizard-file" accept=".json" style="display:none">
                </div>
            </div>
        `;

        document.getElementById('btn-wizard-create')?.addEventListener('click', () => { location.hash = '/fincas'; });

        document.getElementById('btn-wizard-import')?.addEventListener('click', () => {
            document.getElementById('import-wizard-file')?.click();
        });

        document.getElementById('import-wizard-file')?.addEventListener('change', async (e: any) => {
            if (e.target.files[0]) await this._handleImportFile(e.target.files[0]);
        });

        document.getElementById('btn-wizard-sync')?.addEventListener('click', async () => {
            try {
                this.toast('Conectando con la nube...');
                await Sync.sync();
                this.toast('✅ Datos recuperados con éxito');
                location.reload();
            } catch (e: any) {
                this.toastError('No se encontraron datos o error de conexión');
            }
        });
    },

    async _handleImportFile(file: File) {
        try {
            this.toast('Analizando archivo...');
            const data = await Export.parseBackupFile(file);
            if (!data || !data.fincas) throw new Error("Archivo inválido");

            for (const fD of data.fincas) {
                const existing = (await Fincas.list()).find(f => f.nombre === fD.info.nombre);
                if (existing) {
                    if (!confirm(`La finca "${fD.info.nombre}" ya existe. ¿Deseas sobreescribirla?`)) continue;
                    await Fincas.delete(existing.id);
                }
                await Export.saveImportedFincaData(fD);
            }

            this.toast('✅ Importación completada');
            setTimeout(() => location.reload(), 1000);
        } catch (e: any) {
            this.toastError(e.message);
        }
    },

    toast(msg: string) {
        const container = document.getElementById('toast-container');
        if (!container) return;
        const t = document.createElement('div');
        t.className = 'toast animate-in';
        t.textContent = msg;
        container.appendChild(t);
        setTimeout(() => t.remove(), 3000);
    },

    toastError(msg: string) {
        const container = document.getElementById('toast-container');
        if (!container) return;
        const t = document.createElement('div');
        t.className = 'toast error animate-in';
        t.textContent = `❌ ${msg}`;
        container.appendChild(t);
        setTimeout(() => t.remove(), 4000);
    },

    async renderDashboard() {
        const main = document.getElementById('app-content');
        if (!main) return;
        const finca = await Fincas.getActive();
        const pesadas = await Pesadas.list();
        const tGlobal = this._calculateQualityTotals(pesadas);
        const totalQGlobal = (tGlobal.primera.quintales + tGlobal.bornizo.quintales + tGlobal.refugo.quintales).toFixed(2);

        main.innerHTML = `
            <div class="card animate-in" style="border-top: 5px solid var(--p-cork); padding: 25px; margin-bottom: 25px;">
                <h3 style="text-align:center; color: #fff; font-size: 1.4rem; margin-bottom: 20px; border:none; padding:0;">Resumen Global de Pesadas</h3>
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

            <div id="resumenHoy" class="card animate-in" style="border-top: 5px solid var(--p-cork); padding: 25px;">
                <h3 style="text-align:center; color: #fff; font-size: 1.4rem; margin-bottom: 20px; border:none; padding:0;">📅 Resumen Hoy</h3>
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
                <p id="pesadasHoyCount" class="text-muted" style="text-align:center; margin-top: 15px; font-size: 0.9rem;"></p>
            </div>

            <button class="btn btn-primary animate-in" style="margin-bottom: 25px; height: 60px; font-size: 1.1rem; box-shadow: 0 8px 20px rgba(212, 163, 115, 0.4);" onclick="location.hash='/nueva'">➕ NUEVA PESADA</button>

            <div class="card animate-in" style="border-top: 5px solid var(--accent); padding: 25px;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 20px;">
                    <h3 style="margin:0; border:none; font-size: 1.3rem;">Últimas 5 Pesadas</h3>
                    <button class="btn btn-outline" style="padding: 5px 12px; font-size: 0.8rem;" onclick="location.hash='/lista'">Ver Todo</button>
                </div>
                <div id="recent-list" style="display:flex; flex-direction:column; gap:12px;">
                    <!-- Se llena via renderUltimasPesadas -->
                </div>
            </div>
        `;
        await this.actualizarResumenHoy();
        await this.renderUltimasPesadas();
    },

    async actualizarResumenHoy() {
        const hoy = new Date().toISOString().split('T')[0];
        const pesadas = (await Pesadas.list()).filter(p => p.fecha.startsWith(hoy));
        const t = this._calculateQualityTotals(pesadas);
        const elKgP = document.getElementById('kgPrimera'), elQP = document.getElementById('qPrimera');
        const elKgB = document.getElementById('kgBornizo'), elQB = document.getElementById('qBornizo');
        const elKgR = document.getElementById('kgRefugo'), elQR = document.getElementById('qRefugo');
        const elKgT = document.getElementById('kgTotal'), elQT = document.getElementById('qTotal');
        const elCount = document.getElementById('pesadasHoyCount');

        if(elKgP) elKgP.textContent = Math.round(t.primera.kg).toString();
        if(elQP) elQP.textContent = t.primera.quintales.toFixed(1);
        if(elKgB) elKgB.textContent = Math.round(t.bornizo.kg).toString();
        if(elQB) elQB.textContent = t.bornizo.quintales.toFixed(1);
        if(elKgR) elKgR.textContent = Math.round(t.refugo.kg).toString();
        if(elQR) elQR.textContent = t.refugo.quintales.toFixed(1);
        if(elKgT) elKgT.textContent = Math.round(t.primera.kg + t.bornizo.kg + t.refugo.kg).toString();
        if(elQT) elQT.textContent = (t.primera.quintales + t.bornizo.quintales + t.refugo.quintales).toFixed(1);
        if(elCount) elCount.textContent = \`\${pesadas.length} sacas hoy.\`;
    },

    async renderUltimasPesadas() {
        const pesadas = (await Pesadas.list()).slice(0, 5);
        const zonas = await Zonas.list();
        const listEl = document.getElementById('recent-list');
        if (!listEl) return;
        
        if (pesadas.length === 0) {
            listEl.innerHTML = '<p class="text-center text-muted">No hay pesadas registradas.</p>';
            return;
        }

        listEl.innerHTML = pesadas.map(p => {
            const z = zonas.find(z => String(z.id) === String(p.zonaId));
            const fH = new Date(p.fecha).toLocaleString('es-ES', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
            let em = '⭐', cal = '1ª Calidad', col = '#10b981';
            
            if (p.pesadasPorCalidad?.bornizo?.kg > 0) { 
                em = '🟡'; cal = 'Bornizo'; col = '#d4a373'; 
            } else if (p.pesadasPorCalidad?.refugo?.kg > 0) { 
                em = '🔴'; cal = 'Refugo'; col = '#ef4444'; 
            }
            
            return \`
                <div class="pesada-card" style="--card-color: \${col};" onclick="location.hash='/pesada/\${p.id}/editar'">
                    <div class="pesada-card-left">
                        <small>\${fH}</small>
                        <strong>\${z ? z.nombre : '?'}</strong>
                        <div class="pesada-saca-badge">SACA #\${p.saca}</div>
                    </div>
                    <div class="pesada-card-right">
                        <table class="pesada-data-table">
                            <tr><td class="pesada-data-label">Calidad</td><td class="pesada-data-value">\${em} \${cal}</td></tr>
                            <tr><td class="pesada-data-label">Bruto</td><td class="pesada-data-value highlight-kg">\${p.kg.toFixed(1)} kg</td></tr>
                            <tr><td class="pesada-data-label">Neto</td><td class="pesada-data-value highlight-q">\${p.quintales.toFixed(2)} Q</td></tr>
                        </table>
                    </div>
                </div>\`;
        }).join('');
    },

    _calculateQualityTotals(pesadas: any[]) {
        const t = { primera: { kg: 0, quintales: 0 }, bornizo: { kg: 0, quintales: 0 }, refugo: { kg: 0, quintales: 0 } };
        pesadas.forEach(p => {
            ['primera', 'bornizo', 'refugo'].forEach(cal => {
                (t as any)[cal].kg += p.pesadasPorCalidad[cal]?.kg || 0;
                (t as any)[cal].quintales += p.pesadasPorCalidad[cal]?.quintales || 0;
            });
        });
        return t;
    },

    async renderFormPesada() {
        const main = document.getElementById('app-content');
        if (!main) return;
        const zonas = await Zonas.list();
        if (zonas.length === 0) {
            main.innerHTML = `<div class="card text-center animate-in"><p>Primero crea una zona.</p><button class="btn btn-primary" onclick="location.hash='/zonas'">Ir a Zonas</button></div>`;
            return;
        }
        main.innerHTML = `
            <div class="card animate-in">
                <h2>Nueva Pesada</h2>
                <form id="form-pesada">
                    <div class="form-group"><label>Bruto (KG)</label><input type="number" step="0.1" id="p-bruto" required autofocus></div>
                    <div class="form-group"><label>Zona</label>
                        <select id="p-zona">${zonas.map(z => `<option value="${z.id}">${z.nombre}</option>`).join('')}</select>
                    </div>
                    <div class="form-group">
                        <label>Calidad</label>
                        <select id="p-calidad">
                            <option value="primera">⭐ 1ª Calidad</option>
                            <option value="bornizo" selected>🟡 Bornizo</option>
                            <option value="refugo">🔴 Refugo</option>
                        </select>
                    </div>
                    <button type="submit" class="btn btn-primary">💾 GUARDAR PESADA</button>
                    <button type="button" class="btn btn-outline mt-2" onclick="history.back()">Cancelar</button>
                </form>
            </div>`;
        document.getElementById('form-pesada')?.addEventListener('submit', async (e) => {
            e.preventDefault();
            const dS = {
                zonaId: (document.getElementById('p-zona') as HTMLSelectElement).value,
                pesoBruto: (document.getElementById('p-bruto') as HTMLInputElement).value,
                calidad: (document.getElementById('p-calidad') as HTMLSelectElement).value,
                tara: 0,
                fecha: new Date().toISOString()
            };
            await Pesadas.save(dS);
            this.toast('✅ Guardada');
            location.hash = '/lista';
        });
    },

    async renderLista() {
        const main = document.getElementById('app-content');
        if (!main) return;
        const pesadas = await Pesadas.list();
        const zonas = await Zonas.list();
        main.innerHTML = `
            <div class="card animate-in">
                <h2>Listado de Pesadas</h2>
                <div class="lista-detallada">
                    ${pesadas.map(p => {
                        const z = zonas.find(z => z.id === p.zonaId);
                        return `
                        <div class="list-item-detallado">
                            <div><strong>${z?.nombre || 'Desconocida'}</strong><br><small>${new Date(p.fecha).toLocaleString()}</small></div>
                            <div style="text-align:right;"><strong>${p.quintales.toFixed(2)} Q</strong><br><small>${p.kg.toFixed(1)} kg</small></div>
                        </div>`;
                    }).join('')}
                </div>
                <button class="btn btn-outline mt-2" onclick="location.hash='/'">Volver</button>
            </div>
        `;
    },

    async renderZonas() {
        const main = document.getElementById('app-content');
        if (!main) return;
        const stats = await Zonas.getStats();
        main.innerHTML = `
            <div class="card">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                    <h3>Gestión de Zonas</h3>
                </div>
                <div class="grid-2" style="gap:10px;">
                    <button class="btn btn-primary" onclick="location.hash='/zona/nueva'">➕ Nueva Zona</button>
                    <button class="btn btn-secondary" onclick="location.hash='/importar-pdf'">📥 Importar PDF</button>
                </div>
            </div>
            ${stats.map(z => `
                <div class="card animate-in" onclick="location.hash='/zona/${z.id}'" style="cursor:pointer; border-top: 5px solid var(--p-cork); padding: 25px;">
                    <h3 style="text-align:center; color: #fff; font-size: 1.4rem; margin-bottom: 20px; border:none;">${z.nombre}</h3>
                    <div class="summary-table-grid">
                        <div class="summary-cell c-1a"><div class="s-lbl">1ª CAL</div><div class="s-val">${z.totalesPorCalidad.primera.quintales.toFixed(2)}<span style="font-size:0.5em; margin-left:2px;">Q</span></div></div>
                        <div class="summary-cell c-bo"><div class="s-lbl">BORNIZO</div><div class="s-val">${z.totalesPorCalidad.bornizo.quintales.toFixed(2)}<span style="font-size:0.5em; margin-left:2px;">Q</span></div></div>
                        <div class="summary-cell c-re"><div class="s-lbl">REFUGO</div><div class="s-val">${z.totalesPorCalidad.refugo.quintales.toFixed(2)}<span style="font-size:0.5em; margin-left:2px;">Q</span></div></div>
                    </div>
                </div>
            `).join('')}
            <button class="btn btn-outline" onclick="location.hash='/'">Volver</button>
        `;
    },

    async renderFichaZona(id: string) {
        const main = document.getElementById('app-content');
        if (!main) return;
        const z = await Zonas.get(id); 
        if (!z) return location.hash = '/zonas';
        
        const pesadas = await db.getAllFromIndex('pesadas', 'zonaId', z.id);
        const t = { primera: 0, bornizo: 0, refugo: 0 };
        pesadas.forEach((p: any) => { 
            t.primera += p.pesadasPorCalidad?.primera?.quintales || 0; 
            t.bornizo += p.pesadasPorCalidad?.bornizo?.quintales || 0; 
            t.refugo += p.pesadasPorCalidad?.refugo?.quintales || 0; 
        });

        let croquisHtml = z.croquisBlob ? `<div style="text-align:center; margin-bottom:20px;"><img src="${URL.createObjectURL(z.croquisBlob)}" style="max-width:100%; border-radius:12px; border:1px solid var(--border);"></div>` : '';
        let cultivosHtml = '';
        
        if (z.cultivos && z.cultivos.length > 0) {
            cultivosHtml = `
                <div class="card">
                    <h4>CULTIVO SIGPAC</h4>
                    <table class="reporte-table" style="font-size:0.8rem;">
                        <thead><tr><th>Sub</th><th>Aprovechamiento</th><th>Int</th><th>Sup. m²</th></tr></thead>
                        <tbody>${z.cultivos.map((c: any) => `<tr><td>${c.letra || ''}</td><td>${c.cultivo || '-'}</td><td>${c.intensidad || ''}</td><td>${c.superficie || '0'}</td></tr>`).join('')}</tbody>
                    </table>
                </div>`;
        }

        main.innerHTML = `
            <div class="card animate-in">
                <h3>DATOS DESCRIPTIVOS INMUEBLE</h3>
                <div style="font-size:0.9rem; line-height:1.8;">
                    <p><strong>Referencia catastral:</strong> ${z.refCatastral || '-'}</p>
                    <p><strong>Localización:</strong> Polígono ${z.poligono || '-'} Parcela ${z.parcela || '-'}<br>
                       <span class="text-muted">${z.municipio || '-'}</span></p>
                    <p><strong>Clase:</strong> ${z.clase || '-'}</p>
                    <p><strong>Uso principal:</strong> ${z.usoPrincipal || '-'}</p>
                    <p><strong>Superficie gráfica:</strong> ${z.superficieGrafica ? z.superficieGrafica + ' m²' : '-'}</p>
                </div>
                <button class="btn btn-secondary mt-1" onclick="location.hash='/zona/${z.id}/editar'">✏️ Editar Zona</button>
            </div>

            ${croquisHtml ? `<div class="card animate-in"><h3>PARCELA CATASTRAL</h3>${croquisHtml}</div>` : ''}
            ${cultivosHtml}

            <div class="card animate-in" style="border-top: 5px solid var(--p-cork); padding:25px;">
                <h4 style="text-align:center; color: #fff; font-size: 1.4rem; margin-bottom: 20px; border:none;">Producción Acumulada</h4>
                <div class="summary-table-grid">
                    <div class="summary-cell c-1a"><div class="s-lbl">1ª CAL</div><div class="s-val">${t.primera.toFixed(2)}<span style="font-size:0.5em; margin-left:2px;">Q</span></div></div>
                    <div class="summary-cell c-bo"><div class="s-lbl">BORNIZO</div><div class="s-val">${t.bornizo.toFixed(2)}<span style="font-size:0.5em; margin-left:2px;">Q</span></div></div>
                    <div class="summary-cell c-re"><div class="s-lbl">REFUGO</div><div class="s-val">${t.refugo.toFixed(2)}<span style="font-size:0.5em; margin-left:2px;">Q</span></div></div>
                </div>
            </div>
            <button class="btn btn-outline mt-2" onclick="location.hash='/zonas'">Volver</button>
        `;
    },

    async renderFormZona(id: string | null = null) {
        const main = document.getElementById('app-content');
        if (!main) return;
        const isEdit = id !== null;
        let d: any = id ? await Zonas.get(id) : { nombre: '', paraje: '', municipio: '', provincia: '', refCatastral: '', poligono: '', parcela: '', superficieGrafica: '', usoPrincipal: '', clase: '' };
        
        main.innerHTML = `
            <div class="card animate-in">
                <h3>${isEdit ? 'Editar' : 'Nueva'} Zona</h3>
                <form id="form-zona">
                    <div class="form-group"><label>Nombre de la Zona*</label><input type="text" id="z-nom" value="${d.nombre}" required></div>
                    <h4>Datos Catastrales</h4>
                    <div class="form-group"><label>Referencia Catastral</label><input type="text" id="z-ref" value="${d.refCatastral || ''}"></div>
                    <div class="grid-2">
                        <div class="form-group"><label>Polígono</label><input type="number" id="z-pol" value="${d.poligono || ''}"></div>
                        <div class="form-group"><label>Parcela</label><input type="number" id="z-parcela" value="${d.parcela || ''}"></div>
                    </div>
                    <div class="grid-2">
                        <div class="form-group"><label>Municipio</label><input type="text" id="z-mun" value="${d.municipio || ''}"></div>
                        <div class="form-group"><label>Superficie (m²)</label><input type="number" id="z-sup" value="${d.superficieGrafica || ''}"></div>
                    </div>
                    <div class="grid-2">
                        <div class="form-group"><label>Uso Principal</label><input type="text" id="z-uso" value="${d.usoPrincipal || ''}"></div>
                        <div class="form-group"><label>Clase</label><input type="text" id="z-clase" value="${d.clase || ''}"></div>
                    </div>
                    <button type="submit" class="btn btn-primary mt-1">Guardar Zona</button>
                    ${isEdit ? `<button type="button" class="btn btn-danger mt-1" onclick="App._deleteZona('${id}')">🗑️ Eliminar Zona</button>` : ''}
                    <button type="button" class="btn btn-outline mt-1" onclick="history.back()">Cancelar</button>
                </form>
            </div>
        `;
        
        const form = document.getElementById('form-zona');
        if (form) {
            form.onsubmit = async (e) => {
                e.preventDefault();
                const dS = {
                    ...d,
                    id: isEdit ? d.id : undefined,
                    nombre: (document.getElementById('z-nom') as HTMLInputElement).value.trim(),
                    refCatastral: (document.getElementById('z-ref') as HTMLInputElement).value.trim(),
                    poligono: (document.getElementById('z-pol') as HTMLInputElement).value,
                    parcela: (document.getElementById('z-parcela') as HTMLInputElement).value,
                    municipio: (document.getElementById('z-mun') as HTMLInputElement).value.trim(),
                    superficieGrafica: (document.getElementById('z-sup') as HTMLInputElement).value,
                    usoPrincipal: (document.getElementById('z-uso') as HTMLInputElement).value.trim(),
                    clase: (document.getElementById('z-clase') as HTMLInputElement).value.trim()
                };
                await Zonas.save(dS); 
                this.toast('✅ Guardada'); 
                location.hash = '/zonas';
            };
        }
    },

    async _deleteZona(id: string) {
        if (confirm("¿Eliminar zona permanentemente?")) {
            try {
                await Zonas.delete(id);
                this.toast("✅ Zona eliminada");
                location.hash = '/zonas';
            } catch (e: any) {
                this.toastError(e.message);
            }
        }
    },

    async renderAjustes() {
        const main = document.getElementById('app-content');
        if (!main) return;

        const finca = await Fincas.getActive();
        if (!finca) {
            location.hash = '/fincas';
            return;
        }

        const comp = finca.comprador || {};
        const precios = finca.precios || {};

        const lastSync = localStorage.getItem('lastSyncAt');
        const lastSyncStr = lastSync ? new Date(lastSync).toLocaleString() : 'Nunca';
        const isSunMode = document.body.classList.contains('theme-sun');

        main.innerHTML = `
            <div style="display:flex; align-items:center; gap:12px; margin-bottom:25px;"><div style="width:5px; height:30px; background:var(--p-cork); border-radius:3px;"></div><h2 style="margin:0; border:none; padding:0; color:var(--text-p); font-weight:800;">Ajustes de Finca</h2></div>

            <div class="card" style="border: 2px solid var(--p-cork); border-left: 8px solid var(--p-cork);">
                <div style="display:flex; align-items:center; gap:10px; margin-bottom:15px;"><div style="width:4px; height:20px; background:var(--p-cork); border-radius:2px;"></div><h4 style="margin:0; font-size:0.9rem; text-transform:uppercase;">Datos Propietario</h4></div>
                <div class="form-group"><label>Nombre Explotación</label><input type="text" value="${finca.nombre}" readonly style="opacity:0.6;"></div>
                <div class="form-group"><label>Nombre Propietario</label><input type="text" id="adj-prop" value="${finca.propietario||''}"></div>
                <div class="form-group"><label>Teléfono</label><input type="tel" id="adj-prop-tel" value="${finca.telefono||''}"></div>
            </div>

            <div class="card" style="border: 2px solid var(--accent); border-left: 8px solid var(--accent);">
                <div style="display:flex; align-items:center; gap:10px; margin-bottom:15px;"><div style="width:4px; height:20px; background:var(--accent); border-radius:2px;"></div><h4 style="margin:0; font-size:0.9rem; text-transform:uppercase;">Datos Comprador y Precios</h4></div>
                <div class="form-group"><label>Empresa / Comprador</label><input type="text" id="adj-empresa" value="${comp.nombreEmpresa||''}"></div>
                <div class="form-group"><label>CIF/NIF Comprador</label><input type="text" id="adj-cif" value="${comp.cifNif||''}"></div>
                <div class="form-group"><label>Representante</label><input type="text" id="adj-representante" value="${comp.representante||''}"></div>
                <div class="form-group"><label>Porcentaje de Oreo (%)</label><input type="number" step="0.1" id="adj-oreo" value="${finca.porcentajeOreo || 0}"></div>
                <div class="form-group"><label>Teléfono</label><input type="tel" id="adj-tel" value="${comp.telefono||''}"></div>
                <div class="form-group"><label>Correo Electrónico</label><input type="email" id="adj-email" value="${comp.email||''}"></div>
                <div class="form-group"><label>Dirección Comercial</label><input type="text" id="adj-direccion" value="${comp.direccion||''}"></div>

                <h5 style="margin: 15px 0 10px 0; color: var(--accent); border-bottom: 1px solid var(--border); padding-bottom: 5px;">Precios de Mercado (€/Q)</h5>
                <div class="form-group"><label>Precio 1ª</label><input type="number" step="0.01" id="adj-p1" value="${precios.primera?.precioQuintal || ''}"></div>
                <div class="form-group"><label>Precio Bornizo</label><input type="number" step="0.01" id="adj-pb" value="${precios.bornizo?.precioQuintal || ''}"></div>
                <div class="form-group"><label>Precio Refugo</label><input type="number" step="0.01" id="adj-pr" value="${precios.refugo?.precioQuintal || ''}"></div>

                <button class="btn btn-primary" style="width:100%; margin-top:20px;" id="btn-save-ajustes">💾 Guardar Ajustes</button>
            </div>

            <div class="reportes-selector-grid" style="margin-top:20px;">
                <button class="report-select-btn theme-zona" onclick="location.hash='/gastos'"><span class="btn-icon">💸</span><strong>Control Gastos</strong></button>
                <button class="report-select-btn theme-global" onclick="location.hash='/fincas'"><span class="btn-icon">📍</span><strong>Gestor Fincas</strong></button>
            </div>

            <div class="card" style="margin-top:20px; border-top: 4px solid var(--accent);">
                <h3>Visualización</h3>
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <span>Modo Sol Directo (Alto Contraste)</span>
                    <button class="btn btn-outline" id="btn-toggle-sun" style="width:auto; height:40px; padding:0 15px;">
                        ${isSunMode ? 'DESACTIVAR' : 'ACTIVAR'}
                    </button>
                </div>
            </div>

            <div class="card" style="margin-top:10px; border-top: 4px solid var(--accent);">
                <h3>Datos y Cloud</h3>
                <p style="font-size:0.85rem; color:var(--text-s);">Sincroniza tus datos con Google Drive para trabajar en varios dispositivos.</p>
                <p style="font-size:0.85rem;">Última sincronización: <strong>${lastSyncStr}</strong></p>
                <button class="btn btn-primary" id="btn-sync-now" style="margin-top:10px; width: 100%;">🔄 SINCRONIZAR AHORA</button>
                <button class="btn btn-secondary" id="btn-export" style="margin-top:10px; width: 100%;">📥 EXPORTAR BACKUP OFFLINE</button>
                <button class="btn btn-outline" id="btn-drive-logout" style="margin-top:10px; width: 100%; border-color:var(--text-s); color:var(--text-s);">Cerrar sesión de Google</button>
                <button class="btn btn-danger mt-2" onclick="App.logout()" style="width: 100%;">CERRAR SESIÓN DE USUARIO</button>
            </div>
            
            <div class="card text-center" style="border-top: 2px solid var(--p-cork); margin-top:30px; padding:30px;">
                <p style="font-size: 0.85rem; color: var(--text-s); margin-bottom: 10px; text-transform: uppercase; letter-spacing: 1px;">Desarrollado por</p>
                <img src="icons/Logo SDOGFARMCORE.png" style="width:160px; margin-bottom:15px; filter: drop-shadow(0 0 10px rgba(212,163,115,0.2));">
                <p style="font-weight:800; color:var(--p-cork); margin-bottom: 5px;">Ecosistema CORE de Gestión Inteligente</p>
                <div style="width: 40px; height: 2px; background: var(--border); margin: 15px auto;"></div>
                <h3 style="font-size: 1.1rem; color: #fff; margin-bottom: 5px; border:none; padding:0;">📄 Licencia y Soporte</h3>
                <p style="font-size: 0.85rem; color: var(--text-s); line-height: 1.5;">
                    © 2026 Cork Manager. Todos los derechos reservados.<br>
                    Licencia de uso profesional v7.0
                </p>
                <p style="font-size: 0.85rem; color: var(--p-cork); margin-top: 15px; font-weight: 600;">
                    📩 soporte.sdogfarm@gmail.com
                </p>
            </div>
        `;

        document.getElementById('btn-save-ajustes')?.addEventListener('click', async () => {
            const activeFinca = await Fincas.getActive();
            if (!activeFinca) return;
            
            const propEl = document.getElementById('adj-prop') as HTMLInputElement;
            const propTelEl = document.getElementById('adj-prop-tel') as HTMLInputElement;
            const oreoEl = document.getElementById('adj-oreo') as HTMLInputElement;
            const empresaEl = document.getElementById('adj-empresa') as HTMLInputElement;
            const cifEl = document.getElementById('adj-cif') as HTMLInputElement;
            const repEl = document.getElementById('adj-representante') as HTMLInputElement;
            const dirEl = document.getElementById('adj-direccion') as HTMLInputElement;
            const telEl = document.getElementById('adj-tel') as HTMLInputElement;
            const emailEl = document.getElementById('adj-email') as HTMLInputElement;
            const p1El = document.getElementById('adj-p1') as HTMLInputElement;
            const pbEl = document.getElementById('adj-pb') as HTMLInputElement;
            const prEl = document.getElementById('adj-pr') as HTMLInputElement;

            activeFinca.propietario = propEl?.value || '';
            activeFinca.telefono = propTelEl?.value || '';
            activeFinca.porcentajeOreo = parseFloat(oreoEl?.value) || 0;
            
            activeFinca.comprador = {
                nombreEmpresa: empresaEl?.value || '',
                cifNif: cifEl?.value || '',
                representante: repEl?.value || '',
                direccion: dirEl?.value || '',
                telefono: telEl?.value || '',
                email: emailEl?.value || ''
            };

            activeFinca.precios = {
                primera: { precioQuintal: parseFloat(p1El?.value) || 0 },
                bornizo: { precioQuintal: parseFloat(pbEl?.value) || 0 },
                refugo: { precioQuintal: parseFloat(prEl?.value) || 0 }
            };

            try {
                await Fincas.save(activeFinca);
                this.toast('✅ Ajustes guardados correctamente');
            } catch (err: any) {
                this.toastError(err.message);
            }
        });

        document.getElementById('btn-toggle-sun')?.addEventListener('click', () => {
            const active = document.body.classList.toggle('theme-sun');
            localStorage.setItem('theme-sun', active.toString());
            this.renderAjustes();
        });

        document.getElementById('btn-export')?.addEventListener('click', async () => {
            try { await Export.exportBackup(); this.toast('✅ Backup generado'); } catch (e: any) { this.toastError(e.message); }
        });

        document.getElementById('btn-sync-now')?.addEventListener('click', async () => {
            const status = await Network.getStatus();
            if (!status.connected) {
                this.toastError('No hay conexión a Internet');
                return;
            }
            try {
                this.toast('Sincronizando...');
                await Sync.sync();
                this.toast('✅ Datos sincronizados');
                this.renderAjustes();
            } catch (e: any) {
                this.toastError('Error: ' + e.message);
            }
        });

        document.getElementById('btn-drive-logout')?.addEventListener('click', async () => {
            try {
                await Drive.logout();
                this.toast('Sesión de Google cerrada');
            } catch (e: any) {
                this.toastError(e.message);
            }
        });
    },

    async renderFincasManager() {
        const main = document.getElementById('app-content');
        if (!main) return;
        const allFincas = await Fincas.list();
        const activeId = await Fincas.getActiveId();
        main.innerHTML = `
            <div style="display:flex; align-items:center; gap:12px; margin-bottom:25px;">
                <div style="width:5px; height:30px; background:var(--accent); border-radius:3px;"></div>
                <h2 style="margin:0; border:none; padding:0; color:var(--text-p); font-weight:800;">Gestión de Fincas</h2>
            </div>
            
            <button class="btn btn-primary mb-2" onclick="App._showFincaForm()" style="width:100%; height:55px; font-weight:800; letter-spacing:1px; box-shadow:0 8px 20px rgba(127,176,105,0.3);">➕ CREAR NUEVA FINCA</button>

            <div class="fincas-list" style="display:flex; flex-direction:column; gap:15px;">
                ${allFincas.map(f => {
                    const isSelected = f.id === this._pendingFincaId || (f.id === activeId && !this._pendingFincaId);
                    return `
                    <div class="card finca-card ${isSelected ? 'selected-finca' : ''}" style="display:flex; justify-content:space-between; align-items:center; cursor:pointer; padding:15px; border-left:8px solid ${isSelected ? 'var(--accent)' : 'var(--border)'};" onclick="App._selectFincaForLoad('${f.id}', '${f.nombre}')">
                        <div>
                            <strong style="font-size:1.1rem;">${f.nombre}</strong><br>
                            <small class="text-muted">${f.propietario || 'Sin titular'}</small>
                            ${f.id === activeId ? '<span style="font-size:0.7rem; background:var(--accent); color:#fff; padding:2px 6px; border-radius:4px; margin-left:10px;">ACTUAL</span>' : ''}
                        </div>

                        <div style="display:flex; gap:12px; align-items:center;">
                            <button class="btn-modern-action" onclick="event.stopPropagation(); Export.exportBackup(['${f.id}'])" title="Exportar" style="background: rgba(255,255,255,0.05); border-radius:12px; width:45px; height:45px; display:flex; align-items:center; justify-content:center; border:1px solid rgba(255,255,255,0.1); cursor:pointer;">
                                <span style="font-size:1.4rem;">💾</span>
                            </button>
                            <button class="btn-modern-action" onclick="event.stopPropagation(); App._showFincaForm('${f.id}')" title="Editar" style="background: rgba(255,255,255,0.05); border-radius:12px; width:45px; height:45px; display:flex; align-items:center; justify-content:center; border:1px solid rgba(255,255,255,0.1); cursor:pointer;">
                                <span style="font-size:1.4rem;">✏️</span>
                            </button>
                            <button class="btn-modern-action" onclick="event.stopPropagation(); App._deleteFinca('${f.id}', '${f.nombre}')" title="Borrar" style="background: rgba(255,77,77,0.1); border-radius:12px; width:45px; height:45px; display:flex; align-items:center; justify-content:center; border:1px solid rgba(255,77,77,0.2); cursor:pointer; color:#ff4d4d;">
                                <span style="font-size:1.4rem;">🗑️</span>
                            </button>
                        </div>
                    </div>`;
                }).join('')}
            </div>

            <div id="load-finca-footer" style="display:none; margin-top:20px;">
                <button id="btn-load-finca" class="btn btn-primary" style="height:65px; font-weight:900; font-size:1.1rem; border-radius:15px; box-shadow:0 10px 30px rgba(127,176,105,0.3); width:100%;">
                    🚀 CARGAR FINCA SELECCIONADA
                </button>
            </div>

            <button class="btn btn-outline mt-2" onclick="location.hash='/ajustes'" style="width:100%;">Volver a Ajustes</button>
        `;
        document.getElementById('btn-load-finca')?.addEventListener('click', () => { 
            if (this._pendingFincaId) this._confirmSwitchFinca(this._pendingFincaId, this._pendingFincaNombre); 
        });
    },

    _selectFincaForLoad(id: string, nombre: string) {
        document.querySelectorAll('.finca-card').forEach(el => el.classList.remove('selected-finca'));
        this._pendingFincaId = id; 
        this._pendingFincaNombre = nombre;
        const footer = document.getElementById('load-finca-footer');
        if (footer) footer.style.display = 'block';
    },

    async _confirmSwitchFinca(newId: string, nombre: string) { 
        if (confirm(`¿Cargar finca "${nombre}"?`)) { 
            await Fincas.setActiveId(newId); 
            location.reload(); 
        } 
    },

    async _deleteFinca(id: string, nombre: string) { 
        if (confirm(`¿Borrar permanentemente ${nombre}?`)) { 
            await Fincas.delete(id); 
            location.reload(); 
        } 
    },

    async _showFincaForm(id: string | null = null) {
        let f: any = id ? await Fincas.get(id) : { nombre: '', propietario: '', cif: '', direccion: '', telefono: '', email: '' };
        const main = document.getElementById('app-content');
        if (!main) return;
        main.innerHTML = `
            <div class="card">
                <h3>${id?'Editar':'Nueva'} Finca</h3>
                <form id="form-finca">
                    <div class="form-group"><label>Nombre de la Finca*</label><input type="text" id="f-nom" value="${f.nombre}" required></div>
                    <div class="form-group"><label>Titular / Propietario*</label><input type="text" id="f-prop" value="${f.propietario}" required></div>
                    <div class="form-group"><label>DNI / CIF</label><input type="text" id="f-cif" value="${f.cif || ''}"></div>
                    <div class="form-group"><label>Dirección</label><input type="text" id="f-dir" value="${f.direccion || ''}"></div>
                    <div class="grid-2">
                        <div class="form-group"><label>Teléfono</label><input type="tel" id="f-tel" value="${f.telefono || ''}"></div>
                        <div class="form-group"><label>Correo Electrónico</label><input type="email" id="f-email" value="${f.email || ''}"></div>
                    </div>
                    <button type="submit" class="btn btn-primary mt-1">💾 Guardar Finca</button>
                    <button type="button" class="btn btn-outline mt-1" onclick="App.renderFincasManager()">Cancelar</button>
                </form>
            </div>`;
        const form = document.getElementById('form-finca');
        if (form) {
            form.onsubmit = async (e) => {
                e.preventDefault();
                const dS = {
                    ...f,
                    nombre: (document.getElementById('f-nom') as HTMLInputElement).value.trim(),
                    propietario: (document.getElementById('f-prop') as HTMLInputElement).value.trim(),
                    cif: (document.getElementById('f-cif') as HTMLInputElement).value.trim(),
                    direccion: (document.getElementById('f-dir') as HTMLInputElement).value.trim(),
                    telefono: (document.getElementById('f-tel') as HTMLInputElement).value.trim(),
                    email: (document.getElementById('f-email') as HTMLInputElement).value.trim()
                };
                await Fincas.save(dS); 
                this.toast("✅ Éxito"); 
                await this.renderFincasManager();
            };
        }
    },

    async renderGastosManager() {
        const main = document.getElementById('app-content');
        if (!main) return;
        const gastos = await Gastos.list();
        const total = await Gastos.getTotal();

        main.innerHTML = `
            <div class="card animate-in">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <h3>Control Gastos</h3>
                    <div style="font-weight:800; color:#ff4d4d; font-size:1.2rem;">Total: ${total.toFixed(2)}€</div>
                </div>
                <button class="btn btn-primary mt-1" onclick="App._showGastoForm()">➕ Añadir Gasto</button>
                <div class="lista-detallada mt-2">
                    ${gastos.length ? gastos.map((g: any) => `
                        <div class="list-item-detallado" onclick="App._showGastoForm('${g.id}')">
                            <div>
                                <strong>${g.concepto || 'Sin concepto'}</strong><br>
                                <small class="text-muted">${g.categoria} | ${new Date(g.fecha).toLocaleDateString()}</small>
                            </div>
                            <div style="text-align:right;">
                                <strong style="color:#ff4d4d;">-${parseFloat(g.monto).toFixed(2)}€</strong>
                            </div>
                        </div>
                    `).join('') : '<p class="text-center text-muted">No hay gastos registrados.</p>'}
                </div>
                <button class="btn btn-outline mt-2" onclick="location.hash='/ajustes'">Volver a Ajustes</button>
            </div>
        `;
    },

    async _showGastoForm(id: string | null = null) {
        const categories = Gastos.getCategories(); 
        let d: any = id ? await Gastos.get(id) : { concepto:'', monto:'', categoria:'Otros', fecha:new Date().toISOString().split('T')[0] };
        
        const main = document.getElementById('app-content');
        if (!main) return;

        main.innerHTML = `
            <div class="card">
                <h3>${id?'Editar':'Nuevo'} Gasto</h3>
                <form id="form-gasto">
                    <div class="form-group">
                        <label>Concepto</label>
                        <input type="text" id="g-con" value="${d.concepto}" required>
                    </div>
                    <div class="grid-2">
                        <div class="form-group">
                            <label>Monto (€)</label>
                            <input type="number" step="0.01" id="g-mon" value="${d.monto}" required>
                        </div>
                        <div class="form-group">
                            <label>Fecha</label>
                            <input type="date" id="g-fec" value="${d.fecha}" required>
                        </div>
                    </div>
                    <div class="form-group">
                        <label>Categoría</label>
                        <select id="g-cat">
                            ${categories.map(c => `<option value="${c}" ${d.categoria===c?'selected':''}>${c}</option>`).join('')}
                        </select>
                    </div>
                    <div class="form-actions mt-1">
                        <button type="submit" class="btn btn-primary">💾 Guardar Gasto</button>
                        ${id ? `<button type="button" class="btn btn-danger mt-1" onclick="App._deleteGasto('${id}')">🗑️ Eliminar</button>` : ''}
                        <button type="button" class="btn btn-outline mt-1" onclick="App.renderGastosManager()">Cancelar</button>
                    </div>
                </form>
            </div>`;

        const form = document.getElementById('form-gasto');
        if (form) {
            form.onsubmit = async (e) => {
                e.preventDefault();
                try {
                    const dS = { 
                        id: id ? id : undefined, 
                        concepto: (document.getElementById('g-con') as HTMLInputElement).value.trim(), 
                        monto: (document.getElementById('g-mon') as HTMLInputElement).value, 
                        categoria: (document.getElementById('g-cat') as HTMLSelectElement).value, 
                        fecha: (document.getElementById('g-fec') as HTMLInputElement).value 
                    }; 
                    await Gastos.save(dS); 
                    this.toast('✅ Gasto guardado'); 
                    await this.renderGastosManager(); 
                } catch(err: any) { 
                    this.toastError(err.message); 
                }
            };
        }
    },

    async _deleteGasto(id: string) { 
        if (confirm("¿Eliminar gasto?")) { 
            await Gastos.delete(id); 
            this.toast('✅ Eliminado'); 
            await this.renderGastosManager(); 
        } 
    },

    _getDualHeaderHtml(vNom: string, vProp: string, vCIF: string, cNom: string, cCIF: string, cRef: string) {
        return `<div class="dual-entity-grid"><div class="entity-card vendedor"><small>Emisor / Vendedor</small><strong>${vNom.toUpperCase()}</strong><p>${vProp}<br>CIF: ${vCIF}</p></div><div class="entity-card comprador"><small>Receptor / Comprador</small><strong>${cNom.toUpperCase()}</strong><p>CIF: ${cCIF}<br>Ref: ${cRef}</p></div></div>`;
    },

    async renderReportesView() {
        const main = document.getElementById('app-content');
        if (!main) return;
        main.innerHTML = `
            <div style="display:flex; align-items:center; gap:12px; margin-bottom:25px;">
                <div style="width:5px; height:30px; background:var(--p-cork); border-radius:3px;"></div>
                <h2 style="margin:0; border:none; padding:0; color:var(--text-p); font-weight:800;">Central de Informes</h2>
            </div>
            <div class="reportes-selector-grid">
                <button class="report-select-btn" onclick="App.renderReporteGlobal()" style="background: linear-gradient(135deg, rgba(160,103,58,0.5) 0%, rgba(212,163,115,0.5) 100%); border:none; box-shadow: 0 4px 15px rgba(160,103,58,0.15); min-height: 80px; padding: 10px;">
                    <span class="btn-icon" style="font-size:1.6rem; margin-bottom:2px; height:45px; width:45px;">🌍</span>
                    <strong style="font-size:0.85rem;">Balance Global</strong>
                </button>
                <button class="report-select-btn" onclick="App.renderReporteEconomico()" style="background: linear-gradient(135deg, rgba(44,62,80,0.5) 0%, rgba(76,161,175,0.5) 100%); border:none; box-shadow: 0 4px 15px rgba(44,62,80,0.15); min-height: 80px; padding: 10px;">
                    <span class="btn-icon" style="font-size:1.6rem; margin-bottom:2px; height:45px; width:45px;">💶</span>
                    <strong style="font-size:0.85rem;">Liq. Económica</strong>
                </button>
                <button class="report-select-btn" onclick="App.renderMenuZonasReport()" style="background: linear-gradient(135deg, rgba(19,78,94,0.5) 0%, rgba(113,178,128,0.5) 100%); border:none; box-shadow: 0 4px 15px rgba(19,78,94,0.15); min-height: 80px; padding: 10px;">
                    <span class="btn-icon" style="font-size:1.6rem; margin-bottom:2px; height:45px; width:45px;">🌲</span>
                    <strong style="font-size:0.85rem;">Prod. Zona</strong>
                </button>
                <button class="report-select-btn" onclick="App.renderMenuCalidadesReport()" style="background: linear-gradient(135deg, rgba(127,176,105,0.5) 0%, rgba(141,179,105,0.5) 100%); border:none; box-shadow: 0 4px 15px rgba(127,176,105,0.15); min-height: 80px; padding: 10px;">
                    <span class="btn-icon" style="font-size:1.6rem; margin-bottom:2px; height:45px; width:45px;">⭐</span>
                    <strong style="font-size:0.85rem;">Liq. Calidad</strong>
                </button>
                <button class="report-select-btn" onclick="App.renderGraficos()" style="background: linear-gradient(135deg, rgba(106,17,203,0.5) 0%, rgba(37,117,252,0.5) 100%); border:none; box-shadow: 0 4px 15px rgba(106,17,203,0.15); min-height: 80px; padding: 10px;">
                    <span class="btn-icon" style="font-size:1.6rem; margin-bottom:2px; height:45px; width:45px;">📈</span>
                    <strong style="font-size:0.85rem;">Panel Gráficos</strong>
                </button>
            </div>
            <hr style="border:0; border-top:1px solid var(--border); margin:25px 0;">
            <div id="cont-rep"></div>`;
        await this.renderReporteGlobal();
    },

    async renderReporteGlobal() {
        const r = await Reportes.generarReporteGlobalCampaña();
        const finca = await Fincas.getActive();
        if (!r || !finca) return;
        const comp = finca.comprador || {};
        let h = `<div class="reporte-container"><div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:25px;"><h2 style="margin:0; color:var(--p-cork); font-weight:800;">🌍 Balance de Campaña</h2><div style="display:flex; gap:10px;"><button class="btn btn-outline" style="height:40px; padding:0 15px; font-size:0.85rem; border-radius:10px;" onclick="App.exportarPDF('global')">📄 PDF</button><button class="btn btn-outline" style="height:40px; padding:0 15px; font-size:0.85rem; border-radius:10px;" onclick="App.exportGlobalToExcel()">📊 Excel</button></div></div>${this._getDualHeaderHtml(finca.nombre, finca.propietario||'-', finca.cif||'-', comp.nombreEmpresa||'Sin Empresa', comp.cifNif||'-', comp.representante||'-')}<div class="card"><h4>Resumen por Calidad</h4><div class="table-responsive"><table class="reporte-table"><thead><tr><th>Calidad</th><th style="text-align:right;">Quintales</th><th style="text-align:right;">Sacas</th></tr></thead><tbody><tr><td><span class="q-pill p1">⭐ 1ª Calidad</span></td><td style="text-align:right; font-weight:700;">${r.totalesGlobales.primera.quintales.toFixed(2)}</td><td style="text-align:right;">${r.totalesGlobales.primera.sacas}</td></tr><tr><td><span class="q-pill pb">🟡 Bornizo</span></td><td style="text-align:right; font-weight:700;">${r.totalesGlobales.bornizo.quintales.toFixed(2)}</td><td style="text-align:right;">${r.totalesGlobales.bornizo.sacas}</td></tr><tr><td><span class="q-pill pr">🔴 Refugo</span></td><td style="text-align:right; font-weight:700;">${r.totalesGlobales.refugo.quintales.toFixed(2)}</td><td style="text-align:right;">${r.totalesGlobales.refugo.sacas}</td></tr></tbody><tfoot><tr><td><strong>TOTAL GENERAL</strong></td><td style="text-align:right; color:var(--p-cork); font-size:1rem;"><strong>${(r.totalesGlobales.primera.quintales + r.totalesGlobales.bornizo.quintales + r.totalesGlobales.refugo.quintales).toFixed(2)} Q</strong></td><td style="text-align:right;"><strong>${r.totalesGlobales.primera.sacas + r.totalesGlobales.bornizo.sacas + r.totalesGlobales.refugo.sacas}</strong></td></tr></tfoot></table></div></div><div class="card"><h4>Desglose por Zona (kg)</h4><div class="table-responsive"><table class="reporte-table"><thead><tr><th>Zona</th><th style="text-align:right;">1ª</th><th style="text-align:right;">Bo</th><th style="text-align:right;">Re</th></tr></thead><tbody>${Object.values(r.reportePorZona).map((z:any) => `<tr><td><strong>${z.nombre}</strong></td><td style="text-align:right;">${Math.round(z.totales.primera.kg)}</td><td style="text-align:right;">${Math.round(z.totales.bornizo.kg)}</td><td style="text-align:right;">${Math.round(z.totales.refugo.kg)}</td></tr>`).join('')}</tbody></table></div></div></div>`;
        const cont = document.getElementById('cont-rep');
        if (cont) cont.innerHTML = h;
    },

    async renderReporteEconomico() {
        const r = await Reportes.generarReporteEconomicoGlobal();
        const finca = await Fincas.getActive();
        if (!r || !finca) return;
        const totalGastos = await Gastos.getTotal();
        const beneficioNeto = r.valorTotal - totalGastos;
        const comp = finca.comprador || {};
        let h = `<div class="reporte-container"><div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:25px;"><h2 style="margin:0; color:var(--p-cork); font-weight:800;">💶 Liquidación Final</h2><div style="display:flex; gap:10px;"><button class="btn btn-outline" style="height:40px; padding:0 15px; border-radius:10px;" onclick="App.exportarPDF('economico')">📄 PDF</button><button class="btn btn-outline" style="height:40px; padding:0 15px; border-radius:10px;" onclick="App.exportEconomicoToExcel()">📊 Excel</button></div></div>${this._getDualHeaderHtml(finca.nombre, finca.propietario||'-', finca.cif||'-', comp.nombreEmpresa||'Sin Empresa', comp.cifNif||'-', comp.representante||'-')}<div class="card"><h4>Desglose Económico</h4><div class="table-responsive"><table class="reporte-table"><thead><tr><th>Calidad</th><th>Precio</th><th>Q.Bruto</th><th style="color:#ff9800;">Oreo</th><th>Q.Neto</th><th style="text-align:right;">Total</th></tr></thead><tbody><tr><td><span class="q-pill p1">⭐ 1ª</span></td><td>${(r.precios.primera?.precioQuintal || 0).toFixed(2)}€</td><td>${r.totales.primera.bruto.toFixed(2)}</td><td style="color:#ff9800;">${r.totales.primera.merma.toFixed(2)}</td><td>${r.totales.primera.neto.toFixed(2)}</td><td style="text-align:right; font-weight:800;">${r.totales.primera.valor.toFixed(2)}€</td></tr><tr><td><span class="q-pill pb">🟡 Bo</span></td><td>${(r.precios.bornizo?.precioQuintal || 0).toFixed(2)}€</td><td>${r.totales.bornizo.bruto.toFixed(2)}</td><td style="color:#ff9800;">${r.totales.bornizo.merma.toFixed(2)}</td><td>${r.totales.bornizo.neto.toFixed(2)}</td><td style="text-align:right; font-weight:800;">${r.totales.bornizo.valor.toFixed(2)}€</td></tr><tr><td><span class="q-pill pr">🔴 Re</span></td><td>${(r.precios.refugo?.precioQuintal || 0).toFixed(2)}€</td><td>${r.totales.refugo.bruto.toFixed(2)}</td><td style="color:#ff9800;">${r.totales.refugo.merma.toFixed(2)}</td><td>${r.totales.refugo.neto.toFixed(2)}</td><td style="text-align:right; font-weight:800;">${r.totales.refugo.valor.toFixed(2)}€</td></tr></tbody><tfoot><tr><td colspan="2">SUBTOTALES</td><td>${r.brutoTotal.toFixed(2)}</td><td style="color:#ff9800;">${(r.brutoTotal - r.netoTotal).toFixed(2)}</td><td>${r.netoTotal.toFixed(2)}</td><td style="text-align:right; color:var(--p-cork); font-size:1rem;">${r.valorTotal.toFixed(2)}€</td></tr></tfoot></table></div></div><div class="card-finance" style="background: linear-gradient(135deg, #1a1a1a 0%, #000 100%); border: 1px solid var(--border); padding:25px;"><div style="display:flex; justify-content:space-between; margin-bottom:10px;"><span class="text-muted">Ingresos Brutos</span><span>${r.valorTotal.toFixed(2)}€</span></div><div style="display:flex; justify-content:space-between; margin-bottom:15px;"><span style="color:#ff4d4d;">Gastos Campaña (-)</span><span style="color:#ff4d4d;">-${totalGastos.toFixed(2)}€</span></div><hr style="opacity:0.3; margin-bottom:15px;"><div style="display:flex; justify-content:space-between; align-items:center;"><span style="color:var(--accent); font-weight:900; font-size:1.1rem;">BENEFICIO NETO REAL</span><span class="total-neto" style="color:var(--accent); font-size:1.8rem; font-weight:900;">${beneficioNeto.toFixed(2)}€</span></div></div></div>`;
        const cont = document.getElementById('cont-rep');
        if (cont) cont.innerHTML = h;
    },

    async renderMenuZonasReport() {
        const zonas = await Zonas.list();
        let h = `<div class="card"><h3>🌲 Selección de Zona</h3><select id="sel-zona-rep" style="height:50px; margin-bottom:15px; background:var(--surface); color:white; width:100%; padding:0 15px; border-radius:12px; border:1px solid var(--border);">${zonas.map(z => `<option value="${z.id}">${z.nombre}</option>`).join('')}</select><button class="btn btn-primary" onclick="App.renderReportePorZona(document.getElementById('sel-zona-rep').value)">Generar Informe de Zona</button></div>`;
        const cont = document.getElementById('cont-rep');
        if (cont) cont.innerHTML = h;
    },

    async renderReportePorZona(zonaId: string) {
        const r = await Reportes.generarReportePorZona(zonaId);
        const finca = await Fincas.getActive();
        if (!r || !finca) return;
        let h = `<div class="reporte-container"><div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:25px;"><h2 style="margin:0; color:var(--p-cork); font-weight:800;">🌲 Informe: ${r.zona.nombre}</h2><button class="btn btn-outline" style="height:40px; padding:0 15px; border-radius:10px;" onclick="App.exportarPDF('zona')">📄 PDF</button></div>${this._getDualHeaderHtml(finca.nombre, 'Explotación Activa', finca.cif||'-', 'ZONA DE SACA', `Pol.${r.zona.poligono} / Par.${r.zona.parcela}`, r.zona.municipio||'-')}<div class="card"><h4>Historial de Sacas</h4><div class="table-responsive"><table class="reporte-table"><thead><tr><th>Fecha</th><th>Saca</th><th style="text-align:right;">Peso (kg)</th><th>Cal</th></tr></thead><tbody>${r.pesadas.map((p:any) => { let em = p.pesadasPorCalidad.primera.kg > 0 ? '⭐' : p.pesadasPorCalidad.bornizo.kg > 0 ? '🟡' : '🔴'; return `<tr><td>${new Date(p.fecha).toLocaleDateString()}</td><td>#${p.saca}</td><td style="text-align:right;"><strong>${p.kg.toFixed(1)}</strong></td><td>${em}</td></tr>`; }).join('')}</tbody></table></div></div><div class="card-finance" style="background:var(--surface-light); padding:20px;"><div style="display:flex; justify-content:space-around; text-align:center;"><div><div class="stat-value">${r.totales.primera.quintales.toFixed(2)}</div><div class="stat-label">1ª (Q)</div></div><div><div class="stat-value">${r.totales.bornizo.quintales.toFixed(2)}</div><div class="stat-label">Bo (Q)</div></div><div><div class="stat-value">${r.totales.refugo.quintales.toFixed(2)}</div><div class="stat-label">Re (Q)</div></div></div></div></div>`;
        const cont = document.getElementById('cont-rep');
        if (cont) cont.innerHTML = h;
    },

    async renderMenuCalidadesReport() {
        let h = `<div class="card"><h3>⭐ Selección de Calidad</h3><div class="reportes-selector-grid" style="margin-top:15px;"><button class="report-select-btn theme-calidad" onclick="App.renderReporteEconomicoPorCalidad('primera')"><span class="btn-icon">⭐</span><strong>1ª Calidad</strong></button><button class="report-select-btn theme-econ" onclick="App.renderReporteEconomicoPorCalidad('bornizo')"><span class="btn-icon">🟡</span><strong>Bornizo</strong></button><button class="report-select-btn theme-graficos" onclick="App.renderReporteEconomicoPorCalidad('refugo')"><span class="btn-icon">🔴</span><strong>Refugo</strong></button></div></div>`;
        const cont = document.getElementById('cont-rep');
        if (cont) cont.innerHTML = h;
    },

    async renderReporteEconomicoPorCalidad(calidad: 'primera' | 'bornizo' | 'refugo') {
        const r = await Reportes.generarReporteEconomicoPorCalidad(calidad);
        const finca = await Fincas.getActive();
        if (!r || !finca) return;
        const totalG = await Gastos.getTotal();
        const repG = await Reportes.generarReporteEconomicoGlobal();
        const bNetoT = repG.valorTotal - totalG;
        const comp = finca.comprador || {};
        let h = `<div class="reporte-container"><div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:25px;"><h2 style="margin:0; color:var(--p-cork); font-weight:800;">⭐ Liq. ${r.nombreCalidad}</h2><button class="btn btn-outline" style="height:40px; padding:0 15px; border-radius:10px;" onclick="App.exportarPDF('calidad')">📄 PDF</button></div>${this._getDualHeaderHtml(finca.nombre, finca.propietario||'-', finca.cif||'-', comp.nombreEmpresa||'-', comp.cifNif||'-', comp.representante||'-')}<div class="card-finance" style="background:var(--surface-light); padding:20px;"><small class="text-muted">BENEFICIO NETO CAMP. (GLOBAL)</small><br><strong style="color:var(--accent); font-size:1.4rem;">${bNetoT.toFixed(2)}€</strong></div><div class="card"><div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;"><h4>Detalle por Zonas</h4><small class="text-muted">Precio: ${r.precioQuintal}€/Q</small></div><div class="table-responsive"><table class="reporte-table"><thead><tr><th>Zona</th><th>Sacas</th><th>Q.Neto</th><th style="text-align:right;">Valor</th></tr></thead><tbody>${Object.values(r.reportePorZona).filter((z:any) => z.sacas > 0).map((z:any) => `<tr><td><strong>${z.nombre}</strong></td><td>${z.sacas}</td><td><strong>${z.neto.toFixed(2)}</strong></td><td style="text-align:right; font-weight:700;">${z.valor.toFixed(2)}€</td></tr>`).join('')}</tbody><tfoot><tr><td>TOTAL</td><td>${r.totales.sacas}</td><td>${r.totales.neto.toFixed(2)}</td><td style="text-align:right; color:var(--p-cork);"><strong>${r.totales.valor.toFixed(2)}€</strong></td></tr></tfoot></table></div></div></div>`;
        const cont = document.getElementById('cont-rep');
        if (cont) cont.innerHTML = h;
    },

    async renderGraficos() {
        const cont = document.getElementById('cont-rep');
        if (!cont) return;
        cont.innerHTML = `<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:25px;"><h2 style="margin:0; color:var(--accent); font-weight:800;">📈 Panel de Gráficos</h2><button class="btn btn-outline" style="height:40px; padding:0 15px; border-radius:10px;" onclick="App.exportarPDF('graficos')">📄 PDF</button></div><div class="graficos-grid"><div class="card"><h4>Evolución 30 días</h4><div style="position:relative; height:220px;"><canvas id="chart-trend"></canvas></div></div><div class="card"><h4>Distribución Calidad</h4><div style="position:relative; height:220px;"><canvas id="chart-quality"></canvas></div></div><div class="card"><h4>Producción por Zona</h4><div style="position:relative; height:220px;"><canvas id="chart-zones"></canvas></div></div><div class="card"><h4>Valor Económico</h4><div style="position:relative; height:220px;"><canvas id="chart-economic"></canvas></div></div></div>`;
        setTimeout(async () => {
            await Charts.renderTrendChart('chart-trend');
            await Charts.renderQualityChart('chart-quality');
            await Charts.renderZonesChart('chart-zones');
            await Charts.renderEconomicChart('chart-economic');
        }, 100);
    },

    async exportarPDF(tipo: string) {
        const finca = await Fincas.getActive();
        const ahora = new Date().toLocaleString('es-ES');
        if (!finca) return;
        let titulo = "", contenidoHtml = "";
        const titulos: Record<string, string> = { 'global': 'Informe Global de Campaña', 'economico': 'Informe Económico de Campaña', 'zona': 'Informe de Producción por Zona', 'calidad': 'Informe de Liquidación por Calidad', 'lista': 'Listado de Pesadas', 'graficos': 'Panel de Análisis Gráfico' };
        titulo = titulos[tipo] || "Informe Detallado";
        
        if (tipo === 'lista') { 
            const listEl = document.querySelector('.lista-detallada'); 
            contenidoHtml = listEl ? listEl.innerHTML : ""; 
        } else if (tipo === 'graficos') {
            const originalCont = document.getElementById('cont-rep');
            if (originalCont) {
                const clone = originalCont.cloneNode(true) as HTMLElement;
                const origCanvas = originalCont.querySelectorAll('canvas');
                clone.querySelectorAll('canvas').forEach((canv, idx) => { 
                    const img = document.createElement('img'); 
                    img.src = origCanvas[idx].toDataURL('image/png'); 
                    img.style.width = '100%'; 
                    img.style.height = 'auto'; 
                    img.style.display = 'block'; 
                    canv.parentNode?.replaceChild(img, canv); 
                });
                contenidoHtml = clone.innerHTML;
            }
        } else { 
            const contRep = document.getElementById('cont-rep'); 
            contenidoHtml = contRep ? contRep.innerHTML : ""; 
        }
        
        if (!contenidoHtml) { this.toastError("No hay contenido para exportar"); return; }
        
        const printContainer = document.createElement('div');
        printContainer.style.position = 'absolute'; 
        printContainer.style.left = '-9999px'; 
        printContainer.style.width = '800px';
        printContainer.innerHTML = contenidoHtml; 
        document.body.appendChild(printContainer);
        
        printContainer.querySelectorAll('button, select, .reporte-header, h2').forEach(el => el.remove());
        printContainer.querySelectorAll('.card-finance, .card, .entity-card').forEach(el => { 
            const htmlEl = el as HTMLElement;
            htmlEl.style.background = 'white'; 
            htmlEl.style.color = '#333'; 
            htmlEl.style.border = '0.5pt solid #eee'; 
            htmlEl.style.boxShadow = 'none'; 
        });

        const plantilla = `<div class="pdf-export-container" style="font-family:Helvetica,Arial; padding:10mm; background:#fff; color:#333; width:800px;"><div style="text-align:center; margin-bottom:8mm;"><img src="icons/logo-header.png" style="width:55mm; margin:0 auto;"></div><div style="text-align:center; margin-bottom:10mm;"><h1 style="font-size:18pt; border-bottom:2pt solid #a0673a; display:inline-block; padding:0 10mm 2mm 10mm;">${titulo.toUpperCase()}</h1><div style="font-size:8pt; color:#999; margin-top:3mm;">Documento Oficial • Generado el ${ahora}</div></div><div class="pdf-content" style="padding-bottom:20mm;">${printContainer.innerHTML}</div><div style="margin-top:10mm; border-top:0.5pt solid #eee; padding-top:5mm; text-align:center; font-size:7pt; color:#bbb;">Cork Manager v7.0.0 • Liquidación Oficial • Sdog Farm Software Factory</div></div><style>.pdf-export-container * { background-color:transparent !important; color:#333 !important; box-shadow:none !important; } .pdf-export-container table { width:100%; border-collapse:collapse; margin:5mm 0; border:0.1pt solid #eee; page-break-inside:auto; } .pdf-export-container tr { page-break-inside:avoid; } .pdf-export-container th { background-color:#fafafa !important; border-bottom:0.8pt solid #a0673a !important; text-align:left; padding:3mm 2mm; font-size:8pt; font-weight:bold; text-transform:uppercase; color:#a0673a !important; } .pdf-export-container td { border-bottom:0.1pt solid #f0f0f0 !important; padding:3mm 2mm; font-size:9pt; } .pdf-export-container .card, .pdf-export-container .card-finance, .pdf-export-container .entity-card { background:#fff !important; border:0.5pt solid #eee !important; padding:6mm; margin-bottom:8mm; border-radius:2mm; page-break-inside:avoid; } .pdf-export-container h3, .pdf-export-container h4 { color:#000 !important; font-size:10pt; margin-bottom:5mm; text-transform:uppercase; border-left:4pt solid #a0673a; padding-left:3mm; } .pdf-export-container .total-neto { font-size:15pt !important; color:#4a7c2c !important; font-weight:900 !important; } .pdf-export-container .q-pill { display:inline-block; padding:1mm 2mm; border:0.2pt solid #ccc !important; border-radius:1mm; font-size:8pt; font-weight:bold; } .pdf-export-container img { max-width:100%; height:auto; display:block; margin:5mm auto; }</style>`;
        
        const opt = { 
            margin:[15,10,20,10], 
            filename:'Cork_'+tipo+'_'+finca.nombre.replace(/\s/g,'_')+'.pdf', 
            image:{type:'jpeg',quality:1}, 
            html2canvas:{scale:2, logging:false, useCORS:true, width:800}, 
            jsPDF:{unit:'mm',format:'a4',orientation:'portrait'}, 
            pagebreak:{mode:['avoid-all','css','legacy']} 
        };
        
        try { 
            this.toast('Generando PDF...');
            if (window.isNative && (window as any).Capacitor) { 
                await this._exportNativePDF(tipo, plantilla, finca.nombre); 
            } else { 
                await window.html2pdf().set(opt).from(plantilla).toPdf().get('pdf').then(() => {
                    document.body.removeChild(printContainer);
                }).save(); 
                this.toast('✅ PDF Exportado');
            } 
        } catch (e: any) { 
            this.toastError("Error al generar PDF: " + e.message); 
            if (document.body.contains(printContainer)) document.body.removeChild(printContainer);
        }
    },

    async _exportNativePDF(tipo: string, html: string, fincaNombre: string) {
        try {
            const pdfData = await window.html2pdf().from(html).set({ margin:0, html2canvas:{scale:2} }).outputPdf('datauristring');
            const data = pdfData.split(',')[1];
            const fileName = `Reporte_${tipo}_${fincaNombre.replace(/\s/g,'_')}_${Date.now()}.pdf`;
            const saved = await (window as any).Capacitor.Plugins.Filesystem.writeFile({ path: fileName, data: data, directory: 'CACHE' });
            await (window as any).Capacitor.Plugins.Share.share({ url: saved.uri });
        } catch (e) { 
            console.error(e); 
            throw e; 
        }
    },

    async exportGlobalToExcel() {
        try {
            await Export.exportGlobalToExcel();
            this.toast('✅ Excel exportado');
        } catch(e: any) {
            this.toastError(e.message);
        }
    },

    async exportEconomicoToExcel() {
        try {
            await Export.exportEconomicoToExcel();
            this.toast('✅ Excel exportado');
        } catch(e: any) {
            this.toastError(e.message);
        }
    },

    async renderAjustes() {
        const main = document.getElementById('app-content');
        const finca = await Fincas.getActive(); 
        if (!finca || !main) return this.renderFincasManager();
        const comp = finca.comprador || {};
        const precios = finca.precios || {};

        main.innerHTML = `
            <div style="display:flex; align-items:center; gap:12px; margin-bottom:25px;"><div style="width:5px; height:30px; background:var(--p-cork); border-radius:3px;"></div><h2 style="margin:0; border:none; padding:0; color:var(--text-p); font-weight:800;">Ajustes de Finca</h2></div>

            <div class="card" style="border: 2px solid var(--p-cork); border-left: 8px solid var(--p-cork);">
                <div style="display:flex; align-items:center; gap:10px; margin-bottom:15px;"><div style="width:4px; height:20px; background:var(--p-cork); border-radius:2px;"></div><h4 style="margin:0; font-size:0.9rem; text-transform:uppercase;">Datos Propietario</h4></div>
                <div class="form-group"><label>Nombre Explotación</label><input type="text" value="${finca.nombre}" readonly style="opacity:0.6;"></div>
                <div class="form-group"><label>Nombre Propietario</label><input type="text" id="adj-prop" value="${finca.propietario||''}"></div>
                <div class="form-group"><label>Teléfono</label><input type="tel" id="adj-prop-tel" value="${finca.telefono||''}"></div>
            </div>

            <div class="card" style="border: 2px solid var(--accent); border-left: 8px solid var(--accent);">
                <div style="display:flex; align-items:center; gap:10px; margin-bottom:15px;"><div style="width:4px; height:20px; background:var(--accent); border-radius:2px;"></div><h4 style="margin:0; font-size:0.9rem; text-transform:uppercase;">Datos Comprador y Precios</h4></div>
                <div class="form-group"><label>Empresa / Comprador</label><input type="text" id="adj-empresa" value="${comp.nombreEmpresa||''}"></div>
                <div class="form-group"><label>CIF/NIF Comprador</label><input type="text" id="adj-cif" value="${comp.cifNif||''}"></div>
                <div class="form-group"><label>Representante</label><input type="text" id="adj-representante" value="${comp.representante||''}"></div>
                <div class="form-group"><label>Porcentaje de Oreo (%)</label><input type="number" step="0.1" id="adj-oreo" value="${finca.porcentajeOreo || 0}"></div>
                <div class="form-group"><label>Teléfono</label><input type="tel" id="adj-tel" value="${comp.telefono||''}"></div>
                <div class="form-group"><label>Correo Electrónico</label><input type="email" id="adj-email" value="${comp.email||''}"></div>
                <div class="form-group"><label>Dirección Comercial</label><input type="text" id="adj-direccion" value="${comp.direccion||''}"></div>

                <h5 style="margin: 15px 0 10px 0; color: var(--accent); border-bottom: 1px solid var(--border); padding-bottom: 5px;">Precios de Mercado (€/Q)</h5>
                <div class="form-group"><label>Precio 1ª</label><input type="number" step="0.01" id="adj-p1" value="${precios.primera?.precioQuintal || ''}"></div>
                <div class="form-group"><label>Precio Bornizo</label><input type="number" step="0.01" id="adj-pb" value="${precios.bornizo?.precioQuintal || ''}"></div>
                <div class="form-group"><label>Precio Refugo</label><input type="number" step="0.01" id="adj-pr" value="${precios.refugo?.precioQuintal || ''}"></div>

                <button class="btn btn-primary" style="width:100%; margin-top:20px;" onclick="App._saveActiveFincaSettings()">💾 Guardar Ajustes</button>
            </div>

            <div class="reportes-selector-grid" style="margin-top:20px;">
                <button class="report-select-btn theme-zona" onclick="location.hash='/gastos'"><span class="btn-icon">💸</span><strong>Control Gastos</strong></button>
                <button class="report-select-btn theme-global" onclick="location.hash='/fincas'"><span class="btn-icon">📍</span><strong>Gestor Fincas</strong></button>
            </div>

            <div class="card text-center" style="border-top: 2px solid var(--p-cork); margin-top:30px; padding:30px;">
                <p style="font-size: 0.85rem; color: var(--text-s); margin-bottom: 10px; text-transform: uppercase; letter-spacing: 1px;">Desarrollado por</p>
                <img src="icons/Logo SDOGFARMCORE.png" style="width:160px; margin-bottom:15px; filter: drop-shadow(0 0 10px rgba(212,163,115,0.2));" onerror="this.style.display='none'">
                <p style="font-weight:800; color:var(--p-cork); margin-bottom: 5px;">Ecosistema CORE de Gestión Inteligente</p>
                <div style="width: 40px; height: 2px; background: var(--border); margin: 15px auto;"></div>
                <h3 style="font-size: 1.1rem; color: #fff; margin-bottom: 5px; border:none; padding:0;">📄 Licencia y Soporte</h3>
                <p style="font-size: 0.85rem; color: var(--text-s); line-height: 1.5;">
                    © 2026 Cork Manager. Todos los derechos reservados.<br>
                    Licencia de uso profesional v7.0.0
                </p>
                <p style="font-size: 0.85rem; color: var(--p-cork); margin-top: 15px; font-weight: 600;">
                    📩 soporte.sdogfarm@gmail.com
                </p>
            </div>`;
    },

    async renderFincasManager() {
        const main = document.getElementById('app-content');
        if (!main) return;
        const allFincas = await Fincas.list();
        const activeId = await Fincas.getActiveId();
        
        main.innerHTML = `
            <div style="display:flex; align-items:center; gap:12px; margin-bottom:25px;">
                <div style="width:5px; height:30px; background:var(--accent); border-radius:3px;"></div>
                <h2 style="margin:0; border:none; padding:0; font-weight:800;">Gestión de Fincas</h2>
            </div>

            <div class="reportes-selector-grid">
                <button class="report-select-btn theme-calidad" onclick="App._showFincaForm()" style="background: linear-gradient(135deg, rgba(127,176,105,0.5) 0%, rgba(141,179,105,0.5) 100%); border:none; box-shadow: 0 4px 15px rgba(127,176,105,0.15); min-height: 80px; padding: 10px;">
                    <span class="btn-icon" style="font-size:1.6rem; margin-bottom:2px; height:45px; width:45px;">➕</span>
                    <strong style="font-size:0.85rem;">Nueva Finca</strong>
                </button>
                <button class="report-select-btn theme-global" onclick="document.getElementById('import-f-mgr')?.click()" style="background: linear-gradient(135deg, rgba(160,103,58,0.5) 0%, rgba(212,163,115,0.5) 100%); border:none; box-shadow: 0 4px 15px rgba(160,103,58,0.15); min-height: 80px; padding: 10px;">
                    <span class="btn-icon" style="font-size:1.6rem; margin-bottom:2px; height:45px; width:45px;">📥</span>
                    <strong style="font-size:0.85rem;">Importar</strong>
                </button>
                <button class="report-select-btn theme-econ" onclick="Export.exportBackup()" style="background: linear-gradient(135deg, rgba(44,62,80,0.5) 0%, rgba(76,161,175,0.5) 100%); border:none; box-shadow: 0 4px 15px rgba(44,62,80,0.15); min-height: 80px; padding: 10px;">
                    <span class="btn-icon" style="font-size:1.6rem; margin-bottom:2px; height:45px; width:45px;">📄</span>
                    <strong style="font-size:0.85rem;">Exportar Todo</strong>
                </button>
            </div>

            <div id="fincas-list-container" style="margin-top:25px; display:flex; flex-direction:column; gap:15px;">
                ${allFincas.map(f => {
                    const isActive = Number(f.id) === Number(activeId);
                    return `
                    <div class="card finca-card ${isActive ? 'active-finca' : ''}"
                         onclick="App._selectFincaForLoad('${f.id}', '${f.nombre.replace(/'/g, "\\'")}')"
                         style="display:flex; align-items:center; padding:20px; border-left:8px solid ${isActive ? 'var(--accent)' : 'var(--border)'}; transition: transform 0.2s;">

                        <div style="flex:1;">
                            <strong style="font-size:1.2rem; color:white;">${f.nombre}</strong><br>
                            <small class="text-muted">Prop: ${f.propietario || '-'}</small>
                        </div>

                        <div style="display:flex; gap:12px; align-items:center;">
                            <button class="btn-modern-action" onclick="event.stopPropagation(); Export.exportBackup(['${f.id}'])" title="Exportar" style="background: rgba(255,255,255,0.05); border-radius:12px; width:45px; height:45px; display:flex; align-items:center; justify-content:center; border:1px solid rgba(255,255,255,0.1); cursor:pointer;">
                                <span style="font-size:1.4rem;">💾</span>
                            </button>
                            <button class="btn-modern-action" onclick="event.stopPropagation(); App._showFincaForm('${f.id}')" title="Editar" style="background: rgba(255,255,255,0.05); border-radius:12px; width:45px; height:45px; display:flex; align-items:center; justify-content:center; border:1px solid rgba(255,255,255,0.1); cursor:pointer;">
                                <span style="font-size:1.4rem;">✏️</span>
                            </button>
                            <button class="btn-modern-action" onclick="event.stopPropagation(); App._deleteFinca('${f.id}', '${f.nombre.replace(/'/g, "\\'")}')" title="Borrar" style="background: rgba(255,77,77,0.1); border-radius:12px; width:45px; height:45px; display:flex; align-items:center; justify-content:center; border:1px solid rgba(255,77,77,0.2); cursor:pointer; color:#ff4d4d;">
                                <span style="font-size:1.4rem;">🗑️</span>
                            </button>
                        </div>
                    </div>`;
                }).join('')}
            </div>

            <div id="load-finca-footer" style="display:none; margin-top:20px;">
                <button id="btn-load-finca" class="btn btn-primary" style="height:65px; font-weight:900; font-size:1.1rem; border-radius:15px; box-shadow:0 10px 30px rgba(127,176,105,0.3); width:100%;">
                    🚀 CARGAR FINCA SELECCIONADA
                </button>
            </div>

            <button class="btn btn-outline mt-2" onclick="location.hash='/ajustes'" style="width:100%;">Volver a Ajustes</button>
            <input type="file" id="import-f-mgr" accept=".json" style="display:none">
        `;
        
        const inputImport = document.getElementById('import-f-mgr') as HTMLInputElement;
        if (inputImport) {
            inputImport.onchange = async (e: any) => { 
                if (e.target.files[0]) await this._handleImportFile(e.target.files[0]); 
            };
        }
        
        const btnLoad = document.getElementById('btn-load-finca');
        if (btnLoad) {
            btnLoad.onclick = () => { 
                const pId = (this as any)._pendingFincaId;
                const pNombre = (this as any)._pendingFincaNombre;
                if (pId) this._confirmSwitchFinca(pId, pNombre); 
            };
        }
    },

    _selectFincaForLoad(id: string, nombre: string) {
        document.querySelectorAll('.finca-card').forEach(el => el.classList.remove('selected-finca'));
        (this as any)._pendingFincaId = id; 
        (this as any)._pendingFincaNombre = nombre;
        const footer = document.getElementById('load-finca-footer');
        if (footer) footer.style.display = 'block';
    },

    async _confirmSwitchFinca(newId: string, nombre: string) { 
        if (confirm(`¿Cargar finca "${nombre}"?`)) { 
            await Fincas.setActiveId(newId); 
            location.reload(); 
        } 
    },

    async _deleteFinca(id: string, nombre: string) { 
        if (confirm(`¿Borrar permanentemente ${nombre}?`)) { 
            await Fincas.delete(id); 
            location.reload(); 
        } 
    },

    async _showFincaForm(id: string | null = null) {
        let f: any = id ? await Fincas.get(id) : { nombre: '', propietario: '', cif: '', direccion: '', telefono: '', email: '' };
        if (!f) f = { nombre: '', propietario: '', cif: '', direccion: '', telefono: '', email: '' };
        
        const main = document.getElementById('app-content');
        if (!main) return;
        main.innerHTML = `
            <div class="card">
                <h3>${id ? 'Editar' : 'Nueva'} Finca</h3>
                <form id="form-finca">
                    <div class="form-group"><label>Nombre de la Finca*</label><input type="text" id="f-nom" value="${f.nombre}" required></div>
                    <div class="form-group"><label>Titular / Propietario*</label><input type="text" id="f-prop" value="${f.propietario}" required></div>
                    <div class="form-group"><label>DNI / CIF</label><input type="text" id="f-cif" value="${f.cif || ''}"></div>
                    <div class="form-group"><label>Dirección</label><input type="text" id="f-dir" value="${f.direccion || ''}"></div>
                    <div class="grid-2">
                        <div class="form-group"><label>Teléfono</label><input type="tel" id="f-tel" value="${f.telefono || ''}"></div>
                        <div class="form-group"><label>Correo Electrónico</label><input type="email" id="f-email" value="${f.email || ''}"></div>
                    </div>
                    <button type="submit" class="btn btn-primary mt-1">💾 Guardar Finca</button>
                    <button type="button" class="btn btn-outline mt-1" onclick="App.renderFincasManager()">Cancelar</button>
                </form>
            </div>`;
            
        const form = document.getElementById('form-finca');
        if (form) {
            form.onsubmit = async (e) => {
                e.preventDefault();
                const dS = {
                    ...f,
                    nombre: (document.getElementById('f-nom') as HTMLInputElement).value.trim(),
                    propietario: (document.getElementById('f-prop') as HTMLInputElement).value.trim(),
                    cif: (document.getElementById('f-cif') as HTMLInputElement).value.trim(),
                    direccion: (document.getElementById('f-dir') as HTMLInputElement).value.trim(),
                    telefono: (document.getElementById('f-tel') as HTMLInputElement).value.trim(),
                    email: (document.getElementById('f-email') as HTMLInputElement).value.trim()
                };
                await Fincas.save(dS); 
                this.toast("✅ Éxito"); 
                await this.renderFincasManager();
            };
        }
    },

    async _saveActiveFincaSettings() {
        const finca = await Fincas.getActive(); 
        if (!finca) return;
        finca.propietario = (document.getElementById('adj-prop') as HTMLInputElement).value;
        finca.telefono = (document.getElementById('adj-prop-tel') as HTMLInputElement).value;
        finca.porcentajeOreo = parseFloat((document.getElementById('adj-oreo') as HTMLInputElement).value) || 0;
        finca.comprador = {
            nombreEmpresa: (document.getElementById('adj-empresa') as HTMLInputElement).value,
            cifNif: (document.getElementById('adj-cif') as HTMLInputElement).value,
            representante: (document.getElementById('adj-representante') as HTMLInputElement).value,
            direccion: (document.getElementById('adj-direccion') as HTMLInputElement).value,
            telefono: (document.getElementById('adj-tel') as HTMLInputElement).value,
            email: (document.getElementById('adj-email') as HTMLInputElement).value
        };

        finca.precios = {
            primera: { precioQuintal: parseFloat((document.getElementById('adj-p1') as HTMLInputElement).value) || 0 },
            bornizo: { precioQuintal: parseFloat((document.getElementById('adj-pb') as HTMLInputElement).value) || 0 },
            refugo: { precioQuintal: parseFloat((document.getElementById('adj-pr') as HTMLInputElement).value) || 0 }
        };

        await Fincas.save(finca); 
        this.toast("✅ Ajustes guardados");
    },

    openManualZonas() { 
        window.open('manual-zonas.html', 'Manual', 'width=900,height=800'); 
    },

    async renderGastosManager() {
        const main = document.getElementById('app-content');
        if (!main) return;
        const gastos = await Gastos.list();
        const total = await Gastos.getTotal();
        main.innerHTML = `
            <div class="card">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <h3>Control Gastos</h3>
                    <div style="font-weight:800; color:#ff4d4d; font-size:1.2rem;">Total: ${total.toFixed(2)}€</div>
                </div>
                <button class="btn btn-primary mt-1" onclick="App._showGastoForm()">➕ Añadir Gasto</button>
            </div>
            <div class="lista-detallada">
                ${gastos.length ? gastos.map(g => `
                <div class="list-item-detallado" onclick="App._showGastoForm('${g.id}')">
                    <div>
                        <strong>${g.concepto || 'Sin concepto'}</strong><br>
                        <small class="text-muted">${g.categoria} | ${new Date(g.fecha).toLocaleDateString()}</small>
                    </div>
                    <div style="text-align:right;">
                        <strong style="color:#ff4d4d;">-${parseFloat(g.monto.toString()).toFixed(2)}€</strong>
                    </div>
                </div>`).join('') : '<p class="text-center text-muted">No hay gastos registrados.</p>'}
            </div>
            <button class="btn btn-outline" onclick="location.hash='/ajustes'">Volver a Ajustes</button>`;
    },

    async _showGastoForm(id: string | null = null) {
        const categories = Gastos.getCategories(); 
        let d: any = id ? await Gastos.get(id) : { concepto:'', monto:'', categoria:'Otros', fecha:new Date().toISOString().split('T')[0] };
        if (!d) d = { concepto:'', monto:'', categoria:'Otros', fecha:new Date().toISOString().split('T')[0] };
        
        const main = document.getElementById('app-content');
        if (!main) return;
        
        main.innerHTML = `
            <div class="card">
                <h3>${id ? 'Editar' : 'Nuevo'} Gasto</h3>
                <form id="form-gasto">
                    <div class="form-group">
                        <label>Concepto</label>
                        <input type="text" id="g-con" value="${d.concepto}" required>
                    </div>
                    <div class="grid-2">
                        <div class="form-group">
                            <label>Monto (€)</label>
                            <input type="number" step="0.01" id="g-mon" value="${d.monto}" required>
                        </div>
                        <div class="form-group">
                            <label>Fecha</label>
                            <input type="date" id="g-fec" value="${d.fecha}" required>
                        </div>
                    </div>
                    <div class="form-group">
                        <label>Categoría</label>
                        <select id="g-cat">${categories.map(c => `<option value="${c}" ${d.categoria===c ? 'selected' : ''}>${c}</option>`).join('')}</select>
                    </div>
                    <div class="form-actions mt-1">
                        <button type="submit" class="btn btn-primary">💾 Guardar Gasto</button>
                        ${id ? `<button type="button" class="btn btn-danger mt-1" onclick="App._deleteGasto('${id}')">🗑️ Eliminar</button>` : ''}
                        <button type="button" class="btn btn-outline mt-1" onclick="App.renderGastosManager()">Cancelar</button>
                    </div>
                </form>
            </div>`;
            
        const form = document.getElementById('form-gasto');
        if (form) {
            form.onsubmit = (e) => this._handleGastoSubmit(e, id);
        }
    },

    async _handleGastoSubmit(e: any, id: string | null) { 
        e.preventDefault(); 
        try { 
            const dS = { 
                id: id ? id : undefined, 
                concepto: (document.getElementById('g-con') as HTMLInputElement).value.trim(), 
                monto: parseFloat((document.getElementById('g-mon') as HTMLInputElement).value), 
                categoria: (document.getElementById('g-cat') as HTMLSelectElement).value, 
                fecha: (document.getElementById('g-fec') as HTMLInputElement).value 
            }; 
            await Gastos.save(dS); 
            this.toast('✅ Gasto guardado'); 
            await this.renderGastosManager(); 
        } catch(err: any){ 
            this.toastError(err.message); 
        } 
    },

    async _deleteGasto(id: string) { 
        if (confirm("¿Eliminar gasto?")) { 
            await Gastos.delete(id); 
            this.toast('✅ Eliminado'); 
            this.renderGastosManager(); 
        } 
    },

    async renderImportarPdf() {
        const main = document.getElementById('app-content');
        if (!main) return;

        main.innerHTML = `
            <div class="card animate-in">
                <h2>📥 Importar Zonas (PDF)</h2>
                <p style="font-size:0.85rem; color:var(--text-s);">Selecciona PDFs del Catastro para extraer datos automáticamente.</p>
                <input type="file" id="pdf-input" accept=".pdf" multiple style="margin-top:10px;">
                <div id="pdf-status" class="mt-2"></div>
            </div>
            <button class="btn btn-outline mt-2" onclick="location.hash='/zonas'">Volver</button>
        `;

        document.getElementById('pdf-input')?.addEventListener('change', async (e: any) => {
            const files = e.target.files;
            if (!files.length) return;

            const status = document.getElementById('pdf-status')!;
            status.innerHTML = '<div class="loader">Procesando...</div>';

            for (const file of files) {
                try {
                    const data = await PdfImport.parsePdfCatastro(file);
                    data.nombre = file.name.replace('.pdf', '');
                    await Zonas.save(data);
                    this.toast(`Importado: ${data.nombre}`);
                } catch (err) {
                    this.toastError(`Error en ${file.name}`);
                }
            }
            status.innerHTML = '✅ Importación finalizada';
        });
    },

    async switchFinca(id: string) {
        if (confirm("¿Cambiar a esta finca?")) { await Fincas.setActiveId(id); location.reload(); }
    },

    async logout() { await Auth.logout(); location.reload(); }
};

(window as any).App = App;
document.addEventListener('DOMContentLoaded', () => App.init());
