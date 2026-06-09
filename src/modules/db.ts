import { openDB, IDBPDatabase } from 'idb';
import { v4 as uuidv4 } from 'uuid';

const BASE_DB_NAME = 'CorchoDB';
const DB_VERSION = 8;

export interface BaseRecord {
    id: string;
    updatedAt: string;
    deleted?: boolean;
    _cloudSynced?: string;
}

export interface Finca extends BaseRecord {
    nombre: string;
    propietario?: string;
    direccion?: string;
    unidadMedida?: string;
    porcentajeOreo?: number;
    factorQuintal: number;
    precios: any;
    ultimaSaca: number;
    creadoEn: string;
}

export interface Zona extends BaseRecord {
    fincaId: string;
    nombre: string;
    poligono?: string;
    parcela?: string;
    refCatastral?: string;
    croquisBlob?: Blob;
}

export interface Pesada extends BaseRecord {
    fincaId: string;
    zonaId: string;
    fecha: string;
    usuarioId?: string;
    kilogramos: number;
    calidad: 'primera' | 'bornizo' | 'refugo';
    observaciones?: string;
    saca?: number;
    pesadasPorCalidad?: any;
    kg?: number;
    quintales?: number;
}

export interface Gasto extends BaseRecord {
    fincaId: string;
    fecha: string;
    concepto: string;
    importe: number;
    categoria: string;
    monto?: number;
}

let dbInstance: IDBPDatabase | null = null;

export async function initDB(userId: string = 'default') {
    const dbName = `${BASE_DB_NAME}_${userId}`;
    dbInstance = await openDB(dbName, DB_VERSION, {
        upgrade(db, oldVersion, newVersion, transaction) {
            console.log(`[DB] Upgrading ${dbName} v${oldVersion} to v${newVersion}`);

            if (oldVersion < 2) {
                if (db.objectStoreNames.contains('zonas')) db.deleteObjectStore('zonas');
                const zoneStore = db.createObjectStore('zonas', { keyPath: 'id' });
                zoneStore.createIndex('refCatastral', 'refCatastral');
                zoneStore.createIndex('poligono', 'poligono');
                zoneStore.createIndex('parcela', 'parcela');
            }

            if (!db.objectStoreNames.contains('pesadas')) {
                const pesadaStore = db.createObjectStore('pesadas', { keyPath: 'id' });
                pesadaStore.createIndex('fecha', 'fecha');
                pesadaStore.createIndex('zonaId', 'zonaId');
                pesadaStore.createIndex('fincaId', 'fincaId');
            }

            if (!db.objectStoreNames.contains('config')) {
                db.createObjectStore('config', { keyPath: 'id' });
            }

            if (oldVersion < 3) {
                if (!db.objectStoreNames.contains('precios')) db.createObjectStore('precios', { keyPath: 'id' });
            }

            if (oldVersion < 5) {
                if (!db.objectStoreNames.contains('fincas')) {
                    db.createObjectStore('fincas', { keyPath: 'id' });
                }

                const zoneStore = transaction.objectStore('zonas');
                if (!zoneStore.indexNames.contains('fincaId')) {
                    zoneStore.createIndex('fincaId', 'fincaId');
                }
            }

            if (oldVersion < 7) {
                if (!db.objectStoreNames.contains('gastos')) {
                    const gastoStore = db.createObjectStore('gastos', { keyPath: 'id' });
                    gastoStore.createIndex('fincaId', 'fincaId');
                    gastoStore.createIndex('fecha', 'fecha');
                }
            }

            if (!db.objectStoreNames.contains('usuarios')) {
                db.createObjectStore('usuarios', { keyPath: 'id' });
            }
            if (!db.objectStoreNames.contains('auditlog')) {
                db.createObjectStore('auditlog', { keyPath: 'timestamp' });
            }
        },
    });

    return dbInstance;
}

export const db = {
    async get(store: string, key: string) {
        if (!dbInstance) await initDB();
        const res = await dbInstance!.get(store, key);
        if (res && res.deleted) return undefined;
        return res;
    },
    async getAll(store: string) {
        if (!dbInstance) await initDB();
        const all = await dbInstance!.getAll(store);
        return all.filter((item: any) => !item.deleted);
    },
    async getAllDeleted(store: string) {
        if (!dbInstance) await initDB();
        const all = await dbInstance!.getAll(store);
        return all.filter((item: any) => item.deleted);
    },
    async getAllRaw(store: string) {
        if (!dbInstance) await initDB();
        return dbInstance!.getAll(store);
    },
    async getAllFromIndex(store: string, index: string, query: any) {
        if (!dbInstance) await initDB();
        const all = await dbInstance!.getAllFromIndex(store, index, query);
        return all.filter((item: any) => !item.deleted);
    },
    async add(store: string, val: any): Promise<string> {
        if (!dbInstance) await initDB();
        if (!val.id) val.id = uuidv4();
        val.updatedAt = new Date().toISOString();
        const res = await dbInstance!.add(store, val);
        return res as string;
    },
    async put(store: string, val: any): Promise<string> {
        if (!dbInstance) await initDB();
        if (!val.id) val.id = uuidv4();
        val.updatedAt = new Date().toISOString();
        const res = await dbInstance!.put(store, val);
        return res as string;
    },
    async hardPut(store: string, val: any): Promise<string> {
        if (!dbInstance) await initDB();
        const res = await dbInstance!.put(store, val);
        return res as string;
    },
    async delete(store: string, key: string) {
        if (!dbInstance) await initDB();
        const item = await dbInstance!.get(store, key);
        if (item) {
            item.deleted = true;
            item.updatedAt = new Date().toISOString();
            return dbInstance!.put(store, item);
        }
    },
    async hardDelete(store: string, key: string) {
        if (!dbInstance) await initDB();
        return dbInstance!.delete(store, key);
    },
    async clear(store: string) {
        if (!dbInstance) await initDB();
        return dbInstance!.clear(store);
    },
    async count(store: string) {
        if (!dbInstance) await initDB();
        return dbInstance!.count(store);
    }
};

export async function migrateLegacyData() {
    const legacyDBName = 'CorchoDB';
    try {
        const legacyDB = await openDB(legacyDBName, 7);
        console.log("[Migration] Detectada base de datos antigua. Migrando...");

        const stores = ['fincas', 'zonas', 'pesadas', 'gastos'];
        for (const store of stores) {
            const data = await legacyDB.getAll(store);
            for (const item of data) {
                const oldId = item.id;
                if (typeof oldId === 'number') {
                    item.id = uuidv4();
                    if (store === 'zonas') {
                        const allPesadas = await legacyDB.getAll('pesadas');
                        for (const p of allPesadas) {
                            if (p.zonaId === oldId) p.zonaId = item.id;
                        }
                    }
                }
                if (!item.updatedAt) item.updatedAt = new Date().toISOString();
                await db.put(store, item);
            }
        }
        console.log("[Migration] Migración completada con éxito.");
    } catch (e) {
        // console.log("[Migration] No se detectó base de datos antigua o ya migrada.");
    }
}
