/**
 * Script de migración de base de datos
 * Migra datos de 'test' a 'barbershop_production'
 * 
 * USO:
 * node backend/scripts/migrate-database.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Cargar variables de entorno
dotenv.config({ path: join(__dirname, '../.env') });

// Colores para consola
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  blue: '\x1b[34m'
};

const log = {
  info: (msg) => console.log(`${colors.cyan}ℹ ${msg}${colors.reset}`),
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  step: (msg) => console.log(`${colors.blue}🔹 ${msg}${colors.reset}`)
};

// Nombres de colecciones a migrar
const COLLECTIONS_TO_MIGRATE = [
  'users',
  'barbers',
  'services',
  'appointments',
  'availabledates',
  'sales',
  'inventory',
  'expenses',
  'paymentmethods',
  'inventorysnapshots'
];

/**
 * Obtener la URI base sin el nombre de la base de datos
 */
function getBaseUri(mongoUri) {
  const uri = new URL(mongoUri);
  // Eliminar el pathname (que contiene el nombre de la DB)
  return `${uri.protocol}//${uri.username ? uri.username + ':' + uri.password + '@' : ''}${uri.host}`;
}

/**
 * Conectar a una base de datos específica
 */
async function connectToDatabase(dbName) {
  const baseUri = getBaseUri(process.env.MONGODB_URI);
  const fullUri = `${baseUri}/${dbName}`;
  
  const connection = await mongoose.createConnection(fullUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  }).asPromise();
  
  return connection;
}

/**
 * Obtener todas las colecciones de una DB
 */
async function getCollections(connection) {
  const collections = await connection.db.listCollections().toArray();
  return collections.map(col => col.name).filter(name => !name.startsWith('system.'));
}

/**
 * Exportar datos de una colección
 */
async function exportCollection(connection, collectionName) {
  try {
    const collection = connection.collection(collectionName);
    const documents = await collection.find({}).toArray();
    log.info(`  📦 ${collectionName}: ${documents.length} documentos`);
    return documents;
  } catch (error) {
    log.error(`  Error exportando ${collectionName}: ${error.message}`);
    return [];
  }
}

/**
 * Importar datos a una colección
 */
async function importCollection(connection, collectionName, documents) {
  if (!documents || documents.length === 0) {
    log.warning(`  ⏭️  ${collectionName}: Sin datos para importar`);
    return 0;
  }

  try {
    const collection = connection.collection(collectionName);
    
    // Verificar si ya existen datos
    const existingCount = await collection.countDocuments();
    if (existingCount > 0) {
      log.warning(`  ⚠️  ${collectionName}: Ya tiene ${existingCount} documentos. Saltando...`);
      return 0;
    }
    
    const result = await collection.insertMany(documents, { ordered: false });
    log.success(`  ✅ ${collectionName}: ${result.insertedCount} documentos importados`);
    return result.insertedCount;
  } catch (error) {
    if (error.code === 11000) {
      log.warning(`  ⚠️  ${collectionName}: Algunos documentos ya existen (duplicados ignorados)`);
      return 0;
    }
    log.error(`  ❌ Error importando ${collectionName}: ${error.message}`);
    throw error;
  }
}

/**
 * Comparar conteos entre bases de datos
 */
async function compareCollectionCounts(sourceConn, targetConn, collectionName) {
  const sourceCount = await sourceConn.collection(collectionName).countDocuments();
  const targetCount = await targetConn.collection(collectionName).countDocuments();
  
  const match = sourceCount === targetCount;
  const status = match ? '✅' : '⚠️';
  
  log.info(`  ${status} ${collectionName}: Origen=${sourceCount}, Destino=${targetCount}`);
  return { collectionName, sourceCount, targetCount, match };
}

/**
 * Script principal de migración
 */
