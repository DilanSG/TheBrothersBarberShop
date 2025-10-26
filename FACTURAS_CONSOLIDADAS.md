# 🧾 Sistema de Facturas Consolidadas por Barbero

## 📋 Resumen de Implementación

Se agregó un sistema completo de generación de facturas consolidadas que permite a los administradores generar facturas que agrupan múltiples transacciones de un barbero en un período específico basado en los filtros aplicados.

---

## ✨ Características Principales

### 🎯 Funcionalidad
- **Botón de factura en cada tarjeta de barbero** - Icono de recibo en la esquina superior derecha
- **Respeta los filtros aplicados** - La factura consolida datos según el período seleccionado:
  - General (todos los registros)
  - 1 día (hoy)
  - 7 días (última semana)
  - 15 días (últimas 2 semanas)
  - 30 días (último mes)
  - Fecha personalizada (si se seleccionó)
- **Factura HTML responsive** - Se abre en nueva ventana con opción de imprimir
- **Detalle completo** - Incluye ventas de productos, cortes walk-in y citas completadas

---

## 🎨 Interfaz de Usuario (Frontend)

### Ubicación del Botón
```
┌─────────────────────────────────┐
│  [🧾]                           │  ← Botón de factura (top-right)
│                                 │
│  👤 Foto + Nombre del Barbero   │
│                                 │
│  📊 Estadísticas...             │
└─────────────────────────────────┘
```

### Modificaciones en `AdminBarbers.jsx`

#### 1. Importación de icono
```javascript
import { ..., Receipt } from 'lucide-react';
```

#### 2. Botón agregado a `BarberStatsCard`
```javascript
<button
  onClick={() => onGenerateInvoice(barber._id)}
  className="absolute top-4 right-4 z-30 p-2.5 bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/30 rounded-lg hover:from-blue-600/30 hover:to-purple-600/30 hover:border-blue-500/50 transition-all duration-300 hover:scale-110 shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 group/invoice"
  title="Generar factura consolidada del período"
>
  <Receipt className="w-5 h-5 text-blue-400 group-hover/invoice:text-blue-300" />
</button>
```

#### 3. Función de generación
```javascript
const handleGenerateConsolidatedInvoice = async (barberId) => {
  const barber = barbers.find(b => b._id === barberId);
  const barberName = barber?.user?.name || barber?.name || 'Barbero';
  
  let startDateStr, endDateStr;
  
  if (selectedDayRange === 'general') {
    // Todos los registros
    window.open(`/api/v1/invoices/consolidated/${barberId}`, '_blank');
    return;
  }
  
  // Calcular fechas del filtro actual
  const todayStr = getTodayLocalDate();
  const endDate = selectedEndDate ? new Date(selectedEndDate + 'T12:00:00') : new Date(todayStr + 'T12:00:00');
  const startDate = new Date(endDate);
  startDate.setDate(endDate.getDate() - (selectedDayRange - 1));
  
  startDateStr = startDate.toISOString().split('T')[0];
  endDateStr = endDate.toISOString().split('T')[0];
  
  // Abrir factura en nueva ventana
  const invoiceUrl = `/api/v1/invoices/consolidated/${barberId}?startDate=${startDateStr}&endDate=${endDateStr}`;
  window.open(invoiceUrl, '_blank');
};
```

#### 4. Props adicionales pasadas al componente
```javascript
<BarberStatsCard
  {...existingProps}
  selectedDayRange={selectedDayRange}
  selectedEndDate={selectedEndDate}
  onGenerateInvoice={handleGenerateConsolidatedInvoice}
/>
```

---

## ⚙️ Backend (API)

### Endpoint Nuevo

**Ruta:** `GET /api/v1/invoices/consolidated/:barberId`

**Query Parameters:**
- `startDate` (opcional): Fecha de inicio en formato YYYY-MM-DD
- `endDate` (opcional): Fecha de fin en formato YYYY-MM-DD

**Respuesta:** HTML de la factura consolidada

### Controlador: `generateConsolidatedInvoice`

#### Flujo de Operación:

1. **Validación**
   - Verifica que el barbero exista
   - Construye filtros de fecha si se proporcionan

2. **Recolección de Datos**
   ```javascript
   // Ventas del barbero (excluyendo canceladas)
   const sales = await Sale.find({
     barberId: barberId,
     status: { $ne: 'cancelled' },
     ...dateFilter
   }).sort({ createdAt: -1 }).lean();

   // Citas completadas
   const appointments = await Appointment.find({
     barber: barberId,
     status: 'completed',
     ...(dateFilter.createdAt && { date: dateFilter.createdAt })
   }).populate('service', 'name basePrice').sort({ date: -1 }).lean();
   ```

3. **Cálculo de Totales**
   ```javascript
   const salesTotal = sales.reduce((sum, sale) => {
     if (sale.type === 'walkIn') {
       return sum + (sale.servicePrice || 0);
     }
     return sum + (sale.total || 0);
   }, 0);

   const appointmentsTotal = appointments.reduce((sum, apt) => {
     return sum + (apt.finalPrice || apt.service?.basePrice || 0);
   }, 0);

   const grandTotal = salesTotal + appointmentsTotal;
   ```

4. **Agrupación**
   - Ventas de productos (`type: 'product'`)
   - Cortes walk-in (`type: 'walkIn'`)
   - Citas completadas

5. **Generación HTML**
   - Diseño moderno y responsive
   - Gradientes morado-azul
   - Botón de impresión flotante
   - Tablas detalladas por tipo de transacción

