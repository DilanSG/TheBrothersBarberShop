import { Router } from "express";
import {
  createClient,
  listClients,
  getClient,
  updateClient,
  deleteClient,
} from "../controllers/client.controller.js";

const router = Router();

router.post("/", createClient);
router.get("/", listClients);
router.get("/:id", getClient);
router.put("/:id", updateClient);
router.delete("/:id", deleteClient);

export default router;
