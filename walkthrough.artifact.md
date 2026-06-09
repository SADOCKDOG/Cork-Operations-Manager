# Walkthrough: Sincronización Google Drive y Arquitectura v7.0

He completado la integración de la sincronización con Google Drive y la refactorización profunda de la base de datos para soportar integridad total de datos en modo multi-usuario.

## Cambios Principales

### 1. Sincronización con Google Drive
*   **Integración OAuth2:** La app ahora puede conectarse a tu cuenta de Google mediante el botón en **Ajustes**.
*   **Carpeta Segura:** Los datos se guardan en la carpeta oculta `appDataFolder` de Google Drive, protegiéndolos de borrados accidentales por parte del usuario.
*   **Algoritmo de Fusión Inteligente:** Al sincronizar, la app compara los registros locales con los de la nube usando la marca de tiempo `updatedAt`. Siempre prevalece la versión más reciente, permitiendo que varios usuarios trabajen a la vez y sus datos se unan correctamente al conectar a Internet.

### 2. Integridad de Datos (Offline-First)
*   **Soft Delete:** Cuando borras una pesada o zona, no se elimina físicamente de inmediato. Se marca como `deleted: true` para que esta acción se propague a otros dispositivos durante la sincronización.
*   **UUIDs Universales:** Cada registro tiene un ID único aleatorio que evita colisiones entre diferentes teléfonos.
*   **Trazabilidad:** Se guarda quién y cuándo modificó cada dato.

### 3. Nueva Interfaz de Asistente de Bienvenida
*   Se han añadido opciones de importación a la pantalla inicial para usuarios registrados sin fincas.
*   **Importar JSON:** Permite cargar archivos `.json` locales, con soporte mejorado para backups de la versión v6.x.
*   **Sincronizar Cloud:** Permite descargar instantáneamente los datos desde Google Drive.

### 4. Nueva Interfaz de Ajustes
*   Se ha añadido una sección de **Sincronización Cloud** en Ajustes.
*   Muestra la fecha y hora de la última sincronización exitosa.
*   Botón para forzar la sincronización manual.

---

## Cómo Probarlo

1.  Abre la aplicación y ve a **Ajustes**.
2.  Pulsa en **🔄 SINCRONIZAR AHORA**.
3.  Inicia sesión con tu cuenta de Google (asegúrate de que el Client ID esté configurado correctamente en Google Cloud Console).
4.  Crea una pesada nueva.
5.  Vuelve a **Ajustes** y pulsa de nuevo en sincronizar. Verás que tus datos se suben a la nube.

> [!TIP]
> Puedes usar el mismo usuario en dos móviles distintos. Lo que hagas en uno aparecerá en el otro tras pulsar el botón de sincronizar.

> [!WARNING]
> La primera sincronización puede tardar unos segundos más mientras se establece la conexión inicial y se crea el archivo en Drive.
