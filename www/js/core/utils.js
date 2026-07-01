export const Utils = {
    escapeHtml(unsafe) {
        if (unsafe == null) return '';
        return String(unsafe)
             .replace(/&/g, "&amp;")
             .replace(/</g, "&lt;")
             .replace(/>/g, "&gt;")
             .replace(/"/g, "&quot;")
             .replace(/'/g, "&#039;");
    },
    toast(msg) { const container = document.getElementById('toast-container'); const t = document.createElement('div'); t.className = 'toast animate-in'; t.textContent = msg; container.appendChild(t); setTimeout(() => { t.style.opacity = '0'; t.style.transform = 'translateX(-50%) translateY(20px)'; t.style.transition = 'all 0.3s ease'; setTimeout(() => t.remove(), 300); }, 3000); },
    toastError(msg) { const container = document.getElementById('toast-container'); const t = document.createElement('div'); t.className = 'toast error animate-in'; t.textContent = msg; container.appendChild(t); setTimeout(() => { t.style.opacity = '0'; t.style.transform = 'translateX(-50%) translateY(20px)'; t.style.transition = 'all 0.3s ease'; setTimeout(() => t.remove(), 300); }, 4000); },
    
    showLoading(msg = 'Cargando...') {
        let loader = document.getElementById('global-loader');
        if (!loader) {
            loader = document.createElement('div');
            loader.id = 'global-loader';
            loader.style.cssText = 'position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.7); z-index:9999; display:flex; flex-direction:column; justify-content:center; align-items:center; color:white;';
            const spinner = document.createElement('div');
            spinner.className = 'loader'; // Existing CSS class
            spinner.style.marginBottom = '15px';
            const text = document.createElement('div');
            text.id = 'global-loader-text';
            text.style.fontSize = '1.2rem';
            text.style.fontWeight = 'bold';
            loader.appendChild(spinner);
            loader.appendChild(text);
            document.body.appendChild(loader);
        }
        document.getElementById('global-loader-text').textContent = msg;
        loader.style.display = 'flex';
    },

    hideLoading() {
        const loader = document.getElementById('global-loader');
        if (loader) loader.style.display = 'none';
    },

    _getDualHeaderHtml(t1, s1, c1, t2, s2, c2) {
        return `
            <div class="reporte-header">
                <div class="entity-card">
                    <div class="entity-title">${this.escapeHtml(t1)}</div>
                    <div class="entity-sub">${this.escapeHtml(s1)}</div>
                    <div class="entity-meta">CIF/NIF: ${this.escapeHtml(c1)}</div>
                </div>
                <div class="entity-card">
                    <div class="entity-title">${this.escapeHtml(t2)}</div>
                    <div class="entity-sub">${this.escapeHtml(s2)}</div>
                    <div class="entity-meta">CIF/NIF: ${this.escapeHtml(c2)}</div>
                </div>
            </div>`;
    },

    confirmDialog({ title, message, icon='', confirmText = 'Confirmar', cancelText = 'Cancelar', variant = 'danger' }) {
        return new Promise((resolve) => {
            const overlay = document.createElement('div');
            overlay.className = 'confirm-overlay';
            overlay.innerHTML = `
                <div class="confirm-dialog">
                    <div class="confirm-icon">${icon || `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`}</div>
                    <h3>${this.escapeHtml(title)}</h3>
                    <p>${this.escapeHtml(message)}</p>
                    <div class="confirm-actions">
                        <button class="btn-cancel">${cancelText}</button>
                        <button class="btn-confirm ${variant}">${confirmText}</button>
                    </div>
                </div>`;
            document.body.appendChild(overlay);

            overlay.querySelector('.btn-cancel').onclick = () => { overlay.remove(); resolve(false); };
            overlay.querySelector('.btn-confirm').onclick = () => { overlay.remove(); resolve(true); };
            overlay.addEventListener('click', (e) => { if (e.target === overlay) { overlay.remove(); resolve(false); } });
        });
    },

    vibrate(pattern = 10) {
        if (navigator.vibrate) navigator.vibrate(pattern);
    },

    renderEmptyState({ icon = '', title = 'Sin datos', message = 'No hay elementos para mostrar.', actionText = null, actionRoute = null }) {
        let actionHtml = '';
        if (actionText && actionRoute) {
            actionHtml = `<button class="btn btn-primary" data-route="${actionRoute}">${actionText}</button>`;
        } else if (actionText) {
            actionHtml = `<button class="btn btn-primary" onclick="window.location.hash='#/nueva'">${actionText}</button>`;
        }
        return `
            <div class="empty-state animate-in">
                <div class="empty-state-icon">${icon || `<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="opacity:0.5"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path><polyline points="13 2 13 9 20 9"></polyline></svg>`}</div>
                <h3>${this.escapeHtml(title)}</h3>
                <p>${this.escapeHtml(message)}</p>
                ${actionHtml}
            </div>`;
    },

    renderSkeletonDashboard() {
        return `
            <div class="bento-grid" style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin-bottom: 24px;">
                <div class="card skeleton" style="grid-column: span 2; height: 160px; margin-bottom: 0;"></div>
                <div class="card skeleton" style="grid-column: span 2; height: 160px; margin-bottom: 0;"></div>
                <div class="card skeleton" style="height: 100px; margin-bottom: 0;"></div>
                <div class="card skeleton" style="height: 100px; margin-bottom: 0;"></div>
                <div class="card skeleton" style="height: 100px; margin-bottom: 0;"></div>
                <div class="card skeleton" style="height: 100px; margin-bottom: 0;"></div>
            </div>`;
    },

    renderSkeletonList() {
        let h = `<div class="card" style="border-top:5px solid var(--p-cork); padding:25px;"><div class="skeleton skeleton-heading" style="margin:0 auto 20px;"></div><div class="skeleton-grid"><div class="skeleton skeleton-cell"></div><div class="skeleton skeleton-cell"></div><div class="skeleton skeleton-cell"></div></div><div class="skeleton skeleton-value" style="margin:0 auto;"></div></div>`;
        for (let i = 0; i < 4; i++) {
            h += `<div class="skeleton skeleton-card"></div>`;
        }
        return h;
    }
};
