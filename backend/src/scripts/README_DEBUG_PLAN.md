# 🎯 Plan de Debug para Admin/Barberos

## 📋 Resumen

Este plan incluye scripts completos para debuggear y probar todas las funcionalidades de reportes de admin/barberos. Los scripts generan datos estratégicos con patrones conocidos para poder verificar que todos los filtros temporales (1, 7, 15, 30 días) funcionen correctamente.

## 🎯 Objetivo

- ✅ Probar filtros temporales (1, 7, 15, 30 días)
- ✅ Verificar filtros por barbero específico
- ✅ Validar cálculos de ingresos y conteos
- ✅ Confirmar que las agregaciones funcionen
- ✅ Asegurar que los endpoints respondan correctamente

## 📁 Scripts Creados

### 1. `strategicBarberDebug.js` - Generador de Datos
- **Función**: Genera datos estratégicos para testing
- **Características**:
  - NO elimina usuarios existentes
  - Usa barberos, servicios y productos existentes
  - Crea patrones específicos por período
  - Datos identificables por notas "STRATEGIC_TEST"

### 2. `verifyReports.js` - Verificador Automático
- **Función**: Verifica que todos los reportes funcionen
- **Pruebas**:
  - Conteos directos en base de datos
  - Servicios de reportes (SaleService)
  - Filtros por barbero
  - Cálculos y agregaciones

### 3. `cleanTestData.js` - Limpiador
- **Función**: Elimina SOLO datos de testing
- **Seguridad**: No afecta datos reales del sistema

### 4. `masterDebug.js` - Proceso Completo
- **Función**: Ejecuta todo el proceso automáticamente
- **Incluye**: Limpieza → Generación → Verificación → Documentación

## 🚀 Cómo Usar

### Opción 1: Proceso Completo (Recomendado)
```bash
cd backend/src/scripts
node masterDebug.js
```

### Opción 2: Paso a Paso
```bash
# 1. Limpiar datos previos
node cleanTestData.js

# 2. Generar datos estratégicos
node strategicBarberDebug.js

# 3. Verificar reportes
node verifyReports.js

# 4. Limpiar cuando termines
node cleanTestData.js
```

## 📊 Datos Estratégicos Generados

| Período | Ventas | Citas | Ingresos Aprox |
|---------|--------|-------|----------------|
| HOY (1 día) | 5 | 3 | $15,000 |
| SEMANA (7 días) | 21 | 14 | $63,000 |
| 15 DÍAS | 45 | 30 | $135,000 |
| MES (30 días) | 90 | 60 | $270,000 |

## 🧪 Casos de Prueba

### 1. Filtros Temporales
- **1 día**: Debe mostrar exactamente 5 ventas y 3 citas
- **7 días**: Debe mostrar exactamente 21 ventas y 14 citas  
- **15 días**: Debe mostrar exactamente 45 ventas y 30 citas
- **30 días**: Debe mostrar exactamente 90 ventas y 60 citas

### 2. Filtros por Barbero
- Seleccionar barbero específico debe filtrar solo sus datos
- Suma de todos los barberos = total general
- Barberos sin datos no deben aparecer

### 3. Endpoints API
```bash
# Reportes por período
GET /api/v1/sales/reports?type=daily&date=2025-09-15
GET /api/v1/sales/reports?type=weekly&date=2025-09-15  
GET /api/v1/sales/reports?type=monthly&date=2025-09-15

# Filtrado por barbero
GET /api/v1/sales/reports?type=monthly&date=2025-09-15&barberId=BARBERO_ID
```

### 4. Verificaciones de Cálculos
- ✅ Suma de ingresos por barbero = total general
- ✅ Cantidad de productos ≤ (ventas × 3)
- ✅ Fechas dentro del rango correcto
- ✅ Estados de citas = 'completed'

## 🏷️ Identificación de Datos de Testing

Los datos generados son fácilmente identificables:
- **Ventas**: Notas contienen "STRATEGIC_TEST"
- **Citas**: Notas contienen "STRATEGIC_TEST"  
- **Clientes**: Nombres formato "Cliente Test X-Y"

## ⚠️ Casos Edge a Probar

1. **Barberos sin datos** en el período
2. **Fechas futuras** (no deben tener datos)
3. **Filtros con barberId inexistente**
4. **Parámetros de fecha inválidos**
5. **Períodos sin actividad**

## 🐛 Solución de Problemas

### Si los números no coinciden:
1. Ejecuta `node verifyReports.js` para diagnóstico detallado
2. Verifica que los barberos tengan datos activos
3. Confirma que los servicios estén activos
4. Revisa que hay productos con stock

### Si hay errores en endpoints:
1. Verifica que el backend esté corriendo
2. Confirma la conexión a MongoDB
3. Revisa los logs del servidor
4. Valida los parámetros de fecha

### Si faltan datos:
1. Ejecuta `node strategicBarberDebug.js` nuevamente
2. Verifica que existan barberos activos
3. Confirma que hay servicios disponibles
4. Asegúrate que hay productos con stock

## 📱 Testing en Frontend

### Funcionalidades a Probar:
1. **Cards de datos** se actualizan al cambiar filtros
2. **Dropdowns de barberos** muestran opciones correctas
3. **Filtros temporales** cambian los números mostrados
4. **Responsividad** funciona en móvil y desktop
5. **Gráficos** (si existen) se actualizan correctamente

### Flujo de Testing Recomendado:
1. Cargar página de admin/barberos
2. Probar filtro "1 día" → debe mostrar 5 ventas, 3 citas
3. Probar filtro "7 días" → debe mostrar 21 ventas, 14 citas
4. Probar filtro "15 días" → debe mostrar 45 ventas, 30 citas
5. Probar filtro "30 días" → debe mostrar 90 ventas, 60 citas
6. Seleccionar barbero específico → datos deben filtrarse
7. Verificar sumas y totales

## 🔧 Mantenimiento

### Regenerar Datos:
Si necesitas datos frescos o diferentes:
```bash
node cleanTestData.js
node strategicBarberDebug.js
```

### Limpiar Después del Testing:
**IMPORTANTE**: Siempre limpia los datos de testing cuando termines:
```bash
node cleanTestData.js
```

### Modificar Patrones:
Para cambiar las cantidades de datos, edita las constantes en `strategicBarberDebug.js`:
```javascript
const DEBUG_PATTERNS = {
  DAILY: { sales: 5, appointments: 3 },
  WEEKLY: { sales: 21, appointments: 14 },
  // ... etc
};
```

## 📞 Soporte

Si encuentras problemas:
1. Ejecuta `node verifyReports.js` para diagnóstico
2. Revisa los logs del backend
3. Compara los números con esta documentación
4. Verifica que la base de datos tenga barberos/servicios/productos activos

## ✅ Checklist de Completion

- [ ] Scripts ejecutan sin errores
- [ ] Datos se generan en las cantidades correctas
- [ ] Filtros temporales funcionan en frontend
- [ ] Filtros por barbero funcionan
- [ ] Cálculos de ingresos son correctos
- [ ] Endpoints API responden correctamente
- [ ] Frontend se actualiza al cambiar filtros
- [ ] Responsividad funciona en móvil
- [ ] Datos de testing se pueden limpiar

---

🎯 **¡Con este plan tienes todo lo necesario para debuggear completamente las funcionalidades de admin/barberos!**
