# Plan de Implementación: Sistema de QA Tasks

**Estado:** Listo para implementación  
**Última actualización:** 22 Nov 2025  
**Prioridad:** Media (después de estabilizar plataforma)  
**Estimación:** ~21 horas

## 📚 Lecciones Aprendidas (Errores a Evitar)

### ❌ Errores Cometidos en Implementación Anterior

1. **Timeouts Agresivos en Autenticación**
   - **Error:** Agregar `AbortController` con timeout de 15s en `layout-wrapper.tsx`
   - **Problema:** Causó `AbortError` y bloqueó el acceso de usuarios
   - **Lección:** NO modificar código de autenticación sin pruebas exhaustivas
   - **Solución:** Si se necesita timeout, usar valores conservadores (30s+) y solo para APIs externas

2. **Modificar Código Crítico Sin Reversión Fácil**
   - **Error:** Cambiar `layout-wrapper.tsx` sin mantener versión funcional
   - **Problema:** Difícil revertir cuando algo falla
   - **Lección:** Crear feature flags o branches separadas para cambios críticos
   - **Solución:** Implementar en branch separada y mergear solo después de pruebas

3. **No Probar en Desarrollo Antes de Producción**
   - **Error:** Hacer cambios directamente en main sin probar localmente
   - **Problema:** Errores en producción afectan usuarios
   - **Lección:** Siempre probar localmente primero
   - **Solución:** Usar `npm run dev` y probar flujo completo antes de commit

4. **Logs Excesivos en Producción**
   - **Error:** Agregar muchos `console.log` en código de producción
   - **Problema:** Ruido en logs, dificulta debugging real
   - **Lección:** Usar niveles de log apropiados
   - **Solución:** Usar `console.error` solo para errores, `console.log` solo en desarrollo

5. **No Documentar Cambios Críticos**
   - **Error:** No documentar por qué se agregaron timeouts
   - **Problema:** Difícil entender decisiones después
   - **Lección:** Documentar TODOS los cambios críticos
   - **Solución:** Incluir comentarios explicativos y actualizar docs

### ✅ Mejores Prácticas para Esta Implementación

1. **Branch Separada para QA System**
   ```bash
   git checkout -b feature/qa-system
   # Implementar todo aquí
   # Probar exhaustivamente
   # Mergear solo cuando esté 100% funcional
   ```

2. **Feature Flags para Nuevas Funcionalidades**
   ```typescript
   const ENABLE_QA_SYSTEM = process.env.NEXT_PUBLIC_ENABLE_QA === 'true'
   ```

3. **Testing Incremental**
   - Implementar una feature a la vez
   - Probar cada feature antes de continuar
   - No hacer múltiples cambios simultáneos

4. **Reversión Fácil**
   - Mantener código anterior comentado temporalmente
   - Usar feature flags para activar/desactivar
   - Documentar cómo revertir cada cambio

## 🎯 Objetivo

Implementar un sistema completo de gestión de tareas QA que permita:
- Subir tareas QA vía CSV/Excel con análisis inteligente de columnas (OpenAI)
- Gestionar screenshots y previsualizaciones de imágenes
- Auto-generar criterios de aceptación usando OpenAI
- Editar todas las tareas y campos en la plataforma
- **SIN afectar el sistema de autenticación existente**

## 📋 Requisitos Funcionales

### 1. Importación de Archivos CSV/Excel
- **Funcionalidad:** Permitir carga de archivos CSV o Excel
- **Análisis Inteligente:** 
  - OpenAI analiza automáticamente headers del archivo
  - Mapea columnas a campos QA estándar
  - Si no hay mapping, crea campo "comentarios" con el contenido
- **Soporte:**
  - Formatos: .csv, .xlsx
  - Librerías: `papaparse` (CSV) y `xlsx` (Excel)
- **Validación:**
  - Verificar que el archivo no esté vacío
  - Validar formato antes de procesar
  - Mostrar errores claros al usuario

### 2. Mapeo de Columnas
**Campos QA estándar:**
- `id` - ID único de la tarea
- `categoria` - Categoría de la tarea
- `titulo` - Título/Descripción breve
- `tipo` - Tipo de tarea (Funcionalidad/QA/Bug)
- `estado_deseado` - Estado deseado/Criterios de aceptación
- `comentarios` - Campo para contenido sin mapeo

