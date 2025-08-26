const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'El usuario que escribe la reseña es requerido']
  },
  barber: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Barber',
    required: [true, 'El barbero de la reseña es requerido']
  },
  appointment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment',
    required: [true, 'La cita de la reseña es requerida']
  },
  rating: {
    type: Number,
    required: [true, 'El rating es requerido'],
    min: [1, 'El rating mínimo es 1'],
    max: [5, 'El rating máximo es 5']
  },
  comment: {
    type: String,
    maxlength: [1000, 'El comentario no puede exceder los 1000 caracteres']
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Índices compuestos
reviewSchema.index({ user: 1, barber: 1 }, { unique: true });
reviewSchema.index({ barber: 1, rating: 1 });
reviewSchema.index({ appointment: 1 }, { unique: true });

// Middleware para actualizar el rating promedio del barbero
reviewSchema.post('save', async function() {
  const Barber = mongoose.model('Barber');
  const reviews = await this.constructor.find({ barber: this.barber, isActive: true });
  
  const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
  const averageRating = reviews.length > 0 ? totalRating / reviews.length : 0;
  
  await Barber.findByIdAndUpdate(this.barber, {
    'rating.average': averageRating,
    'rating.count': reviews.length
  });
});

module.exports = mongoose.model('Review', reviewSchema);