/**
 * Precios.js - Sistema de Precios de Mercado (v5.9.3)
 * Gestión de precios con actualización automática y caché
 */

const Precios = {
    // APIs reales de precios (simuladas para demo)
    _apiSources: {
        'corktr': 'https://api.corktrading.com/prices',  // Cork Trading (ejemplo)
        'agromercado': 'https://api.agromercado.es/corcho/precios',  // Agro Mercado (ejemplo)
        'cex': 'https://api.corkexchange.com/market'  // Cork Exchange (ejemplo)
    },

    // Precios por defecto (base para simulación)
    _defaultPrices: {
        corcho_primera: { 
            precioBase: 80, 
            variacion: 0, 
            tendencia: 'estable',
            ultimaActualizacion: new Date().toISOString()
        },
        corcho_bornizo: { 
            precioBase: 45, 
            variacion: 0, 
            tendencia: 'estable',
            ultimaActualizacion: new Date().toISOString()
        },
        corcho_refugo: { 
            precioBase: 20, 
            variacion: 0, 
            tendencia: 'estable',
            ultimaActualizacion: new Date().toISOString()
        }
    },

    /**
     * Obtener precios actuales (con caché local)
     */
    async getPrices() {
        try {
            // Intentar obtener de IndexedDB
            const cached = await db.get('precios', 'mercado');
            if (cached && this._isRecentlyUpdated(cached.ultimaActualizacion)) {
                return cached.valores;
            }

            // Si no hay caché reciente, intentar actualizar desde API
            const prices = await this._fetchPricesFromAPI();
            
            // Guardar en caché
            await db.put('precios', {
                id: 'mercado',
                valores: prices,
                ultimaActualizacion: new Date().toISOString()
            });

            return prices;
        } catch (error) {
            console.warn('Error obteniendo precios de mercado, usando defaults:', error);
            return this._defaultPrices;
        }
    },

    /**
     * Obtener precio específico de una calidad
     */
    async getPriceForQuality(calidad) {
        const prices = await this.getPrices();
        const keys = {
            'primera': 'corcho_primera',
            'bornizo': 'corcho_bornizo',
            'refugo': 'corcho_refugo'
        };
        return prices[keys[calidad]] || this._defaultPrices[keys[calidad]];
    },

    /**
     * Actualizar precio manual (admin)
     */
    async updatePrice(calidad, precioBase, tendencia = 'estable') {
        try {
            const prices = await this.getPrices();
            const keys = {
                'primera': 'corcho_primera',
                'bornizo': 'corcho_bornizo',
                'refugo': 'corcho_refugo'
            };

            const key = keys[calidad];
            prices[key].precioBase = precioBase;
            prices[key].tendencia = tendencia;
            prices[key].ultimaActualizacion = new Date().toISOString();

            await db.put('precios', {
                id: 'mercado',
                valores: prices,
                ultimaActualizacion: new Date().toISOString()
            });

            return prices[key];
        } catch (error) {
            console.error('Error actualizando precios:', error);
            throw error;
        }
    },

    /**
     * Obtener histórico de precios (últimos 30 días)
     */
    async getPriceHistory() {
        try {
            const history = await db.get('precios', 'historico') || {
                id: 'historico',
                datos: []
            };
            return history.datos || [];
        } catch (error) {
            console.error('Error obteniendo histórico:', error);
            return [];
        }
    },

    /**
     * Registrar cambio de precio en histórico
     */
    async _recordPriceChange(calidad, precioAnterior, precioNuevo) {
        try {
            let history = await db.get('precios', 'historico') || {
                id: 'historico',
                datos: []
            };

            history.datos.push({
                fecha: new Date().toISOString(),
                calidad,
                precioAnterior,
                precioNuevo,
                cambio: ((precioNuevo - precioAnterior) / precioAnterior * 100).toFixed(2)
            });

            // Mantener solo últimos 365 registros
            if (history.datos.length > 365) {
                history.datos = history.datos.slice(-365);
            }

            await db.put('precios', history);
        } catch (error) {
            console.error('Error registrando histórico:', error);
        }
    },

    /**
     * Intentar obtener precios de API real (con fallback)
     */
    async _fetchPricesFromAPI() {
        // Intentar diferentes fuentes
        for (const [source, url] of Object.entries(this._apiSources)) {
            try {
                console.log(`[Precios] Intentando obtener de ${source}...`);
                const response = await Promise.race([
                    fetch(url, { timeout: 3000 }),
                    new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 3000))
                ]);

                if (response.ok) {
                    const data = await response.json();
                    console.log(`[Precios] ✅ Datos obtenidos de ${source}`);
                    return this._normalizePricesFromAPI(data, source);
                }
            } catch (error) {
                console.warn(`[Precios] ${source} no disponible:`, error.message);
                continue;
            }
        }

        // Si todas las APIs fallan, retornar precios con simulación de variación
        return this._getSimulatedPrices();
    },

    /**
     * Normalizar precios según la API
     */
    _normalizePricesFromAPI(data, source) {
        try {
            if (source === 'corktr') {
                return {
                    corcho_primera: {
                        precioBase: data.primera?.precio || this._defaultPrices.corcho_primera.precioBase,
                        variacion: data.primera?.variacion || 0,
                        tendencia: data.primera?.tendencia || 'estable',
                        ultimaActualizacion: new Date().toISOString()
                    },
                    corcho_bornizo: {
                        precioBase: data.bornizo?.precio || this._defaultPrices.corcho_bornizo.precioBase,
                        variacion: data.bornizo?.variacion || 0,
                        tendencia: data.bornizo?.tendencia || 'estable',
                        ultimaActualizacion: new Date().toISOString()
                    },
                    corcho_refugo: {
                        precioBase: data.refugo?.precio || this._defaultPrices.corcho_refugo.precioBase,
                        variacion: data.refugo?.variacion || 0,
                        tendencia: data.refugo?.tendencia || 'estable',
                        ultimaActualizacion: new Date().toISOString()
                    }
                };
            }
            return this._defaultPrices;
        } catch (error) {
            console.error('Error normalizando precios:', error);
            return this._defaultPrices;
        }
    },

    /**
     * Simular precios con variación realista (cuando APIs no están disponibles)
     */
    _getSimulatedPrices() {
        const simulateVariation = (base) => {
            // Variación aleatoria entre -5% y +5%
            const variacion = (Math.random() - 0.5) * 0.1;
            const precioNuevo = base * (1 + variacion);
            const tendencias = ['bajista', 'estable', 'alcista'];
            return {
                precioBase: parseFloat(precioNuevo.toFixed(2)),
                variacion: parseFloat((variacion * 100).toFixed(2)),
                tendencia: tendencias[Math.floor(Math.random() * tendencias.length)],
                ultimaActualizacion: new Date().toISOString()
            };
        };

        return {
            corcho_primera: simulateVariation(this._defaultPrices.corcho_primera.precioBase),
            corcho_bornizo: simulateVariation(this._defaultPrices.corcho_bornizo.precioBase),
            corcho_refugo: simulateVariation(this._defaultPrices.corcho_refugo.precioBase)
        };
    },

    /**
     * Verificar si el caché es reciente (menos de 6 horas)
     */
    _isRecentlyUpdated(timestamp) {
        const horasDesdeActualizacion = (Date.now() - new Date(timestamp).getTime()) / (1000 * 60 * 60);
        return horasDesdeActualizacion < 6;
    },

    /**
     * Forzar actualización de precios
     */
    async forceUpdate() {
        try {
            const prices = await this._fetchPricesFromAPI();
            await db.put('precios', {
                id: 'mercado',
                valores: prices,
                ultimaActualizacion: new Date().toISOString(),
                forzada: true
            });
            return prices;
        } catch (error) {
            console.error('Error forzando actualización:', error);
            throw error;
        }
    },

    /**
     * Obtener análisis de tendencias
     */
    async getTrendAnalysis() {
        try {
            const precios = await this.getPrices();
            const historico = await this.getPriceHistory();

            const analisis = {
                primera: {
                    actual: precios.corcho_primera.precioBase,
                    tendencia: precios.corcho_primera.tendencia,
                    variacionDia: precios.corcho_primera.variacion,
                    prediccion: this._predictNextPrice(historico, 'primera')
                },
                bornizo: {
                    actual: precios.corcho_bornizo.precioBase,
                    tendencia: precios.corcho_bornizo.tendencia,
                    variacionDia: precios.corcho_bornizo.variacion,
                    prediccion: this._predictNextPrice(historico, 'bornizo')
                },
                refugo: {
                    actual: precios.corcho_refugo.precioBase,
                    tendencia: precios.corcho_refugo.tendencia,
                    variacionDia: precios.corcho_refugo.variacion,
                    prediccion: this._predictNextPrice(historico, 'refugo')
                }
            };

            return analisis;
        } catch (error) {
            console.error('Error obteniendo análisis:', error);
            return null;
        }
    },

    /**
     * Predicción simple de próximo precio (media móvil)
     */
    _predictNextPrice(historico, calidad) {
        if (historico.length < 5) return null;

        // Últimos 5 precios
        const ultimos = historico
            .filter(h => h.calidad === calidad)
            .slice(-5)
            .map(h => h.precioNuevo);

        if (ultimos.length === 0) return null;

        const media = ultimos.reduce((a, b) => a + b, 0) / ultimos.length;
        const tendencia = ultimos[ultimos.length - 1] > media ? 'alcista' : 'bajista';

        return {
            valor: parseFloat(media.toFixed(2)),
            tendencia,
            confianza: 60  // % de confianza en la predicción
        };
    }
};

window.Precios = Precios;
