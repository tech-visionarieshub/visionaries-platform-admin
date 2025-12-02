# Normalización e Interconexión de Egresos desde CSV

## Análisis del CSV

El CSV tiene 461 filas (incluyendo header) con los siguientes problemas detectados:

### Problemas identificados:
1. **Emojis en nombres de empresa**: 206 casos (📦, 🏠, 🚛, ☀️, 🛒, 👨🏻‍💻, 🔧, ⚡️, 🍷, 🧔🏻, 👷🏼‍♀️, 🚀, 📈, 🩺, 🏦, etc.)
2. **Empresas únicas**: 44 empresas diferentes
3. **Líneas de negocio**: Pivot, iLab, Gaby Pino, Co-Founders Academy
4. **Categorías**: Automatización, CFH, Cursos, Estudios
5. **Equipos**: 57 miembros únicos
6. **Archivos**: 72 con factura, 172 con comprobante (Google Drive links)

## Normalizaciones Necesarias

### 1. Limpieza de Empresa
- Remover emojis del nombre de empresa (reutilizar `normalizeEmpresa` de clientes)
- Normalizar nombres para matching con clientes y proyectos
- Guardar versión normalizada en campo `empresaNormalizada`

### 2. Normalización de Mes
- Verificar que `normalizeMes` maneje todos los casos del CSV
- Formato objetivo: "Mes Año" (ej: "Enero 2024", "Diciembre 2025")

### 3. Normalización de Fecha de Pago
- Verificar que `normalizeFechaPago` maneje formato "DD-MMM-YYYY" (ej: "15-ene-2024")
- Formato objetivo: "YYYY-MM-DD"

### 4. Normalización de Valores Numéricos
- Ya se maneja pero verificar casos edge con "$" y comas
- Asegurar cálculo de Total si falta

## Interconexión con Clientes y Proyectos

### Estrategia de Vinculación Automática

1. **Fase 1**: Normalizar empresa del egreso (remover emojis, trim, lowercase)
2. **Fase 2**: Buscar cliente en colección `clientes` por campo `empresa` (normalizado, case-insensitive)
3. **Fase 3**: Si se encuentra cliente:
   - Guardar `clienteId` en el egreso
   - Buscar proyectos con `clientId` igual al `clienteId` encontrado
   - Guardar array de `proyectoIds` en el egreso
4. **Fase 4**: Si NO se encuentra cliente:
   - Buscar proyectos por campo `client` (nombre) que coincida con empresa normalizada
   - Guardar array de `proyectoIds` si se encuentran proyectos
5. **Fase 5**: Reportar conexiones en el diálogo de carga

## Mejoras al Endpoint de Carga

### Actualizar `/api/egresos/upload-historical/route.ts`

- Importar `clientesRepository` y `projectsRepository`
- Agregar función `normalizeEmpresa()` (reutilizar de clientes o crear utilidad compartida)
- Agregar función `matchEmpresaWithCliente(empresaNormalizada: string, clientes: ClienteEntity[]): ClienteEntity | null`
- Agregar función `findProyectosForEmpresa(empresaNormalizada: string, clienteId?: string): Promise<string[]>`
- **Agregar función de detección de duplicados**:
  - `findDuplicateEgreso(egresoData: Egreso, existingEgresos: EgresoEntity[]): EgresoEntity | null`
  - Criterio de duplicado: misma empresa normalizada + mismo concepto + mismo mes + misma fecha de pago (o diferencia < 3 días)
  - Si se encuentra duplicado, ACTUALIZAR en lugar de crear
- Cargar todos los clientes, proyectos Y egresos existentes al inicio (una vez, no por cada egreso)
- Crear mapas/indexes para búsqueda rápida:
  - `clientesMap`: Map<empresaNormalizada, ClienteEntity>
  - `proyectosPorClienteId`: Map<clienteId, ProjectEntity[]>
  - `proyectosPorNombreCliente`: Map<clientName, ProjectEntity[]>
  - `egresosMap`: Map<hashKey, EgresoEntity> para detección de duplicados
- En el procesamiento de cada fila:
  - Normalizar empresa
  - Verificar si existe duplicado usando el mapa de egresos
  - Si existe duplicado: ACTUALIZAR el egreso existente (preservar ID y archivos existentes)
  - Si NO existe: crear nuevo egreso
  - Buscar cliente usando el mapa
  - Buscar proyectos usando los mapas
  - Agregar `clienteId`, `proyectoIds`, `empresaNormalizada` al objeto egreso
- Agregar estadísticas al response:
  - `created`: número de egresos creados
  - `updated`: número de egresos actualizados (duplicados)
  - `withCliente`: número de egresos vinculados a clientes
  - `withProyectos`: número de egresos vinculados a proyectos
  - `empresasSinCliente`: lista de empresas que no tienen cliente pero tienen proyectos
  - `empresasSinConexion`: lista de empresas sin cliente ni proyecto

## Actualización del Modelo de Datos

### Actualizar tipo `Egreso` en `lib/mock-data/finanzas.ts`
```typescript
export type Egreso = {
  // ... campos existentes ...
  clienteId?: string;  // ID del cliente si se encuentra
  proyectoIds?: string[];  // IDs de proyectos asociados
  empresaNormalizada?: string;  // Nombre de empresa sin emojis para referencia
}
```

