import { db, dbPromise } from './db.js';
import { Fincas } from './fincas.js';
import { Pesadas } from './pesadas.js';
import { Zonas } from './zonas.js';
import { Auth } from './auth.js';
import { Export } from './export.js';

/**
 * CloudSync.js - Sincronización Multi-Usuario con Google Drive
 */

export const CloudSync = {
    _config: {
        syncEnabled: JSON.parse(localStorage.getItem('cloudSync_enabled') || 'true'),
        autoSyncInterval: 5 * 60 * 1000,
        _lastSync: null,
        _syncInProgress: false,
        driveFileId: localStorage.getItem('cloudSync_driveFileId') || null
    },

    async init() {
        if (!this._config.syncEnabled) {
            await this.enableCloudSync();
        }
        if (this._config.syncEnabled) {
            console.log('[CloudSync] Inicializando sincronización con Google Drive...');
            this.startAutoSync();
        }
    },

    async enableCloudSync() {
        this._config.syncEnabled = true;
        localStorage.setItem('cloudSync_enabled', 'true');
        console.log('[CloudSync] ✅ Sincronización activada');
        this.startAutoSync();
        return true;
    },

    async disableCloudSync() {
        this._config.syncEnabled = false;
        this.stopAutoSync();
        localStorage.setItem('cloudSync_enabled', 'false');
        console.log('[CloudSync] Sincronización desactivada');
    },

    async syncNow() {
        if (this._config._syncInProgress) return;
        
        const currentUser = Auth.getCurrentUser();
        if (!currentUser || !currentUser.accessToken) {
            console.warn("[CloudSync] No hay token de Google Auth para sincronizar.");
            return;
        }

        this._config._syncInProgress = true;
        try {
            console.log('[CloudSync] Iniciando sincronización con Google Drive...');
            
            // 1. Encontrar o crear archivo en Drive
            let fileId = this._config.driveFileId;
            if (!fileId) {
                fileId = await this._findDriveFile(currentUser.accessToken);
            }

            // 2. Si existe, descargar y fusionar datos
            if (fileId) {
                console.log('[CloudSync] Descargando backup desde Drive...');
                const cloudData = await this._downloadDriveFile(fileId, currentUser.accessToken);
                if (cloudData) {
                    await this._mergeCloudData(cloudData);
                }
            }

            // 3. Generar backup local actualizado (con los datos recién fusionados)
            console.log('[CloudSync] Generando JSON local...');
            const localBackupBlob = await Export.generateBackupBlob();
            
            // 4. Subir a Drive
            if (fileId) {
                await this._updateDriveFile(fileId, localBackupBlob, currentUser.accessToken);
            } else {
                fileId = await this._createDriveFile(localBackupBlob, currentUser.accessToken);
                this._config.driveFileId = fileId;
                localStorage.setItem('cloudSync_driveFileId', fileId);
            }

            this._config._lastSync = new Date().toISOString();
            localStorage.setItem('cloudSync_lastSync', this._config._lastSync);
            console.log('[CloudSync] ✅ Sincronización completada con éxito.');
        } catch (error) {
            console.error('[CloudSync] Error en sincronización:', error);
            if (error.status === 401) {
                console.warn("[CloudSync] Token expirado, forzando relogin...");
            }
            throw error;
        } finally {
            this._config._syncInProgress = false;
        }
    },

    async _findDriveFile(accessToken) {
        const query = encodeURIComponent("name = 'cork_manager_sync.json' and trashed = false");
        const res = await fetch(`https://www.googleapis.com/drive/v3/files?q=${query}&spaces=drive`, {
            headers: { Authorization: `Bearer ${accessToken}` }
        });
        if (!res.ok) {
            let errorMsg = "Fallo buscando archivo en Drive";
            try { const errObj = await res.json(); errorMsg = errObj.error.message; } catch(e){}
            throw new Error(errorMsg);
        }
        const data = await res.json();
        if (data.files && data.files.length > 0) {
            return data.files[0].id;
        }
        return null;
    },

    async _downloadDriveFile(fileId, accessToken) {
        const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
            headers: { Authorization: `Bearer ${accessToken}` }
        });
        if (!res.ok) return null;
        try {
            return await res.json();
        } catch (e) {
            console.warn('[CloudSync] Archivo en Drive no es JSON válido (puede estar corrupto o vacío). Se sobrescribirá.');
            return null;
        }
    },

    async _createDriveFile(blob, accessToken) {
        const metadata = {
            name: 'cork_manager_sync.json',
            mimeType: 'application/json'
        };
        const form = new FormData();
        form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
        form.append('file', blob);

        const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
            method: 'POST',
            headers: { Authorization: `Bearer ${accessToken}` },
            body: form
        });
        if (!res.ok) {
            let errorMsg = "Fallo creando archivo";
            try { const errObj = await res.json(); errorMsg = errObj.error.message || errObj.error; } catch(e){}
            throw new Error(errorMsg);
        }
        const data = await res.json();
        return data.id;
    },

    async _updateDriveFile(fileId, blob, accessToken) {
        const res = await fetch(`https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`, {
            method: 'PATCH',
            headers: { 
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: blob
        });
        if (!res.ok) {
            if (res.status === 404) {
                // File deleted from drive, clear local cache so next sync recreates it
                localStorage.removeItem('cloudSync_driveFileId');
                this._config.driveFileId = null;
                throw new Error("El archivo fue borrado de Google Drive. Se recreará en la próxima sincronización.");
            }
            let errorMsg = "Fallo actualizando archivo";
            try { const errObj = await res.json(); errorMsg = errObj.error.message || errObj.error; } catch(e){}
            throw new Error(errorMsg);
        }
    },

    async _mergeCloudData(cloudData) {
        if (!cloudData || !cloudData.fincas) return;
        const currentUser = Auth.getCurrentUser();
        
        for (const fData of cloudData.fincas) {
            const fInfo = fData.info;
            if (!fInfo || !fInfo.id) continue;
            
            const extFinca = await db.get('fincas', Number(fInfo.id));
            if (!extFinca) await db.add('fincas', fInfo);
            
            if (fData.zonas) {
                for (const z of fData.zonas) {
                    if (!z.id) continue;
                    const extZ = await db.get('zonas', Number(z.id));
                    if (!extZ) await db.add('zonas', z);
                }
            }
            if (fData.pesadas) {
                for (const p of fData.pesadas) {
                    if (!p.id) continue;
                    const extP = await db.get('pesadas', Number(p.id));
                    if (!extP) {
                        if (!p.creadoPor && currentUser) p.creadoPor = currentUser.id;
                        await db.add('pesadas', p);
                    }
                }
            }
            if (fData.gastos) {
                for (const g of fData.gastos) {
                    if (!g.id) continue;
                    const extG = await db.get('gastos', Number(g.id));
                    if (!extG) await db.add('gastos', g);
                }
            }
        }
    },

    startAutoSync() {
        if (this._syncInterval) clearInterval(this._syncInterval);
        
        // Ejecutar inmediatamente
        if (this._config.syncEnabled) {
            this.syncNow().catch(e => {
                console.error('[CloudSync] Error en sync inicial:', e);
                if (window.App) window.App.toastError("Sync Error: " + (e.message || "Drive API"));
            });
        }

        // Configurar intervalo
        this._syncInterval = setInterval(() => {
            if (this._config.syncEnabled) {
                this.syncNow().catch(e => console.error('[CloudSync] Error en auto-sync:', e));
            }
        }, this._config.autoSyncInterval);
        console.log('[CloudSync] Auto-Sync activado');
    },

    stopAutoSync() {
        if (this._syncInterval) clearInterval(this._syncInterval);
        this._syncInterval = null;
    },

    getStatus() {
        return {
            enabled: this._config.syncEnabled,
            connected: !!Auth.getCurrentUser()?.accessToken,
            lastSync: this._config._lastSync,
            inProgress: this._config._syncInProgress
        };
    }
};
