import express from 'express';
import { listInventory, addInventoryItem, adjustStock, deleteInventoryItem } from '../controllers/inventory.controller.js';

const router = express.Router();

router.get('/', listInventory);
router.post('/', addInventoryItem);
router.patch('/:id', adjustStock);   // para entradas/salidas de stock
router.delete('/:id', deleteInventoryItem);

export default router;

import { Router } from 'express';
import { authRequired } from '../middleware/auth.js';
import { requireRole } from '../middleware/roles.js';
import { createItem, listItems, adjustStock } from '../controllers/inventory.controller.js';


const router = Router();


router.post('/', authRequired, requireRole('admin'), createItem);
router.get('/', authRequired, listItems);
router.patch('/:id/stock', authRequired, requireRole('admin'), adjustStock);


export default router;