# 📋 TODO LIST: IMPLEMENTACIÓN COMPLETA DE REPORTES Y MODALES

## 🎯 PROBLEMA ACTUAL
- ❌ Ventas muestran $511.000 pero "0 productos" (datos agregados, no detallados)
- ❌ Modales no muestran transacciones reales producto por producto
- ❌ No hay separación por días en reportes multi-día
- ❌ Servicios debe cambiarse por "Cortes" con datos de walk-ins
- ❌ Citas no muestran datos reales de appointments completadas

## 🔧 IMPLEMENTACIÓN REQUERIDA

### FASE 1: BACKEND - ENDPOINTS DETALLADOS 🔥 CRÍTICO

#### 1.1 Ventas por Producto (Inventario)
```javascript
// backend/src/controllers/salesController.js
// NUEVO endpoint para obtener ventas detalladas por barbero y período
GET /api/v1/sales/barber/:barberId/detailed?startDate=X&endDate=Y

Response: {
  success: true,
  data: {
    totalRevenue: 511000,
    totalProducts: 23,
    salesByDate: {
      "2025-09-10": {
        products: [
          {
            productId: "id1",
            productName: "Shampoo Kerastase",
            quantitySold: 2,
            unitPrice: 45000,
            totalPrice: 90000,
            soldAt: "2025-09-10T10:30:00Z",
            soldBy: "barberId"
          },
          {
            productId: "id2", 
            productName: "Pomada American Crew",
            quantitySold: 1,
            unitPrice: 35000,
            totalPrice: 35000,
            soldAt: "2025-09-10T14:15:00Z",
            soldBy: "barberId"
          }
        ],
        dayTotal: 125000,
        dayProductCount: 3
      },
      "2025-09-11": {
        // ... más días
      }
    }
  }
}
```

**IMPLEMENTAR:**
- [ ] Crear endpoint `GET /sales/barber/:barberId/detailed`
- [ ] Consultar tabla `sales` o donde se guarden las ventas de productos
- [ ] Agrupar por fecha y producto
- [ ] Incluir datos completos del producto (nombre, precio, cantidad)
- [ ] Validar que coincida con descuentos de inventario

#### 1.2 Cortes (Walk-ins) por Barbero
```javascript 
// backend/src/controllers/salesController.js o appointmentsController.js
GET /api/v1/walk-ins/barber/:barberId/detailed?startDate=X&endDate=Y

Response: {
  success: true,
  data: {
    totalRevenue: 180000,
    totalCuts: 12,
    cutsByDate: {
      "2025-09-10": {
        cuts: [
          {
            cutId: "cut1",
            serviceName: "Corte Clásico",
            clientName: "Walk-in Cliente",
            price: 15000,
            duration: 30,
            completedAt: "2025-09-10T09:00:00Z",
            barberId: "barberId"
          }
        ],
        dayTotal: 45000,
        dayCutCount: 3
      }
    }
  }
}
```

**IMPLEMENTAR:**
- [ ] Crear endpoint `GET /walk-ins/barber/:barberId/detailed`  
- [ ] Consultar tabla donde se guardan walk-ins/cortes
- [ ] Agrupar por fecha
- [ ] Incluir datos del servicio y cliente

#### 1.3 Citas Completadas por Barbero
```javascript
// backend/src/controllers/appointmentController.js
GET /api/v1/appointments/barber/:barberId/completed?startDate=X&endDate=Y

Response: {
  success: true, 
  data: {
    totalRevenue: 240000,
    totalCompleted: 8,
    appointmentsByDate: {
      "2025-09-10": {
        appointments: [
          {
            appointmentId: "apt1",
            clientName: "Juan Pérez",
            clientPhone: "+57...",
            service: {
              name: "Corte + Barba",
              duration: 45,
              price: 30000
            },
            scheduledAt: "2025-09-10T10:00:00Z",
            completedAt: "2025-09-10T10:45:00Z",
            status: "completed",
            barberId: "barberId"
          }
        ],
        dayTotal: 60000,
        dayCompletedCount: 2
      }
    }
  }
}
```

**IMPLEMENTAR:**
- [ ] Mejorar endpoint existente de appointments
- [ ] Filtrar solo `status: 'completed'`
- [ ] Agrupar por fecha
- [ ] Incluir datos completos del cliente y servicio

### FASE 2: FRONTEND - SERVICIOS Y HOOKS 🔧

#### 2.1 Nuevos Servicios API
```javascript
// frontend/src/services/api.js

// AGREGAR a salesService:
getDetailedSales: (barberId, startDate, endDate) => {
  const params = new URLSearchParams({ startDate, endDate });
  return api.get(`/sales/barber/${barberId}/detailed?${params}`, true, 300000);
},

getDetailedWalkIns: (barberId, startDate, endDate) => {
  const params = new URLSearchParams({ startDate, endDate }); 
  return api.get(`/walk-ins/barber/${barberId}/detailed?${params}`, true, 300000);
},

// AGREGAR a appointmentsService:
getCompletedAppointments: (barberId, startDate, endDate) => {
  const params = new URLSearchParams({ startDate, endDate });
  return api.get(`/appointments/barber/${barberId}/completed?${params}`, true, 300000);
}
```

