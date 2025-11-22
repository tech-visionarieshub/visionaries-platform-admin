# Configuración de Acceso de Usuarios - Visionaries Platform Admin

## 📋 Requisitos para Acceso a Admin Platform

Para que un usuario pueda acceder a **Visionaries Platform Admin**, debe tener los siguientes **Custom Claims** en Firebase Authentication (proyecto `visionaries-tech`):

### Custom Claims Requeridos

```json
{
  "internal": true,
  "role": "admin",
  "superadmin": true  // Opcional, solo para superadmins
}
```

### Explicación de Claims

1. **`internal: true`** (REQUERIDO)
   - Permite acceso a la plataforma interna
   - Sin esto, el usuario no puede entrar aunque tenga cuenta

2. **`role: "admin"`** (REQUERIDO)
   - Define el rol del usuario en el sistema
   - Valores posibles: `"admin"`, `"user"`, etc.

3. **`superadmin: true`** (OPCIONAL)
   - Solo para usuarios superadministradores
   - Permite acceso a todas las secciones sin restricciones
   - Si no está presente, el usuario tendrá permisos según su rol

## 🔧 Métodos de Asignación

### Método 1: Desde Settings (Recomendado) ⭐

1. Ir a **Settings** en la plataforma admin
2. Sección **"Gestión de Usuarios"**
3. Click en **"Agregar Usuario"**
4. Ingresar email del usuario
5. Seleccionar rol y si es superadmin
6. Click **"Asignar Acceso"**
7. El sistema ejecutará el script automáticamente

### Método 2: Firebase Console (Manual)

1. Ir a: https://console.firebase.google.com/project/visionaries-tech/authentication/users
2. Buscar el usuario por email
3. Click en los 3 puntos (⋮) → **"Editar"**
4. En **"Custom claims"**, agregar:
   ```json
   {
     "internal": true,
     "role": "admin",
     "superadmin": true
   }
   ```
5. Guardar

### Método 3: Script CLI (Desarrollo)

```bash
# Desde el proyecto
cd visionaries-platform-admin

# Usar la API desde Settings (recomendado)
# O ejecutar manualmente:
FIREBASE_SERVICE_ACCOUNT_VISIONARIES_TECH='{...}' node scripts/assign-access-simple.js email@example.com admin
```

## 📝 Flujo Técnico

### 1. Usuario Intenta Acceder

```
Usuario → Aura → Click "Portal Admin" → Redirige con token
```

### 2. Validación en Admin Platform

El archivo `components/layout/layout-wrapper.tsx` valida:

```typescript
// 1. Extrae token de URL
const tokenFromUrl = searchParams.get('token')

// 2. Llama a API de validación
POST /api/internal/validate-access
Headers: Authorization: Bearer {token}

// 3. API verifica con Firebase Admin SDK
verifyIdToken(token) → decoded.internal === true
```

### 3. API de Validación

**Archivo:** `app/api/internal/validate-access/route.ts`

```typescript
// Verifica token con Admin SDK
const decoded = await verifyIdToken(token)

// Valida acceso interno
if (!decoded.internal) {
  return { valid: false, error: 'No internal access' }
}

// Retorna información del usuario
return {
  valid: true,
  user: {
    uid: decoded.uid,
    email: decoded.email,
    role: decoded.role,
    internal: decoded.internal,
    superadmin: decoded.superadmin || false
  }
}
```

## 🔐 Configuración de Credenciales

### Variables de Entorno Requeridas

**En `.env.local` (desarrollo):**
```bash
FIREBASE_SERVICE_ACCOUNT_VISIONARIES_TECH='{"type":"service_account","project_id":"visionaries-tech",...}'
```

**En Vercel (producción):**
- Variable: `FIREBASE_SERVICE_ACCOUNT_VISIONARIES_TECH`
- Valor: JSON completo del service account
- Obtener desde: https://console.firebase.google.com/project/visionaries-tech/settings/serviceaccounts/adminsdk

### Obtener Service Account

1. Ir a: https://console.firebase.google.com/project/visionaries-tech/settings/serviceaccounts/adminsdk
2. Click **"Generate new private key"**
3. Descargar JSON
4. Copiar contenido completo
5. Agregar a `.env.local` o Vercel

## 🛠️ Scripts Disponibles

