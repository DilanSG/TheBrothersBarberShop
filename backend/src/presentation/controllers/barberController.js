import { asyncHandler } from '../middleware/index.js';
import { AppError } from '../../shared/utils/errors.js';
import BarberService from '../../core/application/usecases/barberService.js';
import { User, Barber, Appointment } from '../../core/domain/entities/index.js';

export const editBarberProfile = asyncHandler(async (req, res) => {
  const updates = { ...req.body };
  if (req.image) {
    updates.photo = req.image;
  }

  const barber = await BarberService.updateBarberProfile(
    req.params.id,
    req.user._id,
    req.user.role,
    updates
  );

  res.json({
    success: true,
    message: 'Perfil de barbero actualizado',
    data: barber
  });
});

// @desc    Obtener todos los barberos
// @route   GET /api/barbers
// @access  Público
export const getBarbers = asyncHandler(async (req, res) => {
  const barbers = await BarberService.getBarbers();
  
  res.json({
    success: true,
    data: barbers
  });
});

// @desc    Eliminar barbero (cambiar a rol user)
// @route   PUT /api/barbers/:id/remove
// @access  Private/Admin
export const removeBarber = asyncHandler(async (req, res) => {
  const { barber, user } = await BarberService.removeBarber(req.params.id);

  res.status(200).json({
    success: true,
    message: 'Barbero removido exitosamente',
    data: {
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    }
  });
});

// @desc    Obtener o crear barbero por ID de usuario
// @route   GET /api/barbers/by-user/:userId
// @access  Privado
export const getBarberByUserId = asyncHandler(async (req, res) => {
  // Primero verificamos si el usuario existe y es un barbero
  const user = await User.findById(req.params.userId);
  if (!user) {
    throw new AppError('Usuario no encontrado', 404);
  }

  if (user.role !== 'barber') {
    throw new AppError('El usuario no tiene el rol de barbero', 400);
  }

  // Buscamos el perfil de barbero, incluyendo inactivos
  let barber = await Barber.findOne({ user: req.params.userId })
    .populate('user', 'name email phone photo role')
    .populate('services', 'name price duration');

  // Si no existe el perfil de barbero, lo creamos
  if (!barber) {
    barber = await Barber.create({
      user: req.params.userId,
      specialty: 'Barbero General', // Valor por defecto
      experience: 0,
      description: '', // Se puede actualizar después
      isActive: true,
      schedule: {
        monday: { start: '09:00', end: '17:00', available: true },
        tuesday: { start: '09:00', end: '17:00', available: true },
        wednesday: { start: '09:00', end: '17:00', available: true },
        thursday: { start: '09:00', end: '17:00', available: true },
        friday: { start: '09:00', end: '17:00', available: true },
        saturday: { start: '09:00', end: '14:00', available: true },
        sunday: { start: '00:00', end: '00:00', available: false }
      }
    });

    // Poblamos los campos después de crear
    barber = await Barber.findById(barber._id)
      .populate('user', 'name email phone photo role')
      .populate('services', 'name price duration');

    res.status(201).json({
      success: true,
      message: 'Perfil de barbero creado exitosamente',
      data: barber
    });
    return;
  }

  // Si el barbero existe pero está inactivo, lo reactivamos
  if (!barber.isActive) {
    barber.isActive = true;
    await barber.save();
  }

  res.json({
    success: true,
    data: barber
  });
});



// @desc    Obtener un barbero por ID
// @route   GET /api/barbers/:id
// @access  Público
export const getBarber = asyncHandler(async (req, res) => {
  // Debug: // Debug: console.log('Buscando barbero con ID:', req.params.id);
  
  const barber = await Barber.findOne({ 
    _id: req.params.id,
    isActive: true 
  })
  .populate({
    path: 'user',
    select: 'name email phone photo role isActive',
    match: { isActive: true }
  })
  .populate('services', 'name price duration category');

  if (!barber || !barber.user) {
    // Debug: console.log('Barbero no encontrado o inactivo');
    throw new AppError('Barbero no encontrado', 404);
  }

  // Debug: // Debug: console.log('Barbero encontrado:', barber._id);
  res.json({
    success: true,
    data: barber
  });
});

