#!/usr/bin/env node

/**
 * Script para verificar la estructura de barberos en la base de datos
 */

import mongoose from 'mongoose';
import Barber from './src/models/Barber.js';
import User from './src/models/User.js';
import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

async function checkBarbers() {
  try {
    console.log('🔍 Conectando a MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado a MongoDB\n');

    // Verificar usuarios
    console.log('👥 VERIFICANDO USUARIOS:');
    console.log('─'.repeat(50));
    const users = await User.find({}, { name: 1, email: 1, role: 1 });
    users.forEach(user => {
      console.log(`ID: ${user._id}`);
      console.log(`Nombre: ${user.name}`);
      console.log(`Email: ${user.email}`);
      console.log(`Role: ${user.role}`);
      console.log('');
    });

    // Verificar barberos
    console.log('💇 VERIFICANDO BARBEROS:');
    console.log('─'.repeat(50));
    const barbers = await Barber.find({}).populate('user');
    
    if (barbers.length === 0) {
      console.log('⚠️  No hay barberos registrados en la base de datos');
    } else {
      barbers.forEach(barber => {
        console.log(`ID Barbero: ${barber._id}`);
        console.log(`Especialidad: ${barber.specialty}`);
        console.log(`Usuario asociado: ${barber.user ? barber.user.name : 'Sin usuario'}`);
        console.log(`User ID: ${barber.user ? barber.user._id : 'N/A'}`);
        console.log(`Role del usuario: ${barber.user ? barber.user.role : 'N/A'}`);
        console.log('');
      });
    }

    // Verificar el usuario actual del error
    const adminUser = await User.findById('68c626ae475aadf9deff4ef2');
    if (adminUser) {
      console.log('🔍 USUARIO DEL ERROR:');
      console.log('─'.repeat(30));
      console.log(`ID: ${adminUser._id}`);
      console.log(`Nombre: ${adminUser.name}`);
      console.log(`Role: ${adminUser.role}`);
      
      // Buscar si este admin tiene un perfil de barbero
      const adminBarberProfile = await Barber.findOne({ user: adminUser._id });
      if (adminBarberProfile) {
        console.log(`✅ Tiene perfil de barbero: ${adminBarberProfile._id}`);
      } else {
        console.log(`❌ NO tiene perfil de barbero`);
      }
    }

    console.log('\n💡 RECOMENDACIONES:');
    console.log('─'.repeat(40));
    if (barbers.length === 0) {
      console.log('1. Crear al menos un barbero en la base de datos');
      console.log('2. O modificar el código para permitir que admins hagan ventas sin perfil de barbero');
    } else {
      console.log('1. El admin debe usar el ID de un barbero existente para realizar ventas');
      console.log('2. O crear un perfil de barbero para el admin');
      console.log('3. O modificar el frontend para seleccionar qué barbero realiza la venta');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Desconectado de MongoDB');
  }
}

checkBarbers();