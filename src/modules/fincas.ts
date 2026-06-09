import { db, Finca } from './db';

class FincaManager {
    async list(): Promise<Finca[]> {
        return db.getAll('fincas');
    }

    async get(id: string): Promise<Finca | undefined> {
        return db.get('fincas', id);
    }

    async getActiveId(): Promise<string | null> {
        return localStorage.getItem('activeFincaId');
    }

    async getActive(): Promise<Finca | null> {
        const id = await this.getActiveId();
        if (!id) return null;
        return this.get(id) as Promise<Finca | null>;
    }

    async setActiveId(id: string) {
        localStorage.setItem('activeFincaId', id);
        window.dispatchEvent(new CustomEvent('fincaChanged', { detail: { id } }));
    }

    async save(data: Partial<Finca>): Promise<string> {
        const esEdicion = !!data.id;

        if (esEdicion) {
            await db.put('fincas', data);
            return data.id!;
        } else {
            const finca = {
                ...data,
                creadoEn: new Date().toISOString()
            } as Finca;
            const newId = await db.add('fincas', finca);

            const activeId = await this.getActiveId();
            if (!activeId) {
                await this.setActiveId(newId);
            }
            return newId;
        }
    }

    async delete(id: string) {
        // Validar si tiene dependencias antes de borrar
        const zonas = await db.getAllFromIndex('zonas', 'fincaId', id);
        const pesadas = await db.getAllFromIndex('pesadas', 'fincaId', id);
        const gastos = await db.getAllFromIndex('gastos', 'fincaId', id);

        if (zonas.length > 0 || pesadas.length > 0 || gastos.length > 0) {
            throw new Error('No se puede eliminar la finca porque tiene zonas, pesadas o gastos asociados.');
        }
        return db.delete('fincas', id);
    }
}

export const Fincas = new FincaManager();
export default Fincas;
