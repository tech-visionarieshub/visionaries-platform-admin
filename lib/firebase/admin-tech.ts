import admin from 'firebase-admin';

/**
 * Inicializa Admin SDK para visionaries-tech
 * Se usa SOLO para validar tokens de Auth
 */
let auraApp: admin.app.App | null = null;
let auraAuth: admin.auth.Auth | null = null;

export function getAuraApp(): admin.app.App {
  console.log('[Admin Tech] getAuraApp() llamado');
  if (!auraApp) {
    console.log('[Admin Tech] auraApp no existe, buscando app existente...');
    // Buscar si ya existe
    const existingApp = admin.apps.find(app => app?.name === 'aura');
    if (existingApp) {
      console.log('[Admin Tech] App existente encontrada, reutilizando');
      auraApp = existingApp as admin.app.App;
    } else {
      console.log('[Admin Tech] Inicializando nueva app...');
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

      console.log('[Admin Tech] Service account encontrado, parseando...');
      let credential;
      try {
        // Intentar parsear como JSON string
        const serviceAccountJson = JSON.parse(serviceAccount);
        credential = admin.credential.cert(serviceAccountJson);
        console.log('[Admin Tech] Service account parseado correctamente');
      } catch (parseError) {
        console.error('[Admin Tech] Error parseando service account:', parseError);
        // Si falla, asumir que es path a archivo
        credential = admin.credential.cert(serviceAccount);
      }

      console.log('[Admin Tech] Inicializando Firebase Admin App...');
      try {
        auraApp = admin.initializeApp(
          {
            credential,
            projectId: 'visionaries-tech',
          },
          'aura'
        );
        console.log('[Admin Tech] Firebase Admin App inicializada exitosamente');
      } catch (initError) {
        console.error('[Admin Tech] Error inicializando Firebase Admin App:', initError);
        throw initError;
      }
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
  console.log('[Admin Tech] verifyIdToken() llamado, token length:', idToken.length);
  try {
    const auth = getAuraAuth();
    console.log('[Admin Tech] Auth obtenido, verificando token...');
    const decoded = await auth.verifyIdToken(idToken);
    console.log('[Admin Tech] Token verificado exitosamente, uid:', decoded.uid);
    return decoded;
  } catch (error: any) {
    console.error('[Admin Tech] Error verificando token:', {
      message: error.message,
      code: error.code,
      name: error.name
    });
    throw error;
  }
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

