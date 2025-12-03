# Plan: Dashboard Mensual y Gestión de Egresos del Mes en Curso

## Objetivos
1. Agregar dashboard mensual con selector de mes mostrando lo pagado y por pagar
2. Implementar sistema para crear egresos del mes en curso directamente en la tabla
3. Permitir seleccionar persona, tarea (de team tasks completadas o features completadas), horas y precio por hora
4. Autocalcular total (horas × precio por hora)
5. Sistema de IVA opcional (16%) con checkbox
6. Guardar como "Pendiente" por defecto
7. Nueva pestaña "Precios por Hora" para configurar precios

## Cambios en el Modelo de Datos

### Actualizar tipo `Egreso` en `lib/mock-data/finanzas.ts`
Agregar campos opcionales:
- `persona`: string (nombre del miembro del equipo)
- `tarea`: string (nombre de la tarea o funcionalidad)
- `horas`: number (horas trabajadas)
- `precioPorHora`: number (precio por hora de la persona)
- `tareaId`: string (ID de la tarea si viene de team tasks)
- `featureId`: string (ID de la funcionalidad si viene de features)
- `tareaTipo`: "team-task" | "feature" (tipo de tarea)
- `aplicarIva`: boolean (si se aplica IVA del 16%)

### Actualizar `EgresoEntity` en `lib/repositories/egresos-repository.ts`
Agregar los mismos campos opcionales

### Crear tipo `PrecioPorHora` en `lib/mock-data/finanzas.ts`
```typescript
export type PrecioPorHora = {
  id: string
  personaEmail: string
  personaNombre: string
  precioPorHora: number
  createdAt?: Date | string
  updatedAt?: Date | string
}
```

### Crear repositorio `lib/repositories/precios-por-hora-repository.ts`
- Extender `BaseRepository<PrecioPorHora>`
- Colección: `precios-por-hora`
- Método `getByPersonaEmail(email: string)`

## Dashboard Mensual

### Crear componente `components/finanzas/dashboard-mensual.tsx`
- Selector de mes (dropdown con meses disponibles, ordenados del más actual al más viejo)
- Dos tarjetas principales:
  - **Pagado en el mes**: Suma de egresos con status "Pagado" del mes seleccionado
  - **Por Pagar en el mes**: Suma de egresos con status "Pendiente" del mes seleccionado
- Mostrar totales en formato de moneda
- Integrar en `components/finanzas/egresos-basados-en-horas-table.tsx` arriba de las tarjetas existentes

## Nueva Pestaña "Precios por Hora"

### Modificar `app/finanzas/layout.tsx`
- Agregar nueva pestaña: `{ name: "Precios por Hora", href: "/finanzas/precios-por-hora" }`

### Crear `app/finanzas/precios-por-hora/page.tsx`
- Página con componente `PreciosPorHoraTable`

### Crear `components/finanzas/precios-por-hora-table.tsx`
- Tabla con columnas: Persona, Email, Precio por Hora, Acciones
- Botón "Agregar Precio" para crear nuevo precio
- Botón "Editar" en cada fila
- Diálogo para crear/editar precio
- Cargar usuarios del sistema para seleccionar persona
- Guardar en Firestore colección `precios-por-hora`

## API para Precios por Hora

### Crear `app/api/precios-por-hora/route.ts`
- GET: Obtener todos los precios
- POST: Crear nuevo precio
- PUT: Actualizar precio existente
- DELETE: Eliminar precio
- Usar `withFinanzasAuth` para autenticación

### Actualizar `lib/api/finanzas-api.ts`
- Agregar funciones: `getPreciosPorHora()`, `createPrecioPorHora()`, `updatePrecioPorHora()`, `deletePrecioPorHora()`

## Creación de Egresos del Mes en Curso

### Modificar `components/finanzas/egresos-basados-en-horas-table.tsx`

#### 1. Agregar botón "Nuevo Egreso" 
- Botón al lado de "Cargar Histórico"
- Abre diálogo para crear egreso del mes en curso

#### 2. Crear diálogo `components/finanzas/nuevo-egreso-dialog.tsx`
Formulario con campos:
- **Persona** (Select): Lista de usuarios del sistema (usar `getUsers()`)
- **Tipo de Tarea** (Select):
  - Opción 1: "Tarea del Equipo" → Cargar team tasks con status "completed"
  - Opción 2: "Funcionalidad" → Cargar features con status "done" o "completed"
- **Proyecto** (Select, opcional): Solo si se selecciona "Funcionalidad"
- **Tarea/Funcionalidad** (Select): Lista de tareas/features completadas según tipo seleccionado
- **Horas** (Input number): Horas trabajadas
- **Precio por Hora** (Input number): Precio por hora de la persona
  - Si existe precio configurado, prellenar automáticamente
  - Permitir editar
