import Service from "../models/Service.js";

// Crear un servicio
export const createService = async (req, res) => {
  try {
    const { name, price, duration, description } = req.body;

    const existing = await Service.findOne({ name });
    if (existing) return res.status(400).json({ message: "El servicio ya existe" });

    const service = new Service({ name, price, duration, description });
    await service.save();

    res.status(201).json(service);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Listar todos los servicios
export const listServices = async (req, res) => {
  try {
    const services = await Service.find().sort({ createdAt: -1 });
    res.json(services);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Obtener un servicio por ID
export const getService = async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);
    if (!service) return res.status(404).json({ message: "Servicio no encontrado" });
    res.json(service);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Actualizar servicio
export const updateService = async (req, res) => {
  try {
    const { name, price, duration, description, active } = req.body;

    const service = await Service.findByIdAndUpdate(
      req.params.id,
      { name, price, duration, description, active },
      { new: true, runValidators: true }
    );

    if (!service) return res.status(404).json({ message: "Servicio no encontrado" });

    res.json(service);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Eliminar servicio
export const deleteService = async (req, res) => {
  try {
    const service = await Service.findByIdAndDelete(req.params.id);
    if (!service) return res.status(404).json({ message: "Servicio no encontrado" });
    res.json({ message: "Servicio eliminado correctamente" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
