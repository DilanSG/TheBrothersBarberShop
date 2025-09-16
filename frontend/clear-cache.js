import { cacheHelper } from './src/services/api.js';

async function clearCache() {
  try {
    console.log('🧹 Limpiando caché de barberos...');
    
    // Limpiar caché específico de barberos
    await cacheHelper.clear('/barbers');
    
    // También limpiar todo el caché por si acaso
    await cacheHelper.clearAll();
    
    console.log('✅ Caché limpiado exitosamente');
    
  } catch (error) {
    console.error('❌ Error limpiando caché:', error);
  }
}

clearCache();