# Plan Paso a Paso: Sistema de QA Tasks

**Estado:** Listo para implementación segura  
**Última actualización:** 22 Nov 2025  
**Prioridad:** Media (después de estabilizar plataforma)  
**Estimación:** ~21 horas  
**Enfoque:** Implementación incremental y segura

## 🎯 Objetivo

Implementar un sistema completo de gestión de tareas QA **SIN afectar el sistema de autenticación existente**, permitiendo:
- Subir tareas QA vía CSV/Excel con análisis inteligente de columnas (OpenAI)
- Gestionar screenshots y previsualizaciones de imágenes
- Auto-generar criterios de aceptación usando OpenAI
- Editar todas las tareas y campos en la plataforma

## ⚠️ Reglas de Oro (NO Violar)

1. **❌ NO modificar `components/layout/layout-wrapper.tsx`**
   - Este archivo maneja autenticación crítica
   - Cualquier cambio puede romper el acceso de usuarios
   - Si es absolutamente necesario, hacer en branch separada y probar exhaustivamente

2. **❌ NO agregar timeouts en fetch de autenticación**
   - El fetch de `/api/internal/validate-access` NO debe tener timeout
   - Timeouts solo para APIs externas (OpenAI) con valores conservadores (30s+)

3. **❌ NO hacer múltiples cambios simultáneos**
   - Implementar una feature a la vez
   - Probar cada feature antes de continuar
   - Hacer commits pequeños y frecuentes

4. **✅ SIEMPRE trabajar en branch separada**
   - `git checkout -b feature/qa-system`
   - Mergear solo cuando esté 100% funcional y probado

5. **✅ SIEMPRE probar localmente primero**
   - `npm run dev`
   - Probar flujo completo antes de commit
   - Verificar que autenticación sigue funcionando

## 📋 Fase 1: Setup y Preparación (2 horas)

### Paso 1.1: Crear Branch y Configurar Entorno
```bash
# Crear branch separada
git checkout -b feature/qa-system

# Verificar que todo funciona
npm run dev
# Probar login y acceso normal
```

### Paso 1.2: Instalar Dependencias
```bash
npm install xlsx papaparse @types/papaparse --legacy-peer-deps
```

**Verificar:**
- [ ] Dependencias instaladas correctamente
- [ ] No hay conflictos con otras dependencias
- [ ] `npm run dev` sigue funcionando

### Paso 1.3: Crear Estructura de Archivos
```bash
# Crear tipos
touch types/qa.ts

# Crear repositorio
mkdir -p lib/repositories
touch lib/repositories/qa-tasks-repository.ts

# Crear servicio OpenAI
mkdir -p lib/services
touch lib/services/openai-service.ts

# Crear componentes
mkdir -p components/projects
touch components/projects/qa-system.tsx
touch components/projects/qa-file-uploader.tsx
touch components/projects/qa-task-editor.tsx
touch components/projects/qa-image-uploader.tsx
touch components/projects/qa-image-preview.tsx
```

**Verificar:**
- [ ] Todos los archivos creados
- [ ] Estructura de carpetas correcta

### Paso 1.4: Definir Tipos TypeScript
**Archivo:** `types/qa.ts`

```typescript
export type QATaskCategory = 
  | "Funcionalidades Nuevas"
  | "QA"
  | "Bugs Generales"
  | "Otra"

export type QATaskStatus = 
  | "Pendiente"
  | "En Progreso"
  | "Completado"
  | "Bloqueado"
  | "Cancelado"

export interface QAImage {
  url: string
  name: string
  uploadedAt: Date
  size: number
}

export interface QATask {
  id: string
  titulo: string
  categoria: QATaskCategory
  tipo: string
  criterios_aceptacion: string
  comentarios: string
  imagenes: QAImage[]
  estado: QATaskStatus
  createdAt: Date
  updatedAt: Date
  createdBy: string
  projectId: string
}

export interface CSVColumnMapping {
  column: string
  field: string | null
}
```

**Verificar:**
- [ ] Tipos compilan sin errores
- [ ] No hay errores de lint

**Commit:**
```bash
git add types/qa.ts
git commit -m "feat: Agregar tipos TypeScript para sistema QA"
```

## 📋 Fase 2: Backend - Repositorio y Servicios (3 horas)

### Paso 2.1: Crear Repositorio Firestore
**Archivo:** `lib/repositories/qa-tasks-repository.ts`

```typescript
import { collection, doc, getDocs, getDoc, addDoc, updateDoc, deleteDoc, query, where, orderBy } from 'firebase/firestore'
import { getFirestore } from '@/lib/firebase/admin-platform'
import type { QATask } from '@/types/qa'

export class QATasksRepository {
  private getCollectionPath(projectId: string) {
    return `projects/${projectId}/qa-tasks`
  }

  async getAll(projectId: string): Promise<QATask[]> {
    // Implementar
  }

  async getById(projectId: string, taskId: string): Promise<QATask | null> {
    // Implementar
  }

  async create(projectId: string, task: Omit<QATask, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    // Implementar
  }

  async update(projectId: string, taskId: string, updates: Partial<QATask>): Promise<void> {
    // Implementar
  }

  async delete(projectId: string, taskId: string): Promise<void> {
    // Implementar
  }
}
```

