import admin from 'firebase-admin';

/**
 * Inicializa Admin SDK para visionaries-platform-admin
 * Se usa SOLO para acceder a Firestore/Storage interno
 * NUNCA se expone al frontend
 */
let internalApp: admin.app.App | null = null;
let internalDb: admin.firestore.Firestore | null = null;
let internalStorage: admin.storage.Storage | null = null;

export function getInternalApp(): admin.app.App {
  if (!internalApp) {
    // Buscar si ya existe
    const existingApp = admin.apps.find(app => app?.name === 'internal');
    if (existingApp) {
      internalApp = existingApp as admin.app.App;
    } else {
      // Inicializar con service account de visionaries-platform-admin
      const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_PLATFORM_ADMIN;
      
      if (!serviceAccount) {
        throw new Error(
          'FIREBASE_SERVICE_ACCOUNT_PLATFORM_ADMIN no está configurado. ' +
          'Necesitas el JSON del service account de visionaries-platform-admin.'
        );
      }

      let credential;
      try {
        // Intentar parsear como JSON string primero
        try {
          const serviceAccountJson = JSON.parse(serviceAccount);
          credential = admin.credential.cert(serviceAccountJson);
        } catch (jsonError) {
          // Si no es JSON válido, asumir que es path a archivo
          if (serviceAccount.startsWith('{')) {
            throw jsonError; // Es JSON pero inválido, propagar el error
          }
          credential = admin.credential.cert(serviceAccount);
        }
      } catch (error) {
        throw new Error(
          'FIREBASE_SERVICE_ACCOUNT_PLATFORM_ADMIN debe ser un JSON válido o una ruta a archivo. ' +
          'Error: ' + (error instanceof Error ? error.message : String(error))
        );
      }

      internalApp = admin.initializeApp(
        {
          credential,
          projectId: 'visionaries-platform-admin',
        },
        'internal'
      );
    }
  }
  return internalApp;
}

/**
 * Obtiene Firestore de visionaries-platform-admin
 */
export function getInternalFirestore(): admin.firestore.Firestore {
  if (!internalDb) {
    const app = getInternalApp();
    internalDb = admin.firestore(app);
  }
  return internalDb;
}

/**
 * Obtiene Storage de visionaries-platform-admin
 */
export function getInternalStorage(): admin.storage.Storage {
  if (!internalStorage) {
    const app = getInternalApp();
    internalStorage = admin.storage(app);
  }
  return internalStorage;
}