**Categorías Fijas:**
1. **Funcionalidades Nuevas** - Nuevas características a implementar
2. **QA** - Funcionalidades implementadas con errores
3. **Bugs Generales** - Bugs en Aura o Portal Admin
4. **Otra** - Otros tipos (editable manualmente)

**Estados Predefinidos:**
- Pendiente
- En Progreso
- Completado
- Bloqueado
- Cancelado

### 3. Gestión de Imágenes/Screenshots
- **Upload:** Subir múltiples imágenes por tarea
- **Preview:** 
  - Galería de thumbnails en la tarea
  - Click para ampliar imagen en modal
  - Opción de descargar imagen
- **Almacenamiento:** Firebase Storage (`visionaries-platform-admin` project)
- **Validación:**
  - Tamaño máximo: 5MB por imagen
  - Formatos permitidos: jpg, jpeg, png, gif
  - Mostrar progreso de upload

### 4. Auto-generación de Criterios de Aceptación
- **Botón:** "Auto-generar criterios de aceptación"
- **Trigger:** Si el campo está vacío en la tarea importada
- **Prompt OpenAI:** Analizar título/descripción y generar criterios claros
- **Editable:** El usuario puede ajustar los criterios generados
- **Timeout:** 30 segundos máximo para evitar cuelgues
- **Error Handling:** Mostrar mensaje claro si falla

### 5. Editor de Tareas
- **CRUD Completo:** Crear, leer, actualizar, eliminar tareas
- **Campos Editables:**
  - ID
  - Categoría (dropdown con opciones fijas)
  - Título
  - Tipo
  - Estado deseado/Criterios
  - Comentarios
  - Imágenes (upload/delete)
- **UI Responsiva:** Formulario limpio con validación
- **Validación:** Todos los campos requeridos deben estar completos

## 🏗️ Arquitectura Técnica

### Base de Datos (Firestore)
```
projects/{projectId}/qa-tasks/{taskId}
{
  id: string,
  titulo: string,
  categoria: "Funcionalidades Nuevas" | "QA" | "Bugs Generales" | "Otra",
  tipo: string,
  criterios_aceptacion: string,
  comentarios: string,
  imagenes: Array<{
    url: string,
    name: string,
    uploadedAt: timestamp,
    size: number
  }>,
  estado: "Pendiente" | "En Progreso" | "Completado" | "Bloqueado" | "Cancelado",
  createdAt: timestamp,
  updatedAt: timestamp,
  createdBy: string,
  projectId: string
}
```

### Storage (Firebase Storage)
```
visionaries-platform-admin/
└── projects/
    └── {projectId}/
        └── qa-tasks/
            └── {taskId}/
                └── images/
                    ├── image1.jpg
                    ├── image2.png
                    └── ...
```

### APIs Next.js Requeridas

#### 1. `POST /api/config/openai`
- Guardar/obtener API key de OpenAI
- Almacenado en Firestore con encriptación
- Solo acceso de superadmin
- **Timeout:** No necesario (operación local)

#### 2. `GET/POST /api/projects/[projectId]/qa-tasks`
- Listar/crear tareas QA
- **Timeout:** No necesario (operación rápida)

#### 3. `GET/PUT/DELETE /api/projects/[projectId]/qa-tasks/[taskId]`
- CRUD individual de tareas
- **Timeout:** No necesario (operación rápida)

#### 4. `POST /api/projects/[projectId]/qa-tasks/analyze`
- Recibe archivo CSV/Excel
- Extrae headers y primeras filas
- OpenAI sugiere mapeo de columnas
- Retorna: `{headers: [], suggestedMappings: [], sampleRows: []}`
- **Timeout:** 30 segundos (llamada a OpenAI puede tardar)

#### 5. `POST /api/projects/[projectId]/qa-tasks/upload`
- Bulk upload de tareas parseadas
- Valida datos
- Crea tareas en Firestore
- **Timeout:** No necesario (operación rápida)

#### 6. `POST /api/projects/[projectId]/qa-tasks/[taskId]/images`
- Upload de imágenes a Storage
- Retorna URL pública
- **Timeout:** 60 segundos (upload puede tardar)

#### 7. `DELETE /api/projects/[projectId]/qa-tasks/[taskId]/images/[imageId]`
- Elimina imagen de Storage
- **Timeout:** No necesario (operación rápida)

