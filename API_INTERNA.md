# 📚 Documentación API Interna - Pesadas-Corcho v5.9.3

## Módulos Principales

### 1. **App** (Router y Orquestador)
Principal punto de entrada y gestor de rutas.

#### Métodos Clave

##### `App.init()`
Inicializa la aplicación, configura listeners de eventos y carga la BD.
```javascript
await App.init();
// Inicia v5.9.3, carga IndexedDB, renderiza dashboard
```

##### `App.route(path, id?, action?)`
Enruta a una vista basada en hash URL.
```javascript
// Ejemplos de rutas:
// /                    → Dashboard
// /nueva              → Formulario nueva pesada
// /lista              → Listado de pesadas
// /zonas              → Gestión de zonas
// /zona/123           → Ficha detallada zona
// /zona/123/editar    → Editar zona
// /zona/nueva         → Crear nueva zona
// /pesada/456/editar  → Editar pesada
// /informes           → Generador de informes
// /ajustes            → Configuración
// /fincas             → Gestor multi-finca
// /importar-pdf       → Importar PDFs SIGPAC
```

---

### 2. **Fincas** (Gestor Multi-Finca)
Gestiona múltiples explotaciones con datos independientes.

#### Esquema
```javascript
{
  id: Number,                              // AutoIncrement
  nombre: String,                          // Ej: "Finca Los Alcornoques"
  propietario: String,                     // Ej: "David Asuar"
  direccion: String,
  cif: String,                             // NIF/CIF
  telefono: String,
  unidadMedida: String,                    // Enum: 'quintal_castellano' | 'quintal_metrico' | 'arroba' | 'manual'
  factorQuintal: Number,                   // Kg por quintal (default: 46)
  porcentajeOreo: Number,                  // % merma por oreo (default: 0)
  precios: {                               // Precios por calidad
    primera: { precioQuintal: Number },
    bornizo: { precioQuintal: Number },
    refugo: { precioQuintal: Number }
  },
  ultimaSaca: Number,                      // Saca más reciente
  creadoEn: ISO8601String
}
```

#### Métodos

##### `Fincas.list()`
```javascript
const fincas = await Fincas.list();
// Returns: Array<Finca>
```

##### `Fincas.get(id)`
```javascript
const finca = await Fincas.get(1);
// Returns: Finca
```

##### `Fincas.save(fincaData)`
```javascript
const id = await Fincas.save({
  nombre: "Mi Finca",
  propietario: "Juan",
  unidadMedida: 'quintal_castellano',
  factorQuintal: 46,
  porcentajeOreo: 5,
  precios: { primera: { precioQuintal: 80 }, ... }
});
```

##### `Fincas.getActive()`
Retorna la finca actualmente seleccionada.
```javascript
const finca = await Fincas.getActive();
```

##### `Fincas.setActive(fincaId)`
Establece la finca activa en el localStorage.
```javascript
await Fincas.setActive(fincaId);
// Dispara evento 'fincaChanged'
```

---

### 3. **Pesadas** (Registro de Operaciones)
Sistema de pesaje y seguimiento.

#### Esquema
```javascript
{
  id: Number,                              // AutoIncrement
  fincaId: Number,                         // FK a Fincas
  zonaId: Number,                          // FK a Zonas
  fecha: ISO8601String,                    // Con hora incluida
  saca: Number,                            // Número secuencial (auto)
  pesoBruto: Number,                       // Kg brutos
  tara: Number,                            // Kg tara
  kg: Number,                              // Calculado: pesoBruto - tara
  quintales: Number,                       // Calculado: kg / factorQuintal
  calidad: String,                         // 'primera' | 'bornizo' | 'refugo'
  pesadasPorCalidad: {                     // Desglose por calidad
    primera: { kg: Number, quintales: Number },
    bornizo: { kg: Number, quintales: Number },
    refugo: { kg: Number, quintales: Number }
  },
  cuadrilla: String,                       // Opcional: nombre equipo
  notas: String,                           // Campo libre
  creadoEn: ISO8601String,
  actualizadoEn: ISO8601String
}
```

#### Métodos

##### `Pesadas.list()`
```javascript
const pesadas = await Pesadas.list();
// Returns: Array<Pesada> (ordenado por fecha desc)
```

##### `Pesadas.get(id)`
```javascript
const pesada = await Pesadas.get(123);
```

