import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'El usuario es requerido']
    // Índice individual no necesario - solo compuesto con createdAt
  },
  barber: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Barber',
    required: [true, 'El barbero es requerido']
    // Índice individual no necesario - solo compuesto con createdAt
  },
  appointment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment',
    required: [true, 'La cita es requerida'],
    unique: true, // Una review por cita
    index: true
  },
  rating: {
    type: Number,
    required: [true, 'La calificación es requerida'],
    min: [1, 'La calificación mínima es 1'],
    max: [5, 'La calificación máxima es 5'],
    validate: {
      validator: Number.isInteger,
      message: 'El rating debe ser un número entero entre 1 y 5'
    }
  },
  comment: {
    type: String,
    maxlength: [500, 'El comentario no puede exceder los 500 caracteres'],
    trim: true,
    default: ''
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'approved'
  }
}, {
  timestamps: true,
  collection: 'reviews'
});

// Índices para búsquedas rápidas
reviewSchema.index({ barber: 1, createdAt: -1 });
reviewSchema.index({ user: 1, createdAt: -1 });

// Método estático: Calcular rating promedio de un barbero
reviewSchema.statics.calculateBarberRating = async function(barberId) {
  const result = await this.aggregate([
    { 
      $match: { 
        barber: new mongoose.Types.ObjectId(barberId), 
        status: 'approved' 
      } 
    },
    { 
      $group: { 
        _id: null,
        averageRating: { $avg: '$rating' },
        totalReviews: { $sum: 1 }
      } 
    }
  ]);

  if (result.length > 0) {
    return {
      averageRating: Math.round(result[0].averageRating * 10) / 10, // Redondear a 1 decimal
      totalReviews: result[0].totalReviews
    };
  }

  return { averageRating: 0, totalReviews: 0 };
};

// Middleware: Actualizar rating del barbero después de crear/actualizar review
reviewSchema.post('save', async function(doc) {
  try {
    const Barber = mongoose.model('Barber');
    const stats = await doc.constructor.calculateBarberRating(doc.barber);
    
    await Barber.findByIdAndUpdate(doc.barber, {
      averageRating: stats.averageRating,
      totalReviews: stats.totalReviews
    });
  } catch (error) {
    console.error('Error actualizando rating del barbero:', error);
  }
});

// Middleware: Actualizar rating del barbero después de eliminar review
reviewSchema.post('findOneAndDelete', async function(doc) {
  if (doc) {
    try {
      const Barber = mongoose.model('Barber');
      const stats = await doc.constructor.calculateBarberRating(doc.barber);
      
      await Barber.findByIdAndUpdate(doc.barber, {
        averageRating: stats.averageRating,
        totalReviews: stats.totalReviews
      });
    } catch (error) {
      console.error('Error actualizando rating del barbero:', error);
    }
  }
});

export default mongoose.model('Review', reviewSchema);