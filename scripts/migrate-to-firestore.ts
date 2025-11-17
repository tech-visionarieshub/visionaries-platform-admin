/**
 * Script de migración de datos mock a Firestore
 * 
 * Uso:
 * npx tsx scripts/migrate-to-firestore.ts [--dry-run] [--collection=<nombre>]
 * 
 * Opciones:
 * --dry-run: Solo valida los datos sin escribir en Firestore
 * --collection: Migra solo una colección específica (projects, cotizaciones, etc.)
 */

import admin from 'firebase-admin';
import { mockProjects } from '../lib/mock-data/projects';
import { mockCotizaciones } from '../lib/mock-data/cotizaciones';
import { mockTemplates } from '../lib/mock-data/cotizaciones-templates';
import { mockClientes, mockFacturas, mockComplementos, mockEgresos, mockTeamMembers } from '../lib/mock-data/finanzas';
import { defaultConfig } from '../lib/mock-data/cotizaciones-config';

// Parsear argumentos
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const collectionArg = args.find(arg => arg.startsWith('--collection='));
const collectionName = collectionArg ? collectionArg.split('=')[1] : null;

interface MigrationStats {
  collection: string;
  total: number;
  created: number;
  errors: number;
  errorDetails: string[];
}

const stats: MigrationStats[] = [];

async function migrateCollection<T>(
  name: string,
  data: T[],
  db: admin.firestore.Firestore,
  getId: (item: T) => string
): Promise<MigrationStats> {
  const stat: MigrationStats = {
    collection: name,
    total: data.length,
    created: 0,
    errors: 0,
    errorDetails: [],
  };

  console.log(`\n📦 Migrando ${name}...`);
  console.log(`   Total de documentos: ${data.length}`);

  if (dryRun) {
    console.log(`   ⚠️  DRY RUN - No se escribirán datos`);
    stat.created = data.length; // Simular éxito
    return stat;
  }

  const collection = db.collection(name);

  for (const item of data) {
    try {
      const id = getId(item);
      const { id: _, ...itemData } = item as any;
      const docData = {
        ...itemData,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };
      await collection.doc(id).set(docData);
      stat.created++;
      process.stdout.write(`   ✓ ${id}\r`);
    } catch (error: any) {
      stat.errors++;
      const errorMsg = `${getId(item)}: ${error.message}`;
      stat.errorDetails.push(errorMsg);
      console.error(`\n   ✗ Error en ${getId(item)}: ${error.message}`);
    }
  }

  console.log(`\n   ✅ Completado: ${stat.created}/${stat.total} documentos`);
  if (stat.errors > 0) {
    console.log(`   ❌ Errores: ${stat.errors}`);
  }

  return stat;
}

