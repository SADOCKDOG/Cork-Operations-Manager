# PLAN — Fase 5: Informes y SIGPAC

| Campo | Valor |
|---|---|
| **ID** | `PLAN-UI-005` |
| **Implementa** | [`SPEC-FASE-5.md`](SPEC-FASE-5.md) (`SPEC-UI-005`) |
| **Contexto** | [`AUDITORIA-UIUX-CORK-MANAGER.md`](AUDITORIA-UIUX-CORK-MANAGER.md) §5 (Fase 5 — Informes y SIGPAC) |
| **Estado** | Listo para ejecutar |
| **Riesgo** | Medio (CSS de tablas, SW, ficha de zona, blobs) |
| **Rama** | `fix/fase-5-informes` |
| **Commits** | 1 por paso, 6 en total |

---

## 0. Puerta de decisiones

No hay decisión abierta. Los 4 requisitos de §5 de la auditoría son concretos:

1. Tablas apiladas (@container, caption, scope, sticky thead, tabindex)
2. urlPattern del SW ampliado a cdnjs.cloudflare.com
3. Índice de secciones en ficha de zona
4. Revocación de blobs en ficha de zona

---

## 1. S0 — CSS para tablas apiladas (`.tabla-apilada`)

**Objetivo:** sustituir `overflow-x: auto` + `white-space: nowrap` de `.table-responsive` / `.reporte-table` por tablas apiladas vía `@container` en pantallas estrechas.

**Pasos:**

1. En `www/css/styles.css`, sustituir el bloque actual `.table-responsive` / `.reporte-table` (líneas ~929-991) por una versión con:
   - Wrapper `.tabla-apilada` con `container-type: inline-size`, `tabindex="0"`, `role="region"`, `aria-label`
   - `@container (max-width: 480px)` → `thead { display: none }`, `tr { display: block; margin-bottom: 12px }`, `td/th { display: flex; justify-content: space-between; gap: 16px }`, inyección de etiquetas vía `td::before { content: attr(data-label) }`
   - `thead th { position: sticky; top: 0; z-index: 1 }` en modo ancho
   - `caption` visible y estilizado
2. Mantener compatibilidad con tablas existentes que usan `text-align: right`, `.text-lime`, `.text-gold`, `.text-red`, etc.

**Definición de paso completo:** CSS actualizado; `npx vite build` pasa.

---

## 2. S1 — Reescribir tablas en `reportes-ui.js`

**Objetivo:** cada tabla de informe usa `<caption>`, `<th scope="col">` / `<th scope="row">`, y wrapper `<div class="tabla-apilada" tabindex="0" role="region" aria-label="...">`.

**Pasos:**

1. En `www/js/ui/reportes-ui.js`, recorrer los 5 informes (`renderReporteGlobal`, `renderReporteEconomico`, `renderReportePorZona`, `renderReporteEconomicoPorCalidad`, `renderGraficos`).
2. Reemplazar cada `<table class="reporte-table">` por:
   ```html
   <div class="tabla-apilada" tabindex="0" role="region" aria-label="...">
     <table>
       <caption>Título</caption>
       <thead><tr><th scope="col">…</th>…</tr></thead>
       <tbody>…<th scope="row">…</th><td data-label="…">…</td>…</tbody>
     </table>
   </div>
   ```
3. Eliminar `style="text-align: right"` y `white-space: nowrap` inline; mover a CSS.

**Definición de paso completo:** todas las tablas en `/informes` usan `caption` + `scope` + wrapper `tabla-apilada`; cero estilos inline.

---

## 3. S2 — Ampliar `urlPattern` del service worker

**Objetivo:** cachear `html2pdf.js` desde `cdnjs.cloudflare.com` para exportación PDF en modo avión.

**Pasos:**

1. En `vite.config.js:21`, sustituir:
   ```js
   urlPattern: /^https:\/\/cdn\.jsdelivr\.net\/.*/i
   ```
   por:
   ```js
   urlPattern: /^https:\/\/(cdn\.jsdelivr\.net|cdnjs\.cloudflare\.com)\//i
   ```
2. Opcional: copiar `html2pdf.bundle.min.js` a `www/js/vendor/` y precachear con `globPatterns` (si se mueve a local).

**Definición de paso completo:** `urlPattern` incluye ambos CDNs; build pasa.

---

## 4. S3 — Índice de secciones en la ficha de zona

**Objetivo:** `renderFichaZona` muestra un índice de secciones navegable.

**Pasos:**

1. En `www/js/ui/zonas-ui.js`, identificar las secciones de la ficha (Resumen, Historial, Calidades, etc.).
2. Insertar un `<nav class="zona-indice">` con `<a href="#seccion-…">` antes del contenido, con estilos CSS propios (chips / lista enlazada).
3. Cada sección debe tener `id` único y `tabindex="-1"` para foco accesible.

**Definición de paso completo:** ficha de zona muestra índice visible con enlaces a cada sección.

---

## 5. S4 — Revocación de blobs en la ficha de zona

**Objetivo:** evitar fugas de memoria en `App._activeObjectUrls`.

**Pasos:**

1. En `www/js/ui/zonas-ui.js` (`renderFichaZona`), registrar todo blob URL creado en `App._activeObjectUrls.push(url)`.
2. Confirmar que `www/js/core/router.js:21-23` revoca todos los URLs al navegar (ya existe: `URL.revokeObjectURL(url)`).
3. Verificar que ningún blob se queda vivo tras salir de `/zona/:id`.

**Definición de paso completo:** `App._activeObjectUrls.length === 0` tras navegar fuera de ficha de zona.

---

## 6. S5 — Build, deploy y verificación en el emulador

**Pasos:**

1. `npx vite build` → `npx cap sync android` → `./gradlew assembleDebug` (JAVA_HOME a JDK 21) → `adb -s emulator-5554 install -r …app-debug.apk`.
2. Abrir `/informes` en `emulator-5554` (Android 16, 411 dp).
3. Medición CDP:
   - Tablas con `caption`, `th[scope]`, wrapper `tabla-apilada` con `tabindex="0"` + `role="region"`.
   - `urlPattern` del SW incluye ambos CDNs.
   - Ficha de zona con índice de secciones.
   - `App._activeObjectUrls` vacío tras navegar fuera.
   - A `clientWidth === 360`, `scrollWidth === clientWidth` (sin scroll lateral).
4. Capturas: `docs/evidencias/fase-5/411-emulador-informes-fase5.png`, `fase5-liquidacion-360.png`, `fase5-ficha-zona-indice.png`.

**Definición de paso completo:** todas las mediciones CDP pasan; capturas en `docs/evidencias/fase-5/`.

---

## 7. Criterio de salida (del spec)

- Tablas de informes renderizadas como tablas apiladas (@container, caption, scope, sticky thead, tabindex="0").
- `vite.config.js` incluye `cdnjs.cloudflare.com` en el `urlPattern` del service worker.
- Ficha de zona muestra índice de secciones.
- Blobs revocados al salir de la ficha de zona.
- Liquidación económica legible a 360px sin scroll lateral (medido en el emulador).
- `npx vite build` sin errores; deploy en `emulator-5554` y medida CDP pasada.

---

*Escrito para seguimiento: los números de remisión de línea corresponden al estado actual de la rama `main`.*
