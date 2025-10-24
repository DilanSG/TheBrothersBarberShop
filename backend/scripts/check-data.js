/**
 * Script para verificar datos disponibles
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { logger } from '../src/shared/utils/logger.js';
import User from '../src/core/domain/entities/User.js';
import Barber from '../src/core/domain/entities/Barber.js';
import Service from '../src/core/domain/entities/Service.js';
import Inventory from '../src/core/domain/entities/Inventory.js';

dotenv.config();

const checkData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    logger.info('✅ Conectado a MongoDB');

    const users = await User.find({ role: 'user' }).lean();
    const barbers = await Barber.find({ isActive: true }).populate('user').lean();
    const services = await Service.find({ isActive: true }).lean();
    const products = await Inventory.find({ stock: { $gt: 0 } }).lean();

    logger.info('\n📊 DATOS DISPONIBLES:');
    logger.info(`Usuarios (clientes): ${users.length}`);
    logger.info(`Barberos activos: ${barbers.length}`);
    logger.info(`Servicios activos: ${services.length}`);
    logger.info(`Productos en stock: ${products.length}`);

    logger.info('\n🧑‍💼 BARBEROS:');
    barbers.forEach(b => logger.info(`- ${b.user?.name || 'Sin nombre'} (${b.specialty})`));

    logger.info('\n✂️ SERVICIOS:');
    services.forEach(s => logger.info(`- ${s.name} - $${s.price} (${s.duration}min)`));

    logger.info('\n📦 PRODUCTOS (TOP 10):');
    products.slice(0, 10).forEach(p => logger.info(`- ${p.name} - $${p.price} (Stock: ${p.stock})`));

    await mongoose.disconnect();
    logger.info('\n✅ Verificación completada');
  } catch (error) {
    logger.error('❌ Error:', error.message);
    process.exit(1);
  }
};

checkData();