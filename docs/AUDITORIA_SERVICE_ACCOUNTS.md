# Auditoría de Service Accounts - visionaries-platform-admin

## Problema Identificado

La plataforma admin debe usar el service account de `visionaries-platform-admin` para todas las operaciones de Firestore/Storage, excepto para validación de tokens de Auth que debe usar `visionaries-tech` (aura).

## Reglas de Uso

### ✅ CORRECTO: Usar visionaries-tech (aura) para:
- Validar tokens de Auth (`verifyIdToken`)
- Obtener información de usuarios de Auth (`getUserByEmail`, `getUser`)
- Asignar custom claims (`setCustomUserClaims`)
- Acceder a colección `platforms` y `users` dentro de platforms (datos de Aura)

### ✅ CORRECTO: Usar visionaries-platform-admin para:
- Todas las operaciones de Firestore: `projects`, `clientes`, `egresos`, `cotizaciones`, `facturas`, `complementos`, `nomina`, `config`, `users` (colección directa), etc.
- Todas las operaciones de Storage
- Cualquier dato que pertenezca a la plataforma admin

## Archivos a Revisar

### 1. Scripts Python que acceden a datos de platform-admin

**Problema**: Están usando service account de visionaries-tech cuando deberían usar visionaries-platform-admin.

**Archivos afectados**:
- `scripts/crear-proyectos-clientes.py` - Crea proyectos y clientes → debe usar platform-admin
- `scripts/vincular-sgac-invomex.py` - Ya corregido, usa platform-admin ✅

**Archivos CORRECTOS** (acceden a platforms de aura):
- `scripts/listar-plataformas.py` - Lista platforms de aura → correcto usar visionaries-tech ✅
- `scripts/configurar-alias-elena.py` - Accede a platforms/users de aura → correcto ✅
- `scripts/asignar-acceso-limitado-admin.py` - Accede a platforms/users de aura → correcto ✅
- `scripts/crear-usuario-ja-edc.py` - Accede a platforms/users de aura → correcto ✅
- `scripts/verificar-usuarios-alias.py` - Accede a platforms/users de aura → correcto ✅
- `scripts/crear-usuarios-pz-faltantes.py` - Accede a platforms/users de aura → correcto ✅
- `scripts/asignar-automatizaciones-alias.py` - Accede a platforms/users de aura → correcto ✅
- `scripts/fix-portal-admin-access.py` - Accede a platforms/users de aura → correcto ✅
- `scripts/asignar-usuarios-faltantes.py` - Accede a platforms/users de aura → correcto ✅
- `scripts/verificar-accesos-usuarios.py` - Accede a platforms/users de aura → correcto ✅

### 2. Scripts TypeScript/JavaScript

**Archivos a revisar**:
- `scripts/buscar-arely-empresas.ts` - Accede a `platforms` de aura → CORRECTO usar aura ✅
- `scripts/revisar-usuario-cli.js` - Accede a `users` de platform-admin → DEBE usar platform-admin ⚠️
- `scripts/delete-mock-projects.ts` - Ya usa platform-admin ✅

### 3. API Routes

**Archivos CORRECTOS**:
- `app/api/admin/revisar-usuario/route.ts` - Usa `getAuraAuth()` para Auth y `getInternalFirestore()` para Firestore → CORRECTO ✅
- `app/api/admin/buscar-usuario-empresas/route.ts` - Accede a `platforms` de aura → CORRECTO usar aura ✅
- `app/api/projects/route.ts` - Usa `getAuraAuth()` solo para obtener nombre de usuario → CORRECTO ✅
- `app/api/projects/[id]/route.ts` - Usa `getAuraAuth()` solo para obtener nombre de usuario → CORRECTO ✅
- `app/api/cotizaciones/[id]/generate-project/route.ts` - Usa `getAuraAuth()` solo para obtener nombre → CORRECTO ✅
- `app/api/projects/generate-from-document/route.ts` - Usa `getAuraAuth()` solo para obtener nombre → CORRECTO ✅

