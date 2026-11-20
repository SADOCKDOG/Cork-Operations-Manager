# SPEC — Fase 3: Listado de pesadas (fichas `.pesada`)

| Campo | Valor |
|---|---|
| **ID** | `SPEC-UI-003` |
| **Fase** | 3 de 7 (ver `AUDITORIA-UIUX-CORK-MANAGER.md` §7) |
| **Implementa** | `AUDITORIA-UIUX-CORK-MANAGER.md` §4.1 y Fase 3 |
| **Estado** | Borrador para revisión — 1 decisión abierta (§5) |
| **Riesgo** | Medio — cambia el markup de las fichas y el registro de listeners táctiles |
| **Archivos afectados** | `www/js/ui/pesadas-ui.js` (`_renderPesadasHTML`, `_setupSwipeOnCards`, `_setupPullToRefresh`, `loadMorePesadas`), `www/css/styles.css` (bloque `.pesada` y utilidades) |
| **Datos afectados** | Ninguno (no se toca IndexedDB, esquema ni migraciones) |
| **Medición** | CDP sobre `emulator-5554` (Android 16, 411 dp): `document.documentElement.clientWidth`, ancho de las 20 fichas, fuentes computadas, targets táctiles, listeners duplicados |

---

## 1. Objetivo

Sustituir el render actual de las fichas de pesada (tablas HTML por defecto dentro de `.card`) por el sistema de fichas `.pesada` descrito en §4.1 de la auditoría, con jerarquía **quintales > kg > fecha**, fecha relativa con `<time>`, conteo de saca y calidad, y una alternativa visible al swipe (menú ⋯ de ≥44px o botón de editar dentro de la ficha). Corregir el registro duplicado de listeners en cada "Cargar más".

---

## 2. No objetivos (fence de alcance)

Queda **explícitamente fuera** de esta fase:

- Agrupación por día o zona de las pesadas (las fichas siguen en lista plana ordenada por fecha descendente).
- Pull-to-refresh: ver §5 (decisión abierta).
- Paginado infinito, búsqueda o filtros (se conserva "Cargar más").
- Cambios en Nueva Pesada (Fase 2, ya cerrada), Dashboard (Fase 4) o Informes (Fase 5).
- Cambiar `package.json`, `vite.config.js` o el service worker.
- Tocar `dist/` ni `android/` (se regeneran con `npm run cap:sync`).

---

## 3. Diseño de referencia (desde §4.1 de la auditoría)

Markup de referencia para cada ficha:

```html
<article class="pesada">
  <header>
    <span class="pesada__saca">#143</span>
    <time datetime="2026-11-15T08:14">hoy 08:14</time>
    <span class="pill pill--primera">1ª</span>
  </header>
  <p class="pesada__zona">Pol. 809 / Par. 275</p>
  <dl class="pesada__datos">
    <div><dt>Neto</dt><dd>68,4 Q</dd></div>
    <div><dt>Bruto</dt><dd>148,5 kg</dd></div>
  </dl>
</article>
```

- Quintales a **1.5rem / 900** y kg a **0.85rem / 600**.
- Fecha relativa ("hace 2 h", "ayer 17:42") con `<time datetime>` (12px, suelo tipográfico `--fs-2xs`).
- Swipe conservado, pero con **alternativa visible**: menú `⋯` de 44px o botón de editar dentro de la ficha.

---

## 4. Requisitos verificables

| ID | Requisito | Cómo se verifica |
|---|---|---|
| **R1** | Cada pesada se renderiza como `<article class="pesada">` (no `table`) | CDP: `document.querySelectorAll('article.pesada').length` > 0; cero `table.pesada-table-bordered` |
| **R2** | Jerarquía visual: quintales > kg > fecha | CDP: computed `font-size` de quintales (≈24px) > kg (≈13.6px) > fecha (12px, relativa) |
| **R3** | Fecha relativa con `<time datetime>` | CDP: elemento `time` con atributo `datetime` en cada ficha |
| **R4** | Alternativa visible al swipe (menú ⋯ o editar ≥44px) | CDP: cada ficha tiene un botón con ancho y alto ≥44px |
| **R5** | Cero listeners duplicados tras "Cargar más" | CDP: tras 2× "Cargar más", el click en una ficha dispara una sola navegación a `/pesada/:id/editar` |
| **R6** | 20 fichas legibles a 320 dp sin scroll horizontal | CDP a `document.documentElement.clientWidth === 320`: `scrollWidth === clientWidth` y cada ficha cabe |
| **R7** | Los botones "Editar" del swipe funcionan (navegan a `/pesada/:id/editar`) | CDP: click en swipe-edit cambia `location.hash` |

---

## 5. Decisión abierta (pendiente de tu respuesta)

**Q1 — Pull-to-refresh:** el auditoría dice "Arreglar o eliminar el pull-to-refresh".

- (a) **Eliminarlo**: quitar `.ptr-container`, `_setupPullToRefresh()` y su llamada; el usuario refresca con el navegador/navegación.
- (b) **Arreglarlo**: mantener `.ptr-container` y hacer que el refresh recargue los datos sin re-renderizar desde cero (evitar parpadeo y re-bindings).

**Recomendación:** (a) eliminarlo — `renderLista()` ya recarga todo y el pull-to-refresh actual no aporta nada que no haga navegar a otra pantalla y volver.

---

## 6. Criterio de salida

- `renderLista()` muestra fichas `.pesada` con jerarquía quintales > kg > fecha.
- Fichas legibles a 320 dp sin scroll horizontal (medido en el emulador).
- Cada ficha tiene alternativa visible al swipe (≥44px).
- Tras 2× "Cargar más", ningún listener duplicado.
- `npx vite build` sin errores; deploy en `emulator-5554` y medida CDP pasada.

---
*Escrito para seguimiento: los números de remisión de línea (por ejemplo `pesadas-ui.js:322`) corresponden al estado actual de la rama `main` en `f9f5d60`.*
