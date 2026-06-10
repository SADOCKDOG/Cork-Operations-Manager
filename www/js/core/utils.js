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
    toast(msg) { const container = document.getElementById('toast-container'); const t = document.createElement('div'); t.className = 'toast'; t.textContent = msg; container.appendChild(t); setTimeout(() => t.remove(), 3000); },
    toastError(msg) { const container = document.getElementById('toast-container'); const t = document.createElement('div'); t.className = 'toast error'; t.textContent = `❌ ${msg}`; container.appendChild(t); setTimeout(() => t.remove(), 4000); },
    
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
    }
};
