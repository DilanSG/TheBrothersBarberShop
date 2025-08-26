const { asyncHandler } = require('../middleware');
const Barber = require('../models/Barber');
const User = require('../models/User');
const Appointment = require('../models/Appointment');
const { AppError } = require('../middleware/errorHandler');
const { deleteFromCloudinary } = require('../middleware/upload');

// @desc    Obtener todos los barberos
// @route   GET /api/barbers
// @access  Público
const getBarbers = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, active, specialty } = req.query;
  
  const filter = {};
  if (active !== undefined) filter.isActive = active === 'true';
  if (specialty) filter.specialty = new RegExp(specialty, 'i');
  
  const barbers = await Barber.find(filter)
    .populate('user', 'name email phone')
    .populate('services', 'name price duration')
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .sort({ 'rating.average': -1, 'rating.count': -1 });
  
  const total = await Barber.countDocuments(filter);
  
  res.json({
    success: true,
    count: barbers.length,
    total,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(total / limit)
    },
    data: barbers
  });
});

// @desc    Obtener un barbero por ID
// @route   GET /api/barbers/:id
// @access  Público
const getBarber = asyncHandler(async (req, res) => {
  const barber = await Barber.findById(req.params.id)
    .populate('user', 'name email phone')
    .populate('services', 'name price duration category');
  
  if (!barber) {
    throw new AppError('Barbero no encontrado', 404);
  }
  
  res.json({
    success: true,
    data: barber
  });
});

// @desc    Obtener disponibilidad de un barbero
// @route   GET /api/barbers/:id/availability
// @access  Público
const getBarberAvailability = asyncHandler(async (req, res) => {
  const { date } = req.query;
  const barberId = req.params.id;
  
  if (!date) {
    throw new AppError('La fecha es requerida', 400);
  }
  
  const targetDate = new Date(date);
  if (isNaN(targetDate.getTime())) {
    throw new AppError('Fecha inválida', 400);
  }
  
  // Obtener el barbero
  const barber = await Barber.findById(barberId);
  if (!barber || !barber.isActive) {
    throw new AppError('Barbero no encontrado o no disponible', 404);
  }
  
  // Obtener citas del barbero para esa fecha
  const startOfDay = new Date(targetDate);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(targetDate);
  endOfDay.setHours(23, 59, 59, 999);
  
  const appointments = await Appointment.find({
    barber: barberId,
    date: { $gte: startOfDay, $lte: endOfDay },
    status: { $in: ['pending', 'confirmed'] }
  }).sort({ date: 1 });
  
  // Generar horarios disponibles (9:00 AM - 7:00 PM)
  const availableSlots = [];
  const startHour = 9;
  const endHour = 19;
  const slotDuration = 30; // minutos
  
  for (let hour = startHour; hour < endHour; hour++) {
    for (let minute = 0; minute < 60; minute += slotDuration) {
      const slotTime = new Date(targetDate);
      slotTime.setHours(hour, minute, 0, 0);
      
      // Verificar si el horario está en el pasado
      if (slotTime <= new Date()) {
        continue;
      }
      
      // Verificar si el horario está ocupado
      const isOccupied = appointments.some(appointment => {
        const appointmentTime = new Date(appointment.date);
        const appointmentEnd = new Date(appointmentTime.getTime() + appointment.duration * 60000);
        
        return slotTime >= appointmentTime && slotTime < appointmentEnd;
      });
      
      if (!isOccupied) {
        availableSlots.push(slotTime.toISOString());
      }
    }
  }
  
  res.json({
    success: true,
    data: {
      barber: {
        _id: barber._id,
        name: barber.user?.name || 'Barbero'
      },
      date: targetDate.toISOString().split('T')[0],
      availableSlots,
      totalSlots: availableSlots.length
    }
  });
});

// @desc    Crear un nuevo barbero
// @route   POST /api/barbers
// @access  Privado/Admin
const createBarber = asyncHandler(async (req, res) => {
  const { userId, specialty, experience, description, services, schedule } = req.body;
  
  // Verificar que el usuario existe
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError('Usuario no encontrado', 404);
  }
  
  // Verificar que el usuario no sea ya un barbero
  const existingBarber = await Barber.findOne({ user: userId });
  if (existingBarber) {
    throw new AppError('Este usuario ya es un barbero', 400);
  }
  
  // Crear el barbero
  const barberData = {
    user: userId,
    specialty,
    experience: experience || 0,
    description,
    services,
    schedule: schedule || {
      monday: { start: '09:00', end: '19:00', available: true },
      tuesday: { start: '09:00', end: '19:00', available: true },
      wednesday: { start: '09:00', end: '19:00', available: true },
      thursday: { start: '09:00', end: '19:00', available: true },
      friday: { start: '09:00', end: '19:00', available: true },
      saturday: { start: '09:00', end: '19:00', available: true },
      sunday: { start: '09:00', end: '19:00', available: false }
    }
  };
  
  // Agregar foto si se subió
  if (req.image) {
    barberData.photo = {
      public_id: req.image.public_id,
      url: req.image.url
    };
  }
  
  const barber = new Barber(barberData);
  await barber.save();
  
  // Actualizar el rol del usuario a barbero
  user.role = 'barber';
  await user.save();
  
  await barber.populate('user', 'name email phone');
  await barber.populate('services', 'name price');
  
  res.status(201).json({
    success: true,
    message: 'Barbero creado exitosamente',
    data: barber
  });
});

