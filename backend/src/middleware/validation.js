
import { body, param, query, validationResult } from 'express-validator';

// Manejar errores de validación
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Errores de validación',
      errors: errors.array()
    });
  }
  next();
};

// Validaciones para edición de perfil de usuario
export const validateUserProfile = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('El nombre debe tener entre 2 y 50 caracteres')
    .escape(),
  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Debe proporcionar un email válido'),
  body('phone')
    .optional()
    .isMobilePhone()
    .withMessage('Número de teléfono inválido'),
  handleValidationErrors
];

// Validaciones para edición de perfil de barbero
export const validateBarberProfile = [
  body('specialty')
    .optional()
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
  handleValidationErrors
];

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
    .isMobilePhone()
    .withMessage('Número de teléfono inválido'),
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
    .custom((date) => {
      const appointmentDate = new Date(date);
      const now = new Date();
      
      if (appointmentDate <= now) {
        throw new Error('La cita debe ser en el futuro');
      }
      
      // Validar horario laboral (9 AM - 7 PM)
      const hour = appointmentDate.getHours();
      if (hour < 9 || hour >= 19) {
        throw new Error('El horario debe estar entre 9:00 AM y 7:00 PM');
      }
      
      // Validar que no sea domingo
      if (appointmentDate.getDay() === 0) {
        throw new Error('No se aceptan citas los domingos');
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

