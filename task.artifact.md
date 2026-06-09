# Tareas de Implementación: Cork Manager v7.0

## Fase 1: Infraestructura y Preparación
- [x] Configurar entorno **Vite** con soporte para TypeScript.
- [x] Migrar archivos estáticos (`css`, `icons`, `assets`) a la nueva estructura.
- [x] Refactorizar `index.html` para el uso de módulos.
- [x] Instalar dependencias necesarias (`uuid`, `capacitor plugins`, etc.).

## Fase 2: Refactorización de Arquitectura (ESM & Database)
- [x] Convertir módulos JS globales a **ES Modules** (import/export).
- [x] Implementar generación de **UUIDs** para nuevos registros.
- [x] Crear script de migración para convertir IDs numéricos existentes a UUIDs (Preservación de datos).
- [x] Adaptar `db.ts` para manejar múltiples bases de datos por usuario.

## Fase 3: Sistema Multi-Sesión y Seguridad
- [x] Refactorizar `auth.ts` para soportar login local offline.
- [x] Implementar pantalla de selección de usuario (Login).
- [x] Asegurar que el "Welcome Wizard" funcione correctamente con el nuevo sistema.
- [ ] Integrar protección biométrica en el acceso.

## Fase 4: Sincronización Cloud (Google Drive)
- [x] Configurar cliente de Google Drive API.
- [x] Implementar lógica de subida/bajada incremental (Diferencial).
- [x] Sistema de resolución de conflictos por timestamp.
- [ ] Test de integridad de datos tras sincronización.

## Fase 5: Mejoras de UI e Informes
- [x] Implementar **Modo Sol Directo** (Alto contraste).
- [ ] Integrar mapas interactivos con Leaflet en la sección de Zonas.
- [x] Añadir comparativas históricas en el panel de Informes.
- [x] Migrar gestión de Gastos.
- [x] Migrar Importación de PDF.
- [x] Migrar Central de Informes completa.

## Fase 6: Verificación y Despliegue
- [ ] Pruebas completas de flujo offline/online.
- [ ] Build final con Vite y sincronización con Capacitor (Android).
- [ ] Walkthrough final para el usuario.
