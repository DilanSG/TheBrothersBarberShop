import Reservation from "../models/Reservation.js";
import Client from "../models/client.js";
import Barber from "../models/Barber.js";
import Service from "../models/Service.js";

// Crear una reserva
export const createReservation = async (req, res) => {
  try {
    const { client, barber, service, date, notes } = req.body;

    const clientExists = await Client.findById(client);
    if (!clientExists) return res.status(404).json({ message: "Cliente no encontrado" });

    const barberExists = await Barber.findById(barber);
    if (!barberExists) return res.status(404).json({ message: "Barbero no encontrado" });

    const serviceExists = await Service.findById(service);
    if (!serviceExists) return res.status(404).json({ message: "Servicio no encontrado" });

    const reservation = new Reservation({
      client,
      barber,
      service,
      date,
      notes,
    });

    await reservation.save();
    res.status(201).json(reservation);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Listar reservas (opcionalmente por cliente o barbero)
export const listReservations = async (req, res) => {
  try {
    const { client, barber } = req.query;

    const filter = {};
    if (client) filter.client = client;
    if (barber) filter.barber = barber;

    const reservations = await Reservation.find(filter)
      .populate("client", "name phone email")
      .populate("barber", "name specialty")
      .populate("service", "name price duration")
      .sort({ date: 1 });

    res.json(reservations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Obtener una reserva por ID
export const getReservation = async (req, res) => {
  try {
    const reservation = await Reservation.findById(req.params.id)
      .populate("client", "name phone email")
      .populate("barber", "name specialty")
      .populate("service", "name price duration");

    if (!reservation) return res.status(404).json({ message: "Reserva no encontrada" });

    res.json(reservation);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Actualizar estado de reserva
export const updateReservation = async (req, res) => {
  try {
    const { status, date, notes } = req.body;

    const reservation = await Reservation.findByIdAndUpdate(
      req.params.id,
      { status, date, notes },
      { new: true, runValidators: true }
    );

    if (!reservation) return res.status(404).json({ message: "Reserva no encontrada" });

    res.json(reservation);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Eliminar reserva
export const deleteReservation = async (req, res) => {
  try {
    const reservation = await Reservation.findByIdAndDelete(req.params.id);
    if (!reservation) return res.status(404).json({ message: "Reserva no encontrada" });

    res.json({ message: "Reserva eliminada correctamente" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
