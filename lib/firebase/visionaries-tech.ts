"use client"

import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { 
  getAuth, 
  Auth,
  onAuthStateChanged,
  User,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';

// Configuración de visionaries-tech (NO del proyecto interno)
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

let app: FirebaseApp | null = null;
let authInstance: Auth | null = null;

/**
 * Inicializa Firebase App de visionaries-tech
 * Solo se usa para Auth, nunca para Firestore/Storage
 */
export function getFirebaseApp(): FirebaseApp {
  if (!app) {
    const existingApps = getApps();
    if (existingApps.length === 0) {
      if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
        throw new Error('Firebase config de visionaries-tech no está configurada. Verifica las variables de entorno.');
      }
      app = initializeApp(firebaseConfig, 'visionaries-tech');
    } else {
      app = existingApps[0];
    }
  }
  return app;
}

/**
 * Obtiene la instancia de Auth de visionaries-tech
 */
export function getAuthInstance(): Auth {
  if (!authInstance) {
    const firebaseApp = getFirebaseApp();
    authInstance = getAuth(firebaseApp);
  }
  return authInstance;
}

/**
 * Obtiene el idToken del usuario actual
 * Este token se envía al backend para validación
 */
export async function getIdToken(forceRefresh = false): Promise<string | null> {
  const auth = getAuthInstance();
  const user = auth.currentUser;
  
  if (user) {
    try {
      return await user.getIdToken(forceRefresh);
    } catch (error) {
      console.error('[Firebase Auth] Error obteniendo idToken:', error);
    }
  }
  
  return null;
}

/**
 * Observa cambios en el estado de autenticación
 */
export function onAuthStateChange(callback: (user: User | null) => void) {
  const auth = getAuthInstance();
  return onAuthStateChanged(auth, callback);
}

/**
 * Login con email y password
 */
export async function signIn(email: string, password: string) {
  const auth = getAuthInstance();
  return await signInWithEmailAndPassword(auth, email, password);
}

/**
 * Login con Google
 */
export async function signInWithGoogle() {
  const auth = getAuthInstance();
  const provider = new GoogleAuthProvider();
  return await signInWithPopup(auth, provider);
}

/**
 * Cerrar sesión
 */
export async function signOut() {
  const auth = getAuthInstance();
  await firebaseSignOut(auth);
}

/**
 * Obtiene el usuario actual
 */
export function getCurrentUser(): User | null {
  const auth = getAuthInstance();
  return auth.currentUser;
}
