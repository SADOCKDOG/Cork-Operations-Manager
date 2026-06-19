const PRODUCT_ID = 'cork_manager_premium';
const PREMIUM_KEY = 'cork_premium_unlocked';

let storeRef = null;
let initStarted = false;
let setupStarted = false;

function getStore() {
    if (storeRef) return storeRef;

    storeRef = window.CdvPurchase?.store || window.store || null;
    return storeRef;
}

function emitChange(unlocked) {
    window.dispatchEvent(new CustomEvent('cork:premium-changed', {
        detail: { unlocked }
    }));
}

function setPremiumUnlocked(unlocked) {
    if (unlocked) localStorage.setItem(PREMIUM_KEY, 'true');
    else localStorage.removeItem(PREMIUM_KEY);
    emitChange(unlocked);
}

export const Billing = {
    productId: PRODUCT_ID,

    isAvailable() {
        return !!getStore();
    },

    isPremiumUnlocked() {
        return localStorage.getItem(PREMIUM_KEY) === 'true';
    },

    async init() {
        if (initStarted) return;
        initStarted = true;

        const setup = async () => {
            const store = getStore();
            if (!store) return;
            if (setupStarted) return;
            setupStarted = true;

            try {
                if (store.register) {
                    store.register([{
                        id: PRODUCT_ID,
                        type: store.NON_CONSUMABLE
                    }]);
                }

                if (store.when) {
                    store.when(PRODUCT_ID).approved((purchase) => {
                        if (purchase?.finish) purchase.finish();
                        setPremiumUnlocked(true);
                    });
                }

                if (store.error) {
                    store.error((error) => {
                        console.error('[Billing] Store error:', error);
                    });
                }

                if (store.refresh) {
                    await store.refresh();
                }

                const product = store.get ? store.get(PRODUCT_ID) : null;
                if (product?.owned) {
                    setPremiumUnlocked(true);
                }
            } catch (error) {
                console.error('[Billing] Init failed:', error);
            }
        };

        if (window.cordova || window.CdvPurchase || window.store) {
            if (document.readyState === 'complete' || document.readyState === 'interactive') {
                Promise.resolve().then(setup);
            }
            document.addEventListener('deviceready', setup, { once: true });
        }
    },

    async refresh() {
        const store = getStore();
        if (!store || !store.refresh) return;
        await store.refresh();
        const product = store.get ? store.get(PRODUCT_ID) : null;
        if (product?.owned) setPremiumUnlocked(true);
    },

    async purchasePremium() {
        const store = getStore();
        if (!store) throw new Error('Las compras integradas solo están disponibles en Android.');

        const product = store.get ? store.get(PRODUCT_ID) : null;
        if (!product) await this.refresh();

        const loadedProduct = store.get ? store.get(PRODUCT_ID) : null;
        if (!loadedProduct) throw new Error('El producto premium no está disponible en este momento.');
        if (store.order) {
            await store.order(PRODUCT_ID);
            return;
        }
        if (!loadedProduct.order) throw new Error('El motor de compra no está disponible.');
        await loadedProduct.order();
    },

    async restorePurchases() {
        const store = getStore();
        if (!store) throw new Error('Las compras integradas solo están disponibles en Android.');
        if (!store.restore) throw new Error('La restauración de compras no está disponible.');

        await store.restore();
        await this.refresh();
    },

    unlockLocally() {
        setPremiumUnlocked(true);
    },

    lockLocally() {
        setPremiumUnlocked(false);
    }
};
