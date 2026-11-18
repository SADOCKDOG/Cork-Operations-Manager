# Auditoría UI/UX — Cork Operations Manager (Cork Manager)

**Fecha:** 2026-11-15
**Alcance:** `www/index.html`, `www/css/styles.css`, `www/js/app.js`, `www/js/core/*.js`, `www/js/ui/*.js`
**Metodología:** lectura del código fuente + cálculo de ratios de contraste WCAG + guías `modern-web-guidance` (`form-factor-adaptation`, `color`, `responsive-table`, `forms`, `motion`)
**Estado:** solo diagnóstico. **No se ha modificado ningún archivo de la aplicación.**

---

## 0. Resumen ejecutivo

La base es sólida: tokens CSS ya definidos, mobile-first, targets táctiles generosos en los botones principales (`--touch-min: 50px`, `.btn` 56px, FAB 60px) y un flujo de pesaje pensado para campo (campo héroe, autofocus, teclado numérico).

El problema no es el diseño conceptual, sino **la erosión del sistema**: los tokens se rompieron, el 60% del layout se escribe con `style="..."` inline y varias clases que el JS emite **no existen en el CSS**. En modo exterior esto se traduce en campos transparentes, etiquetas de 9.6px y tablas sin estilo.

### Los 10 hallazgos de mayor impacto

| # | Hallazgo | Archivo | Impacto |
|---|---|---|---|
| 1 | Token `--bg-surface` **usado 4 veces y nunca definido** → inputs, pastillas de calidad y campo héroe quedan con fondo transparente | `styles.css:514,526,547,582` | Alto |
| 2 | ~30 clases emitidas por JS **sin ninguna regla CSS** (`pesada-card-content`, `pesada-table-bordered`, `list-counter`, `ptr-indicator`, `ptr-spinner`, `bento-grid`, `error-card`…) | `pesadas-ui.js`, `dashboard-ui.js` | Alto |
| 3 | `maximum-scale=1.0, user-scalable=no` impide ampliar con pinza | `index.html:5` | Alto (accesibilidad) |
| 4 | Etiquetas de datos a **0.6rem (9.6px)** en mayúsculas + tracking | `styles.css:804,892,667` | Alto (sol directo) |
| 5 | Sin `inputmode` ni `enterkeyhint` en ningún campo | `pesadas-ui.js:53-74` | Medio-alto |
| 6 | `toastError()` aplica clase `toast error` pero el CSS define `.toast-error` → **los errores no se ven en rojo** | `utils.js:12` vs `styles.css:1246` | Medio |
| 7 | Pull-to-refresh sin CSS ni contenedor scroll propio → **dispara recarga en cualquier gesto hacia abajo** | `pesadas-ui.js:360-398` | Medio |
| 8 | `.card svg { stroke: #CCFF00 }` sobrescribe el color semántico de **todos** los iconos | `styles.css:212` | Medio |
| 9 | 15 restos del marrón antiguo `rgba(212,163,115,…)` en sombras y focos (marca hoy es lima `#CCFF00`) | `styles.css` | Medio |
| 10 | Sin ningún indicador de conexión / estado de guardado offline | todo `www/` | Medio (confianza) |

> **Nota de alcance:** la sincronización con Google Drive **no existe en `www/`**. Lo implementado es backup manual cifrado (`Export.exportBackup`, AES-GCM en `core/crypto.js`) que se comparte vía `Capacitor.Share`. El informe lo trata como "exportación manual", no como sincronización.

---

## 1. Sistema de diseño: tokens, color y tipografía

### 1.1 Tokens rotos

```css
/* styles.css:511-521 — input, select, textarea */
background: var(--bg-surface);   /* ← NO EXISTE */
```

Los tokens reales son `--bg`, `--bg-deep`, `--surface`, `--surface-light`, `--surface-glass`. Al ser una variable no definida, la declaración es *inválida en tiempo de cálculo* y el navegador la descarta: **el fondo queda transparente**. Afecta a:

- `input, select, textarea` (`:514`) → sin contraste contra la tarjeta `#1E1E1E`
- `input:focus` (`:526`) → el foco oscurece… a nada
- `.input-hero` (`:547`) → el campo de peso pierde su fondo
- `.quality-pill/.quality-btn` (`:582`) → las pastillas de calidad quedan huecas

**Propuesta:** definir en `:root`

```css
--bg-surface: #262626;              /* input sobre card #1E1E1E */
--bg-surface-focus: #1A1A1A;
```

y sustituir los 4 usos. Impacto visual: inmediato en "Nueva Pesada", filtros y ajustes.

### 1.2 Paleta duplicada y restos de marca antigua

| Token | Valor | Problema |
|---|---|---|
| `--p-cork` / `--accent` | `#CCFF00` | Dos nombres para el mismo color, usados indistintamente |
| `--text-s` / `--text-secondary` / `--text-muted` | `#94A3B8` | Tres alias; `.text-grey` los duplica hardcodeado |
| `--bg` / `--bg-deep` | `#121212` / `#000000` | `--bg-deep` no se usa |
| `--radius` / `--radius-lg` | `16px` / `16px` | Duplicado exacto |

