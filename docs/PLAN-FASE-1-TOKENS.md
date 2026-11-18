# PLAN — Fase 1: Tokens globales y reglas base

| Campo | Valor |
|---|---|
| **ID** | `PLAN-UI-001` |
| **Implementa** | [`SPEC-FASE-1-TOKENS.md`](SPEC-FASE-1-TOKENS.md) (`SPEC-UI-001`) |
| **Contexto** | [`AUDITORIA-UIUX-CORK-MANAGER.md`](AUDITORIA-UIUX-CORK-MANAGER.md) §7, Fase 1 |
| **Estado** | Listo para ejecutar tras resolver §0 |
| **Riesgo** | Bajo en código, **medio en revisión** (ver P0) |
| **Rama** | `refactor/fase-1-tokens` |
| **Commits** | 1 por paso, 9 en total |

---

## 0. Puerta de decisiones (antes de tocar nada)

El spec deja dos preguntas abiertas. El plan **asume las respuestas recomendadas** para poder escribirse; si se elige otra, cambian solo dos valores y ningún paso:

| ID | Asumido | Si cambia |
|---|---|---|
| **Q1** | (a) `--text-s` → `#B4C0CE`, `--text-muted` → `#94A3B8`, `--danger` se queda en `#FF4444` | (b) añade `--danger: #FF6B6B` en S2 · (c) no reescribe §5.2 en S2 |
| **Q2** | (a) `--info: #4FACFE` + `--info-bg: rgba(79,172,254,.08)` y actualizar `AGENTS.md §1` | (b) `--info: #3b82f6` y **`.text-blue` no se tokeniza** (cambiaría 8 iconos azules) |

> Si Q2 se resuelve a (b), el paso S3 pierde una fila de §8.7 y `.text-blue` se queda con su hex hasta la Fase 5.

---

## 1. P0 — Preparación del repositorio (**bloqueante, no es cosmético**)

**Hallazgo medido:** `git ls-files --eol` devuelve `i/lf w/crlf` para `www/css/styles.css` y `www/index.html`, y no existe `.gitattributes`.

```
git diff --stat -- www/css/styles.css         → 1731 líneas cambiadas
git diff --ignore-all-space --stat            → 52 insertions, 16 deletions
```

El cambio real en el árbol de trabajo son **68 líneas**, pero git lo presenta como el archivo entero. Si se implementa la Fase 1 así, el diff del PR es de 1.731 líneas, la auditoría semántica que exige `AGENTS.md §6` (revisión línea a línea) se vuelve imposible y el riesgo real —15 tintes, un `:root` reescrito— queda invisible bajo el ruido.

**Pasos:**

1. Añadir `.gitattributes` en la raíz:
   ```gitattributes
   * text=auto eol=lf
   *.java text eol=lf
   *.gradle text eol=lf
   *.bat text eol=crlf
   ```
2. Renormalizar en un **commit aislado**, sin ninguna otra modificación:
   ```bash
   git add --renormalize .
   git commit -m "Chore: Normalizar finales de línea (LF) y añadir .gitattributes"
   ```
3. Comprobar que a partir de ahí los diffs son legibles:
   ```bash
   git diff --stat -- www/css/styles.css   # debe dar 0 mientras no se edite
   ```

**Criterio de salida:** `git ls-files --eol www/css/styles.css` → `i/lf w/lf`, y un `git status` limpio en `www/`.

**Si se prefiere no renormalizar:** entonces el commit de la Fase 1 debe hacerse con `git add -U` + commit único y el revisor debe usar `git diff -w`. Es peor: se pierde la revisión de los 15 tintes. Recomiendo renormalizar.

---

## 2. Orden de ejecución

Cada paso es un commit independiente y verificable. El orden no es arbitrario: **primero el verificador** (permite trabajar en rojo → verde), después lo que no tiene efecto visual, y lo que altera el aspecto percibido al final, para que la comparación visual de S8 no se contamine con cambios de tamaño.

