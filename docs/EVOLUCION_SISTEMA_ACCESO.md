# Evolución del Sistema de Acceso - Admin Platform

## 📊 Comparación: Solución Anterior vs Solución Actual

### 🔹 Solución Anterior (Cuando Funcionó)

**API única:** `/api/users/assign-access`

**Funcionalidad:**
- ✅ Asigna custom claims en Firebase Authentication (proyecto `visionaries-tech`)
- ✅ Claims asignados: `internal: true`, `role`, `superadmin`
- ✅ Usa Firebase Admin SDK para `setCustomUserClaims()`

**Integración en Settings:**
- Botón "Agregar Usuario" en Settings → Gestión de Usuarios
- Llama a `/api/users/assign-access` automáticamente
- Solo superadmins pueden ejecutarlo

**Flujo:**
```
Settings → Agregar Usuario 
  → API asigna custom claims 
  → Usuario cierra sesión 
  → Vuelve a entrar 
  → Acceso funcionando ✅
```

**Limitación:**
- ❌ Solo funcionaba para acceso al admin-platform
- ❌ Aura NO mostraba el botón "Portal Admin" porque faltaba `hasPortalAdminAccess` en Firestore

---

### 🔹 Solución Actual (Completa)

**Dos APIs complementarias:**

#### 1. `/api/users/assign-access` (Custom Claims)
- ✅ Asigna custom claims en Firebase Auth
- ✅ Claims: `internal: true`, `role`, `superadmin`
- ✅ **Necesario para:** Acceso al admin-platform

#### 2. `/api/users/set-portal-access` (Firestore)
- ✅ Establece `hasPortalAdminAccess` en Firestore
- ✅ Proyecto: `visionaries-platform-admin`
- ✅ Colección: `users`
- ✅ **Necesario para:** Aura muestre el botón "Portal Admin"

**Integración en Settings:**
- Botón "Agregar Usuario" en Settings → Gestión de Usuarios
- **Llama a ambas APIs automáticamente en secuencia:**

```typescript
// 1. Primero asigna custom claims
await fetch('/api/users/assign-access', {
  method: 'POST',
  body: JSON.stringify({
    email: newUserEmail,
    role: 'admin',
    superadmin: false
  })
})

// 2. Luego establece hasPortalAdminAccess
await fetch('/api/users/set-portal-access', {
  method: 'POST',
  body: JSON.stringify({
    email: newUserEmail,
    hasAccess: true
  })
})
```

**Flujo Completo:**
```
Settings → Agregar Usuario 
  → API 1: Asigna custom claims (Firebase Auth)
  → API 2: Establece hasPortalAdminAccess (Firestore)
  → Usuario cierra sesión 
  → Vuelve a entrar en Aura
  → ✅ Botón "Portal Admin" aparece en Aura
  → ✅ Click en "Portal Admin" → Acceso al admin-platform
```

---

## 🔑 Diferencias Clave

| Aspecto | Solución Anterior | Solución Actual |
|---------|-------------------|-----------------|
| **APIs** | 1 API (`assign-access`) | 2 APIs (`assign-access` + `set-portal-access`) |
| **Custom Claims** | ✅ Sí (Firebase Auth) | ✅ Sí (Firebase Auth) |
| **hasPortalAdminAccess** | ❌ No | ✅ Sí (Firestore) |
| **Botón en Aura** | ❌ No aparece | ✅ Aparece correctamente |
| **Acceso Admin** | ✅ Funciona | ✅ Funciona |
| **Pasos Manuales** | ❌ Requería script adicional | ✅ Automático desde Settings |

---

## 📋 Requisitos Completos para Acceso

Para que un usuario tenga acceso completo al sistema, necesita:

### 1. Custom Claims en Firebase Auth (proyecto `visionaries-tech`)
```json
{
  "internal": true,
  "role": "admin",
  "superadmin": false  // opcional
}
```
**API:** `/api/users/assign-access`  
**Propósito:** Permite acceso al admin-platform