**15 apariciones** de `rgba(212,163,115,…)` (marrón corcho pre-v7) quedan en:

- `styles.css:508` borde del `.form-section-title`
- `styles.css:527,556` anillo de foco (`box-shadow: 0 0 0 3px rgba(212,163,115,0.1)`) — **el foco se ilumina en marrón, no en lima**
- `styles.css:876,880` `.summary-cell-cbo`
- `styles.css:1120,1123` `theme-zona`
- `styles.css:1191,1202,1216,1217` sombras del FAB y `fabPulse`
- `styles.css:1604` glow del `.tour-dot.active`
- `styles.css:1644` borde del `.spinner`

**Propuesta:** eliminar los alias y añadir un token de *glow* derivado:

```css
--glow-accent: rgba(204,255,0,.35);
--ring-accent: rgba(204,255,0,.12);
```

### 1.3 Contraste medido (WCAG 2.1)

Cálculos sobre la paleta actual:

| Combinación | Ratio | Veredicto |
|---|---|---|
| `#94A3B8` sobre `#1E1E1E` (texto secundario en card) | **6.50** | AA ✔ / AAA ✘ |
| `#94A3B8` sobre `#2A2A2A` (sobre sub-superficie) | **5.60** | AA ✔ / AAA ✘ |
| `#FF4444` sobre `#1E1E1E` (danger en card) | **4.89** | AA justo ✘ campo |
| `#CCFF00` sobre `#121212` | **15.94** | AAA ✔ |
| `#FFD600` sobre `#1E1E1E` | **11.81** | AAA ✔ |
| `#4FACFE` sobre `#1E1E1E` | **6.88** | AA ✔ |
| `#FFFFFF` sobre `#1E1E1E` | 16.67 | AAA ✔ |

Nada falla formalmente, pero el estándar de **exterior con sol directo** exige margen: se recomienda **≥7:1 para texto pequeño** y **≥3:1 para bordes de control** (WCAG 1.4.11, hoy no medido: `--border: #333333` sobre `#1E1E1E` = **1.35:1**, muy por debajo del 3:1 que exige un límite de control perceptible).

**Propuesta** (valores verificados con cálculo, no estimados):
- `--border` se mantiene `#333333` para separadores decorativos; se añade `--border-control: #777777` → **3.72:1** sobre `#1E1E1E` y **3.47:1** sobre el relleno de input (cumple 1.4.11)
- `--text-s` → `#B4C0CE` → **9.03:1** sobre card, **7.77:1** sobre `--surface-light`
- `--danger` → `#FF6B6B` → **6.01:1** sobre card (hoy 4.89:1)
- `@media (prefers-contrast: more)` reforzando `--text-s` y `--border`

### 1.4 Escala tipográfica: el problema del sol

| Selector | Tamaño | Uso |
|---|---|---|
| `.pesada-val-lbl` | **0.6rem / 9.6px** | etiqueta "PESO NETO" en fichas |
| `.s-lbl` | **0.6rem** | etiquetas del summary-grid |
| `.metric-triple-lbl` | **0.65rem** | desglose de calidades |
| `.metric-label`, `.stat-label` | 0.7rem | KPIs |
| `.nav-item` | **10px fijo** | navegación inferior |

Con uppercase + `letter-spacing` de 0.08–0.1em, a 9.6px el texto se vuelve ilegible a pleno sol. Además `10px` fijo en la nav **ignora el escalado de texto del sistema** (Android Ajustes → Tamaño de fuente).

**Propuesta:** suelo de **12px** (`0.75rem`) para etiquetas y 13px mínimo para cualquier texto funcional; usar `rem` siempre; sustituir `font-size: 10px` por `clamp(0.75rem, 2.6vw, 0.85rem)`; añadir `text-wrap: balance` en títulos y `text-wrap: pretty` en párrafos.

### 1.5 Viewport y zoom

```html
<!-- index.html:5 -->
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
```

Bloquea la ampliación por pinza (WCAG 1.4.4). En una app de campo, el usuario mayor **necesita** hacer zoom para leer un importe.

**Propuesta:** `width=device-width, initial-scale=1, viewport-fit=cover` eliminando `maximum-scale` y `user-scalable`.

Esto **obliga** a añadir `viewport-fit=cover` + padding con `env(safe-area-inset-*)` en `header` y `.bottom-nav` (ya parcialmente presente vía `--safe-top`/`--safe-bottom`, pero el FAB y los toasts usan `100px`/`84px` fijos en lugar de las variables).

### 1.6 Preferencias del sistema no atendidas

