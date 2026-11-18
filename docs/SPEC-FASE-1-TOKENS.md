# SPEC — Fase 1: Tokens globales y reglas base

| Campo | Valor |
|---|---|
| **ID** | `SPEC-UI-001` |
| **Fase** | 1 de 7 (ver `AUDITORIA-UIUX-CORK-MANAGER.md` §7) |
| **Estado** | Borrador para revisión — 2 decisiones abiertas (§5.4) |
| **Riesgo** | Bajo — sin cambios de lógica ni de datos |
| **Archivos afectados** | `www/css/styles.css`, `www/index.html`, 4 módulos JS (solo sustitución de tokens) |
| **Datos afectados** | Ninguno (no se toca IndexedDB, esquema ni migraciones) |

---

## 1. Objetivo

Dejar el sistema de diseño **consistente, definido y verificable**: un único nombre canónico por concepto, cero tokens rotos, cero restos de la paleta antigua, contraste medido para uso en exterior y preferencias del sistema atendidas.

Es la base de la que dependen las fases 2–6. Si los tokens no son fiables, cada pantalla seguirá resolviendo el estilo a mano.

## 2. No objetivos (fence de alcance)

Queda **explícitamente fuera** de esta fase:

- Rediseñar cualquier pantalla (Nueva Pesada → Fase 2, Listado → Fase 3, Dashboard → Fase 4).
- Eliminar los 377 estilos inline de los módulos JS (Fases 2–5).
- Añadir clases de componente que hoy faltan (`pesada-table-bordered`, `ptr-*`, `error-card`…). Cada una pertenece a la fase de su pantalla.
- Eliminar CSS muerto (`.metric-card`, `.summary-grid`, `.widget-link-btn--neon`…). Se documenta en §9 pero no se borra.
- Cambiar `package.json`, `vite.config.js` o el service worker.
- Tocar `dist/` ni `android/` (se regeneran con `npm run cap:sync`).

## 3. Estado actual medido

```
Tokens definidos en :root ................ 44
Tokens con al menos un uso real .......... 32
Tokens definidos y nunca usados .......... 12
Referencias a tokens NO definidos ........  4  (--bg-surface)
Valores rgba(212,163,115,…) [marrón v6] .. 15
Reglas font-size < 12px .................. 13
Declaraciones height fijo en controles ... 10
Atributos style= inline en módulos UI .... 377
```

Detalle de uso por token (CSS / JS):

| Token | CSS | JS | Veredicto |
|---|---|---|---|
| `--p-cork` | 31 | 13 | **Canónico** de marca |
| `--accent` | 11 | 14 | Alias redundante → eliminar |
| `--text-s` | 4 | 4 | **Canónico** de texto secundario |
| `--text-secondary` | 8 | 0 | Alias → eliminar |
| `--text-high` | 2 | 0 | Alias de `--text-p` → eliminar |
| `--text-muted` | 9 | 0 | Alias de `--text-s` → **se conserva y se separa** |
| `--border` | 12 | 13 | **Canónico** decorativo |
| `--border-default` | 4 | 0 | Alias → eliminar |
| `--radius` | 1 | 0 | Duplicado de `--radius-lg` → eliminar |
| `--radius-lg` | 13 | 0 | **Canónico** |
| `--c-success/-warning/-danger/-info` | 1 c/u | 0 | Alias → eliminar |
| `--bg` | 1 | 0 | **Canónico** |
| `--surface` / `--surface-light` | 7 / 7 | 2 / 2 | **Canónicos** |
| `--bg-surface` | 4 | 0 | **Roto** — nunca definido |

**Sin uso (12):** `--p-cork-dark`, `--bg-deep`, `--surface-glass`, `--border-subtle`, `--warning-bg`, `--info-bg`, `--color-metric-primary`, `--color-metric-warning`, `--color-metric-danger`, `--color-metric-info`, `--tap-gap`, `--shadow-md`.

> `--surface-glass` se conserva (reservado por AGENTS.md §3C). Los otros 11 se eliminan.

## 4. Decisiones de diseño

