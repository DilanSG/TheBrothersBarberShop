import express from "express";
import morgan from "morgan";
import cors from "cors";
import dotenv from "dotenv";

import authRoutes from "./routes/auth.routes.js";
import barbersRoutes from "./routes/barbers.routes.js";
import clientsRoutes from "./routes/clients.routes.js";
import servicesRoutes from "./routes/services.routes.js";
import reservationsRoutes from "./routes/reservations.routes.js";
import inventoryRoutes from "./routes/inventory.routes.js";
import reportsRoutes from "./routes/reports.routes.js";

import { errorHandler } from "./middleware/errorHandler.js";

dotenv.config();

const app = express();

// Middlewares globales
app.use(cors());
app.use(morgan("dev"));
app.use(express.json());

// Rutas
app.use("/api/auth", authRoutes);
app.use("/api/barbers", barbersRoutes);
app.use("/api/clients", clientsRoutes);
app.use("/api/services", servicesRoutes);
app.use("/api/reservations", reservationsRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/reports", reportsRoutes);

// Middleware de errores
app.use(errorHandler);

export default app;
