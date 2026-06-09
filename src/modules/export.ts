import { db } from './db';
import { Fincas } from './fincas';
import { Capacitor } from '@capacitor/core';

class ExportManager {
    async exportBackup(fincasIds: string[] | null = null) {
        try {
            const allFincas = await Fincas.list();
            const fincasToExport = fincasIds
                ? allFincas.filter(f => fincasIds.includes(f.id))
                : allFincas;

            if (fincasToExport.length === 0) {
                throw new Error("No hay fincas para exportar");
            }

            const exportData = {
                version: '7.0.0',
                app: "Cork Manager",
                exportedAt: new Date().toISOString(),
                fincas: [] as any[]
            };

            for (const finca of fincasToExport) {
                const zonas = await db.getAllFromIndex('zonas', 'fincaId', finca.id);
                const pesadas = await db.getAllFromIndex('pesadas', 'fincaId', finca.id);
                const gastos = await db.getAllFromIndex('gastos', 'fincaId', finca.id);

                const serializableZonas = await Promise.all(zonas.map(async (z: any) => {
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

            const isNative = Capacitor.isNativePlatform();
            if (isNative) {
                await this._exportNative(blob, fileName);
            } else {
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url; a.download = fileName;
                document.body.appendChild(a); a.click(); document.body.removeChild(a);
            }
            return true;
        } catch (error) {
            console.error(error);
            throw error;
        }
    }

    async parseBackupFile(file: File) {
        try {
            const content = await file.text();
            const data = JSON.parse(content);

            // Caso 1: Formato v7.x (Nuevo)
            if (data.fincas && Array.isArray(data.fincas)) {
                return data;
            }

            // Caso 2: Formato v6.x (Legacy)
            // Estructura: { data: { config: { nombreFinca... }, zonas: [], pesadas: [] } }
            if (data.data) {
                const legacy = data.data;
                return {
                    version: '6.x-normalized',
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
        } catch (error: any) {
            throw new Error("Error al leer el archivo: " + error.message);
        }
    }

    async saveImportedFincaData(fincaData: any) {
        const fincaId = await Fincas.save({ ...fincaData.info, id: undefined });
        if (fincaData.zonas) {
            for (const z of fincaData.zonas) {
                if (z.croquisBase64) {
                    z.croquisBlob = this._base64ToBlob(z.croquisBase64);
                    delete z.croquisBase64;
                }
                await db.add('zonas', { ...z, id: undefined, fincaId });
            }
        }
        if (fincaData.pesadas) {
            for (const p of fincaData.pesadas) {
                await db.add('pesadas', { ...p, id: undefined, fincaId });
            }
        }
        if (fincaData.gastos) {
            for (const g of fincaData.gastos) {
                await db.add('gastos', { ...g, id: undefined, fincaId });
            }
        }
        return fincaId;
    }

    private _blobToBase64(blob: Blob): Promise<string> {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(blob);
        });
    }

    private _base64ToBlob(base64: string) {
        try {
            const [header, data] = base64.split(',');
            const type = header.match(/:(.*?);/)![1];
            const binStr = atob(data);
            const arr = new Uint8Array(binStr.length);
            for (let i = 0; i < binStr.length; i++) arr[i] = binStr.charCodeAt(i);
            return new Blob([arr], { type });
        } catch (e) { return undefined; }
    }

    private async _exportNative(blob: Blob, fileName: string) {
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = async () => {
            const base64Data = (reader.result as string).split(',')[1];
            const savedFile = await (Capacitor.Plugins as any).Filesystem.writeFile({
                path: fileName,
                data: base64Data,
                directory: 'CACHE'
            });
            await (Capacitor.Plugins as any).Share.share({ url: savedFile.uri });
        };
    }

    async exportGlobalToExcel() {
        try {
            const { Reportes } = await import('./reportes');
            const r = await Reportes.generarReporteGlobalCampaña();
            if (!r) throw new Error("No se pudo generar el reporte");
            
            const wb = (window as any).XLSX.utils.book_new();
            
            // Hoja 1: Resumen Global
            const wsResumen = (window as any).XLSX.utils.json_to_sheet([
                { Calidad: "1ª Calidad", Quintales: r.totalesGlobales.primera.quintales.toFixed(2), Sacas: r.totalesGlobales.primera.sacas },
                { Calidad: "Bornizo", Quintales: r.totalesGlobales.bornizo.quintales.toFixed(2), Sacas: r.totalesGlobales.bornizo.sacas },
                { Calidad: "Refugo", Quintales: r.totalesGlobales.refugo.quintales.toFixed(2), Sacas: r.totalesGlobales.refugo.sacas },
                { Calidad: "TOTAL GENERAL", 
                  Quintales: (r.totalesGlobales.primera.quintales + r.totalesGlobales.bornizo.quintales + r.totalesGlobales.refugo.quintales).toFixed(2), 
                  Sacas: r.totalesGlobales.primera.sacas + r.totalesGlobales.bornizo.sacas + r.totalesGlobales.refugo.sacas 
                }
            ]);
            (window as any).XLSX.utils.book_append_sheet(wb, wsResumen, "Resumen Global");

            // Hoja 2: Desglose por Zona
            const desgloseZonas = Object.values(r.reportePorZona).map((z: any) => ({
                Zona: z.nombre,
                "1ª (kg)": Math.round(z.totales.primera.kg),
                "Bo (kg)": Math.round(z.totales.bornizo.kg),
                "Re (kg)": Math.round(z.totales.refugo.kg)
            }));
            const wsZonas = (window as any).XLSX.utils.json_to_sheet(desgloseZonas);
            (window as any).XLSX.utils.book_append_sheet(wb, wsZonas, "Por Zonas");

            const fileName = `Balance_Global_${new Date().toISOString().slice(0, 10)}.xlsx`;
            
            if (Capacitor.isNativePlatform()) {
                const base64 = (window as any).XLSX.write(wb, { bookType: 'xlsx', type: 'base64' });
                const savedFile = await (Capacitor.Plugins as any).Filesystem.writeFile({
                    path: fileName,
                    data: base64,
                    directory: 'CACHE'
                });
                await (Capacitor.Plugins as any).Share.share({ url: savedFile.uri });
            } else {
                (window as any).XLSX.writeFile(wb, fileName);
            }
        } catch (e: any) {
            console.error(e);
            throw new Error("Error al exportar a Excel: " + e.message);
        }
    }

    async exportEconomicoToExcel() {
        try {
            const { Reportes } = await import('./reportes');
            const r = await Reportes.generarReporteEconomicoGlobal();
            if (!r) throw new Error("No se pudo generar el reporte");
            
            const wb = (window as any).XLSX.utils.book_new();
            
            const datosEcon = [
                { Calidad: "1ª Calidad", Precio: r.precios.primera?.precioQuintal || 0, "Q. Bruto": r.totales.primera.bruto.toFixed(2), Oreo: r.totales.primera.merma.toFixed(2), "Q. Neto": r.totales.primera.neto.toFixed(2), Total: r.totales.primera.valor.toFixed(2) },
                { Calidad: "Bornizo", Precio: r.precios.bornizo?.precioQuintal || 0, "Q. Bruto": r.totales.bornizo.bruto.toFixed(2), Oreo: r.totales.bornizo.merma.toFixed(2), "Q. Neto": r.totales.bornizo.neto.toFixed(2), Total: r.totales.bornizo.valor.toFixed(2) },
                { Calidad: "Refugo", Precio: r.precios.refugo?.precioQuintal || 0, "Q. Bruto": r.totales.refugo.bruto.toFixed(2), Oreo: r.totales.refugo.merma.toFixed(2), "Q. Neto": r.totales.refugo.neto.toFixed(2), Total: r.totales.refugo.valor.toFixed(2) },
                { Calidad: "SUBTOTALES", Precio: "", "Q. Bruto": r.brutoTotal.toFixed(2), Oreo: (r.brutoTotal - r.netoTotal).toFixed(2), "Q. Neto": r.netoTotal.toFixed(2), Total: r.valorTotal.toFixed(2) }
            ];

            const ws = (window as any).XLSX.utils.json_to_sheet(datosEcon);
            (window as any).XLSX.utils.book_append_sheet(wb, ws, "Liquidación Económica");

            const fileName = `Liquidacion_Economica_${new Date().toISOString().slice(0, 10)}.xlsx`;

            if (Capacitor.isNativePlatform()) {
                const base64 = (window as any).XLSX.write(wb, { bookType: 'xlsx', type: 'base64' });
                const savedFile = await (Capacitor.Plugins as any).Filesystem.writeFile({
                    path: fileName,
                    data: base64,
                    directory: 'CACHE'
                });
                await (Capacitor.Plugins as any).Share.share({ url: savedFile.uri });
            } else {
                (window as any).XLSX.writeFile(wb, fileName);
            }
        } catch(e: any) {
            console.error(e);
            throw new Error("Error al exportar a Excel: " + e.message);
        }
    }
}

export const Export = new ExportManager();
export default Export;
