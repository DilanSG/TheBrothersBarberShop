const mongoose = require('mongoose');

const barberSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'El usuario del barbero es requerido']
  },
  specialty: {
    type: String,
    required: [true, 'La especialidad del barbero es requerida'],
    trim: true,
    maxlength: [100, 'La especialidad no puede exceder los 100 caracteres']
  },
  experience: {
    type: Number, // en años
    min: [0, 'La experiencia no puede ser negativa'],
    default: 0
  },
  description: {
    type: String,
    maxlength: [500, 'La descripción no puede exceder los 500 caracteres']
  },
  services: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service'
  }],
  schedule: {
    monday: { start: String, end: String, available: Boolean },
    tuesday: { start: String, end: String, available: Boolean },
    wednesday: { start: String, end: String, available: Boolean },
    thursday: { start: String, end: String, available: Boolean },
    friday: { start: String, end: String, available: Boolean },
    saturday: { start: String, end: String, available: Boolean },
    sunday: { start: String, end: String, available: Boolean }
  },
  rating: {
    average: {
      type: Number,
      default: 0,
      min: [0, 'El rating no puede ser menor a 0'],
      max: [5, 'El rating no puede ser mayor a 5']
    },
    count: {
      type: Number,
      default: 0
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  photo: {
    public_id: String,
    url: String
  }
}, {
  timestamps: true
});

// Índices
barberSchema.index({ user: 1 }, { unique: true });
barberSchema.index({ isActive: 1 });
barberSchema.index({ specialty: 1 });
barberSchema.index({ 'rating.average': -1 });

// Virtual para años de experiencia formateados
barberSchema.virtual('experienceFormatted').get(function() {
  if (this.experience === 0) return 'Sin experiencia';
  if (this.experience === 1) return '1 año de experiencia';
  return `${this.experience} años de experiencia`;
});

module.exports = mongoose.model('Barber', barberSchema);