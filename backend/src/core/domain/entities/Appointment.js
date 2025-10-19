import mongoose from 'mongoose';

const appointmentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'El usuario de la cita es requerido']
    // Nota: No necesita index: true porque ya existe índice compuesto { user: 1, date: 1 }
  },
  barber: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Barber',
    required: [true, 'El barbero de la cita es requerido']
  },
  service: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service',
    required: [true, 'El servicio de la cita es requerido']
  },
  date: {
    type: Date,
    required: [true, 'La fecha de la cita es requerida']
  },
  duration: {
    type: Number, // en minutos
    required: [true, 'La duración de la cita es requerida']
  },
  status: {
    type: String,
    enum: {
      values: ['pending', 'confirmed', 'completed', 'cancelled', 'no_show'],
      message: 'Estado no válido'
    },
    default: 'pending'
  },
  price: {
    type: Number,
    required: [true, 'El precio de la cita es requerido']
  },
  paymentMethod: {
    type: String,
    required: false, // Solo requerido cuando status es 'completed'
    validate: {
      validator: function(value) {
        // Solo validar cuando el status es 'completed'
        if (this.status === 'completed' && !value) {
          return false;
        }
        return true;
      },
      message: 'El método de pago es requerido para citas completadas'
    }
  },
  notes: {
    type: String,
    maxlength: [500, 'Las notas no pueden exceder los 500 caracteres']
  },
  totalRevenue: {
    type: Number,
    required: false, // Solo se establece cuando la cita se completa
    min: [0, 'El revenue total no puede ser negativo']
  },
  cancellationReason: {
    type: String,
    maxlength: [500, 'El motivo de cancelación no puede exceder los 500 caracteres']
  },
  // Quien canceló la cita
  cancelledBy: {
    type: String,
    enum: ['user', 'barber', 'admin'],
    default: null
  },
  // Timestamp de cuando se canceló
  cancelledAt: {
    type: Date,
    default: null
  },
  // Para citas confirmadas: si requiere aprobación del otro rol
  requiresCancellationApproval: {
    type: Boolean,
    default: false
  },
  // Para notificar al otro rol sobre la cancelación
  cancellationNotified: {
    type: Boolean,
    default: false
  },
  reminderSent: {
    type: Boolean,
    default: false
  },
  // Campos para eliminación suave por rol
  deletedBy: {
    user: {
      type: Boolean,
      default: false
    },
    barber: {
      type: Boolean,
      default: false
    },
    admin: {
      type: Boolean,
      default: false
    }
  },
  // Timestamp de cuándo se marcó para eliminación
  markedForDeletion: {
    type: Date,
    default: null
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Índices compuestos para mejor performance
appointmentSchema.index({ user: 1, date: 1 });
appointmentSchema.index({ barber: 1, date: 1 });
appointmentSchema.index({ status: 1, date: 1 });
appointmentSchema.index({ date: 1 });

// Virtual para verificar si la cita está en el pasado
appointmentSchema.virtual('isPast').get(function() {
  return this.date < new Date();
});

// Virtual para verificar si la cita puede ser cancelada
appointmentSchema.virtual('canBeCancelled').get(function() {
  const now = new Date();
  const appointmentTime = new Date(this.date);
  const hoursDifference = (appointmentTime - now) / (1000 * 60 * 60);
  return hoursDifference > 2; // Puede cancelar con más de 2 horas de anticipación
});

// Virtual para verificar si todos los roles han marcado la cita para eliminar
appointmentSchema.virtual('shouldBeDeleted').get(function() {
  return this.deletedBy.user && this.deletedBy.barber && this.deletedBy.admin;
});

// Virtual para verificar si la cita tiene una reseña
appointmentSchema.virtual('review', {
  ref: 'Review',
  localField: '_id',
  foreignField: 'appointment',
  justOne: true
});

// Middleware para validar que la fecha sea futura (solo para citas nuevas en estado pending)
appointmentSchema.pre('save', function(next) {
  // Solo validar fecha futura si es una cita nueva Y está en estado 'pending'
  if (this.isNew && this.status === 'pending' && this.date <= new Date()) {
    next(new Error('La cita debe ser en una fecha futura'));
  } else {
    next();
  }
});

export default mongoose.model('Appointment', appointmentSchema);