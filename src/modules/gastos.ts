import { db } from './db';
import { Fincas } from './fincas';

class GastoManager {
    async list(): Promise<any[]> {
        const fincaId = await Fincas.getActiveId();
        if (!fincaId) return [];
        const all = await db.getAllFromIndex('gastos', 'fincaId', fincaId);
        return all.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
    }

    async get(id: string): Promise<any> {
        return db.get('gastos', id);
    }

    async save(gasto: any): Promise<string> {
        const fincaId = await Fincas.getActiveId();
        if (!fincaId) throw new Error("No hay finca activa");

        const data = {
            ...gasto,
            fincaId: fincaId,
            monto: parseFloat(gasto.monto) || 0,
            fecha: gasto.fecha || new Date().toISOString().split('T')[0],
            categoria: gasto.categoria || 'Otros',
            concepto: gasto.concepto || ''
        };

        if (data.id) {
            return db.put('gastos', data);
        } else {
            return db.add('gastos', data);
        }
    }

    async delete(id: string) {
        return db.delete('gastos', id);
    }

    async getTotal(): Promise<number> {
        const lista = await this.list();
        return lista.reduce((sum, g) => sum + (parseFloat(g.monto) || 0), 0);
    }

    getCategories(): string[] {
        return [
            'Mano de Obra',
            'Seguridad Social',
            'Transporte',
            'Gasoil / Maquinaria',
            'Permisos / Tasas',
            'Seguros',
            'Otros'
        ];
    }
}

export const Gastos = new GastoManager();
export default Gastos;