| Preferencia | Estado |
|---|---|
| `prefers-reduced-motion` | **ausente** — `fabPulse` late 2.5 s indefinidamente, `shimmer` de skeletons, `slideUp` de modales |
| `prefers-color-scheme` | ausente (aceptable: la app es dark-only por mandato de marca) |
| `forced-colors` | ausente — `box-shadow` y gradientes (todo el sistema de botones) desaparecen en modo alto contraste |
| `color-scheme` | ausente → selects nativos, scrollbars y `input[type=date]` pueden renderizar en claro |

**Propuesta:** `:root { color-scheme: dark; }`, envolver `fabPulse`/`shimmer`/`slideUp` en `@media (prefers-reduced-motion: no-preference)` y un bloque `@media (forced-colors: active)` que convierta el resplandor neón en `border: 1px solid ButtonText`.

### 1.7 Arquitectura: 360 estilos inline

| Archivo | Atributos `style="` |
|---|---|
| `reportes-ui.js` | 104 |
| `fincas-ui.js` | 92 |
| `pesadas-ui.js` | 56 |
| `dashboard-ui.js` | 55 |
| `zonas-ui.js` | 34 |
| `index.html` | 21 |

Mientras el layout viva en atributos inline, ningún token ni media query puede ajustarlo. Es la causa raíz de la incoherencia de radios (8, 10, 12, 16, 20 px conviviendo), de paddings (15/16/20/25) y de sombras.

**Objetivo de refactor:** *ni un solo `style=` con color, espaciado o tipografía* en los módulos UI. Solo `style` dinámico justificado (`--card-color`, `--metric-line`).

---

## 2. Jerarquía visual y layout

### 2.1 Dashboard (`dashboard-ui.js:35-81`)

**Diagnóstico**

1. **Duplicación de métricas.** "Resumen de Campaña" y "Resumen Hoy" son visualmente idénticos (misma retícula de 3 pill, mismo tamaño de número 2.5rem). El usuario no distingue el alcance temporal sin leer el `<h3>` gris de 0.8rem.
2. **Retícula 2×2 de accesos que repite la navegación.** PESADA / LISTA / INFORMES / FINCAS: los tres últimos ya están en `.bottom-nav`. La celda PESADA además duplica el FAB.
3. **Sin señal de estado.** No hay "última pesada hace 2 h", ni nº de sacas, ni conexión, ni si el backup se exportó.
4. **`--accent` vs `#CCFF00`**: la tarjeta PESADA usa `background: #CCFF00` hardcodeado (línea 62) en lugar del token.
5. **Skeleton desalineado** (`utils.js:98-108`): dibuja 2 cards de 160px + 4 de 100px; el layout real es 2 de ~200px + 4 de ~110px → salto visible (CLS) al terminar la carga.

**Propuesta**

```
┌──────────────────────────────────────┐
│ CAMPAÑA 2026            ● offline    │  ← barra de estado contextual
│ 1.842,50 Q          ▲ +312,10 hoy    │  ← KPI héroe con delta
├──────────────┬───────────────────────┤
│ 1ª   1.210   │ Bornizo   480         │  ← pill con barra proporcional
│ Refugo  152  │ 86 sacas · 14 zonas   │
├──────────────┴───────────────────────┤
│ ÚLTIMAS PESADAS        Ver todas →   │  ← una sola sección de lista
│ SACA #142 · 1ª · 68,4 Q · hace 2 h   │
└──────────────────────────────────────┘
```

- Un único bloque de totales con **delta de hoy** en lugar de dos bloques idénticos.
- Reemplazar la retícula 2×2 por una fila horizontal de "acciones frecuentes" (solo lo que no está en la nav) o eliminarla.
- Barra de estado: conexión + pendientes de exportar.

### 2.2 Navegación inferior (`index.html:74-95`)

- 5 ítems en `grid-template-columns: repeat(5, 1fr)` → a 375px cada target mide 75×64px ✔. A 320px, 64×64px ✔.
- `.nav-item` sin `min-block-size` explícito: depende del `height` del contenedor. Funciona, pero al crecer la etiqueta (escalado del sistema) el texto se recorta porque no hay `overflow` ni `flex-wrap`.
- `.bottom-nav.compact`: **clase inexistente en el CSS** (clase muerta).
- El FAB (`bottom: calc(84px + safe)`) se solapa con el último ítem de la lista en pantallas de 5" y tapa el botón "Cargar más".

**Propuesta:** `--nav-h: calc(64px + var(--safe-bottom))`; FAB a `calc(var(--nav-h) + 16px)`; añadir `min-block-size: 56px` + `padding-block: 6px` en `.nav-item`; eliminar `.compact` o definirla.

### 2.3 Header (`index.html:28-68`)

- El `<header>` tiene **estilos inline que contradicen el CSS**: `background: var(--bg-card)` (token inexistente) y un `box-shadow` de lima al 20% permanente. El CSS (`:118`) define `rgba(0,0,0,.88)` + blur. Resultado: dos fuentes de verdad distintas.
- `#header-menu-btn` mide ~32px de alto (`padding: 6px 16px`) → **por debajo de 44px**.
- El botón no tiene nombre accesible: solo contiene SVG (sin `aria-label`).
- El dropdown (`:42`) es `width: 160px` fijo y cada ítem ~42px de alto → justo por debajo de 44.