| # | Paso | Archivos | Verificación | Revertible con |
|---|---|---|---|---|
| **S1** | Verificador de tokens | `scratch/verify-tokens.js` (nuevo) | Reporta el estado inicial en rojo | borrar archivo |
| **S2** | Reescribir `:root` (§5.1–5.3) | `styles.css:10-98` | Criterios 1 y 6 | `git revert` |
| **S3** | Migración de alias + `.text-*` (§6, §8.7) | `styles.css` + 4 JS | Criterio 3 y 11 | `git revert` |
| **S4** | 15 tintes marrones + eliminar `--theme-color` (§7) | `styles.css` | Criterio 2 | `git revert` |
| **S5** | Inputs, tamaños táctiles, `min-height` (§8.1, §8.2, D6) | `styles.css` | Criterios 4 y 5 | `git revert` |
| **S6** | Iconos de tarjeta + documento (§8.3, §8.4) | `styles.css:212`, `index.html` | Criterios 7 y 8 | `git revert` |
| **S7** | Preferencias del sistema + tipografía (§8.5, §8.6) | `styles.css` | Criterio 4 | `git revert` |
| **S8** | Verificación visual de las 7 pantallas | — | Criterio 10 | — |
| **S9** | Cierre: build y PR | — | Criterio 9 | — |

---

## 3. Detalle por paso

### S1 — Verificador (escribir el test antes del cambio)

`scratch/verify-tokens.js`, en Node sin dependencias. Comprueba los criterios automáticos del spec:

| Comprobación | Salida esperada hoy | Salida esperada al final |
|---|---|---|
| `undefined-tokens` (tokens usados y no definidos en `:root`) | `4` (`--bg-surface`) | `0` |
| `brown-remnants` (`212, 163, 115`) | `15` | `0` |
| `small-fonts` (`font-size` < 12px en `styles.css`) | `13` | `0` |
| `fixed-heights` (lista de §3 del spec, no cualquier `height`) | `10` | `4` |
| `removed-aliases` (`--accent`, `--text-secondary`, …) | `45` uso | `0` |
| `zoom-blocked` (`maximum-scale` / `user-scalable`) | `1` | `0` |
| `theme-color` | `#a0673a` | `#CCFF00` |
| `utility-hex` (`.text-grey`, `.text-lime`) | `2` | `0` |

Debe recorrer `www/css`, `www/index.html` y `www/js/**/*.js` — no solo el CSS: 14 de las 45 referencias viven en JS.

```bash
node scratch/verify-tokens.js
```

**Salida esperada de S1:** el informe completo en rojo, guardado en el mensaje del commit. Ese es el "antes" medido, no estimado.

### S2 — `:root`

Reescribir el bloque completo según §5.1, **conservando** el bloque semántico que lista §5.1 (segundo bloque de código): `--p-cork`, `--p-cork-dark`, `--text-p`, `--success`, `--warning`, `--danger`, `--*-bg`.

- Añade: `--bg-surface: #242424`, `--border-control: #777777`, 6 tintes `--accent-*`/`--glow-*`/`--ring-*`, escala `--fs-*`, `--nav-h`, `color-scheme: dark`.
- Aplica Q1 (a): `--text-s: #B4C0CE`, `--text-muted: #94A3B8` (deja de ser `var(--text-s)`).
- Aplica Q2 (a): `--info: #4FACFE`, `--info-bg: rgba(79,172,254,.08)`.
- Elimina: `--bg-deep`, `--border-subtle`, `--warning-bg`, `--info-bg` original, `--color-metric-*` (4), `--tap-gap`, `--shadow-md`, `--radius`, `--c-*` (4).

**Efecto visual esperado en S2** (el único paso con cambio visible): los inputs dejan de ser transparentes y pasan a `#242424` con borde `#777777`. Todo lo demás debe verse igual.

```bash
node scratch/verify-tokens.js   # undefined-tokens: 0
```

### S3 — Alias

45 sustituciones mecánicas, sin decisión creativa. 11 en CSS, 14 de `--accent` en JS, resto en CSS.

