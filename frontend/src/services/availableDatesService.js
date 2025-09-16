// Servicio unificado para obtener fechas disponibles
import { salesService, appointmentsService } from './api';

// Configuración de debugging
const DEBUG_LOGS = false; // Cambiar a true para habilitar logs

const debugLog = (message, ...args) => {
  if (DEBUG_LOGS) {
    console.log(message, ...args);
  }
};

export class AvailableDatesService {
  constructor() {
    this.dateCache = new Map();
    this.lastCacheUpdate = null;
    this.CACHE_DURATION = 5 * 60 * 1000; // 5 minutos
  }

  // Obtener todas las fechas disponibles de todas las fuentes
  async getAllAvailableDates() {
    debugLog('📅 Obteniendo fechas disponibles de todas las fuentes...');
    
    // Verificar cache
    if (this.isCacheValid()) {
      debugLog('✅ Usando fechas desde cache');
      return Array.from(this.dateCache.values()).flat().filter((date, index, arr) => arr.indexOf(date) === index).sort((a, b) => new Date(b) - new Date(a));
    }

    try {
      const allDates = new Set();

      // 1. Obtener fechas de ventas
      try {
        debugLog('🛒 Cargando fechas de ventas...');
        const salesResponse = await salesService.getAvailableDates();
        if (salesResponse?.success && Array.isArray(salesResponse.data)) {
          salesResponse.data.forEach(date => {
            if (date && typeof date === 'string') {
              allDates.add(date.split('T')[0]); // Solo la parte de fecha
            }
          });
          this.dateCache.set('sales', salesResponse.data);
          debugLog(`✅ ${salesResponse.data.length} fechas de ventas cargadas`);
        }
      } catch (err) {
        console.warn('⚠️ Error cargando fechas de ventas:', err.message);
        this.dateCache.set('sales', []);
      }

      // 2. Obtener fechas de citas (requiere barberId, así que usamos enfoque diferente)
      try {
        debugLog('📅 Cargando fechas de citas...');
        // Como getAvailableDates de appointments requiere barberId, 
        // usaremos un enfoque alternativo o lo omitiremos por ahora
        debugLog('ℹ️ Fechas de citas omitidas - endpoint requiere barberId específico');
        this.dateCache.set('appointments', []);
      } catch (err) {
        console.warn('⚠️ Error cargando fechas de citas (puede que no exista el endpoint):', err.message);
        this.dateCache.set('appointments', []);
      }

      // 3. Como fallback, obtener fechas de los últimos 90 días de datos existentes
      if (allDates.size === 0) {
        debugLog('📈 Generando fechas fallback de los últimos 90 días...');
        const fallbackDates = this.generateFallbackDates();
        fallbackDates.forEach(date => allDates.add(date));
      }

      // Convertir Set a Array y ordenar
      const sortedDates = Array.from(allDates)
        .filter(date => date && date.trim() !== '')
        .sort((a, b) => new Date(b) - new Date(a));

      this.lastCacheUpdate = Date.now();
      debugLog(`✅ Total de fechas disponibles: ${sortedDates.length}`);
      debugLog('📊 Primeras 5 fechas:', sortedDates.slice(0, 5));
      
      return sortedDates;
    } catch (error) {
      console.error('❌ Error obteniendo fechas disponibles:', error);
      return this.generateFallbackDates();
    }
  }

  // Obtener fechas disponibles para un barbero específico
  async getBarberAvailableDates(barberId) {
    debugLog(`👤 Obteniendo fechas disponibles para barbero: ${barberId}`);
    
    const cacheKey = `barber_${barberId}`;
    if (this.dateCache.has(cacheKey) && this.isCacheValid()) {
      return this.dateCache.get(cacheKey);
    }

    try {
      const allDates = new Set();

      // Obtener fechas específicas del barbero si hay endpoints disponibles
      try {
        // TODO: Implementar cuando estén los endpoints específicos de barbero
        // const barberSalesResponse = await salesService.getBarberAvailableDates(barberId);
        // const barberAppointmentsResponse = await appointmentsService.getBarberAvailableDates(barberId);
      } catch (err) {
        console.warn(`⚠️ Error obteniendo fechas específicas del barbero ${barberId}:`, err.message);
      }

      // Si no hay fechas específicas, usar las fechas generales
      if (allDates.size === 0) {
        const generalDates = await this.getAllAvailableDates();
        generalDates.forEach(date => allDates.add(date));
      }

      const sortedDates = Array.from(allDates).sort((a, b) => new Date(b) - new Date(a));
      this.dateCache.set(cacheKey, sortedDates);
      
      debugLog(`✅ ${sortedDates.length} fechas disponibles para barbero ${barberId}`);
      return sortedDates;
    } catch (error) {
      console.error(`❌ Error obteniendo fechas para barbero ${barberId}:`, error);
      return this.generateFallbackDates();
    }
  }

  // Verificar si una fecha específica tiene datos
  async hasDataForDate(date, barberId = null) {
    const availableDates = barberId 
      ? await this.getBarberAvailableDates(barberId)
      : await this.getAllAvailableDates();
    
    const dateStr = typeof date === 'string' ? date : date.toISOString().split('T')[0];
    return availableDates.includes(dateStr);
  }

  // Obtener fechas en un rango específico
  async getDatesInRange(startDate, endDate, barberId = null) {
    const availableDates = barberId 
      ? await this.getBarberAvailableDates(barberId)
      : await this.getAllAvailableDates();
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    return availableDates.filter(dateStr => {
      const date = new Date(dateStr);
      return date >= start && date <= end;
    });
  }

  // Generar fechas de fallback (últimos 90 días)
  generateFallbackDates() {
    debugLog('🔄 Generando fechas de fallback...');
    const dates = [];
    const today = new Date();
    
    for (let i = 0; i < 90; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      // Solo agregar días de la semana (lunes a sábado)
      const dayOfWeek = date.getDay();
      if (dayOfWeek >= 1 && dayOfWeek <= 6) {
        dates.push(date.toISOString().split('T')[0]);
      }
    }
    
    debugLog(`📅 ${dates.length} fechas de fallback generadas`);
    return dates;
  }

  // Verificar si el cache es válido
  isCacheValid() {
    return this.lastCacheUpdate && 
           (Date.now() - this.lastCacheUpdate) < this.CACHE_DURATION;
  }

  // Limpiar cache
  clearCache() {
    debugLog('🧹 Limpiando cache de fechas disponibles');
    this.dateCache.clear();
    this.lastCacheUpdate = null;
  }

  // Actualizar cache forzosamente
  async refreshCache() {
    this.clearCache();
    return await this.getAllAvailableDates();
  }
}

// Instancia singleton
export const availableDatesService = new AvailableDatesService();