**Propuesta:** mover todo a `.header-pill` en CSS, `min-height: 44px`, `aria-label="Menú de navegación"` + `aria-expanded`, ítems a `min-height: 48px`, `animate-in` reutilizando `slideUp`.

---

## 3. Ergonomía y formularios

### 3.1 Pantalla "Nueva Pesada" (`pesadas-ui.js:46-183`)

Es la pantalla crítica: se usa decenas de veces al día con guantes, a pleno sol, junto a una báscula.

**Diagnóstico**

| # | Problema | Línea | Impacto |
|---|---|---|---|
| 1 | Etiqueta dice **"PESO NETO (KG)"** pero el `id` es `p-bruto` y se persiste como `pesoBruto` | `:73`, `:161-167` | Riesgo de doble descuento de tara |
| 2 | `type="number"` sin `inputmode` ni `enterkeyhint` | `:74` | Teclado no óptimo, sin tecla "siguiente" |
| 3 | `.input-hero` recibe **11 declaraciones inline** que anulan el token | `:74` | Fondo transparente (bug 1.1) |
| 4 | Calidades solo por color + abreviatura "1ª / Bo / Re" | `:93-101` | WCAG 1.4.1 (color como único indicador) |
| 5 | Sin `aria-pressed` en las pastillas de calidad | `:93-101` | TalkBack no anuncia la selección |
| 6 | El CTA "GUARDAR PESADA" está **al final** del formulario, bajo el teclado | `:107` | Requiere scroll con el teclado abierto |
| 7 | Tras guardar: solo un toast + salto a `/lista` | `:171-173` | No confirma saca nº ni quintales |
| 8 | Aviso >1500 kg **no bloquea** el guardado | `:130-133` | Dato erróneo persistido |
| 9 | `t = 0` hardcodeado (tara eliminada) pero el modelo sigue enviando `tara` | `:162` | Deuda semántica |
| 10 | Autofocus 300 ms + `click()` sintético | `:177-182` | En Android a veces duplica el teclado o hace scroll brusco |
| 11 | Fecha y Nº Saca en `grid-2` a 48px de alto | `:50-59` | 48px ✔, pero el label de 0.75rem se pierde |
| 12 | `body.full-screen-mode` oculta header y nav → **sin salida superior** | `router.js:30-31` | El usuario debe bajar hasta "Cancelar" |

**Propuesta de rediseño (sin cambiar la lógica de datos)**

```
┌ ← Cancelar                    PESADA #143 ┐   ← barra superior fija 48px
│ Zona:  [ Pol. 809 / Par. 275        ▾ ]   │
│                                           │
│              1 4 8 . 5                    │   ← héroe 96px, tabular-nums
│              KG · BRUTO                   │
│                  ═══ 3,23 Q               │   ← conversión en vivo, 1.5rem
│                                           │
│    ┌─────────┐ ┌─────────┐ ┌─────────┐    │
│    │ PRIMERA │ │ BORNIZO │ │ REFUGO  │    │   ← 3 botones 72×56 con texto
│    └─────────┘ └─────────┘ └─────────┘    │
│                                           │
├───────────────────────────────────────────┤
│        [ GUARDAR Y SIGUIENTE ]            │   ← sticky bottom, 64px
└───────────────────────────────────────────┘
```

Puntos concretos:

1. **Corregir la semántica:** renombrar `p-bruto` → `p-peso`, etiqueta "PESO EN BÁSCULA (KG)" y mostrar explícitamente `bruto − tara = neto` si la tara vuelve a existir. (AGENTS.md §6 exige auditoría semántica previa.)
2. `input type="text" inputmode="decimal" enterkeyhint="done" pattern="[0-9.,]*"` — evita los *spinners* de `type=number` y fija el teclado decimal.
3. CTA **sticky** (`position: sticky; bottom: 0`) dentro del formulario, siempre visible con el teclado abierto.
4. Calidades: botón 72×56 con **texto completo** ("Primera", "Bornizo", "Refugo") + `aria-pressed`. El color pasa a ser refuerzo, no información única.
5. Tras guardar: pantalla/toast de confirmación con `SACA #143 · 3,23 Q · 1ª` y botón primario "Nueva pesada" (flujo de repetición rápida).
6. Bloqueo real si `b === 0` o `b > 1500` (con "Guardar de todas formas" tras confirmación), no solo un texto amarillo.
7. Sustituir el `setTimeout(focus)` por `autofocus` + `inert` en la barra superior, y evitar el `click()` sintético.

**Esfuerzo estimado:** 1 sesión de trabajo. **Impacto:** el mayor de todo el informe.

### 3.2 Filtros de listado

`filter-chips` (`styles.css:1142-1176`): `padding: 8px 16px` → altura ≈ 33px, **por debajo de 44px**.

