/**
 * Script para establecer hasPortalAdminAccess usando Node.js con Firebase Admin SDK
 * Este script intenta usar las credenciales disponibles
 * 
 * Uso:
 *   node scripts/set-portal-access-node.js <email> [hasAccess]
 */

const admin = require('firebase-admin');

// Intentar inicializar con diferentes métodos
let app;
let db;

try {
  // Método 1: Variable de entorno FIREBASE_SERVICE_ACCOUNT_PLATFORM_ADMIN
  if (process.env.FIREBASE_SERVICE_ACCOUNT_PLATFORM_ADMIN) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_PLATFORM_ADMIN);
    app = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: 'visionaries-platform-admin',
    }, 'platform-admin');
    db = admin.firestore(app);
    console.log('✅ Inicializado con FIREBASE_SERVICE_ACCOUNT_PLATFORM_ADMIN');
  } else {
    // Método 2: Application Default Credentials (gcloud auth)
    app = admin.initializeApp({
      projectId: 'visionaries-platform-admin',
    }, 'platform-admin');
    db = admin.firestore(app);
    console.log('✅ Inicializado con Application Default Credentials');
  }
} catch (error) {
  console.error('❌ Error inicializando Firebase Admin:', error.message);
  console.error('');
  console.error('Solución:');
  console.error('1. Configura FIREBASE_SERVICE_ACCOUNT_PLATFORM_ADMIN en .env.local');
  console.error('2. O ejecuta: gcloud auth application-default login');
  process.exit(1);
}

async function setPortalAdminAccess(email, hasAccess = true) {
  try {
    console.log(`[Set Portal Admin Access] Configurando acceso para ${email}...`);
    
    const usersRef = db.collection('users');
    const snapshot = await usersRef.where('email', '==', email).limit(1).get();
    
    if (snapshot.empty) {
      console.log(`[Set Portal Admin Access] Usuario no encontrado, creando nuevo documento...`);
      
      const newUserRef = usersRef.doc();
      await newUserRef.set({
        email,
        name: email.split('@')[0],
        isActive: true,
        hasPortalAdminAccess: hasAccess,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      
      console.log(`✅ Usuario creado con hasPortalAdminAccess: ${hasAccess}`);
      console.log(`   Document ID: ${newUserRef.id}`);
    } else {
      const userDoc = snapshot.docs[0];
      console.log(`[Set Portal Admin Access] Usuario encontrado, actualizando documento ${userDoc.id}...`);
      
      await userDoc.ref.update({
        hasPortalAdminAccess: hasAccess,
        updatedAt: new Date().toISOString(),
      });
      
      console.log(`✅ Usuario actualizado con hasPortalAdminAccess: ${hasAccess}`);
      console.log(`   Document ID: ${userDoc.id}`);
    }
    
    console.log(`\n✅ Proceso completado exitosamente.`);
    console.log(`\n⚠️  IMPORTANTE: El usuario debe cerrar sesión y volver a entrar en Aura para que los cambios surtan efecto.`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

// Obtener argumentos
const args = process.argv.slice(2);

if (args.length < 1) {
  console.error('❌ Error: Se requiere el email del usuario');
  console.log('\nUso:');
  console.log('  node scripts/set-portal-access-node.js <email> [hasAccess]');
  console.log('\nEjemplo:');
  console.log('  node scripts/set-portal-access-node.js adminplatform@visionarieshub.com true');
  process.exit(1);
}

const email = args[0];
const hasAccess = args[1] !== undefined ? args[1] === 'true' : true;

if (!email.includes('@')) {
  console.error('❌ Error: El email no es válido');
  process.exit(1);
}

setPortalAdminAccess(email, hasAccess);


