import ServiceOfferedService from '../services/serviceOfferedService.js';
import { AppError } from '../utils/errors.js';
import { validateService } from '../middleware/validation.js';
import { asyncHandler } from '../middleware/index.js';

// @desc    Obtener todos los servicios
// @route   GET /api/services
// @access  Público
export const getServices = asyncHandler(async (req, res) => {
  const filters = {};
  if (req.query.category) filters.category = req.query.category;
  if (req.query.minPrice) filters.price = { $gte: parseFloat(req.query.minPrice) };
  if (req.query.maxPrice) {
    filters.price = { ...filters.price, $lte: parseFloat(req.query.maxPrice) };
  }
  if (req.query.active) {
    filters.isActive = req.query.active === 'true';
  }

  const services = await ServiceOfferedService.getAllServices(filters);
  res.json({
    success: true,
    count: services.length,
    data: services
  });
});

// @desc    Obtener un servicio por ID
// @route   GET /api/services/:id
// @access  Público
export const getService = asyncHandler(async (req, res) => {
  const service = await ServiceOfferedService.getServiceById(req.params.id);
  res.json({
    success: true,
    data: service
  });
});

// @desc    Crear un nuevo servicio
// @route   POST /api/services
// @access  Privado/Admin
export const createService = asyncHandler(async (req, res) => {
  // Validar los datos del servicio
  const validationError = validateService(req.body);
  if (validationError) {
    throw new AppError(validationError, 400);
  }

  // Si se subió una imagen, incluir su URL
  const serviceData = {
    ...req.body,
    image: req.file ? req.file.path : undefined
  };

  const service = await ServiceOfferedService.createService(serviceData);
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
  // Validar los datos de actualización
  if (Object.keys(req.body).length > 0) {
    const validationError = validateService(req.body, true);
    if (validationError) {
      throw new AppError(validationError, 400);
    }
  }

  // Si se subió una nueva imagen, incluir su URL
  const updateData = {
    ...req.body,
    image: req.file ? req.file.path : undefined
  };

  const service = await ServiceOfferedService.updateService(req.params.id, updateData);
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
  const result = await ServiceOfferedService.deleteService(req.params.id);
  res.json({
    success: true,
    message: result.message
  });
});

// @desc    Asignar servicio a barbero
// @route   POST /api/services/:serviceId/barbers/:barberId
// @access  Privado/Admin
export const assignServiceToBarber = asyncHandler(async (req, res) => {
  const barber = await ServiceOfferedService.assignServiceToBarber(
    req.params.barberId,
    req.params.serviceId
  );
  res.json({
    success: true,
    message: 'Servicio asignado exitosamente',
    data: barber
  });
});

// @desc    Remover servicio de barbero
// @route   DELETE /api/services/:serviceId/barbers/:barberId
// @access  Privado/Admin
export const removeServiceFromBarber = asyncHandler(async (req, res) => {
  const barber = await ServiceOfferedService.removeServiceFromBarber(
    req.params.barberId,
    req.params.serviceId
  );
  res.json({
    success: true,
    message: 'Servicio removido exitosamente',
    data: barber
  });
});

// @desc    Obtener servicios de un barbero
// @route   GET /api/services/barber/:barberId
// @access  Público
export const getServicesByBarber = asyncHandler(async (req, res) => {
  const services = await ServiceOfferedService.getServicesByBarber(req.params.barberId);
  res.json({
    success: true,
    count: services.length,
    data: services
  });
});

// @desc    Obtener estadísticas de servicios
// @route   GET /api/services/stats
// @access  Privado/Admin
export const getServiceStats = asyncHandler(async (req, res) => {
  const stats = await ServiceOfferedService.getServiceStats();
  res.json({
    success: true,
    data: stats
  });
});

// @desc    Actualizar estado showInHome de un servicio
// @route   PATCH /api/services/:id/show-in-home
// @access  Privado/Admin
export const toggleShowInHome = asyncHandler(async (req, res) => {
  const { showInHome } = req.body;
  
  if (typeof showInHome !== 'boolean') {
    throw new AppError('El campo showInHome debe ser un valor booleano', 400);
  }

  // Si se intenta activar showInHome, verificar que no haya más de 3 servicios activos
  if (showInHome === true) {
    const currentActiveServices = await ServiceOfferedService.getServicesForHome();
    if (currentActiveServices.length >= 3) {
      throw new AppError('Solo se pueden mostrar máximo 3 servicios en el Home. Desactiva otro servicio primero.', 400);
    }
  }

  const service = await ServiceOfferedService.updateService(req.params.id, { showInHome });
  res.json({
    success: true,
    message: showInHome ? 'Servicio agregado al Home' : 'Servicio removido del Home',
    data: service
  });
});