```bash
grep -rn -- "--accent\|--text-secondary\|--text-high\|--border-default\|--c-success\|--c-warning\|--c-danger\|--c-info\|--theme-color" www/css www/js www/index.html
grep -rn "var(--radius)" www/css www/js www/index.html                 # paréntesis: evita --radius-md/-lg/etc.
grep -rn "var(--radius)[^-\-]" www/css                                # segunda pasada del mismo control
```

Incluye §8.7: `.text-lime` → `var(--p-cork)`, `.text-grey` → `var(--text-muted)`, `.text-red` → `var(--danger)`, `.text-blue` → `var(--info)`.

**Trampa controlada:** `.text-grey` alimenta 43 etiquetas secundarias. Se mapea a `--text-muted` (`#94A3B8`) precisamente para que **ninguna** etiqueta se oscurezca ni se aclare en esta fase. La palanca de subirlas a 9.03:1 está documentada en el spec §9 como deuda de Fase 2–4.

### S4 — Tintes

Los 15 reemplazos de la tabla §7, línea a línea. Ninguno altera estructura ni tamaños.

```bash
grep -c "212, 163, 115" www/css/styles.css    # → 0
```

Efecto: anillo de foco, pulso del FAB, spinner y `theme-zona` pasan de marrón a lima. Es el cambio que unifica la app en un solo acento.

### S5 — Ergonomía

- Inputs a `min-height: 56px` + `background: var(--bg-surface)` + `border: 1.5px solid var(--border-control)` (§8.1).
- Bloque `@media (pointer: coarse)` con `min-block-size/min-inline-size: 44px` (§8.2).
- `.btn-ghost` 40 → 44 y `.filter-chip` → `min-height: 44px` (§8.2).
- 6 `height` → `min-height`: `.btn`, `.btn-sm`, `input/select`, `.input-hero`, `.quality-*`, `.confirm-actions button`. Se **mantienen** `.btn-icon`, `.btn-icon-wrap`, `.fab`, `.skeleton-avatar` (D6).

**Guardarraíl:** este paso es el que más puede mover el layout. Se verifica 320px antes de continuar (ver §5).

### S6 — Iconos y documento

- Eliminar `.card svg { stroke: #CCFF00; stroke-width: 1.5 }` (`styles.css:212`). Antes de borrar: comprobar que los iconos de tarjeta llevan `stroke` inline o clase `text-*`.
  ```bash
  grep -rn "card svg\|<svg" www/js/ui/*.js | grep -i "stroke" | head -20
  ```
- `index.html`: viewport sin `maximum-scale`/`user-scalable` + `viewport-fit=cover`; `theme-color` → `#CCFF00`; `?v=7.0.0` → `?v=8.0.0` (alinear con `package.json`).

### S7 — Preferencias y tipografía

- `prefers-reduced-motion: no-preference` para `fabPulse`, `shimmer`, `fadeInUp` (patrón opt-in, D7).
- `forced-colors: active` y `prefers-contrast: more` según §8.5.
- `text-wrap: balance/pretty`, `overflow-wrap: anywhere`.
- 13 reglas bajo 12px → escala `--fs-*`; `.nav-item` a `clamp(0.75rem, 3.2vw, 0.8125rem)`.

### S8 — Verificación visual

Ver §5. Sin este paso la fase no se cierra aunque los 8 criterios automáticos pasen: ningún script detecta un layout roto.

### S9 — Cierre

```bash
npx vite build
node scratch/verify-tokens.js
```
Reportar en el PR la tabla de contraste de §10 del spec (9.03 / 6.50 / 3.72) con los valores medidos, no los estimados.

---

## 4. Criterios de aceptación → paso

| Criterio del spec | Se verifica en | Automático |
|---|---|---|
| 1 · Cero tokens no definidos | S2 | Sí |
| 2 · Cero restos marrones | S4 | Sí |
| 3 · Cero alias en uso | S3 | Sí |
| 4 · Cero `font-size` < 12px | S5, S7 | Sí |
| 5 · Cero `height` fijo en controles | S5 | Sí |
| 6 · `--bg-surface` definido y usado | S2 | Sí |
| 7 · Zoom no bloqueado | S6 | Sí |
| 8 · `theme-color` = `#CCFF00` | S6 | Sí |
| 9 · Build limpio | S9 | Sí |
| 10 · Sin regresión en 7 pantallas | S8 | **No — manual** |
| 11 · `.text-*` sin hex redundante | S3 | Sí |

