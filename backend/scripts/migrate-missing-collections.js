import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Cargar variables de entorno desde backend/.env
dotenv.config({ path: join(__dirname, '../.env') });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ Error: MONGODB_URI no está definida en .env');
  process.exit(1);
}

// Colecciones específicas a migrar
const COLLECTIONS_TO_MIGRATE = [
  'users',
  'socios',
  'reviews',
  'inventorylogs',
  'inventories'
];

async function migrateSpecificCollections() {
  let sourceConnection;
  let targetConnection;

  try {
    console.log('🚀 Iniciando migración de colecciones específicas...\n');

    // Conectar a la base de datos SOURCE (test)
    const sourceUri = MONGODB_URI.replace('/barbershop_production', '/test');
    console.log('📡 Conectando a SOURCE DB: test');
    sourceConnection = await mongoose.createConnection(sourceUri).asPromise();
    console.log('✅ Conectado a SOURCE DB\n');

    // Conectar a la base de datos TARGET (barbershop_production)
    console.log('📡 Conectando a TARGET DB: barbershop_production');
    targetConnection = await mongoose.createConnection(MONGODB_URI).asPromise();
    console.log('✅ Conectado a TARGET DB\n');

    const migrationStats = {
      total: 0,
      success: 0,
      skipped: 0,
      errors: 0
    };

    // Migrar cada colección
    for (const collectionName of COLLECTIONS_TO_MIGRATE) {
      try {
        console.log(`\n📦 Procesando colección: ${collectionName}`);
        console.log('─'.repeat(60));

        // Obtener colección de source
        const sourceCollection = sourceConnection.collection(collectionName);
        const sourceCount = await sourceCollection.countDocuments();

        console.log(`   📊 Documentos en SOURCE: ${sourceCount}`);

        if (sourceCount === 0) {
          console.log(`   ⚠️  Colección vacía en SOURCE, saltando...`);
          migrationStats.skipped++;
          continue;
        }

        // Obtener colección de target
        const targetCollection = targetConnection.collection(collectionName);
        const targetCount = await targetCollection.countDocuments();

        console.log(`   📊 Documentos en TARGET (antes): ${targetCount}`);

        // Obtener todos los documentos de source
        const documents = await sourceCollection.find({}).toArray();

        // Si target ya tiene datos, preguntar estrategia
        if (targetCount > 0) {
          console.log(`   ⚠️  TARGET ya tiene ${targetCount} documentos`);
          console.log(`   🔄 Eliminando documentos existentes en TARGET...`);
          await targetCollection.deleteMany({});
          console.log(`   ✅ TARGET limpiado`);
        }

        // Insertar documentos en target
        if (documents.length > 0) {
          console.log(`   🔄 Insertando ${documents.length} documentos...`);
          await targetCollection.insertMany(documents, { ordered: false });
          console.log(`   ✅ Insertados ${documents.length} documentos`);
        }

        // Verificar resultado
        const newTargetCount = await targetCollection.countDocuments();
        console.log(`   📊 Documentos en TARGET (después): ${newTargetCount}`);

        if (newTargetCount === sourceCount) {
          console.log(`   ✅ Migración exitosa para ${collectionName}`);
          migrationStats.success++;
        } else {
          console.log(`   ⚠️  Advertencia: Conteo no coincide (${newTargetCount} vs ${sourceCount})`);
          migrationStats.errors++;
        }

        migrationStats.total++;

      } catch (error) {
        console.error(`   ❌ Error migrando ${collectionName}:`, error.message);
        migrationStats.errors++;
        migrationStats.total++;
      }
    }

    // Resumen final
    console.log('\n' + '═'.repeat(60));
    console.log('📊 RESUMEN DE MIGRACIÓN');
    console.log('═'.repeat(60));
    console.log(`Total de colecciones procesadas: ${migrationStats.total}`);
    console.log(`✅ Exitosas: ${migrationStats.success}`);
    console.log(`⚠️  Saltadas: ${migrationStats.skipped}`);
    console.log(`❌ Con errores: ${migrationStats.errors}`);
    console.log('═'.repeat(60));

    if (migrationStats.errors === 0) {
      console.log('\n🎉 ¡Migración completada exitosamente!');
    } else {
      console.log('\n⚠️  Migración completada con algunos errores. Revisa los logs arriba.');
    }

  } catch (error) {
    console.error('\n❌ Error general en la migración:', error);
    process.exit(1);
  } finally {
    // Cerrar conexiones
    if (sourceConnection) {
      await sourceConnection.close();
      console.log('\n🔌 Conexión SOURCE cerrada');
    }
    if (targetConnection) {
      await targetConnection.close();
      console.log('🔌 Conexión TARGET cerrada');
    }
    process.exit(0);
  }
}

// Ejecutar migración
console.log('╔═══════════════════════════════════════════════════════════╗');
console.log('║   MIGRACIÓN DE COLECCIONES ESPECÍFICAS                    ║');
console.log('║   test → barbershop_production                            ║');
console.log('╚═══════════════════════════════════════════════════════════╝\n');

migrateSpecificCollections();
