import mongoose from 'mongoose';
import User from '../models/User.js';
import Service from '../models/Service.js';
import Barber from '../models/Barber.js';
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
  magenta: '\x1b[35m'
};

const log = (message, color = colors.reset) => {
  console.log(`${color}${message}${colors.reset}`);
};

const logSuccess = (message) => log(`✅ ${message}`, colors.green);
const logError = (message) => log(`❌ ${message}`, colors.red);
const logWarning = (message) => log(`⚠️  ${message}`, colors.yellow);
const logInfo = (message) => log(`ℹ️  ${message}`, colors.blue);
const logStep = (message) => log(`🔄 ${message}`, colors.cyan);

// Función para obtener la contraseña predeterminada según el email
function getPasswordForUser(email) {
  const passwordMap = {
    'admin@barber.com': 'admin123',
    'carlos@thebrothersbarbershop.com': 'barber123',
    'miguel@thebrothersbarbershop.com': 'barber123'
  };
  return passwordMap[email] || 'password123';
}

// Función para verificar conexión a la base de datos
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

// Función para crear o actualizar usuario con validaciones
async function createOrUpdateUser(userData) {
  try {
    logStep(`Procesando usuario: ${userData.email}`);
    
    const existingUser = await User.findOne({ email: userData.email });
    
    if (existingUser) {
      logInfo(`Usuario ${userData.email} ya existe, actualizando datos y contraseña...`);
      
      // Actualizar los datos básicos
      existingUser.name = userData.name;
      existingUser.role = userData.role;
      existingUser.phone = userData.phone || existingUser.phone;
      existingUser.isActive = true;
      
      // Actualizar la contraseña si se proporciona
      if (userData.password) {
        existingUser.password = userData.password;
        logInfo(`Contraseña actualizada para ${userData.email}`);
      }
      
      const updatedUser = await existingUser.save();
      logSuccess(`Usuario ${userData.email} actualizado exitosamente con nueva contraseña`);
      return updatedUser;
    } else {
      const newUser = new User(userData);
      await newUser.save();
      logSuccess(`Usuario ${userData.email} creado exitosamente`);
      return newUser;
    }
  } catch (error) {
    logError(`Error procesando usuario ${userData.email}: ${error.message}`);
    throw error;
  }
}

// Función para crear o actualizar barbero
async function createOrUpdateBarber(userId, barberData) {
  try {
    logStep(`Procesando perfil de barbero para usuario ID: ${userId}`);
    
    const existingBarber = await Barber.findOne({ user: userId });
    
    if (existingBarber) {
      logInfo(`Perfil de barbero ya existe, actualizando...`);
      const updatedBarber = await Barber.findOneAndUpdate(
        { user: userId },
        { $set: { ...barberData, isActive: true } },
        { new: true, runValidators: true }
      );
      logSuccess(`Perfil de barbero actualizado exitosamente`);
      return updatedBarber;
    } else {
      const newBarber = new Barber({ ...barberData, user: userId });
      await newBarber.save();
      logSuccess(`Perfil de barbero creado exitosamente`);
      return newBarber;
    }
  } catch (error) {
    logError(`Error procesando barbero: ${error.message}`);
    throw error;
  }
}

// Función para limpiar servicios existentes
async function cleanServices() {
  try {
    logStep('Limpiando servicios existentes...');
    const result = await Service.deleteMany({});
    logInfo(`${result.deletedCount} servicios eliminados`);
  } catch (error) {
    logError(`Error limpiando servicios: ${error.message}`);
    throw error;
  }
}

// Función para crear servicios
async function createServices() {
  try {
    logStep('Creando servicios básicos...');
    
    const services = [
      {
        name: 'Corte de Cabello Clásico',
        description: 'Corte tradicional con tijeras y máquina',
        price: 15000,
        duration: 30,
        category: 'corte',
        isActive: true
      },
      {
        name: 'Corte y Barba',
        description: 'Corte de cabello completo con arreglo de barba',
        price: 25000,
        duration: 45,
        category: 'combo',
        isActive: true
      },
      {
        name: 'Afeitado Clásico',
        description: 'Afeitado tradicional con navaja',
        price: 12000,
        duration: 25,
        category: 'afeitado',
        isActive: true
      },
      {
        name: 'Lavado y Peinado',
        description: 'Lavado profundo y peinado profesional',
        price: 8000,
        duration: 20,
        category: 'lavado',
        isActive: true
      }
    ];

    const createdServices = await Service.create(services);
    logSuccess(`${createdServices.length} servicios creados exitosamente`);
    return createdServices;
  } catch (error) {
    logError(`Error creando servicios: ${error.message}`);
    throw error;
  }
}

