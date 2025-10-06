import mongoose from 'mongoose';

/**
 * Esquema centralizado de métodos de pago
 * Gestiona todos los métodos de pago de la aplicación de forma unificada
 */
const paymentMethodSchema = new mongoose.Schema({
  // ID único para el backend (usado en BD)
  backendId: {
    type: String,
    required: [true, 'El ID del backend es requerido'],
    unique: true,
    trim: true,
    lowercase: true
  },
  
  // Nombre amigable para mostrar al usuario
  name: {
    type: String,
    required: [true, 'El nombre es requerido'],
    trim: true,
    maxlength: [50, 'El nombre no puede exceder 50 caracteres']
  },
  
  // Descripción detallada
  description: {
    type: String,
    trim: true,
    maxlength: [200, 'La descripción no puede exceder 200 caracteres']
  },
  
  // Color para la interfaz (hexadecimal)
  color: {
    type: String,
    default: '#6b7280',
    match: [/^#[0-9A-F]{6}$/i, 'El color debe ser un hexadecimal válido']
  },
  
  // Emoji para mostrar en la interfaz
  emoji: {
    type: String,
    default: '💳'
  },
  
  // Categoría del método de pago
  category: {
    type: String,
    enum: ['cash', 'digital', 'card', 'transfer', 'other'],
    default: 'digital'
  },
  
  // Si está activo o no
  isActive: {
    type: Boolean,
    default: true
  },
  
  // Si es un método del sistema (no se puede eliminar)
  isSystem: {
    type: Boolean,
    default: false
  },
  
  // Orden para mostrar en las interfaces
  displayOrder: {
    type: Number,
    default: 100
  },
  
  // Aliases (otros nombres que puede tener este método)
  aliases: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  
  // Configuración adicional específica del método
  config: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true,
  collection: 'paymentmethods'
});

// Índices para optimización
paymentMethodSchema.index({ backendId: 1 });
paymentMethodSchema.index({ isActive: 1 });
paymentMethodSchema.index({ displayOrder: 1 });
paymentMethodSchema.index({ aliases: 1 });

// Middleware para normalizar backendId antes de guardar
paymentMethodSchema.pre('save', function(next) {
  if (this.isModified('backendId')) {
    this.backendId = this.backendId.toLowerCase().trim();
  }
  next();
});

// Método estático para buscar por backendId o alias
paymentMethodSchema.statics.findByIdOrAlias = function(identifier) {
  const normalizedId = identifier?.toLowerCase().trim();
  return this.findOne({
    $or: [
      { backendId: normalizedId },
      { aliases: normalizedId }
    ],
    isActive: true
  });
};

// Método estático para obtener todos los métodos activos ordenados
paymentMethodSchema.statics.getActiveOrderedMethods = function() {
  return this.find({ isActive: true })
    .sort({ displayOrder: 1, name: 1 })
    .lean();
};

// Método estático para normalizar un método de pago desde string
paymentMethodSchema.statics.normalizePaymentMethod = async function(paymentMethodString) {
  if (!paymentMethodString || paymentMethodString === 'null' || paymentMethodString === 'undefined') {
    return 'cash'; // Fallback por defecto
  }
  
  const normalized = paymentMethodString.toLowerCase().trim();
  
  // Buscar método exacto o por alias
  const method = await this.findByIdOrAlias(normalized);
  if (method) {
    return method.backendId;
  }
  
  // Mapeo manual para casos especiales
  const manualMapping = {
    'efectivo': 'cash',
    'debit': 'tarjeta',
    'credit': 'tarjeta',
    'transfer': 'bancolombia', // Asumir transferencia bancaria
    'digital': 'digital',
    'null': 'cash',
    'undefined': 'cash'
  };
  
  return manualMapping[normalized] || normalized;
};

// Método de instancia para obtener datos para el frontend
paymentMethodSchema.methods.toFrontendFormat = function() {
  return {
    id: this.backendId,
    backendId: this.backendId,
    name: this.name,
    description: this.description,
    color: this.color,
    emoji: this.emoji,
    category: this.category,
    isSystem: this.isSystem
  };
};

export default mongoose.model('PaymentMethod', paymentMethodSchema);