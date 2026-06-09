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
import { Network } from '@capacitor/network';

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
        let path = hash;
        if (hash.startsWith('/zona/')) path = '/zona';
        else if (hash.startsWith('/pesada/')) path = '/pesada';

        const main = document.getElementById('app-content');
        if (!main) return;

        const allFincas = await Fincas.list();
        if (allFincas.length === 0 && path !== '/fincas') return this.renderWelcomeWizard();

        const fincaId = await Fincas.getActiveId();
        if (!fincaId && path !== '/fincas') return this.renderFincasManager();

        main.innerHTML = '<div class="loader">Cargando...</div>';
        try {
            if (path === '/' ) await this.renderDashboard();
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
            <button class="btn btn-primary" onclick="location.hash='/nueva'">➕ NUEVA PESADA</button>
        `;
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
            <div class="card animate-in">
                <h2>Gestión de Zonas</h2>
                <button class="btn btn-primary mb-1" id="btn-new-zona">➕ Nueva Zona</button>
                <div class="zonas-list">
                    ${stats.map(z => `<div class="card" style="border-left:5px solid var(--p-cork); margin-bottom:10px;"><strong>${z.nombre}</strong><br><small>${z.totalQuintales.toFixed(2)} Q totales</small></div>`).join('')}
                </div>
            </div>
        `;
        document.getElementById('btn-new-zona')?.addEventListener('click', async () => {
            const nombre = prompt("Nombre de la zona:");
            if (nombre) { await Zonas.save({ nombre }); this.route(); }
        });
    },

    async renderAjustes() {
        const main = document.getElementById('app-content');
        if (!main) return;

        const lastSync = localStorage.getItem('lastSyncAt');
        const lastSyncStr = lastSync ? new Date(lastSync).toLocaleString() : 'Nunca';
        const isSunMode = document.body.classList.contains('theme-sun');

        main.innerHTML = `
            <div class="card animate-in">
                <h2>Ajustes</h2>
                <div style="display:flex; flex-direction:column; gap:12px;">
                    <button class="btn btn-secondary" onclick="location.hash='/fincas'">📍 GESTOR DE FINCAS</button>
                    <button class="btn btn-secondary" onclick="location.hash='/gastos'">💸 CONTROL DE GASTOS</button>
                    <button class="btn btn-secondary" onclick="location.hash='/informes'">📊 CENTRAL DE INFORMES</button>
                    <button class="btn btn-secondary" id="btn-export">📥 EXPORTAR BACKUP</button>

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
                        <h3>Sincronización Cloud</h3>
                        <p style="font-size:0.85rem; color:var(--text-s);">Sincroniza tus datos con Google Drive para trabajar en varios dispositivos.</p>
                        <p style="font-size:0.85rem;">Última sincronización: <strong>${lastSyncStr}</strong></p>
                        <button class="btn btn-primary" id="btn-sync-now" style="margin-top:10px;">🔄 SINCRONIZAR AHORA</button>
                        <button class="btn btn-outline" id="btn-drive-logout" style="margin-top:10px; border-color:var(--text-s); color:var(--text-s);">Cerrar sesión de Google</button>
                    </div>

                    <button class="btn btn-danger mt-2" onclick="App.logout()">CERRAR SESIÓN DE USUARIO</button>
                </div>
            </div>
        `;

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
            <div class="card animate-in">
                <h2>Gestión de Fincas</h2>
                <div class="fincas-list">
                    ${allFincas.map(f => `
                        <div class="card ${f.id === activeId ? 'active-finca' : ''}" style="border-left:8px solid ${f.id === activeId ? 'var(--accent)' : 'var(--border)'};" onclick="App.switchFinca('${f.id}')">
                            <strong>${f.nombre}</strong>
                        </div>
                    `).join('')}
                </div>
                <button class="btn btn-primary mt-2" id="btn-new-finca">➕ NUEVA FINCA</button>
                <button class="btn btn-outline mt-2" onclick="location.hash='/ajustes'">Volver</button>
            </div>
        `;
        document.getElementById('btn-new-finca')?.addEventListener('click', async () => {
            const nombre = prompt("Nombre de la finca:");
            if (nombre) { await Fincas.save({ nombre, factorQuintal: 46, precios: {}, ultimaSaca: 0 }); this.route(); }
        });
    },

    async renderGastosManager() {
        const main = document.getElementById('app-content');
        if (!main) return;
        const list = await Gastos.list();
        const total = await Gastos.getTotal();

        main.innerHTML = `
            <div class="card animate-in">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <h2>Control de Gastos</h2>
                    <div style="color:var(--color-metric-danger); font-weight:800;">${total.toFixed(2)}€</div>
                </div>
                <button class="btn btn-primary mt-1" id="btn-new-gasto">➕ AÑADIR GASTO</button>
                <div class="lista-detallada mt-2">
                    ${list.map((g: any) => `
                        <div class="list-item-detallado">
                            <div><strong>${g.concepto}</strong><br><small>${g.categoria} | ${new Date(g.fecha).toLocaleDateString()}</small></div>
                            <div style="text-align:right; color:var(--color-metric-danger); font-weight:700;">-${g.monto}€</div>
                        </div>
                    `).join('')}
                </div>
                <button class="btn btn-outline mt-2" onclick="location.hash='/ajustes'">Volver</button>
            </div>
        `;

        document.getElementById('btn-new-gasto')?.addEventListener('click', async () => {
            const concepto = prompt("Concepto del gasto:");
            const monto = prompt("Importe (€):");
            if (concepto && monto) {
                await Gastos.save({ concepto, monto: parseFloat(monto) });
                this.renderGastosManager();
            }
        });
    },

    async renderReportesView() {
        const main = document.getElementById('app-content');
        if (!main) return;

        const r = await Reportes.generarReporteGlobalCampaña();
        const t = r.totalesGlobales;

        main.innerHTML = `
            <div class="card animate-in">
                <h2>Central de Informes</h2>
                <div class="summary-table-grid">
                    <div class="summary-cell c-1a"><div class="s-lbl">1ª</div><div class="s-val">${t.primera.quintales.toFixed(1)}Q</div></div>
                    <div class="summary-cell c-bo"><div class="s-lbl">BO</div><div class="s-val">${t.bornizo.quintales.toFixed(1)}Q</div></div>
                    <div class="summary-cell c-re"><div class="s-lbl">RE</div><div class="s-val">${t.refugo.quintales.toFixed(1)}Q</div></div>
                </div>
                <div class="reportes-selector-grid mt-2" style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
                    <button class="btn btn-secondary" onclick="App.toast('Generando PDF...')">Balance Global</button>
                    <button class="btn btn-secondary" onclick="App.toast('Generando PDF...')">Liq. Económica</button>
                </div>
                <button class="btn btn-outline mt-2" onclick="location.hash='/'">Volver</button>
            </div>
        `;
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
