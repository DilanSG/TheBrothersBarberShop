import Inventory from '../models/Inventory.js';
import { asyncHandler } from '../middleware/index.js';
import { AppError } from '../middleware/errorHandler.js';

// Listar inventario
export const getInventory = asyncHandler(async (req, res) => {
  const items = await Inventory.find();
  res.json({ success: true, data: items });
});

// Crear producto
export const createInventory = asyncHandler(async (req, res) => {
  const { 
    name, description, cantidad_inicial, cantidad_actual, 
    unidad, tipo, entradas = 0, salidas = 0,
    vitrina = '1', prioridad = 'normal'
  } = req.body;
  const exists = await Inventory.findOne({ name });
  if (exists) throw new AppError('El producto ya existe', 400);
  const item = await Inventory.create({ 
    name, description, cantidad_inicial, cantidad_actual, 
    unidad, tipo, entradas, salidas, vitrina, prioridad 
  });
  res.status(201).json({ success: true, data: item });
});

// Editar producto
export const updateInventory = asyncHandler(async (req, res) => {
  const { 
    name, description, cantidad_inicial, cantidad_actual, 
    unidad, tipo, entradas = 0, salidas = 0,
    vitrina = '1', prioridad = 'normal'
  } = req.body;
  const item = await Inventory.findByIdAndUpdate(
    req.params.id,
    { 
      name, description, cantidad_inicial, cantidad_actual, 
      unidad, tipo, entradas, salidas, vitrina, prioridad 
    },
    { new: true, runValidators: true }
  );
  if (!item) throw new AppError('Producto no encontrado', 404);
  res.json({ success: true, data: item });
});

// Eliminar producto
export const deleteInventory = asyncHandler(async (req, res) => {
  const item = await Inventory.findByIdAndDelete(req.params.id);
  if (!item) throw new AppError('Producto no encontrado', 404);
  res.json({ success: true, message: 'Producto eliminado' });
});
