import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import Barber from '../models/Barber.js';

dotenv.config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected for debugging');

    // 1. Mostrar todos los usuarios que son barberos
    const barberUsers = await User.find({ role: 'barber' });
    console.log('\n1. Usuarios con rol de barbero:');
    console.log(JSON.stringify(barberUsers.map(u => ({
      id: u._id,
      name: u.name,
      email: u.email,
      role: u.role
    })), null, 2));

    // 2. Mostrar todos los perfiles de barbero
    const barberProfiles = await Barber.find().populate('user', 'name email role');
    console.log('\n2. Perfiles de barbero:');
    console.log(JSON.stringify(barberProfiles.map(b => ({
      id: b._id,
      userId: b.user?._id,
      name: b.user?.name,
      email: b.user?.email,
      isActive: b.isActive,
      specialty: b.specialty
    })), null, 2));

    // 3. Mostrar barberos activos
    const activeBarbers = await Barber.find({ isActive: true }).populate('user', 'name email role');
    console.log('\n3. Perfiles de barbero activos:');
    console.log(JSON.stringify(activeBarbers.map(b => ({
      id: b._id,
      userId: b.user?._id,
      name: b.user?.name,
      email: b.user?.email,
      isActive: b.isActive,
      specialty: b.specialty
    })), null, 2));

    await mongoose.disconnect();
    console.log('\nDebug completado.');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

connectDB();
