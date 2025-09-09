import mongoose from 'mongoose';
import Sale from '../models/Sale.js';
import Barber from '../models/Barber.js';
import Inventory from '../models/Inventory.js';
import Appointment from '../models/Appointment.js';
import { AppError } from '../utils/errors.js';

class SaleService {
  /**
   * Buscar barbero por ID de barbero o ID de usuario
   */
  static async findBarberByIdOrUserId(id) {
    console.log(`🔍 Buscando barbero con ID: ${id}`);
    
    // Primero intentar buscar por ID de barbero
    let barber = await Barber.findById(id);
    console.log(`📝 Búsqueda por ID de barbero: ${barber ? 'ENCONTRADO' : 'NO ENCONTRADO'}`);
    
    // Si no se encuentra, buscar por user ID
    if (!barber) {
      console.log(`🔍 Buscando por user ID: ${id}`);
      barber = await Barber.findOne({ user: id }).populate('user');
      console.log(`📝 Búsqueda por user ID: ${barber ? 'ENCONTRADO' : 'NO ENCONTRADO'}`);
    }
    
    if (!barber) {
      console.log(`❌ Barbero no encontrado con ID: ${id}`);
      throw new AppError('Barbero no encontrado', 404);
    }
    
    console.log(`✅ Barbero encontrado:`, {
      barberId: barber._id,
      userId: barber.user?._id,
      userName: barber.user?.name,
      specialty: barber.specialty
    });
    
    return barber;
  }

  /**
   * Crear una nueva venta (puede ser de múltiples productos)
   */
  static async createSale(saleData) {
    const { items, barberId, total, notes } = saleData;

    // Verificar que el barbero existe (buscar por ID de barbero o usuario)
    const barber = await SaleService.findBarberByIdOrUserId(barberId);

    // Si es un solo producto (compatibilidad hacia atrás)
    if (saleData.productId) {
      const { productId, quantity } = saleData;
      
      const product = await Inventory.findById(productId);
      if (!product) {
        throw new AppError('Producto no encontrado', 404);
      }

      const currentStock = product.currentStock || product.stock || 0;
      if (quantity > currentStock) {
        throw new AppError('Stock insuficiente para realizar la venta', 400);
      }

      const sale = new Sale({
        productId,
        productName: product.name,
        quantity,
        unitPrice: product.price,
        totalAmount: quantity * product.price,
        barberId: barber._id, // Usar el ID del barbero encontrado
        barberName: barber.user?.name || barber.specialty || 'Barbero', // Mejor manejo del nombre
        notes,
        type: 'product'
      });

      await sale.save();

      // Descontar del inventario con logging detallado
      console.log(`📦 Actualizando inventario - Producto: ${productId}, Cantidad a descontar: ${quantity}`);
      const productBefore = await Inventory.findById(productId);
      console.log(`📦 Stock antes: currentStock=${productBefore.currentStock}, stock=${productBefore.stock}`);
      
      const updateResult = await Inventory.findByIdAndUpdate(
        productId,
        { 
          $inc: { 
            stock: -quantity, // Campo principal
            sales: quantity   // SOLO registrar ventas
          },
          $set: {
            currentStock: null // Remover campo obsoleto para evitar confusión
          }
        },
        { new: true } // Devolver documento actualizado
      );
      
      console.log(`📦 Stock después: currentStock=${updateResult.currentStock}, stock=${updateResult.stock}`);
      console.log(`✅ Inventario actualizado para producto ${product.name}`);

      // Actualizar estadísticas del barbero
      await SaleService.updateBarberStats(barberId, sale.totalAmount, 'product');

      return sale;
    }

    // Manejo de múltiples productos
    if (!items || !Array.isArray(items) || items.length === 0) {
      throw new AppError('Se requiere al menos un producto', 400);
    }

    const sales = [];
    
    for (const item of items) {
      const { productId, quantity, price } = item;
      
      // Verificar que el producto existe
      const product = await Inventory.findById(productId);
      if (!product) {
        throw new AppError(`Producto ${productId} no encontrado`, 404);
      }

      // Verificar stock disponible
      const currentStock = product.currentStock || product.stock || 0;
      if (quantity > currentStock) {
        throw new AppError(`Stock insuficiente para ${product.name}`, 400);
      }

      // Crear venta individual
      const sale = new Sale({
        productId,
        productName: product.name,
        quantity,
        unitPrice: price || product.price,
        totalAmount: quantity * (price || product.price),
        barberId: barber._id, // Usar el ID del barbero encontrado
        barberName: barber.user?.name || barber.specialty || 'Barbero',
        notes,
        type: 'product'
      });

      await sale.save();

      // Descontar del inventario con logging detallado
      console.log(`📦 Actualizando inventario múltiple - Producto: ${productId}, Cantidad: ${quantity}`);
      const productBefore = await Inventory.findById(productId);
      console.log(`📦 Stock antes: ${product.name} currentStock=${productBefore.currentStock}, stock=${productBefore.stock}`);
      
      const updateResult = await Inventory.findByIdAndUpdate(
        productId,
        { 
          $inc: { 
            stock: -quantity, // Campo principal
            sales: quantity   // SOLO registrar ventas
          },
          $set: {
            currentStock: null // Remover campo obsoleto para evitar confusión
          }
        },
        { new: true } // Devolver documento actualizado
      );
      
      console.log(`📦 Stock después: ${product.name} currentStock=${updateResult.currentStock}, stock=${updateResult.stock}`);
      console.log(`✅ Inventario actualizado para ${product.name}`);

      sales.push(sale);
    }

    // Actualizar estadísticas del barbero
    const totalAmount = sales.reduce((sum, sale) => sum + sale.totalAmount, 0);
    await SaleService.updateBarberStats(barberId, totalAmount, 'product');

    return sales;
  }

