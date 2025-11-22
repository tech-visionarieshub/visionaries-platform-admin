# Plan de Implementación: Sistema de QA Tasks

**Estado:** Guardado para implementación futura  
**Última actualización:** 22 Nov 2025  
**Prioridad:** Media (después de estabilizar plataforma)

## Objetivo
Implementar un sistema completo de gestión de tareas QA que permita:
- Subir tareas QA vía CSV/Excel con análisis inteligente de columnas (OpenAI)
- Gestionar screenshots y previsualizaciones de imágenes
- Auto-generar criterios de aceptación usando OpenAI
- Editar todas las tareas y campos en la plataforma

## Requisitos Funcionales

### 1. Importación de Archivos CSV/Excel
- **Funcionalidad:** Permitir carga de archivos CSV o Excel
- **Análisis Inteligente:** 
  - OpenAI analiza automáticamente headers del archivo
  - Mapea columnas a campos QA estándar
  - Si no hay mapping, crea campo "comentarios" con el contenido
- **Soporte:**
  - Formatos: .csv, .xlsx
  - Librerías: `papaparse` (CSV) y `xlsx` (Excel)

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

### 4. Auto-generación de Criterios de Aceptación
- **Botón:** "Auto-generar criterios de aceptación"
- **Trigger:** Si el campo está vacío en la tarea importada
- **Prompt OpenAI:** Analizar título/descripción y generar criterios claros
- **Editable:** El usuario puede ajustar los criterios generados

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

## Arquitectura Técnica

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
  imagenes: Array<{url, name, uploadedAt}>,
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

#### 2. `GET/POST /api/projects/[projectId]/qa-tasks`
- Listar/crear tareas QA

#### 3. `GET/PUT/DELETE /api/projects/[projectId]/qa-tasks/[taskId]`
- CRUD individual de tareas

#### 4. `POST /api/projects/[projectId]/qa-tasks/analyze`
- Recibe archivo CSV/Excel
- Extrae headers y primeras filas
- OpenAI sugiere mapeo de columnas
- Retorna: `{headers: [], suggestedMappings: [], sampleRows: []}`

#### 5. `POST /api/projects/[projectId]/qa-tasks/upload`
- Bulk upload de tareas parseadas
- Valida datos
- Crea tareas en Firestore

#### 6. `POST /api/projects/[projectId]/qa-tasks/[taskId]/images`
- Upload de imágenes a Storage
- Retorna URL pública

#### 7. `DELETE /api/projects/[projectId]/qa-tasks/[taskId]/images/[imageId]`
- Elimina imagen de Storage

#### 8. `POST /api/projects/[projectId]/qa-tasks/[taskId]/generate-criteria`
- Recibe título/descripción
- OpenAI genera criterios de aceptación
- Retorna: `{criteria: string}`

### Componentes React

#### `QASystem.tsx`
- Componente principal de la sección QA
- Integra file uploader, task editor y listado

#### `QAFileUploader.tsx`
- Upload de CSV/Excel
- Preview de headers detectados
- Confirmación de mapeo
- Dispara análisis con OpenAI

#### `QATaskEditor.tsx`
- Formulario completo de edición
- Campos: ID, Categoría, Título, Tipo, Criterios, Comentarios
- Botón auto-generar criterios
- Editor de imágenes (upload/delete)

#### `QAImageUploader.tsx`
- Subida de múltiples imágenes
- Drag & drop
- Progreso de upload

#### `QAImagePreview.tsx`
- Galería de thumbnails
- Modal para ampliar
- Botón descargar

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

## Flujo de Uso

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

## Consideraciones Importantes

### Seguridad
- API key de OpenAI encriptada en Firestore
- Solo accesible para superadmin
- Validación de acceso en todas las APIs
- Rate limiting recomendado para OpenAI

### Performance
- Lazy loading de imágenes
- Paginación en listado de tareas
- Caché de mapeos sugeridos
- Timeout en llamadas a OpenAI (30s)

### Errores Comunes a Evitar
- **Timeout excesivos:** Usar setTimeout adecuado, no AbortController fuerte
- **Timeouts en fetch:** Si se necesita, máximo 30s para OpenAI, 15s para APIs normales
- **Validación de token:** Verificar que el API esté disponible antes de usarlo
- **Cambios en auth:** Cualquier modificación en layout-wrapper debe estar bien testeada

## Próximas Fases (Futura)

### Fase 2: Reportes y Analytics
- Dashboard de métricas QA
- Gráficos de estado de tareas
- Reportes por categoría

### Fase 3: Colaboración
- Asignación de tareas a usuarios
- Comentarios y discusiones
- Notificaciones

### Fase 4: Integraciones
- Sincronizar con GitHub issues
- Conectar con Jira
- Exportar a reportes

## Notas Técnicas

- **Todo el sistema de QA debe ser agnóstico de proyecto:** Funciona para cualquier proyecto
- **Las imágenes deben ser editables:** Poder agregar/eliminar después de la importación
- **Los criterios de aceptación son auto-generables:** Si vienen en el CSV es mejor, pero si no, OpenAI los crea
- **El mapeo de columnas es inteligente:** OpenAI identifica automáticamente qué columna es qué

## Estimación de Esfuerzo
- Diseño y arquitecura: 2 horas
- APIs backend: 6 horas
- Componentes frontend: 8 horas
- Integración OpenAI: 2 horas
- Testing y refinamiento: 3 horas
- **Total estimado: 21 horas**

---

**Creado:** 22 Nov 2025
**Por:** Gabriel Apino + Asistente IA
**Estado:** Guardado y listo para implementación futura

