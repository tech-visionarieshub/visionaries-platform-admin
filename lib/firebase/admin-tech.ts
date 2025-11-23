import admin from 'firebase-admin';

/**
 * Inicializa Admin SDK para visionaries-tech
 * Se usa SOLO para validar tokens de Auth
 */
let auraApp: admin.app.App | null = null;
let auraAuth: admin.auth.Auth | null = null;

export function getAuraApp(): admin.app.App {
  if (!auraApp) {
    // Buscar si ya existe
    const existingApp = admin.apps.find(app => app?.name === 'aura');
    if (existingApp) {
      auraApp = existingApp as admin.app.App;
    } else {
      // Inicializar con service account de visionaries-tech
      const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_VISIONARIES_TECH;
      
      if (!serviceAccount) {
        const error = new Error(
          'FIREBASE_SERVICE_ACCOUNT_VISIONARIES_TECH no está configurado. ' +
          'Necesitas el JSON del service account de visionaries-tech en las variables de entorno de Vercel.'
        );
        console.error('[Admin Tech] Error de configuración:', error.message);
        throw error;
      }

      let credential;
      try {
        // Remover comillas simples o dobles del inicio y final si existen
        let jsonString = serviceAccount.trim();
        if ((jsonString.startsWith("'") && jsonString.endsWith("'")) || 
            (jsonString.startsWith('"') && jsonString.endsWith('"'))) {
          jsonString = jsonString.slice(1, -1);
        }
        
        // Intentar parsear como JSON string
        const serviceAccountJson = JSON.parse(jsonString);
        credential = admin.credential.cert(serviceAccountJson);
      } catch (parseError: any) {
        // Si falla el parseo, intentar como path a archivo
        try {
          credential = admin.credential.cert(serviceAccount);
        } catch (fileError: any) {
          const error = new Error(
            `Error al inicializar Firebase Admin SDK para visionaries-tech. ` +
            `No se pudo parsear como JSON ni usar como path a archivo. ` +
            `Error de parseo: ${parseError.message}. ` +
            `Error de archivo: ${fileError.message}`
          );
          console.error('[Admin Tech] Error de configuración:', error.message);
          throw error;
        }
      }

      auraApp = admin.initializeApp(
        {
          credential,
          projectId: 'visionaries-tech',
        },
        'aura'
      );
    }
  }
  return auraApp;
}

/**
 * Obtiene Auth de visionaries-tech para validar tokens
 */
export function getAuraAuth(): admin.auth.Auth {
  if (!auraAuth) {
    const app = getAuraApp();
    auraAuth = admin.auth(app);
  }
  return auraAuth;
}

/**
 * Verifica un idToken de Firebase Auth (visionaries-tech)
 * Retorna el decoded token con los custom claims
 */
export async function verifyIdToken(idToken: string): Promise<admin.auth.DecodedIdToken> {
  const auth = getAuraAuth();
  return await auth.verifyIdToken(idToken);
}

/**
 * Verifica si el usuario tiene acceso interno
 */
export async function hasInternalAccess(idToken: string): Promise<boolean> {
  try {
    const decoded = await verifyIdToken(idToken);
    return decoded.internal === true;
  } catch (error) {
    console.error('[Admin Tech] Error verificando acceso interno:', error);
    return false;
  }
}

/**
 * Obtiene los custom claims de un usuario
 */
export async function getUserClaims(uid: string): Promise<Record<string, any> | null> {
  try {
    const auth = getAuraAuth();
    const user = await auth.getUser(uid);
    return user.customClaims || null;
  } catch (error) {
    console.error('[Admin Tech] Error obteniendo claims:', error);
    return null;
  }
}

/**
 * Asigna custom claims a un usuario
 * IMPORTANTE: Después de asignar claims, el usuario debe refrescar su token
 */
export async function setCustomUserClaims(
  uid: string,
  claims: { internal?: boolean; role?: string; [key: string]: any }
): Promise<void> {
  const auth = getAuraAuth();
  await auth.setCustomUserClaims(uid, claims);
  console.log(`[Admin Tech] Custom claims asignados a ${uid}:`, claims);
}

/**
 * Revoca el acceso interno de un usuario
 */
export async function revokeInternalAccess(uid: string): Promise<void> {
  await setCustomUserClaims(uid, { internal: false });
}

