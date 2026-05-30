const Export = {
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
                version: '5.1.0',
                type: fincasToExport.length > 1 ? 'multi' : 'single',
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
            const prefix = (fincasToExport.length === 1) ? `Backup_${fincasToExport[0].nombre.replace(/\s+/g, '_')}` : "Backup_MultiFinca";
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
            return JSON.parse(content);
        } catch (error) {
            console.error(error);
            throw new Error("El archivo no es un backup válido o está dañado.");
        }
    },

    async saveImportedFincaData(fincaData) {
        try {
            const zones = fincaData.zonas;
            const weighings = fincaData.pesadas;
            const expenses = fincaData.gastos;

            // Limpiar datos de soporte para el objeto Finca
            const fincaToSave = { ...fincaData.info };
            delete fincaToSave.id; // Nos aseguramos de que se cree un ID nuevo

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
            console.error("Error al guardar los datos importados para la finca:", fincaData.info.nombre, error);
            throw new Error(`Error al guardar la finca ${fincaData.info.nombre}`);
        }
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
    },

    _blobToBase64(blob) {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.readAsDataURL(blob);
        });
    },

    _base64ToBlob(base64) {
        const [header, data] = base64.split(',');
        const type = header.match(/:(.*?);/)[1];
        const binStr = atob(data);
        const arr = new Uint8Array(binStr.length);
        for (let i = 0; i < binStr.length; i++) arr[i] = binStr.charCodeAt(i);
        return new Blob([arr], { type });
    },

    /**
     * Exportar reporte a Excel - Global de Campaña
     */
    async exportGlobalToExcel() {
        try {
            App.toast('Generando Excel Global...');
            const finca = await Fincas.getActive();
            const reporte = await Reportes.generarReporteGlobalCampaña();

            const workbook = XLSX.utils.book_new();

            // Hoja 1: Resumen por Calidad
            const resumenData = [
                ['Resumen por Calidad', '', ''],
                ['Calidad', 'Quintales', 'Sacas'],
                ['1ª Calidad', reporte.totalesGlobales.primera.quintales, reporte.totalesGlobales.primera.sacas],
                ['Bornizo', reporte.totalesGlobales.bornizo.quintales, reporte.totalesGlobales.bornizo.sacas],
                ['Refugo', reporte.totalesGlobales.refugo.quintales, reporte.totalesGlobales.refugo.sacas],
                ['TOTAL', 
                    reporte.totalesGlobales.primera.quintales + reporte.totalesGlobales.bornizo.quintales + reporte.totalesGlobales.refugo.quintales,
                    reporte.totalesGlobales.primera.sacas + reporte.totalesGlobales.bornizo.sacas + reporte.totalesGlobales.refugo.sacas
                ]
            ];
            const ws1 = XLSX.utils.aoa_to_sheet(resumenData);
            XLSX.utils.book_append_sheet(workbook, ws1, 'Resumen');

            // Hoja 2: Desglose por Zona
            const zonasData = [['Zona', '1ª (kg)', 'Bornizo (kg)', 'Refugo (kg)']];
            Object.values(reporte.reportePorZona).forEach(z => {
                zonasData.push([
                    z.nombre,
                    Math.round(z.totales.primera.kg),
                    Math.round(z.totales.bornizo.kg),
                    Math.round(z.totales.refugo.kg)
                ]);
            });
            const ws2 = XLSX.utils.aoa_to_sheet(zonasData);
            XLSX.utils.book_append_sheet(workbook, ws2, 'Zonas');

            // Hoja 3: Listado de Pesadas
            const pesadas = await Pesadas.list();
            const pesadasData = [['Fecha', 'Saca', 'Zona', 'KG', 'Quintales', 'Calidad', 'Cuadrilla']];
            pesadas.forEach(p => {
                let cal = '';
                if ((p.pesadasPorCalidad?.primera?.kg || 0) > 0) cal = '1ª';
                else if ((p.pesadasPorCalidad?.bornizo?.kg || 0) > 0) cal = 'Bornizo';
                else cal = 'Refugo';

                pesadasData.push([
                    new Date(p.fecha).toLocaleDateString('es-ES'),
                    p.saca || '',
                    p.zonaId || '',
                    p.kg.toFixed(2),
                    p.quintales.toFixed(2),
                    cal,
                    p.cuadrilla || ''
                ]);
            });
            const ws3 = XLSX.utils.aoa_to_sheet(pesadasData);
            XLSX.utils.book_append_sheet(workbook, ws3, 'Pesadas');

            const fileName = `Reporte_Global_${finca?.nombre || 'Finca'}_${new Date().toISOString().slice(0, 10)}.xlsx`;
            XLSX.writeFile(workbook, fileName);
            App.toast('✅ Excel exportado');
        } catch (error) {
            console.error(error);
            App.toastError('Error al exportar Excel');
        }
    },

    /**
     * Exportar reporte económico a Excel
     */
    async exportEconomicoToExcel() {
        try {
            App.toast('Generando Excel Económico...');
            const finca = await Fincas.getActive();
            const reporte = await Reportes.generarReporteEconomicoGlobal();
            if (!reporte) return;

            const workbook = XLSX.utils.book_new();

            // Hoja 1: Resumen Económico
            const economicData = [
                ['REPORTE ECONÓMICO', '', '', '', ''],
                ['Finca:', finca?.nombre, '', '', ''],
                ['Generado:', new Date().toLocaleDateString('es-ES'), '', '', ''],
                ['Oreo (%):', finca?.porcentajeOreo || 0, '', '', ''],
                ['', '', '', '', ''],
                ['Calidad', 'Q. Bruto', 'Merma (Q)', 'Q. Neto', 'Valor Bruto (€)'],
                ['1ª Calidad', reporte.totales.primera.bruto, reporte.totales.primera.merma, reporte.totales.primera.neto, reporte.totales.primera.valor],
                ['Bornizo', reporte.totales.bornizo.bruto, reporte.totales.bornizo.merma, reporte.totales.bornizo.neto, reporte.totales.bornizo.valor],
                ['Refugo', reporte.totales.refugo.bruto, reporte.totales.refugo.merma, reporte.totales.refugo.neto, reporte.totales.refugo.valor],
                ['SUBTOTALES', reporte.brutoTotal, (reporte.brutoTotal - reporte.netoTotal), reporte.netoTotal, reporte.valorTotal],
                ['', '', '', '', ''],
                ['VALOR BRUTO TOTAL', '', '', '', reporte.valorTotal],
                ['GASTOS CAMPAÑA', '', '', '', -reporte.totalGastos],
                ['BENEFICIO NETO REAL', '', '', '', reporte.beneficioNeto]
            ];
            const ws1 = XLSX.utils.aoa_to_sheet(economicData);
            XLSX.utils.book_append_sheet(workbook, ws1, 'Económico');

            // Hoja 2: Detalle por Zona
            const zonasEconData = [
                ['Zona', 'Sacas', 'Bruto', 'Neto', 'Valor (€)']
            ];
            Object.values(reporte.reportePorZona).forEach(z => {
                zonasEconData.push([
                    z.nombre,
                    z.numPesadas || 0,
                    z.totalQuintales?.toFixed(2) || 0,
                    z.netoTotal?.toFixed(2) || 0,
                    z.valorTotal?.toFixed(2) || 0
                ]);
            });
            const ws2 = XLSX.utils.aoa_to_sheet(zonasEconData);
            XLSX.utils.book_append_sheet(workbook, ws2, 'Zonas');

            const fileName = `Reporte_Economico_${finca?.nombre || 'Finca'}_${new Date().toISOString().slice(0, 10)}.xlsx`;
            XLSX.writeFile(workbook, fileName);
            App.toast('✅ Excel económico exportado');
        } catch (error) {
            console.error(error);
            App.toastError('Error al exportar Excel');
        }
    },

    /**
     * Exportar listado de zonas a Excel
     */
    async exportZonasToExcel() {
        try {
            App.toast('Generando Excel de Zonas...');
            const finca = await Fincas.getActive();
            const zonas = await Zonas.list();
            const stats = await Zonas.getStats();

            const workbook = XLSX.utils.book_new();

            // Hoja 1: Resumen de Zonas
            const zonasData = [
                ['Zona', 'Ref. Catastral', 'Polígono', 'Parcela', 'Superficie (m²)', 'Pesadas', 'Total KG', 'Total Q']
            ];
            stats.forEach(z => {
                zonasData.push([
                    z.nombre || '',
                    z.refCatastral || '',
                    z.poligono || '',
                    z.parcela || '',
                    z.superficieGrafica || '',
                    z.numPesadas || 0,
                    Math.round(z.totalKg),
                    z.totalQuintales.toFixed(2)
                ]);
            });
            const ws1 = XLSX.utils.aoa_to_sheet(zonasData);
            XLSX.utils.book_append_sheet(workbook, ws1, 'Zonas');

            // Hoja 2: Detalles por Zona
            for (const z of stats.slice(0, 5)) {  // Máximo 5 hojas para no saturar
                const detailData = [
                    [`Zona: ${z.nombre}`, '', '', ''],
                    [`Ref. Catastral: ${z.refCatastral}`, '', '', ''],
                    ['', '', '', ''],
                    ['Calidad', 'KG', 'Quintales', 'Sacas'],
                    ['1ª', Math.round(z.totalesPorCalidad.primera.kg), z.totalesPorCalidad.primera.quintales.toFixed(2), ''],
                    ['Bornizo', Math.round(z.totalesPorCalidad.bornizo.kg), z.totalesPorCalidad.bornizo.quintales.toFixed(2), ''],
                    ['Refugo', Math.round(z.totalesPorCalidad.refugo.kg), z.totalesPorCalidad.refugo.quintales.toFixed(2), '']
                ];
                const ws = XLSX.utils.aoa_to_sheet(detailData);
                XLSX.utils.book_append_sheet(workbook, ws, z.nombre.slice(0, 31));
            }

            const fileName = `Zonas_${finca?.nombre || 'Finca'}_${new Date().toISOString().slice(0, 10)}.xlsx`;
            XLSX.writeFile(workbook, fileName);
            App.toast('✅ Excel de zonas exportado');
        } catch (error) {
            console.error(error);
            App.toastError('Error al exportar Excel');
        }
    }
};
window.Export = Export;
