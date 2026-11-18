# Verificación visual de la Fase 1 — resultado real

| Campo | Valor |
|---|---|
| **ID** | `VER-UI-001` |
| **Verifica** | [`PLAN-FASE-1-TOKENS.md`](PLAN-FASE-1-TOKENS.md) §5 (paso S8) y criterio 10 |
| **Fecha** | 2026-11-18 |
| **Veredicto** | **Cumple**: los nueve hallazgos (H1–H9) corregidos y verificados en hardware real y a 320/392/411 dp, incluido Android 16 |

---

## 1. Método

No se estimó nada: se instaló el APK debug en hardware real y se midió el DOM por Chrome DevTools Protocol.

| Dispositivo | Android | Pantalla | dp | dpr | Datos |
|---|---|---|---|---|---|
| Xiaomi `22111317G` | 14 (SDK 34) | 1080×2400 @440 | 392 × 873 | 2,75 | Copia de seguridad real: 727,09 Q · 179 pesadas |
| Emulador `sdk_gphone64` | 16 (SDK 36) | 1080×2400 @420 | 411 × 914 | 2,625 | Misma base importada |
| Chrome integrado | — | ventana emulada | 320 / 392 / 411 | 1 | Misma base en IndexedDB |

Medición por ruta: `document.documentElement.clientWidth` como ancho del viewport y `scrollWidth` como ancho del documento. **`innerWidth` no sirve aquí**: cuando el documento desborda, el WebView amplía la ventana de layout y devuelve un valor falso (490, 886, 945). `clientWidth` se mantuvo siempre en el ancho físico correcto y es la referencia usada en todo este informe.

A cada ruta se le aplican cuatro comprobaciones:

1. `scrollWidth === clientWidth`.
2. Ningún nodo de texto con `font-size` menor de 12 px.
3. Con el FAB visible, tras desplazarse al final, el último bloque de `main` termina por encima del borde superior del FAB.
4. Revisión visual de la captura correspondiente.

**Trampa de caché (afecta a cualquier medición futura).** `index.html` enlaza `css/styles.css?v=8.0.0`, una versión fija. El servidor de desarrollo devuelve la copia cacheada de esa URL aunque el archivo haya cambiado, así que medir sin invalidar esa caché produce resultados del CSS antiguo (se vieron 490 y 945 px con el CSS ya corregido). Todas las mediciones hechas en navegador se tomaron sustituyendo el `href` por uno con marca de tiempo. En el APK no ocurre: los assets van hasheados.

Capturas archivadas en [`evidencias/fase-1/`](evidencias/fase-1/).

---

## 2. Mediciones antes de los arreglos

### 2.1 Xiaomi real, 392 dp, datos reales

| Ruta | clientWidth | scrollWidth | Desbordamiento |
|---|---|---|---|
| `#/` | 392 | 392 | — |
| `#/nueva` | 392 | **475** | **+83 px** |
| `#/lista` | 392 | 392 | — |
| `#/zonas` | 392 | 392 | — |
| `#/gastos` | 392 | 392 | — |
| `#/informes` | 392 | 392 | — |
| `#/ajustes` | 392 | **931** | **+539 px** |

### 2.2 Chrome a 411 dp

| Ruta | clientWidth | scrollWidth | Desbordamiento |
|---|---|---|---|
| `#/nueva` | 411 | **490** | **+79 px** |
| `#/ajustes` | 411 | **945** | **+534 px** |
| resto | 411 | 411 | — |

Los dos defectos de ancho se reproducen igual en navegador y en los dos dispositivos: no son artefactos del emulador.

---

## 3. Fase 1: los tres defectos bloqueantes

### 3.1 Xiaomi real, 392 dp (validación de H1–H3)

| Ruta | clientWidth | scrollWidth | Desbordamiento |
|---|---|---|---|
| `#/` | 392 | 392 | — |
| `#/nueva` | 392 | 392 | — |
| `#/lista` | 392 | 392 | — |
| `#/zonas` | 392 | 392 | — |
| `#/gastos` | 392 | 392 | — |
| `#/informes` | 392 | 392 | — |
| `#/ajustes` | 392 | 392 | — |

**Las 7 pantallas dan `scrollWidth === clientWidth === 392`.**

### 3.2 Chrome integrado (validación de H1–H3)

| Ancho | `#/` | `#/nueva` | `#/lista` | `#/zonas` | `#/gastos` | `#/informes` | `#/ajustes` |
|---|---|---|---|---|---|---|---|
| **411 dp** | 411/411 | 411/411 | 411/411 | 411/411 | 411/411 | 411/411 | 411/411 |
| **320 dp** | 320/320 | 320/320 | 320/320 | 320/320 | 320/320 | 320/320 | 320/320 |

---

## 4. Fase 2: los hallazgos restantes

### 4.1 Estado medido al empezar la fase 2

