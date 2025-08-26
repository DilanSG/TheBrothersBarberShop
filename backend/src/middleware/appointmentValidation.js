const { body, param, query } = require('express-validator');
const { checkValidationResults } = require('./security');
const Appointment = require('../models/Appointment');
const User = require('../models/User');
const Barber = require('../models/Barber');
const Service = require('../models/Service');

// Validación para creación de citas
const validateAppointmentCreation = [
    body('barberId')
        .isMongoId().withMessage('ID de barbero inválido')
        .custom(async (value, { req }) => {
            const barber = await Barber.findById(value);
            if (!barber) {
                throw new Error('Barbero no encontrado');
            }
            if (!barber.isActive) {
                throw new Error('Este barbero no está disponible');
            }
            return true;
        }),
    body('serviceId')
        .isMongoId().withMessage('ID de servicio inválido')
        .custom(async (value) => {
            const service = await Service.findById(value);
            if (!service) {
                throw new Error('Servicio no encontrado');
            }
            return true;
        }),
    body('date')
        .isISO8601().withMessage('Fecha inválida')
        .custom((value) => {
            const appointmentDate = new Date(value);
            if (appointmentDate <= new Date()) {
                throw new Error('La fecha debe ser futura');
            }
            
            // Validar horario laboral (9:00 AM - 7:00 PM)
            const hour = appointmentDate.getHours();
            if (hour < 9 || hour >= 19) {
                throw new Error('Los horarios disponibles son de 9:00 AM a 7:00 PM');
            }
            
            // Validar que no sea domingo
            if (appointmentDate.getDay() === 0) {
                throw new Error('No se permiten citas los domingos');
            }
            
            return true;
        }),
    body('duration')
        .optional()
        .isInt({ min: 15, max: 180 }).withMessage('La duración debe estar entre 15 y 180 minutos'),
    checkValidationResults
];

// Validación para actualización de citas
const validateAppointmentUpdate = [
    param('id')
        .isMongoId().withMessage('ID de cita inválido'),
    body('status')
        .optional()
        .isIn(['pending', 'confirmed', 'completed', 'cancelled']).withMessage('Estado inválido'),
    body('date')
        .optional()
        .isISO8601().withMessage('Fecha inválida')
        .custom((value) => {
            const appointmentDate = new Date(value);
            if (appointmentDate <= new Date()) {
                throw new Error('La fecha debe ser futura');
            }
            return true;
        }),
    checkValidationResults
];

// Middleware para verificar conflicto de horarios
const checkAppointmentConflict = async (req, res, next) => {
    try {
        const { barberId, date } = req.body;
        const appointmentDate = new Date(date);
        const duration = req.body.duration || 30; // Duración por defecto: 30 minutos
        
        // Calcular hora de fin
        const endTime = new Date(appointmentDate.getTime() + duration * 60000);
        
        // Verificar si el barbero ya tiene una cita en ese horario
        const conflictingAppointment = await Appointment.findOne({
            barber: barberId,
            date: { 
                $lt: endTime,
                $gte: appointmentDate
            },
            status: { $in: ['pending', 'confirmed'] }
        });
        
        if (conflictingAppointment) {
            return res.status(409).json({
                error: 'El barbero ya tiene una cita programada en ese horario'
            });
        }
        
        next();
    } catch (error) {
        console.error('Error al verificar conflicto de citas:', error);
        res.status(500).json({
            error: 'Error interno del servidor'
        });
    }
};

// Middleware para verificar permisos sobre la cita
const checkAppointmentOwnership = async (req, res, next) => {
    try {
        const appointment = await Appointment.findById(req.params.id);
        
        if (!appointment) {
            return res.status(404).json({
                error: 'Cita no encontrada'
            });
        }
        
        // Admin puede acceder a todas las citas
        if (req.user.role === 'admin') {
            req.appointment = appointment;
            return next();
        }
        
        // Barberos pueden acceder a sus propias citas
        if (req.user.role === 'barber' && appointment.barber.toString() === req.user.id) {
            req.appointment = appointment;
            return next();
        }
        
        // Usuarios pueden acceder a sus propias citas
        if (appointment.user.toString() === req.user.id) {
            req.appointment = appointment;
            return next();
        }
        
        return res.status(403).json({
            error: 'No tienes permisos para acceder a esta cita'
        });
    } catch (error) {
        console.error('Error al verificar permisos de cita:', error);
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

module.exports = {
    validateAppointmentCreation,
    validateAppointmentUpdate,
    checkAppointmentConflict,
    checkAppointmentOwnership
};