**D1 — Un nombre canónico por concepto.**
Se conserva el nombre más usado y se migran los alias de forma mecánica. No se renombra `--p-cork` → `--brand` aunque sería más limpio: 44 puntos de uso para cero ganancia visual.

**D2 — Superficies opacas, no translúcidas, en los inputs.**
`--bg-surface` se define como color opaco `#242424`. Sobre una tarjeta `#1E1E1E` el resultado compuesto de un `rgba(255,255,255,.03)` es ≈`#232323` — visualmente idéntico — pero el valor opaco elimina la ambigüedad al medir contraste y no depende de `backdrop-filter` (coste de GPU en Android de gama media). `--surface-glass` se conserva para overlays reales.

**D3 — El borde del control es quien cumple 1.4.11, no el relleno.**
El relleno `#242424` sobre tarjeta `#1E1E1E` da 1.10:1 — insuficiente por sí solo. Se introduce `--border-control: #777777` (3.72:1 sobre tarjeta, 3.47:1 sobre el relleno) aplicado **solo** a campos de formulario. Los bordes decorativos de tarjeta siguen en `#333333`: son ornamentales, no identifican un control.

**D4 — Tintes del acento como tokens explícitos, no `color-mix()` en cada regla.**
Seis tokens de tinte cubren los 15 restos marrones y permiten revisar el diff línea a línea. `color-mix()` queda disponible para trabajo nuevo, pero no se introduce aquí porque mezcla dos cambios (color y técnica) en el mismo diff.

**D5 — Suelo tipográfico de 12px.**
Todo texto funcional sube a ≥12px mediante una escala de 7 pasos. Los `10px` fijos de la nav pasan a `clamp()` para respetar el escalado de texto del sistema.

**D6 — `min-height` en lugar de `height` en todo lo que contiene texto.**
Con el escalado de fuente de Android al 130%, un `height: 56px` recorta la etiqueta. De las 10 declaraciones detectadas, **6 migran** (`.btn`, `.btn-sm`, `input/select`, `.input-hero`, `.quality-*`, `.confirm-actions button`) y **4 se mantienen** por ser geometría fija sin flujo de texto: `.btn-icon` (44×44), `.btn-icon-wrap` (40), `.fab` (60, círculo) y `.skeleton-avatar` (40).

**D7 — Preferencias del sistema: opt-in, no override.**
`prefers-reduced-motion` se aplica con el patrón `no-preference` (animación declarada dentro del bloque), no con `animation: none`, para que el estado por defecto sea el estático.

**D8 — El zoom no se bloquea.**
Se elimina `maximum-scale=1.0, user-scalable=no`. Consecuencia asumida: se añade `viewport-fit=cover` y se aseguran los `env(safe-area-inset-*)` ya existentes.

**D9 — Esta fase migra referencias a tokens, no literales de color en JS.**
Los `#CCFF00`, `#FFD700`, `#4FACFE`, `#F97316` escritos a mano en los módulos inline se sustituirán por tokens **en la fase de su pantalla**. Migrarlos ahora sin tocar el resto del inline crearía un diff de 48 líneas dispersas sin ganancia funcional.

## 5. Especificación de tokens

### 5.1 Correcciones técnicas (sin cambio de identidad visual)