| Hallazgo | Medido antes | Medido después |
|---|---|---|
| H4 · FAB sobre el contenido | `tapado: true` en `#/`, `#/lista`, `#/zonas`, `#/informes` (a 320 y a 411) | `tapado: false` en las cuatro rutas |
| H5 · etiquetas de 11,2 px | 21 nodos con `font-size: 0.7rem` en 4 archivos | 0 nodos por debajo de 12 px en las 7 rutas |
| H6 · header bajo la barra de estado | `--safe-top: 0px` en Android 16 | `--safe-top: 24px`, header de 80 px |
| H7 · cabecera de Gastos | «Control Gastos» partido en dos líneas | 1 línea (35 px de alto, `line-height` 35) |
| H8 · chip de finca a 320 dp | `320 / 322` (+2 px) | `320 / 320` |
| H9 · botones PDF/Excel a 320 dp | rotos letra a letra («P D F» / «Ex ce l»), botones de 70 px | enteros, 87 px y 96 px, en su propia línea |

### 4.2 Xiaomi real, 392 dp, datos reales (validación final)

| Ruta | clientWidth | scrollWidth | Nodos < 12 px | FAB tapa el final |
|---|---|---|---|---|
| `#/` | 392 | 392 | 0 | no |
| `#/nueva` | 392 | 392 | 0 | (sin FAB) |
| `#/lista` | 392 | 392 | 0 | no |
| `#/zonas` | 392 | 392 | 0 | no |
| `#/gastos` | 392 | 392 | 0 | (sin FAB) |
| `#/informes` | 392 | 392 | 0 | no |
| `#/ajustes` | 392 | 392 | 0 | (sin FAB) |

### 4.3 Emulador Android 16, 411 dp (validación de H6)

| Ruta | clientWidth | scrollWidth | Nodos < 12 px | FAB tapa el final |
|---|---|---|---|---|
| `#/` | 411 | 411 | 0 | no |
| `#/nueva` | 411 | 411 | 0 | (sin FAB) |
| `#/lista` | 411 | 411 | 0 | no |
| `#/zonas` | 411 | 411 | 0 | no |
| `#/gastos` | 411 | 411 | 0 | (sin FAB) |
| `#/informes` | 411 | 411 | 0 | no |
| `#/ajustes` | 411 | 411 | 0 | (sin FAB) |

Inset aplicado: `--safe-top: 24px`, `--safe-bottom: 24px`, altura del header 80 px (56 + 24).

### 4.4 Chrome integrado (validación final)

| Ancho | Resultado |
|---|---|
| **320 dp** | 7/7 rutas `320 / 320`; 0 nodos < 12 px |
| **411 dp** | 7/7 rutas `411 / 411`; 0 nodos < 12 px; FAB no tapa el final |

---

## 5. Hallazgos

### H1 · `overflow-wrap: anywhere` rompía etiquetas cortas — **regresión de esta fase, CORREGIDA**

- **Dónde:** `www/css/styles.css:113`, añadido en S7.
- **Síntoma:** en `#/informes` los botones de exportación se partían letra a letra.
- **Causa:** `body { overflow-wrap: anywhere }` reduce el `min-content` del texto a un carácter.
- **Corrección:** `body { overflow-wrap: break-word }` (`styles.css:113`).

### H2 · Desbordamiento de 83 px en Nueva Pesada — **CORREGIDO**

- **Dónde:** fila FECHA / Nº SACA y selector ZONA / PARCELA (`.grid-2`).
- **Causa:** `grid-template-columns: 1fr 1fr` → `minmax(auto, 1fr)`; el mínimo lo imponía el `min-content` de los inputs.
- **Corrección:** `repeat(2, minmax(0, 1fr))` + `.grid-2 > * { min-width: 0 }` + `input, select { max-width: 100% }` (`styles.css:1670-1675, 520`).

### H3 · Desbordamiento de 539 px en Ajustes — **CORREGIDO**

- **Dónde:** `.grid-3` de las calidades (1ª CALIDAD / BORNIZO / REFUGO).
- **Causa:** tres columnas de **275 px** dentro de un contenedor de 379 px → 845 px; el header pasaba a 931 px.
- **Corrección:** `repeat(3, minmax(0, 1fr))` + `.grid-3 > * { min-width: 0 }` (`styles.css:1671-1675`).

### H4 · El FAB tapaba el final del contenido — **CORREGIDO**

- **Dónde:** `#/`, `#/lista`, `#/zonas`, `#/informes` (el FAB ocupa `bottom: 84px` + 60 px de alto y `main` solo reservaba 96 px).
- **Corrección:** `router.js` marca `body.fab-hidden` cuando el FAB está oculto, y `body:not(.fab-hidden) main#app-content { padding-bottom: calc(72px + 16px) }` reserva el hueco (`styles.css:210`).
- **Verificado:** con la vista desplazada al final, el último bloque termina por encima del borde superior del FAB en las cuatro rutas, en el Xiaomi, en el emulador y en Chrome. Evidencia: `392-zonas-fab-fase2.png`.

### H5 · Etiquetas de 11,2 px — **CORREGIDO**

