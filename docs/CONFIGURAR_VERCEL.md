# ⚠️ Configurar Variable de Entorno en Vercel

## Problema
La aplicación `visionaries-platform-admin` no funciona porque la variable de entorno `FIREBASE_SERVICE_ACCOUNT_VISIONARIES_TECH` **no está configurada en Vercel**.

## Solución

### Opción 1: Usar CLI (Recomendado)

1. **Obtén el JSON del service account:**
   ```
   /Users/gabrielapino/Library/Mobile Documents/com~apple~CloudDocs/9 nov 2025/visionaries-tech-firebase-adminsdk-fbsvc-5e928cfca6.json
   ```

2. **Instala Vercel CLI (si no lo tienes):**
   ```bash
   npm install -g vercel
   ```

3. **Loguéate en Vercel:**
   ```bash
   vercel login
   ```

4. **Configura la variable de entorno:**
   ```bash
   # Desde el directorio /Users/gabrielapino/visionaries/visionaries-platform-admin
   vercel env add FIREBASE_SERVICE_ACCOUNT_VISIONARIES_TECH
   ```
   
   Cuando te pida el valor:
   - Lee el contenido del JSON: `cat /Users/gabrielapino/Library/Mobile\ Documents/com~apple~CloudDocs/9\ nov\ 2025/visionaries-tech-firebase-adminsdk-fbsvc-5e928cfca6.json`
   - Copia TODO el contenido JSON (desde `{` hasta `}`)
   - Pégalo en la terminal
   - Selecciona los ambientes: `production` (importante)

### Opción 2: Panel de Vercel (Manual)

1. Ve a: https://vercel.com/dashboard
2. Selecciona el proyecto: `visionaries-platform-admin`
3. Settings → Environment Variables
4. Click en "Add New"
5. Name: `FIREBASE_SERVICE_ACCOUNT_VISIONARIES_TECH`
6. Value: (pega el contenido completo del JSON)
7. Environments: Selecciona `Production`
8. Click "Save"

## Verificación

Después de configurar:

```bash
# Verifica que está configurada localmente
vercel env list

# Debería mostrar:
# ✓ FIREBASE_SERVICE_ACCOUNT_VISIONARIES_TECH
```

## Redeploy

Una vez configurada la variable:

```bash
# Opción 1: Desde CLI
vercel --prod

# Opción 2: En GitHub
git push origin main  # Vercel desplegará automáticamente
```

## Commits Recientes

- `f4285b1` - revert: restaurar versión que funcionaba del commit 695988b
- `c32683e` - debug: agregar logs en inicialización de Firebase Admin SDK
- `fc8ddcf` - debug: agregar logs detallados en API y timeout

El código está correcto, solo falta la variable de entorno en Vercel.

---

**Fecha:** 22 de noviembre de 2025
**Status:** Awaiting env var configuration

