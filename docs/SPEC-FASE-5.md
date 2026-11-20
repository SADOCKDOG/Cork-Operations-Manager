# SPEC — Fase 5: Informes y SIGPAC

| Campo | Valor |
|---|---|
| **ID** | `SPEC-UI-005` |
| **Fase** | 5 de 7 (ver `AUDITORIA-UIUX-CORK-MANAGER.md` §5) |
| **Implementa** | `AUDITORIA-UIUX-CORK-MANAGER.md` §5 (Fase 5 — Informes y SIGPAC) |
| **Estado** | Borrador para revisión — 4 requisitos, sin decisión abierta |
| **Riesgo** | Medio — cambia CSS de tablas, service worker, ficha de zona y revocación de blobs |
| **Archivos afectados** | `www/js/ui/reportes-ui.js` (tablas de informes), `www/css/styles.css` (tablas apiladas @container), `vite.config.js` (urlPattern del SW), `www/js/ui/zonas-ui.js` (índice de secciones + blobs en ficha de zona), `www/js/app.js` (_activeObjectUrls / revokeObjectURL) |
| **Datos afectados** | Ninguno (no se toca IndexedDB, esquema ni migraciones) |
| **Medición** | CDP sobre `emulator-5554` (Android 16, 411 dp): `document.documentElement.clientWidth`, ancho de tablas en `/informes`, liquidación económica legible a 360px sin scroll lateral, exportación PDF en modo avión, ficha de zona con índice de secciones, blobs revocados tras navegación |

---

## 1. Objetivo

Implementar los 4 requisitos de la Fase 5 de la auditoría (§5):

1. **Tablas apiladas**: sustituir el comportamiento actual de scroll horizontal (`.table-responsive { overflow-x: auto; white-space: nowrap; }`) por tablas apiladas vía `@container`, con `<caption>`, `scope` en celdas, `thead` sticky y `tabindex="0"` + `role="region"` en el wrapper.
2. **Service worker**: ampliar `urlPattern` de `vite.config.js` para incluir `cdnjs.cloudflare.com` (actualmente solo cubre `cdn.jsdelivr.net`, pero `index.html:23` carga `html2pdf` desde cdnjs).
3. **Índice de secciones en la ficha de zona**: añadir navegación de índice en `renderFichaZona`.
4. **Revocación de blobs en la ficha de zona**: asegurar que `URL.revokeObjectURL()` se llama para los blobs creados en la ficha de zona al navegar fuera (evitar fugas de memoria).

---

## 2. No objetivos (fence de alcance)

Queda **explícitamente fuera** de esta fase:

- Crear nuevos tipos de informe (los existentes: Global, Económica, Por Zona, Por Calidad, Gráficos se conservan).
- Cambiar Nueva Pesada (Fase 2), Listado (Fase 3) o Dashboard (Fase 4).
- Sincronización con Google Drive (la auditoría aclara que no existe; es backup manual cifrado).
- Tocar `dist/` ni `android/` (se regeneran con `npm run cap:sync`).

---

## 3. Diseño de referencia (desde §5 de la auditoría)

**Tablas apiladas** (modo `pointer: coarse` / pantallas estrechas):

```html
<div class="tabla-apilada" tabindex="0" role="region" aria-label="Informe de campaña">
  <table>
    <caption>Resumen por Calidad</caption>
    <thead>
      <tr><th scope="col">Calidad</th><th scope="col">Quintales</th><th scope="col">Sacas</th></tr>
    </thead>
    <tbody>
      <tr><th scope="row">1ª Calidad</th><td>689.37</td><td>142</td></tr>
    </tbody>
  </table>
</div>
```

CSS clave: `@container` para apilar filas en pantallas estrechas, `thead { position: sticky; top: 0 }`, `caption` visible, `scope="col"` / `scope="row"` para accesibilidad.

---

## 4. Requisitos verificables

| ID | Requisito | Cómo se verifica |
|---|---|---|
| **R1** | Tablas apiladas con @container, caption, scope, sticky thead, tabindex="0" | CDP: en `/informes`, cada tabla tiene `<caption>`, `th[scope]`, `thead` con `position: sticky`, y el wrapper tiene `tabindex="0"` + `role="region"`; cero `white-space: nowrap` en tablas de informe |
| **R2** | Service worker cachea cdnjs.cloudflare.com | CDP / `vite.config.js`: `urlPattern` incluye `cdnjs.cloudflare.com` junto a `cdn.jsdelivr.net` |
| **R3** | Ficha de zona tiene índice de secciones | CDP: en ficha de zona existe un elemento de navegación/índice de secciones |
| **R4** | Blobs revocados al salir de la ficha de zona | CDP: `App._activeObjectUrls` queda vacío tras navegar fuera de ficha de zona; `URL.revokeObjectURL` se invoca |
| **R5** | Liquidación económica legible a 360px sin scroll lateral | CDP a `document.documentElement.clientWidth === 360`: `scrollWidth === clientWidth` en `/informes` (liquidación) |
| **R6** | PDF exportable en modo avión | `vite.config.js` SW cubre cdnjs (html2pdf); exportación PDF funciona sin red |

---

## 5. Criterio de salida

- Tablas de informes renderizadas como tablas apiladas (@container, caption, scope, sticky thead, tabindex="0").
- `vite.config.js` incluye `cdnjs.cloudflare.com` en el `urlPattern` del service worker.
- Ficha de zona muestra índice de secciones.
- Blobs revocados al salir de la ficha de zona (sin fugas en `App._activeObjectUrls`).
- Liquidación económica legible a 360px sin scroll lateral (medido en el emulador).
- `npx vite build` sin errores; deploy en `emulator-5554` y medida CDP pasada.

---

*Escrito para seguimiento: los números de remisión de línea corresponden al estado actual de la rama `main`.*
