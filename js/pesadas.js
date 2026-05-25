const Pesadas = {
    async list() {
        const fincaId = await Fincas.getActiveId();
        if (!fincaId) return [];
        const p = await db.getAllFromIndex('pesadas', 'fincaId', fincaId);
        return p.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
    },

    async get(id) {
        return db.get('pesadas', id);
    },

    async save(data) {
        const fincaId = await Fincas.getActiveId();
        if (!fincaId) throw new Error("No hay una finca activa seleccionada.");
        
        const finca = await Fincas.get(fincaId);
        const listPesadas = await this.list();
        const esEdicion = data.id !== undefined && data.id !== null;

        const pesoNeto = (Number(data.pesoBruto) || 0) - (Number(data.tara) || 0);
        const quintales = Number((pesoNeto / finca.factorQuintal).toFixed(2));
        const calidadSeleccionada = data.calidad || 'bornizo';

        const maxSacaInDB = listPesadas.length > 0 ? Math.max(...listPesadas.map(p => p.saca || 0)) : 0;
        let saca = data.saca ? Number(data.saca) : (esEdicion ? null : maxSacaInDB + 1);

        const pesadasPorCalidad = {
            primera: { kg: 0, quintales: 0 },
            bornizo: { kg: 0, quintales: 0 },
            refugo: { kg: 0, quintales: 0 }
        };
        if (pesadasPorCalidad.hasOwnProperty(calidadSeleccionada)) {
            pesadasPorCalidad[calidadSeleccionada] = { kg: pesoNeto, quintales: quintales };
        }

        let fechaIso = data.fecha;
        if (!fechaIso.includes('T')) {
            const ahora = new Date();
            const horaStr = ahora.toTimeString().split(' ')[0];
            fechaIso = `${data.fecha}T${horaStr}`;
        }

        const pesada = {
            id: esEdicion ? Number(data.id) : undefined,
            fincaId: fincaId,
            zonaId: Number(data.zonaId),
            fecha: fechaIso,
            saca: saca,
            pesadasPorCalidad: pesadasPorCalidad,
            kg: pesoNeto,
            quintales: quintales,
            cuadrilla: data.cuadrilla || "",
            notas: data.notas || "",
            pesoBruto: Number(data.pesoBruto),
            tara: Number(data.tara)
        };

        if (esEdicion) {
            return db.put('pesadas', pesada);
        } else {
            finca.ultimaSaca = saca;
            await Fincas.save(finca);
            delete pesada.id;
            return db.add('pesadas', pesada);
        }
    },

    async delete(id) {
        return db.delete('pesadas', id);
    }
};

window.Pesadas = Pesadas;
