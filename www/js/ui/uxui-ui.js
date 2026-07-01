import { Fincas } from '../fincas.js';
import { Pesadas } from '../pesadas.js';
import { App } from '../app.js';
import { Utils } from '../core/utils.js';

export const UxUiUI = {
    async renderUxUi() {
        const main = document.getElementById('app-content');
        main.innerHTML = '<div class="loader">Cargando UX/UI...</div>';

        // Load active finca and pesadas
        const finca = await Fincas.getActive();
        if (!finca) {
            main.innerHTML = `<div class="card error-card"><h2>Error</h2><p>No hay finca activa. Crea una finca primero.</p></div>`;
            return;
        }

        const allPesadas = await Pesadas.list();
        // Filtramos las pesadas para la finca actual
        // Si no hay filtro, mostramos de la finca activa
        const pesadasFinca = allPesadas; // In Cork Manager, pesadas list might be global or already filtered? 
        // We'll use them all for now assuming it's the active finca context.
        
        const tGlobal = App._calculateQualityTotals(pesadasFinca);
        const totalKg = tGlobal.primera.kg + tGlobal.bornizo.kg + tGlobal.refugo.kg;

        // Economic calculation example (assuming Prices exist, or mocking them)
        const precioPrimera = finca.precioPrimera || 150;
        const precioBornizo = finca.precioBornizo || 80;
        const precioRefugo = finca.precioRefugo || 40;

        // Without Oreo (0% discount)
        const ecoSinOreo = {
            primera: tGlobal.primera.quintales * precioPrimera,
            bornizo: tGlobal.bornizo.quintales * precioBornizo,
            refugo: tGlobal.refugo.quintales * precioRefugo
        };
        const totalEcoSinOreo = ecoSinOreo.primera + ecoSinOreo.bornizo + ecoSinOreo.refugo;

        // With Oreo (let's assume Oreo discount is 11% typically in cork, or whatever the finca sets. Mocking 11%)
        const oreoDescuento = 0.11;
        const descFactor = 1 - oreoDescuento;
        const ecoConOreo = {
            primera: ecoSinOreo.primera * descFactor,
            bornizo: ecoSinOreo.bornizo * descFactor,
            refugo: ecoSinOreo.refugo * descFactor
        };
        const totalEcoConOreo = ecoConOreo.primera + ecoConOreo.bornizo + ecoConOreo.refugo;

        // Build Historical List
        let historialHTML = '';
        if (pesadasFinca.length === 0) {
            historialHTML = '<div class="text-grey" style="text-align:center; padding: 20px;">No hay pesadas registradas.</div>';
        } else {
            historialHTML = pesadasFinca.map(p => {
                const totalQ = (p.pesadasPorCalidad?.primera?.quintales || 0) + (p.pesadasPorCalidad?.bornizo?.quintales || 0) + (p.pesadasPorCalidad?.refugo?.quintales || 0);
                return `
                <div class="card" style="margin-bottom: 12px; padding: 15px; border-left: 4px solid var(--header-neon-color, #CCFF00);">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                        <span style="font-weight: 700; color: #FFFFFF;">Pesada #${p.id}</span>
                        <span class="text-grey" style="font-size: 0.8rem;">${new Date(p.timestamp).toLocaleDateString()}</span>
                    </div>
                    <div style="font-size: 1.2rem; font-weight: 800; color: var(--header-neon-color, #CCFF00);">${totalQ.toFixed(2)} Q</div>
                </div>`;
            }).join('');
        }

        const html = `
            <div style="margin-bottom: 24px; animation: fadeInUp 0.3s ease;">
                <h2 style="color: #FFFFFF; font-size: 1.4rem; margin-bottom: 8px; font-weight: 800;">${finca.nombre || 'El Llano del Chamorro'}</h2>
                <div class="text-grey" style="font-size: 0.9rem;">Prueba de eficiencia UI/UX Corpo</div>
            </div>

            <!-- BOTONES DE ACCIÓN WIZARD -->
            <div class="bento-grid" style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin-bottom: 24px; animation: fadeInUp 0.4s ease;">
                <button data-action="App._showFincaForm" class="widget-link-btn--neon" style="--neon-color:#3b82f6; --neon-glow:rgba(59,130,246,0.69); --neon-inner:rgba(59,130,246,0.25); border: none; width: 100%; cursor: pointer;">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="24" height="24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                    <span class="widget-link-label" style="margin-top: 8px;">Editar Finca</span>
                </button>
                <a href="#/nueva" class="widget-link-btn--neon" style="--neon-color:#CCFF00; --neon-glow:rgba(204,255,0,0.69); --neon-inner:rgba(204,255,0,0.25); text-decoration: none;">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="24" height="24"><path d="M12 5v14M5 12h14"></path></svg>
                    <span class="widget-link-label" style="margin-top: 8px;">Registrar Pesada</span>
                </a>
            </div>

            <!-- RESULTADOS SACA -->
            <div class="card" style="margin-bottom: 24px; padding: 24px; text-align: center; animation: fadeInUp 0.5s ease;">
                <h3 style="color: #94A3B8; font-size: 0.85rem; text-transform: uppercase; margin-bottom: 20px; font-weight: 800; letter-spacing: 0.1em;"><span style="color: var(--header-neon-color, #CCFF00); margin-right: 4px;">|</span> RESULTADOS DE LA SACA</h3>
                <div style="font-size: 2.5rem; font-weight: 900; line-height: 1; margin-bottom: 20px; color: var(--header-neon-color, #CCFF00); text-shadow: 0 0 15px rgba(204,255,0,0.15);">${totalKg.toLocaleString()} <span style="font-size: 0.4em; font-weight: 700; color: #94A3B8; text-shadow: none;">kg</span></div>
                
                <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; border-top: 1px solid #2a2a2a; padding-top: 20px;">
                    <div><div class="text-grey" style="font-size: 0.75rem; font-weight: 800; margin-bottom: 8px; letter-spacing: 0.5px;">1ª CAL.</div><div style="font-size: 1.1rem; font-weight: 800; color: #FFFFFF;">${tGlobal.primera.quintales.toFixed(2)} <span style="font-size: 0.7em;" class="text-grey">Q</span></div></div>
                    <div><div class="text-grey" style="font-size: 0.75rem; font-weight: 800; margin-bottom: 8px; letter-spacing: 0.5px;">BORNIZO</div><div style="font-size: 1.1rem; font-weight: 800; color: #FFFFFF;">${tGlobal.bornizo.quintales.toFixed(2)} <span style="font-size: 0.7em;" class="text-grey">Q</span></div></div>
                    <div><div class="text-grey" style="font-size: 0.75rem; font-weight: 800; margin-bottom: 8px; letter-spacing: 0.5px;">REFUGO</div><div style="font-size: 1.1rem; font-weight: 800; color: #FFFFFF;">${tGlobal.refugo.quintales.toFixed(2)} <span style="font-size: 0.7em;" class="text-grey">Q</span></div></div>
                </div>
            </div>

            <!-- RESULTADOS ECONÓMICOS -->
            <div class="bento-grid" style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin-bottom: 24px; animation: fadeInUp 0.6s ease;">
                
                <!-- SIN DESCUENTO -->
                <div class="card" style="grid-column: span 1; margin-bottom: 0; padding: 20px; text-align: center;">
                    <h3 style="color: #94A3B8; font-size: 0.85rem; text-transform: uppercase; margin-bottom: 15px; font-weight: 800; letter-spacing: 0.1em;"><span style="color: var(--header-neon-color, #CCFF00); margin-right: 4px;">|</span> SIN DESCUENTO</h3>
                    <div style="font-size: 1.5rem; font-weight: 900; color: #FFFFFF; margin-bottom: 12px;">${totalEcoSinOreo.toLocaleString()} <span style="font-size: 0.6em; color: #94A3B8;">€</span></div>
                    <div class="text-grey" style="font-size: 0.7rem; margin-bottom: 4px;">1ª: ${ecoSinOreo.primera.toLocaleString()} €</div>
                    <div class="text-grey" style="font-size: 0.7rem; margin-bottom: 4px;">B: ${ecoSinOreo.bornizo.toLocaleString()} €</div>
                    <div class="text-grey" style="font-size: 0.7rem;">R: ${ecoSinOreo.refugo.toLocaleString()} €</div>
                </div>

                <!-- CON OREO -->
                <div class="card" style="grid-column: span 1; margin-bottom: 0; padding: 20px; text-align: center;">
                    <h3 style="color: #94A3B8; font-size: 0.85rem; text-transform: uppercase; margin-bottom: 15px; font-weight: 800; letter-spacing: 0.1em;"><span style="color: var(--header-neon-color, #CCFF00); margin-right: 4px;">|</span> CON OREO (11%)</h3>
                    <div style="font-size: 1.5rem; font-weight: 900; color: #CCFF00; margin-bottom: 12px;">${totalEcoConOreo.toLocaleString()} <span style="font-size: 0.6em; color: #94A3B8;">€</span></div>
                    <div class="text-grey" style="font-size: 0.7rem; margin-bottom: 4px;">1ª: ${ecoConOreo.primera.toLocaleString()} €</div>
                    <div class="text-grey" style="font-size: 0.7rem; margin-bottom: 4px;">B: ${ecoConOreo.bornizo.toLocaleString()} €</div>
                    <div class="text-grey" style="font-size: 0.7rem;">R: ${ecoConOreo.refugo.toLocaleString()} €</div>
                </div>
            </div>

            <!-- REGISTROS HISTÓRICOS Y ACCIONES -->
            <div style="margin-bottom: 24px; animation: fadeInUp 0.7s ease;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                    <h3 style="color: #94A3B8; font-size: 0.85rem; text-transform: uppercase; font-weight: 800; letter-spacing: 0.1em;"><span style="color: var(--header-neon-color, #CCFF00); margin-right: 4px;">|</span> HISTÓRICO DE PESADAS</h3>
                    <div style="display: flex; gap: 8px;">
                        <button data-action="App.imprimirPdf" style="background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); padding: 6px 12px; border-radius: 6px; color: #FFF; font-size: 0.75rem; font-weight: bold; cursor: pointer;">PDF</button>
                        <button data-action="App.exportarExcel" style="background: rgba(16,185,129,0.15); border: 1px solid rgba(16,185,129,0.4); padding: 6px 12px; border-radius: 6px; color: #10b981; font-size: 0.75rem; font-weight: bold; cursor: pointer;">EXCEL</button>
                    </div>
                </div>
                
                <div class="historical-list">
                    ${historialHTML}
                </div>
            </div>
        `;
        main.innerHTML = html;
    }
};
