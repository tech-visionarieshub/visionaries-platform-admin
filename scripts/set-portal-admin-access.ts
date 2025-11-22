/**
 * Script para establecer hasPortalAdminAccess en Firestore
 * 
 * Uso:
 *   npx tsx scripts/set-portal-admin-access.ts <email> [hasAccess]
 * 
 * Ejemplo:
 *   npx tsx scripts/set-portal-admin-access.ts adminplatform@visionarieshub.com true
 */

import { getInternalFirestore } from '../lib/firebase/admin-platform';

async function setPortalAdminAccess(email: string, hasAccess: boolean = true) {
  try {
    console.log(`[Set Portal Admin Access] Configurando acceso para ${email}...`);
    
    const db = getInternalFirestore();
    
    // Buscar usuario por email en la colección users
    const usersRef = db.collection('users');
    const snapshot = await usersRef.where('email', '==', email).limit(1).get();
    
    if (snapshot.empty) {
      // Crear nuevo documento
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
      // Actualizar documento existente
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
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

// Obtener argumentos de línea de comandos
const args = process.argv.slice(2);

if (args.length < 1) {
  console.error('❌ Error: Se requiere el email del usuario');
  console.log('\nUso:');
  console.log('  npx tsx scripts/set-portal-admin-access.ts <email> [hasAccess]');
  console.log('\nEjemplo:');
  console.log('  npx tsx scripts/set-portal-admin-access.ts adminplatform@visionarieshub.com true');
  process.exit(1);
}

const email = args[0];
const hasAccess = args[1] !== undefined ? args[1] === 'true' : true;

// Validar email
if (!email.includes('@')) {
  console.error('❌ Error: El email no es válido');
  process.exit(1);
}

setPortalAdminAccess(email, hasAccess);

