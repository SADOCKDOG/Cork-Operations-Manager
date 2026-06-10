import { db, dbPromise } from './db.js';
import { Fincas } from './fincas.js';
import { Pesadas } from './pesadas.js';
import { App } from './app.js';
import { Reportes } from './reportes.js';

/**
 * Export.js - Motor de Backup y Restauración (Version 6.1.9 - Enhanced Robustness)
 */

export const Export = {
    async exportBackup(fincasIds = null) {
        try {
            App.toast('Generando backup...');
            const allFincas = await Fincas.list();
            const fincasToExport = fincasIds 
                ? allFincas.filter(f => fincasIds.includes(f.id))
                : allFincas;

            if (fincasToExport.length === 0) {
                App.toastError("No hay fincas para exportar");
                return;
            }

            const exportData = {
                version: '6.1.9',
                app: "Cork Manager",
                exportedAt: new Date().toISOString(),
                fincas: []
            };

            for (const finca of fincasToExport) {
                const zonas = await db.getAllFromIndex('zonas', 'fincaId', finca.id);
                const pesadas = await db.getAllFromIndex('pesadas', 'fincaId', finca.id);
                const gastos = await db.getAllFromIndex('gastos', 'fincaId', finca.id);
                
                const serializableZonas = await Promise.all(zonas.map(async z => {
                    const zCopy = { ...z };
                    if (zCopy.croquisBlob instanceof Blob) {
                        zCopy.croquisBase64 = await this._blobToBase64(zCopy.croquisBlob);
                    }
                    delete zCopy.croquisBlob;
                    return zCopy;
                }));

                exportData.fincas.push({
                    info: finca,
                    zonas: serializableZonas,
                    pesadas: pesadas,
                    gastos: gastos
                });
            }

            const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
            const prefix = (fincasToExport.length === 1) ? `Backup_${fincasToExport[0].nombre.replace(/\s+/g, '_')}` : "Backup_Total";
            const fileName = `${prefix}_${new Date().toISOString().slice(0, 10)}.json`;
            
            if (window.isNative && window.Capacitor) {
                await this._exportNative(blob, fileName);
            } else {
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url; a.download = fileName;
                document.body.appendChild(a); a.click(); document.body.removeChild(a);
            }
            App.toast('✅ Backup exportado');
        } catch (error) { console.error(error); App.toastError('Fallo al exportar'); }
    },

    async parseBackupFile(file) {
        try {
            const content = await file.text();
            const data = JSON.parse(content);

            // Normalización: Asegurar que siempre devolvemos un objeto con .fincas[]
            if (data.fincas && Array.isArray(data.fincas)) {
                return data;
            }

            // Si es un formato legacy (data: { config, zonas, pesadas })
            if (data.data) {
                const legacy = data.data;
                return {
                    version: 'legacy-normalized',
                    fincas: [{
                        info: {
                            nombre: legacy.config?.nombreFinca || "Finca Importada",
                            propietario: "Importado",
                            factorQuintal: legacy.config?.factorQuintal || 46,
                            porcentajeOreo: legacy.config?.porcentajeOreo || 0,
                            precios: legacy.precios?.calidades || {}
                        },
                        zonas: legacy.zonas || [],
                        pesadas: legacy.pesadas || [],
                        gastos: []
                    }]
                };
            }

            throw new Error("El archivo no tiene un formato reconocido.");
        } catch (error) {
            console.error(error);
            throw new Error("Error al leer el archivo: " + error.message);
        }
    },

    async saveImportedFincaData(fincaData) {
        try {
            const zones = fincaData.zonas;
            const weighings = fincaData.pesadas;
            const expenses = fincaData.gastos;

            const fincaToSave = { ...fincaData.info };
            delete fincaToSave.id;

            const fincaId = await Fincas.save(fincaToSave);

            if (zones) {
                for (const z of zones) {
                    z.fincaId = fincaId;
                    if (z.croquisBase64 && !z.croquisBlob) {
                        z.croquisBlob = this._base64ToBlob(z.croquisBase64);
                    }
                    delete z.id;
                    await db.add('zonas', z);
                }
            }
            if (weighings) {
                for (const p of weighings) {
                    p.fincaId = fincaId;
                    delete p.id;
                    await db.add('pesadas', p);
                }
            }
            if (expenses) {
                for (const g of expenses) {
                    g.fincaId = fincaId;
                    delete g.id;
                    await db.add('gastos', g);
                }
            }

            return fincaId;
        } catch (error) {
            console.error("Error guardando finca importada:", error);
            throw error;
        }
    },

    _blobToBase64(blob) {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.readAsDataURL(blob);
        });
    },

    _base64ToBlob(base64) {
        try {
            const [header, data] = base64.split(',');
            const type = header.match(/:(.*?);/)[1];
            const binStr = atob(data);
            const arr = new Uint8Array(binStr.length);
            for (let i = 0; i < binStr.length; i++) arr[i] = binStr.charCodeAt(i);
            return new Blob([arr], { type });
        } catch (e) { return null; }
    },

    async _exportNative(blob, fileName) {
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = async () => {
            const base64Data = reader.result.split(',')[1];
            const savedFile = await Capacitor.Plugins.Filesystem.writeFile({
                path: fileName,
                data: base64Data,
                directory: 'CACHE'
            });
            await Capacitor.Plugins.Share.share({ url: savedFile.uri });
        };
    }
