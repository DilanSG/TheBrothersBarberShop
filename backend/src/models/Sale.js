import mongoose from 'mongoose';

const saleSchema = new mongoose.Schema({
  // Información del producto vendido (opcional para walk-ins)
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

  // Tipo de venta
  type: {
    type: String,
    enum: ['product', 'walkIn'],
    default: 'product'
  },
  
  // Información de la venta
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
  },
  
  // Método de pago (para futuras expansiones)
  paymentMethod: {
    type: String,
    enum: ['cash', 'card', 'transfer', 'other'],
    default: 'cash'
  }
}, {
  timestamps: true
});

// Índices para optimizar consultas
saleSchema.index({ barberId: 1, saleDate: -1 });
saleSchema.index({ productId: 1, saleDate: -1 });
saleSchema.index({ saleDate: -1 });

// Método virtual para obtener la fecha sin hora
saleSchema.virtual('saleDateOnly').get(function() {
  return this.saleDate.toISOString().split('T')[0];
});

// Método para calcular el total automáticamente
saleSchema.pre('save', function(next) {
  this.totalAmount = this.quantity * this.unitPrice;
  next();
});

const Sale = mongoose.model('Sale', saleSchema);

export default Sale;