- **Dónde:** `font-size: 0.7rem` inline en `fincas-ui.js` (3), `pesadas-ui.js` (3), `zonas-ui.js` (6) y `dashboard-ui.js` (9).
- **Por qué no lo cazó el verificador:** `0.7rem` no es un literal `font-size < 12px`.
- **Corrección:** las 21 ocurrencias pasan a `font-size: var(--fs-xs)` (13 px).
- **Verificado:** 0 nodos por debajo de 12 px en las 7 rutas, en los dos dispositivos y en Chrome a 320 y 411 dp.

### H6 · Header bajo la barra de estado en Android 15+ — **CORREGIDO**

- **Síntoma:** en el emulador Android 16, `--safe-top` resolvía a `0px` y el header `position: fixed; top: 0` quedaba bajo la barra de estado; en el Xiaomi (Android 14) no ocurría.
- **Causa:** Android 15+ fuerza edge-to-edge y Capacitor 5 no propaga los insets al CSS.
- **Corrección:** `MainActivity` escucha `WindowInsetsCompat.Type.systemBars()` sobre el `decorView`, lo convierte a dp y escribe `--safe-top` y `--safe-bottom` en `document.documentElement`. La hoja de estilos ya consumía esas variables, así que no hizo falta tocar CSS.
- **Decisión de diseño:** **no** se llama a `setDecorFitsSystemWindows(false)`. Forzarlo añadía una franja muerta de 47 px bajo la barra de navegación en el Xiaomi, donde el sistema ya reserva las barras. Sin forzarlo, Android 14 sigue recibiendo `0px` (comportamiento intacto) y Android 15+ recibe los insets reales. Medido: Xiaomi `0/0` con header de 56 px; emulador Android 16 `24/24` con header de 80 px.
- **Evidencia:** `411-emulador-header-fase2.png` (logo y chip por debajo de la barra) y `392-inicio-insets.png`.

### H7 · Cabecera de Gastos desalineada — **CORREGIDO**

- **Síntoma:** «Control Gastos» ocupaba dos líneas mientras el total quedaba a su derecha.
- **Corrección:** contenedor con `flex-wrap: wrap` y `gap`, `white-space: nowrap` en el título y en el total, y total a 1,15 rem.
- **Verificado:** el título mide 35 px de alto con `line-height` de 35 px → una sola línea, en los dos dispositivos. Evidencia: `392-gastos-fase2.png`.

### H8 · Desbordamiento de 2 px en el header a 320 dp — **CORREGIDO**

- **Causa:** el nombre de finca es un `span` inline; `overflow`/`text-overflow` no se aplican a elementos inline, así que el texto completo (98 px) desbordaba su contenedor y estiraba el header de 320 a 322 px.
- **Corrección:** en `index.html`, el contenedor del menú pasa a `flex: 0 1 auto; min-width: 0; margin: 0 auto`; el chip a `max-width: 45%; min-width: 0`; y el `span` a `display: inline-block; min-width: 0; max-width: 100%`, con lo que la elipsis funciona de verdad.
- **Verificado:** `320 / 320` en las 7 rutas. A 392 dp el chip muestra «EL CHAMO…» con elipsis (el zoom de texto del sistema agranda la fuente en el WebView); no desborda en ningún ancho probado.

### H9 · Botones PDF/Excel partidos a 320 dp — **hallazgo nuevo, CORREGIDO**

- **Síntoma:** a 320 dp los dos botones de exportación se partían letra a letra («P D F», «Ex ce l»).
- **Causa:** `.btn { width: 100% }` dentro de un `flex` sin `wrap`; los dos botones se encogían hasta 70 px y `overflow-wrap: break-word` rompía el texto.
- **Corrección:** `flex-wrap: wrap` en las cinco cabeceras de `reportes-ui.js` y `width: auto; flex: 0 0 auto; white-space: nowrap` en los dos botones.
- **Verificado:** a 320 dp los botones miden 87 px y 96 px, con el texto entero, en una línea propia. Evidencia: `392-informes-fase2.png`.

---

## 6. Lo que se verificó correctamente

- Sin desbordamiento horizontal en las 7 rutas a 320, 392 y 411 dp.
- Los ocho tokens y las clases `.text-*` pintan lo esperado: ninguna etiqueta en marrón, el foco y el pulso del FAB en lima, el bornizo en ámbar y el refugo en rojo.
- Los iconos de las tarjetas conservan su color (ninguno sale lima): confirma S6.
- El zoom no está bloqueado: el meta declara `maximum-scale=5.0, user-scalable=yes` y `viewport-fit=cover`.
- La app arranca limpia sobre una base importada de 179 pesadas, sin errores en logcat.
- Ninguna etiqueta por debajo de 12 px y el FAB no oculta el final de ningún listado.
- El header respeta la barra de estado tanto en Android 14 como en Android 16.

---

## 7. Conclusión

El criterio 10 («sin regresión en las 7 pantallas») **se cumple**. Los nueve hallazgos están corregidos y verificados en el **Xiaomi real a 392 dp con datos reales**, en el **emulador Android 16 a 411 dp** y en Chrome a 320, 392 y 411 dp: sin desbordamiento, sin etiquetas por debajo de 12 px, sin contenido tapado por el FAB y con el header bajo la barra de estado resuelto en las dos versiones de Android.
