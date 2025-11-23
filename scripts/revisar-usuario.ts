/**
 * Script para revisar el estado de un usuario en el sistema
 * Verifica:
 * 1. Si existe en Firebase Auth (visionaries-tech)
 * 2. Custom Claims (internal, role, superadmin)
 * 3. hasPortalAdminAccess en Firestore (visionaries-platform-admin)
 * 
 * Uso:
 *   npx tsx scripts/revisar-usuario.ts <email>
 * 
 * Ejemplo:
 *   npx tsx scripts/revisar-usuario.ts arelyibarra@visionarieshub.com
 */

import { getAuraAuth, getUserClaims } from '../lib/firebase/admin-tech';
import { getInternalFirestore } from '../lib/firebase/admin-platform';

const email = process.argv[2];

if (!email) {
  console.error('❌ Error: Email es requerido');
  console.error('Uso: npx tsx scripts/revisar-usuario.ts <email>');
  console.error('Ejemplo: npx tsx scripts/revisar-usuario.ts arelyibarra@visionarieshub.com');
  process.exit(1);
}

async function revisarUsuario() {
  try {
    console.log('\n╔════════════════════════════════════════════════════════════════╗');
    console.log('║          REVISIÓN DE USUARIO EN ADMIN PLATFORM               ║');
    console.log('╚════════════════════════════════════════════════════════════════╝\n');
    
    console.log(`📧 Email: ${email}\n`);
    console.log('─'.repeat(60));
    
    // 1. Verificar en Firebase Auth (visionaries-tech)
    console.log('\n🔍 1. VERIFICANDO EN FIREBASE AUTH (visionaries-tech)...\n');
    
    const auth = getAuraAuth();
    let user;
    try {
      user = await auth.getUserByEmail(email);
      console.log('✅ Usuario encontrado en Firebase Auth');
      console.log(`   UID: ${user.uid}`);
      console.log(`   Email verificado: ${user.emailVerified ? 'Sí' : 'No'}`);
      console.log(`   Proveedor: ${user.providerData[0]?.providerId || 'N/A'}`);
      console.log(`   Creado: ${user.metadata.creationTime}`);
      console.log(`   Último acceso: ${user.metadata.lastSignInTime || 'Nunca'}`);
    } catch (error: any) {
      if (error.code === 'auth/user-not-found') {
        console.log('❌ Usuario NO encontrado en Firebase Auth');
        console.log('   El usuario debe registrarse primero en Aura');
        console.log('\n⚠️  No se puede continuar la revisión sin usuario en Firebase Auth');
        process.exit(1);
      } else {
        throw error;
      }
    }
    
    // 2. Verificar Custom Claims
    console.log('\n🔍 2. VERIFICANDO CUSTOM CLAIMS...\n');
    
    const claims = user.customClaims || {};
    
    if (Object.keys(claims).length === 0) {
      console.log('❌ No hay Custom Claims asignados');
      console.log('   El usuario NO tiene acceso al Admin Platform');
    } else {
      console.log('📋 Custom Claims encontrados:');
      console.log(JSON.stringify(claims, null, 2));
      
      const hasInternal = claims.internal === true;
      const hasRole = !!claims.role;
      const isSuperAdmin = claims.superadmin === true;
      
      console.log('\n📊 Análisis de Claims:');
      console.log(`   internal: ${hasInternal ? '✅ SÍ' : '❌ NO'} ${hasInternal ? '(requerido)' : '(REQUERIDO)'}`);
      console.log(`   role: ${hasRole ? `✅ "${claims.role}"` : '❌ NO (requerido)'}`);
      console.log(`   superadmin: ${isSuperAdmin ? '✅ SÍ' : '❌ NO (opcional)'}`);
      
      if (hasInternal && hasRole) {
        console.log('\n✅ El usuario TIENE acceso al Admin Platform (según Custom Claims)');
      } else {
        console.log('\n❌ El usuario NO tiene acceso completo al Admin Platform');
        if (!hasInternal) {
          console.log('   → Falta: internal: true');
        }
        if (!hasRole) {
          console.log('   → Falta: role: "admin"');
        }
      }
    }
    
    // 3. Verificar hasPortalAdminAccess en Firestore
    console.log('\n🔍 3. VERIFICANDO hasPortalAdminAccess EN FIRESTORE...\n');
    
    try {
      const db = getInternalFirestore();
      const usersRef = db.collection('users');
      const snapshot = await usersRef.where('email', '==', email).limit(1).get();
      
      if (snapshot.empty) {
        console.log('❌ Usuario NO encontrado en Firestore (visionaries-platform-admin/users)');
        console.log('   El botón "Portal Admin" NO aparecerá en Aura');
        console.log('   → Necesita crear documento con hasPortalAdminAccess: true');
      } else {
        const userDoc = snapshot.docs[0];
        const userData = userDoc.data();
        
        console.log('✅ Usuario encontrado en Firestore');
        console.log(`   Document ID: ${userDoc.id}`);
        console.log(`   Email: ${userData.email}`);
        console.log(`   hasPortalAdminAccess: ${userData.hasPortalAdminAccess === true ? '✅ SÍ' : '❌ NO'}`);
        console.log(`   isActive: ${userData.isActive === true ? '✅ SÍ' : '❌ NO'}`);
        console.log(`   Creado: ${userData.createdAt || 'N/A'}`);
        console.log(`   Actualizado: ${userData.updatedAt || 'N/A'}`);
        
        if (userData.hasPortalAdminAccess === true) {
          console.log('\n✅ El botón "Portal Admin" DEBERÍA aparecer en Aura');
        } else {
          console.log('\n❌ El botón "Portal Admin" NO aparecerá en Aura');
          console.log('   → Necesita: hasPortalAdminAccess: true');
        }
      }
    } catch (error: any) {
      console.error('❌ Error accediendo a Firestore:', error.message);
      if (error.message?.includes('FIREBASE_SERVICE_ACCOUNT_PLATFORM_ADMIN')) {
        console.error('   → FIREBASE_SERVICE_ACCOUNT_PLATFORM_ADMIN no está configurado');
      }
    }
    
    // 4. Resumen final
    console.log('\n' + '─'.repeat(60));
    console.log('\n📋 RESUMEN:\n');
    
    const hasInternalAccess = claims.internal === true;
    const hasRoleAccess = !!claims.role;
    
    // Verificar hasPortalAdminAccess
    let hasPortalAccess = false;
    try {
      const db = getInternalFirestore();
      const usersRef = db.collection('users');
      const snapshot = await usersRef.where('email', '==', email).limit(1).get();
      if (!snapshot.empty) {
        const userData = snapshot.docs[0].data();
        hasPortalAccess = userData.hasPortalAdminAccess === true;
      }
    } catch (e) {
      // Ignorar error, ya se mostró arriba
    }
    
    console.log(`✅ Firebase Auth: Usuario existe`);
    console.log(`${hasInternalAccess && hasRoleAccess ? '✅' : '❌'} Custom Claims: ${hasInternalAccess && hasRoleAccess ? 'Completos' : 'Incompletos'}`);
    console.log(`${hasPortalAccess ? '✅' : '❌'} Firestore: ${hasPortalAccess ? 'hasPortalAdminAccess = true' : 'Falta hasPortalAdminAccess'}`);
    
    if (hasInternalAccess && hasRoleAccess && hasPortalAccess) {
      console.log('\n🎉 El usuario está COMPLETAMENTE configurado y debería tener acceso');
      console.log('   → Puede acceder al Admin Platform');
      console.log('   → El botón "Portal Admin" aparecerá en Aura');
      console.log('\n⚠️  Si el usuario no ve el botón, debe:');
      console.log('   1. Cerrar sesión en Aura');
      console.log('   2. Volver a iniciar sesión');
    } else {
      console.log('\n⚠️  El usuario NO está completamente configurado');
      if (!hasInternalAccess || !hasRoleAccess) {
        console.log('   → Falta configurar Custom Claims (internal: true, role: "admin")');
      }
      if (!hasPortalAccess) {
        console.log('   → Falta configurar hasPortalAdminAccess en Firestore');
      }
      console.log('\n💡 Solución: Usar Settings → Gestión de Usuarios → Agregar Usuario');
    }
    
    console.log('\n' + '═'.repeat(60) + '\n');
    
    process.exit(0);
  } catch (error: any) {
    console.error('\n❌ Error revisando usuario:', error.message);
    if (error.message?.includes('FIREBASE_SERVICE_ACCOUNT')) {
      console.error('\n💡 Asegúrate de tener configuradas las variables de entorno:');
      console.error('   - FIREBASE_SERVICE_ACCOUNT_VISIONARIES_TECH');
      console.error('   - FIREBASE_SERVICE_ACCOUNT_PLATFORM_ADMIN');
    }
    process.exit(1);
  }
}

revisarUsuario();

