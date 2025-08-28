import User from '../models/User.js';
import Barber from '../models/Barber.js';
import mongoose from 'mongoose';
import connectDB from '../config/database.js';
import dotenv from 'dotenv';

dotenv.config();

const createTestBarbers = async () => {
  try {
    // Conectar a la base de datos
    await connectDB();
    // Crear usuarios barberos de prueba
    const testBarbers = [
      {
        name: 'Juan Pérez',
        email: 'juan@barber.com',
        password: '123456',
        role: 'barber',
        phone: '123456789',
        photo: {
          url: 'https://images.unsplash.com/photo-1503443207922-dff7d543fd0e?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=627&q=80'
        }
      },
      {
        name: 'Carlos Rodríguez',
        email: 'carlos@barber.com',
        password: '123456',
        role: 'barber',
        phone: '987654321',
        photo: {
          url: 'https://images.unsplash.com/photo-1534308143481-c55f00be8bd7?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1630&q=80'
        }
      }
    ];

    for (const barberData of testBarbers) {
      // Verificar si el usuario ya existe
      let user = await User.findOne({ email: barberData.email });
      
      if (!user) {
        // Crear nuevo usuario
        user = await User.create({
          ...barberData,
          username: barberData.email,
          isActive: true
        });
        console.log('Usuario barbero creado:', user.name);
      }

      // Verificar si ya tiene perfil de barbero
      let barberProfile = await Barber.findOne({ user: user._id });
      
      if (!barberProfile) {
        // Crear perfil de barbero
        barberProfile = await Barber.create({
          user: user._id,
          specialty: 'Barbero Profesional',
          experience: 5,
          description: `${user.name} es un barbero profesional con amplia experiencia en cortes modernos y clásicos.`,
          isActive: true,
          rating: {
            average: 4.5,
            count: 10
          },
          schedule: {
            monday: { start: '09:00', end: '18:00', available: true },
            tuesday: { start: '09:00', end: '18:00', available: true },
            wednesday: { start: '09:00', end: '18:00', available: true },
            thursday: { start: '09:00', end: '18:00', available: true },
            friday: { start: '09:00', end: '18:00', available: true },
            saturday: { start: '09:00', end: '14:00', available: true },
            sunday: { start: '09:00', end: '14:00', available: false }
          }
        });
        console.log('Perfil de barbero creado para:', user.name);
      }
    }

    console.log('Proceso completado exitosamente');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

createTestBarbers();