// @desc    Actualizar un barbero
// @route   PUT /api/barbers/:id
// @access  Privado/Admin o el mismo barbero
const updateBarber = asyncHandler(async (req, res) => {
  const barber = await Barber.findById(req.params.id);
  
  if (!barber) {
    throw new AppError('Barbero no encontrado', 404);
  }
  
  // Verificar permisos (admin o el mismo barbero)
  if (req.user.role !== 'admin' && barber.user.toString() !== req.user._id.toString()) {
    throw new AppError('No tienes permisos para actualizar este barbero', 403);
  }
  
  const updates = { ...req.body };
  
  // Actualizar foto si se subió una nueva
  if (req.image) {
    // Eliminar foto anterior si existe
    if (barber.photo && barber.photo.public_id) {
      await deleteFromCloudinary(barber.photo.public_id);
    }
    
    updates.photo = {
      public_id: req.image.public_id,
      url: req.image.url
    };
  }
  
  const updatedBarber = await Barber.findByIdAndUpdate(
    req.params.id,
    updates,
    { new: true, runValidators: true }
  )
  .populate('user', 'name email phone')
  .populate('services', 'name price duration');
  
  res.json({
    success: true,
    message: 'Barbero actualizado exitosamente',
    data: updatedBarber
  });
});

// @desc    Eliminar/desactivar un barbero
// @route   DELETE /api/barbers/:id
// @access  Privado/Admin
const deleteBarber = asyncHandler(async (req, res) => {
  const barber = await Barber.findById(req.params.id);
  
  if (!barber) {
    throw new AppError('Barbero no encontrado', 404);
  }
  
  // Verificar si el barbero tiene citas futuras
  const futureAppointments = await Appointment.countDocuments({
    barber: req.params.id,
    date: { $gte: new Date() },
    status: { $in: ['pending', 'confirmed'] }
  });
  
  if (futureAppointments > 0) {
    throw new AppError('No se puede desactivar el barbero porque tiene citas futuras programadas', 400);
  }
  
  // Eliminar foto de Cloudinary si existe
  if (barber.photo && barber.photo.public_id) {
    await deleteFromCloudinary(barber.photo.public_id);
  }
  
  // Desactivar el barbero (no eliminar para mantener historial)
  barber.isActive = false;
  await barber.save();
  
  // Opcional: cambiar el rol del usuario de vuelta a 'user'
  // await User.findByIdAndUpdate(barber.user, { role: 'user' });
  
  res.json({
    success: true,
    message: 'Barbero desactivado exitosamente',
    data: barber
  });
});

// @desc    Obtener estadísticas de un barbero
// @route   GET /api/barbers/:id/stats
// @access  Privado/Admin o el mismo barbero
const getBarberStats = asyncHandler(async (req, res) => {
  const barberId = req.params.id;
  
  const barber = await Barber.findById(barberId);
  if (!barber) {
    throw new AppError('Barbero no encontrado', 404);
  }
  
  // Verificar permisos
  if (req.user.role !== 'admin' && barber.user.toString() !== req.user._id.toString()) {
    throw new AppError('No tienes permisos para ver estas estadísticas', 403);
  }
  
  // Estadísticas de citas
  const today = new Date();
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay());
  
  const stats = await Appointment.aggregate([
    {
      $match: {
        barber: barber._id,
        status: 'completed'
      }
    },
    {
      $group: {
        _id: null,
        totalAppointments: { $sum: 1 },
        totalRevenue: { $sum: '$price' },
        averageRating: { $avg: '$rating' },
        thisMonth: {
          $sum: {
            $cond: [
              { $gte: ['$date', startOfMonth] },
              1,
              0
            ]
          }
        },
        thisWeek: {
          $sum: {
            $cond: [
              { $gte: ['$date', startOfWeek] },
              1,
              0
            ]
          }
        }
      }
    }
  ]);
  
  // Citas por servicio
  const appointmentsByService = await Appointment.aggregate([
    {
      $match: {
        barber: barber._id,
        status: 'completed'
      }
    },
    {
      $group: {
        _id: '$service',
        count: { $sum: 1 },
        revenue: { $sum: '$price' }
      }
    },
    {
      $lookup: {
        from: 'services',
        localField: '_id',
        foreignField: '_id',
        as: 'service'
      }
    },
    {
      $unwind: '$service'
    },
    {
      $project: {
        service: '$service.name',
        count: 1,
        revenue: 1
      }
    },
    {
      $sort: { count: -1 }
    }
  ]);
  
  const result = {
    totalAppointments: stats[0]?.totalAppointments || 0,
    totalRevenue: stats[0]?.totalRevenue || 0,
    averageRating: stats[0]?.averageRating || 0,
    thisMonth: stats[0]?.thisMonth || 0,
    thisWeek: stats[0]?.thisWeek || 0,
    appointmentsByService
  };
  
  res.json({
    success: true,
    data: result
  });
});

module.exports = {
  getBarbers,
  getBarber,
  getBarberAvailability,
  createBarber,
  updateBarber,
  deleteBarber,
  getBarberStats
};