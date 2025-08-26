import { Router } from "express";
import { register, login, profile } from "../controllers/auth.controller.js";
import { authRequired } from "../middleware/auth.js";

const router = Router();

// Registro
router.post("/register", register);

// Login
router.post("/login", login);

// Perfil (solo con token)
router.get("/profile", authRequired, profile);

export default router;