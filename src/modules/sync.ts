import { db } from './db';
import { Drive } from './drive';
import { Auth } from './auth';

class SyncManager {
    private _syncing = false;

    async sync() {
        if (this._syncing) return;
        this._syncing = true;
        console.log('[Sync] Iniciando sincronización...');

        try {
            // 1. Asegurar Login en Drive
            await Drive.login();

            // 2. Descargar datos de la nube
            const fileId = await Drive.findSyncFile();
            let cloudData: any = { fincas: [], zonas: [], pesadas: [], gastos: [] };

            if (fileId) {
                cloudData = await Drive.downloadFile(fileId);
            }

            // 3. Fusionar Tablas
            await this._mergeTable('fincas', cloudData.fincas || []);
            await this._mergeTable('zonas', cloudData.zonas || []);
            await this._mergeTable('pesadas', cloudData.pesadas || []);
            await this._mergeTable('gastos', cloudData.gastos || []);

            // 4. Obtener estado final local para subir
            const finalData = {
                fincas: await db.getAllRaw('fincas'),
                zonas: await db.getAllRaw('zonas'),
                pesadas: await db.getAllRaw('pesadas'),
                gastos: await db.getAllRaw('gastos'),
                syncedBy: Auth.getCurrentUser()?.nombre,
                syncedAt: new Date().toISOString()
            };

            // 5. Subir a la nube
            await Drive.uploadFile(finalData);

            console.log('[Sync] ✅ Sincronización finalizada con éxito');
            localStorage.setItem('lastSyncAt', new Date().toISOString());
            window.dispatchEvent(new CustomEvent('syncCompleted'));

            return true;
        } catch (error) {
            console.error('[Sync] Error:', error);
            throw error;
        } finally {
            this._syncing = false;
        }
    }

    private async _mergeTable(storeName: string, cloudRecords: any[]) {
        for (const cloudItem of cloudRecords) {
            const localItem = await db.getAllRaw(storeName).then(list => list.find((l: any) => l.id === cloudItem.id));

            if (!localItem) {
                // No existe localmente, lo guardamos tal cual (incluyendo si viene borrado)
                await db.hardPut(storeName, cloudItem);
            } else {
                // Existe en ambos, comparar fecha de actualización
                const cloudDate = new Date(cloudItem.updatedAt).getTime();
                const localDate = new Date(localItem.updatedAt).getTime();

                if (cloudDate > localDate) {
                    // La nube es más reciente, sobreescribir local
                    await db.hardPut(storeName, cloudItem);
                }
            }
        }
    }
}

export const Sync = new SyncManager();
export default Sync;
