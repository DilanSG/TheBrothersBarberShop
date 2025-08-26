import { Router } from "express";
import {
  createService,
  listServices,
  getService,
  updateService,
  deleteService,
} from "../controllers/service.controller.js";

const router = Router();

router.post("/", createService);
router.get("/", listServices);
router.get("/:id", getService);
router.put("/:id", updateService);
router.delete("/:id", deleteService);

export default router;
