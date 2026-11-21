# Cork Manager v8.0.1 — Fase 5: Informes y SIGPAC

## Novedades

### Tablas apiladas accesibles en informes
Todas las tablas de los informes (Balance de Campaña, Desglose por Zona, Ingresos por Calidad, Gastos, Historial de Sacas y Detalle por Zonas) usan ahora estructura semántica accesible: `<caption>`, `th[scope="col"]` / `th[scope="row"]`, celdas con `data-label` para reflow en móviles, y wrapper `.tabla-apilada` con `role="region"` y `aria-label`. Cumple WCAG 2.1 para tablas de datos.

### Índice de zona en ficha de zona
Nueva navegación `.zona-indice` en la ficha de zona que permite saltar entre secciones (datos, parcela, cultivos, producción) mediante `scrollIntoView`, mejorando la usabilidad en pantallas pequeñas.

### Revocación de blobs en el router
`Router.route()` ahora revoca las URLs de blob almacenadas en `App._activeObjectUrls` antes de cada navegación, evitando fugas de memoria al cambiar entre pantallas con croquis de zonas.

### Service Worker con cobertura para cdnjs
`vite.config.js` incluye ahora `cdnjs.cloudflare.com` junto a `cdn.jsdelivr.net` en el runtime caching (`CacheFirst`, cache `cdn-cache`), garantizando que `html2pdf.js` esté disponible offline para exportación de PDF en modo avión.

### Configuración Capacitor corregida
`capacitor.config.json` apunta ahora a `webDir: "dist"` para que `cap sync` empaquete el build de Vite. `initial_data.json` se movió a `www/public/` para que Vite lo copie al `dist/` durante el build.

---

## Detalles técnicos

- **Código de versión:** 9
- **Nombre de versión:** 8.0.1
- **Paquete:** `com.elchamorro.pesadascorcho`
- **SDK mínimo:** Android 5.0 (API 21)
- **SDK objetivo:** Android 13 (API 33)
- **Arquitectura:** Capacitor 8 + Vite + PWA (Workbox)
- **Almacenamiento:** IndexedDB (offline-first)

---

> 📄 Generado con [Claude Code](https://claude.com/claude-code)