// @desc    Obtener disponibilidad de un barbero
// @route   GET /api/barbers/:id/availability
// @access  Público
export const getBarberAvailability = asyncHandler(async (req, res) => {
  const { date } = req.query;
  const barberId = req.params.id;

  if (!date) {
    throw new AppError('La fecha es requerida', 400);
  }

  const targetDate = new Date(date);
  if (isNaN(targetDate.getTime())) {
    throw new AppError('Fecha inválida', 400);
  }

  const barber = await Barber.findById(barberId);
  if (!barber || !barber.isActive) {
    throw new AppError('Barbero no encontrado o no disponible', 404);
  }

  const startOfDay = new Date(targetDate);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(targetDate);
  endOfDay.setHours(23, 59, 59, 999);

  const appointments = await Appointment.find({
    barber: barberId,
    date: { $gte: startOfDay, $lte: endOfDay },
    status: { $in: ['pending', 'confirmed'] }
  }).sort({ date: 1 });

  const availableSlots = [];
  const startHour = 7;
  const endHour = 19;
  const slotDuration = 30; // minutos

  for (let hour = startHour; hour < endHour; hour++) {
    for (let minute = 0; minute < 60; minute += slotDuration) {
      const slotTime = new Date(targetDate);
      slotTime.setHours(hour, minute, 0, 0);

      if (slotTime <= new Date()) {
        continue;
      }

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
export const createBarber = asyncHandler(async (req, res) => {
  const { userId, specialty, experience, description, services, schedule } = req.body;

  const user = await User.findById(userId);
  if (!user) {
    throw new AppError('Usuario no encontrado', 404);
  }

  const existingBarber = await Barber.findOne({ user: userId });
  if (existingBarber) {
    throw new AppError('Este usuario ya es un barbero', 400);
  }

  const barberData = {
    user: userId,
    specialty,
    experience: experience || 0,
    description,
    services,
    schedule: schedule || {
      monday: { start: '07:00', end: '19:00', available: true },
      tuesday: { start: '07:00', end: '19:00', available: true },
      wednesday: { start: '07:00', end: '19:00', available: true },
      thursday: { start: '07:00', end: '19:00', available: true },
      friday: { start: '07:00', end: '19:00', available: true },
      saturday: { start: '07:00', end: '19:00', available: true },
      sunday: { start: '07:00', end: '19:00', available: false }
    }
  };

  if (req.image) {
    barberData.photo = {
      public_id: req.image.public_id,
      url: req.image.url
    };
  }

  const barber = new Barber(barberData);
  await barber.save();

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
export const updateBarber = asyncHandler(async (req, res) => {
  const barber = await Barber.findById(req.params.id);

  if (!barber) {
    throw new AppError('Barbero no encontrado', 404);
  }

  if (req.user.role !== 'admin' && barber.user.toString() !== req.user._id.toString()) {
    throw new AppError('No tienes permisos para actualizar este barbero', 403);
  }

  const updates = { ...req.body };

  if (req.image) {
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
export const deleteBarber = asyncHandler(async (req, res) => {
  const barber = await Barber.findById(req.params.id);

  if (!barber) {
    throw new AppError('Barbero no encontrado', 404);
  }

  const futureAppointments = await Appointment.countDocuments({
    barber: req.params.id,
    date: { $gte: new Date() },
    status: { $in: ['pending', 'confirmed'] }
  });

  if (futureAppointments > 0) {
    throw new AppError('No se puede desactivar el barbero porque tiene citas futuras programadas', 400);
  }

  if (barber.photo && barber.photo.public_id) {
    await deleteFromCloudinary(barber.photo.public_id);
  }

  barber.isActive = false;
  await barber.save();

  res.json({
    success: true,
    message: 'Barbero desactivado exitosamente',
    data: barber
  });
});

// @desc    Obtener estadísticas de un barbero
// @route   GET /api/barbers/:id/stats
// @access  Privado/Admin o el mismo barbero
export const getBarberStats = asyncHandler(async (req, res) => {
  const barberId = req.params.id;

  const barber = await Barber.findById(barberId);
  if (!barber) {
    throw new AppError('Barbero no encontrado', 404);
  }

  if (req.user.role !== 'admin' && barber.user.toString() !== req.user._id.toString()) {
    throw new AppError('No tienes permisos para ver estas estadísticas', 403);
  }

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

// @desc    Actualizar estado de barbero principal
// @route   PATCH /api/barbers/:id/main-status
// @access  Private/Admin
export const updateMainBarberStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { isMainBarber } = req.body;

  console.log(`\n=== UPDATE MAIN BARBER STATUS ===`);
  // Debug: console.log(`Barbero ID: ${id}`);
  // Debug: console.log(`Nuevo estado isMainBarber: ${isMainBarber}`);
  // Debug: console.log(`Tipo de dato: ${typeof isMainBarber}`);

  // Verificar que el barbero existe
  const barber = await Barber.findById(id).populate('user');
  if (!barber) {
    throw new AppError('Barbero no encontrado', 404);
  }

  // Debug: console.log(`Estado actual del barbero: ${barber.isMainBarber}`);

  // Si se va a marcar como principal, verificar que no haya más de 3
  if (isMainBarber) {
    // Contar barberos principales actuales ACTIVOS, excluyendo el actual
    // Usar populate para verificar que el usuario también esté activo
    const currentMainBarbers = await Barber.find({ 
      isMainBarber: true, 
      isActive: true,
      _id: { $ne: id } 
    })
    .populate({
      path: 'user',
      match: { isActive: true }, // Solo usuarios activos
      select: 'isActive name email'
    })
    .exec();
    
    // Filtrar solo los que tienen usuario activo (populate no es null)
    const activeMainBarbers = currentMainBarbers.filter(barber => barber.user);
    const count = activeMainBarbers.length;
    
    console.log(`✅ Barberos principales ACTIVOS (excluyendo actual): ${count}/3`);
    console.log(`👥 Nombres: ${activeMainBarbers.map(b => b.user?.name).join(', ') || 'Ninguno'}`);
    
    if (count >= 3) {
      console.log(`❌ ERROR: Límite de 3 barberos principales activos alcanzado`);
      throw new AppError('Solo puedes tener máximo 3 barberos principales', 400);
    }
  }

  // Actualizar el estado
  barber.isMainBarber = isMainBarber;
  await barber.save();

  // Debug: console.log(`✅ Barbero actualizado. Nuevo estado: ${barber.isMainBarber}`);

  // 🧹 LIMPIAR CACHÉ DE BARBEROS de forma específica y rápida
  try {
    // Importar el módulo de caché de forma dinámica
    const { memoryCache } = await import('../utils/cache.js');
    
    // Limpiar específicamente las entradas de barberos
    const cacheKeys = memoryCache.keys();
    const barberKeys = cacheKeys.filter(key => key.includes('barbers'));
    
    barberKeys.forEach(key => {
      memoryCache.del(key);
      // Debug: console.log(`🧹 Cache key limpiada: ${key}`);
    });
    
    console.log(`🧹 Caché de barberos limpiado: ${barberKeys.length} keys`);
  } catch (error) {
    console.log(`⚠️ Error limpiando caché: ${error.message}`);
  }

  res.json({
    success: true,
    message: `Barbero ${isMainBarber ? 'agregado a' : 'removido de'} barberos principales`,
    data: {
      _id: barber._id,
      isMainBarber: barber.isMainBarber,
      user: barber.user
    }
  });
});
