<h1 align="center">Chamorro's Cork Manager</h1>

<p align="center">
  <img src="docs/Logo%20cabecera.png" width="220" alt="Logo Cabecera">
</p>

<p align="center">
  <img src="docs/Informe%20con%20Graficas.jpg" width="56" alt="Charts" />
  <img src="docs/Informe%20Econ%C3%B3mico.jpg" width="56" alt="Reports" />
  <img src="docs/Informe%20Balance%20de%20Sacas.jpg" width="56" alt="Layout" />
  <img src="docs/Logo%20cabecera.png" width="56" alt="Capacitor" />
</p>

<p align="center"><em>Built with: TypeScript · HTML5 · CSS3 · Capacitor (PWA-ready)</em></p>
<p align="center"><em>License: Proprietary — Sdog Farm Software Factory. All rights reserved.</em></p>

---

## Resumen

Aplicación multiplataforma para la gestión integral de explotaciones corcheras: registro y trazabilidad de pesadas, gestión catastral (SIGPAC), control de costes, informes profesionales y operación offline con sincronización.

---

## Índice

- [Características principales](#características-principales)
- [Flujo de trabajo (rápido)](#flujo-de-trabajo-rápido)
- [Instalación y despliegue](#instalación-y-despliegue)
- [Estructura de datos y exportación](#estructura-de-datos-y-exportación)
- [Imágenes y guía visual](#imágenes-y-guía-visual)
- [Soporte y licencia](#soporte-y-licencia)

---

## Características principales

A continuación la funcionalidad agrupada por áreas. Cada entrada incluye una captura representativa y la descripción resumida.

<table>
  <tr>
    <td width="260" valign="top" align="center">
      <img src="docs/Pantalla%20Inicio.jpg" width="220" alt="Dashboard" />
      <p><strong>Figura:</strong> Panel principal / Dashboard</p>
    </td>
    <td valign="top">
      <h3>Panel de control</h3>
      <p>Resumen global y diario de producción por finca, con totales por calidad y accesos directos a operaciones principales.</p>
    </td>
  </tr>

  <tr>
    <td valign="top" align="center">
      <img src="docs/Pantalla%20Nueva%20Pesada.jpg" width="220" alt="Nueva Pesada" />
      <p><strong>Figura:</strong> Formulario "Nueva Pesada"</p>
    </td>
    <td valign="top">
      <h3>Registro de pesadas</h3>
      <p>Entrada rápida de bruto/tara, selección de calidad (1ª, Bornizo, Refugo), neto/Quintales, foto opcional y notas. Histórico y auditoría de cambios.</p>
    </td>
  </tr>

  <tr>
    <td valign="top" align="center">
      <img src="docs/Pantalla%20De%20Lista%20de%20pesadas.jpg" width="220" alt="Listado de pesadas" />
      <p><strong>Figura:</strong> Listado de pesadas</p>
    </td>
    <td valign="top">
      <h3>Listado y trazabilidad</h3>
      <p>Filtros por finca, comprador y fecha; edición y exportación de selecciones. Trazabilidad por saca.</p>
    </td>
  </tr>

  <tr>
    <td valign="top" align="center">
      <img src="docs/Pantalla%20Gesti%C3%B3n%20de%20Fincas.jpg" width="220" alt="Gestión de Fincas" />
      <p><strong>Figura:</strong> Gestión de fincas</p>
    </td>
    <td valign="top">
      <h3>Gestión Multi-Finca</h3>
      <p>Administración de fincas con datos legales (DNI/CIF), dirección y contactos. Configuración independiente por explotación.</p>
    </td>
  </tr>

  <tr>
    <td valign="top" align="center">
      <img src="docs/Pantalla%20Gesti%C3%B3n%20e%20Importaci%C3%B3n%20SigPac%20de%20Zonas.jpg" width="220" alt="SIGPAC" />
      <p><strong>Figura:</strong> Importación SIGPAC</p>
    </td>
    <td valign="top">
      <h3>Gestión catastral (SIGPAC)</h3>
      <p>Importación y restauración de fichas catastrales, gestión de subparcelas y superficies, validaciones para evitar eliminaciones accidentales.</p>
    </td>
  </tr>

  <tr>
    <td valign="top" align="center">
      <img src="docs/Pantalla%20de%20Gesti%C3%B3n%20de%20Gastos.jpg" width="220" alt="Gastos" />
      <p><strong>Figura:</strong> Gestión de gastos</p>
    </td>
    <td valign="top">
      <h3>Control de costes</h3>
      <p>Registro de gastos por campaña y finca (mano de obra, logística, insumos); cálculo automático de coste por quintal y margen por comprador.</p>
    </td>
  </tr>

  <tr>
    <td valign="top" align="center">
      <img src="docs/Informe%20Balance%20de%20Sacas.jpg" width="220" alt="Informes" />
      <p><strong>Figura:</strong> Informes</p>
    </td>
    <td valign="top">
      <h3>Informes y análisis</h3>
      <p>Balance de sacas, histórico, producción por zonas y informe económico con cabeceras vendedor/comprador. Exportación a PDF y Excel; gráficas dinámicas.</p>
    </td>
  </tr>
</table>

---

## Flujo de trabajo (rápido)

1. Crear o seleccionar una finca.
2. Configurar compradores y precios por calidad.
3. Registrar pesadas en campo desde "Nueva Pesada".
4. Revisar y depurar en el listado de pesadas.
5. Registrar gastos asociados.
6. Generar y exportar informes.

---

## Instalación y despliegue

Requisitos: Node.js, npm, Ionic/Capacitor.

Comandos básicos:

- npm install
- npm run build
- npx cap add android
- npx cap sync
- npx cap open android

(Compilar desde Android Studio / Xcode para generar binarios nativos.)

---

## Estructura de datos y exportación

- Almacenamiento local: IndexedDB — objetos: fincas, parcelas, pesadas, compradores, gastos.
- Exportación: XLSX (tablas) y PDF (informes). 

---

## Soporte y contacto

soporte.sdogfarm@gmail.com

---

## Cambios principales

- v6.2.9: Optimización visual, campos de contacto y mejoras en formularios de pesada.
- v6.2.6: Reordenación de campos y validaciones SIGPAC.

---

<p align="center"><em>Documento generado y estructurado para presentar la aplicación de forma clara y profesional.</em></p>