  /**
   * Crear una venta walk-in (servicio sin cita previa)
   */
  static async createWalkInSale(saleData) {
    const { serviceId, serviceName, price, barberId, total, notes } = saleData;

    // Verificar que el barbero existe (buscar por ID de barbero o usuario)
    const barber = await SaleService.findBarberByIdOrUserId(barberId);

    // Crear la venta walk-in
    const sale = new Sale({
      serviceId,
      serviceName,
      quantity: 1, // Los servicios siempre son cantidad 1
      unitPrice: price,
      totalAmount: total || price,
      barberId: barber._id, // Usar el ID del barbero encontrado
      barberName: barber.user?.name || barber.specialty || 'Barbero',
      type: 'walkIn',
      notes
    });

    await sale.save();
    
    // Actualizar estadísticas del barbero
    await SaleService.updateBarberStats(barberId, sale.totalAmount, 'walkIn');
    
    return sale;
  }

  /**
   * Actualizar estadísticas del barbero después de una venta
   */
  static async updateBarberStats(barberId, saleAmount, saleType = 'product') {
    try {
      console.log(`📊 Actualizando stats - BarberId: ${barberId}, Amount: ${saleAmount}, Type: ${saleType}`);
      
      // Buscar el barbero primero para obtener el ID correcto
      const barber = await SaleService.findBarberByIdOrUserId(barberId);
      
      console.log(`📊 Barbero encontrado para stats: ${barber._id}`);
      
      // Obtener estadísticas actuales antes de la actualización
      const currentBarber = await Barber.findById(barber._id);
      console.log(`📊 Stats actuales - Sales: ${currentBarber.totalSales || 0}, Revenue: ${currentBarber.totalRevenue || 0}`);
      
      // Actualizar estadísticas usando el ID del barbero encontrado
      const updateResult = await Barber.findByIdAndUpdate(
        barber._id,
        {
          $inc: {
            totalSales: 1,
            totalRevenue: saleAmount
          },
          $set: {
            lastSaleDate: new Date()
          }
        },
        { new: true } // Devolver el documento actualizado
      );
      
      console.log(`📊 Stats después de actualizar - Sales: ${updateResult.totalSales}, Revenue: ${updateResult.totalRevenue}`);
      console.log(`✅ Estadísticas actualizadas exitosamente para barbero ${barber._id}: +$${saleAmount}`);
      
      return updateResult;
    } catch (error) {
      console.error('❌ Error actualizando estadísticas del barbero:', error);
      console.error('❌ Stack:', error.stack);
      // No lanzar error para no interrumpir la venta, pero log detallado
      return null;
    }
  }

