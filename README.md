<h1 align="center">Chamorro's Cork Manager</h1>

<p align="center">
  <img src="docs/Logo%20cabecera.png" width="220" alt="Logo Cabecera">
</p>

<p align="center">
  <img src="docs/Informe%20con%20Graficas.jpg" width="80" alt="TypeScript/Charts" />
  <img src="docs/Informe%20Econ%C3%B3mico.jpg" width="80" alt="HTML5/Reports" />
  <img src="docs/Informe%20Balance%20de%20Sacas.jpg" width="80" alt="CSS3/Layout" />
  <img src="docs/Logo%20cabecera.png" width="80" alt="Capacitor/Logo" />
</p>
<p align="center"><em>Built with: TypeScript, HTML5, CSS3, Capacitor (PWA-ready)</em></p>
<p align="center">
  <img src="docs/Logo%20cabecera.png" width="140" alt="License: Proprietary" />
</p>
<p align="center"><em>License: Proprietary — Sdog Farm Software Factory. All rights reserved.</em></p>

<p>
Solución profesional para la gestión financiera, operativa y la digitalización de sacas de corcho.
</p>

---

## Índice

- [Descripción general](#descripción-general)
- [Características clave](#características-clave-detaladas)
- [Instalación y despliegue](#instalación-y-despliegue)
- [Uso rápido](#uso-rápido-flujo-típico)
- [Estructura de datos](#estructura-de-datos-y-formatos)
- [Capturas y guía visual](#capturas-y-guía-visual)
- [Buenas prácticas](#buenas-prácticas-y-recomendaciones)
- [Licencia y soporte](#licencia-y-soporte)

---

## Descripción general

Chamorro's Cork Manager es una aplicación multiplataforma orientada a explotaciones corcheras que unifica la gestión técnica, operativa y económica de la campaña. Pensada para uso en campo y en oficina, ofrece:

- Registro y trazabilidad de pesadas por saca.
- Gestión catastral de parcelas (SIGPAC) e importación de fichas.
- Control de costes y gastos con informes financieros detallados.
- Informes profesionales exportables a PDF/Excel y gráficas dinámicas.
- Soporte offline con sincronización.

Versión documentada: v6.2.9 (con historial de mejoras desde v6.2.6).

---

## Características clave (detalladas)

1. Registro de pesadas
   - Entrada rápida de pesadas: bruto, tara, calidad, neto y conversión a quintales.
   - Clasificación por calidad: 1ª, Bornizo, Refugo.
   - Historial por saca y auditoría de modificaciones.
   - Captura de foto (opcional) y notas por pesada.

   <p align="center">
     <img src="docs/Pantalla%20Nueva%20Pesada.jpg" width="240" alt="Nueva Pesada" />
   </p>

   <p align="center"><strong>Figura:</strong> Formulario "Nueva Pesada" (entrada rápida en campo).</p>

2. Gestión de fincas y parcelas (SIGPAC)
   - Administración de múltiples fincas con datos legales (DNI/CIF, dirección, contacto).
   - Importación y restauración de fichas SIGPAC; gestión de subparcelas y superficies.
   - Evita la eliminación accidental de parcelas con validaciones y restauraciones.

   <p align="center">
     <img src="docs/Pantalla%20Gesti%C3%B3n%20e%20Importaci%C3%B3n%20SigPac%20de%20Zonas.jpg" width="240" alt="Gestión de Zonas" />
   </p>

   <p align="center"><strong>Figura:</strong> Gestión e importación de fichas SIGPAC.</p>

3. Control de costes y gestión de gastos
   - Registro de gastos (mano de obra, logística, insumos, servicios) y su asignación por finca/parte.
   - Cálculo automático de coste unitario por quintal y margen por comprador.

   <p align="center">
     <img src="docs/Pantalla%20de%20Gesti%C3%B3n%20de%20Gastos.jpg" width="240" alt="Gestión de Gastos" />
   </p>

   <p align="center"><strong>Figura:</strong> Registro y asignación de gastos por campaña.</p>

4. Compradores y tarifas por calidad
   - Perfil completo de compradores con precios por calidad (1ª, Bornizo, Refugo).
   - Configuración de descuentos, impuestos y condiciones comerciales.

5. Informes y análisis
   - Informes: balance de sacas, histórico, por zonas, informe económico con cabecera vendedor/comprador.
   - Gráficas dinámicas para análisis de producción y rendimiento.
   - Exportación a PDF y Excel con formato profesional.

   <p align="center">
     <img src="docs/Informe%20Balance%20de%20Sacas.jpg" width="240" alt="Informe Balance de Sacas" />

     <br />

     <img src="docs/informe%20por%20Zonas.jpg" width="240" alt="Informe por Zonas" />
   </p>

   <p align="center"><strong>Figura:</strong> Informes: Balance de sacas y producción por zonas.</p>

6. Panel de control y UX optimizada
   - Dashboard con resumen global y diario de producción por finca.
   - Interfaz optimizada para uso en pantallas oscuras (modo dark) y condiciones de campo.

   <p align="center">
     <img src="docs/Pantalla%20Inicio.jpg" width="240" alt="Inicio" />
   </p>

   <p align="center"><strong>Figura:</strong> Panel principal / Dashboard con resumen de producción.</p>

7. Operación offline y sincronización
   - Almacenamiento local con IndexedDB.
   - Sincronización cuando hay conexión, diseñada para minimizar conflictos.

8. Seguridad y copia de seguridad
   - Copias de seguridad cifradas.
   - Gestión de permisos y datos de contacto del emisor y receptor.

---

## Instalación y despliegue

La aplicación está empaquetada con Capacitor y es compatible con Android e iOS. Flujo general:

1. Preparación del entorno: Node.js, Ionic/Capacitor.
2. Construir la app: `npm install` y `npm run build`.
3. Generar el proyecto nativo: `npx cap add android` / `npx cap add ios`.
4. Abrir el proyecto nativo y compilar desde Android Studio / Xcode.

(Estos pasos asumen acceso al código fuente y a las claves/firmas para distribución en tiendas.)

---

## Uso rápido (flujo típico)

1. Crear o seleccionar una finca.
2. Configurar compradores y precios por calidad.
3. Registrar pesadas en campo desde la pantalla "Nueva Pesada".
4. Revisar el listado de pesadas y ajustar si es necesario.
5. Registrar gastos asociados a la campaña.
6. Generar informes (balance, por zonas, histórico) y exportarlos.

---

## Estructura de datos y formatos

- Almacenamiento local: IndexedDB (objetos: fincas, parcelas, pesadas, compradores, gastos).
- Exportación: XLSX (tablas) y PDF (informe formateado con cabeceras y logos).

---

## Capturas y guía visual

A continuación están todas las capturas disponibles organizadas por categoría. Las imágenes residen en `docs/` y cada figura incluye su descripción debajo.

### Pantallas de la aplicación

<p align="center">
  <img src="docs/Pantalla%20Inicio.jpg" width="180" alt="Inicio" />
  <br />
  <strong>Figura:</strong> Panel principal / Dashboard con resumen de producción.
</p>

<p align="center">
  <img src="docs/Pantalla%20Nueva%20Pesada.jpg" width="180" alt="Nueva Pesada" />
  <br />
  <strong>Figura:</strong> Formulario "Nueva Pesada" (entrada rápida en campo).
</p>

<p align="center">
  <img src="docs/Pantalla%20De%20Lista%20de%20pesadas.jpg" width="180" alt="Listado de pesadas" />
  <br />
  <strong>Figura:</strong> Listado de pesadas con filtros y controles de edición.
</p>

<p align="center">
  <img src="docs/Screenshot_2026-06-01-15-59-52-541_com.elchamorro.pesadascorcho.jpg" width="180" alt="Mobile screenshot" />
  <br />
  <strong>Figura:</strong> Captura en dispositivo Android (vista móvil).
</p>

### Gestión catastral y de fincas

<p align="center">
  <img src="docs/Pantalla%20Gesti%C3%B3n%20de%20Fincas.jpg" width="180" alt="Gestión de Fincas" />
  <br />
  <strong>Figura:</strong> Gestión de fincas con datos legales y contacto.
</p>

<p align="center">
  <img src="docs/Pantalla%20Gesti%C3%B3n%20de%20Zonas.jpg" width="180" alt="Gestión de Zonas" />
  <br />
  <strong>Figura:</strong> Visor de zonas catastrales.
</p>

<p align="center">
  <img src="docs/Pantalla%20Gesti%C3%B3n%20e%20Importaci%C3%B3n%20SigPac%20de%20Zonas.jpg" width="180" alt="Importación SIGPAC" />
  <br />
  <strong>Figura:</strong> Importación y restauración de fichas SIGPAC.
</p>

### Gestión y control operativo

<p align="center">
  <img src="docs/Pantalla%20de%20Gesti%C3%B3n%20de%20Gastos.jpg" width="180" alt="Gestión de Gastos" />
  <br />
  <strong>Figura:</strong> Registro y asignación de gastos por campaña.
</p>

<p align="center">
  <img src="docs/Pantalla%20Ajustess.jpg" width="180" alt="Ajustes" />
  <br />
  <strong>Figura:</strong> Pantalla de ajustes y configuración del sistema.
</p>

### Informes y análisis

<p align="center">
  <img src="docs/Informe%20Balance%20de%20Sacas.jpg" width="180" alt="Informe Balance de Sacas" />
  <br />
  <strong>Figura:</strong> Informe — Balance de sacas.
</p>

<p align="center">
  <img src="docs/informe%20por%20Zonas.jpg" width="180" alt="Informe por Zonas" />
  <br />
  <strong>Figura:</strong> Informe por zonas — producción por parcela.
</p>

<p align="center">
  <img src="docs/informe%20hist%C3%B3rico%20de%20sacas.jpg" width="180" alt="Informe histórico de sacas" />
  <br />
  <strong>Figura:</strong> Histórico de liquidaciones y sacas.
</p>

<p align="center">
  <img src="docs/Informe%20Econ%C3%B3mico.jpg" width="180" alt="Informe Económico" />
  <br />
  <strong>Figura:</strong> Informe económico con cabeceras vendedor/comprador.
</p>

<p align="center">
  <img src="docs/Informe%20con%20Graficas.jpg" width="180" alt="Informes con gráficas" />
  <br />
  <strong>Figura:</strong> Informes con gráficas dinámicas y análisis estadístico.
</p>

---

## Buenas prácticas y recomendaciones

- Mantener actualizados los precios por calidad antes de iniciar la campaña.
- Realizar copias de seguridad periódicas y comprobar la sincronización tras jornadas extensas.
- Revisar las tarifas y asignaciones de costes para obtener márgenes reales por explotación.

---

## Licencia y soporte

Software de uso privado/familiar propiedad de Sdog Farm Software Factory.

Contacto: soporte.sdogfarm@gmail.com

---

### Cambios y versiones

- v6.2.9: Optimización visual, campos de contacto y mejoras en formularios de pesada.
- v6.2.6: Reordenación de campos y validaciones de zonas/SIGPAC.


*Fin del README actualizado.*