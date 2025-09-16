import mongoose from 'mongoose';
import { Barber } from './src/models/index.js';

async function testMainBarberUpdate() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://admin:g3OxphcgxzXt7vVD@cluster0.z38wl.mongodb.net/barbershop?retryWrites=true&w=majority');
    
    // Obtener el primer barbero
    const barber = await Barber.findOne().populate('user');
    if (!barber) {
      console.log('No hay barberos en la BD');
      return;
    }

    console.log(`\n=== ANTES ===`);
    console.log(`Barbero: ${barber.user?.name}`);
    console.log(`isMainBarber: ${barber.isMainBarber}`);

    // Cambiar el estado
    barber.isMainBarber = !barber.isMainBarber;
    await barber.save();

    console.log(`\n=== DESPUÉS ===`);
    console.log(`Barbero: ${barber.user?.name}`);
    console.log(`isMainBarber: ${barber.isMainBarber}`);

    // Verificar conteo
    const mainCount = await Barber.countDocuments({ isMainBarber: true });
    console.log(`\nTotal barberos principales: ${mainCount}`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
}

testMainBarberUpdate();