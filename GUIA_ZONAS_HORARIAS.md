# 🕐 Guía de Manejo de Zonas Horarias

## ⚠️ PROBLEMA IDENTIFICADO (Octubre 16, 2025)

**Síntoma:** Los timestamps muestran 5 horas de diferencia con la hora real en Colombia.

**Causa Raíz:** 
- Colombia está en UTC-5 (sin cambio horario estival)
- `new Date()` devuelve hora UTC del servidor
- Al mostrar timestamps sin conversión, aparecen 5 horas adelantados

**Ejemplo del problema:**
```javascript
// ❌ INCORRECTO - Hora actual: 9:08 AM en Colombia
const now = new Date(); 
console.log(now.toISOString()); // Output: 2025-10-16T14:08:00.000Z (2:08 PM UTC)

// ✅ CORRECTO - Debe mostrar 9:08 AM
import { now, today } from './shared/utils/dateUtils.js';
console.log(now()); // Output: 2025-10-16T09:08:00 (9:08 AM Colombia)
console.log(today()); // Output: "2025-10-16"
```

---

## 📚 UTILIDADES DISPONIBLES

### Backend: `backend/src/shared/utils/dateUtils.js`
### Frontend: `frontend/src/shared/utils/dateUtils.js`

```javascript
import { now, today, formatFriendly, debugTime } from '@/shared/utils/dateUtils';

// Obtener fecha/hora actual en Colombia
const currentTime = now(); // Date object en Colombia
const currentDate = today(); // "2025-10-16"

// Formatear fechas
formatFriendly(new Date()); // "16 de octubre de 2025, 9:08 AM"
formatShort(new Date());    // "16/10/2025"
formatTime(new Date());     // "9:08 AM"

// Comparaciones
isPast(someDate);   // true/false
isFuture(someDate); // true/false
isSameDay(date1, date2); // true/false

// Debug
debugTime('Verificar hora'); // Muestra UTC vs Colombia en console
```

---

## 🔄 MIGRACIÓN PASO A PASO

### Paso 1: Identificar patrones problemáticos

**BUSCAR en el código:**
```javascript
// ❌ Patrones a reemplazar:
new Date()                      // → now()
new Date().toISOString()        // → today() (para fechas) o formatInColombiaTime()
Date.now()                      // → nowTimestamp() (si necesitas timestamp en Colombia)
date.toISOString().split('T')[0] // → today() o toDateString(date)
```

### Paso 2: Reemplazar por utilidades

**BACKEND:**
```javascript
// ❌ ANTES
const timestamp = new Date();
const todayStr = new Date().toISOString().split('T')[0];

// ✅ DESPUÉS
import { now, today } from '../shared/utils/dateUtils.js';
const timestamp = now();
const todayStr = today();
```

**FRONTEND:**
```javascript
// ❌ ANTES
const timestamp = new Date();
const todayStr = new Date().toISOString().split('T')[0];

// ✅ DESPUÉS
import { now, today } from '@/shared/utils/dateUtils';
const timestamp = now();
const todayStr = today();
```

### Paso 3: Actualizar casos especiales

**Timestamps en DB (Backend):**
```javascript
// ✅ CORRECTO - MongoDB timestamps automáticos (createdAt, updatedAt)
// NO cambiar: Mongoose maneja timestamps automáticamente

// ✅ CORRECTO - Campos de fecha personalizados
import { now } from '../shared/utils/dateUtils.js';

const sale = new Sale({
  saleDate: now(),        // Usar now() en lugar de new Date()
  completedAt: now(),
  cancelledAt: now()
});
```

**Comparaciones de fechas:**
```javascript
// ❌ ANTES
if (appointment.date < new Date()) {
  // Es pasada
}

// ✅ DESPUÉS
import { isPast } from '../shared/utils/dateUtils.js';
if (isPast(appointment.date)) {
  // Es pasada
}
```

---

## 🎯 PRIORIDAD DE MIGRACIÓN

### 🔴 CRÍTICO (migrar inmediatamente)
1. **Reportes y dashboards** - Impacta visualización de datos
   - `SaleUseCases.js` - reportes de ventas
   - `useBarberStats.js` - estadísticas del barbero
   - `AdminBarbers.jsx` - panel de administración

