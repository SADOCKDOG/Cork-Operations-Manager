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
                exportedAt: new Date().toISOString(),
                fincas: []
            };

            for (const finca of fincasToExport) {
                const zonas = await db.getAllFromIndex('zonas', 'fincaId', finca.id);
                const pesadas = await db.getAllFromIndex('pesadas', 'fincaId', finca.id);
                
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
                    pesadas: pesadas
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
            const importData = JSON.parse(content);
            let fincaInfo = null;

            // Caso 1: Backup antiguo (v3.x o v4.x)
            if (importData.data && !importData.fincas) {
                const d = importData.data;
                fincaInfo = {
                    nombre: d.config?.nombreFinca || "",
                    propietario: d.config?.propietario || "",
                    direccion: d.config?.direccion || "",
                    cif: d.config?.cif || "",
                    telefono: d.config?.telefono || "",
                    factorQuintal: d.config?.factorQuintal || 46,
                    porcentajeOreo: d.config?.porcentajeOreo || 0,
                    unidadMedida: d.config?.unidadMedida || 'quintal_castellano',
                    precios: d.precios?.calidades || {
                        primera: { precioQuintal: 80 },
                        bornizo: { precioQuintal: 45 },
                        refugo: { precioQuintal: 25 }
                    },
                    ultimaSaca: d.config?.ultimaSaca || 0,
                    zonas: d.zonas || [],
                    pesadas: d.pesadas || []
                };
            }
            // Caso 2: Backup nuevo (v5.0+) - Tomamos la primera finca del backup para simplificar el wizard
            else if (importData.fincas && importData.fincas.length > 0) {
                const item = importData.fincas[0];
                fincaInfo = {
                    ...item.info,
                    zonas: item.zonas || [],
                    pesadas: item.pesadas || []
                };
                delete fincaInfo.id;
            }

            return fincaInfo;
        } catch (error) {
            console.error(error);
            throw new Error("El archivo no es un backup válido");
        }
    },

    async saveImportedFinca(data) {
        try {
            const zones = data.zonas;
            const weighings = data.pesadas;

            // Limpiar datos de soporte para el objeto Finca
            const fincaToSave = { ...data };
            delete fincaToSave.zonas;
            delete fincaToSave.pesadas;

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

            return fincaId;
        } catch (error) {
            console.error(error);
            throw new Error("Error al guardar los datos importados");
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
    }
};
window.Export = Export;