---

## 5. Protocolo de verificación visual (S8)

7 pantallas × 2 anchos = 14 capturas, con la **misma** semilla de datos en todas.

| Pantalla | Ruta |
|---|---|
| Dashboard | `#/` |
| Nueva Pesada | `#/nueva` |
| Listado de pesadas | `#/pesadas` |
| Zonas SIGPAC | `#/zonas` |
| Gastos | `#/gastos` |
| Informes | `#/reportes` |
| Ajustes | `#/ajustes` |

- Anchuras: **360px** (móvil de referencia) y **320px** (mínimo WCAG 1.4.10).
- Comprobar en cada una: sin scroll horizontal, nav inferior sin recorte, etiquetas de input no cortadas, ningún texto por debajo de 12px visualmente.
- Inspección concreta de S6: abrir Gastos y Ajustes y confirmar que los iconos **no** salen lima.
- Comparar contra las capturas previas de `docs/`. Las diferencias admitidas son tres: inputs con fondo propio, anillo de foco lima, `.btn-ghost`/`.filter-chip` 4px más altos.

---

## 6. Estrategia de commits y reversión

```
Chore: Normalizar finales de línea (LF) y añadir .gitattributes      ← P0
Test: Añadir verificador de tokens con el estado inicial medido      ← S1
Refactor(styles): Reescribir :root con tokens canónicos y nuevos tintes ← S2
Refactor: Migrar 45 alias de tokens y tokenizar clases .text-*       ← S3
Fix(styles): Sustituir los 15 restos de la paleta marrón v6          ← S4
Feat(styles): Objetivos táctiles de 44px y min-height en controles    ← S5
Fix(ui): Respetar el color de los iconos de tarjeta y habilitar zoom ← S6
Feat(styles): Atender prefers-reduced-motion, prefers-contrast y tipografía ← S7
```

Cada `git revert` devuelve el árbol al estado anterior sin tocar los demás pasos. **El commit P0 no se revierte con el resto**: si hay que abandonar la fase, se mantiene la normalización.

---

## 7. Estimación y riesgo por paso

| Paso | Esfuerzo | Riesgo | Mitigación |
|---|---|---|---|
| P0 | 15 min | Bajo | Commit aislado; verificar `ls-files --eol` |
| S1 | 45 min | Nulo | No toca `www/` |
| S2 | 40 min | **Medio** — `:root` reescrito: un token olvidado se vuelve transparente | Criterio 1 en verde antes de seguir |
| S3 | 30 min | Bajo | Los 3 greps deben dar 0 |
| S4 | 30 min | Bajo | `grep -c` → 0; revisión visual de FAB/foco |
| S5 | 45 min | **Medio** — mueve layouts | Prueba a 320px antes del commit |
| S6 | 20 min | Medio — iconos sin color | Inspección de Gastos y Ajustes |
| S7 | 40 min | Bajo | Comprobar animaciones con `prefers-reduced-motion` activo |
| S8 | 40 min | — | 14 capturas |
| S9 | 15 min | Bajo | `npx vite build` |

**Total: ~5 h.** El paso que más probablemente hay que rehacer es S2, por eso el verificador existe antes que él.

---

## 8. Fuera de esta fase

Todo lo que el spec §2 declara no objetivo sigue fuera: rediseño de pantallas, los 377 estilos inline, las clases que faltan (`pesada-table-bordered`, `ptr-*`), el CSS muerto y `vite.config.js`. El plan no los roza; si aparece la tentación de arreglar algo de eso durante S3–S7, va a la fase correspondiente.

## 9. Definición de terminado

1. Los 11 criterios del spec pasan.
2. 14 capturas revisadas y archivadas en `docs/`.
3. Tabla de contraste medida incluida en el PR.
4. `npx vite build` limpio y `npx cap sync` sin cambios inesperados en `android/`.
5. Un commit por paso, mensajes en el formato de §6, P0 separado.