  /**
   * Obtener reporte por período (diario, semanal, mensual)
   * Para reportes semanales y mensuales, la fecha seleccionada es el punto final
   * y se calcula hacia atrás desde esa fecha
   */
  static async getReportByPeriod(type, date) {
    let startDate, endDate;
    const selectedDate = new Date(date);

    switch (type) {
      case 'daily':
        // Reporte diario: solo el día seleccionado
        startDate = new Date(selectedDate);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(selectedDate);
        endDate.setHours(23, 59, 59, 999);
        break;
        
      case 'weekly':
        // Reporte semanal: 7 días hacia atrás desde la fecha seleccionada (incluyendo el día seleccionado)
        endDate = new Date(selectedDate);
        endDate.setHours(23, 59, 59, 999);
        startDate = new Date(selectedDate);
        startDate.setDate(startDate.getDate() - 6); // 6 días atrás + día actual = 7 días
        startDate.setHours(0, 0, 0, 0);
        break;
        
      case 'monthly':
        // Reporte mensual: 30 días hacia atrás desde la fecha seleccionada (incluyendo el día seleccionado)
        endDate = new Date(selectedDate);
        endDate.setHours(23, 59, 59, 999);
        startDate = new Date(selectedDate);
        startDate.setDate(startDate.getDate() - 29); // 29 días atrás + día actual = 30 días
        startDate.setHours(0, 0, 0, 0);
        break;
        
      default:
        throw new AppError('Tipo de reporte no válido', 400);
    }

    // Agregar ventas de productos por barbero
    const productSales = await Sale.aggregate([
      {
        $match: {
          saleDate: { $gte: startDate, $lte: endDate },
          status: 'completed'
        }
      },
      {
        $group: {
          _id: '$barberId',
          barberName: { $first: '$barberName' },
          totalProducts: { $sum: '$quantity' },
          totalRevenue: { $sum: '$totalAmount' },
          sales: {
            $push: {
              productName: '$productName',
              quantity: '$quantity',
              unitPrice: '$unitPrice',
              totalAmount: '$totalAmount',
              customerName: '$customerName',
              saleDate: '$saleDate'
            }
          }
        }
      },
      {
        $sort: { totalRevenue: -1 }
      }
    ]);

    // Obtener citas (cortes) del período por barbero
    const Appointment = (await import('../models/Appointment.js')).default;
    const appointments = await Appointment.aggregate([
      {
        $match: {
          date: { $gte: startDate, $lte: endDate },
          status: 'completed'
        }
      },
      {
        $lookup: {
          from: 'barbers',
          localField: 'barberId',
          foreignField: '_id',
          as: 'barber'
        }
      },
      {
        $unwind: '$barber'
      },
      {
        $lookup: {
          from: 'services',
          localField: 'serviceId',
          foreignField: '_id',
          as: 'service'
        }
      },
      {
        $unwind: '$service'
      },
      {
        $group: {
          _id: '$barberId',
          barberName: { $first: '$barber.name' },
          totalCuts: { $sum: 1 },
          totalCutsRevenue: { $sum: '$service.price' },
          cuts: {
            $push: {
              serviceName: '$service.name',
              servicePrice: '$service.price',
              customerName: '$customerName',
              appointmentDate: '$date'
            }
          }
        }
      }
    ]);

    // Combinar datos de productos y cortes
    const barberMap = new Map();

    // Agregar ventas de productos
    productSales.forEach(barber => {
      barberMap.set(barber._id.toString(), {
        barberId: barber._id,
        barberName: barber.barberName,
        productSales: barber.sales,
        totalProducts: barber.totalProducts,
        totalProductRevenue: barber.totalRevenue,
        cuts: [],
        totalCuts: 0,
        totalCutsRevenue: 0
      });
    });

    // Agregar datos de cortes
    appointments.forEach(barber => {
      const barberId = barber._id.toString();
      if (barberMap.has(barberId)) {
        const existing = barberMap.get(barberId);
        existing.cuts = barber.cuts;
        existing.totalCuts = barber.totalCuts;
        existing.totalCutsRevenue = barber.totalCutsRevenue;
      } else {
        barberMap.set(barberId, {
          barberId: barber._id,
          barberName: barber.barberName,
          productSales: [],
          totalProducts: 0,
          totalProductRevenue: 0,
          cuts: barber.cuts,
          totalCuts: barber.totalCuts,
          totalCutsRevenue: barber.totalCutsRevenue
        });
      }
    });

    // Convertir a array y calcular totales
    const report = Array.from(barberMap.values()).map(barber => ({
      ...barber,
      totalRevenue: barber.totalProductRevenue + barber.totalCutsRevenue,
      totalServices: barber.totalProducts + barber.totalCuts
    }));

    // Ordenar por ingresos totales
    report.sort((a, b) => b.totalRevenue - a.totalRevenue);

    return {
      period: {
        type,
        startDate,
        endDate,
        label: this.getPeriodLabel(type, startDate, endDate)
      },
      data: report
    };
  }

