import Client from "../models/client.js";

// Crear cliente
export const createClient = async (req, res) => {
  try {
    const { name, phone, email, notes } = req.body;

    const existingClient = await Client.findOne({ phone });
    if (existingClient)
      return res.status(400).json({ message: "El cliente ya existe" });

    const client = new Client({ name, phone, email, notes });
    await client.save();

    res.status(201).json(client);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Listar todos los clientes
export const listClients = async (req, res) => {
  try {
    const clients = await Client.find().sort({ createdAt: -1 });
    res.json(clients);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Obtener un cliente por ID
export const getClient = async (req, res) => {
  try {
    const client = await Client.findById(req.params.id);
    if (!client) return res.status(404).json({ message: "Cliente no encontrado" });
    res.json(client);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Actualizar cliente
export const updateClient = async (req, res) => {
  try {
    const { name, phone, email, notes } = req.body;

    const client = await Client.findByIdAndUpdate(
      req.params.id,
      { name, phone, email, notes },
      { new: true, runValidators: true }
    );

    if (!client) return res.status(404).json({ message: "Cliente no encontrado" });

    res.json(client);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Eliminar cliente
export const deleteClient = async (req, res) => {
  try {
    const client = await Client.findByIdAndDelete(req.params.id);
    if (!client) return res.status(404).json({ message: "Cliente no encontrado" });
    res.json({ message: "Cliente eliminado correctamente" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
