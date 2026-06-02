<h1 align="center">Cork Manager</h1>

<p align="center">
  <img src="icons/Logo para PDF y cabecera de la aplicación.png" width="400" alt="Cork Manager Logo">
</p>

<p align="center"><strong>Built with:</strong> TypeScript · HTML5 · CSS3 · Capacitor (PWA-ready)</p>
<p align="center"><strong>License:</strong> Proprietary — Sdog Farm Software Factory. All rights reserved.</p>

---

## Descripción completa

Cork Manager es una aplicación multiplataforma diseñada para gestionar de forma integral la producción y la parte económica de explotaciones corcheras. A continuación se describen en detalle las funcionalidades de cada módulo/screen: qué hace, qué datos maneja y casos de uso principales. Tras cada descripción funcional, se muestran las capturas de pantalla relacionadas.

---

## Módulos y funcionalidades

### 1) Panel de control (Dashboard)
Descripción funcional:
- Vista inicial que muestra indicadores clave: total kg/pesadas diarias, quintales por calidad (1ª, Bornizo, Refugo), y balance acumulado por campaña.
- Accesos rápidos a: Nueva Pesada, Listado de Pesadas, Informes y Gestión de Fincas.
- Filtros por finca y rango de fechas para contextualizar los datos mostrados.
- Objetivo: ofrecer una foto inmediata del estado operativo y financiero para la toma de decisiones sobre recolección y logística.

Casos de uso:
- Comprobación rápida del rendimiento diario en campo.
- Monitorizar desviaciones por calidad o merma técnica.

Imágenes relacionadas:

<p align="center">
  <img src="docs/Pantalla%20Inicio.jpg" width="220" alt="Dashboard" />
</p>
<p align="center"><strong>Figura:</strong> Panel principal / Dashboard con resumen de producción.</p>

---

### 2) Registro de pesadas (Nueva Pesada)
Descripción funcional:
- Formulario optimizado para captura en campo: campos principales (Bruto, Tara, Calidad), cálculo automático de Neto y conversión a Quintales.
- Selección de comprador, asignación de saca y número identificador único por pesada.
- Campos opcionales: foto de la saca, notas de observación, coordenadas GPS si el dispositivo las proporciona.
- Validaciones: límites razonables en pesos, comprobación de valores obligatorios y guardado offline en IndexedDB si no hay conexión.
- Objetivo: máxima velocidad y fiabilidad en la entrada de datos para evitar manipulación posterior.

Casos de uso:
- Registro inmediato tras el pesaje en báscula.
- Corregir entradas en el listado con auditoría de cambios.

Imágenes relacionadas:

<p align="center">
  <img src="docs/Pantalla%20Nueva%20Pesada.jpg" width="220" alt="Nueva Pesada" />
</p>
<p align="center"><strong>Figura:</strong> Formulario "Nueva Pesada" (entrada rápida en campo).</p>

---

### 3) Listado y trazabilidad de pesadas
Descripción funcional:
- Listado tabular de todas las pesadas con paginación y filtros por finca, comprador, calidad, fecha y rango de pesos.
- Operaciones sobre registros: ver detalle, editar (con registro de auditoría), marcar como verificada, y eliminación (con confirmación y control de permisos).
- Exportación de subconjuntos a Excel para conciliaciones y auditorías.
- Objetivo: disponer de histórico accesible y exportable para trazabilidad y gestión administrativa.

Imágenes relacionadas:

<p align="center">
  <img src="docs/Pantalla%20De%20Lista%20de%20pesadas.jpg" width="220" alt="Listado de pesadas" />
</p>
<p align="center"><strong>Figura:</strong> Listado de pesadas con filtros y controles de edición.</p>

---

### 4) Gestión de fincas y compradores
Descripción funcional:
- Panel para gestionar múltiples fincas: datos legales (DNI/CIF), dirección completa, responsables, contacto telefónico y e-mail.
- Per-file settings por finca: factores de conversión, merma técnica por defecto, moneda y preferencias de exportación.
- Gestión de compradores: perfil de comprador con precios por calidad (1ª, Bornizo, Refugo), condiciones comerciales y datos fiscales.
- Objetivo: centralizar la información administrativa y comercial por explotación.

Imágenes relacionadas:

<p align="center">
  <img src="docs/Pantalla%20Gesti%C3%B3n%20de%20Fincas.jpg" width="220" alt="Gestión de Fincas" />
</p>
<p align="center"><strong>Figura:</strong> Gestión de fincas con datos legales y contacto.</p>

---

### 5) Gestión catastral (SIGPAC) y zonas
Descripción funcional:
- Importación de fichas SIGPAC y asociación a fincas/subparcelas.
- Almacenamiento de metadatos: referencia catastral, polígono, superficie y tablas de aprovechamiento técnico.
- Herramientas para restaurar fichas y evitar la pérdida accidental de información; validaciones antes de eliminar parcelas.
- Objetivo: asegurar la consistencia técnica de las superficies y su vinculación con la producción.