**Propuesta:** `min-height: 44px; padding: 0 18px;` + `scroll-snap-type: x proximity` en el contenedor para que el chip activo quede alineado tras el scroll.

### 3.3 Formularios secundarios

- `zona` (`zonas-ui.js:82-96`): `Polígono`, `Parcela`, `Superficie` como `type="number"` sin `inputmode="numeric"`.
- `gasto` (`gastos-ui.js`): `Monto (€)` con `type="number" step="0.01"` → mismo problema.
- Todos los campos tienen `height: 56px` fijo: al escalar la fuente del sistema el texto se recorta. Cambiar a `min-height: 56px` + `padding-block: 12px`.
- No hay `autocomplete` en ningún campo (`tel`, `email`, `organization` serían útiles en Ajustes).

---

## 4. Tablas y datos complejos

### 4.1 Listado de pesadas (`pesadas-ui.js:257-289`)

**Diagnóstico**

El CSS define un sistema completo de fichas (`.pesada-card`, `.pesada-card-inner`, `.pesada-card-header`, `.pesada-card-values`) en `styles.css:739-841` que **el JS nunca usa**. En su lugar se emite:

```html
<div class="pesada-card-content">
  <table class="pesada-table-bordered"> ... </table>
</div>
```

Ninguna de esas dos clases existe en el CSS. Consecuencia: los registros se renderizan como **tablas HTML por defecto** (bordes colapsados, sin padding, `th` en negrita alineado a la izquierda) dentro de la tarjeta de swipe. Es el mayor desajuste visual de la app.

Además:

- `p.kg` y `p.quintales` se muestran con la misma jerarquía que la fecha → el dato importante (quintales) no destaca.
- La fecha se formatea completa (`dd/mm/aaaa, hh:mm`) con `white-space: nowrap` → ocupa el 60% de la fila.
- Sin agrupación por día/zona.
- `.pesada-swipe-actions` solo cubre 70px a la derecha; no hay acción de eliminar (existe `_deletePesada` pero inalcanzable desde la lista).
- `_setupSwipeOnCards()` se vuelve a ejecutar sobre **todas** las tarjetas en cada "Cargar más" (`:409`) → se añaden listeners duplicados (el `click` se dispara 2, 3, 4 veces).

**Propuesta**

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

- Quintales a 1.5rem/900 y el kg a 0.85rem/600.
- Fecha relativa ("hace 2 h", "ayer 17:42") con `<time datetime>`.
- Swipe conservado, pero con **alternativa visible**: menú `⋯` de 44px o botón de editar dentro de la ficha (sin él, el gesto es la única vía y falla si hay scroll horizontal).
- Corregir el doble registro de listeners (guardar `dataset.bound = '1'` o usar delegación de eventos en el contenedor).

### 4.2 Informes económicos (`reportes-ui.js:90`)

La tabla de "Ingresos por Calidad" tiene **6 columnas** (Calidad, Precio, Q.Bruto, Oreo, Q.Neto, Total). Con `.reporte-table { min-width: max-content }` + `td { white-space: nowrap }`, en un móvil de 360px se fuerza scroll horizontal de ~520px → el usuario ve la etiqueta **o** el total, nunca ambos: pierde la relación fila↔cabecera.

`styles.css:915-974`:
- sin `position: sticky` en `thead`
- sin `caption` ni `scope="col"`
- `.table-responsive` sin `tabindex="0"` ni `role="region"` → no se puede desplazar con teclado
- sin modo apilado

**Propuesta (guía `responsive-table`)**

1. `<th scope="col">`, `<caption>` visible o `aria-label` en el wrapper.
2. `.table-wrapper { container-type: inline-size; overflow: auto; tabindex="0"; role="region" }`.
3. `thead { position: sticky; inset-block-start: 0; z-index: 1 }`.
4. Por debajo de 560px:

```css
@container (width < 560px) {
  thead { display: none; }                    /* obligatorio: fuera del layout y del lector */
  tr { display: grid; gap: 6px; padding: 12px; border: 1px solid var(--border); border-radius: 12px; margin-block-end: 10px; }
  td { display: flex; justify-content: space-between; border: 0; white-space: normal; }
  td::before { content: attr(data-label); color: var(--text-s); font-weight: 700; }
}
```

con `data-label` inyectado desde el mismo array de cabeceras que ya se conoce en `reportes-ui.js`. Resultado: cada calidad se lee como una tarjeta `Precio … 42,00 €`, sin scroll lateral.

### 4.3 Zonas SIGPAC (`zonas-ui.js:36-39`)

```html
<table class="reporte-table" style="font-size:0.8rem;">
  <thead><tr><th>Sub</th><th>Aprovechamiento</th><th>Int</th><th>Sup. m²</th></tr></thead>
```