---

## 🎨 Diseño de la Factura HTML

### Secciones

1. **Header**
   - Título "FACTURA CONSOLIDADA"
   - Número de factura único

2. **Información del Barbero**
   - Nombre
   - Email
   - Teléfono
   - Período facturado

3. **Resumen de Ingresos** (Cards con totales)
   - 🛒 Ventas de Productos
   - ✂️ Cortes Walk-In
   - 📅 Citas Completadas
   - 💰 TOTAL CONSOLIDADO

4. **Detalles por Tipo** (Tablas expandidas)
   - Tabla de ventas de productos
   - Tabla de cortes walk-in
   - Tabla de citas completadas

5. **Footer**
   - Nombre del negocio
   - Fecha de generación
   - Usuario que generó la factura

### Características Visuales

- **Colores:** Gradiente azul-morado (#667eea → #764ba2)
- **Tipografía:** Courier New (monospace)
- **Responsive:** Grid adaptativo (2 columnas → 1 columna en móvil)
- **Impresión:** Estilos optimizados para `@media print`
- **Botón flotante:** "🖨️ Imprimir Factura" (bottom-right, se oculta al imprimir)

---

## 📊 Estructura de Datos

### Objeto `invoiceData`
```javascript
{
  invoiceNumber: "CONS-f871fc-1730000000000",
  barber: {
    name: "Alex Fernández",
    email: "alex.fernandez@barbershop.com",
    phone: "+57 300 123 4567"
  },
  period: {
    startDate: "2025-10-01",
    endDate: "2025-10-26"
  },
  summary: {
    productSales: {
      count: 25,
      total: 450000
    },
    walkInSales: {
      count: 40,
      total: 800000
    },
    appointments: {
      count: 15,
      total: 375000
    },
    grandTotal: 1625000
  },
  details: {
    productSales: [/* array de ventas */],
    walkInSales: [/* array de cortes */],
    appointments: [/* array de citas */]
  },
  generatedAt: "2025-10-26T...",
  generatedBy: "Admin Name"
}
```

---

## 🔒 Seguridad y Validación

### Protecciones Implementadas:
- ✅ Autenticación requerida (`protect` middleware)
- ✅ Solo barberos y admins pueden generar (`barberAuth`)
- ✅ Validación de barberId (404 si no existe)
- ✅ Filtrado de ventas canceladas
- ✅ Solo citas completadas se incluyen
- ✅ Logging de todas las generaciones

---

## 🧪 Casos de Uso

### Caso 1: Factura del Día
```
Usuario selecciona: "1 día"
Resultado: Factura con transacciones de hoy
URL: /api/v1/invoices/consolidated/{barberId}?startDate=2025-10-26&endDate=2025-10-26
```

### Caso 2: Factura Semanal
```
Usuario selecciona: "7 días"
Resultado: Factura de últimos 7 días
URL: /api/v1/invoices/consolidated/{barberId}?startDate=2025-10-20&endDate=2025-10-26
```

### Caso 3: Factura General
```
Usuario selecciona: "General"
Resultado: Factura con TODOS los registros del barbero
URL: /api/v1/invoices/consolidated/{barberId}
```

### Caso 4: Fecha Personalizada
```
Usuario selecciona: "30 días" + Fecha específica (2025-10-15)
Resultado: Factura desde 2025-09-16 hasta 2025-10-15
URL: /api/v1/invoices/consolidated/{barberId}?startDate=2025-09-16&endDate=2025-10-15
```

---

## 📁 Archivos Modificados

### Frontend (1 archivo)
- ✅ `frontend/src/features/admin/AdminBarbers.jsx`
  - Importación de `Receipt` icon
  - Botón en `BarberStatsCard`
  - Función `handleGenerateConsolidatedInvoice`
  - Props adicionales al componente
  - Import de `showInfo` notification

### Backend (2 archivos)
- ✅ `backend/src/presentation/controllers/invoiceController.js`
  - Función `generateConsolidatedInvoice` (controller)
  - Función `generateConsolidatedInvoiceHTML` (helper)

- ✅ `backend/src/presentation/routes/invoices.js`
  - Ruta `GET /consolidated/:barberId`

---

## 🎯 Beneficios

### Para Administradores:
- ✅ **Visibilidad completa** - Ver ingresos consolidados por barbero
- ✅ **Flexibilidad temporal** - Cualquier período personalizado
- ✅ **Documentación profesional** - Facturas imprimibles y guardables
- ✅ **Análisis rápido** - Desglose por tipo de transacción

### Para el Negocio:
- ✅ **Transparencia** - Registro claro de todas las transacciones
- ✅ **Contabilidad facilitada** - Exportación de datos por período
- ✅ **Auditoría** - Trazabilidad de quién generó cada factura
- ✅ **Reportes profesionales** - Presentación visual moderna

---

## 🚀 Próximas Mejoras Sugeridas

1. **Exportar a PDF** - Botón para descargar PDF además de HTML
2. **Envío por email** - Opción de enviar factura por correo
3. **Comparación de períodos** - Factura comparativa de 2 períodos
4. **Factura por método de pago** - Desglose adicional por payment method
5. **Gráficos visuales** - Charts de distribución de ingresos
6. **Filtro por rango de horas** - Facturas de turnos específicos
7. **Facturas programadas** - Generación automática semanal/mensual
8. **Firmas digitales** - Validación criptográfica de facturas

---

**Implementado:** Octubre 26, 2025
**Versión:** 1.0.0
**Estado:** ✅ Listo para producción
