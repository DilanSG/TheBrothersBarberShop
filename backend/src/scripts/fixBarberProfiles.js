import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import Barber from '../models/Barber.js';

dotenv.config();

const fixBarberProfiles = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Conectado a MongoDB');

    // Buscar todos los usuarios con rol de barbero
    const barberUsers = await User.find({ role: 'barber' });
    console.log(`Encontrados ${barberUsers.length} usuarios con rol de barbero`);

    // Estructura correcta del horario
    const defaultSchedule = {
      monday: { start: '09:00', end: '18:00', available: true },
      tuesday: { start: '09:00', end: '18:00', available: true },
      wednesday: { start: '09:00', end: '18:00', available: true },
      thursday: { start: '09:00', end: '18:00', available: true },
      friday: { start: '09:00', end: '18:00', available: true },
      saturday: { start: '09:00', end: '14:00', available: true },
      sunday: { start: '09:00', end: '14:00', available: false }
    };

    for (const user of barberUsers) {
      console.log(`\nProcesando usuario: ${user.name} (${user._id})`);
      
      // Buscar o crear perfil de barbero
      let barberProfile = await Barber.findOne({ user: user._id });
      
      if (!barberProfile) {
        console.log('Creando nuevo perfil de barbero');
        barberProfile = new Barber({
          user: user._id,
          specialty: 'Barbero General',
          experience: 0,
          description: `Barbero profesional ${user.name}`,
          isActive: true,
          schedule: defaultSchedule,
          services: []
        });
      } else {
        console.log('Actualizando perfil existente');
        
        // Corregir estructura del horario si es necesario
        if (barberProfile.schedule) {
          const correctedSchedule = {};
          for (const [day, hours] of Object.entries(barberProfile.schedule)) {
            correctedSchedule[day] = {
              start: hours.start || '09:00',
              end: hours.end || '18:00',
              available: hours.available !== undefined ? hours.available : hours.isAvailable !== undefined ? hours.isAvailable : true
            };
          }
          barberProfile.schedule = correctedSchedule;
        } else {
          barberProfile.schedule = defaultSchedule;
        }

        // Asegurarse de que otros campos requeridos existan
        if (!barberProfile.specialty) barberProfile.specialty = 'Barbero General';
        if (!barberProfile.description) barberProfile.description = `Barbero profesional ${user.name}`;
        if (barberProfile.experience === undefined) barberProfile.experience = 0;
        if (barberProfile.isActive === undefined) barberProfile.isActive = true;
        if (!barberProfile.services) barberProfile.services = [];
      }

      await barberProfile.save();
      console.log('Perfil guardado exitosamente');
    }

    console.log('\nProceso completado. Verificando resultados...');
    const totalProfiles = await Barber.countDocuments();
    console.log(`Total de perfiles de barbero en la base de datos: ${totalProfiles}`);
    
    mongoose.disconnect();
    console.log('Desconectado de MongoDB');
  } catch (error) {
    console.error('Error:', error);
    mongoose.disconnect();
    process.exit(1);
  }
};

fixBarberProfiles();