### 2. hasPortalAdminAccess en Firestore (proyecto `visionaries-platform-admin`)
```json
{
  "email": "usuario@example.com",
  "hasPortalAdminAccess": true,
  "isActive": true
}
```
**API:** `/api/users/set-portal-access`  
**Propósito:** Aura lee este campo para mostrar el botón "Portal Admin"

---

## 🎯 Por Qué Se Necesitan Ambos

### Custom Claims (Firebase Auth)
- ✅ Validados por el admin-platform al intentar acceder
- ✅ Incluidos en el JWT token
- ✅ Verificados por `/api/internal/validate-access`
- ❌ **NO son leídos por Aura** para mostrar el botón

### hasPortalAdminAccess (Firestore)
- ✅ Leído por Aura desde Firestore
- ✅ Usado para mostrar/ocultar botón "Portal Admin"
- ✅ Independiente de custom claims
- ❌ **NO valida acceso** al admin-platform (solo muestra el botón)

**Conclusión:** Se necesitan ambos porque:
- **Custom Claims** = Validación de acceso (admin-platform)
- **hasPortalAdminAccess** = UI en Aura (mostrar botón)

---

## 🚀 Mejora Implementada

### Antes
```
Settings → Agregar Usuario
  → Solo custom claims
  → ❌ Usuario no ve botón en Aura
  → ❌ Requiere script manual adicional
```

### Ahora
```
Settings → Agregar Usuario
  → Custom claims (automático)
  → hasPortalAdminAccess (automático)
  → ✅ Usuario ve botón en Aura
  → ✅ Todo automático, sin pasos manuales
```

---

## 📝 Código de Integración

**Archivo:** `app/settings/page.tsx`

```typescript
const handleAddInternalUser = async () => {
  // ... validaciones ...
  
  // 1. Asignar custom claims
  const response = await fetch('/api/users/assign-access', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: newUserEmail.trim(),
      role: newUserRole,
      superadmin: newUserSuperadmin,
    }),
  })

  const data = await response.json()

  if (data.success) {
    // 2. Establecer hasPortalAdminAccess en Firestore
    try {
      const portalAccessResponse = await fetch('/api/users/set-portal-access', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: newUserEmail.trim(),
          hasAccess: true,
        }),
      })

      const portalAccessData = await portalAccessResponse.json()
      
      if (!portalAccessData.success) {
        console.warn('[Settings] No se pudo establecer hasPortalAdminAccess:', portalAccessData.error)
        // No fallar, solo mostrar advertencia
      }
    } catch (error) {
      console.warn('[Settings] Error al establecer hasPortalAdminAccess:', error)
      // No fallar, solo loguear
    }

    // Mostrar éxito
    toast({
      title: "✅ Acceso asignado",
      description: data.message + (data.note ? ` ${data.note}` : ''),
    })
  }
}
```

---

## ⚠️ Notas Importantes

1. **Orden de ejecución:** Primero custom claims, luego hasPortalAdminAccess
2. **Manejo de errores:** Si `set-portal-access` falla, no se bloquea el proceso (solo warning)
3. **Usuario debe refrescar:** Después de asignar, el usuario debe cerrar sesión y volver a entrar
4. **Solo superadmins:** Ambas APIs requieren que el usuario que las llama sea superadmin

---

## 🔄 Flujo Completo del Usuario

```
1. Superadmin va a Settings → Gestión de Usuarios
2. Click "Agregar Usuario"
3. Ingresa email, rol, superadmin (opcional)
4. Click "Asignar Acceso"
5. Sistema ejecuta:
   a. /api/users/assign-access → Custom claims en Firebase Auth
   b. /api/users/set-portal-access → hasPortalAdminAccess en Firestore
6. Usuario cierra sesión en Aura
7. Usuario vuelve a entrar en Aura
8. ✅ Botón "Portal Admin" aparece en sidebar
9. Usuario click en "Portal Admin"
10. ✅ Redirige a admin.visionarieshub.com con token
11. ✅ Admin-platform valida custom claims
12. ✅ Usuario tiene acceso completo
```

---

**Fecha de actualización:** 22 de Noviembre de 2025  
**Versión:** 2.0 (Solución completa con ambas APIs)

