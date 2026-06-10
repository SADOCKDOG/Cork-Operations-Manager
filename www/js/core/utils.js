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
    toastError(msg) { const container = document.getElementById('toast-container'); const t = document.createElement('div'); t.className = 'toast error'; t.textContent = `❌ ${msg}`; container.appendChild(t); setTimeout(() => t.remove(), 4000); }
};
