import mongoose from 'mongoose';
import { Barber } from './src/models/index.js';

async function checkBarbers() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://admin:g3OxphcgxzXt7vVD@cluster0.z38wl.mongodb.net/barbershop?retryWrites=true&w=majority');
    
    const barbers = await Barber.find().populate('user');
    console.log('=== BARBEROS EN BASE DE DATOS ===');
    console.log(`Total barberos: ${barbers.length}`);
    
    barbers.forEach((barber, index) => {
      console.log(`${index + 1}. ${barber.user?.name || 'Sin nombre'}`);
      console.log(`   - isMainBarber: ${barber.isMainBarber}`);
      console.log(`   - rating: ${JSON.stringify(barber.rating)}`);
      console.log(`   - isActive: ${barber.isActive}`);
      console.log('---');
    });

    const mainBarbers = barbers.filter(b => b.isMainBarber === true);
    console.log(`\nBarberos principales: ${mainBarbers.length}/3`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
}

checkBarbers();