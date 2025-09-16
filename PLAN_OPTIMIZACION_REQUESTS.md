# 🚀 Plan de Optimización de Requests - AdminBarbers

## 🔍 Problemas Identificados

### 1. **Saturación de Requests**
- Al cambiar filtros, se hacen **2 peticiones por barbero** (sales + appointments)
- Con 5 barberos = **10 peticiones simultáneas**
- Sin cache = mismo dato consultado múltiples veces
- Rate limiting demasiado bajo para desarrollo

### 2. **Peticiones Redundantes**
- Cambiar de "7 días" a "1 día" requiere **todos los datos nuevamente**
- No hay cache local entre cambios de filtro
- Datos se pierden al cambiar filtro aunque ya estén cargados

### 3. **UX Problemática**
- Loading de página completa durante cambios
- No hay feedback granular de progreso
- Usuarios hacen clicks múltiples por impaciencia

---

## 🎯 Soluciones Propuestas (Orden de Implementación)

### **FASE 1: Optimizaciones Inmediatas (1-2 horas)**

#### 1.1 📦 Cache Local con TTL
```javascript
// frontend/src/services/cacheService.js
class CacheService {
  constructor() {
    this.cache = new Map();
    this.ttl = 5 * 60 * 1000; // 5 minutos
  }

  set(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      expires: Date.now() + this.ttl
    });
  }

  get(key) {
    const item = this.cache.get(key);
    if (!item || Date.now() > item.expires) {
      this.cache.delete(key);
      return null;
    }
    return item.data;
  }

  generateKey(barberId, filterType, dateStart, dateEnd) {
    return `barber_${barberId}_${filterType}_${dateStart}_${dateEnd}`;
  }
}
```

#### 1.2 ⏱️ Debounce en Filtros
```javascript
// En useBarberStats.js
import { useCallback } from 'react';
import { debounce } from 'lodash';

const debouncedApplyFilter = useCallback(
  debounce(async (filterType, date) => {
    // Lógica actual de filtros
    await applyFilterInternal(filterType, date);
  }, 300),
  []
);
```

#### 1.3 🚦 Limitación de Concurrencia
```javascript
// Procesar barberos en lotes de máximo 3
const processBarbersInBatches = async (barbers, batchSize = 3) => {
  const results = {};
  
  for (let i = 0; i < barbers.length; i += batchSize) {
    const batch = barbers.slice(i, i + batchSize);
    
    const batchResults = await Promise.all(
      batch.map(async (barber) => {
        // Check cache first
        const cacheKey = cacheService.generateKey(barber._id, filterType, startDate, endDate);
        const cached = cacheService.get(cacheKey);
        
        if (cached) {
          return { barberId: barber._id, data: cached };
        }
        
        // Fetch fresh data
        const data = await fetchBarberData(barber._id);
        cacheService.set(cacheKey, data);
        return { barberId: barber._id, data };
      })
    );
    
    // Merge results
    batchResults.forEach(({ barberId, data }) => {
      results[barberId] = data;
    });
    
    // Pequeña pausa entre lotes
    if (i + batchSize < barbers.length) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  return results;
};
```

### **FASE 2: Optimizaciones Backend (2-3 horas)**

#### 2.1 🔗 Endpoint Unificado
```javascript
// backend/src/routes/adminStats.js
router.get('/admin/unified-stats', async (req, res) => {
  const { startDate, endDate, barberIds } = req.query;
  
  // Una sola consulta agregada para todos los barberos
  const [salesData, appointmentData] = await Promise.all([
    Sale.aggregate([
      {
        $match: {
          barber: { $in: barberIds.map(id => new ObjectId(id)) },
          date: { $gte: new Date(startDate), $lte: new Date(endDate) }
        }
      },
      {
        $group: {
          _id: '$barber',
          totalSales: { $sum: '$total' },
          salesCount: { $sum: 1 },
          // ... más campos
        }
      }
    ]),
    Appointment.aggregate([/* similar */])
  ]);
  
  res.json({
    success: true,
    data: {
      sales: salesData,
      appointments: appointmentData
    }
  });
});
```

#### 2.2 💾 Cache Redis Backend
```javascript
// backend/src/middleware/cache.js
import Redis from 'redis';

const redis = Redis.createClient();

export const cacheMiddleware = (ttl = 120) => {
  return async (req, res, next) => {
    const key = `stats_${JSON.stringify(req.query)}`;
    
    try {
      const cached = await redis.get(key);
      if (cached) {
        return res.json(JSON.parse(cached));
      }
      
      // Override res.json to cache response
      const originalJson = res.json;
      res.json = function(data) {
        redis.setex(key, ttl, JSON.stringify(data));
        return originalJson.call(this, data);
      };
      
      next();
    } catch (error) {
      next();
    }
  };
};
```

### **FASE 3: UX Avanzada (1-2 horas)**

