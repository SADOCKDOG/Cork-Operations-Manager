const { openDB } = self.idb;

const DB_NAME = 'CorchoDB';
const DB_VERSION = 6;

async function initDB() {
    const database = await openDB(DB_NAME, DB_VERSION, {
        upgrade(db, oldVersion, newVersion, transaction) {
            console.log(`[DB] Upgrading v${oldVersion} to v${newVersion}`);

            if (oldVersion < 2) {
                if (db.objectStoreNames.contains('zonas')) db.deleteObjectStore('zonas');
                const zoneStore = db.createObjectStore('zonas', { keyPath: 'id', autoIncrement: true });
                zoneStore.createIndex('refCatastral', 'refCatastral', { unique: true });
                zoneStore.createIndex('poligono', 'poligono');
                zoneStore.createIndex('parcela', 'parcela');
            }

            if (!db.objectStoreNames.contains('pesadas')) {
                const pesadaStore = db.createObjectStore('pesadas', { keyPath: 'id', autoIncrement: true });
                pesadaStore.createIndex('fecha', 'fecha');
                pesadaStore.createIndex('zonaId', 'zonaId');
            }

            if (!db.objectStoreNames.contains('config')) {
                db.createObjectStore('config', { keyPath: 'id' });
            }
            
            if (oldVersion < 3) {
                if (!db.objectStoreNames.contains('precios')) db.createObjectStore('precios', { keyPath: 'id' });
            }

            // --- VERSION 5: MULTI-FINCA ---
            if (oldVersion < 5) {
                if (!db.objectStoreNames.contains('fincas')) {
                    db.createObjectStore('fincas', { keyPath: 'id', autoIncrement: true });
                }

                // Añadir índice fincaId a zonas y pesadas
                const zoneStore = transaction.objectStore('zonas');
                if (!zoneStore.indexNames.contains('fincaId')) {
                    zoneStore.createIndex('fincaId', 'fincaId');
                }

                const pesadaStore = transaction.objectStore('pesadas');
                if (!pesadaStore.indexNames.contains('fincaId')) {
                    pesadaStore.createIndex('fincaId', 'fincaId');
                }
            }

            // --- VERSION 6: REMOVE UNIQUE CONSTRAINT ON refCatastral ---
            if (oldVersion < 6) {
                const zoneStore = transaction.objectStore('zonas');
                if (zoneStore.indexNames.contains('refCatastral')) {
                    zoneStore.deleteIndex('refCatastral');
                }
                zoneStore.createIndex('refCatastral', 'refCatastral', { unique: false });
                console.log("[DB] Index 'refCatastral' updated to non-unique.");
            }
        },
    });

    await migrateToMultiFinca(database);
    await maybeLoadInitialData(database);
    return database;
}

async function maybeLoadInitialData(database) {
    const countZonas = await database.count('zonas');
    const countPesadas = await database.count('pesadas');
    const countFincas = await database.count('fincas');

    if (countZonas === 0 && countPesadas === 0 && countFincas <= 1) {
        console.log("[DB] Buscando datos iniciales...");
        try {
            const response = await fetch('initial_data.json');
            if (!response.ok) return;
            const backupData = await response.json();
            if (!backupData.data) return;

            // Buscamos la finca activa o la primera creada
            let finca = (await database.getAll('fincas'))[0];
            if (!finca) return;

            const data = backupData.data;

            // Actualizar configuración de la finca con los datos del backup (v3.2.0 compatibility)
            if (data.config) {
                finca.nombre = data.config.nombreFinca || finca.nombre;
                finca.factorQuintal = data.config.factorQuintal || finca.factorQuintal;
                finca.ultimaSaca = data.config.ultimaSaca || 0;

                // Datos específicos para El Chamorro si es el backup oficial
                if (finca.nombre === "El Chamorro") {
                    finca.propietario = "Mª del Carmen Arteaga";
                    finca.direccion = "Juan Ramón Jiménez 55, Arroyomolinos de León, Huelva";
                    finca.unidadMedida = "quintal_castellano";
                    finca.porcentajeOreo = 0;
                }
            }
            if (data.precios && data.precios.calidades) {
                finca.precios = data.precios.calidades;
            }
            await database.put('fincas', finca);
            console.log(`[DB] Finca inicial configurada: ${finca.nombre}`);

            if (data.zonas) {
                for (const z of data.zonas) {
                    z.fincaId = finca.id;
                    if (z.croquisBase64) {
                        try {
                            const [header, b64] = z.croquisBase64.split(',');
                            const type = header.match(/:(.*?);/)[1];
                            const binStr = atob(b64);
                            const arr = new Uint8Array(binStr.length);
                            for (let i = 0; i < binStr.length; i++) arr[i] = binStr.charCodeAt(i);
                            z.croquisBlob = new Blob([arr], { type });
                            delete z.croquisBase64;
                        } catch (err) { console.error("Error procesando croquis", err); }
                    }
                    await database.put('zonas', z);
                }
            }
            console.log("[DB] ✅ Datos iniciales cargados.");
            window.dispatchEvent(new CustomEvent('fincaChanged'));
        } catch (e) { console.warn("[DB] Error datos iniciales", e); }
    }
}

