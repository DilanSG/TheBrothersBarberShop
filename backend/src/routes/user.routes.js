import { Router } from "express";
import { listUsers, getUserById, updateUser, deleteUser } from "../controllers/user.controller.js";
import { authRequired } from "../middleware/auth.js";
import { requireRole } from "../middleware/roles.js";

const router = Router();

// Listar usuarios (solo admin)
router.get("/", authRequired, requireRole("admin"), listUsers);

// Obtener usuario por ID (solo admin)
router.get("/:id", authRequired, requireRole("admin"), getUserById);

// Actualizar usuario (solo admin)
router.put("/:id", authRequired, requireRole("admin"), updateUser);

// Eliminar usuario (solo admin)
router.delete("/:id", authRequired, requireRole("admin"), deleteUser);

export default router;