- Encabezados abreviados sin unidad ni ayuda ("Sub", "Int") — y 0.8rem por debajo del suelo.
- Sin `<caption>`; la tabla se lee fuera de contexto con TalkBack.
- La ficha de zona muestra 4 tarjetas apiladas (datos, croquis, cultivos, producción) sin índice ni anclas: en una parcela con muchos cultivos, "Producción Acumulada" queda a 3 pantallas de scroll.
- `croquisBlob` genera `URL.createObjectURL` (`:29`) que solo se revoca en `router.route()`; navegar dentro de la ficha acumula blobs.

**Propuesta:** tabla apilada con etiquetas completas ("Subparcela", "Aprovechamiento", "Intensidad", "Superficie (m²)"); índice de secciones con `scroll-snap` o acordeón `<details>`; resolver el blob en un `Img` componente que revoque en `disconnectedCallback`.

---

## 5. Microinteracciones y feedback

### 5.1 Estados de carga

- **Skeleton:** existen 6 variantes en `styles.css:1308-1342`, pero solo se usan en Dashboard y Lista. `reportes-ui.js` y `fincas-ui.js` cargan con `<div class="loader">Cargando...</div>` síncrono.
- `.loader` es un texto centrado, no un spinner: el `.spinner` de `:1641` requiere borde lima y **no se usa en el loader global** (`utils.js:21` añade `.loader` en vez de `.spinner`).
- `Utils.showLoading()` (overlay modal `rgba(0,0,0,.7)`) se usa en la importación de PDF → bloquea toda la app en un proceso que puede durar 10 s sin progreso ni cancelación.

**Propuesta:** `.loader` → spinner real + texto; `showLoading` con `role="status" aria-live="polite"`; barra de progreso determinada en la importación (nº de PDF procesados / total).

### 5.2 Toasts

```js
// utils.js:12
t.className = 'toast error animate-in';   // clases: .toast y .error
```
```css
/* styles.css:1246 */
.toast-error { ... }                      /* nunca coincide */
```

Los errores se muestran como un toast neutro y, al ser `position: fixed; bottom: 100px` fijo, **quedan tapados por el teclado** en Nueva Pesada.

**Propuesta:** `toast toast--error` + `bottom: calc(var(--nav-h) + 16px)`; `role="status"`; icono + texto (no solo color); duración según longitud.

### 5.3 Pull-to-refresh (`pesadas-ui.js:360-398`)

Tres fallos encadenados:
1. `.ptr-container`, `.ptr-indicator`, `.ptr-spinner` **no existen en el CSS** → el indicador nunca se ve.
2. `container.scrollTop > 0` se evalúa sobre `#ptr-list`, que no es el contenedor de scroll (scrollea `body`) → **siempre es 0**.
3. Por tanto, cualquier gesto hacia abajo de +30 px en la lista dispara `renderLista()` completo con vibración.

**Propuesta:** usar el contenedor real (`window.scrollY === 0`), añadir `overscroll-behavior-y: contain` y las tres clases al CSS, o **eliminar el gesto** (la lista ya tiene "Cargar más").

### 5.4 Estado offline y persistencia

No existe ni una referencia a `navigator.onLine`, `@capacitor/network` ni un badge de sincronización (`grep` sobre todo `www/` = 0 resultados). Hay `.offline-badge` y `.status-dot-offline` en CSS (`styles.css:1439-1464`) **sin ningún consumidor**.

Para una app cuyo valor es "funciona sin cobertura", el silencio es el peor mensaje: el usuario no sabe si sus 40 pesadas están a salvo.

Además, la exportación de PDF (`index.html:23`) carga `html2pdf` desde **cdnjs.cloudflare.com**, y `vite.config.js:21` solo cachea `cdn.jsdelivr.net`:

```js
runtimeCaching: [{ urlPattern: /^https:\/\/cdn\.jsdelivr\.net\/.*/i, ... }]
```

→ **la exportación de PDF falla sin red** en la primera ejecución tras instalar, aunque `xlsx` y `chart.js` sí estén cacheados.

**Propuesta**

1. Badge persistente en header: `● Sin conexión · 12 registros guardados` (usando `.offline-badge` ya existente) y `⇅ Guardado local` tras cada escritura.
2. `navigator.onLine` + `online`/`offline` + `Capacitor.Network` para el estado real.
3. Ampliar `urlPattern` a `/^https:\/\/(cdn\.jsdelivr\.net|cdnjs\.cloudflare\.com)\//i` y precachear con `globPatterns` los scripts locales si se mueven a `www/js/vendor/`.
4. Indicador de "backup pendiente": comparar `lastBackupAt` con `lastWriteAt` y mostrar "Hace 6 días sin copia" en el dashboard.

### 5.5 Estados vacíos

`Utils.renderEmptyState` está bien resuelto (icono, título, mensaje, CTA) y se usa en Dashboard, Lista y Zonas. Incoherencias:

