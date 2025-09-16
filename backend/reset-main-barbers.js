import mongoose from 'mongoose';
import { Barber } from './src/models/index.js';

async function resetMainBarbers() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://admin:g3OxphcgxzXt7vVD@cluster0.z38wl.mongodb.net/barbershop?retryWrites=true&w=majority');
    
    // Resetear todos los barberos a no principales
    await Barber.updateMany({}, { isMainBarber: false });
    
    console.log('✅ Todos los barberos han sido marcados como NO principales');
    console.log('Ahora puedes seleccionar hasta 3 desde el frontend');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
}

resetMainBarbers();