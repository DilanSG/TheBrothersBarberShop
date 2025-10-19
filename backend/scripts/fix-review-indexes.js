import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cargar variables de entorno
dotenv.config({ path: path.join(__dirname, '../.env') });

async function fixReviewIndexes() {
  try {
    console.log('🔌 Conectando a MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado a MongoDB\n');

    const db = mongoose.connection.db;
    const collection = db.collection('reviews');

    // Listar índices actuales
    console.log('📋 Índices actuales en reviews:');
    const indexes = await collection.indexes();
    indexes.forEach(index => {
      console.log(`  - ${JSON.stringify(index.key)} ${index.unique ? '(UNIQUE)' : ''}`);
    });
    console.log('');

    // Eliminar índice user_1_barber_1 si existe
    try {
      console.log('🗑️  Intentando eliminar índice user_1_barber_1...');
      await collection.dropIndex('user_1_barber_1');
      console.log('✅ Índice user_1_barber_1 eliminado exitosamente\n');
    } catch (error) {
      if (error.code === 27 || error.codeName === 'IndexNotFound') {
        console.log('ℹ️  Índice user_1_barber_1 no existe (ya fue eliminado)\n');
      } else {
        throw error;
      }
    }

    // Verificar que el índice appointment_1 existe y es único
    const appointmentIndex = indexes.find(idx => idx.name === 'appointment_1');
    if (!appointmentIndex) {
      console.log('⚠️  Creando índice único en appointment...');
      await collection.createIndex({ appointment: 1 }, { unique: true });
      console.log('✅ Índice único en appointment creado\n');
    } else {
      console.log(`ℹ️  Índice en appointment existe: ${appointmentIndex.unique ? 'UNIQUE ✅' : 'NO UNIQUE ⚠️'}\n`);
      
      if (!appointmentIndex.unique) {
        console.log('🔄 Recreando índice como único...');
        await collection.dropIndex('appointment_1');
        await collection.createIndex({ appointment: 1 }, { unique: true });
        console.log('✅ Índice único en appointment recreado\n');
      }
    }

    // Listar índices finales
    console.log('📋 Índices finales en reviews:');
    const finalIndexes = await collection.indexes();
    finalIndexes.forEach(index => {
      console.log(`  - ${JSON.stringify(index.key)} ${index.unique ? '(UNIQUE)' : ''}`);
    });

    console.log('\n✅ Migración completada exitosamente');

  } catch (error) {
    console.error('❌ Error en la migración:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Desconectado de MongoDB');
    process.exit(0);
  }
}

fixReviewIndexes();