,

    async exportarPDF(tipo) {
        const finca = await Fincas.getActive(), ahora = new Date().toLocaleString('es-ES');
        let titulo = "", contenidoHtml = "";
        const titulos = { 'global': 'Informe Global de Campaña', 'economico': 'Informe Económico de Campaña', 'zona': 'Informe de Producción por Zona', 'calidad': 'Informe de Liquidación por Calidad', 'lista': 'Listado de Pesadas', 'graficos': 'Panel de Análisis Gráfico' };
        titulo = titulos[tipo] || "Informe Detallado";
        if (tipo === 'lista') { const listEl = document.querySelector('.lista-detallada'); contenidoHtml = listEl ? listEl.innerHTML : ""; }
        else if (tipo === 'graficos') {
            const originalCont = document.getElementById('cont-rep');
            if (originalCont) {
                const clone = originalCont.cloneNode(true);
                originalCont.querySelectorAll('canvas').forEach((canv, idx) => { const img = document.createElement('img'); img.src = canv.toDataURL('image/png'); img.style.width = '100%'; img.style.height = 'auto'; img.style.display = 'block'; clone.querySelectorAll('canvas')[idx].parentNode.replaceChild(img, clone.querySelectorAll('canvas')[idx]); });
                contenidoHtml = clone.innerHTML;
            }
        } else { const contRep = document.getElementById('cont-rep'); contenidoHtml = contRep ? contRep.innerHTML : ""; }
        if (!contenidoHtml) { App.toastError("No hay contenido"); return; }
        const printContainer = document.createElement('div');
        printContainer.style.position = 'absolute'; printContainer.style.left = '-9999px'; printContainer.style.width = '800px';
        printContainer.innerHTML = contenidoHtml; document.body.appendChild(printContainer);
        printContainer.querySelectorAll('button, select, .reporte-header, h2').forEach(el => el.remove());
        printContainer.querySelectorAll('.card-finance, .card, .entity-card').forEach(el => { el.style.background = 'white'; el.style.color = '#333'; el.style.border = '0.5pt solid #eee'; el.style.boxShadow = 'none'; });

        const comp = finca.comprador || {};
        const plantilla = `<div class="pdf-export-container" style="font-family:Helvetica,Arial; padding:10mm; background:#fff; color:#333; width:800px;"><div style="text-align:center; margin-bottom:8mm;"><img src="icons/logo-header.png" style="width:55mm; margin:0 auto;"></div><div style="text-align:center; margin-bottom:10mm;"><h1 style="font-size:18pt; border-bottom:2pt solid #a0673a; display:inline-block; padding:0 10mm 2mm 10mm;">${titulo.toUpperCase()}</h1><div style="font-size:8pt; color:#999; margin-top:3mm;">Documento Oficial • Generado el ${ahora}</div></div><div class="pdf-content" style="padding-bottom:20mm;">${printContainer.innerHTML}</div><div style="margin-top:10mm; border-top:0.5pt solid #eee; padding-top:5mm; text-align:center; font-size:7pt; color:#bbb;">Cork Manager v6.3.1 • Liquidación Oficial • Sdog Farm Software Factory</div></div><style>.pdf-export-container * { background:transparent !important; color:#333 !important; box-shadow:none !important; } .pdf-export-container table { width:100%; border-collapse:collapse; margin:5mm 0; border:0.1pt solid #eee; page-break-inside:auto; } .pdf-export-container tr { page-break-inside:avoid; } .pdf-export-container th { background:#fafafa !important; border-bottom:0.8pt solid #a0673a !important; text-align:left; padding:3mm 2mm; font-size:8pt; font-weight:bold; text-transform:uppercase; color:#a0673a !important; } .pdf-export-container td { border-bottom:0.1pt solid #f0f0f0 !important; padding:3mm 2mm; font-size:9pt; } .pdf-export-container .card, .pdf-export-container .card-finance, .pdf-export-container .entity-card { background:#fff !important; border:0.5pt solid #eee !important; padding:6mm; margin-bottom:8mm; border-radius:2mm; page-break-inside:avoid; } .pdf-export-container h3, .pdf-export-container h4 { color:#000 !important; font-size:10pt; margin-bottom:5mm; text-transform:uppercase; border-left:4pt solid #a0673a; padding-left:3mm; } .pdf-export-container .total-neto { font-size:15pt !important; color:#4a7c2c !important; font-weight:900 !important; } .pdf-export-container .q-pill { display:inline-block; padding:1mm 2mm; border:0.2pt solid #ccc !important; border-radius:1mm; font-size:8pt; font-weight:bold; } .pdf-export-container img { max-width:100%; height:auto; display:block; margin:5mm auto; }</style>`;
        const opt = { margin:[15,10,20,10], filename:'Cork_'+tipo+'_'+finca.nombre.replace(/\s/g,'_')+'.pdf', image:{type:'jpeg',quality:1}, html2canvas:{scale:2, logging:false, useCORS:true, width:800}, jsPDF:{unit:'mm',format:'a4',orientation:'portrait'}, pagebreak:{mode:['avoid-all','css','legacy']} };
        try { if (window.isNative) await this._exportNativePDF(tipo, plantilla); else await html2pdf().set(opt).from(plantilla).toPdf().get('pdf').then(() => document.body.removeChild(printContainer)).save(); } catch (e) { App.toastError("Error al generar PDF"); }
    },

    async _exportNativePDF(tipo, html) {
        try {
            const pdf = await html2pdf().from(html).set({ margin:0, html2canvas:{scale:2} }).outputPdf('datauristring');
            const data = pdf.split(',')[1];
            const fileName = `Reporte_${tipo}_${Date.now()}.pdf`;
            const saved = await Capacitor.Plugins.Filesystem.writeFile({ path: fileName, data: data, directory: 'CACHE' });
            await Capacitor.Plugins.Share.share({ url: saved.uri });
        } catch (e) { console.error(e); throw e; }
    },

    async exportGlobalToExcel() {
        const r = await Reportes.generarReporteGlobalCampaña();
        const finca = await Fincas.getActive();
        if(!r || !finca) return;
        if (!window.XLSX) { App.toastError("La librería Excel no está cargada."); return; }
        const wb = XLSX.utils.book_new();
        const wsData = [
            ["Finca", finca.nombre],
            ["Propietario", finca.propietario || ""],
            [],
            ["Calidad", "Quintales", "Sacas"],
            ["1ª Calidad", r.totalesGlobales.primera.quintales, r.totalesGlobales.primera.sacas],
            ["Bornizo", r.totalesGlobales.bornizo.quintales, r.totalesGlobales.bornizo.sacas],
            ["Refugo", r.totalesGlobales.refugo.quintales, r.totalesGlobales.refugo.sacas]
        ];
        const ws = XLSX.utils.aoa_to_sheet(wsData);
        XLSX.utils.book_append_sheet(wb, ws, "Resumen Global");

        const wsZonasData = [["Zona", "1ª Calidad (kg)", "Bornizo (kg)", "Refugo (kg)"]];
        Object.values(r.reportePorZona).forEach(z => {
            wsZonasData.push([z.nombre, z.totales.primera.kg, z.totales.bornizo.kg, z.totales.refugo.kg]);
        });
        const wsZonas = XLSX.utils.aoa_to_sheet(wsZonasData);
        XLSX.utils.book_append_sheet(wb, wsZonas, "Desglose por Zona");

        const fileName = `Balance_${finca.nombre.replace(/\s/g, '_')}.xlsx`;
        await this._saveExcel(wb, fileName);
    },

    async exportEconomicoToExcel() {
        const r = await Reportes.generarReporteEconomicoGlobal();
        const finca = await Fincas.getActive();
        if(!r || !finca) return;
        if (!window.XLSX) { App.toastError("La librería Excel no está cargada."); return; }
        const wb = XLSX.utils.book_new();
        const wsData = [
            ["Finca", finca.nombre],
            ["Comprador", finca.comprador?.nombreEmpresa || ""],
            [],
            ["Calidad", "Precio", "Q. Bruto", "Oreo (Q)", "Q. Neto", "Total (€)"]
        ];
        ['primera', 'bornizo', 'refugo'].forEach(c => {
            wsData.push([
                c.toUpperCase(), 
                r.precios[c]?.precioQuintal || 0,
                r.totales[c].bruto,
                r.totales[c].merma,
                r.totales[c].neto,
                r.totales[c].valor
            ]);
        });
        wsData.push([]);
        wsData.push(["SUBTOTALES", "", r.brutoTotal, r.brutoTotal - r.netoTotal, r.netoTotal, r.valorTotal]);
        wsData.push(["Gastos Campaña", "", "", "", "", -r.totalGastos]);
        wsData.push(["BENEFICIO NETO", "", "", "", "", r.beneficioNeto]);

        const ws = XLSX.utils.aoa_to_sheet(wsData);
        XLSX.utils.book_append_sheet(wb, ws, "Liquidacion");

        const fileName = `Liquidacion_${finca.nombre.replace(/\s/g, '_')}.xlsx`;
        await this._saveExcel(wb, fileName);
    },

    async _saveExcel(wb, fileName) {
        if (window.isNative && window.Capacitor) {
            const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'base64' });
            try {
                const saved = await Capacitor.Plugins.Filesystem.writeFile({
                    path: fileName,
                    data: wbout,
                    directory: 'CACHE'
                });
                await Capacitor.Plugins.Share.share({ url: saved.uri });
            } catch (e) {
                console.error("Error guardando Excel nativo", e);
                App.toastError("Error guardando Excel");
            }
        } else {
            XLSX.writeFile(wb, fileName);
        }
    }
};
