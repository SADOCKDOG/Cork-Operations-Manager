/**
 * Gastos.js - Gestión de Gastos de Explotación (v5.9.5)
 * Control de costes de campaña: Mano de obra, transporte, etc.
 */

const Gastos = {
    /**
     * Listar todos los gastos de la finca activa
     */
    async list() {
        const fincaId = await Fincas.getActiveId();
        if (!fincaId) return [];
        const all = await db.getAllFromIndex('gastos', 'fincaId', Number(fincaId));
        return all.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
    },

    /**
     * Obtener un gasto por ID
     */
    async get(id) {
        return db.get('gastos', Number(id));
    },

    /**
     * Guardar o actualizar un gasto
     */
    async save(gasto) {
        const fincaId = await Fincas.getActiveId();
        if (!fincaId) throw new Error("No hay finca activa");

        const data = {
            ...gasto,
            fincaId: Number(fincaId),
            monto: parseFloat(gasto.monto) || 0,
            fecha: gasto.fecha || new Date().toISOString().split('T')[0],
            categoria: gasto.categoria || 'Otros',
            concepto: gasto.concepto || ''
        };

        if (data.id) {
            data.id = Number(data.id);
            return db.put('gastos', data);
        } else {
            delete data.id; // Crucial para autoIncrement
            return db.add('gastos', data);
        }
    },

    /**
     * Eliminar un gasto
     */
    async delete(id) {
        return db.delete('gastos', Number(id));
    },

    /**
     * Obtener total de gastos por finca
     */
    async getTotal() {
        const lista = await this.list();
        return lista.reduce((sum, g) => sum + (parseFloat(g.monto) || 0), 0);
    },

    /**
     * Categorías predefinidas
     */
    getCategories() {
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
};

window.Gastos = Gastos;
