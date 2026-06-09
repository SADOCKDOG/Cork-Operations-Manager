import { db, Zona } from './db';
import { Fincas } from './fincas';

class ZonaManager {
    async list(): Promise<Zona[]> {
        const activeFincaId = await Fincas.getActiveId();
        if (!activeFincaId) return [];
        return db.getAllFromIndex('zonas', 'fincaId', activeFincaId);
    }

    async get(id: string): Promise<Zona | undefined> {
        return db.get('zonas', id);
    }

    async getByRefCatastral(refCatastral: string): Promise<Zona | undefined> {
        const zonas = await this.list();
        return zonas.find(z => z.refCatastral === refCatastral);
    }

    async save(data: Partial<Zona>): Promise<string> {
        const esEdicion = !!data.id;
        const activeFincaId = await Fincas.getActiveId();
        const zonaToSave = { ...data, fincaId: data.fincaId || activeFincaId } as Zona;

        // Limpieza de campos internos de UI si existen
        const anyData = zonaToSave as any;
        delete anyData._fileIndex;

        if (esEdicion) {
            await db.put('zonas', zonaToSave);
            return zonaToSave.id;
        } else {
            const newId = await db.add('zonas', zonaToSave);
            return newId;
        }
    }

    async delete(id: string) {
        const pesadas = await db.getAllFromIndex('pesadas', 'zonaId', id);
        if (pesadas.length > 0) {
            throw new Error('No se puede borrar la zona porque tiene pesadas asociadas.');
        }
        return db.delete('zonas', id);
    }

    async getStats() {
        const zonas = await this.list();
        const activeFincaId = await Fincas.getActiveId();
        const pesadas = activeFincaId ? await db.getAllFromIndex('pesadas', 'fincaId', activeFincaId) : [];

        return zonas.map(z => {
            const pZona = pesadas.filter(p => String(p.zonaId) === String(z.id));
            const totalesPorCalidad = {
                primera: { kg: 0, quintales: 0 },
                bornizo: { kg: 0, quintales: 0 },
                refugo: { kg: 0, quintales: 0 }
            };

            pZona.forEach((p: any) => {
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
    }
}

export const Zonas = new ZonaManager();
export default Zonas;
