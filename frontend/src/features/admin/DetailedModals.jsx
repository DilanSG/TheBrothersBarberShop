import React from 'react';
import logger from '../../shared/utils/logger';
import useBodyScrollLock from '../../shared/hooks/useBodyScrollLock';
import {
  ShoppingCart, Package, Calendar, AlertTriangle, X,
  Scissors, Clock, User, FileText
} from 'lucide-react';
import { 
  SALE_TYPES, 
  SALE_TYPE_LABELS 
} from '../../shared/constants/salesConstants';

/**
 * Modal para detalles de ventas con información detallada por producto y día
 */
export const DetailedSalesModal = ({ isOpen, onClose, salesData, barberName, dateRange, loading, error }) => {
  if (!isOpen) return null;

  // Debug: Agregar logs para entender la estructura de datos
  React.useEffect(() => {
    if (salesData) {
      logger.debug('🔍 MODAL DEBUG - salesData recibida:', salesData);
      logger.debug('🔍 MODAL DEBUG - primer día:', salesData[0]);
      logger.debug('🔍 MODAL DEBUG - estructura esperada vs real:', {
        esperado: 'Array de días con { date, sales[], totalAmount, totalProducts }',
        real: typeof salesData,
        length: salesData?.length,
        firstItem: salesData?.[0]
      });
    }
  }, [salesData]);

  const formatCurrency = (amount) => new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount || 0);

  // Calcular totales
  const totalAmount = salesData?.reduce((sum, day) => sum + (day.totalAmount || 0), 0) || 0;
  const totalProducts = salesData?.reduce((sum, day) => sum + (day.totalProducts || 0), 0) || 0;

  logger.debug('🔍 MODAL TOTALES CALCULADOS:', {
    totalAmount,
    totalProducts,
    salesDataLength: salesData?.length,
    barberName,
    dateRange
  });

  // Bloquear scroll del body usando hook personalizado
  useBodyScrollLock(isOpen);

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 sm:p-6 lg:p-8">
      <div className="relative w-full max-w-sm sm:max-w-md lg:max-w-3xl mx-auto h-[90vh] sm:h-[85vh] lg:h-[80vh] flex flex-col">
        <div className="relative bg-green-500/5 backdrop-blur-md border border-green-500/20 rounded-2xl shadow-2xl shadow-green-500/20 h-full flex flex-col overflow-hidden">
          {/* Header fijo */}
          <div className="relative z-10 flex-shrink-0 p-4 sm:p-6 border-b border-green-500/20">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 rounded-lg bg-green-500/20 border border-green-500/30">
                  <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5 text-green-400" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-semibold text-white">
                    Ventas - {barberName}
                  </h3>
                  <p className="text-xs sm:text-sm text-green-300">
                    {dateRange ? `${dateRange.startDate} - ${dateRange.endDate}` : 'Período seleccionado'}
                  </p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-1 text-gray-400 hover:text-white transition-colors duration-200"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>

            {/* Resumen total */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                <p className="text-xs text-green-300 mb-1">Total productos</p>
                <p className="text-sm sm:text-base font-bold text-white">{totalProducts}</p>
              </div>
              <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                <p className="text-xs text-green-300 mb-1">Total en ventas</p>
                <p className="text-sm sm:text-base font-bold text-green-400">{formatCurrency(totalAmount)}</p>
              </div>
            </div>
          </div>

          {/* Contenido scrolleable */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar px-4 sm:px-6 pb-4 sm:pb-6">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-400 mb-4"></div>
                <p className="text-gray-400">Cargando detalles de ventas...</p>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="p-4 rounded-full bg-red-500/10 border border-red-500/20 mb-4">
                  <AlertTriangle className="w-8 h-8 text-red-400" />
                </div>
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            ) : (!salesData || salesData.length === 0) ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="p-4 rounded-full bg-green-500/10 border border-green-500/20 mb-4">
                  <ShoppingCart className="w-8 h-8 text-green-400" />
                </div>
                <p className="text-gray-400">No hay ventas registradas en este período</p>
              </div>
            ) : (
              <div className="space-y-4 pt-4">
                {salesData.map((day, dayIndex) => (
                  <div key={dayIndex} className="space-y-3">
                    {/* Encabezado del día */}
                    <div className="flex items-center justify-between py-2 border-b border-green-500/20">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-green-400" />
                        <h4 className="font-medium text-white">
                          {new Date(day.date).toLocaleDateString('es-ES', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </h4>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-green-300">
                          {day.sales?.length || 0} ventas • {day.totalProducts || 0} productos
                        </p>
                        <p className="text-sm font-bold text-green-400">
                          {formatCurrency(day.totalAmount)}
                        </p>
                      </div>
                    </div>

                    {/* Ventas del día */}
                    {day.sales?.map((sale, saleIndex) => (
                      <div key={saleIndex} className="ml-4 p-4 bg-green-500/5 border border-green-500/20 rounded-xl hover:bg-green-500/10 transition-all duration-300">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-green-400"></div>
                            <p className="text-xs text-green-300">
                              {new Date(sale.saleDate).toLocaleTimeString('es-ES', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                            {sale.customerName && (
                              <span className="text-xs text-gray-400">
                                • {sale.customerName}
                              </span>
                            )}
                          </div>
                          <p className="text-sm font-bold text-green-400">{formatCurrency(sale.total)}</p>
                        </div>

                        {/* Producto o servicio de la venta */}
                        <div className="flex items-center justify-between py-2 px-3 bg-black/20 rounded-lg">
                          <div className="flex items-center gap-2">
                            {sale.type === SALE_TYPES.PRODUCT ? (
                              <Package size={12} className="text-green-400" />
                            ) : (
                              <Scissors size={12} className="text-blue-400" />
                            )}
                            <div>
                              <p className="text-sm font-medium text-white">
                                {sale.product?.name || sale.service?.name || 'Producto/Servicio'}
                              </p>
                              <p className="text-xs text-gray-400">
                                {sale.quantity} x {formatCurrency(sale.unitPrice)}
                                {sale.type === SALE_TYPES.SERVICE && <span className="ml-1 text-blue-300">({SALE_TYPE_LABELS[SALE_TYPES.SERVICE]})</span>}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium text-green-400">
                              {formatCurrency(sale.total)}
                            </p>
                            {sale.paymentMethod && (
                              <p className="text-xs text-gray-400 capitalize">
                                {sale.paymentMethod}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Notas adicionales */}
                        {sale.notes && (
                          <div className="mt-2 p-2 bg-black/20 rounded-lg">
                            <div className="flex items-start gap-2">
                              <FileText size={12} className="text-gray-400 mt-0.5" />
                              <p className="text-xs text-gray-400">{sale.notes}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Modal para detalles de citas completadas
 */
export const DetailedAppointmentsModal = ({ isOpen, onClose, appointmentsData, barberName, dateRange, loading, error }) => {
  if (!isOpen) return null;

  // Debug: Agregar logs para entender la estructura de datos de citas
  React.useEffect(() => {
    if (appointmentsData) {
      logger.debug('🔍 MODAL CITAS DEBUG - appointmentsData recibida:', appointmentsData);
      logger.debug('🔍 MODAL CITAS DEBUG - primer día:', appointmentsData[0]);
      logger.debug('🔍 MODAL CITAS DEBUG - estructura esperada vs real:', {
        esperado: 'Array de días con { date, appointments[], totalRevenue, totalAppointments }',
        real: typeof appointmentsData,
        length: appointmentsData?.length,
        firstItem: appointmentsData?.[0]
      });
    }
  }, [appointmentsData]);

  const formatCurrency = (amount) => new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount || 0);

  // Calcular totales
  const totalAppointments = appointmentsData?.reduce((sum, day) => sum + (day.appointments?.length || 0), 0) || 0;
  const totalRevenue = appointmentsData?.reduce((sum, day) => 
    sum + (day.appointments?.reduce((daySum, apt) => daySum + (apt.service?.price || 0), 0) || 0), 0
  ) || 0;

  logger.debug('🔍 MODAL CITAS TOTALES CALCULADOS:', {
    totalAppointments,
    totalRevenue,
    appointmentsDataLength: appointmentsData?.length,
    barberName,
    dateRange
  });

  // Bloquear scroll del body usando hook personalizado
  useBodyScrollLock(isOpen);

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 sm:p-6 lg:p-8">
      <div className="relative w-full max-w-sm sm:max-w-md lg:max-w-3xl mx-auto h-[90vh] sm:h-[85vh] lg:h-[80vh] flex flex-col">
        <div className="relative bg-blue-500/5 backdrop-blur-md border border-blue-500/20 rounded-2xl shadow-2xl shadow-blue-500/20 h-full flex flex-col overflow-hidden">
          {/* Header fijo */}
          <div className="relative z-10 flex-shrink-0 p-4 sm:p-6 border-b border-blue-500/20">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 rounded-lg bg-blue-500/20 border border-blue-500/30">
                  <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-semibold text-white">
                    Citas Completadas - {barberName}
                  </h3>
                  <p className="text-xs sm:text-sm text-blue-300">
                    {dateRange ? `${dateRange.startDate} - ${dateRange.endDate}` : 'Período seleccionado'}
                  </p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-1 text-gray-400 hover:text-white transition-colors duration-200"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>

            {/* Resumen de totales */}
            <div className="grid grid-cols-2 gap-4 p-4 bg-blue-500/10 rounded-xl border border-blue-500/20">
              <div className="text-center">
                <p className="text-xs sm:text-sm text-blue-300">Total Citas</p>
                <p className="text-lg sm:text-xl font-bold text-blue-400">{totalAppointments}</p>
              </div>
              <div className="text-center">
                <p className="text-xs sm:text-sm text-blue-300">Ingresos Generados</p>
                <p className="text-lg sm:text-xl font-bold text-blue-400">{formatCurrency(totalRevenue)}</p>
              </div>
            </div>
          </div>

          {/* Contenido scrolleable */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar px-4 sm:px-6 pb-4 sm:pb-6" style={{ minHeight: 0 }}>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
                <span className="ml-3 text-blue-400">Cargando citas...</span>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="p-4 rounded-full bg-red-500/10 border border-red-500/20 mb-4">
                  <AlertTriangle className="w-8 h-8 text-red-400" />
                </div>
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            ) : (!appointmentsData || appointmentsData.length === 0) ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="p-4 rounded-full bg-blue-500/10 border border-blue-500/20 mb-4">
                  <Calendar className="w-8 h-8 text-blue-400" />
                </div>
                <p className="text-gray-400">No hay citas completadas en este período</p>
              </div>
            ) : (
              <div className="space-y-4 pt-4">
                {appointmentsData.map((day, dayIndex) => (
                  <div key={dayIndex} className="space-y-3">
                    {/* Encabezado del día */}
                    <div className="flex items-center justify-between py-2 border-b border-blue-500/20">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-blue-400" />
                        <h4 className="font-medium text-white">
                          {new Date(day.date).toLocaleDateString('es-ES', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </h4>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-blue-300">
                          {day.appointments?.length || 0} citas completadas
                        </p>
                        <p className="text-sm font-bold text-blue-400">
                          {formatCurrency(day.appointments?.reduce((sum, apt) => sum + (apt.service?.price || 0), 0) || 0)}
                        </p>
                      </div>
                    </div>

                    {/* Citas del día */}
                    {day.appointments?.map((appointment, aptIndex) => (
                      <div key={aptIndex} className="ml-4 p-4 bg-blue-500/5 border border-blue-500/20 rounded-xl hover:bg-blue-500/10 transition-all duration-300">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                            <div>
                              <p className="text-sm font-medium text-white">
                                {appointment.clientName}
                              </p>
                              <p className="text-xs text-blue-300">
                                {new Date(appointment.appointmentDate).toLocaleTimeString('es-ES', {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-bold text-blue-400">
                              {formatCurrency(appointment.service?.price || 0)}
                            </p>
                            <div className="flex items-center gap-1 mt-1">
                              <div className="w-2 h-2 rounded-full bg-green-400"></div>
                              <span className="text-xs text-green-300">Completada</span>
                            </div>
                          </div>
                        </div>

                        {/* Servicio de la cita */}
                        <div className="flex items-center justify-between py-2 px-3 bg-black/20 rounded-lg">
                          <div className="flex items-center gap-2">
                            <Scissors size={12} className="text-blue-400" />
                            <div>
                              <p className="text-sm font-medium text-white">
                                {appointment.service?.name || 'Servicio'}
                              </p>
                              <p className="text-xs text-gray-400">
                                Duración: {appointment.service?.duration || 0} min
                              </p>
                            </div>
                          </div>
                          <p className="text-sm font-medium text-blue-400">
                            {formatCurrency(appointment.service?.price || 0)}
                          </p>
                        </div>

                        {/* Notas adicionales */}
                        {appointment.notes && (
                          <div className="mt-2 p-2 bg-black/20 rounded-lg">
                            <div className="flex items-start gap-2">
                              <FileText size={12} className="text-gray-400 mt-0.5" />
                              <p className="text-xs text-gray-400">{appointment.notes}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Modal para detalles de cortes (servicios walk-in) con hora de realización
 */
export const DetailedCutsModal = ({ isOpen, onClose, cutsData, barberName, dateRange, loading, error }) => {
  if (!isOpen) return null;

  const formatCurrency = (amount) => new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount || 0);

  // Calcular totales
  const totalCuts = cutsData?.reduce((sum, day) => sum + (day.cuts?.length || 0), 0) || 0;
  const totalRevenue = cutsData?.reduce((sum, day) => sum + (day.totalAmount || 0), 0) || 0;

  // Bloquear scroll del body usando hook personalizado
  useBodyScrollLock(isOpen);

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 sm:p-6 lg:p-8">
      <div className="relative w-full max-w-sm sm:max-w-md lg:max-w-3xl mx-auto h-[90vh] sm:h-[85vh] lg:h-[80vh] flex flex-col">
        <div className="relative bg-purple-500/5 backdrop-blur-md border border-purple-500/20 rounded-2xl shadow-2xl shadow-purple-500/20 h-full flex flex-col overflow-hidden">
          {/* Header fijo */}
          <div className="relative z-10 flex-shrink-0 p-4 sm:p-6 border-b border-purple-500/20">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 rounded-lg bg-purple-500/20 border border-purple-500/30">
                  <Scissors className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-semibold text-white">
                    Cortes Realizados - {barberName}
                  </h3>
                  <p className="text-xs sm:text-sm text-purple-300">
                    {dateRange ? `${dateRange.startDate} - ${dateRange.endDate}` : 'Período seleccionado'}
                  </p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-1 text-gray-400 hover:text-white transition-colors duration-200"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>

            {/* Resumen de totales */}
            <div className="grid grid-cols-2 gap-4 p-4 bg-purple-500/10 rounded-xl border border-purple-500/20">
              <div className="text-center">
                <p className="text-xs sm:text-sm text-purple-300">Total Cortes</p>
                <p className="text-lg sm:text-xl font-bold text-purple-400">{totalCuts}</p>
              </div>
              <div className="text-center">
                <p className="text-xs sm:text-sm text-purple-300">Ingresos Generados</p>
                <p className="text-lg sm:text-xl font-bold text-purple-400">{formatCurrency(totalRevenue)}</p>
              </div>
            </div>
          </div>

          {/* Contenido scrolleable */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar px-4 sm:px-6 pb-4 sm:pb-6" style={{ minHeight: 0 }}>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400"></div>
                <span className="ml-3 text-purple-400">Cargando cortes...</span>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="p-4 rounded-full bg-red-500/10 border border-red-500/20 mb-4">
                  <AlertTriangle className="w-8 h-8 text-red-400" />
                </div>
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            ) : (!cutsData || cutsData.length === 0) ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="p-4 rounded-full bg-purple-500/10 border border-purple-500/20 mb-4">
                  <Scissors className="w-8 h-8 text-purple-400" />
                </div>
                <p className="text-gray-400">No hay cortes registrados en este período</p>
              </div>
            ) : (
              <div className="space-y-4 pt-4">
                {cutsData.map((day, dayIndex) => (
                  <div key={dayIndex} className="space-y-3">
                    {/* Encabezado del día */}
                    <div className="flex items-center justify-between py-2 border-b border-purple-500/20">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-purple-400" />
                        <h4 className="font-medium text-white">
                          {new Date(day.date).toLocaleDateString('es-ES', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </h4>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-purple-300">
                          {day.cuts?.length || 0} cortes realizados
                        </p>
                        <p className="text-sm font-bold text-purple-400">
                          {formatCurrency(day.totalAmount)}
                        </p>
                      </div>
                    </div>

                    {/* Cortes del día */}
                    {day.cuts?.map((cut, cutIndex) => (
                      <div key={cutIndex} className="ml-4 p-4 bg-purple-500/5 border border-purple-500/20 rounded-xl hover:bg-purple-500/10 transition-all duration-300">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-purple-400"></div>
                            <div>
                              <p className="text-xs text-purple-300 flex items-center gap-1">
                                <Clock size={10} />
                                {new Date(cut.saleDate).toLocaleTimeString('es-ES', {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </p>
                              {cut.customerName && (
                                <p className="text-sm text-white mt-1">
                                  {cut.customerName}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-bold text-purple-400">
                              {formatCurrency(cut.total)}
                            </p>
                            {cut.paymentMethod && (
                              <p className="text-xs text-gray-400 capitalize">
                                {cut.paymentMethod}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Servicio del corte */}
                        <div className="flex items-center justify-between py-2 px-3 bg-black/20 rounded-lg">
                          <div className="flex items-center gap-2">
                            <Scissors size={12} className="text-purple-400" />
                            <div>
                              <p className="text-sm font-medium text-white">
                                {cut.service?.name || 'Corte de Cabello'}
                              </p>
                              <p className="text-xs text-gray-400">
                                {cut.quantity} servicio(s) • {formatCurrency(cut.unitPrice)} c/u
                              </p>
                            </div>
                          </div>
                          <p className="text-sm font-medium text-purple-400">
                            {formatCurrency(cut.total)}
                          </p>
                        </div>

                        {/* Notas adicionales */}
                        {cut.notes && (
                          <div className="mt-2 p-2 bg-black/20 rounded-lg">
                            <div className="flex items-start gap-2">
                              <FileText size={12} className="text-gray-400 mt-0.5" />
                              <p className="text-xs text-gray-400">{cut.notes}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
