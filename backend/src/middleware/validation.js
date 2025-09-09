
import { body, param, query, validationResult } from 'express-validator';
import mongoose from 'mongoose';
import { AppError } from '../utils/errors.js';
import Barber from '../models/Barber.js';
import Service from '../models/Service.js';

/**
 * Middleware para manejar errores de validación
 */
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(err => ({
      field: err.path,
      message: err.msg,
      value: err.value
    }));

    throw new AppError('Error de validación', 400, errorMessages);
  }
  next();
};

/**
 * Validar ID de MongoDB
 */
export const validateMongoId = (value) => {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    throw new Error('ID inválido');
  }
  return true;
};

/**
 * Validación de ID en parámetros
 */
export const validateId = [
  param('id')
    .custom(validateMongoId)
    .withMessage('ID inválido'),
  handleValidationErrors
];

/**
 * Validación de barberId en parámetros
 */
export const validateBarberId = [
  param('barberId')
    .custom(validateMongoId)
    .withMessage('ID de barbero inválido'),
  handleValidationErrors
];

/**
 * Validación para actualización de usuario
 */
export const validateUserUpdate = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('El nombre debe tener entre 2 y 50 caracteres')
    .matches(/^[a-zA-ZÀ-ÿ\s]+$/)
    .withMessage('El nombre solo puede contener letras y espacios'),
    
  body('email')
    .optional()
    .trim()
    .isEmail()
    .withMessage('Debe proporcionar un email válido')
    .normalizeEmail(),
    
  body('phone')
    .optional()
    .custom((value) => {
      if (!value || value.trim() === '') return true; // Optional field
      
      // Convertir a string y limpiar
      const phoneStr = String(value).trim();
      
      // Remover espacios, guiones, paréntesis para validar
      const cleanPhone = phoneStr.replace(/[\s\-\(\)]/g, '');
      
      // Si empieza con +, es formato internacional
      if (cleanPhone.startsWith('+')) {
        // Debe tener entre 8 y 15 dígitos después del +
        if (!/^\+\d{8,15}$/.test(cleanPhone)) {
          throw new Error('Formato internacional inválido');
        }
        
        // Para Colombia (+57), debe tener exactamente 10 dígitos después del +57
        if (cleanPhone.startsWith('+57')) {
          const digitsAfter57 = cleanPhone.substring(3);
          if (!/^\d{10}$/.test(digitsAfter57)) {
            throw new Error('Número colombiano inválido');
          }
        }
      } else {
        // Números locales: solo dígitos, entre 7 y 15
        if (!/^\d{7,15}$/.test(cleanPhone)) {
          throw new Error('Número local inválido');
        }
      }
      
      return true;
    }),
    
  body('birthdate')
    .optional()
    .isISO8601()
    .toDate()
    .withMessage('Fecha de nacimiento inválida'),
    
  handleValidationErrors
];

/**
 * Validaciones comunes
 */
