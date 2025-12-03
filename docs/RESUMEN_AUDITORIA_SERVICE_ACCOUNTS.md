# Resumen de Auditoría de Service Accounts

## Estado: ✅ COMPLETADO

## Problema Identificado

La plataforma admin estaba usando service accounts incorrectos en algunos scripts, lo que podía causar:
- Acceso a bases de datos incorrectas
- Fallos en operaciones de Firestore
- Confusión sobre qué proyecto Firebase se está usando

## Correcciones Realizadas

### Scripts Corregidos

1. **`scripts/crear-proyectos-clientes.py`** ✅
   - **Antes**: Usaba service account de `visionaries-tech`
   - **Después**: Usa service account de `visionaries-platform-admin` (con fallback)
   - **Razón**: Crea proyectos y clientes que pertenecen a platform-admin

2. **`scripts/revisar-usuario-cli.js`** ✅
   - **Antes**: Inicializaba platform-admin sin credenciales explícitas
   - **Después**: Intenta cargar service account de platform-admin explícitamente
   - **Razón**: Accede a colección `users` de platform-admin

3. **`scripts/vincular-sgac-invomex.py`** ✅
   - **Ya estaba corregido**: Usa service account de platform-admin
   - **Razón**: Accede a colecciones `egresos` y `clientes` de platform-admin

## Archivos Verificados y Correctos

### Repositorios ✅
Todos los repositorios usan `getInternalFirestore()` de `lib/firebase/admin-platform.ts`:
- `base-repository.ts` → Todos los repositorios extienden de este
- `egresos-repository.ts`
- `clientes-repository.ts`
- `projects-repository.ts`
- `features-repository.ts`
- `team-tasks-repository.ts`
- `qa-tasks-repository.ts`
- `project-documents-repository.ts`
- `status-reports-repository.ts`
- `config-repository.ts`
- `precios-por-hora-repository.ts`

### API Routes ✅
Todas las API routes que acceden a datos de platform-admin usan repositorios o `getInternalFirestore()`:
- Todas las rutas en `app/api/egresos/` → Usan `egresosRepository` ✅
- Todas las rutas en `app/api/projects/` → Usan `projectsRepository` ✅
- Todas las rutas en `app/api/clientes/` → Usan `clientesRepository` ✅
- Todas las rutas en `app/api/cotizaciones/` → Usan `cotizacionesRepository` ✅

### Uso Correcto de getAuraAuth() ✅
`getAuraAuth()` solo se usa para:
- Validar tokens de Auth (`verifyIdToken`) ✅
- Obtener información de usuarios (`getUserByEmail`) ✅
- Asignar custom claims ✅
- **NUNCA** para acceder a Firestore de datos de platform-admin ✅

### Scripts que Acceden a Aura (Correctos) ✅
Estos scripts acceden a la colección `platforms` que está en visionaries-tech (aura), por lo que es CORRECTO que usen el service account de visionaries-tech:
- `scripts/listar-plataformas.py` ✅
- `scripts/configurar-alias-elena.py` ✅
- `scripts/asignar-acceso-limitado-admin.py` ✅
- `scripts/crear-usuario-ja-edc.py` ✅
- `scripts/verificar-usuarios-alias.py` ✅
- `scripts/crear-usuarios-pz-faltantes.py` ✅
- `scripts/asignar-automatizaciones-alias.py` ✅
- `scripts/fix-portal-admin-access.py` ✅
- `scripts/asignar-usuarios-faltantes.py` ✅
- `scripts/verificar-accesos-usuarios.py` ✅
- `scripts/buscar-arely-empresas.ts` ✅
- `app/api/admin/buscar-usuario-empresas/route.ts` ✅

## Reglas de Uso Establecidas

### ✅ Usar visionaries-tech (aura) para:
- Validar tokens de Auth
- Obtener información de usuarios de Auth
- Asignar custom claims
- Acceder a colección `platforms` y `users` dentro de platforms (datos de Aura)

### ✅ Usar visionaries-platform-admin para:
- Todas las operaciones de Firestore: `projects`, `clientes`, `egresos`, `cotizaciones`, `facturas`, `complementos`, `nomina`, `config`, `users` (colección directa), etc.
- Todas las operaciones de Storage
- Cualquier dato que pertenezca a la plataforma admin

## Variables de Entorno Requeridas

1. **FIREBASE_SERVICE_ACCOUNT_PLATFORM_ADMIN**: Service account de visionaries-platform-admin
   - Usado por: `lib/firebase/admin-platform.ts`
   - Para: Todas las operaciones de Firestore/Storage de platform-admin

2. **FIREBASE_SERVICE_ACCOUNT_VISIONARIES_TECH**: Service account de visionaries-tech
   - Usado por: `lib/firebase/admin-tech.ts`
   - Para: Validación de tokens de Auth y acceso a colección `platforms` de aura

3. **NEXT_PUBLIC_FIREBASE_* (visionaries-tech)**: Config del frontend
   - Usado por: `lib/firebase/visionaries-tech.ts`
   - Para: Login y autenticación en el frontend

## Conclusión

✅ **Todos los archivos críticos han sido corregidos y verificados**

La plataforma admin ahora usa correctamente:
- `visionaries-platform-admin` para todos los datos de la plataforma
- `visionaries-tech` solo para autenticación y datos de Aura (platforms)

Esto debería resolver las fallas relacionadas con acceso a bases de datos incorrectas.