**Verificar:**
- [ ] Código compila
- [ ] No hay errores de importación
- [ ] Firestore está configurado correctamente

**Commit:**
```bash
git add lib/repositories/qa-tasks-repository.ts
git commit -m "feat: Crear repositorio Firestore para QA tasks"
```

### Paso 2.2: Crear Servicio OpenAI
**Archivo:** `lib/services/openai-service.ts`

```typescript
import OpenAI from 'openai'

export class OpenAIService {
  private getApiKey(): string {
    // Obtener de Firestore config
  }

  async analyzeCSVHeaders(headers: string[], sampleRows: any[]): Promise<CSVColumnMapping[]> {
    // Implementar análisis con OpenAI
  }

  async generateAcceptanceCriteria(titulo: string, descripcion?: string): Promise<string> {
    // Implementar generación con OpenAI
  }
}
```

**Verificar:**
- [ ] Código compila
- [ ] Manejo de errores implementado
- [ ] Timeout de 30s para llamadas a OpenAI

**Commit:**
```bash
git add lib/services/openai-service.ts
git commit -m "feat: Crear servicio OpenAI para análisis y generación"
```

## 📋 Fase 3: Backend - APIs (4 horas)

### Paso 3.1: API de Configuración OpenAI
**Archivo:** `app/api/config/openai/route.ts`

```typescript
// GET: Obtener API key (solo superadmin)
// POST: Guardar API key (solo superadmin)
```

**Verificar:**
- [ ] Solo superadmins pueden acceder
- [ ] API key se guarda encriptada en Firestore
- [ ] Validación de formato de API key

**Commit:**
```bash
git add app/api/config/openai/route.ts
git commit -m "feat: API para configurar OpenAI API key"
```

### Paso 3.2: API de Análisis de Archivos
**Archivo:** `app/api/projects/[projectId]/qa-tasks/analyze/route.ts`

```typescript
// POST: Recibe CSV/Excel, analiza headers con OpenAI
// Retorna: {headers, suggestedMappings, sampleRows}
```

**Verificar:**
- [ ] Soporta CSV y Excel
- [ ] Extrae headers correctamente
- [ ] OpenAI sugiere mapeos
- [ ] Timeout de 30s implementado

**Commit:**
```bash
git add app/api/projects/[projectId]/qa-tasks/analyze/route.ts
git commit -m "feat: API para analizar headers de CSV/Excel con OpenAI"
```

### Paso 3.3: API CRUD de Tareas
**Archivos:**
- `app/api/projects/[projectId]/qa-tasks/route.ts` (GET, POST)
- `app/api/projects/[projectId]/qa-tasks/[taskId]/route.ts` (GET, PUT, DELETE)

**Verificar:**
- [ ] CRUD completo funciona
- [ ] Validación de datos
- [ ] Manejo de errores

**Commit:**
```bash
git add app/api/projects/[projectId]/qa-tasks/
git commit -m "feat: APIs CRUD para QA tasks"
```

### Paso 3.4: API de Imágenes
**Archivo:** `app/api/projects/[projectId]/qa-tasks/[taskId]/images/route.ts`

```typescript
// POST: Upload imagen a Firebase Storage
// DELETE: Eliminar imagen
```

**Verificar:**
- [ ] Upload funciona
- [ ] Validación de tamaño (5MB max)
- [ ] Validación de formato (jpg, png, gif)
- [ ] Delete funciona

**Commit:**
```bash
git add app/api/projects/[projectId]/qa-tasks/[taskId]/images/route.ts
git commit -m "feat: API para gestión de imágenes de QA tasks"
```

### Paso 3.5: API de Generación de Criterios
**Archivo:** `app/api/projects/[projectId]/qa-tasks/[taskId]/generate-criteria/route.ts`

```typescript
// POST: Genera criterios de aceptación con OpenAI
```

**Verificar:**
- [ ] Genera criterios correctamente
- [ ] Timeout de 30s implementado
- [ ] Manejo de errores

**Commit:**
```bash
git add app/api/projects/[projectId]/qa-tasks/[taskId]/generate-criteria/route.ts
git commit -m "feat: API para generar criterios de aceptación con OpenAI"
```

## 📋 Fase 4: Frontend - Componentes (6 horas)

### Paso 4.1: Componente Principal QASystem
**Archivo:** `components/projects/qa-system.tsx`

**Verificar:**
- [ ] Lista tareas correctamente
- [ ] Integra file uploader
- [ ] Integra task editor
- [ ] No afecta otras secciones

**Commit:**
```bash
git add components/projects/qa-system.tsx
git commit -m "feat: Componente principal QASystem"
```

### Paso 4.2: Componente de Upload de Archivos
**Archivo:** `components/projects/qa-file-uploader.tsx`

**Verificar:**
- [ ] Upload de CSV/Excel funciona
- [ ] Muestra preview de headers
- [ ] Permite confirmar mapeo
- [ ] Manejo de errores claro

