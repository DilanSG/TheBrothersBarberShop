import { asyncHandler } from '../middleware/index.js';
import Service from '../models/Service.js';
import { AppError } from '../middleware/errorHandler.js';
    
// @desc    Obtener todos los servicios
// @route   GET /api/services
// @access  Público
export const getServices = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, category, active } = req.query;

  const filter = {};
  if (category) filter.category = category;
  if (active !== undefined) filter.isActive = active === 'true';

  const services = await Service.find(filter)
    .limit(Number(limit))
    .skip((Number(page) - 1) * Number(limit))
    .sort({ name: 1 });

  const total = await Service.countDocuments(filter);

  res.json({
    success: true,
    count: services.length,
    total,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      pages: Math.ceil(total / limit)
    },
    data: services
  });
});

// @desc    Obtener un servicio por ID
// @route   GET /api/services/:id
// @access  Público
export const getService = asyncHandler(async (req, res) => {
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
export const createService = asyncHandler(async (req, res) => {
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
export const updateService = asyncHandler(async (req, res) => {
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
export const deleteService = asyncHandler(async (req, res) => {
  const service = await Service.findByIdAndDelete(req.params.id);

  if (!service) {
    throw new AppError('Servicio no encontrado', 404);
  }

  res.json({
    success: true,
    message: 'Servicio eliminado exitosamente',
    data: service
  });
});