- **Aplicar IVA (16%)** (Checkbox): Por defecto desactivado
- **Concepto** (Input, auto-generado): "Persona - Tarea" o editable
- **Mes** (Auto): Mes actual en formato "Enero 2025"
- **Status** (Auto): "Pendiente"
- **Tipo** (Auto): "Variable"

#### 3. Lógica de autocalculo
- Al cambiar horas o precio por hora:
  - `subtotal = horas × precioPorHora`
  - Si checkbox IVA activado: `iva = subtotal × 0.16`, `total = subtotal + iva`
  - Si checkbox IVA desactivado: `iva = 0`, `total = subtotal`
- Actualizar campos automáticamente

#### 4. Integración con Team Tasks
- Cargar team tasks con `getTeamTasks({ status: 'completed' })`
- Al seleccionar tarea, prellenar:
  - `tareaId`: ID de la tarea
  - `tareaTipo`: "team-task"
  - `concepto`: Nombre de la tarea
  - `horas`: Si la tarea tiene `actualHours`, prellenar

#### 5. Integración con Features
- Cargar features con `getFeatures(projectId)` y filtrar por `status === 'done' || status === 'completed'`
- Al seleccionar funcionalidad, prellenar:
  - `featureId`: ID de la funcionalidad
  - `tareaTipo`: "feature"
  - `concepto`: Nombre de la funcionalidad
  - `proyectoId`: ID del proyecto seleccionado
  - `horas`: Si la feature tiene `actualHours`, prellenar

#### 6. Carga de Precio por Hora
- Al seleccionar persona, buscar precio en Firestore
- Si existe, prellenar campo "Precio por Hora"
- Si no existe, dejar vacío para que el usuario lo ingrese

## Archivos a Modificar/Crear

1. **`lib/mock-data/finanzas.ts`**: 
   - Agregar campos nuevos al tipo `Egreso`
   - Crear tipo `PrecioPorHora`

2. **`lib/repositories/egresos-repository.ts`**: Actualizar `EgresoEntity`

3. **`lib/repositories/precios-por-hora-repository.ts`** (NUEVO): Repositorio para precios

4. **`app/api/precios-por-hora/route.ts`** (NUEVO): API para CRUD de precios

5. **`app/finanzas/precios-por-hora/page.tsx`** (NUEVO): Página de configuración

6. **`components/finanzas/precios-por-hora-table.tsx`** (NUEVO): Tabla de gestión

7. **`components/finanzas/dashboard-mensual.tsx`** (NUEVO): Dashboard mensual con selector

8. **`components/finanzas/nuevo-egreso-dialog.tsx`** (NUEVO): Diálogo para crear egreso

9. **`components/finanzas/egresos-basados-en-horas-table.tsx`**: 
   - Integrar dashboard mensual
   - Agregar botón "Nuevo Egreso"
   - Cargar usuarios y precios por hora

10. **`app/finanzas/layout.tsx`**: Agregar pestaña "Precios por Hora"

11. **`lib/api/finanzas-api.ts`**: Agregar funciones para precios por hora

12. **`app/api/egresos/route.ts`**: Verificar que acepte los nuevos campos

## Consideraciones de Implementación

1. **Mes en curso**: Usar función `parseMesToDate` existente para determinar mes actual
2. **Precios por hora**: Guardar en Firestore colección `precios-por-hora` (persistente, compartido)
3. **Carga de tareas/features**: 
   - Team tasks: Filtrar por `status === 'completed'`
   - Features: Filtrar por `status === 'done' || status === 'completed'`
4. **Validaciones**:
   - Persona requerida
   - Tarea requerida (team task o feature)
   - Horas > 0
   - Precio por hora > 0
   - Si es feature, proyecto requerido
5. **Auto-generación de concepto**: 
   - Formato: "{Persona} - {Tarea}"
   - Permitir editar manualmente
6. **IVA**:
   - Checkbox desactivado por defecto
   - Si activado: calcular 16% sobre subtotal
   - Si desactivado: iva = 0, total = subtotal

## Flujo de Usuario

1. Usuario hace clic en "Nuevo Egreso"
2. Se abre diálogo con formulario
3. Usuario selecciona persona del dropdown
4. Sistema busca precio por hora en Firestore y prellena si existe
5. Usuario selecciona tipo de tarea (Team Task o Funcionalidad)
6. Si es funcionalidad, selecciona proyecto primero
7. Usuario selecciona tarea/feature completada del dropdown
8. Sistema prellena horas si la tarea/feature tiene `actualHours`
9. Usuario ingresa o ajusta horas y precio por hora
10. Sistema autocalcula subtotal = horas × precio por hora
11. Usuario puede activar checkbox "Aplicar IVA (16%)"
12. Si IVA activado: sistema calcula iva = subtotal × 0.16 y total = subtotal + iva
13. Si IVA desactivado: iva = 0 y total = subtotal
14. Usuario puede editar concepto si lo desea
15. Usuario guarda → Egreso creado con status "Pendiente" y mes actual