##### `Pesadas.save(pesadaData)`
Crear o actualizar pesada. Calcula automáticamente kg, quintales.
```javascript
const id = await Pesadas.save({
  zonaId: 5,
  fecha: "2026-05-29T14:30:00",
  pesoBruto: 100,
  tara: 5,
  calidad: "primera",
  notas: "Pesada normal"
});
```

##### `Pesadas.delete(id)`
```javascript
await Pesadas.delete(123);
```

---

### 4. **Zonas** (Gestión SIGPAC)
Gestión de parcelas y datos catastrales.

#### Esquema
```javascript
{
  id: Number,
  fincaId: Number,                         // FK a Fincas
  nombre: String,                          // Ej: "Alcornocal Aula"
  refCatastral: String,                    // Ej: "10003A0008000J0001B"
  poligono: Number,
  parcela: Number,
  localizacion: String,
  paraje: String,
  municipio: String,
  provincia: String,
  clase: String,                           // Tipo de uso
  usoPrincipal: String,                    // Ej: "Bosque"
  superficieGrafica: Number,               // Ha
  superficieConstruida: Number,            // m²
  anoConstruccion: Number,
  cultivos: Array<String>,                 // Ej: ["Alcornoque", "Encina"]
  construcciones: Array<String>,           // Infraestructuras
  alcornoquesEstimados: Number,            // Árboles
  ultimoDescorche: String,                 // AAAA-MM-DD
  proximoDescorche: String,                // AAAA-MM-DD
  notas: String,
  croquisBlob: Blob|null,                  // Imagen PNG de croquis
  creadoEn: ISO8601String
}
```

#### Métodos

##### `Zonas.list()`
```javascript
const zonas = await Zonas.list();
```

##### `Zonas.get(id)`
```javascript
const zona = await Zonas.get(5);
```

##### `Zonas.save(zonaData)`
```javascript
const id = await Zonas.save({
  nombre: "Parcela Norte",
  refCatastral: "10003A...",
  poligono: 3,
  parcela: 1,
  municipio: "Prado del Rey",
  ultimoDescorche: "2023-06-15",
  proximoDescorche: "2026-06-15"
});
```

##### `Zonas.delete(id)`
```javascript
await Zonas.delete(5);
```

---

### 5. **Reportes** (Generación de Informes)
Sistema de análisis y reportería.

#### Métodos

##### `Reportes.generarReporteGlobalCampaña()`
Resumen por calidad de toda la campaña.
```javascript
const reporte = await Reportes.generarReporteGlobalCampaña();
// {
//   tipo: 'global',
//   totalesGlobales: {
//     primera: { kg, quintales, sacas },
//     bornizo: { kg, quintales, sacas },
//     refugo: { kg, quintales, sacas }
//   },
//   reportePorZona: { zonaId: { nombre, totales } }
// }
```

##### `Reportes.generarReporteEconomicoGlobal()`
Cálculo económico con mermas.
```javascript
const reporte = await Reportes.generarReporteEconomicoGlobal();
// {
//   tipo: 'economicoGlobal',
//   totales: {
//     primera: { bruto, merma, neto, valor },
//     ...
//   },
//   valorTotal: Number,
//   brutoTotal: Number,
//   netoTotal: Number,
//   oreo: Number (%)
// }
```

##### `Reportes.generarReportePorZona(zonaId)`
```javascript
const reporte = await Reportes.generarReportePorZona(5);
```

##### `Reportes.generarReporteEconomicoPorCalidad(calidad)`
```javascript
const reporte = await Reportes.generarReporteEconomicoPorCalidad('primera');
// {
//   reportePorZona: {
//     zonaId: { nombre, bruto, merma, neto, valor, sacas }
//   },
//   totales: { bruto, merma, neto, valor, sacas }
// }
```

---

### 6. **Informes** (Datos para Visualización)
Preparación de datos para gráficos e informes.

#### Métodos

##### `Informes.getDailyData(rango = 30)`
Datos diarios de producción (últimos N días).
```javascript
const data = await Informes.getDailyData(30);
// { labels: ['01/01', '01/02', ...], values: [100, 150, ...] }
```

##### `Informes.getQualityData()`
Desglose por calidades.
```javascript
const data = await Informes.getQualityData();
// { labels: ['1ª', 'Bornizo', 'Refugo'], values: [500, 300, 100] }
```

