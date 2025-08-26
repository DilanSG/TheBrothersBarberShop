const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'El usuario de la cita es requerido']
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
  notes: {
    type: String,
    maxlength: [500, 'Las notas no pueden exceder los 500 caracteres']
  },
  cancellationReason: {
    type: String,
    maxlength: [500, 'El motivo de cancelación no puede exceder los 500 caracteres']
  },
  reminderSent: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
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

// Middleware para validar que la fecha sea futura
appointmentSchema.pre('save', function(next) {
  if (this.date <= new Date()) {
    next(new Error('La cita debe ser en una fecha futura'));
  } else {
    next();
  }
});

module.exports = mongoose.model('Appointment', appointmentSchema);