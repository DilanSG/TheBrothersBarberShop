const Service = require('../models/Service.js');

// Obtener todos los servicios
exports.getServices = async (req, res) => {
    try {
        const { page = 1, limit = 10, active } = req.query;
        
        const filters = {};
        if (active !== undefined) {
            filters.isActive = active === 'true';
        }
        
        const services = await Service.find(filters)
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .sort({ name: 1 });
        
        const count = await Service.countDocuments(filters);
        
        res.json({
            services,
            totalPages: Math.ceil(count / limit),
            currentPage: page,
            total: count
        });
    } catch (error) {
        console.error('Error al obtener servicios:', error);
        res.status(500).json({
            error: 'Error interno del servidor'
        });
    }
};

// Crear nuevo servicio
exports.createService = async (req, res) => {
    try {
        // Solo administradores pueden crear servicios
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                error: 'Se requieren privilegios de administrador'
            });
        }
        
        const service = new Service(req.body);
        await service.save();
        
        res.status(201).json({
            message: 'Servicio creado exitosamente',
            service
        });
    } catch (error) {
        console.error('Error al crear servicio:', error);
        if (error.name === 'ValidationError') {
            return res.status(400).json({
                error: 'Datos de servicio inválidos',
                details: Object.values(error.errors).map(e => e.message)
            });
        }
        if (error.code === 11000) {
            return res.status(400).json({
                error: 'Ya existe un servicio con ese nombre'
            });
        }
        res.status(500).json({
            error: 'Error interno del servidor'
        });
    }
};

// Actualizar servicio
exports.updateService = async (req, res) => {
    try {
        // Solo administradores pueden actualizar servicios
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                error: 'Se requieren privilegios de administrador'
            });
        }
        
        const service = await Service.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );
        
        if (!service) {
            return res.status(404).json({
                error: 'Servicio no encontrado'
            });
        }
        
        res.json({
            message: 'Servicio actualizado exitosamente',
            service
        });
    } catch (error) {
        console.error('Error al actualizar servicio:', error);
        if (error.name === 'CastError') {
            return res.status(400).json({
                error: 'ID de servicio inválido'
            });
        }
        if (error.name === 'ValidationError') {
            return res.status(400).json({
                error: 'Datos de servicio inválidos',
                details: Object.values(error.errors).map(e => e.message)
            });
        }
        if (error.code === 11000) {
            return res.status(400).json({
                error: 'Ya existe un servicio con ese nombre'
            });
        }
        res.status(500).json({
            error: 'Error interno del servidor'
        });
    }
};

// Eliminar servicio (desactivar)
exports.deleteService = async (req, res) => {
    try {
        // Solo administradores pueden eliminar servicios
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                error: 'Se requieren privilegios de administrador'
            });
        }
        
        // En lugar de eliminar, marcamos como inactivo
        const service = await Service.findByIdAndUpdate(
            req.params.id,
            { isActive: false },
            { new: true }
        );
        
        if (!service) {
            return res.status(404).json({
                error: 'Servicio no encontrado'
            });
        }
        
        res.json({
            message: 'Servicio desactivado exitosamente',
            service
        });
    } catch (error) {
        console.error('Error al desactivar servicio:', error);
        if (error.name === 'CastError') {
            return res.status(400).json({
                error: 'ID de servicio inválido'
            });
        }
        res.status(500).json({
            error: 'Error interno del servidor'
        });
    }
};