### `scripts/assign-access-simple.js`

**Uso:**
```bash
FIREBASE_SERVICE_ACCOUNT_VISIONARIES_TECH='{...}' node scripts/assign-access-simple.js email@example.com [role]
```

**Parámetros:**
- `email`: Email del usuario
- `role`: Rol a asignar (default: "admin")

**Ejemplo:**
```bash
FIREBASE_SERVICE_ACCOUNT_VISIONARIES_TECH='{"type":"service_account",...}' node scripts/assign-access-simple.js adminplatform@visionarieshub.com admin
```

## 🚨 Troubleshooting

### Error: "No internal access"

**Causa:** El usuario no tiene `internal: true` en custom claims

**Solución:**
1. Ir a Settings → Gestión de Usuarios
2. Buscar usuario
3. Click "Asignar Acceso"
4. Seleccionar rol y marcar "Acceso Interno"

### Error: "Token expired"

**Causa:** El token de Firebase expiró (1 hora)

**Solución:**
1. Usuario debe cerrar sesión en Aura
2. Volver a iniciar sesión
3. Intentar acceder de nuevo

### Error: "FIREBASE_SERVICE_ACCOUNT_VISIONARIES_TECH no está configurado"

**Causa:** Falta la variable de entorno

**Solución:**
1. Verificar `.env.local` en desarrollo
2. Verificar variables en Vercel en producción
3. Agregar service account JSON completo

### Usuario no aparece después de asignar claims

**Causa:** El token no se ha refrescado

**Solución:**
1. Usuario debe cerrar sesión completamente
2. Volver a iniciar sesión
3. Los custom claims se actualizan en el nuevo token

## 📊 Estructura de Datos

### Custom Claims en Firebase Auth

```typescript
interface CustomClaims {
  internal: boolean;      // REQUERIDO: true para acceso
  role: string;          // REQUERIDO: "admin" | "user"
  superadmin?: boolean;  // OPCIONAL: true para superadmin
  allowedRoutes?: string[]; // OPCIONAL: rutas permitidas
}
```

### Usuario en Admin Platform

```typescript
interface User {
  id: string;           // UID de Firebase
  email: string;        // Email del usuario
  name: string;         // Display name
  role: UserRole;       // "admin" | "user"
  superadmin: boolean;  // true si es superadmin
  avatar?: string;      // URL de foto de perfil
}
```

## 🔄 Proceso Completo de Agregar Usuario

### Paso a Paso

1. **Usuario existe en Firebase Auth** (proyecto `visionaries-tech`)
   - Si no existe, debe registrarse primero en Aura

2. **Asignar Custom Claims**
   - Desde Settings → Gestión de Usuarios → Agregar Usuario
   - O manualmente desde Firebase Console

3. **Usuario cierra sesión y vuelve a entrar**
   - Necesario para refrescar token con nuevos claims

4. **Usuario accede desde Aura**
   - Click en "Portal Admin" en sidebar
   - Redirige a admin.visionarieshub.com con token

5. **Admin Platform valida**
   - Verifica token
   - Valida `internal: true`
   - Permite acceso si es válido

## ⚠️ Consideraciones Importantes

1. **Custom claims solo se actualizan en nuevo token**
   - Después de asignar claims, el usuario DEBE cerrar sesión
   - O esperar 1 hora a que expire el token actual

2. **Solo superadmins pueden agregar usuarios**
   - La funcionalidad en Settings solo está disponible para superadmins
   - Validación en API: `decoded.superadmin === true`

3. **Service account debe tener permisos**
   - El service account debe tener rol "Firebase Admin SDK Administrator Service Agent"
   - Verificar en: https://console.cloud.google.com/iam-admin/iam?project=visionaries-tech

4. **No modificar claims manualmente en código**
   - Siempre usar la API desde Settings
   - O scripts documentados
   - Evitar cambios directos en Firebase Console sin documentar

## 📚 Referencias

- **Firebase Auth Custom Claims:** https://firebase.google.com/docs/auth/admin/custom-claims
- **Admin SDK:** https://firebase.google.com/docs/admin/setup
- **Service Accounts:** https://console.firebase.google.com/project/visionaries-tech/settings/serviceaccounts/adminsdk

---

**Última actualización:** 22 Nov 2025  
**Mantenido por:** Tech Visionaries Team

