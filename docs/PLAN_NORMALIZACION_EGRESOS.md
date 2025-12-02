# Plan: Normalización e Interconexión de Egresos

## Análisis del CSV

El CSV de egresos tiene 461 filas con los siguientes problemas detectados:

### Problemas identificados:
1. **Emojis en nombres de empresa**: 206 casos (📦, 🏠, 🚛, ☀️, 🛒, 👨🏻‍💻, 🔧, ⚡️, 🍷, 🧔🏻, 👷🏼‍♀️, 🚀, 📈, 🩺, 🏦, etc.)
2. **Empresas únicas**: 44 empresas diferentes
3. **Líneas de negocio**: Pivot, iLab, Gaby Pino, Co-Founders Academy
4. **Categorías**: Automatización, CFH, Cursos, Estudios
5. **Equipos**: 57 miembros únicos del equipo
6. **Archivos**: 72 con factura, 172 con comprobante (Google Drive links)

## Normalizaciones Necesarias

### 1. Limpieza de Empresa
- Remover emojis del nombre de empresa (usar misma función `normalizeEmpresa` de clientes)
- Normalizar nombres para matching con clientes y proyectos

### 2. Normalización de Mes
- Ya existe función `normalizeMes` pero verificar que maneje todos los casos
- Formato objetivo: "Mes Año" (ej: "Enero 2024", "Diciembre 2025")

### 3. Normalización de Fecha de Pago
- Ya existe función `normalizeFechaPago` pero verificar formato
- Formato objetivo: "YYYY-MM-DD"

### 4. Normalización de Valores Numéricos
- Ya se maneja pero verificar casos edge
- Manejar "$1,000" → 1000
- Calcular Total si falta pero hay Subtotal e IVA

## Interconexión con Clientes y Proyectos

### Estrategia de Vinculación

1. **Fase 1: Normalizar empresa del egreso**
   - Remover emojis
   - Normalizar nombre (trim, lowercase para matching)

2. **Fase 2: Buscar cliente por empresa**
   - Buscar en colección `clientes` por campo `empresa` (normalizado)
   - Si se encuentra, guardar `clienteId` en el egreso

3. **Fase 3: Buscar proyectos asociados**
   - Si se encontró cliente, buscar proyectos con `clientId` igual al `clienteId`
   - Si no se encontró cliente, buscar proyectos por `client` (nombre) que coincida con empresa normalizada
   - Guardar array de `proyectoIds` en el egreso

4. **Fase 4: Reporte de conexiones**
   - Mostrar en diálogo de carga:
     - Egresos vinculados a clientes existentes
     - Egresos vinculados a proyectos existentes
     - Egresos sin conexión (empresas nuevas)

## Cambios en el Modelo de Datos

### Actualizar tipo `Egreso`
```typescript
export type Egreso = {
  // ... campos existentes ...
  clienteId?: string;  // ID del cliente si se encuentra
  proyectoIds?: string[];  // IDs de proyectos asociados
  empresaNormalizada?: string;  // Nombre de empresa sin emojis para referencia
}
```

### Actualizar `EgresoEntity` en repositorio
- Agregar campos `clienteId`, `proyectoIds`, `empresaNormalizada`

## Mejoras al Endpoint de Carga

### Actualizar `/api/egresos/upload-historical/route.ts`

1. **Agregar importaciones necesarias**:
   - `clientesRepository` para buscar clientes
   - `projectsRepository` para buscar proyectos

2. **Agregar función de matching de empresas**:
   ```typescript
   function matchEmpresaWithCliente(empresaNormalizada: string, clientes: ClienteEntity[]): ClienteEntity | null {
     // Buscar por nombre exacto (case-insensitive)
     // Buscar por nombre parcial si no hay match exacto
   }
   ```

3. **Agregar función de búsqueda de proyectos**:
   ```typescript
   async function findProyectosForEmpresa(empresaNormalizada: string, clienteId?: string): Promise<string[]> {
     // Si hay clienteId, buscar proyectos por clientId
     // Si no, buscar proyectos por nombre de client
   }
   ```

4. **Modificar procesamiento de filas**:
   - Normalizar empresa (remover emojis)
   - Buscar cliente
   - Buscar proyectos
   - Guardar `clienteId` y `proyectoIds` en el egreso
   - Guardar `empresaNormalizada` para referencia

5. **Agregar estadísticas de conexiones**:
   - Contador de egresos con cliente vinculado
   - Contador de egresos con proyectos vinculados
   - Lista de empresas sin cliente/proyecto

## Actualización de la UI

### Actualizar `EgresosBasadosEnHorasTable`

1. **Agregar columnas opcionales**:
   - Columna "Cliente" (mostrar nombre si hay `clienteId`)
   - Columna "Proyectos" (mostrar badges con nombres de proyectos si hay `proyectoIds`)

2. **Agregar filtros**:
   - Filtro por cliente vinculado
   - Filtro por proyecto vinculado
   - Filtro por "Sin conexión" (egresos sin cliente ni proyecto)

3. **Agregar indicadores visuales**:
   - Badge/icono para egresos con cliente vinculado
   - Badge/icono para egresos con proyectos vinculados
   - Tooltip mostrando información de conexiones

### Actualizar `CargarHistoricoDialog`

1. **Agregar sección de conexiones**:
   - Mostrar resumen: X egresos vinculados a clientes, Y egresos vinculados a proyectos
   - Lista de empresas sin cliente/proyecto encontrado
   - Lista de empresas con múltiples proyectos asociados

2. **Agregar visualización de detalles**:
   - Expandir para ver qué egresos se vincularon a qué clientes/proyectos
   - Mostrar advertencias para empresas que no tienen cliente pero tienen proyectos

## Archivos a Modificar

1. **`lib/mock-data/finanzas.ts`**:
   - Actualizar tipo `Egreso` con campos `clienteId`, `proyectoIds`, `empresaNormalizada`

2. **`lib/repositories/egresos-repository.ts`**:
   - Actualizar `EgresoEntity` con nuevos campos

3. **`app/api/egresos/upload-historical/route.ts`**:
   - Agregar funciones de normalización de empresa
   - Agregar funciones de matching con clientes y proyectos
   - Modificar procesamiento para incluir conexiones
   - Agregar estadísticas de conexiones al response

4. **`components/finanzas/egresos-basados-en-horas-table.tsx`**:
   - Agregar columnas de cliente y proyectos
   - Agregar filtros de conexión
   - Agregar indicadores visuales

5. **`components/finanzas/cargar-historico-dialog.tsx`**:
   - Agregar sección de reporte de conexiones
   - Mostrar estadísticas de vinculación

6. **`lib/api/finanzas-api.ts`**:
   - Actualizar tipos/interfaces si es necesario

## Consideraciones Adicionales

1. **Matching flexible de empresas**:
   - Considerar variaciones en nombres (ej: "📦 Emissary" vs "Emissary")
   - Considerar nombres parciales si no hay match exacto
   - Log de matches para revisión manual si es necesario

2. **Performance**:
   - Cargar todos los clientes y proyectos una vez al inicio
   - Crear índices/mapas para búsqueda rápida
   - Evitar queries individuales por cada egreso

3. **Manejo de errores**:
   - Si falla la vinculación, no fallar la creación del egreso
   - Log de errores de vinculación para revisión
   - Permitir vinculación manual posterior si es necesario

4. **Actualización de egresos existentes**:
   - Considerar script para actualizar egresos ya cargados
   - O permitir re-procesamiento con opción de actualizar existentes

