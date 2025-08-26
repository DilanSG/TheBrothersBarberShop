import Inventory from "../models/inventory.js";

// Listar inventario
export const listInventory = async (req, res) => {
  try {
    const items = await Inventory.find();
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener inventario" });
  }
};

// Agregar item al inventario
export const addInventoryItem = async (req, res) => {
  try {
    const item = new Inventory(req.body);
    await item.save();
    res.status(201).json(item);
  } catch (error) {
    res.status(400).json({ message: "Error al crear item" });
  }
};

// Ajustar stock (entrada o salida)
export const adjustStock = async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity } = req.body;

    const item = await Inventory.findById(id);
    if (!item) return res.status(404).json({ message: "Item no encontrado" });

    item.stock += quantity; // puede ser positivo o negativo
    await item.save();

    res.json(item);
  } catch (error) {
    res.status(400).json({ message: "Error al ajustar stock" });
  }
};

// Eliminar item del inventario
export const deleteInventoryItem = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Inventory.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ message: "Item no encontrado" });
    res.json({ message: "Item eliminado" });
  } catch (error) {
    res.status(500).json({ message: "Error al eliminar item" });
  }
};