```css
:root {
  /* Superficies */
  --bg:            #121212;
  --surface:       #1E1E1E;
  --surface-light: #2A2A2A;
  --bg-surface:    #242424;   /* ← NUEVO: hoy la referencia está rota */
  --surface-glass: rgba(255,255,255,0.03);   /* reservado AGENTS.md §3C */

  /* Bordes */
  --border:         #333333;  /* decorativo, sin cambio */
  --border-control: #777777;  /* ← NUEVO: 3.72:1, WCAG 1.4.11 */

  /* Tintes del acento (sustituyen los 15 restos marrones) */
  --accent-bg:      rgba(204,255,0,0.10);
  --accent-line:    rgba(204,255,0,0.20);
  --accent-border:  rgba(204,255,0,0.30);
  --ring-accent:    rgba(204,255,0,0.12);
  --glow-accent:    rgba(204,255,0,0.35);
  --glow-accent-hi: rgba(204,255,0,0.55);

  /* Radios (se elimina --radius, duplicado de --radius-lg) */
  --radius-sm: 8px; --radius-md: 12px; --radius-lg: 16px;
  --radius-xl: 20px; --radius-full: 9999px;

  /* Tipografía */
  --fs-2xs: 0.75rem;   /* 12px — SUELO ABSOLUTO */
  --fs-xs:  0.8125rem; /* 13px */
  --fs-sm:  0.875rem;  /* 14px */
  --fs-md:  1rem;      /* 16px */
  --fs-lg:  1.25rem;
  --fs-xl:  1.75rem;
  --fs-2xl: 2.5rem;

  /* Interacción */
  --touch-min: 48px;
  --safe-top:    env(safe-area-inset-top);
  --safe-bottom: env(safe-area-inset-bottom, 0px);
  --nav-h:       calc(64px + var(--safe-bottom));

  color-scheme: dark;
}
```

Este bloque **sustituye** al `:root` actual, pero hay tokens que se conservan tal cual y no deben desaparecer al reescribirlo:

```css
--p-cork: #CCFF00; --p-cork-dark: #AACC00;      /* marca */
--text-p: #FFFFFF;
--success: #10b981; --warning: #FFD600;         /* semánticos (§1) */
--danger:  #FF4444; --info: #3b82f6;            /* ← peligro/info, ver §5.2 y §5.3 */
--danger-bg: rgba(255,68,68,.08);
--success-bg: rgba(16,185,129,.08);
```

⚠️ Si Q2 se resuelve a favor de `#4FACFE`, `--info-bg` debe pasar a `rgba(79,172,254,.08)` para no quedar desalineado.

### 5.2 Cambios de paleta — **requieren tu aprobación**

Tres valores propuestos **contradicen el AGENTS.md §1**. Es la parte del spec que necesita revisión:

| Token | AGENTS.md §1 | Actual CSS | Propuesta | Motivo | Ratio |
|---|---|---|---|---|---|
| `--text-s` | `#94A3B8` "Gris Acero" | `#94A3B8` | **`#B4C0CE`** | 6.50:1 no da margen en exterior; 9.03:1 sí | 6.50 → **9.03** |
| `--text-muted` | (= `--text-s`) | = `--text-s` | **`#94A3B8`** | Hoy son el mismo color: no existe jerarquía. Pasa a ser el valor antiguo → ningún texto se vuelve más oscuro | **6.50** |
| `--danger` | `#FF4444` "Rojo Neón" | `#FF4444` | **`#FF6B6B`** | 4.89:1 es el único token que roza el mínimo AA | 4.89 → **6.01** |

**Recomendación:** aprobar `--text-s` y `--text-muted` (mejora con riesgo cero y sin oscurecer nada), y **rechazar** `--danger` → mantener `#FF4444` según AGENTS.md, resolviendo su legibilidad en la Fase 4 con icono + peso tipográfico en lugar de cambiando el color de marca.

**Alcance real de la mejora (medido, no prometido):** `var(--text-s)` solo se usa en **4 reglas CSS**. Las etiquetas secundarias de las pantallas no pasan por el token: usan la clase `.text-grey` con `#94A3B8` escrito a mano, en **43 puntos de JS**. Por tanto Q1(a) mejora el contraste de 4 reglas y deja las 43 etiquetas en 6.50:1 → la ganancia real en exterior llega en las Fases 2–5, al eliminar los literales. Ver §8.7 y §9 para el palanca disponible.

### 5.3 Alineación de `--info` — decisión menor

`AGENTS.md §1` fija Info = `#3b82f6`, pero la interfaz usa `#4FACFE` en 8 puntos de JS y en `.text-blue`. El token quedó con el valor del documento y **nunca se usa**: el azul real de la app es `#4FACFE`.

**Propuesta:** fijar `--info: #4FACFE` (documenta la realidad) y actualizar la línea del AGENTS.md. Alternativa: forzar `#3b82f6` (cambio visual en toda la app).

