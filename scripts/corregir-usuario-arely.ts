/**
 * Script para revisar y corregir el usuario arelyibarra@visionarieshub.com
 * 
 * Uso:
 *   npx tsx scripts/corregir-usuario-arely.ts
 */

import { getAuraAuth, setCustomUserClaims } from '../lib/firebase/admin-tech';
import { getInternalFirestore } from '../lib/firebase/admin-platform';

const EMAIL = 'arelyibarra@visionarieshub.com';

async function revisarYCorregir() {
  try {
    console.log('\n╔════════════════════════════════════════════════════════════════╗');
    console.log('║     REVISIÓN Y CORRECCIÓN DE USUARIO                        ║');
    console.log('╚════════════════════════════════════════════════════════════════╝\n');
    console.log(`📧 Email: ${EMAIL}\n`);
    console.log('─'.repeat(60));
    
    const auth = getAuraAuth();
    const db = getInternalFirestore();
    
    // 1. Verificar en Firebase Auth
    console.log('\n🔍 1. VERIFICANDO EN FIREBASE AUTH...\n');
    let user;
    try {
      user = await auth.getUserByEmail(EMAIL);
      console.log('✅ Usuario encontrado en Firebase Auth');
      console.log(`   UID: ${user.uid}`);
      console.log(`   Email verificado: ${user.emailVerified ? 'Sí' : 'No'}`);
      
      const claims = user.customClaims || {};
      console.log(`\n📋 Custom Claims actuales:`);
      console.log(`   internal: ${claims.internal === true ? '✅ SÍ' : '❌ NO'}`);
      console.log(`   role: ${claims.role || '❌ NO'}`);
      console.log(`   superadmin: ${claims.superadmin === true ? '✅ SÍ' : '❌ NO'}`);
      
      const hasInternal = claims.internal === true;
      const hasRole = !!claims.role;
      
      // 2. Verificar en Firestore
      console.log('\n🔍 2. VERIFICANDO EN FIRESTORE...\n');
      const usersRef = db.collection('users');
      const snapshot = await usersRef.where('email', '==', EMAIL).limit(1).get();
      
      let firestoreData = null;
      if (!snapshot.empty) {
        const userDoc = snapshot.docs[0];
        const userData = userDoc.data();
        firestoreData = {
          docId: userDoc.id,
          hasPortalAdminAccess: userData.hasPortalAdminAccess === true,
          isActive: userData.isActive !== false,
        };
        console.log('✅ Usuario encontrado en Firestore');
        console.log(`   Document ID: ${userDoc.id}`);
        console.log(`   hasPortalAdminAccess: ${firestoreData.hasPortalAdminAccess ? '✅ SÍ' : '❌ NO'}`);
        console.log(`   isActive: ${firestoreData.isActive ? '✅ SÍ' : '❌ NO'}`);
      } else {
        console.log('❌ Usuario NO encontrado en Firestore');
        console.log('   → Necesita crear documento con hasPortalAdminAccess: true');
      }
      
      // 3. Verificar proyectos
      console.log('\n🔍 3. VERIFICANDO PROYECTOS...\n');
      const projectsRef = db.collection('projects');
      const allProjects = await projectsRef.get();
      
      let totalProjects = 0;
      let projectsWithAccess = 0;
      
      allProjects.forEach(doc => {
        totalProjects++;
        const projectData = doc.data();
        const teamMembers = projectData.teamMembers || [];
        if (teamMembers.includes(EMAIL)) {
          projectsWithAccess++;
        }
      });
      
      console.log(`📊 Total de proyectos: ${totalProjects}`);
      console.log(`📊 Proyectos con acceso: ${projectsWithAccess}`);
      console.log(`📊 Proyectos sin acceso: ${totalProjects - projectsWithAccess}`);
      
      // 4. Corregir problemas
      console.log('\n' + '─'.repeat(60));
      console.log('🔧 CORRIGIENDO PROBLEMAS...\n');
      
      let cambios = false;
      
      // Corregir Custom Claims
      if (!hasInternal || !hasRole) {
        console.log('📝 Actualizando Custom Claims...');
        const newClaims: any = {
          ...claims,
          internal: true,
          role: hasRole ? claims.role : 'admin',
        };
        
        await setCustomUserClaims(user.uid, newClaims);
        console.log('✅ Custom Claims actualizados:');
        console.log(`   internal: true`);
        console.log(`   role: ${newClaims.role}`);
        cambios = true;
      } else {
        console.log('✅ Custom Claims correctos');
      }
      
      // Corregir Firestore
      if (!firestoreData || !firestoreData.hasPortalAdminAccess) {
        console.log('📝 Actualizando Firestore...');
        if (firestoreData) {
          // Actualizar documento existente
          await usersRef.doc(firestoreData.docId).update({
            hasPortalAdminAccess: true,
            updatedAt: new Date().toISOString(),
          });
          console.log('✅ Firestore actualizado: hasPortalAdminAccess = true');
        } else {
          // Crear nuevo documento
          const newDoc = usersRef.doc();
          await newDoc.set({
            email: EMAIL,
            name: EMAIL.split('@')[0],
            isActive: true,
            hasPortalAdminAccess: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
          console.log('✅ Documento creado en Firestore con hasPortalAdminAccess = true');
        }
        cambios = true;
      } else {
        console.log('✅ Firestore correcto: hasPortalAdminAccess = true');
      }
      
      // Resumen final
      console.log('\n' + '═'.repeat(60));
      console.log('📋 RESUMEN FINAL\n');
      
      if (cambios) {
        console.log('✅ Cambios realizados exitosamente');
        console.log('\n⚠️  IMPORTANTE: El usuario debe:');
        console.log('   1. Cerrar sesión en Aura');
        console.log('   2. Volver a iniciar sesión');
        console.log('   3. Los Custom Claims se actualizarán en el próximo login');
      } else {
        console.log('✅ Usuario ya está correctamente configurado');
        console.log('\n💡 Si el usuario no puede ver proyectos, verifica:');
        console.log('   - Que esté en el array teamMembers de los proyectos');
        console.log('   - Que haya cerrado sesión y vuelto a entrar');
        console.log('   - Que el token no esté cacheado');
      }
      
      console.log('\n' + '═'.repeat(60) + '\n');
      
    } catch (error: any) {
      if (error.code === 'auth/user-not-found') {
        console.log('❌ Usuario NO encontrado en Firebase Auth');
        console.log('   El usuario debe registrarse primero en Aura');
        process.exit(1);
      } else {
        throw error;
      }
    }
  } catch (error: any) {
    console.error('\n❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

revisarYCorregir();

