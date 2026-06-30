import { Gastos } from '../gastos.js';
import { Fincas } from '../fincas.js';
import { App } from '../app.js';
import { Utils } from '../core/utils.js';

export const GastosUI = {
    async renderGastosManager() {
        const main = document.getElementById('app-content'), gastos = await Gastos.list(), total = await Gastos.getTotal();
        main.innerHTML = `<div class="card"><div style="display:flex; justify-content:space-between; align-items:center;"><h3>Control Gastos</h3><div style="font-weight:800; color:#ff4d4d; font-size:1.2rem;">Total: ${total.toFixed(2)}€</div></div><button class="btn btn-primary mt-1" data-action="App._showGastoForm">➕ Añadir Gasto</button></div><div class="lista-detallada">${gastos.length ? gastos.map(g => `<div class="list-item-detallado" data-action="App._showGastoForm" data-id="${g.id}"><div><strong>${App.escapeHtml(g.concepto || 'Sin concepto')}</strong><br><small class="text-muted">${App.escapeHtml(g.categoria)} | ${new Date(g.fecha).toLocaleDateString()}</small></div><div style="text-align:right;"><strong style="color:#ff4d4d;">-${parseFloat(g.monto).toFixed(2)}€</strong></div></div>`).join('') : '<p class="text-center text-muted">No hay gastos registrados.</p>'}</div><button class="btn btn-outline" data-route="/ajustes">Volver a Ajustes</button>`;
    },

    async _showGastoForm(id = null) {
        const categories = Gastos.getCategories(); let d = id ? await Gastos.get(id) : { concepto:'', monto:'', categoria:'Otros', fecha:new Date().toISOString().split('T')[0] };
        const main = document.getElementById('app-content');
        main.innerHTML = `<div class="card"><h3>${id?'Editar':'Nuevo'} Gasto</h3><form id="form-gasto" onsubmit="App._handleGastoSubmit(event, ${id})"><div class="form-group"><label>Concepto</label><input type="text" id="g-con" value="${App.escapeHtml(d.concepto)}" required></div><div class="grid-2"><div class="form-group"><label>Monto (€)</label><input type="number" step="0.01" id="g-mon" value="${d.monto}" required></div><div class="form-group"><label>Fecha</label><input type="date" id="g-fec" value="${d.fecha}" required></div></div><div class="form-group"><label>Categoría</label><select id="g-cat">${categories.map(c => `<option value="${c}" ${d.categoria===c?'selected':''}>${c}</option>`).join('')}</select></div><div class="form-actions mt-1"><button type="submit" class="btn btn-primary">💾 Guardar Gasto</button>${id ? `<button type="button" class="btn btn-danger mt-1" data-action="App._deleteGasto" data-id="${id}">🗑️ Eliminar</button>` : ''}<button type="button" class="btn btn-outline mt-1" data-action="App.renderGastosManager">Cancelar</button></div></form></div>`;
    },

    async _handleGastoSubmit(e, id) { e.preventDefault(); try { const dS = { id: id?Number(id):undefined, concepto: document.getElementById('g-con').value.trim(), monto: document.getElementById('g-mon').value, categoria: document.getElementById('g-cat').value, fecha: document.getElementById('g-fec').value }; await Gastos.save(dS); App.toast('✅ Gasto guardado'); await App.renderGastosManager(); } catch(err){ App.toastError(err.message); } },

    async _deleteGasto(id) {
        const ok = await Utils.confirmDialog({
            title: 'Eliminar Gasto',
            message: '¿Eliminar este gasto permanentemente?',
            icon: '🗑️',
            confirmText: 'Eliminar',
            variant: 'danger'
        });
        if (ok) { await Gastos.delete(id); App.toast('Gasto eliminado'); App.renderGastosManager(); }
    }
};