export const commonValidations = {
  // Validación de ID
  id: param('id')
    .custom(validateMongoId)
    .withMessage('ID inválido'),

  // Validación de email
  email: body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Debe proporcionar un email válido'),

  // Validación de teléfono
  phone: body('phone')
    .optional()
    .custom((value) => {
      if (!value || value.trim() === '') return true; // Optional field
      
      // Convertir a string y limpiar
      const phoneStr = String(value).trim();
      
      // Remover espacios, guiones, paréntesis para validar
      const cleanPhone = phoneStr.replace(/[\s\-\(\)]/g, '');
      
      // Si empieza con +, es formato internacional
      if (cleanPhone.startsWith('+')) {
        // Debe tener entre 8 y 15 dígitos después del +
        if (!/^\+\d{8,15}$/.test(cleanPhone)) {
          throw new Error('Formato internacional inválido');
        }
        
        // Para Colombia (+57), debe tener exactamente 10 dígitos después del +57
        if (cleanPhone.startsWith('+57')) {
          const digitsAfter57 = cleanPhone.substring(3);
          if (!/^\d{10}$/.test(digitsAfter57)) {
            throw new Error('Número colombiano inválido');
          }
        }
      } else {
        // Números locales: solo dígitos, entre 7 y 15
        if (!/^\d{7,15}$/.test(cleanPhone)) {
          throw new Error('Número local inválido');
        }
      }
      
      return true;
    }),

  // Validación de contraseña
  password: body('password')
    .isLength({ min: 8 })
    .withMessage('La contraseña debe tener al menos 8 caracteres')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('La contraseña debe contener al menos una mayúscula, una minúscula, un número y un carácter especial'),

  // Validación de fecha
  date: body('date')
    .isISO8601()
    .toDate()
    .withMessage('Fecha inválida'),

  // Validación de precio
  price: body('price')
    .isFloat({ min: 0 })
    .withMessage('El precio debe ser un número positivo'),

  // Validación de cantidad
  quantity: body('quantity')
    .isInt({ min: 0 })
    .withMessage('La cantidad debe ser un número entero positivo'),

  // Validación de página para paginación
  page: query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('La página debe ser un número entero positivo'),

  // Validación de límite para paginación
  limit: query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('El límite debe ser un número entre 1 y 100')
};

/**
 * Validaciones para usuarios
 */
export const userValidations = {
  create: [
    body('name')
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('El nombre debe tener entre 2 y 50 caracteres')
      .matches(/^[a-zA-ZÀ-ÿ\s]{2,50}$/)
      .withMessage('El nombre solo puede contener letras y espacios')
      .escape(),
    commonValidations.email,
    commonValidations.password,
    commonValidations.phone.optional(),
    body('role')
      .optional()
      .isIn(['user', 'barber', 'admin'])
      .withMessage('Rol no válido'),
    handleValidationErrors
  ],

  update: [
    commonValidations.id,
    body('name')
      .optional()
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('El nombre debe tener entre 2 y 50 caracteres')
      .matches(/^[a-zA-ZÀ-ÿ\s]{2,50}$/)
      .withMessage('El nombre solo puede contener letras y espacios')
      .escape(),
    commonValidations.email.optional(),
    commonValidations.phone.optional(),
    handleValidationErrors
  ],

  changePassword: [
    commonValidations.id,
    body('currentPassword')
      .notEmpty()
      .withMessage('La contraseña actual es requerida'),
    commonValidations.password,
    handleValidationErrors
  ]
};

// Validaciones para usuarios
export const validateUser = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('El nombre debe tener entre 2 y 50 caracteres')
    .escape(),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Debe proporcionar un email válido')
    .custom(async (email, { req }) => {
      const user = await User.findOne({ email });
      if (user && user._id.toString() !== req.params?.id) {
        throw new Error('El email ya está en uso');
      }
      return true;
    }),
  body('password')
    .optional()
    .isLength({ min: 6 })
    .withMessage('La contraseña debe tener al menos 6 caracteres')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('La contraseña debe contener al menos una mayúscula, una minúscula y un número'),
  body('phone')
    .optional()
    .custom((value) => {
      if (!value || value.trim() === '') return true; // Optional field
      
      // Convertir a string y limpiar
      const phoneStr = String(value).trim();
      
      // Remover espacios, guiones, paréntesis para validar
      const cleanPhone = phoneStr.replace(/[\s\-\(\)]/g, '');
      
      // Si empieza con +, es formato internacional
      if (cleanPhone.startsWith('+')) {
        // Debe tener entre 8 y 15 dígitos después del +
        if (!/^\+\d{8,15}$/.test(cleanPhone)) {
          throw new Error('Formato internacional inválido. Debe ser +[código][número]');
        }
        
        // Para Colombia (+57), debe tener exactamente 10 dígitos después del +57
        if (cleanPhone.startsWith('+57')) {
          const digitsAfter57 = cleanPhone.substring(3); // Quita "+57"
          if (!/^\d{10}$/.test(digitsAfter57)) {
            throw new Error('Número colombiano debe tener formato +57XXXXXXXXXX (10 dígitos después de +57)');
          }
        }
      } else {
        // Números locales: solo dígitos, entre 7 y 15
        if (!/^\d{7,15}$/.test(cleanPhone)) {
          throw new Error('Número local debe contener solo dígitos (7-15 caracteres)');
        }
      }
      
      return true;
    }),
  body('role')
    .optional()
    .isIn(['user', 'barber', 'admin'])
    .withMessage('Rol no válido'),
  handleValidationErrors
];