Imágenes relacionadas:

<p align="center">
  <img src="docs/Pantalla%20Gesti%C3%B3n%20e%20Importaci%C3%B3n%20SigPac%20de%20Zonas.jpg" width="220" alt="Importación SIGPAC" />
</p>
<p align="center"><strong>Figura:</strong> Importación y restauración de fichas SIGPAC.</p>

<p align="center">
  <img src="docs/Pantalla%20Gesti%C3%B3n%20de%20Zonas.jpg" width="220" alt="Gestión de Zonas" />
</p>
<p align="center"><strong>Figura:</strong> Visor de zonas catastrales y subparcelas.</p>

---

### 6) Gestión de gastos y control económico
Descripción funcional:
- Registro de gastos operativos vinculado a finca o campaña: mano de obra, transporte, maquinaria, insumos y otros costes.
- Clasificación por tipo de gasto y posibilidad de asociar al lote o a una serie de pesadas.
- Cálculo automático de coste unitario por quintal y generación de un informe económico consolidado.
- Objetivo: obtener visibilidad real del coste de explotación y márgenes por comprador.

Imágenes relacionadas:

<p align="center">
  <img src="docs/Pantalla%20de%20Gesti%C3%B3n%20de%20Gastos.jpg" width="220" alt="Gestión de Gastos" />
</p>
<p align="center"><strong>Figura:</strong> Registro y asignación de gastos por campaña.</p>

<p align="center">
  <img src="docs/Pantalla%20Ajustess.jpg" width="220" alt="Ajustes" />
</p>
<p align="center"><strong>Figura:</strong> Pantalla de ajustes y configuración del sistema.</p>

---

### 7) Informes y análisis
Descripción funcional:
- Generación de informes: balance de sacas, informe por zonas, histórico de liquidaciones e informe económico con cabeceras vendedor/comprador.
- Motor de gráficas dinámicas para análisis temporal y por calidad.
- Exportación nativa a PDF y Excel con formato profesional y logo configurable en cabecera.
- Objetivo: facilitar la documentación técnica y comercial para compradores, auditorías y presentaciones.

Imágenes relacionadas:

<p align="center">
  <img src="docs/Informe%20Balance%20de%20Sacas.jpg" width="220" alt="Informe Balance de Sacas" />
  <br />
  <img src="docs/informe%20por%20Zonas.jpg" width="220" alt="Informe por Zonas" />
</p>
<p align="center"><strong>Figura:</strong> Informes de balance y por zonas; exportación a PDF/XLSX.</p>

<p align="center">
  <img src="docs/informe%20hist%C3%B3rico%20de%20sacas.jpg" width="220" alt="Histórico" />
  <br />
  <img src="docs/Informe%20Econ%C3%B3mico.jpg" width="220" alt="Informe Económico" />
</p>
<p align="center"><strong>Figura:</strong> Histórico de sacas y resumen económico por campaña.</p>

<p align="center">
  <img src="docs/Informe%20con%20Graficas.jpg" width="220" alt="Gráficas" />
</p>
<p align="center"><strong>Figura:</strong> Gráficas dinámicas para análisis estadístico.</p>

---

## Operación offline y sincronización

- Almacenamiento local en IndexedDB con cola de cambios para sincronizar cuando haya conexión.
- Estrategia de fusión para minimizar conflictos; registro de última modificación y usuario.

---

## Seguridad y copias de seguridad

- Copias de seguridad cifradas y exportables. Recomendación: realizar backups periódicos tras jornadas de pesada.
- Control de accesos y permisos para evitar eliminaciones accidentales o cambios sin auditoría.

---

## Instalación y despliegue

Requisitos básicos: Node.js, npm, Capacitor. Pasos resumidos:

1. npm install
2. npm run build
3. npx cap add android
4. npx cap sync
5. npx cap open android (Compilar y firmar desde Android Studio/Xcode)

---

## Estructura de datos y exportación

- IndexedDB: tablas/objetos principales (fincas, parcelas, pesadas, compradores, gastos).
- Exportación: XLSX para tablas y PDF para informes formateados.

---

<div align="center">
  <p><strong>Desarrollado por</strong></p>
  <img src="icons/Logo SDOGFARMCORE.png" width="180" alt="Logo SDOGFARMCORE">
  <p><em>Ecosistema CORE de Gestión Inteligente</em></p>

  <h3>📄 Licencia y Soporte</h3>
  <p>© 2026 Cork Manager. Todos los derechos reservados.<br>
  Licencia de uso profesional v6.2.9</p>

  <p>Para soporte técnico o consultas comerciales:<br>
  📩 <a href="mailto:soporte.sdogfarm@gmail.com">soporte.sdogfarm@gmail.com</a></p>
</div>

<p align="center"><em>Documento actualizado con estructura funcional: descripción detallada de módulos seguida de las imágenes relacionadas.</em></p>
