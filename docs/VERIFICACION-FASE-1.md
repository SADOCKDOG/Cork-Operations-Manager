# Verificación visual de la Fase 1 — resultado real

| Campo | Valor |
|---|---|
| **ID** | `VER-UI-001` |
| **Verifica** | [`PLAN-FASE-1-TOKENS.md`](PLAN-FASE-1-TOKENS.md) §5 (paso S8) y criterio 10 |
| **Fecha** | 2026-11-18 |
| **Veredicto** | **Cumple con observaciones menores**: H1–H3 corregidos; H8 (2 px en Informes a 320 dp) queda como observación no bloqueante |

---

## 1. Método

No se estimó nada: se instaló el APK debug en hardware real y se midió el DOM por Chrome DevTools Protocol.

| Dispositivo | Android | Pantalla | dp | dpr | Datos |
|---|---|---|---|---|---|
| Xiaomi `22111317G` | 14 (SDK 34) | 1080×2400 @440 | 392 × 873 | 2,75 | Copia de seguridad real: 727,09 Q · 179 pesadas |
| Emulador `sdk_gphone64` | 16 | 1080×2400 @420 | 411 × 914 | 2,625 | Misma base importada |
| Chrome integrado | — | ventana emulada | 411 × 890 | 1 | Misma base en IndexedDB |

Medición por ruta: `document.documentElement.clientWidth` como ancho del viewport y `scrollWidth` como ancho del documento. **`innerWidth` no sirve aquí**: cuando el documento desborda, el WebView amplía la ventana de layout y devuelve un valor falso (490, 886, 945). `clientWidth` se mantuvo siempre en el ancho físico correcto y es la referencia usada en todo este informe.

Capturas archivadas en [`evidencias/fase-1/`](evidencias/fase-1/).

---

## 2. Mediciones antes de los arreglos (estado inicial de la Fase 1)

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

## 3. Mediciones tras los arreglos

### 3.1 Xiaomi real, 392 dp, datos reales (validación final)

| Ruta | clientWidth | scrollWidth | Desbordamiento |
|---|---|---|---|
| `#/` | 392 | 392 | — |
| `#/nueva` | 392 | 392 | — |
| `#/lista` | 392 | 392 | — |
| `#/zonas` | 392 | 392 | — |
| `#/gastos` | 392 | 392 | — |
| `#/informes` | 392 | 392 | — |
| `#/ajustes` | 392 | 392 | — |

**Las 7 pantallas dan `scrollWidth === clientWidth === 392`.** Verificado además visualmente: Nº SACA y ZONA/PARCELA caben en Nueva Pesada, el header de Ajustes muestra el chip de finca, y los botones PDF/Excel se renderizan enteros.

### 3.2 Chrome integrado

| Ancho | `#/` | `#/nueva` | `#/lista` | `#/zonas` | `#/gastos` | `#/informes` | `#/ajustes` |
|---|---|---|---|---|---|---|---|
| **411 dp** | 411/411 | 411/411 | 411/411 | 411/411 | 411/411 | 411/411 | 411/411 |
| **320 dp** | 320/320 | 320/320 | 320/320 | 320/320 | 320/320 | **320/322** (+2 px header) | 320/320 |

El único resto es un desbordamiento de **2 px en el header de Informes a 320 dp** (chip de finca), presente solo en el mínimo WCAG y no en 392 dp (Xiaomi real) ni en 411 dp. No bloqueante.

---

## 4. Hallazgos

### H1 · `overflow-wrap: anywhere` rompía etiquetas cortas — **regresión de esta fase, CORREGIDA**

- **Dónde:** `www/css/styles.css:113`, añadido en S7.
- **Síntoma:** en `#/informes` los botones de exportación se partían letra a letra («P / D / F» y «E / XC / el»).
- **Causa:** `body { overflow-wrap: anywhere }` reduce el `min-content` del texto a un carácter.
- **Corrección aplicada:** `body { overflow-wrap: break-word }` (`styles.css:113`). Verificado: los botones PDF/EXCEL se renderizan enteros a 411 y 320 dp.

### H2 · Desbordamiento de 83 px en Nueva Pesada — **CORREGIDO**

- **Dónde:** fila FECHA / Nº SACA y selector ZONA / PARCELA (`.grid-2`).
- **Medido antes:** `DIV.form-group` con borde derecho en 475 px en viewport de 392 px.
- **Causa:** `grid-template-columns: 1fr 1fr` → `minmax(auto, 1fr)`, el mínimo lo impone el `min-content` de los inputs.
- **Corrección aplicada:** `.grid-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }` + `.grid-2 > * { min-width: 0; }` + `input, select { max-width: 100%; }` (`styles.css:1660-1665, 520`).
- **Verificado:** `411/411` y `320/320` en `#/nueva`.