// Validaciones para servicios
export const validateService = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('El nombre del servicio debe tener entre 2 y 100 caracteres')
    .escape(),
  body('description')
    .trim()
    .isLength({ max: 500 })
    .withMessage('La descripción no puede exceder los 500 caracteres')
    .escape(),
  body('price')
    .isFloat({ min: 0 })
    .withMessage('El precio debe ser un número positivo'),
  body('duration')
    .isInt({ min: 15, max: 240 })
    .withMessage('La duración debe estar entre 15 y 240 minutos'),
  body('category')
    .isIn(['corte', 'barba', 'combo', 'tinte', 'tratamiento'])
    .withMessage('Categoría no válida'),
  handleValidationErrors
];

// Validaciones para barberos
export const validateBarber = [
  body('specialty')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('La especialidad debe tener entre 2 y 100 caracteres')
    .escape(),
  body('experience')
    .optional()
    .isInt({ min: 0 })
    .withMessage('La experiencia debe ser un número positivo'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('La descripción no puede exceder los 500 caracteres')
    .escape(),
  body('services')
    .optional()
    .isArray()
    .withMessage('Los servicios deben ser un array'),
  body('services.*')
    .isMongoId()
    .withMessage('ID de servicio inválido')
    .custom(async (serviceId) => {
      const service = await Service.findById(serviceId);
      if (!service) {
        throw new Error('Servicio no encontrado');
      }
      return true;
    }),
  handleValidationErrors
];

// Validaciones para citas
export const validateAppointment = [
  body('barberId')
    .isMongoId()
    .withMessage('ID de barbero inválido')
    .custom(async (barberId) => {
      const barber = await Barber.findById(barberId);
      if (!barber || !barber.isActive) {
        throw new Error('Barbero no disponible');
      }
      return true;
    }),
  body('serviceId')
    .isMongoId()
    .withMessage('ID de servicio inválido')
    .custom(async (serviceId) => {
      const service = await Service.findById(serviceId);
      if (!service || !service.isActive) {
        throw new Error('Servicio no disponible');
      }
      return true;
    }),
  body('date')
    .isISO8601()
    .withMessage('Fecha inválida')
    .custom(async (date, { req }) => {
      const appointmentDate = new Date(date);
      const now = new Date();
      
      if (appointmentDate <= now) {
        throw new Error('La cita debe ser en el futuro');
      }
      
      // Obtener el barbero para validar su horario
      const barberId = req.body.barberId;
      if (barberId) {
        const barber = await Barber.findById(barberId);
        if (barber && barber.schedule) {
          const dayOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][appointmentDate.getDay()];
          const daySchedule = barber.schedule[dayOfWeek];
          
          if (!daySchedule || !daySchedule.available) {
            throw new Error('El barbero no está disponible este día');
          }
          
          // Validar horario del barbero
          // Convertir la fecha a la timezone de Colombia para validar correctamente
          const colombiaTime = new Date(appointmentDate.toLocaleString("en-US", {timeZone: "America/Bogota"}));
          const appointmentHour = colombiaTime.getHours();
          const appointmentMinute = colombiaTime.getMinutes();
          const appointmentTime = appointmentHour * 60 + appointmentMinute;
          
          const [startHour, startMinute] = daySchedule.start.split(':').map(Number);
          const [endHour, endMinute] = daySchedule.end.split(':').map(Number);
          const startTime = startHour * 60 + startMinute;
          const endTime = endHour * 60 + endMinute;
          
          console.log('DEBUG: Appointment validation (FIXED):', {
            originalDate: appointmentDate.toISOString(),
            colombiaTime: colombiaTime.toISOString(),
            appointmentHour,
            appointmentMinute,
            appointmentTime,
            daySchedule,
            startTime,
            endTime,
            isValid: appointmentTime >= startTime && appointmentTime < endTime
          });
          
          if (appointmentTime < startTime || appointmentTime >= endTime) {
            throw new Error(`El horario debe estar entre ${daySchedule.start} y ${daySchedule.end}`);
          }
        }
      }
      
      return true;
    }),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Las notas no pueden exceder los 500 caracteres')
    .escape(),
  handleValidationErrors
];

