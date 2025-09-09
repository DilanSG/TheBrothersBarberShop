import jwt from 'jsonwebtoken';
import { config } from '../../src/config/index.js';
import User from '../../src/models/User.js';
import Barber from '../../src/models/Barber.js';
import Service from '../../src/models/Service.js';
import Appointment from '../../src/models/Appointment.js';

// Crear un token de prueba
export const generateTestToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role },
    config.jwt.secret,
    { expiresIn: '1h' }
  );
};

// Crear un usuario de prueba
export const createTestUser = async (role = 'user') => {
  const user = await User.create({
    email: `test${Date.now()}@test.com`,
    password: 'Test123!',
    name: 'Test User',
    role
  });
  
  const token = generateTestToken(user);
  return { user, token };
};

// Crear un barbero de prueba
export const createTestBarber = async () => {
  const { user } = await createTestUser('barber');
  
  const barber = await Barber.create({
    user: user._id,
    name: 'Test Barber',
    email: user.email,
    phone: '1234567890',
    experience: '5 years',
    specialties: ['haircut', 'shave'],
    availability: {
      monday: { start: '09:00', end: '17:00' },
      tuesday: { start: '09:00', end: '17:00' },
      wednesday: { start: '09:00', end: '17:00' },
      thursday: { start: '09:00', end: '17:00' },
      friday: { start: '09:00', end: '17:00' }
    }
  });

  return { barber, user };
};

// Crear un servicio de prueba
export const createTestService = async () => {
  return await Service.create({
    name: 'Test Service',
    description: 'Test Description',
    price: 29.99,
    duration: 30,
    category: 'haircut'
  });
};

// Crear una cita de prueba
export const createTestAppointment = async (userId, barberId, serviceId) => {
  return await Appointment.create({
    user: userId,
    barber: barberId,
    service: serviceId,
    date: new Date(),
    time: '10:00',
    status: 'pending'
  });
};

// Función para esperar un tiempo
export const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Función para comparar objetos sin tener en cuenta los campos de timestamp
export const compareWithoutTimestamps = (obj1, obj2) => {
  const clean = (obj) => {
    const { createdAt, updatedAt, __v, _id, ...rest } = obj;
    return rest;
  };
  
  return expect(clean(obj1)).toEqual(clean(obj2));
};