### H3 · Desbordamiento de 539 px en Ajustes — **CORREGIDO**

- **Dónde:** `.grid-3` de las calidades (1ª CALIDAD / BORNIZO / REFUGO).
- **Medido antes:** tres columnas de **275 px** dentro de un contenedor de 379 px → 845 px; el header pasaba a 931 px y dejaba el chip de finca fuera de pantalla.
- **Causa:** `.grid-3 { grid-template-columns: repeat(3, 1fr) }`, mismo problema de `min-content` que H2.
- **Corrección aplicada:** `.grid-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }` + `.grid-3 > * { min-width: 0; }` (`styles.css:1661-1665`).
- **Verificado:** `411/411` y `320/320` en `#/ajustes`.

### H4 · El FAB `+` tapa contenido — observación (fuera de H1–H3)

- **Dónde:** Inicio, Lista, Zonas, Informes (tapa contenido por debajo).
- **Causa:** FAB global en `bottom: calc(84px + var(--safe-bottom))` por encima del contenido desplazable.
- **Corrección:** reservar `padding-bottom` en `main` equivalente al alto del FAB, o retirar el FAB de rutas que no lo necesitan. Dejado para la fase siguiente.

### H5 · Etiquetas de 11,2 px — observación (fuera de H1–H3)

- **Dónde:** `font-size: 0.7rem` inline en `www/js/ui/zonas-ui.js` y `www/js/ui/dashboard-ui.js`.
- **Medido:** 30 nodos en `#/zonas`, 3 en `#/lista`, 3 en `#/ajustes` a 11,2 px en Chrome a 411 dp.
- **Por qué no lo cazó el verificador:** `0.7rem` no es un literal `font-size < 12px`, así que pasó el criterio 4.
- **Nota:** en el Xiaomi real no se reprodujo (el WebView aplica el zoom de texto del sistema). Dejado para la fase siguiente.

### H6 · Header bajo la barra de estado en Android 15+ — observación (fuera de H1–H3)

- **Dónde:** emulador Android 16; en el Xiaomi (Android 14) no ocurre.
- **Medido:** `--safe-top` resuelve a `0px`; el header `position: fixed; top: 0` queda bajo la barra de estado.
- **Causa:** Android 15+ forza edge-to-edge y Capacitor 5 no propaga los insets al CSS.
- **Corrección:** exponer los insets desde `MainActivity` y asignarlos a `--safe-top`. Dejado para la fase siguiente.

### H7 · Cabecera de Gastos desalineada — observación menor (fuera de H1–H3)

- «Control Gastos» ocupa dos líneas mientras «Total: 15590,00 €» queda a su derecha.
- **Corrección:** reducida la anchura del bloque de total en Gastos. Dejado para la fase siguiente.

### H8 · Desbordamiento de 2 px en el header de Informes a 320 dp — observación menor

- **Dónde:** `#/informes` a 320 dp (mínimo WCAG 1.4.10).
- **Medido:** `320/322` (+2 px).
- **Causa:** chip de finca del header más ancho que el viewport en el mínimo.
- **Estado:** no bloqueante; solo se reproduce en 320 dp, no en 392 dp (Xiaomi real) ni en 411 dp.

---

## 5. Lo que se verificó correctamente

- Sin desbordamiento horizontal en Inicio, Lista, Zonas, Gastos e Informes a 392, 411 y 320 dp.
- Los ocho tokens y las clases `.text-*` pintan lo esperado: ninguna etiqueta en marrón, el foco y el pulso del FAB en lima, el bornizo en ámbar y el refugo en rojo.
- Los iconos de las tarjetas conservan su color (ninguno sale lima): confirma S6.
- El zoom no está bloqueado: el meta declara `maximum-scale=5.0, user-scalable=yes` y `viewport-fit=cover`.
- La app arranca limpia sobre una base importada de 179 pesadas, sin errores en logcat.

---

## 6. Conclusión

El criterio 10 («sin regresión en las 7 pantallas») **se cumple con observaciones menores**: H1 (regresión introducida por S7), H2 y H3 están corregidos y verificados en el **Xiaomi real a 392 dp con datos reales** (7/7 pantallas sin desbordamiento, capturas en `evidencias/fase-1/`), y también a 320 dp y 411 dp en el navegador. Quedan H4–H8 como observaciones no bloqueantes para la fase siguiente.