  /**
   * Generar etiqueta del período
   */
  static getPeriodLabel(type, startDate, endDate) {
    const options = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      timeZone: 'America/Bogota'
    };

    switch (type) {
      case 'daily':
        return startDate.toLocaleDateString('es-CO', options);
      case 'weekly':
        return `Semana del ${startDate.toLocaleDateString('es-CO', options)} al ${endDate.toLocaleDateString('es-CO', options)}`;
      case 'monthly':
        return startDate.toLocaleDateString('es-CO', { 
          year: 'numeric', 
          month: 'long',
          timeZone: 'America/Bogota'
        });
      default:
        return 'Período';
    }
  }

  /**
   * Obtener reporte diario (mantener compatibilidad)
   */
  /**
   * Obtener reporte diario específico para frontend
   */
  static async getDailyReport(date) {
    try {
      const selectedDate = new Date(date);
      const startDate = new Date(selectedDate);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(selectedDate);
      endDate.setHours(23, 59, 59, 999);

      // Obtener ventas del día
      const sales = await Sale.find({
        saleDate: { $gte: startDate, $lte: endDate },
        status: 'completed'
      }).populate('productId barberId');

      // Formatear ventas para el frontend
      const formattedSales = sales.map(sale => ({
        _id: sale._id,
        total: sale.totalAmount,
        products: [{
          product: { name: sale.productName },
          quantity: sale.quantity
        }],
        barber: sale.barberId ? {
          user: { name: sale.barberName }
        } : null,
        saleDate: sale.saleDate
      }));

      // Obtener citas del día
      const appointments = await Appointment.find({
        date: { $gte: startDate, $lte: endDate },
        status: 'completed'
      }).populate({
        path: 'user',
        select: 'name'
      }).populate({
        path: 'barber',
        populate: {
          path: 'user',
          select: 'name'
        }
      }).populate({
        path: 'service',
        select: 'name price'
      });

      console.log(`📅 Encontradas ${appointments.length} citas completadas en la fecha ${selectedDate.toISOString()}`);

      // Formatear citas para el frontend
      const formattedAppointments = appointments.map(apt => {
        console.log('🔍 Cita original:', {
          _id: apt._id,
          price: apt.price,
          service: apt.service ? { name: apt.service.name, price: apt.service.price } : 'Sin servicio',
          barber: apt.barber && apt.barber.user ? apt.barber.user.name : 'Sin barbero',
          user: apt.user ? apt.user.name : 'Sin usuario'
        });
        
        return {
          _id: apt._id,
          total: apt.price || 0,
          service: { name: apt.service ? apt.service.name : 'Servicio' },
          barber: { user: { name: apt.barber && apt.barber.user ? apt.barber.user.name : 'Barbero' } },
          user: { name: apt.user ? apt.user.name : 'Cliente' },
          date: apt.date
        };
      });

      // Calcular totales
      const productTotal = formattedSales.reduce((sum, sale) => sum + sale.total, 0);
      const appointmentTotal = formattedAppointments.reduce((sum, apt) => sum + apt.total, 0);

      return {
        sales: formattedSales,
        appointments: formattedAppointments,
        walkIns: [], // Por ahora vacío
        totals: {
          productTotal,
          appointmentTotal,
          walkInTotal: 0,
          grandTotal: productTotal + appointmentTotal
        }
      };
    } catch (error) {
      console.error('Error getting daily report:', error);
      return {
        sales: [],
        appointments: [],
        walkIns: [],
        totals: {
          productTotal: 0,
          appointmentTotal: 0,
          walkInTotal: 0,
          grandTotal: 0
        }
      };
    }
  }

  /**
   * Obtener todas las ventas con filtros
   */
  static async getAllSales(filters = {}) {
    const query = {};
    
    if (filters.barberId) {
      query.barberId = filters.barberId;
    }
    
    if (filters.productId) {
      query.productId = filters.productId;
    }
    
    if (filters.startDate && filters.endDate) {
      query.saleDate = {
        $gte: new Date(filters.startDate),
        $lte: new Date(filters.endDate)
      };
    }

    const sales = await Sale.find(query)
      .populate('productId', 'name category')
      .populate('barberId', 'name')
      .sort({ saleDate: -1 });

    return sales;
  }

  /**
   * Obtener venta por ID
   */
  static async getSaleById(id) {
    const sale = await Sale.findById(id)
      .populate('productId', 'name category')
      .populate('barberId', 'name');
    
    if (!sale) {
      throw new AppError('Venta no encontrada', 404);
    }
    
    return sale;
  }

  /**
   * Cancelar venta (cambiar estado)
   */
  static async cancelSale(id) {
    const sale = await Sale.findById(id);
    if (!sale) {
      throw new AppError('Venta no encontrada', 404);
    }

    sale.status = 'cancelled';
    await sale.save();
    
    return sale;
  }

  /**
   * Obtener estadísticas de ventas por barbero
   */
  static async getBarberSalesStats(barberId) {
    try {
      const stats = await Sale.aggregate([
        {
          $match: {
            barberId: new mongoose.Types.ObjectId(barberId),
            status: 'completed'
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$totalAmount' },
            count: { $sum: 1 },
            averageSale: { $avg: '$totalAmount' }
          }
        }
      ]);

      if (stats.length === 0) {
        return {
          total: 0,
          count: 0,
          averageSale: 0
        };
      }

      return stats[0];
    } catch (error) {
      console.error('Error getting barber sales stats:', error);
      return {
        total: 0,
        count: 0,
        averageSale: 0
      };
    }
  }

  /**
   * Obtener reporte diario de ventas
   */
  /**
   * Obtener fechas disponibles con ventas para un barbero o global
   */
  static async getAvailableDates(barberId = null) {
    try {
      const match = barberId
        ? { barberId: new mongoose.Types.ObjectId(barberId), status: 'completed' }
        : { status: 'completed' };
      const sales = await Sale.aggregate([
        { $match: match },
        {
          $group: {
            _id: {
              $dateToString: {
                format: "%Y-%m-%d",
                date: "$saleDate"
              }
            }
          }
        },
        { $sort: { "_id": -1 } }
      ]);

      return sales.map(s => s._id);
    } catch (error) {
      console.error('Error obteniendo fechas disponibles de ventas:', error);
      return [];
    }
  }
}

export default SaleService;
