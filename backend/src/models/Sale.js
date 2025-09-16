import mongoose from 'mongoose';

// Schema para items individuales dentro de una venta
const saleItemSchema = new mongoose.Schema({
  // Información del producto (opcional para walk-ins)
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Inventory',
    required: function() { return this.type !== 'walkIn'; }
  },
  productName: {
    type: String,
    required: function() { return this.type !== 'walkIn'; }
  },

  // Información del servicio (para walk-ins)
  serviceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service',
    required: function() { return this.type === 'walkIn'; }
  },
  serviceName: {
    type: String,
    required: function() { return this.type === 'walkIn'; }
  },

  // Tipo de item
  type: {
    type: String,
    enum: ['product', 'walkIn'],
    required: true
  },
  
  // Información del item
  quantity: {
    type: Number,
    required: [true, 'La cantidad es requerida'],
    min: [1, 'La cantidad debe ser mayor a 0']
  },
  unitPrice: {
    type: Number,
    required: [true, 'El precio unitario es requerido'],
    min: [0, 'El precio no puede ser negativo']
  },
  totalAmount: {
    type: Number,
    required: [true, 'El total es requerido'],
    min: [0, 'El total no puede ser negativo']
  },
  
  // Método de pago para este item específico
  paymentMethod: {
    type: String,
    enum: ['efectivo', 'nequi', 'nu', 'daviplata', 'tarjeta', 'transferencia'],
    default: 'efectivo'
  }
}, { _id: true });

const saleSchema = new mongoose.Schema({
  // Items de la venta (puede ser múltiples productos/servicios)
  items: {
    type: [saleItemSchema],
    required: [true, 'Al menos un item es requerido'],
    validate: {
      validator: function(items) {
        return items && items.length > 0;
      },
      message: 'Debe haber al menos un item en la venta'
    }
  },

  // Total general de la venta
  totalAmount: {
    type: Number,
    required: [true, 'El total es requerido'],
    min: [0, 'El total no puede ser negativo']
  },

  // Resumen por métodos de pago
  paymentSummary: {
    efectivo: { type: Number, default: 0 },
    nequi: { type: Number, default: 0 },
    nu: { type: Number, default: 0 },
    daviplata: { type: Number, default: 0 },
    tarjeta: { type: Number, default: 0 },
    transferencia: { type: Number, default: 0 }
  },
  
  // Información del barbero que realizó la venta
  barberId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Barber',
    required: [true, 'El barbero es requerido']
  },
  barberName: {
    type: String,
    required: [true, 'El nombre del barbero es requerido']
  },
  
  // Información del cliente (opcional)
  customerName: {
    type: String,
    trim: true
  },
  
  // Notas adicionales
  notes: {
    type: String,
    trim: true
  },
  
  // Fecha y hora de la venta
  saleDate: {
    type: Date,
    default: Date.now
  },
  
  // Estado de la venta
  status: {
    type: String,
    enum: ['completed', 'cancelled', 'refunded'],
    default: 'completed'
  }
}, {
  timestamps: true
});

// Índices para optimizar consultas
saleSchema.index({ barberId: 1, saleDate: -1 });
saleSchema.index({ 'items.productId': 1, saleDate: -1 });
saleSchema.index({ saleDate: -1 });

// Método virtual para obtener la fecha sin hora
saleSchema.virtual('saleDateOnly').get(function() {
  return this.saleDate.toISOString().split('T')[0];
});

// Método pre-save para calcular totales automáticamente
saleSchema.pre('save', function(next) {
  // Calcular total de cada item
  this.items.forEach(item => {
    item.totalAmount = item.quantity * item.unitPrice;
  });

  // Calcular total general
  this.totalAmount = this.items.reduce((total, item) => total + item.totalAmount, 0);

  // Calcular resumen por métodos de pago
  const summary = {
    efectivo: 0,
    nequi: 0,
    nu: 0,
    daviplata: 0,
    tarjeta: 0,
    transferencia: 0
  };

  this.items.forEach(item => {
    const method = item.paymentMethod || 'efectivo';
    summary[method] = (summary[method] || 0) + item.totalAmount;
  });

  this.paymentSummary = summary;

  next();
});

const Sale = mongoose.model('Sale', saleSchema);

export default Sale;
