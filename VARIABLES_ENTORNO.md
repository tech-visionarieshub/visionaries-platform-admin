# Variables de Entorno Necesarias

Este documento lista todas las variables de entorno necesarias para que la aplicación funcione correctamente en producción.

## Variables para Firebase Auth (visionaries-tech)

Estas variables se usan en el frontend para autenticación:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=tu_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=visionaries-tech.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=visionaries-tech
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=visionaries-tech.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=tu_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=tu_app_id
```

## Variables para Firebase Admin SDK

Estas variables se usan en el backend (API routes) para acceder a Firestore:

### 1. Service Account de visionaries-platform-admin

Necesario para acceder a Firestore donde están los datos (projects, cotizaciones, etc.):

```env
FIREBASE_SERVICE_ACCOUNT_PLATFORM_ADMIN='{"type":"service_account","project_id":"visionaries-platform-admin",...}'
```

**Cómo obtenerlo:**
1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Selecciona el proyecto `visionaries-platform-admin`
3. Ve a Configuración del proyecto > Cuentas de servicio
4. Haz clic en "Generar nueva clave privada"
5. Copia el contenido del JSON completo
6. Pégalo como string JSON en la variable de entorno

### 2. Service Account de visionaries-tech

Necesario para validar tokens de autenticación:

```env
FIREBASE_SERVICE_ACCOUNT_VISIONARIES_TECH='{"type":"service_account","project_id":"visionaries-tech",...}'
```

**Cómo obtenerlo:**
1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Selecciona el proyecto `visionaries-tech`
3. Ve a Configuración del proyecto > Cuentas de servicio
4. Haz clic en "Generar nueva clave privada"
5. Copia el contenido del JSON completo
6. Pégalo como string JSON en la variable de entorno

## Configuración en Vercel

Si estás usando Vercel para el despliegue:

1. Ve a tu proyecto en [Vercel Dashboard](https://vercel.com/dashboard)
2. Ve a Settings > Environment Variables
3. Agrega todas las variables listadas arriba
4. Asegúrate de configurarlas para:
   - Production
   - Preview (opcional)
   - Development (opcional)

## Verificación

Para verificar que las variables están configuradas correctamente:

```bash
# Verificar conexión a Firestore
cd visionaries-platform-admin
firebase use visionaries-platform-admin
npx tsx scripts/verify-firestore-connection.ts
```

## Notas Importantes

- **NUNCA** commits las variables de entorno al repositorio
- Las variables `NEXT_PUBLIC_*` son públicas y se exponen al cliente
- Las variables de service account son privadas y solo se usan en el servidor
- En producción, usa variables de entorno del hosting provider (Vercel, etc.)

