import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'El nombre de usuario es requerido'],
    trim: true,
    maxlength: [100, 'El nombre de usuario no puede exceder los 100 caracteres'],
    unique: true
  },
  email: {
    type: String,
    required: [true, 'El email es requerido'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/\S+@\S+\.\S+/, 'Email no válido']
  },
  password: {
    type: String,
    required: [true, 'La contraseña es requerida'],
    minlength: [6, 'La contraseña debe tener al menos 6 caracteres'],
    select: false
  },
    name: {
    type: String,
    required: [true, 'El nombre es requerido'],
    trim: true,
    maxlength: [100, 'El nombre no puede exceder los 100 caracteres']
  },
  role: {
    type: String,
    enum: ['user', 'barber', 'admin'],
    default: 'user'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  photo: {
    public_id: String,
    url: String
  },
  birthdate: {
    type: Date,
    required: false
  },
  resetPasswordToken: String,
  resetPasswordExpires: Date
}, {
  timestamps: true
});

// Middleware para hashear la contraseña antes de guardar
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Índices
userSchema.index({ isActive: 1 });

// Método para comparar contraseñas
userSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    if (!this.password) {
      throw new Error('Password not found in user document');
    }
    const isMatch = await bcrypt.compare(candidatePassword, this.password);
    return isMatch;
  } catch (error) {
    console.error('Error comparing passwords:', error);
    throw new Error('Error al comparar contraseñas');
  }
};

const User = mongoose.model('User', userSchema);
export default User;