### 5.4 Decisiones abiertas (bloquean la aprobación)

| ID | Decisión | Opciones |
|---|---|---|
| **Q1** | ¿Se aprueban los cambios de paleta de §5.2? | (a) sí a `--text-s` y `--text-muted`, no a `--danger` *(recomendado)* · (b) sí a los tres · (c) ninguno |
| **Q2** | ¿`--info` se alinea a `#4FACFE`? | (a) sí, y se actualiza AGENTS.md *(recomendado)* · (b) no, se fuerza `#3b82f6` |

## 6. Mapa de migración

Sustituciones mecánicas, sin cambio de valor semántico:

| Alias eliminado | → Canónico | Reemplazos |
|---|---|---|
| `--accent` | `--p-cork` | 25 (11 CSS + 14 JS) |
| `--text-secondary` | `--text-s` | 8 (CSS) |
| `--text-high` | `--text-p` | 2 (CSS) |
| `--border-default` | `--border` | 4 (CSS) |
| `--radius` | `--radius-lg` | 1 (CSS) |
| `--c-success` | `--success` | 1 (CSS) |
| `--c-warning` | `--warning` | 1 (CSS) |
| `--c-danger` | `--danger` | 1 (CSS) |
| `--c-info` | `--info` | 1 (CSS) |
| `--theme-color` | *(eliminar regla)* | 1 (CSS) |

**Total: 45 reemplazos.** Verificable con:

```bash
grep -rn -- "--accent\|--text-secondary\|--text-high\|--border-default\|--c-success\|--c-warning\|--c-danger\|--c-info\|--theme-color" www/css www/js www/index.html
grep -rn "var(--radius)" www/css www/js www/index.html
```

→ ambas deben devolver **0 resultados**.

> `var(--radius)` se verifica por separado y con paréntesis: un `grep "--radius"` genérico coincidiría también con `--radius-md/-lg/-xl/-full` y daría falsos positivos.

## 7. Los 15 restos marrones

| Línea | Selector | Actual | Nuevo |
|---|---|---|---|
| 508 | `.form-section-title` | `rgba(212,163,115,0.2)` | `var(--accent-line)` |
| 527 | `input:focus` | `0 0 0 3px rgba(212,163,115,0.1)` | `var(--ring-accent)` |
| 556 | `.input-hero:focus` | `0 0 0 4px rgba(212,163,115,0.12)` | `var(--ring-accent)` |
| 876 | `.summary-cell-cbo` | `rgba(212,163,115,0.1)` | `var(--accent-bg)` |
| 877 | `.summary-cell-cbo` | `rgba(212,163,115,0.3)` | `var(--accent-border)` |
| 1119 | `theme-zona` | `rgba(212,163,115,0.3)` | `var(--accent-border)` |
| 1120 | `theme-zona` | `rgba(212,163,115,0.04)` | `var(--accent-bg)` |
| 1123 | `theme-zona .btn-icon-wrap` | `rgba(212,163,115,0.1)` | `var(--accent-bg)` |
| 1169 | `.filter-chip.active` | `rgba(212,163,115,0.12)` | `var(--ring-accent)` |
| 1191 | `.fab` | `0 6px 20px rgba(212,163,115,0.35)` | `var(--glow-accent)` |
| 1202 | `.fab:active` | `0 3px 10px rgba(212,163,115,0.3)` | `var(--glow-accent)` |
| 1216 | `@keyframes fabPulse` 0/100 | `0 6px 20px rgba(212,163,115,0.35)` | `var(--glow-accent)` |
| 1217 | `@keyframes fabPulse` 50 | `0 6px 32px rgba(212,163,115,0.55)` | `var(--glow-accent-hi)` |
| 1604 | `.tour-dot.active` | `rgba(212,163,115,0.4)` | `var(--glow-accent)` |
| 1644 | `.spinner` | `rgba(212,163,115,0.2)` | `var(--accent-line)` |

