import mongoose from 'mongoose';

const inventoryLogSchema = new mongoose.Schema({
  action: {
    type: String,
    required: true,
    enum: ['create', 'update', 'delete', 'stock_adjustment']
  },
  itemId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Inventory',
    required: true
  },
  itemName: {
    type: String,
    required: true
  },
  performedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  userRole: {
    type: String,
    required: true,
    enum: ['admin', 'barber']
  },
  details: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  previousState: {
    type: mongoose.Schema.Types.Mixed
  },
  newState: {
    type: mongoose.Schema.Types.Mixed
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Índices para consultas eficientes
inventoryLogSchema.index({ timestamp: -1 });
inventoryLogSchema.index({ performedBy: 1, timestamp: -1 });
inventoryLogSchema.index({ itemId: 1, timestamp: -1 });
inventoryLogSchema.index({ action: 1, timestamp: -1 });

export default mongoose.model('InventoryLog', inventoryLogSchema);
