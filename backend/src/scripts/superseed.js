import mongoose from 'mongoose';
import { config } from '../config/index.js';

// Colores para logs
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  gray: '\x1b[90m',
  magenta: '\x1b[35m',
  bold: '\x1b[1m'
};

const log = (message, color = colors.reset) => {
  console.log(`${color}${message}${colors.reset}`);
};

const logSuccess = (message) => log(`✅ ${message}`, colors.green);
const logError = (message) => log(`❌ ${message}`, colors.red);
const logWarning = (message) => log(`⚠️  ${message}`, colors.yellow);
const logInfo = (message) => log(`ℹ️  ${message}`, colors.blue);
const logStep = (message) => log(`🔄 ${message}`, colors.cyan);
const logTitle = (message) => log(`\n${colors.bold}${colors.cyan}${message}${colors.reset}`);

/**
 * Función para verificar conexión a la base de datos
 */
async function checkDatabaseConnection() {
  try {
    logStep('Verificando conexión a la base de datos...');
    await mongoose.connect(config.database.uri, config.database.options);
    
    if (mongoose.connection.readyState === 1) {
      logSuccess('Conexión a la base de datos establecida correctamente');
      return true;
    } else {
      throw new Error('Estado de conexión inesperado');
    }
  } catch (error) {
    logError(`Error conectando a la base de datos: ${error.message}`);
    throw error;
  }
}

/**
 * Función para ejecutar el seed principal
 */
async function runMainSeed() {
  try {
    logTitle('🌱 EJECUTANDO SEED PRINCIPAL (usuarios, barberos, servicios)');
    
    // Importar dinámicamente para evitar problemas de dependencias circulares
    const { execSync } = await import('child_process');
    
    execSync('node src/scripts/seed.js', { 
      stdio: 'inherit',
      env: { ...process.env }
    });
    
    logSuccess('Seed principal completado exitosamente');
  } catch (error) {
    logError(`Error en seed principal: ${error.message}`);
    throw error;
  }
}

/**
 * Función para ejecutar el seed de inventario
 */
async function runInventorySeed() {
  try {
    logTitle('📦 EJECUTANDO SEED DE INVENTARIO');
    
    // Importar dinámicamente para evitar problemas de dependencias circulares
    const { execSync } = await import('child_process');
    
    execSync('node src/scripts/seedInventoryProducts.js', { 
      stdio: 'inherit',
      env: { ...process.env }
    });
    
    logSuccess('Seed de inventario completado exitosamente');
  } catch (error) {
    logError(`Error en seed de inventario: ${error.message}`);
    throw error;
  }
}

/**
 * Función para verificar el resultado final
 */
async function verifyResults() {
  try {
    logTitle('🔍 VERIFICANDO RESULTADOS FINALES');
    
    // Importar modelos para verificación
    const { default: User } = await import('../models/User.js');
    const { default: Barber } = await import('../models/Barber.js');
    const { default: Service } = await import('../models/Service.js');
    const { default: Inventory } = await import('../models/Inventory.js');
    
    const userCount = await User.countDocuments({});
    const barberCount = await Barber.countDocuments({});
    const serviceCount = await Service.countDocuments({});
    const inventoryCount = await Inventory.countDocuments({});
    
    log('─'.repeat(60), colors.gray);
    logInfo(`👥 Usuarios creados: ${userCount}`);
    logInfo(`✂️  Barberos creados: ${barberCount}`);
    logInfo(`🔧 Servicios creados: ${serviceCount}`);
    logInfo(`📦 Productos de inventario: ${inventoryCount}`);
    
    const totalDocuments = userCount + barberCount + serviceCount + inventoryCount;
    logInfo(`📊 Total de documentos: ${totalDocuments}`);
    
    if (totalDocuments > 0) {
      logSuccess('🎉 Base de datos poblada exitosamente');
      
      // Mostrar credenciales
      logTitle('🔑 CREDENCIALES DE ACCESO');
      log('─'.repeat(50), colors.gray);
      log('👑 ADMINISTRADOR:', colors.yellow);
      log('   📧 Email: admin@barber.com', colors.white);
      log('   🔑 Contraseña: admin123', colors.green);
      log('', colors.white);
      log('✂️  BARBEROS:', colors.yellow);
      log('   📧 Email: carlos@thebrothersbarbershop.com', colors.white);
      log('   🔑 Contraseña: barber123', colors.green);
      log('   📧 Email: miguel@thebrothersbarbershop.com', colors.white);
      log('   🔑 Contraseña: barber123', colors.green);
      log('─'.repeat(50), colors.gray);
      
      logTitle('🚀 PRÓXIMOS PASOS');
      logInfo('1. Inicia el servidor: npm run dev');
      logInfo('2. Accede al sistema con las credenciales mostradas');
      logInfo('3. Revisa la documentación API: http://localhost:5000/api/docs');
      logInfo('4. ¡El sistema está listo para usar!');
      
    } else {
      logWarning('⚠️ No se crearon documentos. Revisa los logs anteriores.');
    }
    
    return totalDocuments > 0;
    
  } catch (error) {
    logError(`Error verificando resultados: ${error.message}`);
    return false;
  }
}

/**
 * Función principal del superseed
 */
async function runSuperSeed() {
  const startTime = Date.now();
  
  try {
    logTitle('🚀 SUPER SEED - POBLADO COMPLETO DE LA BASE DE DATOS');
    log('='.repeat(70), colors.cyan);
    
    // 1. Verificar conexión
    await checkDatabaseConnection();
    
    // 2. Ejecutar seed principal
    await runMainSeed();
    
    // 3. Ejecutar seed de inventario
    await runInventorySeed();
    
    // 4. Verificar resultados
    const success = await verifyResults();
    
    // 5. Mostrar resumen final
    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);
    
    log('\n' + '='.repeat(70), colors.cyan);
    if (success) {
      logSuccess(`🎉 SUPER SEED COMPLETADO EN ${duration} SEGUNDOS`);
      logSuccess('✨ ¡Sistema completamente listo para usar!');
    } else {
      logError(`❌ SUPER SEED FALLÓ DESPUÉS DE ${duration} SEGUNDOS`);
      logWarning('Revisa los logs anteriores para identificar problemas');
    }
    
  } catch (error) {
    logError(`SUPER SEED FALLÓ: ${error.message}`);
    logError(error.stack);
    process.exit(1);
  } finally {
    try {
      await mongoose.connection.close();
      logInfo('🔌 Conexión a la base de datos cerrada');
    } catch (error) {
      logError(`Error cerrando conexión: ${error.message}`);
    }
  }
}

// Ejecutar si se llama directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  runSuperSeed();
}

export default runSuperSeed;