// Validaciones para reseñas
export const validateReview = [
  body('rating')
    .isInt({ min: 1, max: 5 })
    .withMessage('El rating debe estar entre 1 y 5'),
  body('comment')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('El comentario no puede exceder los 1000 caracteres')
    .escape(),
  body('appointmentId')
    .isMongoId()
    .withMessage('ID de cita inválido')
    .custom(async (appointmentId, { req }) => {
      const appointment = await Appointment.findById(appointmentId);
      if (!appointment) {
        throw new Error('Cita no encontrada');
      }
      if (appointment.user.toString() !== req.user._id.toString()) {
        throw new Error('No puedes reseñar esta cita');
      }
      if (appointment.status !== 'completed') {
        throw new Error('Solo puedes reseñar citas completadas');
      }
      return true;
    }),
  handleValidationErrors
];

// Validaciones para parámetros de ID
export const validateIdParam = [
  param('id')
    .isMongoId()
    .withMessage('ID inválido'),
  handleValidationErrors
];

// Validaciones para queries de paginación
export const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('La página debe ser un número mayor a 0'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('El límite debe ser entre 1 y 100'),
  handleValidationErrors
];

// Middleware para verificar conflicto de citas (dummy, personaliza según tu lógica)
export const checkAppointmentConflict = (req, res, next) => {
  // Aquí podrías consultar la base de datos para ver si hay conflicto de horario
  // Por ahora, simplemente pasa al siguiente middleware
  next();
};

// Middleware para verificar propiedad de la cita (dummy, personaliza según tu lógica)
export const checkAppointmentOwnership = (req, res, next) => {
  // Aquí podrías consultar la base de datos para ver si el usuario es dueño de la cita
  // Por ahora, simplemente pasa al siguiente middleware
  next();
};

// Middleware para validación de creación de cita (puedes usar validateAppointment)
export const validateAppointmentCreation = validateAppointment;

// Middleware para validación de actualización de cita (puedes personalizar)
export const validateAppointmentUpdate = validateAppointment;

// Validaciones para items de inventario
export const validateInventoryItem = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('El nombre del ítem debe tener entre 2 y 100 caracteres')
    .escape(),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('La descripción no puede exceder los 500 caracteres')
    .escape(),
  body('stock')
    .optional()
    .isInt({ min: 0 })
    .withMessage('El stock debe ser un número entero positivo'),
  body('initialStock')
    .optional()
    .isInt({ min: 0 })
    .withMessage('El stock inicial debe ser un número entero positivo'),
  body('entries')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Las entradas deben ser un número entero positivo'),
  body('exits')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Las salidas deben ser un número entero positivo'),
  body('minStock')
    .optional()
    .isInt({ min: 0 })
    .withMessage('El stock mínimo debe ser un número entero positivo'),
  body('price')
    .isFloat({ min: 0 })
    .withMessage('El precio debe ser un número positivo'),
  body('supplier')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('El nombre del proveedor no puede exceder los 100 caracteres')
    .escape(),
  body('category')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('La categoría no puede exceder los 50 caracteres')
    .escape(),
  handleValidationErrors
];