#### 3.1 📊 Indicadores de Progreso Granular
```jsx
// En AdminBarbers.jsx
const [loadingStatus, setLoadingStatus] = useState({});

const updateLoadingStatus = (barberId, status) => {
  setLoadingStatus(prev => ({
    ...prev,
    [barberId]: status
  }));
};

// En cada card de barbero
{loadingStatus[barber._id] && (
  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
    <div className="text-white text-sm">
      {loadingStatus[barber._id] === 'sales' && '📊 Cargando ventas...'}
      {loadingStatus[barber._id] === 'appointments' && '📅 Cargando citas...'}
      {loadingStatus[barber._id] === 'processing' && '⚙️ Procesando...'}
    </div>
  </div>
)}
```

#### 3.2 🔄 Lazy Loading + Precarga
```javascript
// Cargar solo datos necesarios, precargar comunes
const loadDataStrategy = {
  immediate: ['General', 'Hoy'], // Cargar inmediatamente
  lazy: ['7 días', '15 días', '30 días'], // Cargar solo cuando se soliciten
  preload: ['7 días'] // Precargar silenciosamente después de General/Hoy
};

const preloadCommonFilters = async () => {
  // Cargar en background sin bloquear UI
  setTimeout(async () => {
    await loadFilterData('7 días', getTodayLocalDate(), true); // silent = true
  }, 2000);
};
```

### **FASE 4: Optimizaciones de Base de Datos (30 minutos)**

#### 4.1 ⚡ Índices MongoDB
```javascript
// En MongoDB
db.sales.createIndex({ 
  "barber": 1, 
  "date": 1, 
  "total": 1 
});

db.appointments.createIndex({ 
  "barber": 1, 
  "date": 1, 
  "status": 1,
  "service.price": 1 
});

db.sales.createIndex({ 
  "date": 1 
}); // Para queries de fechas globales
```

### **FASE 5: Rate Limiting Inteligente (15 minutos)**

#### 5.1 🛡️ Rate Limiting Adaptativo
```javascript
// backend/src/config/rateLimit.js
export const adaptiveAdminLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutos
  max: (req) => {
    // Más requests para admins, menos para usuarios normales
    if (req.user?.role === 'admin') return 500;
    if (req.user?.role === 'barber') return 200;
    return 100;
  },
  // Permitir ráfagas cortas
  skipSuccessfulRequests: false,
  skipFailedRequests: true,
});
```

---

## 🎯 Métricas de Éxito

### Antes de Optimización:
- ❌ **10+ requests simultáneos** por cambio de filtro
- ❌ **~3-5 segundos** loading time
- ❌ **Rate limiting errors** frecuentes
- ❌ **UX bloqueante** durante cargas

### Después de Optimización:
- ✅ **1-2 requests** máximo (con cache)
- ✅ **~0.5-1 segundo** loading time
- ✅ **Sin rate limiting errors**
- ✅ **UX progresiva** con feedback granular

---

## 🚀 Plan de Implementación

### **Día 1 (3-4 horas)**
1. ✅ Cache local con TTL (1 hora)
2. ✅ Debounce en filtros (30 min)
3. ✅ Limitación de concurrencia (1 hora)
4. ✅ Indicadores de progreso (1 hora)
5. ✅ Rate limiting mejorado (30 min)

### **Día 2 (2-3 horas)**
1. ✅ Endpoint unificado backend (2 horas)
2. ✅ Índices MongoDB (30 min)
3. ✅ Cache Redis (1 hora)

### **Día 3 (1-2 horas)**
1. ✅ Lazy loading + precarga (1.5 horas)
2. ✅ Testing y refinamiento (30 min)

---

## 🔧 Configuraciones Específicas

### Cache Service Configuration
```javascript
const CACHE_CONFIG = {
  TTL: 5 * 60 * 1000, // 5 minutos
  MAX_SIZE: 100, // máximo 100 entradas
  AUTO_CLEANUP: true, // limpiar automáticamente items expirados
  STORAGE: 'memory', // 'memory' | 'localStorage' | 'sessionStorage'
};
```

### Request Batching Configuration
```javascript
const BATCH_CONFIG = {
  BATCH_SIZE: 3, // máximo 3 barberos simultáneos
  BATCH_DELAY: 100, // 100ms entre lotes
  RETRY_ATTEMPTS: 2, // 2 reintentos por fallo
  TIMEOUT: 10000, // 10 segundos timeout
};
```

### Progress Indicators
```javascript
const LOADING_STATES = {
  IDLE: 'idle',
  CACHE_CHECK: 'cache_check',
  FETCHING_SALES: 'fetching_sales',
  FETCHING_APPOINTMENTS: 'fetching_appointments',
  PROCESSING: 'processing',
  COMPLETE: 'complete',
  ERROR: 'error'
};
```

---

## 🧪 Testing Plan

1. **Load Testing**: Simular 5 usuarios cambiando filtros rápidamente
2. **Cache Testing**: Verificar que datos se reutilizan correctamente
3. **Rate Limiting Testing**: Confirmar que no hay errores 429
4. **UX Testing**: Medir tiempos de respuesta y feedback visual
5. **Error Handling**: Probar comportamiento con conexión lenta/offline

---

*Implementar en orden de prioridad para máximo impacto con mínimo esfuerzo*