##### `Informes.renderChart(canvasId, type, data, title)`
Renderiza gráfico Chart.js.
```javascript
const chart = Informes.renderChart('my-canvas', 'bar', data, 'Producción Diaria');
// Retorna instancia Chart.js
```

---

### 7. **Export** (Importación/Exportación)
Backup y sincronización de datos.

#### Métodos

##### `Export.exportBackup(fincasIds?)`
Genera JSON con datos de fincas.
```javascript
await Export.exportBackup();                  // Exporta todas
await Export.exportBackup([1, 3]);            // Exporta fincas 1 y 3
// Descarga: Backup_MultiFinca_2026-05-29.json
```

##### `Export.importBackup(file)`
Importa archivo JSON.
```javascript
await Export.importBackup(fileInput.files[0]);
```

##### `Export.exportToExcel(reporteData)`
**[NUEVO]** Exporta reporte a Excel.
```javascript
const reporte = await Reportes.generarReporteEconomicoGlobal();
await Export.exportToExcel(reporte, 'Reporte_Economico');
```

##### `Export.parseBackupFile(file)`
Parsea JSON de backup.
```javascript
const data = await Export.parseBackupFile(file);
```

---

### 8. **PDFImport** (Importación de SIGPAC)
Extracción inteligente de datos de PDFs catastrales.

#### Métodos

##### `parsePdfCatastro(file)`
Extrae referencias de PDF SIGPAC.
```javascript
const zonas = await parsePdfCatastro(pdfFile);
// Returns: Array de objetos zona con datos extraídos
```

##### `extractLines(pdf)`
Extrae texto de PDF.
```javascript
const lines = await extractLines(pdfDoc);
```

---

### 9. **DB** (IndexedDB)
Capa de persistencia.

#### Stores
- `fincas` — Explotaciones
- `pesadas` — Registros de pesaje
- `zonas` — Parcelas SIGPAC
- `config` — Configuración legacy
- `precios` — Precios legacy

#### Métodos

##### `db.put(storeName, value)`
Guardar.
```javascript
const id = await db.put('pesadas', { zonaId: 5, ... });
```

##### `db.get(storeName, key)`
Obtener por clave.
```javascript
const pesada = await db.get('pesadas', 123);
```

##### `db.getAll(storeName)`
Obtener todos.
```javascript
const todas = await db.getAll('pesadas');
```

##### `db.getAllFromIndex(storeName, indexName, value)`
Filtrar por índice.
```javascript
const pesadas = await db.getAllFromIndex('pesadas', 'fincaId', 1);
```

##### `db.delete(storeName, key)`
Eliminar.
```javascript
await db.delete('pesadas', 123);
```

---

## Eventos Globales

### `fincaChanged`
Se dispara cuando cambia la finca activa.
```javascript
window.addEventListener('fincaChanged', () => {
  console.log('Finca cambió');
  // Re-renderizar vistas
});
```

---

## Utilidades Globales

### `App.toast(mensaje)`
Notificación temporal.
```javascript
App.toast('Datos guardados ✅');
```

### `App.toastError(mensaje)`
Notificación de error.
```javascript
App.toastError('Error al guardar');
```

---

## Ejemplo de Flujo Completo

### Crear una pesada nueva
```javascript
// 1. Obtener finca activa
const finca = await Fincas.getActive();

// 2. Crear pesada
const pesadaId = await Pesadas.save({
  zonaId: finca.ultimaSaca,
  fecha: new Date().toISOString(),
  pesoBruto: 95,
  tara: 4,
  calidad: 'primera',
  notas: 'Pesada de prueba'
});

// 3. Generar informe
const reporte = await Reportes.generarReporteGlobalCampaña();

// 4. Exportar
await Export.exportBackup([finca.id]);
```

---

## Configuración inicial (v5.9.3)

Cuando se abre la app sin datos, se dispara `renderWelcomeWizard()` que:
1. Crea la finca inicial
2. Inicializa IndexedDB v6
3. Migra datos de backups anteriores si existen
4. Carga datos de seed (zonas predefinidas)

---

## Compatibilidad Backward

La app restaura automáticamente datos de:
- v3.x (schema antiguo)
- v4.x (schema transicional)
- v5.0-5.9.2 (multi-finca)

La migración ocurre en `db.js → migrateToMultiFinca()`

---

**Última actualización:** 29 mayo 2026  
**Versión documentada:** 5.9.3  
**Autor:** Análisis AI 2026
