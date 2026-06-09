# Plan Maestro de Migración a v7.0 (TypeScript)

Este plan tiene como objetivo asegurar que **absolutamente ninguna funcionalidad, pantalla, vista, formulario o herramienta** de la versión Legacy (v6.3.1) se pierda durante la migración a la versión v7.0 (TypeScript).

He realizado un mapeo exhaustivo entre el archivo `js/app.js` (Legacy) y `src/main.ts` (Nueva versión). A continuación se detallan las tareas requeridas para completar la migración de forma íntegra.

---

## 1. Módulos y Lógica Core a Migrar

- **Exportación a PDF:** 
  - [ ] Implementar `App.exportarPDF(tipo)` y `App._exportNativePDF(tipo, html)` en `main.ts` (o en un módulo `pdf.ts`).
  - [ ] **Fix Crítico:** Asegurar que `_getDualHeaderHtml` se utiliza correctamente para evitar la duplicidad de cabeceras en los informes (el fix introducido en v6.3.1).
- **Exportación a Excel:** 
  - [ ] Añadir `Export.exportGlobalToExcel()` y `Export.exportEconomicoToExcel()` al módulo `src/modules/export.ts` (actualmente sólo soporta Backup JSON).
- **Widgets del Dashboard:**
  - [ ] Migrar `actualizarResumenHoy()` para que el Dashboard muestre tanto el "Total Acumulado" como el "Total (Hoy)" (número de sacas y kg del día).
- **Gestión de Gastos:**
  - [ ] Añadir la lógica de edición/borrado de gastos (`_handleGastoSubmit` y `_deleteGasto`). En v7 sólo existe el botón básico de añadir, pero no se pueden editar/eliminar.

---

## 2. Pantallas y Vistas Faltantes en `src/main.ts`

Estas pantallas existen en v6.3.1 pero aún no tienen su equivalente en v7.0:

### Gestión de Zonas
- [ ] `renderFichaZona(id)`: Vista de detalles de una zona específica (croquis, datos catastrales, historial de sacas).
- [ ] `renderFormZona(id)`: Formulario para crear/editar los datos detallados de la zona.

### Central de Informes (Reportes)
- [ ] `renderMenuZonasReport()` y `renderReportePorZona(zonaId)`: Selección de zona y generación del informe detallado por zona.
- [ ] `renderMenuCalidadesReport()` y `renderReporteEconomicoPorCalidad(calidad)`: Pantallas de informe de liquidación filtradas por calidad (1ª, Bornizo, Refugo).
- [ ] `renderGraficos()`: Panel de Análisis Gráfico (Evolución, Distribución, Valor Económico) con `Chart.js`.

---

## 3. Formularios y Campos a Actualizar

- **Pantalla de Ajustes (`renderAjustes`):**
  - [ ] Añadir sección de "Datos Comprador": Empresa, CIF/NIF, Representante, Dirección.
  - [ ] Añadir el campo **"Porcentaje de Oreo (%)"** (Crítico para el cálculo de la merma).
- **Gestor de Fincas (`renderFincasManager`):**
  - [ ] Añadir el formulario de edición de finca donde se establecen los precios por quintal (`precio-1a`, `precio-bo`, `precio-re`) y el factor de conversión (kg por quintal).

---

> [!IMPORTANT]
> **Aprobación de la Migración Completa**
> He revisado línea por línea la versión v6.3.1. Esta es la lista definitiva de todo lo que falta en la v7.0 para garantizar que sea un calco exacto de la versión funcional. 
> 
> ¿Apruebas este plan exhaustivo para proceder a implementarlo en la v7?
