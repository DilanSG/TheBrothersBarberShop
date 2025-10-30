import mongoose from 'mongoose';

const socioSchema = new mongoose.Schema({
  // Referencia al usuario admin que tendrá el subrol de socio
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'La referencia al usuario es requerida'],
    unique: true
  },
  nombre: {
    type: String,
    required: [true, 'El nombre es requerido'],
    trim: true,
    maxlength: [100, 'El nombre no puede exceder 100 caracteres']
  },
  email: {
    type: String,
    required: [true, 'El email es requerido'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      'Por favor ingrese un email válido'
    ]
  },
  porcentaje: {
    type: Number,
    required: [true, 'El porcentaje de propiedad es requerido'],
    min: [0.01, 'El porcentaje debe ser mayor a 0'],
    max: [100, 'El porcentaje no puede exceder 100']
  },
  // Tipo de socio: 'socio' o 'fundador'
  tipoSocio: {
    type: String,
    enum: ['socio', 'fundador'],
    required: [true, 'El tipo de socio es requerido'],
    default: 'socio'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  fechaIngreso: {
    type: Date,
    default: Date.now
  },
  telefono: {
    type: String,
    trim: true,
    maxlength: [20, 'El teléfono no puede exceder 20 caracteres']
  },
  notas: {
    type: String,
    maxlength: [500, 'Las notas no pueden exceder 500 caracteres']
  },
  // Metadata de auditoría
  creadoPor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  modificadoPor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  collection: 'socios'
});

// Índices
// Nota: email y userId ya tienen unique: true, no necesitan índices adicionales
socioSchema.index({ isFounder: 1 });
socioSchema.index({ isActive: 1 });
socioSchema.index({ createdAt: -1 });

// Middleware pre-save
socioSchema.pre('save', async function(next) {
  // Validar que el usuario sea admin
  const User = mongoose.model('User');
  const user = await User.findById(this.userId);
  if (!user || user.role !== 'admin') {
    throw new Error('Solo los usuarios admin pueden ser socios');
  }

  // Solo permitir un socio fundador activo
  if (this.tipoSocio === 'fundador' && this.isNew) {
    const existingFounder = await this.constructor.findOne({ 
      tipoSocio: 'fundador', 
      isActive: true 
    });
    if (existingFounder) {
      throw new Error('Solo puede haber un socio fundador');
    }
  }

  // Validar que la suma de porcentajes no exceda 100
  if (this.isModified('porcentaje') || this.isNew) {
    const totalPorcentaje = await this.constructor.aggregate([
      {
        $match: {
          _id: { $ne: this._id },
          isActive: true
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$porcentaje' }
        }
      }
    ]);

    const currentTotal = totalPorcentaje[0]?.total || 0;
    if (currentTotal + this.porcentaje > 100) {
      throw new Error(`La suma de porcentajes excede el 100%. Disponible: ${100 - currentTotal}%`);
    }
  }

  next();
});

// Métodos estáticos
socioSchema.statics.getDistribucionActual = async function() {
  return await this.find({ isActive: true })
    .populate('userId', 'name email role')
    .select('nombre email porcentaje tipoSocio userId');
};

socioSchema.statics.calcularDistribucion = async function(gananciaTotal) {
  const socios = await this.getDistribucionActual();
  
  return socios.map(socio => ({
    ...socio.toObject(),
    ganancia: (gananciaTotal * socio.porcentaje) / 100,
    gananciaNeta: Math.round((gananciaTotal * socio.porcentaje) / 100)
  }));
};

socioSchema.statics.getTotalPorcentajeAsignado = async function() {
  const result = await this.aggregate([
    {
      $match: { isActive: true }
    },
    {
      $group: {
        _id: null,
        total: { $sum: '$porcentaje' }
      }
    }
  ]);

  return result[0]?.total || 0;
};

// Métodos de instancia
socioSchema.methods.puedeCrearSocios = function() {
  return this.tipoSocio === 'fundador' && this.isActive;
};

socioSchema.methods.puedeEditarSocios = function() {
  return this.tipoSocio === 'fundador' && this.isActive;
};

socioSchema.methods.getBadges = function() {
  const badges = [];
  
  // Badge de Admin (viene del usuario)
  badges.push({
    text: 'Admin',
    color: 'blue',
    bgColor: 'bg-blue-400/20',
    textColor: 'text-blue-400',
    borderColor: 'border-blue-400/30'
  });

  // Badge de Socio
  if (this.tipoSocio === 'fundador') {
    badges.push({
      text: 'FS',
      color: 'gold',
      bgColor: 'bg-yellow-400/20',
      textColor: 'text-yellow-400',
      borderColor: 'border-yellow-400/30',
      description: 'Socio Fundador'
    });
  } else {
    badges.push({
      text: 'S',
      color: 'gold',
      bgColor: 'bg-yellow-400/20',
      textColor: 'text-yellow-400',
      borderColor: 'border-yellow-400/30',
      description: 'Socio'
    });
  }

  return badges;
};

socioSchema.methods.toJSON = function() {
  const socio = this.toObject();
  
  // No enviar información sensible al frontend
  delete socio.__v;
  
  return socio;
};

// Validación custom para porcentajes
socioSchema.path('porcentaje').validate(function(value) {
  return value > 0 && value <= 100 && Number.isFinite(value);
}, 'El porcentaje debe ser un número válido entre 0.01 y 100');

export default mongoose.model('Socio', socioSchema);