**Efecto visible:** el anillo de foco, el pulso del FAB y el spinner pasan de marrón a lima. Hoy la app se ilumina en dos colores distintos según el componente.

## 8. Cambios globales puntuales

### 8.1 Inputs y controles

```css
input, select, textarea {
  min-height: 56px;                 /* era height: 56px */
  background: var(--bg-surface);    /* era var() roto → transparente */
  border: 1.5px solid var(--border-control);
  font-size: var(--fs-md);          /* 16px: evita el zoom automático de iOS */
  padding: 12px 16px;
}
input:focus, select:focus, textarea:focus {
  border-color: var(--p-cork);
  background: var(--bg-surface);
  box-shadow: 0 0 0 3px var(--ring-accent);
}
::placeholder { color: var(--text-muted); }
```

### 8.2 Tamaño de objetivo táctil

```css
@media (pointer: coarse) {
  :where(button, select, textarea,
         input:not([type="checkbox"],[type="radio"]),
         nav a, [role="button"]) {
    min-block-size: 44px;
    min-inline-size: 44px;
  }
}
```

`.btn-ghost` (hoy 40px) sube a 44 y `.filter-chip` (hoy ~33px) pasa a `min-height: 44px; padding: 0 18px`.

### 8.3 Iconos dentro de tarjetas

Se **elimina** `.card svg { stroke: #CCFF00; stroke-width: 1.5 }` (`:212`). Hoy sobrescribe el `stroke` inline de todos los iconos de tarjeta: los iconos rojos de Gastos y los azules de Ajustes se pintan de lima, porque un atributo de presentación pierde frente a cualquier regla de autor.

### 8.4 Documento

```html
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#CCFF00">
<link rel="stylesheet" href="css/styles.css?v=8.0.0">
```

### 8.5 Preferencias del sistema

```css
@media (prefers-reduced-motion: no-preference) {
  .fab-pulse  { animation: fabPulse 2.5s infinite; }
  .skeleton   { animation: shimmer 1.8s infinite linear; }
  .animate-in { animation: fadeInUp .35s cubic-bezier(.4,0,.2,1); }
}

@media (forced-colors: active) {
  .card, .btn, input, select, .fab { border: 1px solid ButtonText; box-shadow: none; }
  .fab, .btn-primary { background: ButtonFace; color: ButtonText; }
}

@media (prefers-contrast: more) {
  :root {
    --text-s: #FFFFFF; --text-muted: #E2E8F0;
    --border: #777777; --border-control: #A0A0A0;
  }
}
```

### 8.6 Tipografía

```css
h1, h2, h3 { text-wrap: balance; }
p, li      { text-wrap: pretty; }
body       { overflow-wrap: anywhere; }
```

Mapeo de las 13 reglas bajo el suelo: `0.6rem` → `var(--fs-2xs)`, `0.65rem` → `var(--fs-xs)`, `0.7rem` → `var(--fs-xs)`, y `.nav-item { font-size: 10px }` → `clamp(0.75rem, 3.2vw, 0.8125rem)`.

### 8.7 Clases utilitarias de color (`:72`–`:77`)

Seis clases fijan su color con hex y `!important`. Solo se tokenizan las que **no cambian de valor**; las demás esperan a su pantalla:

| Clase | Actual | Nuevo | ¿Cambia el color? |
|---|---|---|---|
| `.text-lime` | `#CCFF00` | `var(--p-cork)` | No |
| `.text-grey` | `#94A3B8` | `var(--text-muted)` | No (43 usos en JS) |
| `.text-red` | `#FF4444` | `var(--danger)` | No, si Q1 rechaza `#FF6B6B` |
| `.text-blue` | `#4FACFE` | `var(--info)` | No, si Q2 aprueba `#4FACFE` |
| `.text-gold` | `#FFD700` | *(sin token)* | — Fase 4 |
| `.text-orange` | `#F97316` | *(sin token)* | — Fase 5 |

Esto no mejora contraste por sí mismo: elimina cuatro literales y hace que las clases respondan a `prefers-contrast: more` cuando ese bloque actúe sobre los tokens.