// Función para verificar que las credenciales funcionan
async function testCredentials() {
  try {
    logStep('Probando autenticación de usuarios...');
    
    const testUsers = [
      { email: 'admin@barber.com', password: 'admin123', expectedRole: 'admin' },
      { email: 'carlos@thebrothersbarbershop.com', password: 'barber123', expectedRole: 'barber' },
      { email: 'miguel@thebrothersbarbershop.com', password: 'barber123', expectedRole: 'barber' }
    ];

    let successCount = 0;
    let totalTests = testUsers.length;

    for (const testUser of testUsers) {
      try {
        const user = await User.findOne({ email: testUser.email }).select('+password');
        
        if (!user) {
          logError(`✗ ${testUser.email} - Usuario no encontrado`);
          continue;
        }

        if (!user.comparePassword) {
          logError(`✗ ${testUser.email} - Método comparePassword no disponible`);
          continue;
        }

        const isPasswordValid = await user.comparePassword(testUser.password);
        
        if (isPasswordValid) {
          if (user.role === testUser.expectedRole) {
            logSuccess(`✓ ${testUser.email} - Autenticación exitosa (${user.role})`);
            successCount++;
          } else {
            logWarning(`⚠ ${testUser.email} - Rol incorrecto: esperado ${testUser.expectedRole}, obtenido ${user.role}`);
          }
        } else {
          logError(`✗ ${testUser.email} - Contraseña incorrecta`);
          logInfo(`  Intentando con contraseña: ${testUser.password}`);
        }
      } catch (error) {
        logError(`✗ ${testUser.email} - Error: ${error.message}`);
      }
    }

    log('\n=== RESULTADO DE PRUEBAS DE AUTENTICACIÓN ===', colors.cyan);
    logInfo(`Pruebas exitosas: ${successCount}/${totalTests}`);
    
    if (successCount === totalTests) {
      logSuccess('🎉 Todas las credenciales funcionan correctamente');
    } else {
      logWarning(`⚠️ ${totalTests - successCount} credenciales requieren atención`);
    }
    
    return successCount === totalTests;
  } catch (error) {
    logError(`Error en prueba de credenciales: ${error.message}`);
    return false;
  }
}

// Función para verificar el resultado final
async function verifySeeding() {
  try {
    logStep('Verificando resultado del seeding...');
    
    const userCount = await User.countDocuments({});
    const adminCount = await User.countDocuments({ role: 'admin' });
    const barberUserCount = await User.countDocuments({ role: 'barber' });
    const barberProfileCount = await Barber.countDocuments({ isActive: true });
    const serviceCount = await Service.countDocuments({ isActive: true });
    
    log('\n=== RESUMEN DEL SEEDING ===', colors.cyan);
    logInfo(`Total de usuarios: ${userCount}`);
    logInfo(`Administradores: ${adminCount}`);
    logInfo(`Usuarios barberos: ${barberUserCount}`);
    logInfo(`Perfiles de barbero activos: ${barberProfileCount}`);
    logInfo(`Servicios activos: ${serviceCount}`);
    
    // Verificaciones de integridad
    if (adminCount === 0) {
      logWarning('No hay usuarios administradores');
    }
    
    if (barberUserCount === 0) {
      logWarning('No hay usuarios con rol de barbero');
    }
    
    if (barberProfileCount === 0) {
      logWarning('No hay perfiles de barbero activos');
    }
    
    if (barberUserCount !== barberProfileCount) {
      logWarning(`Desbalance: ${barberUserCount} usuarios barberos vs ${barberProfileCount} perfiles de barbero`);
    }
    
    if (serviceCount < 3) {
      logWarning('Pocos servicios disponibles');
    }
    
    // Verificar barberos con población
    const barbersWithUsers = await Barber.find({ isActive: true })
      .populate('user', 'name email role isActive')
      .exec();
      
    log('\n=== BARBEROS DISPONIBLES ===', colors.cyan);
    barbersWithUsers.forEach((barber, index) => {
      if (barber.user) {
        logInfo(`${index + 1}. ${barber.user.name} (${barber.user.email}) - ${barber.specialty}`);
      } else {
        logWarning(`Barbero sin usuario asociado: ${barber._id}`);
      }
    });

    // Mostrar credenciales de acceso
    log('\n=== CREDENCIALES DE ACCESO ===', colors.cyan);
    const allUsers = await User.find({}, 'name email role isActive').sort({ role: 1, name: 1 });
    
    log('📋 USUARIOS PARA INGRESAR AL SISTEMA:', colors.yellow);
    log('─'.repeat(60), colors.gray);
    
    allUsers.forEach((user) => {
      const roleEmoji = user.role === 'admin' ? '👑' : user.role === 'barber' ? '✂️' : '👤';
      const roleText = user.role === 'admin' ? 'ADMINISTRADOR' : user.role === 'barber' ? 'BARBERO' : 'USUARIO';
      
      log(`\n${roleEmoji} ${roleText}:`, colors.yellow);
      log(`   📧 Email: ${user.email}`, colors.white);
      log(`   👤 Nombre: ${user.name}`, colors.white);
      log(`   🔑 Contraseña: ${getPasswordForUser(user.email)}`, colors.green);
      log(`   📱 Estado: ${user.isActive ? 'Activo' : 'Inactivo'}`, user.isActive ? colors.green : colors.red);
    });

    log('\n─'.repeat(60), colors.gray);
    log('\n💡 INSTRUCCIONES DE USO:', colors.cyan);
    log('1. Usar estas credenciales para iniciar sesión en el sistema', colors.white);
    log('2. Los barberos pueden gestionar sus perfiles y citas', colors.white);
    log('3. Los administradores tienen acceso completo al sistema', colors.white);
    log('4. Cambiar las contraseñas después del primer acceso', colors.yellow);
    
    log('\n🌐 INFORMACIÓN DE CONEXIÓN:', colors.cyan);
    log(`📡 Base de datos: ${config.database.uri.includes('localhost') ? 'Local (MongoDB)' : 'Remota'}`, colors.white);
    log(`🔧 Entorno: ${process.env.NODE_ENV || 'development'}`, colors.white);
    log(`🚀 Para iniciar el servidor: npm run dev`, colors.white);
    log(`📖 Documentación API: http://localhost:5000/api/docs`, colors.white);
    
    return {
      users: userCount,
      admins: adminCount,
      barberUsers: barberUserCount,
      barberProfiles: barberProfileCount,
      services: serviceCount,
      valid: barberUserCount === barberProfileCount && barberProfileCount > 0
    };
  } catch (error) {
    logError(`Error verificando seeding: ${error.message}`);
    throw error;
  }
}

