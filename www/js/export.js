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
    }
};
window.Export = Export;
