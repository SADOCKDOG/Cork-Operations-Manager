<h1 align="center"</h1>

<p align="center">
  <img src="MANUAL/README/Logo%20cabecera.png" width="400" alt="Logo Cabecera">
</p>

<p align="center">
  <b>Solución profesional para la gestión integral y digitalización de sacas de corcho</b>
</p>

---

### Descripción General

**Chamorro's Cork Manager** es una plataforma móvil avanzada diseñada específicamente para optimizar la gestión de explotaciones corcheras. Desarrollada para operar en condiciones exigentes de campo, la aplicación permite un control técnico y económico riguroso en tiempo real, facilitando la toma de decisiones basada en datos precisos.

---

### Funcionalidades de Alto Rendimiento

#### Panel de Control y Monitorización
Visualización centralizada de la producción diaria. El sistema ofrece un desglose inmediato de kilogramos y unidades de medida regionales (Quintales) clasificados por calidades: Primera, Bornizo y Refugo. La interfaz está optimizada para una legibilidad máxima bajo exposición solar directa.

<p align="center">
  <img src="MANUAL/README/Pantalla%20Inicio.jpg" width="250" alt="Dashboard">
</p>

#### Gestión Técnica y Catastral (SIGPAC)
Administración detallada de parcelas mediante la integración de datos oficiales. La aplicación procesa documentos PDF del Catastro/SIGPAC para extraer automáticamente referencias, superficies gráficas y tablas de aprovechamiento por subparcela.

<p align="center">
  <img src="MANUAL/README/Pantalla%20Gestión%20de%20Zonas.jpg" width="250" alt="Gestión de Zonas">
</p>

#### Registro de Operaciones
Sistema de pesadas con trazabilidad completa. Permite el seguimiento exhaustivo de cada saca, incluyendo **edición histórica**, **eliminación de registros**, control por zona de explotación y auditoría de calidad.

<p align="center">
  <img src="MANUAL/README/Pantalla%20De%20Lista%20de%20pesadas.jpg" width="250" alt="Lista de Pesadas">
</p>

#### Gestión Multi-Finca Integrada
Soporte completo para múltiples explotaciones. La aplicación permite crear, editar y gestionar varias fincas independientes con sus propios parámetros técnicos, precios y calendarios de siega. Incluye importación/exportación de datos por finca y sincronización automática de referencias catastrales desde carpetas locales.

<p align="center">
  <img src="MANUAL/README/Pantalla%20Gestión%20de%20Zonas.jpg" width="250" alt="Gestión de Zonas">
  <img src="MANUAL/README/Gestión%20Multi-Finca%20Integrada.jpg" width="250" alt="Gestor de Fincas">
</p>

#### Inteligencia de Negocio e Informes
Generación automatizada de documentación profesional exportable a formato PDF:
*   **Informe de Campaña:** Balance global de producción.
*   **Liquidación Económica:** Cálculo de valores netos aplicando mermas técnicas (Oreo) y precios de mercado actualizados.
*   **Análisis por Calidad:** Desglose pormenorizado para la gestión de activos.

<p align="center">
  <img src="MANUAL/README/Pantalla%20Informes%20Global.jpg" width="250" alt="Informe Global">
  <img src="MANUAL/README/Pantalla%20Informes%20Economicos.jpg" width="250" alt="Informe Económico">
  <img src="MANUAL/README/Pantalla%20Informes%20por%20Calidad.jpg" width="250" alt="Informe Calidad">
</p>

#### Edición y Mantenimiento de Datos
**Zonas SIGPAC:** Edición completa de referencias catastrales, superficies, cultivos y fechas de descorche con captura automática de croquis gráficos.
**Pesadas:** Modificación posterior de registros históricos con trazabilidad de cambios. Actualización automática de quintales y cálculos derivados.

#### Seguridad y Configuración Avanzada
Personalización corporativa de la explotación (Titularidad, Identificación Fiscal, Tarifas). Incluye sistemas robustos de respaldo de datos (Backup) y protocolos de importación/exportación multi-finca. **Sincronización automática** de nuevas zonas desde carpetas de importación.

<p align="center">
  <img src="MANUAL/README/Ajustes%20Datos%20de%20la%20saca.jpg" width="250" alt="Ajustes">
  <img src="MANUAL/README/Ajustes%20Iportación%20y%20exportación.jpg" width="250" alt="Backup">
</p>

---

### Especificaciones Técnicas

*   **Arquitectura:** Capacitor para despliegue multiplataforma nativo.
*   **Motor de Datos:** IndexedDB v6 para persistencia de alta velocidad sin conexión.
*   **Interfaz de Usuario:** Deep Dark UI optimizada para paneles OLED.
*   **Procesamiento:** Lógica de negocio en JavaScript (ES6+).
*   **Exportación:** Motor html2pdf.js para documentos técnicos de alta fidelidad.
*   **Operación Offline:** Service Worker integrado con sincronización automática de cambios.
*   **Versión:** 5.9.3 (Multi-finca, ediciones completas, sincronización automática)

---

### Notas de Versión (v5.9.3)

**Características principales:**
- ✅ Gestión multi-finca avanzada
- ✅ Edición completa de pesadas y zonas
- ✅ Sincronización automática de datos
- ✅ PWA con funcionamiento offline total
- ✅ Importación inteligente de PDFs SIGPAC
- ✅ Informes económicos con mermas configurables

**Compatibilidad:** Restaura automáticamente datos de versiones v3.x, v4.x y v5.x

---

### Licencia y Propiedad

Este software es de uso exclusivo familiar y privado. Todos los derechos reservados © 2024 David Asuar.

*Innovación y digitalización para el sector corchero.*