async function migrate() {
  let sourceConnection = null;
  let targetConnection = null;
  
  try {
    console.log('\n' + '='.repeat(60));
    log.info('🚀 MIGRACIÓN DE BASE DE DATOS');
    log.info('Origen: test → Destino: barbershop_production');
    console.log('='.repeat(60) + '\n');

    // PASO 1: Conectar a base de datos origen (test)
    log.step('Paso 1: Conectando a base de datos origen (test)...');
    sourceConnection = await connectToDatabase('test');
    log.success('Conexión establecida a "test"');

    // PASO 2: Obtener colecciones disponibles
    log.step('\nPaso 2: Obteniendo colecciones disponibles...');
    const availableCollections = await getCollections(sourceConnection);
    log.info(`Colecciones encontradas: ${availableCollections.join(', ')}`);

    // Filtrar solo las colecciones que queremos migrar
    const collectionsToMigrate = availableCollections.filter(col => 
      COLLECTIONS_TO_MIGRATE.includes(col)
    );
    
    if (collectionsToMigrate.length === 0) {
      log.warning('No se encontraron colecciones para migrar');
      return;
    }

    log.success(`Se migrarán ${collectionsToMigrate.length} colecciones`);

    // PASO 3: Exportar datos
    log.step('\nPaso 3: Exportando datos de "test"...');
    const exportedData = {};
    
    for (const collectionName of collectionsToMigrate) {
      const documents = await exportCollection(sourceConnection, collectionName);
      exportedData[collectionName] = documents;
    }

    const totalDocuments = Object.values(exportedData).reduce((sum, docs) => sum + docs.length, 0);
    log.success(`Total de documentos exportados: ${totalDocuments}`);

    // PASO 4: Conectar a base de datos destino
    log.step('\nPaso 4: Conectando a base de datos destino (barbershop_production)...');
    targetConnection = await connectToDatabase('barbershop_production');
    log.success('Conexión establecida a "barbershop_production"');

    // PASO 5: Importar datos
    log.step('\nPaso 5: Importando datos a "barbershop_production"...');
    let totalImported = 0;

    for (const collectionName of collectionsToMigrate) {
      const documents = exportedData[collectionName];
      const imported = await importCollection(targetConnection, collectionName, documents);
      totalImported += imported;
    }

    log.success(`Total de documentos importados: ${totalImported}`);

    // PASO 6: Verificar integridad
    log.step('\nPaso 6: Verificando integridad de datos...');
    const comparisons = [];
    
    for (const collectionName of collectionsToMigrate) {
      const comparison = await compareCollectionCounts(sourceConnection, targetConnection, collectionName);
      comparisons.push(comparison);
    }

    const allMatch = comparisons.every(c => c.match);
    
    console.log('\n' + '='.repeat(60));
    if (allMatch) {
      log.success('🎉 MIGRACIÓN COMPLETADA EXITOSAMENTE');
      log.success('Todos los documentos fueron migrados correctamente');
    } else {
      log.warning('⚠️  MIGRACIÓN COMPLETADA CON ADVERTENCIAS');
      log.warning('Algunos conteos no coinciden. Revisa los detalles arriba.');
    }
    console.log('='.repeat(60) + '\n');

    // PASO 7: Resumen
    log.step('Resumen de la migración:');
    console.log(`  📊 Colecciones procesadas: ${collectionsToMigrate.length}`);
    console.log(`  📦 Documentos exportados: ${totalDocuments}`);
    console.log(`  ✅ Documentos importados: ${totalImported}`);
    console.log(`  🔍 Colecciones verificadas: ${comparisons.length}`);
    console.log(`  ✅ Verificación exitosa: ${allMatch ? 'Sí' : 'No'}\n`);

    log.info('💡 Siguiente paso:');
    log.info('   Actualiza tu MONGODB_URI en Render para usar: barbershop_production');
    log.info('   Variable de entorno: MONGODB_URI=mongodb+srv://...../barbershop_production');

  } catch (error) {
    log.error(`\n❌ Error durante la migración: ${error.message}`);
    console.error(error);
    process.exit(1);
  } finally {
    // Cerrar conexiones
    if (sourceConnection) {
      await sourceConnection.close();
      log.info('Conexión cerrada: test');
    }
    if (targetConnection) {
      await targetConnection.close();
      log.info('Conexión cerrada: barbershop_production');
    }
  }
}

// Ejecutar migración
migrate()
  .then(() => {
    log.success('\n✅ Script de migración finalizado');
    process.exit(0);
  })
  .catch((error) => {
    log.error(`\n❌ Error fatal: ${error.message}`);
    console.error(error);
    process.exit(1);
  });
