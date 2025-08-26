const { asyncHandler } = require('../middleware');
const Service = require('../models/Service');
const { AppError } = require('../middleware/errorHandler');

// @desc    Obtener todos los servicios
// @route   GET /api/services
// @access  Público
const getServices = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, category, active } = req.query;
  
  const filter = {};
  if (category) filter.category = category;
  if (active !== undefined) filter.isActive = active === 'true';
  
  const services = await Service.find(filter)
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .sort({ name: 1 });
  
  const total = await Service.countDocuments(filter);
  
  res.json({
    success: true,
    count: services.length,
    total,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(total / limit)
    },
    data: services
  });
});

// @desc    Obtener un servicio por ID
// @route   GET /api/services/:id
// @access  Público
const getService = asyncHandler(async (req, res) => {
  const service = await Service.findById(req.params.id);
  
  if (!service) {
    throw new AppError('Servicio no encontrado', 404);
  }
  
  res.json({
    success: true,
    data: service
  });
});

// @desc    Crear un nuevo servicio
// @route   POST /api/services
// @access  Privado/Admin
const createService = asyncHandler(async (req, res) => {
  const service = new Service(req.body);
  await service.save();
  
  res.status(201).json({
    success: true,
    message: 'Servicio creado exitosamente',
    data: service
  });
});

// @desc    Actualizar un servicio
// @route   PUT /api/services/:id
// @access  Privado/Admin
const updateService = asyncHandler(async (req, res) => {
  const service = await Service.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  );
  
  if (!service) {
    throw new AppError('Servicio no encontrado', 404);
  }
  
  res.json({
    success: true,
    message: 'Servicio actualizado exitosamente',
    data: service
  });
});

// @desc    Eliminar un servicio (desactivar)
// @route   DELETE /api/services/:id
// @access  Privado/Admin
const deleteService = asyncHandler(async (req, res) => {
  const service = await Service.findByIdAndUpdate(
    req.params.id,
    { isActive: false },
    { new: true }
  );
  
  if (!service) {
    throw new AppError('Servicio no encontrado', 404);
  }
  
  res.json({
    success: true,
    message: 'Servicio desactivado exitosamente',
    data: service
  });
});

module.exports = {
  getServices,
  getService,
  createService,
  updateService,
  deleteService
};