**IMPLEMENTAR:**
- [ ] Agregar métodos a `salesService` y `appointmentsService`
- [ ] Manejar parámetros de fecha correctamente
- [ ] Incluir timeout apropiado para consultas largas

#### 2.2 Hook Mejorado para Datos Detallados
```javascript
// frontend/src/hooks/useDetailedBarberStats.js
export const useDetailedBarberStats = () => {
  const [detailedData, setDetailedData] = useState({});
  const [loading, setLoading] = useState(false);
  
  const loadDetailedData = async (barberId, filterType, filterDate) => {
    setLoading(true);
    try {
      const { startDate, endDate } = calculateDateRange(filterType, filterDate);
      
      const [salesResponse, walkInsResponse, appointmentsResponse] = await Promise.all([
        salesService.getDetailedSales(barberId, startDate, endDate),
        salesService.getDetailedWalkIns(barberId, startDate, endDate), 
        appointmentsService.getCompletedAppointments(barberId, startDate, endDate)
      ]);
      
      setDetailedData(prev => ({
        ...prev,
        [barberId]: {
          sales: salesResponse?.data || {},
          walkIns: walkInsResponse?.data || {},
          appointments: appointmentsResponse?.data || {}
        }
      }));
    } catch (error) {
      console.error('Error loading detailed data:', error);
    } finally {
      setLoading(false);
    }
  };
  
  return { detailedData, loading, loadDetailedData };
};
```

**IMPLEMENTAR:**
- [ ] Crear nuevo hook `useDetailedBarberStats`
- [ ] Implementar `calculateDateRange` para convertir filtros a fechas
- [ ] Manejar estados de loading y error
- [ ] Cache inteligente por barbero

### FASE 3: FRONTEND - MODALES DETALLADOS 📋

#### 3.1 Modal de Ventas (Productos)
```jsx
// Mostrar productos vendidos día por día
const SalesDetailModal = ({ barberId, dateRange }) => {
  const { sales } = detailedData[barberId] || {};
  
  return (
    <div className="modal">
      <h2>Ventas - {barberName}</h2>
      <p>Período: {dateRange}</p>
      
      {/* Resumen */}
      <div className="summary">
        <div>Total Productos: {sales.totalProducts}</div>
        <div>Total Ventas: {formatCurrency(sales.totalRevenue)}</div>
      </div>
      
      {/* Por día */}
      {Object.entries(sales.salesByDate || {}).map(([date, dayData]) => (
        <div key={date} className="day-section">
          <h3>{formatDate(date)} - {dayData.dayProductCount} productos - {formatCurrency(dayData.dayTotal)}</h3>
          
          {dayData.products.map((product, index) => (
            <div key={index} className="product-item">
              <div className="product-name">{product.productName}</div>
              <div className="quantity">Cantidad: {product.quantitySold}</div>
              <div className="price">Precio: {formatCurrency(product.unitPrice)}</div>
              <div className="total">Total: {formatCurrency(product.totalPrice)}</div>
              <div className="time">Hora: {formatTime(product.soldAt)}</div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};
```

**IMPLEMENTAR:**
- [ ] Reestructurar modal de ventas completamente
- [ ] Mostrar productos día por día
- [ ] Incluir cantidad, precio unitario, total por producto
- [ ] Resumen por día y total general

#### 3.2 Modal de Cortes (Walk-ins)
```jsx
const CutsDetailModal = ({ barberId, dateRange }) => {
  const { walkIns } = detailedData[barberId] || {};
  
  return (
    <div className="modal">
      <h2>Cortes - {barberName}</h2>
      
      {/* Resumen */}
      <div className="summary">
        <div>Total Cortes: {walkIns.totalCuts}</div>
        <div>Total Ingresos: {formatCurrency(walkIns.totalRevenue)}</div>
      </div>
      
      {/* Por día */}
      {Object.entries(walkIns.cutsByDate || {}).map(([date, dayData]) => (
        <div key={date} className="day-section">
          <h3>{formatDate(date)} - {dayData.dayCutCount} cortes - {formatCurrency(dayData.dayTotal)}</h3>
          
          {dayData.cuts.map((cut, index) => (
            <div key={index} className="cut-item">
              <div className="service">{cut.serviceName}</div>
              <div className="client">{cut.clientName}</div>
              <div className="price">{formatCurrency(cut.price)}</div>
              <div className="duration">{cut.duration} min</div>
              <div className="time">{formatTime(cut.completedAt)}</div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};
```

