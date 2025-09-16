import mongoose from 'mongoose';
import { Barber } from './src/models/index.js';

async function testBackendResponse() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://admin:g3OxphcgxzXt7vVD@cluster0.z38wl.mongodb.net/barbershop?retryWrites=true&w=majority');
    
    console.log('=== SIMULANDO RESPUESTA DE /api/barbers ===\n');
    
    // Simular lo que hace el endpoint GET /barbers
    const barbers = await Barber.find().populate('user', 'name email role isActive profilePicture');
    
    console.log(`Total barberos en BD: ${barbers.length}\n`);
    
    barbers.forEach((barber, index) => {
      console.log(`${index + 1}. ${barber.user?.name || 'Sin nombre'}`);
      console.log(`   - _id: ${barber._id}`);
      console.log(`   - isMainBarber: ${barber.isMainBarber} (${typeof barber.isMainBarber})`);
      console.log(`   - isActive: ${barber.isActive}`);
      console.log(`   - user.role: ${barber.user?.role}`);
      console.log(`   - user.isActive: ${barber.user?.isActive}`);
      console.log('   ---');
    });

    // Simular filtrado del frontend
    const activeBarbers = barbers.filter(barber => {
      return barber.user && 
             barber.user.role === 'barber' && 
             (barber.user.isActive !== false) && 
             (barber.isActive !== false);
    });

    console.log(`\nBarberos activos después del filtro: ${activeBarbers.length}`);

    const mainBarbers = activeBarbers.filter(barber => barber.isMainBarber === true);
    console.log(`Barberos principales: ${mainBarbers.length}`);
    
    mainBarbers.forEach(barber => {
      console.log(`  ✅ ${barber.user?.name} (isMainBarber: ${barber.isMainBarber})`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
}

testBackendResponse();