const Fincas = {
    async list() {
        return db.getAll('fincas');
    },

    async get(id) {
        return db.get('fincas', Number(id));
    },

    async getActiveId() {
        const id = localStorage.getItem('activeFincaId');
        return id ? Number(id) : null;
    },

    async getActive() {
        const id = await this.getActiveId();
        if (!id) return null;
        return this.get(id);
    },

    async setActiveId(id) {
        localStorage.setItem('activeFincaId', id);
        window.dispatchEvent(new CustomEvent('fincaChanged', { detail: { id } }));
    },

    async save(data) {
        const esEdicion = data.id !== undefined && data.id !== null;
        if (esEdicion) {
            await db.put('fincas', data);
            return data.id;
        } else {
            const id = await db.add('fincas', {
                ...data,
                creadoEn: new Date().toISOString()
            });
            if (!(await this.getActiveId())) {
                await this.setActiveId(id);
            }
            return id;
        }
    },

    async delete(id) {
        // Opcional: Validar si tiene zonas/pesadas antes de borrar
        return db.delete('fincas', Number(id));
    }
};

window.Fincas = Fincas;