## 9. Deuda documentada, no ejecutada

CSS sin consumidor en JS, confirmado por búsqueda: `.metric-card`, `.card-metric`, `.metric-triple`, `.summary-grid`, `.widget-link-btn--neon` + familia `.neon-*`, `.card-finance` (2 usos parciales). Se eliminará cuando la pantalla correspondiente se rediseñe en Fases 3–5.

**Palanca aplazada de mayor impacto exterior.** Unificar `.text-grey` a `var(--text-s)` —en lugar de a `--text-muted`— subiría de una sola vez 43 etiquetas de 6.50:1 a 9.03:1. No se incluye en esta fase porque altera visiblemente cinco pantallas a la vez y merece revisarse junto al rediseño de cada una (Fases 2–4). Queda aquí registrado para no perderlo.

## 10. Criterios de aceptación

Los 11 deben pasar para cerrar la fase:

| # | Criterio | Verificación |
|---|---|---|
| 1 | Cero referencias a tokens no definidos | `node scratch/verify-tokens.js` → `undefined: 0` |
| 2 | Cero restos de la paleta antigua | `grep -c "212, 163, 115"` → `0` |
| 3 | Cero alias eliminados en uso | `grep` de §6 → `0` |
| 4 | Cero `font-size` < 12px | script → `small-fonts: 0` |
| 5 | Cero `height` fijo en controles | script sobre la lista de §3 → `0` |
| 6 | `--bg-surface` definido y usado | `grep -c "^--bg-surface:"` → `1` |
| 7 | Viewport sin bloqueo de zoom | `grep "user-scalable\|maximum-scale"` → `0` |
| 8 | `theme-color` = `#CCFF00` | `grep theme-color index.html` |
| 9 | Build limpio | `npx vite build` → exit 0 |
| 10 | Sin regresión en las 7 pantallas | comparación con las capturas de `docs/` |
| 11 | Clases `.text-*` sin hex redundante | `grep -n "text-grey\|text-lime"` → ambas con `var(...)` |

**Contraste a reportar en el PR** (valores ya medidos):

| Par | Antes | Después | Objetivo |
|---|---|---|---|
| `--text-s` / `--surface` | 6.50 | 9.03 | ≥ 7.0 |
| `--text-muted` / `--surface` | 6.50 | 6.50 | ≥ 6.5 |
| `--border-control` / `--surface` | 1.32 | 3.72 | ≥ 3.0 |
| Relleno input / tarjeta | — (transparente) | 1.10 + borde 3.47 | contorno ≥ 3.0 |

## 11. Riesgos

| Riesgo | Prob. | Impacto | Mitigación |
|---|---|---|---|
| Romper un `var(--accent)` inline no detectado | Baja | Alto (color transparente) | El verificador recorre `www/js/**/*.js`, no solo el CSS |
| `min-block-size` global altera layouts compactos | Media | Bajo | Scope `pointer: coarse` + revisión de las 7 pantallas |
| Eliminar `.card svg` deja iconos sin color | Baja | Medio | Los SVG ya llevan `stroke` inline o clase `text-*`; verificación visual |
| Suelo tipográfico desborda la nav a 320px | Media | Medio | `clamp()` + prueba explícita a 320px (WCAG 1.4.10) |
| El zoom habilitado rompe el header fijo | Baja | Bajo | Los offsets ya usan `--safe-top` |

## 12. Archivos que se tocan

| Archivo | Cambios |
|---|---|
| `www/css/styles.css` | ~90 líneas: bloque `:root`, 15 tintes, inputs, tipografía, media queries |
| `www/index.html` | 3 líneas (viewport, theme-color, `?v=`) |
| `www/js/ui/{dashboard,fincas,reportes,zonas}-ui.js` | 14 sustituciones `var(--accent)` → `var(--p-cork)` (1 + 6 + 4 + 2 + 1). `core/utils.js` no tiene ninguna |
| `scratch/verify-tokens.js` | **nuevo** — verificador de los criterios 1–8 |

Ningún otro archivo.