2. **Creación de ventas/citas** - Afecta integridad de datos
   - `SaleUseCases.createSale()`
   - `AppointmentUseCases.js` - crear/actualizar citas

### 🟡 IMPORTANTE (migrar en próximo sprint)
3. **Notificaciones y logs**
   - `AuthUseCases.login()` - timestamp de login
   - `emailService.js` - timestamps en emails
   
4. **Validaciones de disponibilidad**
   - `barberController.js` - slots disponibles
   - `availableDatesService.js` - fechas disponibles

### 🟢 OPCIONAL (migrar gradualmente)
5. **Scripts y utilidades**
   - Scripts de backup
   - Scripts de población de datos
   - Tests (usar mock)

---

## ✅ CASOS YA MIGRADOS

1. **AuthUseCases.login()** - ✅ Implementado con `now()` en notificaciones
2. **Frontend dateUtils.js** - ✅ Tiene `getCurrentDateColombia()`

---

## 🧪 TESTING

**Verificar migración:**
```javascript
// Agregar en el código a verificar:
import { debugTime } from '../shared/utils/dateUtils.js';

// Al inicio de la función
debugTime('Nombre de la función');

// Debe mostrar:
// 🕐 Nombre de la función
// UTC:      2025-10-16T14:08:00.000Z
// Colombia: 2025-10-16 9:08 AM (16 de octubre de 2025, 9:08 AM)
// Hoy (CO): 2025-10-16
```

**Test manual rápido:**
```bash
# En node (backend)
node -e "const { debugTime } = require('./backend/src/shared/utils/dateUtils.js'); debugTime('Test');"

# En browser console (frontend)
import { debugTime } from './shared/utils/dateUtils';
debugTime('Test Frontend');
```

---

## 📝 CHECKLIST DE ARCHIVOS A MIGRAR

### Backend (Prioridad Alta)
- [ ] `SaleUseCases.js` - crear ventas (saleDate)
- [ ] `AppointmentUseCases.js` - crear/cancelar citas
- [ ] `AuthUseCases.js` - ✅ YA MIGRADO (login timestamp)
- [ ] `ExpenseUseCases.js` - gastos recurrentes
- [ ] `barberController.js` - disponibilidad de slots

### Frontend (Prioridad Alta)
- [ ] `useBarberStats.js` - estadísticas y reportes
- [ ] `AdminBarbers.jsx` - panel de administración
- [ ] `UserAppointment.jsx` - crear citas (usuario)
- [ ] `BarberAppointment.jsx` - gestionar citas (barbero)
- [ ] `batchProcessingService.js` - procesamiento de reportes

### Scripts (Prioridad Baja)
- [ ] `master-population.js`
- [ ] `2-create-realistic-data.js`
- [ ] Scripts de backup

---

## 🐛 TROUBLESHOOTING

**Problema:** "Sigo viendo 5 horas de diferencia"
- **Solución:** Verificar que estés usando `now()` en lugar de `new Date()`

**Problema:** "Las fechas en DB están en UTC"
- **Solución:** MongoDB guarda en UTC (correcto). Convertir al mostrar con `formatInColombiaTime()`

**Problema:** "Los timestamps de Mongoose están en UTC"
- **Solución:** createdAt/updatedAt son automáticos. NO cambiar. Formatear al mostrar.

---

## 📌 REGLA DE ORO

> **SIEMPRE usar las utilidades de `dateUtils.js` para:**
> - Obtener fecha/hora actual → `now()` o `today()`
> - Comparar fechas → `isPast()`, `isFuture()`, `isSameDay()`
> - Formatear para mostrar → `formatFriendly()`, `formatShort()`, `formatTime()`
> - Debug de timezone → `debugTime()`

> **NUNCA usar directamente:**
> - ❌ `new Date()` → ✅ `now()`
> - ❌ `Date.now()` → ✅ `nowTimestamp()` (si necesario)
> - ❌ `date.toISOString().split('T')[0]` → ✅ `today()` o `toDateString(date)`

---

**Última actualización:** Octubre 16, 2025, 9:08 AM (Colombia)  
**Estado:** Identificado, utilidades creadas, migración en progreso
