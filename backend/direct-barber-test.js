// Test directo de la respuesta del backend para barberos
import dotenv from 'dotenv';
import mongoose from 'mongoose';

// Cargar variables de entorno
dotenv.config({ path: '.env' });

async function testBarberResponse() {
  console.log('🔗 Conectando a MongoDB...');
  console.log('URI:', process.env.MONGODB_URI ? 'Definida' : 'NO definida');
  
  if (!process.env.MONGODB_URI) {
    console.error('❌ MONGODB_URI no está definida en .env');
    return;
  }
  
  await mongoose.connect(process.env.MONGODB_URI);
  
  // Importar modelos después de la conexión
  const { default: Barber } = await import('./src/models/Barber.js');
  const { default: User } = await import('./src/models/User.js');
  
  try {
    console.log('\n=== TEST DIRECTO DE BARBEROS ===');
    
    // 1. Verificar usuarios barberos
    const userBarbers = await User.find({ 
      role: 'barber', 
      isActive: true 
    }).lean();
    console.log(`📊 Usuarios barberos activos: ${userBarbers.length}`);
    userBarbers.forEach(user => {
      console.log(`   - ${user.name} (${user._id})`);
    });
    
    // 2. Verificar perfiles de barbero
    const barberProfiles = await Barber.find({ 
      isActive: true 
    }).populate('user', 'name email').lean();
    console.log(`\n📊 Perfiles de barbero activos: ${barberProfiles.length}`);
    barberProfiles.forEach(barber => {
      console.log(`   - ${barber.user?.name} (${barber._id}) - isMainBarber: ${barber.isMainBarber}`);
    });
    
    // 3. Filtrar solo barberos principales
    const mainBarbers = barberProfiles.filter(b => b.isMainBarber === true);
    console.log(`\n✅ Barberos PRINCIPALES: ${mainBarbers.length}`);
    mainBarbers.forEach(barber => {
      console.log(`   - ${barber.user?.name} (${barber._id}) - isMainBarber: ${barber.isMainBarber}`);
    });
    
    // 4. Test de la consulta optimizada del backend
    console.log(`\n🚀 TEST DE CONSULTA OPTIMIZADA:`);
    const optimizedQuery = await Barber.find({ isActive: true })
      .populate('user', 'name email role isActive')
      .sort({ isMainBarber: -1, createdAt: -1 })
      .lean();
    
    console.log(`📋 Resultado completo (${optimizedQuery.length}):`);
    optimizedQuery.forEach((barber, index) => {
      console.log(`   ${index + 1}. ${barber.user?.name} - isMainBarber: ${barber.isMainBarber}`);
    });
    
    // 5. Test del filtro frontend
    const frontendFiltered = optimizedQuery.filter(b => b.isMainBarber === true);
    console.log(`\n🔍 FILTRO FRONTEND (isMainBarber === true): ${frontendFiltered.length}`);
    frontendFiltered.forEach(barber => {
      console.log(`   - ${barber.user?.name} - isMainBarber: ${barber.isMainBarber}`);
    });
    
    // 6. Fallback logic
    const finalList = frontendFiltered.length > 0 ? frontendFiltered : optimizedQuery.slice(0, 3);
    console.log(`\n🎯 LISTA FINAL (${finalList.length}):`);
    finalList.forEach(barber => {
      console.log(`   - ${barber.user?.name} - isMainBarber: ${barber.isMainBarber}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Desconectado de MongoDB');
  }
}

testBarberResponse();