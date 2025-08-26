const Barber = require('../models/Barber');
const Appointment = require('../models/Appointment');

// Obtener todos los barberos
exports.getBarbers = async (req, res) => {
    try {
        const { page = 1, limit = 10, active } = req.query;
        
        const filters = {};
        if (active !== undefined) {
            filters.isActive = active === 'true';
        }
        
        const barbers = await Barber.find(filters)
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .sort({ name: 1 });
        
        const count = await Barber.countDocuments(filters);
        
        res.json({
            barbers,
            totalPages: Math.ceil(count / limit),
            currentPage: page,
            total: count
        });
    } catch (error) {
        console.error('Error al obtener barberos:', error);
        res.status(500).json({
            error: 'Error interno del servidor'
        });
    }
};

// Obtener horarios disponibles de un barbero
exports.getBarberAvailability = async (req, res) => {
    try {
        const { date } = req.query;
        const barberId = req.params.id;
        
        if (!date) {
            return res.status(400).json({
                error: 'La fecha es requerida'
            });
        }
        
        const targetDate = new Date(date);
        if (isNaN(targetDate.getTime())) {
            return res.status(400).json({
                error: 'Fecha inválida'
            });
        }
        
        // Obtener el barbero
        const barber = await Barber.findById(barberId);
        if (!barber || !barber.isActive) {
            return res.status(404).json({
                error: 'Barbero no encontrado o no disponible'
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
                    availableSlots.push(slotTime);
                }
            }
        }
        
        res.json({
            barber: barber.name,
            date: targetDate.toISOString().split('T')[0],
            availableSlots: availableSlots.map(slot => slot.toTimeString().slice(0, 5))
        });
    } catch (error) {
        console.error('Error al obtener disponibilidad:', error);
        if (error.name === 'CastError') {
            return res.status(400).json({
                error: 'ID de barbero inválido'
            });
        }
        res.status(500).json({
            error: 'Error interno del servidor'
        });
    }
};

// Crear nuevo barbero
exports.createBarber = async (req, res) => {
    try {
        // Solo administradores pueden crear barberos
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                error: 'Se requieren privilegios de administrador'
            });
        }
        
        const barber = new Barber(req.body);
        await barber.save();
        
        res.status(201).json({
            message: 'Barbero creado exitosamente',
            barber
        });
    } catch (error) {
        console.error('Error al crear barbero:', error);
        if (error.name === 'ValidationError') {
            return res.status(400).json({
                error: 'Datos de barbero inválidos',
                details: Object.values(error.errors).map(e => e.message)
            });
        }
        if (error.code === 11000) {
            return res.status(400).json({
                error: 'Ya existe un barbero con ese email'
            });
        }
        res.status(500).json({
            error: 'Error interno del servidor'
        });
    }
};

// Actualizar barbero
exports.updateBarber = async (req, res) => {
    try {
        // Solo administradores pueden actualizar barberos
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                error: 'Se requieren privilegios de administrador'
            });
        }
        
        const barber = await Barber.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );
        
        if (!barber) {
            return res.status(404).json({
                error: 'Barbero no encontrado'
            });
        }
        
        res.json({
            message: 'Barbero actualizado exitosamente',
            barber
        });
    } catch (error) {
        console.error('Error al actualizar barbero:', error);
        if (error.name === 'CastError') {
            return res.status(400).json({
                error: 'ID de barbero inválido'
            });
        }
        if (error.name === 'ValidationError') {
            return res.status(400).json({
                error: 'Datos de barbero inválidos',
                details: Object.values(error.errors).map(e => e.message)
            });
        }
        if (error.code === 11000) {
            return res.status(400).json({
                error: 'Ya existe un barbero con ese email'
            });
        }
        res.status(500).json({
            error: 'Error interno del servidor'
        });
    }
};

// Eliminar barbero (desactivar)
exports.deleteBarber = async (req, res) => {
    try {
        // Solo administradores pueden eliminar barberos
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                error: 'Se requieren privilegios de administrador'
            });
        }
        
        // Verificar si el barbero tiene citas futuras
        const futureAppointments = await Appointment.countDocuments({
            barber: req.params.id,
            date: { $gte: new Date() },
            status: { $in: ['pending', 'confirmed'] }
        });
        
        if (futureAppointments > 0) {
            return res.status(400).json({
                error: 'No se puede desactivar el barbero porque tiene citas futuras programadas'
            });
        }
        
        // En lugar de eliminar, marcamos como inactivo
        const barber = await Barber.findByIdAndUpdate(
            req.params.id,
            { isActive: false },
            { new: true }
        );
        
        if (!barber) {
            return res.status(404).json({
                error: 'Barbero no encontrado'
            });
        }
        
        res.json({
            message: 'Barbero desactivado exitosamente',
            barber
        });
    } catch (error) {
        console.error('Error al desactivar barbero:', error);
        if (error.name === 'CastError') {
            return res.status(400).json({
                error: 'ID de barbero inválido'
            });
        }
        res.status(500).json({
            error: 'Error interno del servidor'
        });
    }
};