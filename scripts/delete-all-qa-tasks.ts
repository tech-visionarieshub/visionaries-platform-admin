/**
 * Script para eliminar todas las tareas QA existentes
 * 
 * Uso: npx tsx scripts/delete-all-qa-tasks.ts [--confirm]
 * 
 * Sin --confirm, solo muestra qué se eliminaría sin hacer cambios
 */

import { readFileSync } from 'fs'
import { resolve } from 'path'

// Cargar variables de entorno desde .env.local manualmente
try {
  const envPath = resolve(__dirname, '../.env.local')
  const envContent = readFileSync(envPath, 'utf-8')
  envContent.split('\n').forEach(line => {
    const trimmedLine = line.trim()
    if (trimmedLine && !trimmedLine.startsWith('#')) {
      const [key, ...valueParts] = trimmedLine.split('=')
      if (key && valueParts.length > 0) {
        const value = valueParts.join('=').trim()
        // Remover comillas si existen
        const cleanValue = value.replace(/^["']|["']$/g, '')
        process.env[key.trim()] = cleanValue
      }
    }
  })
} catch (error) {
  console.warn('No se pudo cargar .env.local, usando variables de entorno del sistema')
}

import { getInternalFirestore } from '../lib/firebase/admin-platform';
import admin from 'firebase-admin';

async function deleteAllQATasks(confirm: boolean = false) {
  try {
    const db = getInternalFirestore();
    
    if (!confirm) {
      console.log('⚠️  MODO DRY RUN - No se eliminará nada. Usa --confirm para ejecutar.');
      console.log('');
    }

    // Listar todos los proyectos
    const projectsSnapshot = await db.collection('projects').get();
    const projects = projectsSnapshot.docs.map(doc => ({
      id: doc.id,
      name: doc.data().name || 'Sin nombre',
    }));

    console.log(`📋 Encontrados ${projects.length} proyectos\n`);

    let totalDeleted = 0;
    const projectStats: Array<{ projectId: string; projectName: string; count: number }> = [];

    for (const project of projects) {
      const qaTasksRef = db.collection(`projects/${project.id}/qa-tasks`);
      const qaTasksSnapshot = await qaTasksRef.get();
      const taskCount = qaTasksSnapshot.size;

      if (taskCount > 0) {
        projectStats.push({
          projectId: project.id,
          projectName: project.name,
          count: taskCount,
        });

        console.log(`📦 Proyecto: ${project.name} (${project.id})`);
        console.log(`   Tareas QA encontradas: ${taskCount}`);

        if (confirm) {
          // Eliminar todas las tareas
          const batch = db.batch();
          qaTasksSnapshot.docs.forEach(doc => {
            batch.delete(doc.ref);
          });
          await batch.commit();
          console.log(`   ✅ Eliminadas ${taskCount} tareas`);
          totalDeleted += taskCount;
        } else {
          console.log(`   ⚠️  Se eliminarían ${taskCount} tareas (dry run)`);
          totalDeleted += taskCount;
        }
        console.log('');
      }
    }

    // Resumen
    console.log('═══════════════════════════════════════════════════');
    if (confirm) {
      console.log(`✅ RESUMEN: ${totalDeleted} tareas QA eliminadas en ${projectStats.length} proyectos`);
    } else {
      console.log(`📊 RESUMEN: ${totalDeleted} tareas QA se eliminarían en ${projectStats.length} proyectos`);
      console.log('');
      console.log('Para ejecutar la eliminación, usa:');
      console.log('  npx tsx scripts/delete-all-qa-tasks.ts --confirm');
    }
    console.log('═══════════════════════════════════════════════════');

    if (projectStats.length > 0) {
      console.log('\n📋 Detalle por proyecto:');
      projectStats.forEach(stat => {
        console.log(`   - ${stat.projectName}: ${stat.count} tareas`);
      });
    }

  } catch (error: any) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Ejecutar script
const args = process.argv.slice(2);
const confirm = args.includes('--confirm');

deleteAllQATasks(confirm)
  .then(() => {
    console.log('\n✅ Script completado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error fatal:', error);
    process.exit(1);
  });

