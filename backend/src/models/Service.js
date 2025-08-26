const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'El nombre del servicio es requerido'],
    trim: true,
    maxlength: [100, 'El nombre no puede exceder los 100 caracteres'],
    unique: true
  },
  description: {
    type: String,
    required: [true, 'La descripción del servicio es requerida'],
    maxlength: [500, 'La descripción no puede exceder los 500 caracteres']
  },
  price: {
    type: Number,
    required: [true, 'El precio del servicio es requerido'],
    min: [0, 'El precio no puede ser negativo']
  },
  duration: {
    type: Number, // en minutos
    required: [true, 'La duración del servicio es requerida'],
    min: [15, 'La duración mínima es 15 minutos'],
    max: [240, 'La duración máxima es 4 horas']
  },
  category: {
    type: String,
    required: [true, 'La categoría del servicio es requerida'],
    enum: {
      values: ['corte', 'barba', 'combo', 'tinte', 'tratamiento'],
      message: 'Categoría no válida'
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  image: {
    public_id: String,
    url: String
  }
}, {
  timestamps: true
});

// Índices para mejor performance
serviceSchema.index({ name: 1 });
serviceSchema.index({ category: 1 });
serviceSchema.index({ isActive: 1 });

module.exports = mongoose.model('Service', serviceSchema);