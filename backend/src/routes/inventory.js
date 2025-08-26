import express from 'express';
import {
  getInventory,
  createInventory,
  updateInventory,
  deleteInventory
} from '../controllers/inventoryController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Listar inventario (todos pueden ver)
router.get('/', getInventory);

// Crear, editar y eliminar solo admin/barber
router.post('/', protect, createInventory);
router.put('/:id', protect, updateInventory);
router.delete('/:id', protect, deleteInventory);

export default router;
