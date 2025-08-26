import mongoose from "mongoose";

const barberSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    experience: {
      type: Number,
      default: 0, // años de experiencia
    },
    specialties: {
      type: [String], // ejemplo: ["Fade", "Barba", "Corte clásico"]
      default: [],
    },
    available: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Barber", barberSchema);
