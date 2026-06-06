# Plan de Finalización: Sincronización, Limpieza y Subida a GitHub

Este plan detalla los pasos para consolidar los cambios realizados en la versión de Android hacia el código fuente principal, organizar los archivos del repositorio y realizar la entrega final en GitHub.

## Pasos del Plan

### 1. Sincronización de Código Fuente (Source of Truth)
Dado que los cambios (rediseño, modo pantalla completa, cambio de nombre) se aplicaron directamente en los assets de Android para pruebas rápidas, ahora se replicarán en el directorio raíz para que el código fuente principal esté actualizado.

*   Copiar `android/app/src/main/assets/public/js/app.js` a `js/app.js`
*   Copiar `android/app/src/main/assets/public/js/export.js` a `js/export.js`
*   Copiar `android/app/src/main/assets/public/css/styles.css` a `css/styles.css`
*   Copiar `android/app/src/main/assets/public/manual-zonas.html` a `manual-zonas.html`

### 2. Organización y Limpieza
Se moverán los archivos temporales y capturas de pantalla a la carpeta de archivos privados para mantener el repositorio limpio y profesional.

*   Mover `Pantalla Nueva pesada.jpg` a `_PRIVATE_/`
*   Mover `Pantalla Ajustes, falta porcentaje Oreo.jpg` a `_PRIVATE_/`

### 3. Entrega en GitHub
Se procederá a preparar el commit con un mensaje descriptivo y se subirá a la rama principal.

*   `git add .`
*   `git commit -m "Refactor: Rediseño pantalla pesadas (Alta Visibilidad), Modo Pantalla Completa, Cambio de nombre a Cork Manager e integración de % Oreo"`
*   `git push`

## Verificación Final
*   Confirmar que `js/app.js` contiene la lógica de pantalla completa.
*   Confirmar que la raíz no tiene archivos `.jpg` sueltos.
*   Verificar el estado del push en GitHub.