**IMPLEMENTAR:**
- [ ] Cambiar "Servicios" por "Cortes" en toda la UI
- [ ] Mostrar walk-ins día por día
- [ ] Incluir servicio, cliente, precio, duración
- [ ] Contador de cortes por día

#### 3.3 Modal de Citas Completadas
```jsx
const AppointmentsDetailModal = ({ barberId, dateRange }) => {
  const { appointments } = detailedData[barberId] || {};
  
  return (
    <div className="modal">
      <h2>Citas Completadas - {barberName}</h2>
      
      {/* Resumen */}
      <div className="summary">
        <div>Citas Completadas: {appointments.totalCompleted}</div>
        <div>Total Ingresos: {formatCurrency(appointments.totalRevenue)}</div>
      </div>
      
      {/* Por día */}
      {Object.entries(appointments.appointmentsByDate || {}).map(([date, dayData]) => (
        <div key={date} className="day-section">
          <h3>{formatDate(date)} - {dayData.dayCompletedCount} citas - {formatCurrency(dayData.dayTotal)}</h3>
          
          {dayData.appointments.map((apt, index) => (
            <div key={index} className="appointment-item">
              <div className="client">{apt.clientName}</div>
              <div className="service">{apt.service.name}</div>
              <div className="price">{formatCurrency(apt.service.price)}</div>
              <div className="scheduled">Programada: {formatTime(apt.scheduledAt)}</div>
              <div className="completed">Completada: {formatTime(apt.completedAt)}</div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};
```

**IMPLEMENTAR:**
- [ ] Modal específico para citas completadas
- [ ] Mostrar datos del cliente y servicio
- [ ] Horarios programados vs completados
- [ ] Totales por día

### FASE 4: INTEGRACIÓN Y MEJORAS 🔗

#### 4.1 Actualizar Cards de Barberos
```jsx
// Cambiar labels y obtener datos correctos
<div className="stats-card">
  <div className="ventas">
    <span>Ventas</span>
    <span>{detailedData.sales?.totalProducts || 0} productos</span>
    <span>{formatCurrency(detailedData.sales?.totalRevenue || 0)}</span>
  </div>
  
  <div className="cortes">
    <span>Cortes</span>  {/* CAMBIO: era "Servicios" */}
    <span>{detailedData.walkIns?.totalCuts || 0} cortes</span>
    <span>{formatCurrency(detailedData.walkIns?.totalRevenue || 0)}</span>
  </div>
  
  <div className="citas">
    <span>Citas</span>
    <span>{detailedData.appointments?.totalCompleted || 0} completadas</span>
    <span>{formatCurrency(detailedData.appointments?.totalRevenue || 0)}</span>
  </div>
</div>
```

**IMPLEMENTAR:**
- [ ] Actualizar etiquetas (Servicios → Cortes)
- [ ] Mostrar cantidades reales (productos, cortes, citas)
- [ ] Conectar con datos detallados del hook

#### 4.2 Cargar Datos Detallados al Cambiar Filtros
```javascript
// En AdminBarbers.jsx
useEffect(() => {
  if (filterType !== 'General' && filterDate) {
    barbers.forEach(barber => {
      loadDetailedData(barber._id, filterType, filterDate);
    });
  }
}, [filterType, filterDate, barbers]);
```

**IMPLEMENTAR:**
- [ ] Trigger automático al cambiar filtros
- [ ] Loading states individuales por barbero
- [ ] Error handling y retry logic

## 🎯 PRIORIDADES DE IMPLEMENTACIÓN

### SPRINT 1 (Crítico - 1-2 días)
1. **Backend**: Endpoint ventas detalladas
2. **Backend**: Endpoint walk-ins detallados  
3. **Frontend**: Servicios API nuevos
4. **Frontend**: Modal ventas mejorado

### SPRINT 2 (Alto - 2-3 días)
1. **Backend**: Endpoint citas completadas
2. **Frontend**: Modal cortes (ex-servicios)
3. **Frontend**: Modal citas detallado
4. **Frontend**: Hook datos detallados

### SPRINT 3 (Medio - 1-2 días)
1. **Frontend**: Actualizar cards con datos reales
2. **Frontend**: Integración completa con filtros
3. **Testing**: Verificar todos los flujos
4. **Polish**: UX/UI final

## ✅ CRITERIOS DE ÉXITO

- [ ] Ventas muestran "X productos" real en lugar de "0 productos"
- [ ] Modal ventas muestra producto por producto, día por día
- [ ] "Servicios" cambiado a "Cortes" con datos de walk-ins
- [ ] Modal cortes muestra cantidad de cortes por día
- [ ] Modal citas muestra appointments completadas reales
- [ ] Todos los totales coinciden con transacciones reales
- [ ] Reportes multi-día separados correctamente
- [ ] Performance acceptable (< 3seg carga)

---

**🚀 RESULTADO ESPERADO**: Sistema completo de reportes que muestre datos reales de transacciones, productos vendidos, cortes realizados y citas completadas, todo organizado día por día con totales precisos.
