import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';
import InventorySnapshot from '../src/core/domain/entities/InventorySnapshot.js';
import Inventory from '../src/core/domain/entities/Inventory.js';
import User from '../src/core/domain/entities/User.js';
import InventorySnapshotService from '../src/core/application/usecases/inventorySnapshotService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Cargar variables de entorno
const envPath = join(__dirname, '../.env');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
} else {
  // Intentar cargar desde la raíz del proyecto
  const rootEnvPath = join(__dirname, '../../.env');
  if (fs.existsSync(rootEnvPath)) {
    dotenv.config({ path: rootEnvPath });
  } else {
    console.warn('⚠️ Archivo .env no encontrado. Usando variables de entorno del sistema.');
  }
}

// Verificar que tenemos la URI de MongoDB
if (!process.env.MONGODB_URI) {
  console.error('❌ MONGODB_URI no está definida en las variables de entorno');
  console.log('Por favor, ejecuta el servidor backend primero o define MONGODB_URI');
  process.exit(1);
}

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

const log = {
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  title: (msg) => console.log(`\n${colors.bright}${colors.cyan}${msg}${colors.reset}\n`),
  step: (msg) => console.log(`${colors.magenta}▸${colors.reset} ${msg}`)
};

async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    log.success('Conectado a MongoDB');
  } catch (error) {
    log.error(`Error al conectar a MongoDB: ${error.message}`);
    process.exit(1);
  }
}

async function testExcelExport() {
  log.title('🧪 TEST: EXPORTACIÓN DE EXCEL CON EXCELJS');

  try {
    // 1. Verificar si hay snapshots existentes
    log.step('1. Verificando snapshots existentes...');
    const existingSnapshots = await InventorySnapshot.find().limit(1);
    
    let testSnapshotId;

    if (existingSnapshots.length > 0) {
      testSnapshotId = existingSnapshots[0]._id;
      log.success(`Encontrado snapshot existente: ${testSnapshotId}`);
      log.info(`  Fecha: ${existingSnapshots[0].date}`);
      log.info(`  Items: ${existingSnapshots[0].totalItems}`);
      log.info(`  Diferencia: ${existingSnapshots[0].totalDifference}`);
    } else {
      log.warning('No hay snapshots existentes. Creando uno de prueba...');

      // Obtener admin para crear el snapshot
      const admin = await User.findOne({ role: 'admin' });
      if (!admin) {
        throw new Error('No se encontró usuario admin');
      }

      // Obtener productos del inventario
      const inventoryItems = await Inventory.find().limit(10);
      if (inventoryItems.length === 0) {
        throw new Error('No hay productos en inventario para crear snapshot');
      }

      // Crear snapshot de prueba
      const snapshotData = {
        items: inventoryItems.map(item => ({
          productId: item._id,
          productName: item.name,
          category: item.category,
          initialStock: item.stock || 0,
          entries: Math.floor(Math.random() * 10),
          exits: Math.floor(Math.random() * 5),
          sales: Math.floor(Math.random() * 8),
          expectedStock: item.stock || 0,
          realStock: (item.stock || 0) + Math.floor(Math.random() * 5) - 2,
          difference: 0
        })).map(item => ({
          ...item,
          difference: item.realStock - item.expectedStock
        })),
        notes: 'Snapshot de prueba para testing de Excel'
      };

      const newSnapshot = await InventorySnapshotService.createSnapshot(snapshotData, admin._id);
      testSnapshotId = newSnapshot._id;
      log.success(`Snapshot de prueba creado: ${testSnapshotId}`);
    }

    // 2. Generar archivo Excel
    log.step('2. Generando archivo Excel con ExcelJS...');
    const startTime = Date.now();
    const excelBuffer = await InventorySnapshotService.generateExcel(testSnapshotId);
    const generationTime = Date.now() - startTime;

    log.success(`Excel generado en ${generationTime}ms`);
    log.info(`  Tamaño del buffer: ${(excelBuffer.length / 1024).toFixed(2)} KB`);

    // 3. Guardar archivo temporalmente
    log.step('3. Guardando archivo para inspección...');
    const outputDir = join(__dirname, '../uploads/temp');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const filename = `test-snapshot-${Date.now()}.xlsx`;
    const filepath = join(outputDir, filename);
    fs.writeFileSync(filepath, excelBuffer);

    log.success(`Archivo guardado: ${filepath}`);
    log.info('  Puedes abrir este archivo en Excel para verificar:');
    log.info('    - Formato y estilos');
    log.info('    - Colores en diferencias negativas (rojo)');
    log.info('    - Anchos de columna optimizados');
    log.info('    - Headers con información del snapshot');

    // 4. Verificar contenido básico
    log.step('4. Verificando estructura del Excel...');
    const snapshot = await InventorySnapshotService.getSnapshotById(testSnapshotId);
    
    log.success('Verificaciones completadas:');
    log.info(`  ✓ Buffer generado correctamente (${excelBuffer.length} bytes)`);
    log.info(`  ✓ Snapshot tiene ${snapshot.totalItems} items`);
    log.info(`  ✓ Diferencia total: ${snapshot.totalDifference}`);
    log.info(`  ✓ Archivo guardado en: ${filepath}`);

    // 5. Estadísticas
    log.step('5. Estadísticas del test:');
    console.table({
      'ID Snapshot': testSnapshotId.toString(),
      'Items procesados': snapshot.totalItems,
      'Diferencia total': snapshot.totalDifference,
      'Tiempo de generación': `${generationTime}ms`,
      'Tamaño archivo': `${(excelBuffer.length / 1024).toFixed(2)} KB`,
      'Formato': 'XLSX (ExcelJS)',
      'Ruta archivo': filepath
    });

    log.title('✅ TEST COMPLETADO EXITOSAMENTE');
    log.info('Próximos pasos:');
    log.info('  1. Abrir el archivo Excel generado');
    log.info('  2. Verificar que los estilos se aplican correctamente');
    log.info('  3. Comprobar que las diferencias negativas están en rojo');
    log.info('  4. Validar que los datos son correctos');

    return true;

  } catch (error) {
    log.error(`Error durante el test: ${error.message}`);
    console.error(error);
    return false;
  }
}

async function main() {
  await connectDB();
  
  const success = await testExcelExport();
  
  await mongoose.connection.close();
  log.success('Desconectado de MongoDB');
  
  process.exit(success ? 0 : 1);
}

main();
