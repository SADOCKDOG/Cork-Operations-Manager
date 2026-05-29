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
        // Un ID debe ser un valor no vacío. Una cadena vacía de un formulario no es un ID válido.
        const esEdicion = data.id !== undefined && data.id !== null && data.id !== '';

        if (esEdicion) {
            // Asegurarse de que el ID sea un número antes de hacer el put, como espera el object store.
            data.id = Number(data.id);
            await db.put('fincas', data);
            return data.id;
        } else {
            // Eliminar explícitamente el ID para asegurar que IndexedDB use autoIncrement.
            delete data.id;
            const newId = await db.add('fincas', {
                ...data,
                creadoEn: new Date().toISOString()
            });

            if (!(await this.getActiveId())) {
                await this.setActiveId(newId);
            }
            return newId;
        }
    },

    async delete(id) {
        // Opcional: Validar si tiene zonas/pesadas antes de borrar
        return db.delete('fincas', Number(id));
    }
};

window.Fincas = Fincas;
