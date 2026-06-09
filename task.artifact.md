# Migración de v6 a v7.0 (TypeScript)

- `[x]` 1. Migrar Campos de Configuración (Ajustes y Fincas)
  - `[x]` 1.1. Añadir "% Oreo" y "Datos del Comprador" a `renderAjustes`.
  - `[x]` 1.2. Añadir formulario de "Precios por Calidad" a `renderFincasManager` (Añadido a Ajustes y restaurado _showFincaForm en FincasManager).
- `[x]` 2. Migrar CRUD de Gastos y Zonas
  - `[x]` 2.1. Implementar edición y borrado de gastos (`_handleGastoSubmit`, `_deleteGasto`).
  - `[x]` 2.2. Implementar `renderFichaZona` y `renderFormZona`.
- `[x]` 3. Migrar Dashboard y Gráficos
  - `[x]` 3.1. Implementar `actualizarResumenHoy()`.
  - `[x]` 3.2. Implementar `renderGraficos()` (renderUltimasPesadas implementado como en v6).
- `[x]` 4. Migrar Reportes y Exportaciones
  - `[x]` 4.1. Migrar menús y vistas (`renderMenuZonasReport`, `renderReportePorZona`, `renderMenuCalidadesReport`, `renderReporteEconomicoPorCalidad`).
  - `[x]` 4.2. Implementar `exportarPDF` (con el fix de la cabecera dual).
  - `[x]` 4.3. Implementar exportaciones Excel (`exportGlobalToExcel`, `exportEconomicoToExcel`) en el módulo `Export`.