// Función principal de seeding
async function runSeed() {
  const startTime = Date.now();
  
  try {
    log('🚀 INICIANDO PROCESO DE SEEDING', colors.cyan);
    log('================================', colors.cyan);
    
    // 1. Conectar a la base de datos
    await checkDatabaseConnection();
    
    // 2. Limpiar servicios existentes
    await cleanServices();
    
    // 3. Crear o actualizar usuarios
    logStep('Procesando usuarios...');
    
    const adminUser = await createOrUpdateUser({
      name: 'Administrador',
      email: 'admin@barber.com',
      password: 'admin123',
      role: 'admin'
    });

    const carlosUser = await createOrUpdateUser({
      name: 'Carlos Mendez',
      email: 'carlos@thebrothersbarbershop.com',
      password: 'barber123',
      role: 'barber',
      phone: '+506 7777-8888'
    });

    const miguelUser = await createOrUpdateUser({
      name: 'Miguel Rodriguez',
      email: 'miguel@thebrothersbarbershop.com',
      password: 'barber123',
      role: 'barber',
      phone: '+506 8888-9999'
    });
    
    // 4. Crear o actualizar perfiles de barberos
    logStep('Procesando perfiles de barberos...');
    
    await createOrUpdateBarber(carlosUser._id, {
      specialty: 'Cortes clásicos y afeitado con navaja',
      bio: 'Barbero profesional con más de 5 años de experiencia',
      schedule: {
        monday: { start: '09:00', end: '18:00', isActive: true },
        tuesday: { start: '09:00', end: '18:00', isActive: true },
        wednesday: { start: '09:00', end: '18:00', isActive: true },
        thursday: { start: '09:00', end: '18:00', isActive: true },
        friday: { start: '09:00', end: '18:00', isActive: true },
        saturday: { start: '09:00', end: '15:00', isActive: true },
        sunday: { start: '10:00', end: '14:00', isActive: false }
      }
    });

    await createOrUpdateBarber(miguelUser._id, {
      specialty: 'Cortes modernos y diseño de barba',
      bio: 'Especialista en estilos modernos y cortes de moda',
      schedule: {
        monday: { start: '10:00', end: '19:00', isActive: true },
        tuesday: { start: '10:00', end: '19:00', isActive: true },
        wednesday: { start: '10:00', end: '19:00', isActive: true },
        thursday: { start: '10:00', end: '19:00', isActive: true },
        friday: { start: '10:00', end: '19:00', isActive: true },
        saturday: { start: '09:00', end: '16:00', isActive: true },
        sunday: { start: '10:00', end: '14:00', isActive: false }
      }
    });
    
    // 5. Crear servicios
    await createServices();
    
    // 6. Verificar resultado
    const summary = await verifySeeding();
    
    // 7. Probar credenciales
    await testCredentials();
    
    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);
    
    log('\n================================', colors.green);
    logSuccess(`SEEDING COMPLETADO EN ${duration} SEGUNDOS`);
    
    if (summary.valid) {
      logSuccess('✨ Base de datos lista para usar');
    } else {
      logWarning('⚠️  Hay algunos problemas que requieren atención');
    }
    
  } catch (error) {
    logError(`SEEDING FALLÓ: ${error.message}`);
    logError(error.stack);
    process.exit(1);
  } finally {
    try {
      await mongoose.connection.close();
      logInfo('Conexión a la base de datos cerrada');
    } catch (error) {
      logError(`Error cerrando conexión: ${error.message}`);
    }
  }
}

// Ejecutar el seeding
runSeed();
