import { Router } from "express";
import {
  createBarber,
  listBarbers,
  getBarber,
  updateBarber,
  deleteBarber,
} from "../controllers/barber.controller.js";
import { authRequired } from "../middleware/auth.js";
import { requireRole } from "../middleware/roles.js";

const router = Router();

// Crear barbero (solo admin)
router.post("/", authRequired, requireRole("admin"), createBarber);

// Listar barberos (cualquier usuario autenticado)
router.get("/", authRequired, listBarbers);

// Obtener un barbero por ID (cualquier usuario autenticado)
router.get("/:id", authRequired, getBarber);

// Actualizar barbero (solo admin)
router.put("/:id", authRequired, requireRole("admin"), updateBarber);

// Eliminar barbero (solo admin)
router.delete("/:id", authRequired, requireRole("admin"), deleteBarber);

export default router;