#### 8. `POST /api/projects/[projectId]/qa-tasks/[taskId]/generate-criteria`
- Recibe título/descripción
- OpenAI genera criterios de aceptación
- Retorna: `{criteria: string}`
- **Timeout:** 30 segundos (llamada a OpenAI puede tardar)

### Componentes React

#### `QASystem.tsx`
- Componente principal de la sección QA
- Integra file uploader, task editor y listado
- **NO modificar:** `layout-wrapper.tsx` o cualquier código de autenticación

#### `QAFileUploader.tsx`
- Upload de CSV/Excel
- Preview de headers detectados
- Confirmación de mapeo
- Dispara análisis con OpenAI
- **Error Handling:** Mostrar errores claros, no bloquear UI

#### `QATaskEditor.tsx`
- Formulario completo de edición
- Campos: ID, Categoría, Título, Tipo, Criterios, Comentarios
- Botón auto-generar criterios
- Editor de imágenes (upload/delete)
- **Validación:** Client-side antes de enviar

#### `QAImageUploader.tsx`
- Subida de múltiples imágenes
- Drag & drop
- Progreso de upload
- **Validación:** Tamaño y formato antes de subir

#### `QAImagePreview.tsx`
- Galería de thumbnails
- Modal para ampliar
- Botón descargar
- **Performance:** Lazy loading de imágenes

### Librerías Nuevas
```json
{
  "xlsx": "^0.18.5",
  "papaparse": "^5.4.1",
  "@types/papaparse": "^5.3.14"
}
```

### Configuración

#### Settings (app/settings/page.tsx)
- Campo para guardar API key de OpenAI
- Validación y persistencia en Firestore
- Indicador de si está configurado
- **NO modificar:** Sección de autenticación o usuarios

## 🔄 Flujo de Uso

### 1. Setup Inicial
1. Ir a Settings
2. Ingresar API key de OpenAI
3. Guardar configuración

### 2. Importar Tareas
1. Ir a QA section del proyecto
2. Click "Subir archivo"
3. Seleccionar CSV/Excel
4. OpenAI analiza headers automáticamente
5. Revisar mappeo sugerido
6. Confirmar upload
7. Sistema crea tareas en Firestore

### 3. Gestionar Tareas
1. Ver listado de todas las tareas
2. Click en tarea para editar
3. Modificar campos según sea necesario
4. Subir/eliminar screenshots
5. Si falta criterios: click "Auto-generar"
6. Guardar cambios

## ⚠️ Consideraciones Importantes

### Seguridad
- API key de OpenAI encriptada en Firestore
- Solo accesible para superadmin
- Validación de acceso en todas las APIs
- Rate limiting recomendado para OpenAI

### Performance
- Lazy loading de imágenes
- Paginación en listado de tareas
- Caché de mapeos sugeridos
- **Timeout en llamadas a OpenAI:** 30s máximo
- **NO usar timeout en autenticación**

### Errores Comunes a Evitar

1. **❌ NO modificar `layout-wrapper.tsx`**
   - Este archivo maneja autenticación crítica
   - Cualquier cambio puede romper el acceso
   - Si es necesario, hacer en branch separada y probar exhaustivamente

2. **❌ NO agregar timeouts agresivos en fetch de autenticación**
   - El fetch de `/api/internal/validate-access` NO debe tener timeout
   - Si el API tarda, es problema del servidor, no del cliente
   - Timeouts solo para APIs externas (OpenAI)

3. **❌ NO hacer múltiples cambios simultáneos**
   - Implementar una feature a la vez
   - Probar cada feature antes de continuar
   - Hacer commits pequeños y frecuentes

4. **❌ NO modificar código de autenticación sin pruebas**
   - Probar localmente primero
   - Usar feature flags
   - Mantener código anterior como backup

5. **❌ NO usar `AbortController` en autenticación**
   - Causa `AbortError` y bloquea usuarios
   - Solo usar para operaciones no críticas
   - Si es necesario, usar timeout muy largo (60s+)

### Testing Checklist

Antes de mergear a main:
- [ ] Probar flujo completo de autenticación
- [ ] Verificar que usuarios pueden entrar normalmente
- [ ] Probar upload de CSV/Excel
- [ ] Probar análisis de OpenAI
- [ ] Probar upload de imágenes
- [ ] Probar auto-generación de criterios
- [ ] Probar edición de tareas
- [ ] Verificar que no hay errores en consola
- [ ] Verificar que no hay timeouts en autenticación
- [ ] Probar en desarrollo local primero

