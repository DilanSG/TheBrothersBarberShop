import mongoose from "mongoose";

const clientSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      unique: true,
      match: [/^\d{7,15}$/, "Número de teléfono inválido"],
    },
    email: {
      type: String,
      unique: true,
      sparse: true, // no todos los clientes tendrán email
      lowercase: true,
      trim: true,
    },
    visits: {
      type: Number,
      default: 0, // se incrementa cada vez que hace una reserva
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Client", clientSchema);
