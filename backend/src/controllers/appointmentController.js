const Appointment = require('../models/Appointment');
const User = require('../models/User');
const Barber = require('../models/Barber');
const Service = require('../models/Service');

// Obtener todas las citas (con filtros)
exports.getAppointments = async (req, res) => {
    try {
        const { page = 1, limit = 10, status, barberId, userId, date } = req.query;
        
        // Construir filtros
        const filters = {};
        if (status) filters.status = status;
        if (barberId) filters.barber = barberId;
        if (userId) filters.user = userId;
        if (date) {
            const startDate = new Date(date);
            const endDate = new Date(startDate);
            endDate.setDate(endDate.getDate() + 1);
            filters.date = { $gte: startDate, $lt: endDate };
        }
        
        // Si no es admin, restringir acceso
        if (req.user.role !== 'admin') {
            if (req.user.role === 'barber') {
                filters.barber = req.user.id;
            } else {
                filters.user = req.user.id;
            }
        }
        
        const appointments = await Appointment.find(filters)
            .populate('user', 'name email')
            .populate('barber', 'name specialty')
            .populate('service', 'name price')
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .sort({ date: -1 });
        
        const count = await Appointment.countDocuments(filters);
        
        res.json({
            appointments,
            totalPages: Math.ceil(count / limit),
            currentPage: page,
            total: count
        });
    } catch (error) {
        console.error('Error al obtener citas:', error);
        res.status(500).json({
            error: 'Error interno del servidor'
        });
    }
};

// Crear nueva cita
exports.createAppointment = async (req, res) => {
    try {
        const { barberId, serviceId, date, notes } = req.body;
        
        // Obtener servicio para determinar duración
        const service = await Service.findById(serviceId);
        const duration = service.duration;
        
        const appointment = new Appointment({
            user: req.user.id,
            barber: barberId,
            service: serviceId,
            date,
            duration,
            notes,
            status: 'pending'
        });
        
        await appointment.save();
        await appointment.populate('barber', 'name');
        await appointment.populate('service', 'name price');
        
        res.status(201).json({
            message: 'Cita creada exitosamente',
            appointment
        });
    } catch (error) {
        console.error('Error al crear cita:', error);
        if (error.name === 'ValidationError') {
            return res.status(400).json({
                error: 'Datos de cita inválidos',
                details: Object.values(error.errors).map(e => e.message)
            });
        }
        res.status(500).json({
            error: 'Error interno del servidor'
        });
    }
};

// Actualizar cita
exports.updateAppointment = async (req, res) => {
    try {
        const { status, date, notes } = req.body;
        const updates = {};
        
        if (status) updates.status = status;
        if (date) updates.date = date;
        if (notes !== undefined) updates.notes = notes;
        
        const appointment = await Appointment.findByIdAndUpdate(
            req.params.id,
            updates,
            { new: true, runValidators: true }
        )
        .populate('user', 'name email')
        .populate('barber', 'name specialty')
        .populate('service', 'name price');
        
        if (!appointment) {
            return res.status(404).json({
                error: 'Cita no encontrada'
            });
        }
        
        res.json({
            message: 'Cita actualizada exitosamente',
            appointment
        });
    } catch (error) {
        console.error('Error al actualizar cita:', error);
        if (error.name === 'CastError') {
            return res.status(400).json({
                error: 'ID de cita inválido'
            });
        }
        if (error.name === 'ValidationError') {
            return res.status(400).json({
                error: 'Datos de cita inválidos',
                details: Object.values(error.errors).map(e => e.message)
            });
        }
        res.status(500).json({
            error: 'Error interno del servidor'
        });
    }
};

// Eliminar cita
exports.deleteAppointment = async (req, res) => {
    try {
        const appointment = await Appointment.findByIdAndDelete(req.params.id);
        
        if (!appointment) {
            return res.status(404).json({
                error: 'Cita no encontrada'
            });
        }
        
        res.json({
            message: 'Cita eliminada exitosamente'
        });
    } catch (error) {
        console.error('Error al eliminar cita:', error);
        if (error.name === 'CastError') {
            return res.status(400).json({
                error: 'ID de cita inválido'
            });
        }
        res.status(500).json({
            error: 'Error interno del servidor'
        });
    }
};