import mongoose from 'mongoose';

const inventorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'El nombre del producto es requerido'],
    trim: true,
    maxlength: [100, 'El nombre no puede exceder los 100 caracteres'],
    unique: true
  },
  description: {
    type: String,
    maxlength: [500, 'La descripción no puede exceder los 500 caracteres']
  },
  cantidad_inicial: {
    type: Number,
    required: [true, 'La cantidad inicial es requerida'],
    min: [0, 'La cantidad no puede ser negativa']
  },
  entradas: {
    type: Number,
    default: 0,
    min: [0, 'Las entradas no pueden ser negativas']
  },
  salidas: {
    type: Number,
    default: 0,
    min: [0, 'Las salidas no pueden ser negativas']
  },
  cantidad_actual: {
    type: Number,
    required: [true, 'La cantidad actual es requerida'],
    min: [0, 'La cantidad no puede ser negativa']
  },
  unidad: {
    type: String,
    required: [true, 'La unidad es requerida'],
    enum: ['ml', 'g', 'unidades', 'otros'],
    default: 'unidades'
  },
  tipo: {
    type: String,
    required: [true, 'El tipo es requerido'],
    enum: ['insumo', 'producto_final'],
    default: 'insumo'
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

inventorySchema.index({ isActive: 1 });

export default mongoose.model('Inventory', inventorySchema);
