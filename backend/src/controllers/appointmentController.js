// Cancelar cita por barbero con motivo
export const cancelAppointmentWithReason = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;

  const appointment = await Appointment.findById(id);
  if (!appointment) {
    throw new AppError('Cita no encontrada', 404);
  }

  // Solo el barbero asignado puede cancelar
  if (req.user.role !== 'barber') {
    throw new AppError('Solo el barbero puede cancelar la cita con motivo', 403);
  }
  const barber = await Barber.findOne({ user: req.user._id });
  if (!barber || appointment.barber.toString() !== barber._id.toString()) {
    throw new AppError('No tienes permisos para cancelar esta cita', 403);
  }

  appointment.status = 'cancelled';
  appointment.cancellationReason = reason;
  await appointment.save();

  res.json({
    success: true,
    message: 'Cita cancelada exitosamente',
    data: appointment
  });
});
import { asyncHandler } from '../middleware/index.js';
import Appointment from '../models/Appointment.js';
import Barber from '../models/Barber.js';
import Service from '../models/Service.js';
import User from '../models/User.js';
import { AppError } from '../middleware/errorHandler.js';
import { sendAppointmentConfirmation } from '../utils/emailServices.js';

// Obtener todas las citas con filtros y paginación
export const getAppointments = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  // Construir filtros
  const filters = {};

  if (req.query.status) {
    filters.status = req.query.status;
  }

  if (req.query.barberId) {
    filters.barber = req.query.barberId;
  }

  if (req.query.userId) {
    filters.user = req.query.userId;
  }

  if (req.query.date) {
    const date = new Date(req.query.date);
    const nextDay = new Date(date);
    nextDay.setDate(nextDay.getDate() + 1);

    filters.date = {
      $gte: date,
      $lt: nextDay
    };
  }

  // Si no es admin, solo puede ver sus propias citas
  if (req.user.role === 'user') {
    filters.user = req.user._id;
  } else if (req.user.role === 'barber') {
    // Buscar el Barber asociado al usuario
    const barber = await Barber.findOne({ user: req.user._id });
    if (barber) {
      filters.barber = barber._id;
    } else {
      filters.barber = null; // No es barbero
    }
  }

  const appointments = await Appointment.find(filters)
    .populate('user', 'username email')
    .populate({
      path: 'barber',
      populate: { path: 'user', select: 'username email' }
    })
    .populate('service', 'name price duration')
    .sort({ date: -1 })
    .skip(skip)
    .limit(limit);

  const total = await Appointment.countDocuments(filters);

  res.json({
    success: true,
    data: appointments,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  });
});

// Crear una nueva cita
export const createAppointment = asyncHandler(async (req, res) => {
  const { barberId, serviceId, date, notes } = req.body;

  const service = await Service.findById(serviceId);
  if (!service) throw new AppError('Servicio no encontrado', 404);

  const appointmentDate = new Date(date);
  const endTime = new Date(appointmentDate.getTime() + service.duration * 60000);

  // Verificar que el barbero esté disponible en ese horario
  const conflictingAppointment = await Appointment.findOne({
    barber: barberId,
    date: { $lt: endTime, $gte: appointmentDate },
    status: { $in: ['pending', 'confirmed'] }
  });

  if (conflictingAppointment) {
    throw new AppError('El barbero no está disponible en ese horario', 400);
  }

  // Crear la cita
  const appointment = new Appointment({
    user: req.user._id,
    barber: barberId,
    service: serviceId,
    date: appointmentDate,
    duration: service.duration,
    price: service.price,
    notes,
    status: 'pending'
  });

  await appointment.save();
  await appointment.populate({
    path: 'barber',
    populate: { path: 'user', select: 'username email' }
  });
  await appointment.populate('service', 'name price');

  // Enviar email de confirmación
  try {
    const userData = await User.findById(req.user._id);
    await sendAppointmentConfirmation({
      to: userData.email,
      username: userData.username || userData.email,
      service: appointment.service,
      barber: appointment.barber,
      date: appointment.date
    });
  } catch (err) {
    // No bloquear la reserva si el email falla
    console.error('Error enviando email de confirmación:', err);
  }

  res.status(201).json({
    success: true,
    message: 'Cita creada exitosamente',
    data: appointment
  });
});

// Actualizar una cita
export const updateAppointment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  const appointment = await Appointment.findById(id);

  if (!appointment) {
    throw new AppError('Cita no encontrada', 404);
  }

  // Verificar permisos
  if (req.user.role === 'user' && appointment.user.toString() !== req.user._id.toString()) {
    throw new AppError('No tienes permisos para modificar esta cita', 403);
  }

  if (req.user.role === 'barber') {
    const barber = await Barber.findOne({ user: req.user._id });
    if (!barber || appointment.barber.toString() !== barber._id.toString()) {
      throw new AppError('No tienes permisos para modificar esta cita', 403);
    }
  }

  Object.keys(updates).forEach(key => {
    appointment[key] = updates[key];
  });

  await appointment.save();
  await appointment.populate('user', 'username email');
  await appointment.populate({
    path: 'barber',
    populate: { path: 'user', select: 'username email' }
  });
  await appointment.populate('service', 'name price');

  res.json({
    success: true,
    message: 'Cita actualizada exitosamente',
    data: appointment
  });
});

// Eliminar una cita
export const deleteAppointment = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const appointment = await Appointment.findById(id);

  if (!appointment) {
    throw new AppError('Cita no encontrada', 404);
  }

  // Verificar permisos
  if (req.user.role === 'user' && appointment.user.toString() !== req.user._id.toString()) {
    throw new AppError('No tienes permisos para eliminar esta cita', 403);
  }

  if (req.user.role === 'barber') {
    const barber = await Barber.findOne({ user: req.user._id });
    if (!barber || appointment.barber.toString() !== barber._id.toString()) {
      throw new AppError('No tienes permisos para eliminar esta cita', 403);
    }
  }

  // No permitir eliminar citas que ya han pasado
  if (new Date(appointment.date) < new Date() && appointment.status !== 'cancelled') {
    throw new AppError('No se puede eliminar una cita ya realizada', 400);
  }

  await Appointment.findByIdAndDelete(id);

  res.json({
    success: true,
    message: 'Cita eliminada exitosamente'
  });
});

// Obtener disponibilidad de un barbero
export const getBarberAvailability = asyncHandler(async (req, res) => {
  const { barberId } = req.params;
  const { date } = req.query;

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
      barber: barber.name,
      date: targetDate.toISOString().split('T')[0],
      availableSlots
    }
  });
});