import mongoose from "mongoose";
import { SALE_TYPES } from "../../../shared/constants/salesConstants.js";

const saleSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Inventory",
    required: function() { return this.type === SALE_TYPES.PRODUCT; }
  },
  productName: {
    type: String,
    required: function() { return this.type === SALE_TYPES.PRODUCT; }
  },
  serviceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Service", 
    required: function() { return this.type === SALE_TYPES.SERVICE; }
  },
  serviceName: {
    type: String,
    required: function() { return this.type === SALE_TYPES.SERVICE; }
  },
  type: {
    type: String,
    enum: [SALE_TYPES.PRODUCT, SALE_TYPES.SERVICE],
    required: true
  },
  quantity: {
    type: Number,
    required: [true, "La cantidad es requerida"],
    min: [1, "La cantidad debe ser mayor a 0"]
  },
  unitPrice: {
    type: Number,
    required: [true, "El precio unitario es requerido"],
    min: [0, "El precio no puede ser negativo"]
  },
  totalAmount: {
    type: Number,
    required: [true, "El total es requerido"],
    min: [0, "El total no puede ser negativo"]
  },
  barberId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Barber",
    required: [true, "El barbero es requerido"]
  },
  barberName: {
    type: String,
    required: [true, "El nombre del barbero es requerido"]
  },
  paymentMethod: {
    type: String,
    required: [true, "El método de pago es requerido"],
    default: 'cash',
    // Permitir cualquier método de pago para flexibilidad con métodos dinámicos
    validate: {
      validator: function(value) {
        // Lista de métodos válidos conocidos
        const validMethods = ['cash', 'debit', 'credit', 'nequi', 'daviplata', 'nu', 'bancolombia', 'digital'];
        // Permitir métodos conocidos o cualquier string no vacío para métodos dinámicos
        return validMethods.includes(value) || (typeof value === 'string' && value.length > 0);
      },
      message: 'El método de pago debe ser válido'
    }
  },
  customerName: {
    type: String,
    trim: true
  },
  category: {
    type: String,
    trim: true,
    validate: {
      validator: function(value) {
        // Para productos, la categoría puede venir del producto o ser establecida manualmente
        if (this.type === SALE_TYPES.PRODUCT) {
          return true; // Permitir vacío, se puede obtener del producto
        }
        // Para servicios walkIn, es recomendable tener categoría
        if (this.type === SALE_TYPES.SERVICE) {
          return true; // Permitir vacío por compatibilidad, pero recomendable
        }
        return true;
      },
      message: 'La categoría debe ser válida para el tipo de venta'
    }
  },
  notes: {
    type: String,
    trim: true
  },
  saleDate: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ["completed", "cancelled", "refunded"],
    default: "completed"
  },
  invoiceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Invoice",
    index: true
  }
}, {
  timestamps: true
});

saleSchema.index({ barberId: 1, saleDate: -1 });
saleSchema.index({ productId: 1, saleDate: -1 });
saleSchema.index({ serviceId: 1, saleDate: -1 });
saleSchema.index({ saleDate: -1 });
saleSchema.index({ type: 1, barberId: 1 });

const Sale = mongoose.model("Sale", saleSchema);

export default Sale;
