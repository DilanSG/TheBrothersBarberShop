import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'El usuario es requerido']
  },
  barber: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Barber',
    required: [true, 'El barbero es requerido']
  },
  appointment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment',
    required: [true, 'La cita es requerida']
  },
  rating: {
    type: Number,
    required: [true, 'La calificación es requerida'],
    min: [1, 'La calificación mínima es 1'],
    max: [5, 'La calificación máxima es 5']
  },
  comment: {
    type: String,
    maxlength: [500, 'El comentario no puede exceder los 500 caracteres']
  }
}, {
  timestamps: true
});

// Índices para búsquedas rápidas
reviewSchema.index({ barber: 1, createdAt: -1 });
reviewSchema.index({ user: 1, barber: 1 }, { unique: true });

export default mongoose.model('Review', reviewSchema);