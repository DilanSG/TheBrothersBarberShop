import mongoose from "mongoose";

const inventorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true }, // Nombre del producto
    description: { type: String },          // Detalle del producto
    stock: { type: Number, default: 0 },    // Cantidad en inventario
    price: { type: Number, required: true },// Precio unitario
    category: { type: String },             // Ej: productos de aseo, herramientas
  },
  { timestamps: true }
);

export default mongoose.model("Inventory", inventorySchema);
