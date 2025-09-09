import mongoose from 'mongoose';
import { config } from '../src/config/index.js';
import { logger } from '../src/utils/logger.js';

// Desactivar logs durante los tests
logger.silent = true;

// Configuración global para tests
beforeAll(async () => {
  // Conectar a una base de datos de test
  const dbUrl = config.database.url.replace(
    /\/[^/]+$/,
    '/test_' + Math.random().toString(36).substring(7)
  );
  
  await mongoose.connect(dbUrl);
});

// Limpiar después de cada test
afterEach(async () => {
  // Limpiar todas las colecciones
  const collections = Object.values(mongoose.connection.collections);
  for (const collection of collections) {
    await collection.deleteMany();
  }
});

// Desconectar después de todos los tests
afterAll(async () => {
  await mongoose.disconnect();
});