async function migrateConfig(db: admin.firestore.Firestore): Promise<MigrationStats> {
  const stat: MigrationStats = {
    collection: 'config',
    total: 1,
    created: 0,
    errors: 0,
    errorDetails: [],
  };

  console.log(`\n📦 Migrando config...`);

  if (dryRun) {
    console.log(`   ⚠️  DRY RUN - No se escribirán datos`);
    stat.created = 1;
    return stat;
  }

  try {
    const configDoc = db.collection('config').doc('cotizaciones');
    await configDoc.set({
      ...defaultConfig,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    stat.created = 1;
    console.log(`   ✅ Configuración guardada`);
  } catch (error: any) {
    stat.errors = 1;
    stat.errorDetails.push(`Error: ${error.message}`);
    console.error(`   ❌ Error: ${error.message}`);
  }

  return stat;
}

async function main() {
  console.log('🚀 Iniciando migración a Firestore...\n');

  if (dryRun) {
    console.log('⚠️  MODO DRY RUN - No se escribirán datos en Firestore\n');
  }

  if (collectionName) {
    console.log(`📌 Migrando solo la colección: ${collectionName}\n`);
  }

  try {
    // Inicializar Firebase Admin con Application Default Credentials
    let app: admin.app.App;
    if (admin.apps.length === 0) {
      try {
        app = admin.initializeApp({
          projectId: 'visionaries-platform-admin',
          // Usar Application Default Credentials (del CLI)
        });
        console.log('✅ Firebase Admin inicializado con Application Default Credentials\n');
      } catch (error: any) {
        console.error('❌ Error inicializando Firebase Admin:', error.message);
        console.error('\n💡 Asegúrate de estar autenticado con Firebase CLI:');
        console.error('   firebase login');
        console.error('   O configura GOOGLE_APPLICATION_CREDENTIALS');
        process.exit(1);
      }
    } else {
      app = admin.apps[0];
    }

    const db = admin.firestore(app);

    // Migrar según la colección especificada o todas
    if (!collectionName || collectionName === 'projects') {
      const stat = await migrateCollection(
        'projects',
        mockProjects,
        db,
        (p) => p.id
      );
      stats.push(stat);
    }

    if (!collectionName || collectionName === 'cotizaciones') {
      const stat = await migrateCollection(
        'cotizaciones',
        mockCotizaciones,
        db,
        (c) => c.id
      );
      stats.push(stat);
    }

    if (!collectionName || collectionName === 'templates') {
      const stat = await migrateCollection(
        'cotizaciones-templates',
        mockTemplates,
        db,
        (t) => t.id
      );
      stats.push(stat);
    }

    if (!collectionName || collectionName === 'clientes') {
      const stat = await migrateCollection(
        'clientes',
        mockClientes,
        db,
        (c) => c.id
      );
      stats.push(stat);
    }

    if (!collectionName || collectionName === 'facturas') {
      const stat = await migrateCollection(
        'facturas',
        mockFacturas,
        db,
        (f) => f.id
      );
      stats.push(stat);
    }

    if (!collectionName || collectionName === 'complementos') {
      const stat = await migrateCollection(
        'complementos',
        mockComplementos,
        db,
        (c) => c.id
      );
      stats.push(stat);
    }

    if (!collectionName || collectionName === 'egresos') {
      const stat = await migrateCollection(
        'egresos',
        mockEgresos,
        db,
        (e) => e.id
      );
      stats.push(stat);
    }

    if (!collectionName || collectionName === 'nomina') {
      const stat = await migrateCollection(
        'nomina',
        mockTeamMembers,
        db,
        (m) => m.id
      );
      stats.push(stat);
    }

    if (!collectionName || collectionName === 'config') {
      const stat = await migrateConfig(db);
      stats.push(stat);
    }

    // Resumen final
    console.log('\n' + '='.repeat(60));
    console.log('📊 RESUMEN DE MIGRACIÓN');
    console.log('='.repeat(60));

    let totalDocs = 0;
    let totalCreated = 0;
    let totalErrors = 0;

    stats.forEach((stat) => {
      console.log(`\n${stat.collection}:`);
      console.log(`  Total: ${stat.total}`);
      console.log(`  Creados: ${stat.created}`);
      if (stat.errors > 0) {
        console.log(`  Errores: ${stat.errors}`);
        stat.errorDetails.forEach((detail) => {
          console.log(`    - ${detail}`);
        });
      }
      totalDocs += stat.total;
      totalCreated += stat.created;
      totalErrors += stat.errors;
    });

    console.log('\n' + '='.repeat(60));
    console.log(`Total documentos: ${totalDocs}`);
    console.log(`Total creados: ${totalCreated}`);
    console.log(`Total errores: ${totalErrors}`);
    console.log('='.repeat(60));

    if (totalErrors === 0) {
      console.log('\n✅ Migración completada exitosamente!');
      process.exit(0);
    } else {
      console.log('\n⚠️  Migración completada con errores');
      process.exit(1);
    }
  } catch (error: any) {
    console.error('\n❌ Error fatal en la migración:', error);
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

main();

