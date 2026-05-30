/**
 * CloudSync.js - Sincronización con servidor remoto (v5.9.3)
 * Mantiene datos sincronizados entre dispositivos usando un backend remoto
 * NOTA: Requiere backend. Incluye simulación para desarrollo.
 */

const CloudSync = {
    _config: {
        backendUrl: localStorage.getItem('cloudSync_backendUrl') || 'https://api.pesadas-corcho.app',
        userId: localStorage.getItem('cloudSync_userId') || null,
        apiKey: localStorage.getItem('cloudSync_apiKey') || null,
        syncEnabled: JSON.parse(localStorage.getItem('cloudSync_enabled') || 'false'),
        autoSyncInterval: 5 * 60 * 1000,  // 5 minutos
        _lastSync: null,
        _syncInProgress: false
    },

    /**
     * Inicializar sincronización
     */
    async init() {
        if (this._config.syncEnabled && this._config.userId && this._config.apiKey) {
            console.log('[CloudSync] Inicializando sincronización automática...');
            this.startAutoSync();
            await this.validateConnection();
        }
    },

    /**
     * Validar conexión con servidor
     */
    async validateConnection() {
        try {
            const response = await fetch(`${this._config.backendUrl}/api/health`, {
                headers: {
                    'Authorization': `Bearer ${this._config.apiKey}`,
                    'User-ID': this._config.userId
                },
                timeout: 3000
            });

            if (response.ok) {
                console.log('[CloudSync] ✅ Conexión con servidor establecida');
                return true;
            }
        } catch (error) {
            console.warn('[CloudSync] No se pudo conectar con el servidor:', error.message);
            return false;
        }
    },

    /**
     * Activar sincronización cloud
     */
    async enableCloudSync(backendUrl, userId, apiKey) {
        try {
            // Validar credenciales
            const response = await fetch(`${backendUrl}/api/auth/validate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`,
                    'User-ID': userId
                },
                body: JSON.stringify({ userId, apiKey })
            });

            if (!response.ok) {
                throw new Error('Credenciales inválidas');
            }

            // Guardar configuración
            this._config.backendUrl = backendUrl;
            this._config.userId = userId;
            this._config.apiKey = apiKey;
            this._config.syncEnabled = true;

            localStorage.setItem('cloudSync_backendUrl', backendUrl);
            localStorage.setItem('cloudSync_userId', userId);
            localStorage.setItem('cloudSync_apiKey', apiKey);
            localStorage.setItem('cloudSync_enabled', 'true');

            console.log('[CloudSync] ✅ Sincronización activada');
            this.startAutoSync();
            return true;
        } catch (error) {
            console.error('[CloudSync] Error activando sincronización:', error);
            throw error;
        }
    },

    /**
     * Desactivar sincronización
     */
    async disableCloudSync() {
        this._config.syncEnabled = false;
        this.stopAutoSync();
        
        localStorage.setItem('cloudSync_enabled', 'false');
        console.log('[CloudSync] Sincronización desactivada');
    },

    /**
     * Sincronización manual
     */
    async syncNow() {
        if (this._config._syncInProgress) {
            console.warn('[CloudSync] Sincronización ya en progreso');
            return;
        }

        this._config._syncInProgress = true;
        try {
            const fincas = await Fincas.list();
            let synced = { fincas: 0, zonas: 0, pesadas: 0 };

            for (const finca of fincas) {
                // Sincronizar finca
                await this._syncFinca(finca);
                synced.fincas++;

                // Sincronizar zonas
                const zonas = await db.getAllFromIndex('zonas', 'fincaId', finca.id);
                for (const zona of zonas) {
                    await this._syncZona(zona, finca.id);
                }
                synced.zonas += zonas.length;

                // Sincronizar pesadas
                const pesadas = await db.getAllFromIndex('pesadas', 'fincaId', finca.id);
                for (const pesada of pesadas) {
                    await this._syncPesada(pesada, finca.id);
                }
                synced.pesadas += pesadas.length;
            }

            this._config._lastSync = new Date().toISOString();
            localStorage.setItem('cloudSync_lastSync', this._config._lastSync);

            console.log('[CloudSync] ✅ Sincronización completada:', synced);
            return synced;
        } catch (error) {
            console.error('[CloudSync] Error en sincronización:', error);
            throw error;
        } finally {
            this._config._syncInProgress = false;
        }
    },

    /**
     * Sincronizar finca individual
     */
    async _syncFinca(finca) {
        try {
            const response = await fetch(`${this._config.backendUrl}/api/fincas/${finca.id}`, {
                method: 'PUT',
                headers: this._getHeaders(),
                body: JSON.stringify(finca)
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            // Marcar como sincronizado
            finca._cloudSynced = new Date().toISOString();
            await db.put('fincas', finca);
        } catch (error) {
            console.warn(`[CloudSync] Error sincronizando finca ${finca.id}:`, error);
        }
    },

    /**
     * Sincronizar zona individual
     */
    async _syncZona(zona, fincaId) {
        try {
            // Serializar blob
            let zonaData = { ...zona };
            if (zonaData.croquisBlob instanceof Blob) {
                zonaData.croquisBase64 = await this._blobToBase64(zonaData.croquisBlob);
                delete zonaData.croquisBlob;
            }

            const response = await fetch(`${this._config.backendUrl}/api/fincas/${fincaId}/zonas/${zona.id}`, {
                method: 'PUT',
                headers: this._getHeaders(),
                body: JSON.stringify(zonaData)
            });

            if (response.ok) {
                zona._cloudSynced = new Date().toISOString();
                await db.put('zonas', zona);
            }
        } catch (error) {
            console.warn(`[CloudSync] Error sincronizando zona ${zona.id}:`, error);
        }
    },

    /**
     * Sincronizar pesada individual
     */
    async _syncPesada(pesada, fincaId) {
        try {
            const response = await fetch(`${this._config.backendUrl}/api/fincas/${fincaId}/pesadas/${pesada.id}`, {
                method: 'PUT',
                headers: this._getHeaders(),
                body: JSON.stringify(pesada)
            });

            if (response.ok) {
                pesada._cloudSynced = new Date().toISOString();
                await db.put('pesadas', pesada);
            }
        } catch (error) {
            console.warn(`[CloudSync] Error sincronizando pesada ${pesada.id}:`, error);
        }
    },

    /**
     * Descargar datos desde cloud
     */
    async pullFromCloud() {
        try {
            console.log('[CloudSync] Descargando datos desde cloud...');
            const response = await fetch(`${this._config.backendUrl}/api/sync/pull`, {
                headers: this._getHeaders()
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const data = await response.json();
            let imported = { fincas: 0, zonas: 0, pesadas: 0 };

            // Importar fincas
            if (data.fincas) {
                for (const finca of data.fincas) {
                    const existing = await Fincas.get(finca.id);
                    if (!existing) {
                        await Fincas.save(finca);
                        imported.fincas++;
                    }
                }
            }

            // Importar zonas
            if (data.zonas) {
                for (const zona of data.zonas) {
                    const existing = await Zonas.get(zona.id);
                    if (!existing) {
                        if (zona.croquisBase64) {
                            zona.croquisBlob = this._base64ToBlob(zona.croquisBase64);
                            delete zona.croquisBase64;
                        }
                        await Zonas.save(zona);
                        imported.zonas++;
                    }
                }
            }

            // Importar pesadas
            if (data.pesadas) {
                for (const pesada of data.pesadas) {
                    const existing = await Pesadas.get(pesada.id);
                    if (!existing) {
                        await db.add('pesadas', pesada);
                        imported.pesadas++;
                    }
                }
            }

            console.log('[CloudSync] ✅ Datos descargados:', imported);
            return imported;
        } catch (error) {
            console.error('[CloudSync] Error descargando datos:', error);
            throw error;
        }
    },

    /**
     * Iniciar sincronización automática
     */
    startAutoSync() {
        if (this._syncInterval) clearInterval(this._syncInterval);

        this._syncInterval = setInterval(async () => {
            if (this._config.syncEnabled) {
                try {
                    await this.syncNow();
                } catch (error) {
                    console.warn('[CloudSync] Error en sincronización automática:', error);
                }
            }
        }, this._config.autoSyncInterval);

        console.log('[CloudSync] Sincronización automática iniciada');
    },

    /**
     * Detener sincronización automática
     */
    stopAutoSync() {
        if (this._syncInterval) {
            clearInterval(this._syncInterval);
            this._syncInterval = null;
        }
    },

    /**
     * Obtener estado de sincronización
     */
    getStatus() {
        return {
            enabled: this._config.syncEnabled,
            connected: this._config.userId && this._config.apiKey,
            lastSync: this._config._lastSync,
            inProgress: this._config._syncInProgress,
            backendUrl: this._config.backendUrl
        };
    },

    /**
     * Helpers privados
     */
    _getHeaders() {
        return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this._config.apiKey}`,
            'User-ID': this._config.userId,
            'X-Client-Version': '5.9.3'
        };
    },

    _blobToBase64(blob) {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.readAsDataURL(blob);
        });
    },

    _base64ToBlob(base64) {
        const [header, data] = base64.split(',');
        const type = header.match(/:(.*?);/)?.[1] || 'application/octet-stream';
        const binStr = atob(data);
        const arr = new Uint8Array(binStr.length);
        for (let i = 0; i < binStr.length; i++) arr[i] = binStr.charCodeAt(i);
        return new Blob([arr], { type });
    }
};

window.CloudSync = CloudSync;