**Todas las demás API routes** que usan repositorios ya están correctas porque los repositorios usan `getInternalFirestore()`.

## Correcciones Aplicadas

### 1. `scripts/crear-proyectos-clientes.py` ✅
**Problema**: Usaba service account de visionaries-tech pero crea proyectos y clientes en platform-admin.

**Solución aplicada**: 
- Cambiado para buscar primero service account de visionaries-platform-admin
- Fallback a visionaries-tech si no se encuentra (con advertencia)
- Especifica explícitamente `projectId: 'visionaries-platform-admin'`

### 2. `scripts/revisar-usuario-cli.js` ✅
**Problema**: Inicializaba app de platform-admin sin service account explícito.

**Solución aplicada**:
- Intenta cargar service account de platform-admin desde ruta conocida
- Fallback a Application Default Credentials si no se encuentra
- Especifica explícitamente `projectId: 'visionaries-platform-admin'`

## Verificación de Configuración

### Variables de Entorno Necesarias

1. **FIREBASE_SERVICE_ACCOUNT_PLATFORM_ADMIN**: JSON del service account de visionaries-platform-admin
   - Usado por: `lib/firebase/admin-platform.ts`
   - Para: Todas las operaciones de Firestore/Storage de platform-admin

2. **FIREBASE_SERVICE_ACCOUNT_VISIONARIES_TECH**: JSON del service account de visionaries-tech
   - Usado por: `lib/firebase/admin-tech.ts`
   - Para: Validación de tokens de Auth y acceso a colección `platforms` de aura

3. **NEXT_PUBLIC_FIREBASE_* (visionaries-tech)**: Config del frontend
   - Usado por: `lib/firebase/visionaries-tech.ts`
   - Para: Login y autenticación en el frontend

## Checklist de Verificación

- [x] Todos los repositorios usan `getInternalFirestore()` ✅
- [x] Todas las API routes que acceden a datos de platform-admin usan repositorios o `getInternalFirestore()` ✅
- [x] Scripts que crean/modifican proyectos, clientes, egresos usan platform-admin ✅ (corregido)
- [x] Scripts que acceden a `platforms` de aura usan visionaries-tech ✅
- [x] `getAuraAuth()` solo se usa para validar tokens y obtener info de Auth ✅
- [x] No hay acceso directo a Firestore de aura para datos de platform-admin ✅

## Correcciones Aplicadas

### 1. `scripts/crear-proyectos-clientes.py` ✅
- **Antes**: Usaba service account de visionaries-tech
- **Después**: Usa service account de visionaries-platform-admin (con fallback)
- **Razón**: Crea proyectos y clientes que pertenecen a platform-admin

### 2. `scripts/revisar-usuario-cli.js` ✅
- **Antes**: Inicializaba platform-admin sin credenciales explícitas
- **Después**: Intenta cargar service account de platform-admin explícitamente
- **Razón**: Accede a colección `users` de platform-admin

### 3. `scripts/vincular-sgac-invomex.py` ✅
- **Ya corregido**: Usa service account de platform-admin
- **Razón**: Accede a colecciones `egresos` y `clientes` de platform-admin

## Resumen Final

**Estado**: ✅ Todos los archivos críticos corregidos

**Archivos que usan service accounts correctamente**:
- Todos los repositorios → `getInternalFirestore()` de platform-admin ✅
- Todas las API routes → Usan repositorios o `getInternalFirestore()` ✅
- Scripts que acceden a `platforms` → Usan visionaries-tech (correcto) ✅
- Scripts que crean/modifican datos de platform-admin → Usan platform-admin ✅

**Uso correcto de getAuraAuth()**:
- Solo para validar tokens de Auth ✅
- Solo para obtener información de usuarios de Auth ✅
- Nunca para acceder a Firestore de datos de platform-admin ✅

