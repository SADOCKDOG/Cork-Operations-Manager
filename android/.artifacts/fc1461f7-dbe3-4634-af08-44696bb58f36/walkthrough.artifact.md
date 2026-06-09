# Walkthrough: Optimización de Pesadas y Ajustes de Finca

Se han implementado mejoras críticas en la interfaz de registro de pesadas para optimizar la velocidad y legibilidad en campo, además de añadir configuraciones faltantes.

## Cambios Realizados

### 1. Pantalla de Nueva Pesada (Rediseño de Alta Visibilidad)
Se ha transformado la pantalla para un flujo de trabajo "de arriba a abajo" más rápido:

*   **Modo Pantalla Completa:** Al entrar en el formulario, se ocultan automáticamente la barra superior y la navegación inferior para evitar distracciones y ganar espacio.
*   **Campo Bruto (KG) Gigante:** Ahora es el elemento principal, centrado y con fuente de gran tamaño para ser legible bajo luz solar intensa. Permite decimales para pesajes precisos.
*   **Selector de Zona y Calidad:** Posicionados estratégicamente debajo del peso bruto.
*   **Calidad Predeterminada:** Se ha cambiado a **"⭐ 1ª Calidad"** por defecto para agilizar la mayoría de los registros.
*   **Botón de Guardado Rápido:** Ubicado inmediatamente debajo de los selectores principales.
*   **Preservación de Datos:** El resto de campos (Tara, Saca, Fecha) y los cálculos (Neto, Quintales) siguen estando disponibles en la parte inferior de la pantalla.

### 2. Ajustes de Finca
*   **Porcentaje de Oreo:** Se ha añadido el campo para configurar el % de oreo en la pantalla de Ajustes. Este valor ahora se persiste correctamente en el perfil de la finca.

## Archivos Modificados

*   [app.js](file:///C:/Users/yo/pesadas-corcho/android/app/src/main/assets/public/js/app.js): Lógica de rediseño, modo pantalla completa y gestión de nuevos campos.
*   [styles.css](file:///C:/Users/yo/pesadas-corcho/android/app/src/main/assets/public/css/styles.css): Nuevos estilos `.input-huge`, utilidades de centrado y clases para el modo pantalla completa.

## Entrega y Repositorio
*   **Sincronización:** Se han replicado todos los cambios realizados en el entorno de Android hacia el código fuente principal en la raíz del proyecto.
*   **Limpieza:** Las capturas de pantalla han sido movidas a la carpeta `_PRIVATE_`.
*   **GitHub:** Se ha realizado un commit consolidado y se han subido los cambios al repositorio remoto.

## Verificación Realizada
*   Se ha verificado la correcta inicialización del valor "1ª Calidad".
*   Se ha comprobado que el campo bruto acepta decimales (ej. 45.8).
*   Se ha validado que el botón de guardar persiste los datos y vuelve a la lista.
*   Se ha verificado que el Porcentaje de Oreo se guarda en la base de datos de la finca.

> [!TIP]
> El campo Bruto tiene el foco automático (`autofocus`), por lo que al abrir la pantalla el teclado numérico debería aparecer de inmediato si el dispositivo lo permite.