async function migrateToMultiFinca(database) {
    const fincasCount = await database.count('fincas');
    if (fincasCount > 0) return;

    const config = await database.get('config', 'settings');
    const zonasCount = await database.count('zonas');

    // Si no hay configuración previa ni zonas, es una instalación nueva.
    // No creamos finca automática para permitir que el Wizard de Bienvenida actúe.
    if (!config && zonasCount === 0) {
        console.log("[Migration] Instalación limpia. El usuario creará su primera finca.");
        return;
    }

    console.log("[Migration] Migrando datos de versión anterior a arquitectura multi-finca...");

    const precios = await database.get('precios', 'precios') || { calidades: { primera: { precioQuintal: 80 }, bornizo: { precioQuintal: 45 }, refugo: { precioQuintal: 25 } } };

    // 1. Crear finca por defecto basada en configuración antigua
    const fincaId = await database.add('fincas', {
        nombre: config?.nombreFinca || 'Finca Principal',
        propietario: config?.nombreFinca === "El Chamorro" ? "Mª del Carmen Arteaga" : "",
        direccion: config?.nombreFinca === "El Chamorro" ? "Juan Ramón Jiménez 55, Arroyomolinos de León, Huelva" : "",
        unidadMedida: config?.nombreFinca === "El Chamorro" ? "quintal_castellano" : "manual",
        porcentajeOreo: 0,
        factorQuintal: config?.factorQuintal || 46,
        precios: precios.calidades,
        ultimaSaca: config?.ultimaSaca || 0,
        creadoEn: new Date().toISOString()
    });

    // 2. Asignar fincaId a todas las zonas existentes
    const zonas = await database.getAll('zonas');
    const zTx = database.transaction('zonas', 'readwrite');
    for (const z of zonas) {
        z.fincaId = fincaId;
        zTx.store.put(z);
    }
    await zTx.done;

    // 3. Asignar fincaId a todas las pesadas existentes
    const pesadas = await database.getAll('pesadas');
    const pTx = database.transaction('pesadas', 'readwrite');
    for (const p of pesadas) {
        p.fincaId = fincaId;
        pTx.store.put(p);
    }
    await pTx.done;

    localStorage.setItem('activeFincaId', fincaId);
    console.log("[Migration] Migración finalizada con éxito.");
}

window.dbPromise = initDB();

const db = {
    async get(store, key) { const d = await window.dbPromise; return d.get(store, key); },
    async getAll(store) { const d = await window.dbPromise; return d.getAll(store); },
    async getAllFromIndex(store, index, query) { const d = await window.dbPromise; return d.getAllFromIndex(store, index, query); },
    async add(store, val) { const d = await window.dbPromise; return d.add(store, val); },
    async put(store, val) { const d = await window.dbPromise; return d.put(store, val); },
    async delete(store, key) { const d = await window.dbPromise; return d.delete(store, key); },
    async clear(store) { const d = await window.dbPromise; return d.clear(store); },
    async count(store) { const d = await window.dbPromise; return d.count(store); },
    async clearAllData() {
        const d = await window.dbPromise;
        await d.clear('pesadas');
        await d.clear('zonas');
        await d.clear('fincas');
        await d.clear('config');
        await d.clear('precios');
        localStorage.removeItem('activeFincaId');
    }
};

window.db = db;
