import { db } from './db';
import { Fincas } from './fincas';
import { Auth } from './auth';

class PesadaManager {
    async list(): Promise<any[]> {
        const fincaId = await Fincas.getActiveId();
        if (!fincaId) return [];
        const p = await db.getAllFromIndex('pesadas', 'fincaId', fincaId);
        return p.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
    }

    async get(id: string): Promise<any> {
        return db.get('pesadas', id);
    }

    async save(data: any): Promise<string> {
        const fincaId = await Fincas.getActiveId();
        if (!fincaId) throw new Error("No hay una finca activa seleccionada.");

        const finca = await Fincas.get(fincaId);
        if (!finca) throw new Error("Finca no encontrada");

        const listPesadas = await this.list();
        const esEdicion = !!data.id;
        const currentUser = Auth.getCurrentUser();

        const pesoNeto = (Number(data.pesoBruto) || 0) - (Number(data.tara) || 0);
        const quintales = Number((pesoNeto / finca.factorQuintal).toFixed(2));
        const calidadSeleccionada = data.calidad || 'bornizo';

        const maxSacaInDB = listPesadas.length > 0 ? Math.max(...listPesadas.map(p => p.saca || 0)) : 0;
        let saca = data.saca ? Number(data.saca) : (esEdicion ? (data.saca || 0) : maxSacaInDB + 1);

        const pesadasPorCalidad: any = {
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

        const pesada: any = {
            ...data,
            fincaId: fincaId,
            zonaId: data.zonaId,
            fecha: fechaIso,
            saca: saca,
            pesadasPorCalidad: pesadasPorCalidad,
            kg: pesoNeto,
            quintales: quintales,
            usuarioId: data.usuarioId || currentUser?.id,
            updatedAt: new Date().toISOString()
        };

        if (esEdicion) {
            await db.put('pesadas', pesada);
            return pesada.id;
        } else {
            finca.ultimaSaca = saca;
            await Fincas.save(finca);
            const newId = await db.add('pesadas', pesada);
            return newId;
        }
    }

    async delete(id: string) {
        return db.delete('pesadas', id);
    }
}

export const Pesadas = new PesadaManager();
export default Pesadas;
