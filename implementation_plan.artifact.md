# Plan de Implementación: Importación en Pantalla de Bienvenida

Este plan detalla la adición de funcionalidades de importación (JSON local y Cloud Sync) a la pantalla de bienvenida que aparece cuando un usuario registrado no tiene fincas creadas.

## Cambios Propuestos

### 1. Interfaz de Usuario (Welcome Wizard)
Añadiremos dos nuevas opciones al "Welcome Wizard" en `src/main.ts`:
*   **Botón "📥 Importar Backup (.json)":** Para usuarios que tienen un archivo de respaldo manual.
*   **Botón "🔄 Sincronizar desde la Nube":** Para usuarios que ya tienen datos en Google Drive y quieren descargarlos en este dispositivo.

### 2. Lógica de Importación JSON
*   Implementar un input de tipo `file` oculto.
*   Al seleccionar un archivo, usar `Export.parseBackupFile` y `Export.saveImportedFincaData` para restaurar las fincas, zonas y pesadas.
*   Verificar duplicados y solicitar confirmación si la finca ya existe.

### 3. Lógica de Sincronización Cloud
*   Permitir iniciar el proceso de `Sync.sync()` directamente desde la bienvenida.
*   Si el usuario no ha iniciado sesión en Google, se le solicitará en ese momento.

---

## Archivos a Modificar

#### [MODIFY] [main.ts](file:///C:/Users/yo/pesadas-corcho/src/main.ts)
*   Actualizar `renderWelcomeWizard()` con los nuevos botones y listeners.
*   Añadir el método privado `_handleImportFile(file: File)` para procesar el JSON.

#### [MODIFY] [export.ts](file:///C:/Users/yo/pesadas-corcho/src/modules/export.ts)
*   Mejorar `parseBackupFile` para que reconozca y normalice formatos de respaldo antiguos (v6.x).

---

## Verificación Plan

1.  **Registro de nuevo usuario:** Entrar con una cuenta nueva.
2.  **Importar JSON:** Seleccionar un backup previo y verificar que las fincas aparecen y el dashboard se actualiza.
3.  **Sincronizar Cloud:** Pulsar el botón de la nube en un dispositivo vacío y verificar que descarga los datos existentes en Drive.
