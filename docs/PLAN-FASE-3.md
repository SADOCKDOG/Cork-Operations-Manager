# PLAN — Fase 3: Listado de pesadas (fichas `.pesada`)

| Campo | Valor |
|---|---|
| **ID** | `PLAN-UI-003` |
| **Implementa** | [`SPEC-FASE-3.md`](SPEC-FASE-3.md) (`SPEC-UI-003`) |
| **Contexto** | [`AUDITORIA-UIUX-CORK-MANAGER.md`](AUDITORIA-UIUX-CORK-MANAGER.md) §4.1 y Fase 3 |
| **Estado** | Listo para ejecutar tras resolver §0 |
| **Riesgo** | Medio (markup + listeners táctiles) |
| **Rama** | `fix/fase-3-listado` |
| **Commits** | 1 por paso, 5 en total |

---

## 0. Puerta de decisiones (antes de tocar nada)

El spec deja una pregunta abierta. El plan **asume la respuesta (a)** para poder escribirse; si se elige (b), cambian solo los pasos S3/S4:

| ID | Asumido | Si cambia |
|---|---|---|
| **Q1** | (a) **Eliminar** el pull-to-refresh (quitar `.ptr-container` y `_setupPullToRefresh`) | (b) mantenerlo y arreglar el re-render (cambian S3 y S4) |

---

## 1. S0 — CSS base de las fichas `.pesada`

**Objetivo:** definir en `www/css/styles.css` todos los estilos de la ficha para que el JS solo emita clases (sin estilos inline, como la Fase 2).

**Pasos:**

1. Añadir en `www/css/styles.css` un bloque "LISTADO DE PESADAS — Fase 3" con:
   - `.pesada` (article: card, borde, padding, radius, `min-width: 0` para evitar blow-out en grid/flex)
   - `.pesada header` (flex, justify-between, align-baseline, gap)
   - `.pesada__saca`, `.pesada__zona`, `.pesada__datos` (dl con grupos dt/dd)
   - `.pill` y `.pill--primera / pill--bornizo / pill--refugo` (reutilizar colores de la Fase 2: `#64DD17`, `#FFD600`, `#FF5252`)
   - `.pesada-swipe-wrapper`, `.pesada-swipe-content`, `.pesada-swipe-actions` (mantenidos del swipe actual, con `min-width: 0`)
   - Botón de menú ⋯ o editar ≥44px (target mínimo WCAG 2.5.8)
   - Regla `article.pesada > * { min-width: 0 }` para evitar desbordes a 320 dp (lección H2/H3 de Fase 1)
2. `npx vite build` — debe compilar sin errores.

**Definición de paso completo:** `npm run build` pasa y el CSS tiene el bloque `.pesada`.

---

## 2. S1 — Reescribir `_renderPesadasHTML`

**Objetivo:** cada pesada se renderiza como `<article class="pesada">` con la jerarquía quintales > kg > fecha, fecha relativa y pill de calidad.

**Pasos:**

1. Sustituir el `table.pesada-table-bordered` por el `dl.pesada__datos` del spec (Neto/Bruto).
2. Fecha: función auxiliar `fechaRelativa(iso)` que devuelva "hoy HH:MM", "ayer HH:MM" o "dd/mm/yyyy" según antelación, renderizada en `<time datetime="...">`.
3. Quintales a `font-size: 1.5rem; font-weight: 900`; kg a `0.85rem; font-weight: 600`; fecha menor.
4. Mantener el swipe wrapper y las acciones de swipe existentes (editar al deslizar).
5. Añadir dentro de cada ficha el botón alternativo visible al swipe: `data-route="/pesada/${id}/editar"` (abre la edición) o un menú ⋯ de ≥44px con su propia `data-action`. Debe medir ≥44px de ancho y alto (target mínimo).

**Definición de paso completo:** `renderLista()` emite artículos `.pesada`; cero `table` en `#lista-pesadas-container`.

---

## 3. S2 — Corregir listeners duplicados en "Cargar más"

**Diagnóstico medido (Fase actual):** `_setupSwipeOnCards()` se vuelve a ejecutar sobre **todas** las tarjetas en cada "Cargar más" (`pesadas-ui.js:474`), por lo que el click se dispara 2, 3, 4 veces por ficha.

**Pasos:**

1. En `_setupSwipeOnCards`, marcar cada wrapper con `dataset.swipeBound = '1'` y no volver a bindar los que ya lo tengan; **o** pasar a delegación de eventos en el contenedor `#lista-pesadas-container`.
2. En `loadMorePesadas`, bindar swipe solo sobre las tarjetas nuevas del batch insertado (no sobre todo el contenedor).
3. Probar en el navegador local: 2× "Cargar más" + click en una ficha → una sola navegación.

**Definición de paso completo:** tras 2× "Cargar más", un click en ficha navega exactamente una vez a `/pesada/:id/editar`.

---

## 4. S3 — Pull-to-refresh (decisión Q1)

**Asumido (a): eliminar.**

**Pasos:**

1. Quitar el markup `.ptr-container` / `.ptr-indicator` de `renderLista()`.
2. Eliminar `_setupPullToRefresh()` y su llamada en `renderLista()`.
3. (No hay estilos `.ptr-*` en el CSS: los estilos de pull-to-refresh son inline en el JS y desaparecen con el markup.)
4. `npx vite build` — compila sin errores.

*(Si se elige (b): mantener `.ptr-container` y hacer que el refresh recargue datos sin re-bindings; ajustar S3/S4 en consecuencia.)*

**Definición de paso completo:** `renderLista()` no llama a `_setupPullToRefresh`; el HTML no contiene `ptr-container`.

---

## 5. S4 — Build, deploy y verificación en el emulador

**Objetivo:** verificar el criterio de salida en hardware real (emulador).

**Pasos:**

1. `npx vite build` → `npx cap sync android` → `./gradlew assembleDebug` → `adb -s emulator-5554 install -r ...app-debug.apk`.
2. Arrancar la app en `emulator-5554` (Android 16, 411 dp), abrir `/lista`.
3. Medición CDP (`CDP_PORT=9301 node scratch/cdp-pesada.js` o batería similar):
   - `document.documentElement.clientWidth === 411` y `scrollWidth === clientWidth` (sin scroll horizontal).
   - `document.querySelectorAll('article.pesada').length` ≥ 20.
   - computed font-size de quintales > kg > fecha.
   - targets del botón alternativo ≥ 44px.
   - tras 2× "Cargar más", click en ficha → una sola navegación.
4. Capturas: `docs/evidencias/fase-3/411-emulador-lista-fase3.png` y, con teclado abierto si aplica, la ficha con menú alternativo.

**Definición de paso completo:** todas las mediciones CDP pasan; capturas guardadas en `docs/evidencias/fase-3/`.

---

## 6. Criterio de salida (del spec)

- `renderLista()` muestra fichas `.pesada` con jerarquía quintales > kg > fecha.
- Fichas legibles a 320 dp sin scroll horizontal (medido en el emulador).
- Cada ficha tiene alternativa visible al swipe (≥44px).
- Tras 2× "Cargar más", ningún listener duplicado.
- `npx vite build` sin errores; deploy en `emulator-5554` y medida CDP pasada.

---
*Escrito para seguimiento: los números de remisión de línea corresponden al estado actual de la rama `main` en `f9f5d60`.*