### Actualizar `EgresoEntity` en `lib/repositories/egresos-repository.ts`
- Agregar campos opcionales: `clienteId`, `proyectoIds`, `empresaNormalizada`

## Actualización de la UI

### Actualizar `components/finanzas/egresos-basados-en-horas-table.tsx`

1. **Agregar columnas opcionales** (mostrar solo si hay datos):
   - Columna "Cliente": mostrar nombre del cliente si hay `clienteId` (con link a detalle de cliente)
   - Columna "Proyectos": mostrar badges con nombres de proyectos si hay `proyectoIds` (con links a proyectos)

2. **Agregar filtros**:
   - Filtro "Con Cliente": mostrar solo egresos con `clienteId`
   - Filtro "Con Proyectos": mostrar solo egresos con `proyectoIds`
   - Filtro "Sin Conexión": mostrar solo egresos sin `clienteId` ni `proyectoIds`

3. **Agregar indicadores visuales**:
   - Badge/icono verde para egresos con cliente vinculado
   - Badge/icono azul para egresos con proyectos vinculados
   - Tooltip mostrando información de conexiones al hover

4. **Corregir y agregar acciones**:
   - **Corregir botón de borrar**: Verificar que `deleteEgreso` funcione correctamente (usar `withFinanzasAuth` en endpoint)
   - **Agregar botón de editar**: Agregar botón de edición en la columna de acciones
   - **Crear diálogo de edición**: Componente `EditarEgresoDialog` para editar campos del egreso
   - Botón para vincular manualmente un egreso a un cliente/proyecto (futuro)

### Actualizar `components/finanzas/cargar-historico-dialog.tsx`

1. **Agregar sección de conexiones en resultados**:
   - Mostrar resumen: "X egresos vinculados a clientes, Y egresos vinculados a proyectos"
   - Lista expandible de empresas sin cliente/proyecto encontrado
   - Lista expandible de empresas con múltiples proyectos asociados
   - Advertencias para empresas que no tienen cliente pero tienen proyectos (sugerir crear cliente)

2. **Agregar visualización de detalles de conexiones**:
   - Expandir para ver qué egresos se vincularon a qué clientes/proyectos
   - Mostrar iconos/colores para indicar tipo de conexión

## Archivos a Modificar

- `lib/mock-data/finanzas.ts`: Agregar campos `clienteId`, `proyectoIds`, `empresaNormalizada` al tipo `Egreso`
- `lib/repositories/egresos-repository.ts`: Actualizar `EgresoEntity` con nuevos campos
- `app/api/egresos/upload-historical/route.ts`: 
  - Agregar funciones de normalización y matching
  - **Agregar detección de duplicados y lógica de actualización**
  - Modificar procesamiento para incluir conexiones
  - Agregar estadísticas de conexiones y duplicados al response
- `app/api/egresos/[id]/route.ts`:
  - **Cambiar `withAuth` a `withFinanzasAuth` en PUT y DELETE** para consistencia
- `components/finanzas/egresos-basados-en-horas-table.tsx`: 
  - Agregar columnas de cliente y proyectos
  - Agregar filtros de conexión
  - Agregar indicadores visuales
  - **Agregar botón de editar y handler `handleEditEgreso`**
  - **Corregir handler de borrar si es necesario**
- `components/finanzas/editar-egreso-dialog.tsx` (NUEVO):
  - Crear componente de diálogo para editar egreso
  - Formulario con todos los campos editables
  - Validación de campos
  - Integración con `updateEgreso` API
- `components/finanzas/cargar-historico-dialog.tsx`: 
  - Agregar sección de reporte de conexiones
  - Mostrar estadísticas de vinculación
  - **Mostrar estadísticas de duplicados actualizados**
- `lib/api/finanzas-api.ts`: Actualizar tipos/interfaces si es necesario

## Consideraciones de Implementación

1. **Matching flexible de empresas**:
   - Comparación case-insensitive
   - Considerar variaciones en nombres (ej: "📦 Emissary" vs "Emissary")
   - Si no hay match exacto, considerar match parcial (empresa del egreso contiene nombre del cliente o viceversa)
   - Log de matches para revisión manual si es necesario

2. **Performance**:
   - Cargar todos los clientes y proyectos UNA VEZ al inicio del procesamiento
   - Crear mapas/indexes en memoria para búsqueda O(1)
   - Evitar queries individuales a Firestore por cada egreso

3. **Manejo de errores**:
   - Si falla la vinculación, NO fallar la creación del egreso
   - Log de errores de vinculación para revisión
   - Continuar procesamiento aunque falle alguna vinculación

4. **Compatibilidad**:
   - Los campos nuevos son opcionales, no rompen egresos existentes
   - Egresos sin conexión funcionan normalmente

5. **Detección de Duplicados**:
   - Crear hash único basado en: empresa normalizada + concepto + mes + fecha de pago
   - Si fecha de pago difiere en menos de 3 días, considerar duplicado
   - Al actualizar duplicado, preservar:
     - ID del egreso existente
     - Archivos (factura/comprobante) si ya existen
     - Campos de conexión (clienteId, proyectoIds) si ya existen
     - Actualizar solo campos que han cambiado