**Commit:**
```bash
git add components/projects/qa-file-uploader.tsx
git commit -m "feat: Componente para upload y análisis de CSV/Excel"
```

### Paso 4.3: Componente de Edición de Tareas
**Archivo:** `components/projects/qa-task-editor.tsx`

**Verificar:**
- [ ] Formulario completo funciona
- [ ] Validación de campos
- [ ] Botón auto-generar criterios funciona
- [ ] Guardar y actualizar funciona

**Commit:**
```bash
git add components/projects/qa-task-editor.tsx
git commit -m "feat: Componente editor de tareas QA"
```

### Paso 4.4: Componentes de Imágenes
**Archivos:**
- `components/projects/qa-image-uploader.tsx`
- `components/projects/qa-image-preview.tsx`

**Verificar:**
- [ ] Upload múltiple funciona
- [ ] Preview con modal funciona
- [ ] Descarga funciona
- [ ] Delete funciona

**Commit:**
```bash
git add components/projects/qa-image-uploader.tsx components/projects/qa-image-preview.tsx
git commit -m "feat: Componentes para gestión de imágenes QA"
```

### Paso 4.5: Integrar en Página QA
**Archivo:** `app/projects/[id]/qa/page.tsx`

**Verificar:**
- [ ] Página carga correctamente
- [ ] Componente QASystem se muestra
- [ ] No afecta otras páginas

**Commit:**
```bash
git add app/projects/[id]/qa/page.tsx
git commit -m "feat: Integrar QASystem en página QA"
```

## 📋 Fase 5: Configuración en Settings (2 horas)

### Paso 5.1: Agregar Campo OpenAI en Settings
**Archivo:** `app/settings/page.tsx`

**Verificar:**
- [ ] Campo se muestra correctamente
- [ ] Guardar funciona
- [ ] Cargar funciona
- [ ] No afecta otras secciones de Settings

**Commit:**
```bash
git add app/settings/page.tsx
git commit -m "feat: Agregar configuración de OpenAI en Settings"
```

## 📋 Fase 6: Testing y Refinamiento (3 horas)

### Paso 6.1: Testing Local Completo
```bash
npm run dev
```

**Checklist de Testing:**
- [ ] Login funciona normalmente
- [ ] Acceso a admin funciona
- [ ] Configurar OpenAI API key funciona
- [ ] Upload CSV/Excel funciona
- [ ] Análisis de headers funciona
- [ ] Crear tarea funciona
- [ ] Editar tarea funciona
- [ ] Upload imágenes funciona
- [ ] Preview imágenes funciona
- [ ] Auto-generar criterios funciona
- [ ] No hay errores en consola
- [ ] No hay errores en Network tab

### Paso 6.2: Verificar que NO se Afectó Autenticación
- [ ] Probar login desde Aura
- [ ] Verificar que redirección funciona
- [ ] Verificar que validación de token funciona
- [ ] Verificar que no hay timeouts en autenticación

### Paso 6.3: Ajustes Finales
- [ ] Ajustar UI/UX según sea necesario
- [ ] Mejorar mensajes de error
- [ ] Optimizar performance
- [ ] Documentar uso

**Commit:**
```bash
git add .
git commit -m "test: Testing completo y ajustes finales"
```

## 📋 Fase 7: Merge a Main (1 hora)

### Paso 7.1: Revisión Final
```bash
# Verificar que todo está en la branch
git log --oneline feature/qa-system

# Verificar diferencias con main
git diff main..feature/qa-system --stat
```

### Paso 7.2: Merge Seguro
```bash
# Cambiar a main
git checkout main

# Mergear feature branch
git merge feature/qa-system --no-ff

# Verificar que compila
npm run build

# Push
git push origin main
```

### Paso 7.3: Verificar en Producción
- [ ] Deploy en Vercel exitoso
- [ ] Probar en producción
- [ ] Verificar que autenticación sigue funcionando
- [ ] Probar sistema QA completo

## 🚨 Plan de Reversión (Si Algo Sale Mal)

### Reversión Rápida
```bash
# Si algo sale mal, revertir merge
git revert -m 1 <merge-commit-hash>
git push origin main
```

### O Desactivar con Feature Flag
```typescript
const ENABLE_QA_SYSTEM = false // En .env.local
```

## 📝 Notas Importantes

1. **NO modificar `layout-wrapper.tsx`** - Este archivo es crítico
2. **NO agregar timeouts en autenticación** - Solo para APIs externas
3. **Siempre probar localmente primero** - Antes de cada commit
4. **Commits pequeños y frecuentes** - Fácil de revertir si algo falla
5. **Documentar cada cambio** - Comentarios explicativos en código

## ✅ Checklist Final Antes de Merge

- [ ] Todo el código está en branch `feature/qa-system`
- [ ] Todos los tests pasan localmente
- [ ] Autenticación funciona correctamente
- [ ] No hay errores en consola
- [ ] No hay errores en Network tab
- [ ] Documentación actualizada
- [ ] Código revisado
- [ ] Build exitoso (`npm run build`)

---

**Creado:** 22 Nov 2025  
**Por:** Gabriel Apino + Asistente IA  
**Estado:** Listo para implementación paso a paso segura

