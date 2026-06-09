# Plan de Corrección: Duplicidad en Cabecera de Informes

Este plan detalla la corrección para eliminar la duplicidad de los datos del Propietario (Vendedor) y Comprador que aparece al generar los informes en PDF.

## Problema Identificado
Al exportar un informe a PDF, se están incluyendo dos cabeceras con la información del emisor y receptor:
1.  La cabecera propia de la plantilla PDF (diseñada para impresión).
2.  La cabecera de la vista de la aplicación (`.dual-entity-grid`), que se arrastra al contenido del PDF.

## Cambios Propuestos

### 1. Eliminación de Cabecera en la Plantilla PDF
Siguiendo las indicaciones de la captura, se eliminará el bloque de código HTML que genera la tabla de cabecera (Vendedor/Comprador) dentro de la constante `plantilla` en la función `exportarPDF`.

Esto permitirá que solo se visualice la cabecera que ya viene integrada en el contenido del informe (`.dual-entity-grid`), eliminando así la redundancia y manteniendo el diseño visual de la aplicación en el documento PDF.

#### [MODIFY] [app.js](file:///C:/Users/yo/pesadas-corcho/android/app/src/main/assets/public/js/app.js)
*   Eliminar el bloque `<div style="display:table; width:100%; ...">...</div>` de la variable `plantilla`.

### 2. Ajustes de Formato y Alineación
Se verificará que, tras eliminar la cabecera de la plantilla, el título (`h1`) y el contenido posterior queden correctamente espaciados y alineados.

#### [MODIFY] [app.js](file:///C:/Users/yo/pesadas-corcho/js/app.js)
*   Aplicar la misma eliminación en el archivo de la raíz.

## Plan de Verificación

### Verificación Manual (en Android)
1.  Navegar a la pantalla de **Informes**.
2.  Generar un informe (ej. Balance Global).
3.  Pulsar el botón **PDF**.
4.  Confirmar que en el documento generado solo aparece una cabecera profesional en la parte superior y no la versión duplicada debajo del título.
5.  Verificar que el alineamiento de las tablas y el resto del contenido se mantiene correcto.