- Se invoca siempre con `icon: ''` → siempre cae en el SVG por defecto. El parámetro es decorativo.
- El layout de Dashboard añade el CTA de importar PDF **fuera** del componente (`zonas-ui.js:19`), rompiendo la alineación.
- `renderEmptyState` con `actionText` sin `actionRoute` usa `onclick="window.location.hash='#/nueva'"` (`utils.js:87`): navegación hardcodeada que ignora el router.

---

## 6. Accesibilidad estructural (transversal)

| Aspecto | Estado |
|---|---|
| `role="button"` / `tabindex` en tarjetas clicables | **ausente** — todas las tarjetas de dashboard, informes y zonas son `<div data-route>` (`events.js:17`) |
| Nombres accesibles en botones con solo icono | solo nav y FAB (`index.html:75-97`); el menú del header, las acciones de swipe y los botones de calidad no lo tienen |
| `aria-live` | ausente en toasts, loader y estados vacíos |
| `aria-pressed` | ausente en calidad y filtros |
| Foco visible | `:focus-visible` global correcto (`styles.css:105`) pero los `<div>` clicables nunca lo reciben |
| Idioma / títulos | `lang="es"` ✔; jerarquía de `h2/h3/h4` inconsistente entre pantallas |
| Zoom | **bloqueado** (§1.5) |

**Propuesta:** convertir las tarjetas-acción en `<button type="button">` reales (o `<a href="#/ruta">`, que además da historial y "abrir en pestaña"). El cambio se hace **una vez** en cada módulo y arregla teclado, TalkBack y el foco de golpe.

---

## 7. Plan de refactorización por fases

> Orden deliberado: primero los tokens (porque todo lo demás depende de ellos), después la pantalla que genera valor diario.

### Fase 0 — Congelar y medir (30 min, sin cambios de UI)

- Crear una rama `refactor/ui-tokens`.
- Corregir el cache-busting: `styles.css?v=7.0.0` (`index.html:10`) frente a `version: 8.0.0` en `package.json`.
- Capturas de referencia de las 7 pantallas (`docs/` ya contiene un buen set).
- **Criterio de salida:** baseline visual guardado.

### Fase 1 — Tokens globales (1 sesión) ◀ **empezar aquí**

| Cambio | Archivo |
|---|---|
| Definir `--bg-surface`, `--bg-surface-focus` | `styles.css:10-69` |
| Eliminar los 15 `rgba(212,163,115,…)` → `--glow-accent`, `--ring-accent` | `styles.css` |
| Unificar alias: eliminar `--accent`, `--text-high`, `--radius`, `--radius-lg`, `--border-default` dejando un nombre canónico por concepto | `styles.css:12-58` |
| Escala tipográfica: suelo 12px, `clamp()` en nav y KPIs | `styles.css` |
| `--border` → `#4A4A4A`, `--text-s` → `#A8B4C4`, `--danger` → `#FF6B6B` | `styles.css:23-38` |
| `color-scheme: dark` + `@media (prefers-reduced-motion)` + `@media (forced-colors: active)` | `styles.css` (nuevo bloque final) |
| `viewport-fit=cover`, quitar `user-scalable=no`/`maximum-scale` | `index.html:5` |
| `theme-color` `#a0673a` → `#CCFF00` | `index.html:6` |
| `min-height` en vez de `height` en inputs y botones | `styles.css:386-520` |
| Añadir al CSS las clases huérfanas de bajo riesgo: `bento-grid`, `error-card`, `list-counter`, `confirm-icon`, `entity-title/-sub/-meta`, `welcome-wizard`, `wizard-actions`, `welcome-checkbox-container`, `tour-step-content`, `graficos-grid`, `tour-dot` | `styles.css` |
| Matar `.card svg { stroke: … }` global; el color va por clase (`text-lime`, `text-red`…) | `styles.css:212` |
| `:where(button, select, input:not(...), nav a) { min-block-size: 44px }` bajo `@media (pointer: coarse)` | `styles.css` |

**Criterio de salida:** inputs con fondo visible; ningún `rgba(212,163,115)`; `npm run build` sin warnings; captura antes/después de Ajustes y Nueva Pesada.

### Fase 2 — Nueva Pesada (1 sesión) ◀ **segunda**

1. `inputmode="decimal"`, `enterkeyhint`, `type="text"` en el campo de peso.
2. Eliminar los 11 estilos inline del `.input-hero` y del contenedor.
3. Calidades como 3 botones con texto completo + `aria-pressed`.
4. CTA sticky inferior + barra superior con "Cancelar" (elimina el secuestro de `full-screen-mode`).
5. Confirmación post-guardado con saca, quintales y calidad + "Nueva pesada".
6. Validación bloqueante de 0 kg / >1500 kg.
7. Renombrar semánticamente `p-bruto` → `p-peso` y `pesoBruto` → `pesoBascula` (con migración en `Pesadas.save`).

**Criterio de salida:** flujo completo de 20 pesadas seguidas sin scroll; contraste ≥7:1 en el campo héroe; teclado decimal abierto al entrar; target mínimo 44px verificado.

### Fase 3 — Listado de pesadas (1 sesión)

