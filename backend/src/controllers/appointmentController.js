const Appointment = require('../models/Appointment');
const Barber = require('../models/Barber');
const Service = require('../models/Service');
const User = require('../models/User');

// Obtener todas las citas con filtros y paginación
const getAppointments = async (req, res) => {
  try {
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
      filters.barber = req.user._id;
    }
    
    const appointments = await Appointment.find(filters)
      .populate('user', 'name email')
      .populate('barber', 'name')
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
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener las citas',
      error: error.message
    });
  }
};

// Crear una nueva cita
const createAppointment = async (req, res) => {
  try {
    const { barberId, serviceId, date, notes } = req.body;
    
    // Verificar que el barbero esté disponible en ese horario
    const service = await Service.findById(serviceId);
    const appointmentDate = new Date(date);
    const endTime = new Date(appointmentDate.getTime() + service.duration * 60000);
    
    const conflictingAppointment = await Appointment.findOne({
      barber: barberId,
      date: { $lt: endTime, $gte: appointmentDate },
      status: { $in: ['pending', 'confirmed'] }
    });
    
    if (conflictingAppointment) {
      return res.status(400).json({
        success: false,
        message: 'El barbero no está disponible en ese horario'
      });
    }
    
    // Crear la cita
    const appointment = new Appointment({
      user: req.user._id,
      barber: barberId,
      service: serviceId,
      date: appointmentDate,
      duration: service.duration,
      notes,
      status: 'pending'
    });
    
    await appointment.save();
    await appointment.populate('barber', 'name');
    await appointment.populate('service', 'name price');
    
    res.status(201).json({
      success: true,
      message: 'Cita creada exitosamente',
      data: appointment
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al crear la cita',
      error: error.message
    });
  }
};

// Actualizar una cita
const updateAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const appointment = await Appointment.findById(id);
    
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Cita no encontrada'
      });
    }
    
    // Verificar permisos
    if (req.user.role === 'user' && appointment.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para modificar esta cita'
      });
    }
    
    if (req.user.role === 'barber' && appointment.barber.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para modificar esta cita'
      });
    }
    
    // Actualizar la cita
    Object.keys(updates).forEach(key => {
      appointment[key] = updates[key];
    });
    
    await appointment.save();
    await appointment.populate('user', 'name email');
    await appointment.populate('barber', 'name');
    await appointment.populate('service', 'name price');
    
    res.json({
      success: true,
      message: 'Cita actualizada exitosamente',
      data: appointment
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al actualizar la cita',
      error: error.message
    });
  }
};

// Eliminar una cita
const deleteAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    
    const appointment = await Appointment.findById(id);
    
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Cita no encontrada'
      });
    }
    
    // Verificar permisos
    if (req.user.role === 'user' && appointment.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para eliminar esta cita'
      });
    }
    
    if (req.user.role === 'barber' && appointment.barber.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para eliminar esta cita'
      });
    }
    
    // No permitir eliminar citas que ya han pasado
    if (new Date(appointment.date) < new Date() && appointment.status !== 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'No se puede eliminar una cita ya realizada'
      });
    }
    
    await Appointment.findByIdAndDelete(id);
    
    res.json({
      success: true,
      message: 'Cita eliminada exitosamente'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al eliminar la cita',
      error: error.message
    });
  }
};

// Obtener disponibilidad de un barbero
const getBarberAvailability = async (req, res) => {
  try {
    const { barberId } = req.params;
    const { date } = req.query;
    
    if (!date) {
      return res.status(400).json({
        success: false,
        message: 'La fecha es requerida'
      });
    }
    
    const targetDate = new Date(date);
    if (isNaN(targetDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Fecha inválida'
      });
    }
    
    // Obtener el barbero
    const barber = await Barber.findById(barberId);
    if (!barber || !barber.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Barbero no encontrado o no disponible'
      });
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
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener la disponibilidad',
      error: error.message
    });
  }
};

module.exports = {
  getAppointments,
  createAppointment,
  updateAppointment,
  deleteAppointment,
  getBarberAvailability
};