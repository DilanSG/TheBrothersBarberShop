import Reservation from "../models/Reservation.js";
import Inventory from "../models/inventory.js";

// Reporte de ingresos totales por reservas
export const revenueReport = async (req, res) => {
  try {
    const reservations = await Reservation.find().populate("service");
    let totalRevenue = 0;

    reservations.forEach(r => {
      if (r.service) totalRevenue += r.service.price;
    });

    res.json({ totalRevenue, count: reservations.length });
  } catch (error) {
    res.status(500).json({ message: "Error al generar reporte de ingresos", error: error.message });
  }
};

// Reporte de inventario bajo
export const lowStockReport = async (req, res) => {
  try {
    const threshold = parseInt(req.query.threshold) || 5;
    const lowStockItems = await Inventory.find({ stock: { $lt: threshold } });

    res.json({ lowStock: lowStockItems });
  } catch (error) {
    res.status(500).json({ message: "Error al generar reporte de inventario", error: error.message });
  }
};

// Reporte de servicios más solicitados
export const popularServicesReport = async (req, res) => {
  try {
    const reservations = await Reservation.find().populate("service");

    const serviceCount = {};
    reservations.forEach(r => {
      if (r.service) {
        serviceCount[r.service.name] = (serviceCount[r.service.name] || 0) + 1;
      }
    });

    const sorted = Object.entries(serviceCount).sort((a, b) => b[1] - a[1]);

    res.json({ popularServices: sorted });
  } catch (error) {
    res.status(500).json({ message: "Error al generar reporte de servicios", error: error.message });
  }
};