## 📊 Estructura de Archivos

```
visionaries-platform-admin/
├── app/
│   ├── api/
│   │   ├── config/
│   │   │   └── openai/
│   │   │       └── route.ts
│   │   └── projects/
│   │       └── [projectId]/
│   │           └── qa-tasks/
│   │               ├── route.ts
│   │               ├── analyze/
│   │               │   └── route.ts
│   │               ├── upload/
│   │               │   └── route.ts
│   │               └── [taskId]/
│   │                   ├── route.ts
│   │                   ├── images/
│   │                   │   └── route.ts
│   │                   └── generate-criteria/
│   │                       └── route.ts
│   └── projects/
│       └── [id]/
│           └── qa/
│               └── page.tsx
├── components/
│   └── projects/
│       ├── qa-system.tsx
│       ├── qa-file-uploader.tsx
│       ├── qa-task-editor.tsx
│       ├── qa-image-uploader.tsx
│       └── qa-image-preview.tsx
├── lib/
│   ├── repositories/
│   │   └── qa-tasks-repository.ts
│   └── services/
│       └── openai-service.ts
└── types/
    └── qa.ts
```

## 🚀 Plan de Implementación Paso a Paso

### Fase 1: Setup y Configuración (2 horas)
1. Crear branch `feature/qa-system`
2. Instalar dependencias (`xlsx`, `papaparse`)
3. Crear tipos TypeScript (`types/qa.ts`)
4. Crear repositorio Firestore (`lib/repositories/qa-tasks-repository.ts`)
5. Crear servicio OpenAI (`lib/services/openai-service.ts`)

### Fase 2: APIs Backend (6 horas)
1. API de configuración OpenAI (`/api/config/openai`)
2. API de análisis de archivos (`/api/projects/[projectId]/qa-tasks/analyze`)
3. API de upload de tareas (`/api/projects/[projectId]/qa-tasks/upload`)
4. API CRUD de tareas (`/api/projects/[projectId]/qa-tasks/[taskId]`)
5. API de imágenes (`/api/projects/[projectId]/qa-tasks/[taskId]/images`)
6. API de generación de criterios (`/api/projects/[projectId]/qa-tasks/[taskId]/generate-criteria`)

### Fase 3: Componentes Frontend (8 horas)
1. Componente principal `QASystem.tsx`
2. Componente de upload `QAFileUploader.tsx`
3. Componente de edición `QATaskEditor.tsx`
4. Componente de imágenes `QAImageUploader.tsx` y `QAImagePreview.tsx`
5. Integración en página QA (`app/projects/[id]/qa/page.tsx`)

### Fase 4: Testing y Refinamiento (3 horas)
1. Probar flujo completo
2. Verificar que no afecta autenticación
3. Ajustar UI/UX
4. Documentar uso
5. Mergear a main solo cuando esté 100% funcional

### Fase 5: Configuración en Settings (2 horas)
1. Agregar campo para API key de OpenAI en Settings
2. Validación y persistencia
3. Indicadores de estado

## 📝 Notas Técnicas

- **Todo el sistema de QA debe ser agnóstico de proyecto:** Funciona para cualquier proyecto
- **Las imágenes deben ser editables:** Poder agregar/eliminar después de la importación
- **Los criterios de aceptación son auto-generables:** Si vienen en el CSV es mejor, pero si no, OpenAI los crea
- **El mapeo de columnas es inteligente:** OpenAI identifica automáticamente qué columna es qué
- **NO modificar código de autenticación:** Mantener separado y probado

## 🔄 Reversión

Si algo sale mal, revertir es simple:
```bash
git checkout main
git branch -D feature/qa-system
```

O usar feature flag para desactivar:
```typescript
const ENABLE_QA_SYSTEM = false
```

## 📚 Referencias

- **Firebase Firestore:** https://firebase.google.com/docs/firestore
- **Firebase Storage:** https://firebase.google.com/docs/storage
- **OpenAI API:** https://platform.openai.com/docs
- **Papaparse (CSV):** https://www.papaparse.com/
- **SheetJS (Excel):** https://sheetjs.com/

---

**Creado:** 22 Nov 2025  
**Por:** Gabriel Apino + Asistente IA  
**Estado:** Listo para implementación con lecciones aprendidas  
**Última revisión:** 22 Nov 2025

