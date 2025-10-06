import mongoose from 'mongoose';

const inventorySnapshotSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: [true, 'La fecha es requerida'],
    default: Date.now
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'El usuario que creó el snapshot es requerido']
  },
  items: [{
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Inventory',
      required: true
    },
    productName: {
      type: String,
      required: true
    },
    category: String,
    initialStock: {
      type: Number,
      default: 0
    },
    entries: {
      type: Number,
      default: 0
    },
    exits: {
      type: Number,
      default: 0
    },
    sales: {
      type: Number,
      default: 0
    },
    expectedStock: {
      type: Number,
      required: true
    },
    realStock: {
      type: Number,
      required: true,
      min: 0
    },
    difference: {
      type: Number,
      required: true
    },
    notes: String
  }],
  totalItems: {
    type: Number,
    default: 0
  },
  totalDifference: {
    type: Number,
    default: 0
  },
  notes: String
}, {
  timestamps: true
});

// Middleware para calcular totales antes de guardar
inventorySnapshotSchema.pre('save', function(next) {
  this.totalItems = this.items.length;
  this.totalDifference = this.items.reduce((sum, item) => sum + item.difference, 0);
  next();
});

// Índices para optimizar consultas
inventorySnapshotSchema.index({ date: -1 });
inventorySnapshotSchema.index({ createdBy: 1 });

const InventorySnapshot = mongoose.model('InventorySnapshot', inventorySnapshotSchema);

export default InventorySnapshot;
