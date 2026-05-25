const Zonas = {
    async list() {
        const activeFincaId = await Fincas.getActiveId();
        if (!activeFincaId) return [];
        return db.getAllFromIndex('zonas', 'fincaId', activeFincaId);
    },

    async get(id) {
        return db.get('zonas', id);
    },

    async getByRefCatastral(refCatastral) {
        const zonas = await this.list();
        return zonas.find(z => z.refCatastral === refCatastral);
    },

    async save(data) {
        const esEdicion = data.id !== undefined && data.id !== null && data.id !== '' && !isNaN(Number(data.id));
        const activeFincaId = await Fincas.getActiveId();
        const zonaToSave = { ...data, fincaId: data.fincaId || activeFincaId };
        delete zonaToSave._fileIndex;

        if (esEdicion) {
            zonaToSave.id = Number(data.id);
            return db.put('zonas', zonaToSave);
        } else {
            zonaToSave.creadoEn = Date.now();
            delete zonaToSave.id; 
            return db.add('zonas', zonaToSave);
        }
    },

    async delete(id) {
        const pesadas = await db.getAllFromIndex('pesadas', 'zonaId', id);
        if (pesadas.length > 0) {
            throw new Error('No se puede borrar la zona porque tiene pesadas asociadas.');
        }
        return db.delete('zonas', id);
    },

    async getStats() {
        const zonas = await this.list();
        const activeFincaId = await Fincas.getActiveId();
        const pesadas = activeFincaId ? await db.getAllFromIndex('pesadas', 'fincaId', activeFincaId) : [];
        
        return zonas.map(z => {
            const pZona = pesadas.filter(p => Number(p.zonaId) === Number(z.id));
            const totalesPorCalidad = {
                primera: { kg: 0, quintales: 0 },
                bornizo: { kg: 0, quintales: 0 },
                refugo: { kg: 0, quintales: 0 }
            };

            pZona.forEach(p => {
                if (p.pesadasPorCalidad) {
                    totalesPorCalidad.primera.kg += p.pesadasPorCalidad.primera?.kg || 0;
                    totalesPorCalidad.primera.quintales += p.pesadasPorCalidad.primera?.quintales || 0;
                    totalesPorCalidad.bornizo.kg += p.pesadasPorCalidad.bornizo?.kg || 0;
                    totalesPorCalidad.bornizo.quintales += p.pesadasPorCalidad.bornizo?.quintales || 0;
                    totalesPorCalidad.refugo.kg += p.pesadasPorCalidad.refugo?.kg || 0;
                    totalesPorCalidad.refugo.quintales += p.pesadasPorCalidad.refugo?.quintales || 0;
                }
            });

            const totalKg = totalesPorCalidad.primera.kg + totalesPorCalidad.bornizo.kg + totalesPorCalidad.refugo.kg;
            const totalQuintales = totalesPorCalidad.primera.quintales + totalesPorCalidad.bornizo.quintales + totalesPorCalidad.refugo.quintales;

            return {
                ...z,
                numPesadas: pZona.length,
                totalKg,
                totalQuintales,
                totalesPorCalidad
            };
        });
    },

    async syncWithSeed() {
        return await this.syncFromPdfDirectory();
    },

    async syncFromPdfDirectory() {
        console.log('[Zonas.sync] Iniciando sincronización...');
        const PDF_FILES = [
            'Polígono 1 Parcela 30.pdf',
            'Polígono 10 Parcela 257.pdf',
            'Polígono 19 Parcela 136.pdf',
            'Polígono 809 Parcela 275.pdf',
            'Polígono 809 Parcela 276.pdf',
            'Polígono 809 Parcela 581.pdf',
            'Polígono 809 Parcela 582.pdf',
            'Polígono 809 Parcela 583.pdf',
            'Polígono 809 Parcela 584.pdf',
            'Polígono 809 Parcela 595.pdf',
            'Polígono 809 Parcela 606.pdf'
        ];

        const activeFincaId = await Fincas.getActiveId();
        if (!activeFincaId) throw new Error("No hay una finca activa para sincronizar.");

        const zonasActuales = await this.list();
        let agregadas = 0;
        let actualizadas = 0;

        for (const filename of PDF_FILES) {
            try {
                const response = await fetch(`ZONAS/${filename}`);
                if (!response.ok) {
                    console.warn(`No se pudo cargar: ZONAS/${filename}`);
                    continue;
                }
                const buffer = await response.arrayBuffer();
                const file = new File([buffer], filename, { type: 'application/pdf' });
                const zonaData = await window.parsePdfCatastro(file);
                
                if (!zonaData || !zonaData.refCatastral) {
                    console.warn(`Datos inválidos en: ${filename}`);
                    continue;
                }

                zonaData.fincaId = activeFincaId;
                // Si el nombre viene vacío del PDF, usamos el nombre del archivo
                if (!zonaData.nombre) {
                    zonaData.nombre = filename.replace('.pdf', '');
                }

                const zonaDB = zonasActuales.find(z => z.refCatastral === zonaData.refCatastral);
                if (zonaDB) {
                    // Actualizamos preservando ID y ciertos campos manuales
                    const zonaActualizada = {
                        ...zonaData,
                        id: zonaDB.id,
                        creadoEn: zonaDB.creadoEn,
                        notas: zonaDB.notas || zonaData.notas,
                        alcornoquesEstimados: zonaDB.alcornoquesEstimados || zonaData.alcornoquesEstimados,
                        ultimoDescorche: zonaDB.ultimoDescorche || zonaData.ultimoDescorche,
                        proximoDescorche: zonaDB.proximoDescorche || zonaData.proximoDescorche
                    };
                    await db.put('zonas', zonaActualizada);
                    actualizadas++;
                } else {
                    await this.save(zonaData);
                    agregadas++;
                }
            } catch (error) {
                console.error(`Error procesando ${filename}:`, error);
            }
        }
        return { agregadas, actualizadas };
    }
};

window.Zonas = Zonas;