1. Implementar las fichas `.pesada` descritas en §4.1 (o resucitar el sistema `.pesada-card` ya escrito).
2. Fecha relativa + `<time>`.
3. Alternativa al swipe (botón 44px).
4. Corregir listeners duplicados en "Cargar más".
5. Arreglar o eliminar el pull-to-refresh.

**Criterio de salida:** 20 fichas legibles a 320px sin scroll horizontal; jerarquía quintales > kg > fecha verificada.

### Fase 4 — Dashboard y feedback (1 sesión)

1. Fusionar "Campaña" + "Hoy" con delta.
2. Eliminar la retícula 2×2 duplicada de navegación.
3. Skeleton que coincida con el layout final.
4. Indicador de conexión + estado de backup.
5. `toast toast--error` + `aria-live` + posición sobre el teclado.

**Criterio de salida:** CLS < 0.02 al cargar; el usuario sabe sin scroll si está offline y cuándo exportó por última vez.

### Fase 5 — Informes y SIGPAC (1–2 sesiones)

1. Tablas apiladas por `@container`, `caption`, `scope`, `sticky thead`, `tabindex="0"`.
2. Ampliar el `urlPattern` del service worker a `cdnjs.cloudflare.com`.
3. Índice de secciones en la ficha de zona.
4. Revocación de blobs en la ficha de zona.

**Criterio de salida:** liquidación económica legible en 360px sin scroll lateral; PDF exportable en modo avión.

### Fase 6 — Accesibilidad estructural (1 sesión)

1. `<div data-route>` → `<a href>` / `<button>` en todos los módulos.
2. `aria-label` en botones icono.
3. Revisión de jerarquía `h2 → h3 → h4`.

**Criterio de salida:** recorrido completo con TalkBack y con teclado externo.

---

## 8. Anexo — Clases usadas en JS sin definición CSS

```
active-finca, bento-grid, btn-modern-action, centered, compact, confirm-icon,
dropdown-item, entity-meta, entity-sub, entity-title, error-card, finca-card,
form-actions, graficos-grid, header-center-menu, label, list-counter,
list-item-detallado, lista-detallada, never-edit, pesada-card-content,
pesada-table-bordered, ptr-container, ptr-indicator, ptr-spinner,
quality-selector-centered, reporte-container, small, stat-grid, stop-prop,
tour-step-content, val-large, welcome-checkbox-container, welcome-wizard,
wizard-actions
```

(Excluidas las que son modificadores de estado generados dinámicamente: `active`, `selected`, `primera`, `bornizo`, `refugo`.)

Prioridad: `pesada-card-content` y `pesada-table-bordered` (afectan a cada registro), `ptr-*` (afectan a cada gesto), `error-card` (solo en fallo de arranque).

---

### Modern Web Guidance

- **`form-factor-adaptation`**: apliqué el mínimo de 44px bajo `pointer: coarse` a chips, ítems del menú del header y botones de calidad, y `min-block-size` en lugar de `height` fijo en todo lo que contiene texto, para que el escalado de fuente del sistema no recorte etiquetas ("Use `min-block-size` instead of a fixed `height` on anything that contains text."). También conecté `viewport-fit=cover` con padding por `env(safe-area-inset-*)` en header, nav y FAB ("Pad UI anchored to the top edge the same way with `safe-area-inset-top`.").
- **`color`**: el diagnóstico de contraste se hizo con 4.5:1 para texto y 3:1 para límites de control, que es lo que reveló que `--border: #333333` sobre `#1E1E1E` da 1.35:1 y por tanto el borde de los inputs no es perceptible para localizarlos ("Maintain a minimum contrast ratio of 3:1 for user interface component boundaries and states"). Además propuse texto completo en las pastillas de calidad en lugar de solo color, para no codificar la selección únicamente por tono ("Don't use color alone to indicate the presence of a user interface component or its state").
- **`responsive-table`**: propuse el modo apilado por `@container` con `thead { display: none }` obligatorio e inyección de etiquetas por `::before`, que es lo que evita el scroll lateral de 520px en la liquidación económica ("the `<thead>` is hidden, and accessible headers are injected into each cell using `::before` pseudo-elements and CSS variables."). También añadí `sticky` en cabeceras y `tabindex="0"` + `role="region"` en el wrapper.
- **`forms`**: sustituí `type="number"` por `type="text"` + `inputmode="decimal"` en el campo de peso, porque los *spinners* nativos roban ancho útil y el teclado no es el óptimo ("use `type="text"` with `inputmode="numeric"` (`type=number` adds spinner buttons)"), y añadí `enterkeyhint` para cerrar el teclado desde la acción primaria ("**DO** use `enterkeyhint` to set the Enter key label").
- **`motion`**: envolví `fabPulse`, `shimmer` y `slideUp` en `prefers-reduced-motion`, porque el pulso del FAB corre indefinidamente y el shimmer de los skeletons se repite mientras dura la carga ("Always respect reduced motion preferences.").
