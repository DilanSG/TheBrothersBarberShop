import mongoose from 'mongoose';
import Sale from '../models/Sale.js';
import Barber from '../models/Barber.js';
import Inventory from '../models/Inventory.js';
import Appointment from '../models/Appointment.js';
import InventoryLogService from './inventoryLogService.js';
import { reportsCacheService } from './reportsCacheService.js';
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

      // Registrar log de venta en inventario (carrito completo)
      try {
        await InventoryLogService.createLog(
          'sale',
          null, // No es un producto específico, es un carrito
          'Venta de productos',
          barber.user?._id || barber._id,
          barber.user ? 'barber' : 'admin',
          {
            message: `Carrito vendido: 1 producto`,
            totalAmount: sale.totalAmount,
            productName: product.name,
            quantity: quantity
          }
        );
        console.log(`📝 Log de carrito creado - Total: $${sale.totalAmount}`);
      } catch (logError) {
        console.error('Error al crear log de carrito:', logError);
      }

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

    // Registrar UN SOLO log de venta para todo el carrito
    try {
      const productNames = sales.map(sale => `${sale.productName} (${sale.quantity})`).join(', ');
      const totalItems = sales.reduce((sum, sale) => sum + sale.quantity, 0);
      
      await InventoryLogService.createLog(
        'sale',
        null, // No es un producto específico, es un carrito
        'Carrito de productos',
        barber.user?._id || barber._id,
        barber.user ? 'barber' : 'admin',
        {
          message: `Carrito vendido: ${sales.length} productos diferentes`,
          totalAmount: totalAmount,
          products: productNames,
          totalItems: totalItems
        }
      );
      console.log(`📝 Log de carrito múltiple creado - ${sales.length} productos - Total: $${totalAmount}`);
    } catch (logError) {
      console.error('Error al crear log de carrito múltiple:', logError);
    }

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
  static async getBarberSalesStats(barberId, dateFilter = {}) {
    try {
      // Construir filtros de fecha
      const matchConditions = {
        barberId: new mongoose.Types.ObjectId(barberId),
        status: 'completed'
      };

      // Aplicar filtros de fecha
      if (dateFilter.date) {
        // Filtro por fecha específica - usar saleDate en lugar de createdAt
        const targetDate = new Date(dateFilter.date + 'T00:00:00.000-05:00'); // Colombia UTC-5
        const startOfDay = new Date(targetDate);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(targetDate);
        endOfDay.setHours(23, 59, 59, 999);
        
        matchConditions.saleDate = {
          $gte: startOfDay,
          $lte: endOfDay
        };
      } else if (dateFilter.startDate && dateFilter.endDate) {
        // Filtro por rango de fechas - usar saleDate en lugar de createdAt
        const startDate = new Date(dateFilter.startDate + 'T00:00:00.000-05:00'); // Colombia UTC-5
        startDate.setHours(0, 0, 0, 0);
        const endDate = new Date(dateFilter.endDate + 'T23:59:59.999-05:00'); // Colombia UTC-5
        endDate.setHours(23, 59, 59, 999);
        
        matchConditions.saleDate = {
          $gte: startDate,
          $lte: endDate
        };
      }

      console.log(`💰 Filtros aplicados para barbero ${barberId}:`, {
        matchConditions,
        dateFilter
      });

      const stats = await Sale.aggregate([
        {
          $match: matchConditions
        },
        {
          $group: {
            _id: '$type', // Agrupar por tipo (product, walkIn)
            total: { $sum: '$totalAmount' },
            count: { $sum: 1 }, // Número de transacciones
            totalQuantity: { $sum: '$quantity' }, // Suma de productos/items
            averageSale: { $avg: '$totalAmount' }
          }
        }
      ]);

      // Inicializar respuesta con valores por defecto
      const result = {
        ventas: [], // Solo productos
        cortes: [], // Solo walk-ins
        total: 0,
        count: 0,
        totalQuantity: 0, // Nueva suma de quantities
        averageSale: 0
      };

      // Procesar resultados y separar por tipo
      let totalGeneral = 0;
      let countGeneral = 0;
      let totalQuantityGeneral = 0; // Solo productos, NO cortes

      stats.forEach(stat => {
        totalGeneral += stat.total;
        countGeneral += stat.count;

        if (stat._id === 'product') {
          // Ventas de productos
          totalQuantityGeneral += stat.totalQuantity || 0; // Solo sumar productos
          result.ventas = [{
            total: stat.total,
            count: stat.count,
            totalQuantity: stat.totalQuantity,
            average: stat.averageSale
          }];
        } else if (stat._id === 'walkIn') {
          // Cortes walk-in - NO se suman a totalQuantityGeneral
          result.cortes = [{
            total: stat.total,
            count: stat.count,
            totalQuantity: stat.totalQuantity,
            average: stat.averageSale
          }];
        }
      });

      // Totales generales
      result.total = totalGeneral;
      result.count = countGeneral;
      result.totalQuantity = totalQuantityGeneral;
      result.averageSale = countGeneral > 0 ? totalGeneral / countGeneral : 0;

      console.log(`💰 Stats separadas para barbero ${barberId} con filtros:`, {
        productos: result.ventas,
        walkIns: result.cortes,
        total: result.total,
        filteredBy: dateFilter
      });

      return result;
    } catch (error) {
      console.error('Error getting barber sales stats:', error);
      return {
        ventas: [],
        cortes: [],
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

  /**
   * Obtener reporte detallado de ventas agrupado por día con detalle de productos
   */
  static async getDetailedSalesReport(barberId, startDate, endDate) {
    try {
      console.log(`🔍 Obteniendo reporte detallado de ventas - Barbero: ${barberId}, Desde: ${startDate || 'SIN LIMITE'}, Hasta: ${endDate || 'SIN LIMITE'}`);
      
      const barber = await SaleService.findBarberByIdOrUserId(barberId);
      console.log(`👤 Barbero encontrado: ${barber?.user?.name || barber?.name}, ID: ${barber._id}`);
      
      let start, end;
      let dateQuery = {};
      
      if (startDate && endDate) {
        // Usar la misma lógica que getBarberAppointmentStats (más simple y consistente)
        start = new Date(startDate + 'T00:00:00.000-05:00'); // Colombia UTC-5
        start.setHours(0, 0, 0, 0);
        end = new Date(endDate + 'T23:59:59.999-05:00'); // Colombia UTC-5
        end.setHours(23, 59, 59, 999);
        
        dateQuery = { saleDate: { $gte: start, $lte: end } };
        console.log(`📅 Rango de fechas procesado con zona horaria Colombia: ${start.toISOString()} - ${end.toISOString()}`);
      } else {
        console.log(`📅 Sin filtro de fechas - obteniendo todos los registros`);
      }

      // Usar cache inteligente
      return await reportsCacheService.withCache(
        'detailed-sales',
        barber._id.toString(),
        start || new Date(0),
        end || new Date(),
        async () => {
          console.log(`📊 Generando reporte detallado de ventas desde DB`);
          
          const sales = await Sale.find({
            barberId: barber._id,
            ...dateQuery,
            status: 'completed',
            type: 'product' // Solo productos, NO walk-ins
          })
          .populate('productId', 'name price')
          .sort({ saleDate: 1 });
          
          console.log(`🔍 Ventas encontradas en DB: ${sales.length} registros para barbero ${barber._id}`);
          console.log(`🔍 Query utilizada: barberId=${barber._id}${dateQuery.saleDate ? `, saleDate entre ${start ? start.toISOString() : 'undefined'} y ${end ? end.toISOString() : 'undefined'}` : ', sin filtro de fecha'}, status=completed`);
          if (sales.length > 0) {
            console.log(`📊 Primera venta: ${sales[0].saleDate}, Total: ${sales[0].totalAmount}`);
            console.log(`📊 Última venta: ${sales[sales.length - 1].saleDate}, Total: ${sales[sales.length - 1].totalAmount}`);
          } else {
            // Verificar si hay ventas para este barbero sin filtro de fecha
            const allSalesForBarber = await Sale.countDocuments({ barberId: barber._id });
            console.log(`🔍 Total de ventas para este barbero (sin filtro de fecha): ${allSalesForBarber}`);
            
            // Verificar si hay ventas en general
            const totalSales = await Sale.countDocuments();
            console.log(`🔍 Total de ventas en la base de datos: ${totalSales}`);
          }

          // Agrupar por día
          const salesByDay = {};
          sales.forEach(sale => {
            const dayKey = sale.saleDate.toISOString().split('T')[0];
            
            if (!salesByDay[dayKey]) {
              salesByDay[dayKey] = {
                date: dayKey,
                sales: [],
                totalAmount: 0,
                totalProducts: 0
              };
            }

            // Crear el detalle de la venta individual (solo productos)
            const saleDetail = {
              _id: sale._id,
              saleDate: sale.saleDate,
              total: sale.totalAmount,
              notes: sale.notes,
              type: sale.type, // Siempre será 'product'
              quantity: sale.quantity,
              unitPrice: sale.unitPrice,
              customerName: sale.customerName,
              paymentMethod: sale.paymentMethod
            };

            // Agregar información del producto
            if (sale.productId) {
              saleDetail.product = {
                _id: sale.productId._id,
                name: sale.productId.name || sale.productName,
                price: sale.productId.price || sale.unitPrice
              };
            }

            salesByDay[dayKey].sales.push(saleDetail);
            salesByDay[dayKey].totalAmount += sale.totalAmount;
            salesByDay[dayKey].totalProducts += sale.quantity;
          });

          const result = Object.values(salesByDay).sort((a, b) => new Date(a.date) - new Date(b.date));
          
          console.log(`✅ Reporte detallado generado: ${result.length} días con ventas`);
          return result;
        }
      );

    } catch (error) {
      console.error('Error generando reporte detallado de ventas:', error);
      throw error;
    }
  }

  /**
   * Obtener detalles de cortes walk-in agrupados por día
   */
  static async getWalkInDetails(barberId, startDate, endDate) {
    try {
      console.log(`🔍 Obteniendo detalles de cortes walk-in - Barbero: ${barberId}, Desde: ${startDate || 'SIN LIMITE'}, Hasta: ${endDate || 'SIN LIMITE'}`);
      
      const barber = await SaleService.findBarberByIdOrUserId(barberId);
      
      let start, end;
      let dateQuery = {};
      
      if (startDate && endDate) {
        // Usar la misma lógica que getBarberAppointmentStats (más simple y consistente)
        start = new Date(startDate + 'T00:00:00.000-05:00'); // Colombia UTC-5
        start.setHours(0, 0, 0, 0);
        end = new Date(endDate + 'T23:59:59.999-05:00'); // Colombia UTC-5
        end.setHours(23, 59, 59, 999);
        
        dateQuery = { saleDate: { $gte: start, $lte: end } };
      }

      // Usar cache inteligente
      return await reportsCacheService.withCache(
        'walk-in-details',
        barber._id.toString(),
        start || new Date(0),
        end || new Date(),
        async () => {
          console.log(`📊 Generando detalles de walk-in desde DB`);
          
          // Buscar ventas walk-in (ventas sin items de productos, solo servicios)
          const walkInSales = await Sale.find({
            barberId: barber._id,
            ...dateQuery,
            status: 'completed',
            type: 'walkIn'
          })
          .populate('serviceId', 'name price duration')
          .sort({ saleDate: 1 });

          // Agrupar por día
          const walkInsByDay = {};
          walkInSales.forEach(sale => {
            const dayKey = sale.saleDate.toISOString().split('T')[0];
            
            if (!walkInsByDay[dayKey]) {
              walkInsByDay[dayKey] = {
                date: dayKey,
                walkIns: [],
                totalAmount: 0,
                totalServices: 0
              };
            }

            const walkInDetail = {
              _id: sale._id,
              saleDate: sale.saleDate,
              total: sale.total,
              notes: sale.notes,
              services: sale.services ? sale.services.map(service => ({
                service: {
                  _id: service.service._id,
                  name: service.service.name,
                  price: service.service.price,
                  duration: service.service.duration
                },
                price: service.price
              })) : []
            };

            walkInsByDay[dayKey].walkIns.push(walkInDetail);
            walkInsByDay[dayKey].totalAmount += sale.total;
            walkInsByDay[dayKey].totalServices += sale.services ? sale.services.length : 0;
          });

          const result = Object.values(walkInsByDay).sort((a, b) => new Date(a.date) - new Date(b.date));
          
          console.log(`✅ Detalles de walk-in generados: ${result.length} días con cortes`);
          return result;
        }
      );

    } catch (error) {
      console.error('Error generando detalles de walk-in:', error);
      throw error;
    }
  }

  /**
   * Obtener reporte detallado de cortes (servicios walk-in) agrupado por día
   */
  static async getDetailedCutsReport(barberId, startDate, endDate) {
    try {
      console.log(`🔍 Obteniendo reporte detallado de cortes - Barbero: ${barberId}, Desde: ${startDate || 'SIN LIMITE'}, Hasta: ${endDate || 'SIN LIMITE'}`);
      
      const barber = await SaleService.findBarberByIdOrUserId(barberId);
      console.log(`👤 Barbero encontrado: ${barber?.user?.name || barber?.name}, ID: ${barber._id}`);
      
      let start, end;
      let dateQuery = {};
      
      if (startDate && endDate) {
        start = new Date(startDate);
        end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        dateQuery = { saleDate: { $gte: start, $lte: end } };
        console.log(`📅 Rango de fechas procesado: ${start.toISOString()} - ${end.toISOString()}`);
      } else {
        console.log(`📅 Sin filtro de fechas - obteniendo todos los registros`);
      }

      // Usar cache inteligente
      return await reportsCacheService.withCache(
        'detailed-cuts',
        barber._id.toString(),
        start || new Date(0),
        end || new Date(),
        async () => {
          console.log(`📊 Generando reporte detallado de cortes desde DB`);
          
          const cuts = await Sale.find({
            barberId: barber._id,
            ...dateQuery,
            status: 'completed',
            type: 'walkIn'
          })
          .populate('serviceId', 'name price duration')
          .sort({ saleDate: 1 });
          
          console.log(`🔍 Cortes encontrados en DB: ${cuts.length} registros para barbero ${barber._id}`);
          console.log(`🔍 Query utilizada: barberId=${barber._id}${dateQuery.saleDate ? `, saleDate entre ${start ? start.toISOString() : 'undefined'} y ${end ? end.toISOString() : 'undefined'}` : ', sin filtro de fecha'}, status=completed, type=walkIn`);
          if (cuts.length > 0) {
            console.log(`📊 Primer corte: ${cuts[0].saleDate}, Total: ${cuts[0].totalAmount}`);
            console.log(`📊 Último corte: ${cuts[cuts.length - 1].saleDate}, Total: ${cuts[cuts.length - 1].totalAmount}`);
          } else {
            // Verificar si hay cortes para este barbero sin filtro de fecha
            const allCutsForBarber = await Sale.countDocuments({ barberId: barber._id, type: 'walkIn' });
            console.log(`🔍 Total de cortes para este barbero (sin filtro de fecha): ${allCutsForBarber}`);
            
            // Verificar si hay cortes en general
            const totalCuts = await Sale.countDocuments({ type: 'walkIn' });
            console.log(`🔍 Total de cortes en la base de datos: ${totalCuts}`);
          }

          // Agrupar por día
          const cutsByDay = {};
          cuts.forEach(cut => {
            const dayKey = cut.saleDate.toISOString().split('T')[0];
            
            if (!cutsByDay[dayKey]) {
              cutsByDay[dayKey] = {
                date: dayKey,
                cuts: [],
                totalAmount: 0,
                totalCuts: 0
              };
            }

            // Crear el detalle del corte individual
            const cutDetail = {
              _id: cut._id,
              saleDate: cut.saleDate,
              total: cut.totalAmount,
              notes: cut.notes,
              customerName: cut.customerName,
              paymentMethod: cut.paymentMethod,
              quantity: cut.quantity,
              unitPrice: cut.unitPrice
            };

            // Agregar información del servicio
            if (cut.serviceId) {
              cutDetail.service = {
                _id: cut.serviceId._id,
                name: cut.serviceId.name || cut.serviceName,
                price: cut.serviceId.price || cut.unitPrice,
                duration: cut.serviceId.duration
              };
            }

            cutsByDay[dayKey].cuts.push(cutDetail);
            cutsByDay[dayKey].totalAmount += cut.totalAmount;
            cutsByDay[dayKey].totalCuts += cut.quantity;
          });

          const result = Object.values(cutsByDay).sort((a, b) => new Date(a.date) - new Date(b.date));
          
          console.log(`✅ Reporte detallado de cortes generado: ${result.length} días con cortes`);
          return result;
        }
      );

    } catch (error) {
      console.error('Error generando reporte detallado de cortes:', error);
      throw error;
    }
  }

  /**
   * Obtener resumen financiero completo para reportes
   */
  static async getFinancialSummary(startDate, endDate) {
    try {
      console.log(`📊 Generando resumen financiero: ${startDate} - ${endDate}`);

      const start = new Date(startDate + 'T00:00:00.000Z');
      const end = new Date(endDate + 'T23:59:59.999Z');

      // Agregación principal para obtener todos los datos basada en el modelo real
      const summary = await Sale.aggregate([
        {
          $match: {
            createdAt: { $gte: start, $lte: end },
            status: 'completed'
          }
        },
        {
          $facet: {
            // Resumen general
            general: [
              {
                $group: {
                  _id: null,
                  totalRevenue: { $sum: '$totalAmount' },
                  totalSales: { $sum: 1 },
                  totalItems: { $sum: '$quantity' }
                }
              }
            ],
            
            // Breakdown por servicios y productos
            itemsBreakdown: [
              {
                $group: {
                  _id: {
                    type: '$type',
                    itemId: {
                      $cond: [
                        { $eq: ['$type', 'walkIn'] },
                        '$serviceId',
                        '$productId'
                      ]
                    },
                    name: {
                      $cond: [
                        { $eq: ['$type', 'walkIn'] },
                        '$serviceName',
                        '$productName'
                      ]
                    }
                  },
                  totalRevenue: { $sum: '$totalAmount' },
                  totalQuantity: { $sum: '$quantity' },
                  count: { $sum: 1 }
                }
              }
            ],

            // Breakdown por métodos de pago
            paymentMethods: [
              {
                $group: {
                  _id: '$paymentMethod',
                  totalAmount: { $sum: '$totalAmount' },
                  count: { $sum: 1 }
                }
              }
            ],

            // Datos diarios
            dailyData: [
              {
                $group: {
                  _id: {
                    $dateToString: {
                      format: '%Y-%m-%d',
                      date: '$createdAt',
                      timezone: 'America/Bogota'
                    }
                  },
                  totalRevenue: { $sum: '$totalAmount' },
                  totalSales: { $sum: 1 }
                }
              },
              { $sort: { _id: 1 } }
            ]
          }
        }
      ]);

      const result = summary[0];

      // Procesar resultados
      const generalSummary = result.general[0] || {
        totalRevenue: 0,
        totalSales: 0,
        totalItems: 0
      };

      // Separar servicios y productos
      const serviceBreakdown = result.itemsBreakdown
        .filter(item => item._id.type === 'walkIn')
        .map(item => ({
          serviceId: item._id.itemId,
          serviceName: item._id.name || 'Servicio sin nombre',
          totalRevenue: item.totalRevenue,
          totalQuantity: item.totalQuantity,
          count: item.count
        }));

      const productBreakdown = result.itemsBreakdown
        .filter(item => item._id.type === 'product')
        .map(item => ({
          productId: item._id.itemId,
          productName: item._id.name || 'Producto sin nombre',
          totalRevenue: item.totalRevenue,
          totalQuantity: item.totalQuantity,
          count: item.count
        }));

      // Procesar métodos de pago
      const paymentMethodBreakdown = result.paymentMethods.reduce((acc, pm) => {
        acc[pm._id || 'unknown'] = pm.totalAmount;
        return acc;
      }, {});

      // Datos diarios formateados
      const dailyData = result.dailyData.map(day => ({
        date: day._id,
        totalRevenue: day.totalRevenue,
        totalSales: day.totalSales
      }));

      // Calcular totales por tipo
      const serviceRevenue = serviceBreakdown.reduce((sum, s) => sum + s.totalRevenue, 0);
      const productRevenue = productBreakdown.reduce((sum, p) => sum + p.totalRevenue, 0);
      const totalServices = serviceBreakdown.reduce((sum, s) => sum + s.totalQuantity, 0);
      const totalProducts = productBreakdown.reduce((sum, p) => sum + p.totalQuantity, 0);

      // Obtener total de citas del período
      const totalAppointments = await Appointment.countDocuments({
        date: { $gte: start, $lte: end },
        status: 'completed'
      });

      const financialSummary = {
        summary: {
          totalRevenue: generalSummary.totalRevenue,
          totalServices: totalServices,
          totalProducts: totalProducts,
          totalAppointments,
          paymentMethods: paymentMethodBreakdown
        },
        serviceBreakdown,
        productBreakdown,
        paymentMethodBreakdown: result.paymentMethods,
        dailyData
      };

      console.log(`✅ Resumen financiero generado:`, {
        totalRevenue: financialSummary.summary.totalRevenue,
        totalServices: totalServices,
        totalProducts: totalProducts,
        daysWithData: dailyData.length
      });

      return financialSummary;

    } catch (error) {
      console.error('Error generando resumen financiero:', error);
      throw error;
    }
  }

  /**
   * Crear venta desde carrito con métodos de pago múltiples
   */
  static async createCartSale(cartData) {
    const { cart, barberId, notes } = cartData;
    
    console.log('🛒 Creando venta desde carrito:', { cartLength: cart.length, barberId, notes });

    // Verificar que el barbero existe
    const barber = await SaleService.findBarberByIdOrUserId(barberId);

    // Validar que hay items en el carrito
    if (!cart || !Array.isArray(cart) || cart.length === 0) {
      throw new AppError('El carrito no puede estar vacío', 400);
    }

    // Procesar cada item del carrito
    const saleItems = [];
    let totalAmount = 0;

    for (const cartItem of cart) {
      const { 
        id, 
        type, 
        name, 
        price, 
        quantity, 
        paymentMethod = 'efectivo',
        serviceId 
      } = cartItem;

      let saleItem;

      if (type === 'product') {
        // Validar producto y stock
        const product = await Inventory.findById(id);
        if (!product) {
          throw new AppError(`Producto ${name} no encontrado`, 404);
        }

        const currentStock = product.stock || 0;
        if (quantity > currentStock) {
          throw new AppError(`Stock insuficiente para ${product.name}. Disponible: ${currentStock}`, 400);
        }

        // Crear item de venta para producto
        saleItem = {
          productId: id,
          productName: name,
          type: 'product',
          quantity,
          unitPrice: price,
          totalAmount: quantity * price,
          paymentMethod
        };

        // Actualizar inventario
        await Inventory.findByIdAndUpdate(
          id,
          { 
            $inc: { 
              stock: -quantity,
              sales: quantity
            }
          }
        );

        console.log(`📦 Stock actualizado para ${name}: -${quantity} unidades`);

      } else if (type === 'walkIn') {
        // Crear item de venta para servicio walk-in
        saleItem = {
          serviceId: serviceId,
          serviceName: name,
          type: 'walkIn',
          quantity: 1,
          unitPrice: price,
          totalAmount: price,
          paymentMethod
        };
      } else {
        throw new AppError(`Tipo de item no válido: ${type}`, 400);
      }

      saleItems.push(saleItem);
      totalAmount += saleItem.totalAmount;
    }

    // Crear la venta con todos los items
    const sale = new Sale({
      items: saleItems,
      totalAmount,
      barberId: barber._id,
      barberName: barber.user?.name || barber.specialty || 'Barbero',
      notes
    });

    await sale.save();

    // Actualizar estadísticas del barbero
    await SaleService.updateBarberStats(barberId, sale.totalAmount, 'mixed');

    // Registrar log de venta
    try {
      const productNames = saleItems
        .filter(item => item.type === 'product')
        .map(item => item.productName);
      const serviceNames = saleItems
        .filter(item => item.type === 'walkIn')
        .map(item => item.serviceName);

      await InventoryLogService.createLog(
        'sale',
        null,
        'Venta desde carrito con métodos de pago múltiples',
        barber.user?._id || barber._id,
        barber.user ? 'barber' : 'admin',
        {
          message: `Carrito vendido: ${saleItems.length} items`,
          totalAmount: sale.totalAmount,
          products: productNames,
          services: serviceNames,
          paymentSummary: sale.paymentSummary
        }
      );
      console.log(`📝 Log de carrito creado - Total: $${sale.totalAmount}`);
    } catch (logError) {
      console.error('Error al crear log de carrito:', logError);
    }

    console.log('✅ Venta desde carrito creada exitosamente:', {
      saleId: sale._id,
      totalAmount: sale.totalAmount,
      itemsCount: saleItems.length,
      paymentSummary: sale.paymentSummary
    });

    return sale;
  }
}

export default SaleService;
