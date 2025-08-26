import Barber from "../models/Barber.js";

// Crear barbero
export const createBarber = async (req, res) => {
  try {
    const barber = new Barber(req.body);
    await barber.save();
    res.status(201).json(barber);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Listar barberos
export const listBarbers = async (req, res) => {
  try {
    const barbers = await Barber.find();
    res.json(barbers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Obtener barbero por ID
export const getBarber = async (req, res) => {
  try {
    const barber = await Barber.findById(req.params.id);
    if (!barber) return res.status(404).json({ message: "Barbero no encontrado" });
    res.json(barber);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Actualizar barbero
export const updateBarber = async (req, res) => {
  try {
    const barber = await Barber.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!barber) return res.status(404).json({ message: "Barbero no encontrado" });
    res.json(barber);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Eliminar barbero
export const deleteBarber = async (req, res) => {
  try {
    const barber = await Barber.findByIdAndDelete(req.params.id);
    if (!barber) return res.status(404).json({ message: "Barbero no encontrado" });
    res.json({ message: "Barbero eliminado" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
