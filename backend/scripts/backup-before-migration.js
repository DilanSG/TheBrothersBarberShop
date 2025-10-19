/**
 * Script de backup de base de datos antes de migración
 * Crea un backup completo de la DB 'test' en formato JSON
 * 
 * USO:
 * node backend/scripts/backup-before-migration.js
 */

import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Cargar variables de entorno
dotenv.config({ path: join(__dirname, '../.env') });

const colors = {
  reset: '\x1b[0m',
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

/**
 * Obtener la URI base sin el nombre de la base de datos
 */
function getBaseUri(mongoUri) {
  const uri = new URL(mongoUri);
  return `${uri.protocol}//${uri.username ? uri.username + ':' + uri.password + '@' : ''}${uri.host}`;
}

/**
 * Crear directorio de backups si no existe
 */
function ensureBackupDirectory() {
  const backupDir = path.join(__dirname, '../backups/migration');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }
  return backupDir;
}

/**
 * Realizar backup de la base de datos
 */
async function createBackup() {
  let connection = null;

  try {
    console.log('\n' + '='.repeat(60));
    log.info('💾 BACKUP DE BASE DE DATOS');
    log.info('Base de datos: test');
    console.log('='.repeat(60) + '\n');

    // Conectar a la base de datos 'test'
    log.step('Paso 1: Conectando a base de datos "test"...');
    const baseUri = getBaseUri(process.env.MONGODB_URI);
    const fullUri = `${baseUri}/test`;
    
    connection = await mongoose.createConnection(fullUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }).asPromise();
    
    log.success('Conexión establecida');

    // Obtener todas las colecciones
    log.step('\nPaso 2: Obteniendo colecciones...');
    const collections = await connection.db.listCollections().toArray();
    const collectionNames = collections
      .map(col => col.name)
      .filter(name => !name.startsWith('system.'));
    
    log.info(`Colecciones encontradas: ${collectionNames.length}`);
    collectionNames.forEach(name => log.info(`  - ${name}`));

    // Exportar cada colección
    log.step('\nPaso 3: Exportando datos...');
    const backup = {
      timestamp: new Date().toISOString(),
      database: 'test',
      collections: {}
    };

    let totalDocuments = 0;

    for (const collectionName of collectionNames) {
      const collection = connection.collection(collectionName);
      const documents = await collection.find({}).toArray();
      backup.collections[collectionName] = documents;
      totalDocuments += documents.length;
      log.info(`  📦 ${collectionName}: ${documents.length} documentos`);
    }

    log.success(`Total de documentos exportados: ${totalDocuments}`);

    // Guardar backup en archivo JSON
    log.step('\nPaso 4: Guardando backup...');
    const backupDir = ensureBackupDirectory();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `backup-test-${timestamp}.json`;
    const filepath = path.join(backupDir, filename);

    fs.writeFileSync(filepath, JSON.stringify(backup, null, 2), 'utf-8');
    
    const fileSizeMB = (fs.statSync(filepath).size / (1024 * 1024)).toFixed(2);
    
    log.success(`Backup guardado exitosamente`);
    log.info(`  📁 Ruta: ${filepath}`);
    log.info(`  📊 Tamaño: ${fileSizeMB} MB`);
    log.info(`  📦 Colecciones: ${collectionNames.length}`);
    log.info(`  📄 Documentos: ${totalDocuments}`);

    console.log('\n' + '='.repeat(60));
    log.success('🎉 BACKUP COMPLETADO EXITOSAMENTE');
    console.log('='.repeat(60) + '\n');

    log.info('💡 Ahora puedes ejecutar la migración con seguridad:');
    log.info('   node backend/scripts/migrate-database.js\n');

  } catch (error) {
    log.error(`\n❌ Error durante el backup: ${error.message}`);
    console.error(error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.close();
      log.info('Conexión cerrada');
    }
  }
}

// Ejecutar backup
createBackup()
  .then(() => {
    log.success('\n✅ Script de backup finalizado');
    process.exit(0);
  })
  .catch((error) => {
    log.error(`\n❌ Error fatal: ${error.message}`);
    console.error(error);
    process.exit(1);
  });
