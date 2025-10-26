import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, AlertTriangle, Crown, Shield, Calendar,
  TrendingUp, Scissors, Package, Download, X, CalendarDays, FileText,
  ShoppingCart, DollarSign, Clock, Eye, Filter, RefreshCw, Receipt
} from 'lucide-react';
import { useAuth } from '@contexts/AuthContext';
import { useNotification } from '@contexts/NotificationContext';
import { getCurrentDateColombia } from '@/shared/utils/dateUtils';
import { PageContainer } from '@components/layout/PageContainer';
import GradientText from '@components/ui/GradientText';
import GradientButton from '@components/ui/GradientButton';
import { SimpleDateFilter } from '@components/common/SimpleDateFilter';
import { useBarberStats } from '@hooks/useBarberStats';
import { useBarberUI } from '@hooks/useBarberUI';
import { useDetailedReports } from '@hooks/useDetailedReports';
import CalendarModal from '@components/modals/CalendarModal';
import logger from '@utils/logger';
import { 
  DetailedSalesModal, 
  DetailedCutsModal, 
  DetailedAppointmentsModal 
} from './DetailedModals';

// DayRangeFilter component removed - using SimpleDateFilter from Reports for consistency

/**
 * Modal para detalles de ventas
 */
const SalesDetailModal = ({ isOpen, onClose, salesData, barberName, dateRange }) => {
  if (!isOpen) return null;

  const totalAmount = salesData?.reduce((sum, sale) => sum + (sale.total || 0), 0) || 0;
  const formatCurrency = (amount) => new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);

  // Bloquear scroll del body
  React.useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = 'unset'; };
  }, []);

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 sm:p-6 lg:p-8">
      <div className="relative w-full max-w-sm sm:max-w-md lg:max-w-2xl mx-auto h-[90vh] sm:h-[85vh] lg:h-[80vh] flex flex-col">
        <div className="relative bg-green-500/5 backdrop-blur-md border border-green-500/20 rounded-2xl shadow-2xl shadow-green-500/20 h-full flex flex-col overflow-hidden">
          {/* Header fijo */}
          <div className="relative z-10 flex-shrink-0 p-4 sm:p-6">
            <div className="flex items-center justify-between">
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
            
            {/* Resumen */}
            <div className="mt-4 p-3 sm:p-4 bg-green-500/10 rounded-xl border border-green-500/20">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <p className="text-xs sm:text-sm text-green-300">Total Productos</p>
                  <p className="text-lg sm:text-xl font-bold text-white">{salesData?.length || 0}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs sm:text-sm text-green-300">Total Ventas</p>
                  <p className="text-lg sm:text-xl font-bold text-green-400">{formatCurrency(totalAmount)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Contenido scrolleable */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar px-4 sm:px-6 pb-4 sm:pb-6" style={{ minHeight: 0 }}>
            {!salesData || salesData.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="p-4 rounded-full bg-green-500/10 border border-green-500/20 mb-4">
                  <ShoppingCart className="w-8 h-8 text-green-400" />
                </div>
                <p className="text-gray-400">No hay ventas registradas en este período</p>
              </div>
            ) : (
              <div className="space-y-3">
                {salesData.map((sale, index) => (
                  <div key={`${sale._id || sale.id || index}`} className="group relative p-4 bg-green-500/5 border border-green-500/20 rounded-xl hover:bg-green-500/10 transition-all duration-300">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Package size={14} className="text-green-400" />
                          <h4 className="text-sm font-medium text-white">
                            Venta #{sale.saleNumber || sale._id?.slice(-6) || index + 1}
                          </h4>
                          <span className="px-2 py-1 text-xs bg-green-500/20 text-green-300 rounded-full">
                            {new Date(sale.date || sale.createdAt).toLocaleDateString('es-ES')}
                          </span>
                        </div>
                        <div className="text-xs text-gray-300 mb-2">
                          <span className="text-white">{new Date(sale.date || sale.createdAt).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-green-400">{formatCurrency(sale.total || 0)}</p>
                      </div>
                    </div>
                    
                    {/* Lista de productos en la venta */}
                    {sale.items && sale.items.length > 0 ? (
                      <div className="space-y-2 border-t border-green-500/20 pt-3">
                        <p className="text-xs font-medium text-green-300 mb-2">Productos vendidos:</p>
                        {sale.items.map((item, itemIndex) => (
                          <div key={itemIndex} className="flex items-center justify-between p-2 bg-green-500/5 rounded-lg">
                            <div className="flex-1">
                              <p className="text-xs font-medium text-white">{item.name || item.productName}</p>
                              <p className="text-xs text-gray-400">Cantidad: {item.quantity || 1}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-green-400">{formatCurrency(item.price || 0)}</p>
                              <p className="text-xs font-medium text-white">{formatCurrency((item.price || 0) * (item.quantity || 1))}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="border-t border-green-500/20 pt-3">
                        <div className="flex items-center justify-between p-2 bg-green-500/5 rounded-lg">
                          <div className="flex-1">
                            <p className="text-xs font-medium text-white">{sale.productName || sale.name || 'Producto sin especificar'}</p>
                            <p className="text-xs text-gray-400">Cantidad: {sale.quantity || 1}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-green-400">{formatCurrency(sale.price || sale.total || 0)}</p>
                          </div>
                        </div>
                      </div>
                    )}
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
 * Modal para detalles de citas
 */
const AppointmentsDetailModal = ({ isOpen, onClose, appointmentsData, barberName, dateRange }) => {
  if (!isOpen) return null;

  const totalAmount = appointmentsData?.reduce((sum, apt) => sum + (apt.total || apt.price || 0), 0) || 0;
  const formatCurrency = (amount) => new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);

  // Bloquear scroll del body
  React.useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = 'unset'; };
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed': return 'text-green-400 bg-green-500/20 border-green-500/30';
      case 'pending': return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30';
      case 'cancelled': return 'text-red-400 bg-red-500/20 border-red-500/30';
      case 'completed': return 'text-blue-400 bg-blue-500/20 border-blue-500/30';
      default: return 'text-gray-400 bg-gray-500/20 border-gray-500/30';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'confirmed': return 'Confirmada';
      case 'pending': return 'Pendiente';
      case 'cancelled': return 'Cancelada';
      case 'completed': return 'Completada';
      default: return status || 'Sin estado';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 sm:p-6 lg:p-8">
      <div className="relative w-full max-w-sm sm:max-w-md lg:max-w-2xl mx-auto h-[90vh] sm:h-[85vh] lg:h-[80vh] flex flex-col">
        <div className="relative bg-blue-500/5 backdrop-blur-md border border-blue-500/20 rounded-2xl shadow-2xl shadow-blue-500/20 h-full flex flex-col overflow-hidden">
          {/* Header fijo */}
          <div className="relative z-10 flex-shrink-0 p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 rounded-lg bg-blue-500/20 border border-blue-500/30">
                  <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-semibold text-white">
                    Citas - {barberName}
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
            
            {/* Resumen */}
            <div className="mt-4 p-3 sm:p-4 bg-blue-500/10 rounded-xl border border-blue-500/20">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <p className="text-xs sm:text-sm text-blue-300">Total Citas</p>
                  <p className="text-lg sm:text-xl font-bold text-white">{appointmentsData?.length || 0}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs sm:text-sm text-blue-300">Ingresos</p>
                  <p className="text-lg sm:text-xl font-bold text-blue-400">{formatCurrency(totalAmount)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Contenido scrolleable */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar px-4 sm:px-6 pb-4 sm:pb-6" style={{ minHeight: 0 }}>
            {!appointmentsData || appointmentsData.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="p-4 rounded-full bg-blue-500/10 border border-blue-500/20 mb-4">
                  <Clock className="w-8 h-8 text-blue-400" />
                </div>
                <p className="text-gray-400">No hay citas registradas en este período</p>
              </div>
            ) : (
              <div className="space-y-3">
                {appointmentsData.map((appointment, index) => (
                  <div key={`${appointment._id || appointment.id || index}`} className="group relative p-4 bg-blue-500/5 border border-blue-500/20 rounded-xl hover:bg-blue-500/10 transition-all duration-300">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Scissors size={14} className="text-blue-400" />
                          <h4 className="text-sm font-medium text-white">
                            Cita #{appointment.appointmentNumber || appointment._id?.slice(-6) || index + 1}
                          </h4>
                          <span className="px-2 py-1 text-xs bg-blue-500/20 text-blue-300 rounded-full font-medium">
                            Completada
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs text-gray-300 mb-2">
                          <div>Cliente: <span className="text-white">{appointment.clientName || appointment.user?.name || 'Cliente'}</span></div>
                          <div>Fecha: <span className="text-white">
                            {appointment.date ? new Date(appointment.date).toLocaleDateString('es-ES') : 'N/A'}
                          </span></div>
                          <div>Hora: <span className="text-white">
                            {appointment.time || new Date(appointment.date || appointment.createdAt).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                          </span></div>
                          <div>Duración: <span className="text-white">{appointment.duration || '30'} min</span></div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-blue-400">{formatCurrency(appointment.total || appointment.price || 0)}</p>
                      </div>
                    </div>
                    
                    {/* Detalles del servicio agendado */}
                    <div className="border-t border-blue-500/20 pt-3">
                      <div className="flex items-center justify-between p-2 bg-blue-500/5 rounded-lg">
                        <div className="flex-1">
                          <p className="text-xs font-medium text-white">{appointment.service?.name || appointment.serviceName || appointment.service || 'Servicio de barbería'}</p>
                          <p className="text-xs text-gray-400">
                            {appointment.service?.description || 'Servicio completado en el sistema de reservas'}
                          </p>
                          {appointment.notes && (
                            <p className="text-xs text-blue-300 mt-1">Notas: {appointment.notes}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-blue-300">Estado del sistema</p>
                          <p className="text-xs font-medium text-white">Reserva completada</p>
                        </div>
                      </div>
                    </div>
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
 * Modal para detalles de cortes
 */
const ServicesDetailModal = ({ isOpen, onClose, servicesData, barberName, dateRange }) => {
  if (!isOpen) return null;

  const totalAmount = servicesData?.reduce((sum, cut) => sum + (cut.total || cut.price || 0), 0) || 0;
  const formatCurrency = (amount) => new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);

  // Bloquear scroll del body
  React.useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = 'unset'; };
  }, []);

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 sm:p-6 lg:p-8">
      <div className="relative w-full max-w-sm sm:max-w-md lg:max-w-2xl mx-auto h-[90vh] sm:h-[85vh] lg:h-[80vh] flex flex-col">
        <div className="relative bg-purple-500/5 backdrop-blur-md border border-purple-500/20 rounded-2xl shadow-2xl shadow-purple-500/20 h-full flex flex-col overflow-hidden">
          {/* Header fijo */}
          <div className="relative z-10 flex-shrink-0 p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 rounded-lg bg-purple-500/20 border border-purple-500/30">
                  <Scissors className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-semibold text-white">
                    Cortes - {barberName}
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
            
            {/* Resumen */}
            <div className="mt-4 p-3 sm:p-4 bg-purple-500/10 rounded-xl border border-purple-500/20">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <p className="text-xs sm:text-sm text-purple-300">Total Cortes</p>
                  <p className="text-lg sm:text-xl font-bold text-white">{servicesData?.length || 0}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs sm:text-sm text-purple-300">Ingresos</p>
                  <p className="text-lg sm:text-xl font-bold text-purple-400">{formatCurrency(totalAmount)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Contenido scrolleable */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar px-4 sm:px-6 pb-4 sm:pb-6" style={{ minHeight: 0 }}>
            {!servicesData || servicesData.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="p-4 rounded-full bg-purple-500/10 border border-purple-500/20 mb-4">
                  <Scissors className="w-8 h-8 text-purple-400" />
                </div>
                <p className="text-gray-400">No hay cortes registrados en este período</p>
              </div>
            ) : (
              <div className="space-y-3">
                {servicesData.map((cut, index) => (
                  <div key={`${cut._id || cut.id || index}`} className="group relative p-4 bg-purple-500/5 border border-purple-500/20 rounded-xl hover:bg-purple-500/10 transition-all duration-300">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Scissors size={14} className="text-purple-400" />
                          <h4 className="text-sm font-medium text-white">
                            Corte #{cut.cutNumber || cut._id?.slice(-6) || index + 1}
                          </h4>
                          <span className="px-2 py-1 text-xs bg-purple-500/20 text-purple-300 rounded-full">
                            {new Date(cut.date || cut.createdAt || cut.saleDate).toLocaleDateString('es-ES')}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs text-gray-300 mb-2">
                          <div>Cliente: <span className="text-white">{cut.clientName || cut.user?.name || cut.customerName || 'Cliente'}</span></div>
                          <div>Hora: <span className="text-white">
                            {cut.time || new Date(cut.date || cut.createdAt || cut.saleDate).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                          </span></div>
                          <div>Tipo de corte: <span className="text-white">{cut.service?.name || cut.serviceName || cut.name || 'Corte clásico'}</span></div>
                          <div>Duración: <span className="text-white">{cut.duration || cut.service?.duration || '30'} min</span></div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-purple-400">{formatCurrency(cut.total || cut.price || 0)}</p>
                      </div>
                    </div>
                    
                    {/* Detalles del corte registrado en el carrito */}
                    <div className="border-t border-purple-500/20 pt-3">
                      <div className="flex items-center justify-between p-2 bg-purple-500/5 rounded-lg">
                        <div className="flex-1">
                          <p className="text-xs font-medium text-white">
                            {cut.service?.name || cut.serviceName || cut.name || 'Corte de cabello'}
                          </p>
                          <p className="text-xs text-gray-400">
                            {cut.service?.description || cut.description || 'Corte registrado en el carrito de ventas'}
                          </p>
                          {cut.notes && (
                            <p className="text-xs text-purple-300 mt-1">Notas: {cut.notes}</p>
                          )}
                          {cut.paymentMethod && (
                            <p className="text-xs text-purple-300 mt-1">Pago: {cut.paymentMethod}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-purple-300">En carrito</p>
                          <p className="text-xs font-medium text-white">
                            {new Date(cut.date || cut.createdAt || cut.saleDate).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    </div>
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
 * Card de estadísticas mejorada para barberos
 */
const BarberStatsCard = ({ 
  barber, 
  totals, 
  isLoading = false, // Loading general
  loadingStatus = null, // Estado granular de loading
  onSalesClick, 
  onAppointmentsClick, 
  onServicesClick, 
  formatCurrency,
  navigate, // ✅ Agregamos navigate como prop
  dateRange, // ✅ Nuevo sistema de filtros (objeto con preset, startDate, endDate)
  onGenerateInvoice // Función para generar factura consolidada
}) => {
  return (
    <div className="group relative bg-transparent border border-white/10 rounded-2xl backdrop-blur-sm shadow-2xl shadow-blue-500/20 overflow-hidden min-h-[400px] flex flex-col">
      {/* Efecto de brillo */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[2.5%] to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out rounded-2xl"></div>
      
      {/* Botón de Factura Consolidada - Esquina superior derecha */}
      <button
        onClick={() => onGenerateInvoice(barber._id)}
        className="absolute top-4 right-4 z-30 p-2.5 bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/30 rounded-lg hover:from-blue-600/30 hover:to-purple-600/30 hover:border-blue-500/50 transition-all duration-300 hover:scale-110 shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 group/invoice"
        title="Generar factura consolidada del período"
      >
        <Receipt className="w-5 h-5 text-blue-400 group-hover/invoice:text-blue-300" />
      </button>
      
      <div className="relative p-6 lg:p-8 flex-1 flex flex-col">
        {/* Overlay de loading granular */}
        {loadingStatus && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-10 rounded-2xl">
            <div className="text-center text-white">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent mx-auto mb-3"></div>
              <div className="text-sm font-medium">
                {loadingStatus === 'fetching_sales' && '📊 Cargando ventas...'}
                {loadingStatus === 'fetching_appointments' && '📅 Cargando citas...'}
                {loadingStatus === 'processing' && '⚙️ Procesando...'}
                {loadingStatus === 'complete' && '✅ Completado'}
                {loadingStatus === 'error' && '❌ Error al cargar'}
              </div>
            </div>
          </div>
        )}
        
        {/* Header del barbero - Altura flexible para nombres largos */}
        <div className="flex items-start gap-4 mb-6 min-h-[80px] sm:min-h-[88px] relative z-20">
          <div className="relative flex-shrink-0 z-30">
            {/* Imagen clickeable que navega al perfil público */}
            <button
              onClick={(e) => {
                e.stopPropagation(); // Evitar propagación del evento
                logger.debug('🎯 CLICK EN FOTO DETECTADO - Navegando al perfil público del barbero:', barber.user?.name);
                logger.debug('🎯 BarberID:', barber._id);
                logger.debug('🎯 Navigate function:', typeof navigate);
                try {
                  navigate(`/barbers/${barber._id}`);
                  logger.debug('✅ Navegación ejecutada exitosamente');
                } catch (error) {
                  console.error('❌ Error en navegación:', error);
                }
              }}
              className="relative block hover:scale-105 transition-transform duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500/50 rounded-full z-40 cursor-pointer"
              title={`Ver perfil público de ${barber.user?.name || 'Barbero'}`}
            >
              {barber.user?.profilePicture ? (
                <>
                  <img
                    src={barber.user.profilePicture}
                    alt={barber.user?.name || 'Barbero'}
                    className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover border-2 border-blue-500/30 shadow-lg"
                    onError={(e) => {
                      console.error('❌ Error loading profile picture:', e.target.src, 'for barber:', barber.user?.name);
                      e.target.style.display = 'none';
                      const fallback = e.target.parentElement.querySelector('.fallback-avatar');
                      if (fallback) fallback.style.display = 'flex';
                    }}
                    onLoad={() => {
                      logger.debug('✅ Profile picture loaded successfully for:', barber.user?.name);
                    }}
                  />
                  {/* Fallback avatar - inicialmente oculto */}
                  <div className="fallback-avatar w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-r from-blue-600/20 to-purple-600/20 border-2 border-blue-500/30 flex items-center justify-center shadow-lg" style={{display: 'none'}}>
                    <span className="text-lg sm:text-xl font-bold text-white">
                      {barber.user?.name?.[0]?.toUpperCase() || barber.name?.[0]?.toUpperCase() || '?'}
                    </span>
                  </div>
                </>
              ) : (
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-r from-blue-600/20 to-purple-600/20 border-2 border-blue-500/30 flex items-center justify-center shadow-lg">
                  <span className="text-lg sm:text-xl font-bold text-white">
                    {barber.user?.name?.[0]?.toUpperCase() || barber.name?.[0]?.toUpperCase() || '?'}
                  </span>
                </div>
              )}
            </button>
          </div>
          
          <div className="flex-1 min-w-0">
            {/* Nombre - permitir múltiples líneas */}
            <h3 className="text-lg sm:text-xl font-bold text-white mb-1 leading-tight break-words">
              {barber.user?.name || barber.name || 'Barbero'}
            </h3>
            
            {/* Email - con tooltip para email completo */}
            <p className="text-sm text-gray-400 truncate" title={barber.user?.email || barber.email || 'Sin email'}>
              {barber.user?.email || barber.email || 'Sin email'}
            </p>
            
            {/* Teléfono - mismo estilo que el email */}
            {(barber.user?.phone || barber.phone) && (
              <p className="text-sm text-gray-400 truncate mt-1" title={barber.user?.phone || barber.phone}>
                {barber.user?.phone || barber.phone}
              </p>
            )}
          </div>
        </div>

        {/* Estadísticas clickeables - Ocupa el espacio restante */}
        {isLoading && !totals ? (
          // Mostrar loading solo si realmente no hay datos
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <RefreshCw className="w-6 h-6 animate-spin text-blue-400 mx-auto mb-3" />
              <p className="text-gray-400 text-sm">Cargando datos...</p>
            </div>
          </div>
        ) : (
          // Mostrar estadísticas normales
          <div className="flex-1 space-y-4">
          {/* Ventas */}
          <button
            onClick={() => {
              logger.debug('🚨 CLICK EN VENTAS DETECTADO');
              logger.debug('🚨 barberId que se va a pasar:', barber._id);
              logger.debug('🚨 función onSalesClick:', onSalesClick);
              onSalesClick(barber._id);
            }}
            className="group/stat w-full p-4 bg-green-500/5 border border-green-500/20 rounded-xl hover:bg-green-500/10 hover:border-green-500/40 transition-all duration-300 text-left hover:scale-[1.02]"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="p-2 bg-green-500/20 rounded-lg border border-green-500/30 flex-shrink-0">
                  <ShoppingCart className="w-4 h-4 text-green-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-green-300 group-hover/stat:text-green-200 font-medium">Ventas</p>
                  <p className="text-xs text-gray-400 truncate">{totals.salesCount} productos</p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <div className="text-right">
                  <p className="text-base font-bold text-green-400 group-hover/stat:text-green-300 whitespace-nowrap">
                    {formatCurrency(totals.sales)}
                  </p>
                </div>
                <Eye className="w-4 h-4 text-green-400 group-hover/stat:text-green-300 flex-shrink-0" />
              </div>
            </div>
          </button>

          {/* Citas */}
          <button
            onClick={() => onAppointmentsClick(barber._id)}
            className="group/stat w-full p-4 bg-blue-500/5 border border-blue-500/20 rounded-xl hover:bg-blue-500/10 hover:border-blue-500/40 transition-all duration-300 text-left hover:scale-[1.02]"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="p-2 bg-blue-500/20 rounded-lg border border-blue-500/30 flex-shrink-0">
                  <Clock className="w-4 h-4 text-blue-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-blue-300 group-hover/stat:text-blue-200 font-medium">Citas</p>
                  <p className="text-xs text-gray-400 truncate">{totals.appointmentsCount} citas</p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <div className="text-right">
                  <p className="text-base font-bold text-blue-400 group-hover/stat:text-blue-300 whitespace-nowrap">
                    {formatCurrency(totals.appointments)}
                  </p>
                </div>
                <Eye className="w-4 h-4 text-blue-400 group-hover/stat:text-blue-300 flex-shrink-0" />
              </div>
            </div>
          </button>

          {/* Cortes Totales */}
          <button
            onClick={() => onServicesClick(barber._id)}
            className="group/stat w-full p-4 bg-purple-500/5 border border-purple-500/20 rounded-xl hover:bg-purple-500/10 hover:border-purple-500/40 transition-all duration-300 text-left hover:scale-[1.02]"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="p-2 bg-purple-500/20 rounded-lg border border-purple-500/30 flex-shrink-0">
                  <Scissors className="w-4 h-4 text-purple-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-purple-300 group-hover/stat:text-purple-200 font-medium">Cortes</p>
                  <p className="text-xs text-gray-400 truncate">{totals.servicesCount} cortes</p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <div className="text-right">
                  <p className="text-base font-bold text-purple-400 group-hover/stat:text-purple-300 whitespace-nowrap">
                    {formatCurrency(totals.services)}
                  </p>
                </div>
                <Eye className="w-4 h-4 text-purple-400 group-hover/stat:text-purple-300 flex-shrink-0" />
              </div>
            </div>
          </button>
        </div>
        )}

        {/* Total general */}
        {!isLoading && (
          <div className="mt-6 p-4 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/30 rounded-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-lg border border-blue-500/30">
                  <DollarSign className="w-5 h-5 text-blue-400" />
                </div>
                <p className="text-sm font-medium text-white">Total Ingresos</p>
              </div>
              <p className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                {formatCurrency(totals.total)}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Página principal AdminBarbers mejorada
 */
const AdminBarbers = () => {
  // Log de debug ultra-visible
  logger.debug('�🟢🟢 ADMINBARBERS COMPONENT RENDERING 🟢🟢🟢');
  logger.debug('🟢 Current timestamp:', new Date().toISOString());
  logger.debug('🟢 Window location:', window.location.pathname);
  
  const { user } = useAuth();
  const { showError, showInfo } = useNotification();
  const navigate = useNavigate();

  // Helper para obtener fecha local en formato YYYY-MM-DD
  const getTodayLocalDate = () => {
    const now = new Date();
    
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    const result = `${year}-${month}-${day}`;
    
    return result;
  };

  // Hook personalizado para manejar estadísticas y datos
  // 🚀 USANDO HOOK OPTIMIZADO PARA TESTING DE PERFORMANCE
  const {
    barbers,
    statistics,
    filteredStats,
    loading,
    error,
    sortedAvailableDates,
    filterType,
    filterDate,
    filterLoading,
    loadingStatus, // Estados de progreso granular
    applyFilter, // Función debounced
    getPerformanceStats, // Métricas de rendimiento
    clearCache, // Limpiar cache
    loadData, // Función para recargar datos
    isLoadingData,
    isApplyingFilter
  } = useBarberStats(); // � HOOK OPTIMIZADO IMPLEMENTADO

  // Usar barbers como barbersData para el fallback
  const barbersData = barbers;

  // Hook para reportes detallados
  const {
    loading: detailedLoading,
    error: detailedError,
    detailedSales,
    walkInDetails,
    completedAppointments,
    fetchDetailedSales,
    fetchWalkInDetails,
    fetchDetailedCuts,
    fetchCompletedAppointments,
    fetchAllReports
  } = useDetailedReports();

  // Estados para filtros de fecha - Simplificados para usar SimpleDateFilter (igual que Reports)
  const [dateRange, setDateRange] = useState({
    preset: 'all',
    startDate: null,
    endDate: null
  });
  const [modalData, setModalData] = useState({
    sales: { isOpen: false, data: null, barber: null, dateRange: null },
    appointments: { isOpen: false, data: null, barber: null, dateRange: null },
    services: { isOpen: false, data: null, barber: null, dateRange: null }
  });

  // Efecto para aplicar filtro inicial de "General" cuando se cargan los barberos
  useEffect(() => {
    logger.debug('🎯 USEEFFECT FILTRO INICIAL:', {
      barbersLength: barbers.length,
      loading,
      dateRangePreset: dateRange.preset,
      hasApplyFilter: typeof applyFilter === 'function',
      statisticsKeysCount: Object.keys(statistics).length,
      filteredStatsKeysCount: Object.keys(filteredStats).length,
      timestamp: new Date().toLocaleTimeString("es-CO", { timeZone: "America/Bogota" })
    });
    
    // Aplicar filtro general si:
    // 1. Hay barberos cargados
    // 2. No está cargando barberos
    // 3. Está en modo "all" (General)
    // 4. Y NO tiene estadísticas cargadas (es el problema principal)
    if (barbers.length > 0 && !loading && dateRange.preset === 'all' && typeof applyFilter === 'function' && Object.keys(statistics).length === 0) {
      logger.debug('✅ APLICANDO FILTRO GENERAL INICIAL...', { 
        barbersLength: barbers.length,
        barbersData: barbers.map(b => ({ id: b._id, name: b.user?.name || b.name }))
      });
      applyFilter('General', '', barbers); // Pasar los barberos como tercer parámetro
    } else {
      logger.debug('❌ NO SE APLICA FILTRO - Condiciones no cumplidas:', {
        hasBarberos: barbers.length > 0,
        notLoading: !loading,
        isAll: dateRange.preset === 'all',
        hasApplyFilter: typeof applyFilter === 'function',
        noStatistics: Object.keys(statistics).length === 0
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [barbers.length, loading, dateRange.preset, Object.keys(statistics).length]); // Agregada dependencia de statistics

  // Efecto adicional para forzar carga cuando se monta el componente sin datos
  useEffect(() => {
    const timer = setTimeout(() => {
      // Usar fallback a barbersData si barbers está vacío
      const currentBarbers = barbers.length > 0 ? barbers : barbersData;
      
      if (currentBarbers.length > 0 && !loading && !filterLoading && Object.keys(statistics).length === 0 && Object.keys(filteredStats).length === 0) {
        logger.debug('🔄 FORZANDO CARGA INICIAL DESPUÉS DE NAVEGACIÓN', { 
          barbersLength: barbers.length,
          barbersDataLength: barbersData.length,
          usingFallback: barbers.length === 0 && barbersData.length > 0
        });
        if (typeof applyFilter === 'function') {
          applyFilter('General', '', currentBarbers); // Pasar los barberos correctos
        }
      } else if (currentBarbers.length === 0) {
        logger.debug('⚠️ No hay barberos disponibles para forzar carga inicial');
      }
    }, 1000); // Esperar 1 segundo después del mount

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Solo se ejecuta al montar el componente

  // Usar fechas disponibles del hook en lugar de extraerlas localmente
  const availableDates = sortedAvailableDates || [];
  
  // Debug temporal: verificar qué recibimos del hook
  logger.debug('🔍 AdminBarbers - Hook data:', {
    sortedAvailableDates: sortedAvailableDates?.length || 0,
    availableDates: availableDates?.length || 0,
    allAvailableDates: typeof sortedAvailableDates
  });

  // ========== NUEVOS HANDLERS PARA SIMPLEDATEFILTER ==========
  
  // Helper para calcular fechas basado en preset
  const calculateDatesFromPreset = (preset) => {
    const today = getTodayLocalDate();
    
    switch(preset) {
      case 'all':
        return { startDate: null, endDate: null };
      case 'today':
        return { startDate: today, endDate: today };
      case 'yesterday': {
        const yesterday = new Date(today + 'T12:00:00');
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];
        return { startDate: yesterdayStr, endDate: yesterdayStr };
      }
      default:
        return { startDate: null, endDate: null };
    }
  };

  // Handler para cambio de preset (all, today, yesterday, custom)
  const handlePresetChange = async (preset) => {
    logger.debug('📅 [AdminBarbers] Cambio de preset:', { preset });
    
    const { startDate, endDate } = calculateDatesFromPreset(preset);
    
    setDateRange({
      preset,
      startDate,
      endDate
    });

    // Usar barbersData del hook como fallback
    const activeBarbersData = (barbers?.length > 0) ? barbers : (barbersData || []);
    
    if (!activeBarbersData || activeBarbersData.length === 0) {
      logger.debug('⚠️ [AdminBarbers] No hay barberos disponibles');
      return;
    }

    // Mapear preset a filterType para el hook
    let filterType = 'General';
    let filterDate = '';
    
    if (preset === 'today') {
      filterType = 'Hoy';
      filterDate = startDate;
    } else if (preset === 'yesterday') {
      filterType = 'Ayer';
      filterDate = startDate;
    }
    
    await applyFilter(filterType, filterDate, activeBarbersData);
  };

  // Handler para cambio de fechas personalizadas
  const handleCustomDateChange = async (startDate, endDate) => {
    logger.debug('📅 [AdminBarbers] Rango personalizado:', { startDate, endDate });
    
    setDateRange({
      preset: 'custom',
      startDate,
      endDate
    });

    // Usar barbersData del hook como fallback
    const activeBarbersData = (barbers?.length > 0) ? barbers : (barbersData || []);
    
    if (!activeBarbersData || activeBarbersData.length === 0) {
      logger.debug('⚠️ [AdminBarbers] No hay barberos disponibles');
      return;
    }

    // Para rango personalizado, usar endDate como filterDate
    await applyFilter('Personalizado', endDate, activeBarbersData);
  };
  
  // ========== FIN NUEVOS HANDLERS ==========


  // Filtrar datos según los días seleccionados y fecha final
  const getFilteredDataByDays = (barberStats, days, endDate = null) => {
    if (!barberStats) return { sales: [], appointments: [], walkIns: [] };

    // Si es filtro General, devolver todos los datos asegurando que sean arrays
    if (days === 'general') {
      return {
        sales: Array.isArray(barberStats.sales) ? barberStats.sales : [],
        appointments: Array.isArray(barberStats.appointments) ? barberStats.appointments : [],
        walkIns: Array.isArray(barberStats.walkIns) ? barberStats.walkIns : []
      };
    }

    const actualEndDate = endDate ? new Date(endDate) : new Date();
    const startDate = new Date(actualEndDate);
    startDate.setDate(actualEndDate.getDate() - days + 1);
    
    // Establecer horas para comparación correcta (UTC)
    startDate.setUTCHours(0, 0, 0, 0);
    actualEndDate.setUTCHours(23, 59, 59, 999);

    const filterByDate = (items) => {
      if (!Array.isArray(items)) return [];
      return items.filter(item => {
        const itemDate = new Date(item.date || item.createdAt || item.saleDate);
        return itemDate >= startDate && itemDate <= actualEndDate;
      });
    };

    const filtered = {
      sales: filterByDate(barberStats.sales || []),
      appointments: filterByDate(barberStats.appointments || []),
      walkIns: filterByDate(barberStats.walkIns || [])
    };

    return filtered;
  };

  // Funciones para manejar cambios de filtros conectados al hook
  const handleDayRangeChange = async (days) => {
    logger.debug(`🎯 [AdminBarbers] Cambiando filtro a: ${days}`, { 
      barbersLength: barbers?.length || 0,
      barbersDataLength: barbersData?.length || 0,
      barbers: barbers,
      barbersData: barbersData
    });
    
    // Usar barbersData del hook como fallback si barbers está vacío
    const activeBarbersData = (barbers?.length > 0) ? barbers : (barbersData || []);
    logger.debug(`🎯 [AdminBarbers] Datos de barberos a usar:`, { 
      usingBarbers: (barbers?.length > 0),
      activeBarbersLength: activeBarbersData?.length || 0,
      activeBarbersData: activeBarbersData
    });

    // Si no hay barberos disponibles, esperar un poco y reintentar
    if (!activeBarbersData || activeBarbersData.length === 0) {
      logger.debug('⚠️ [AdminBarbers] No hay barberos disponibles, esperando...');
      setTimeout(() => {
        if (barbers?.length > 0 || barbersData?.length > 0) {
          handleDayRangeChange(days); // Reintentar
        }
      }, 500);
      return;
    }
    
    setSelectedDayRange(days);
    
    if (days === 'general') {
      // Para filtro General, mostrar todos los datos
      await applyFilter('General', '', activeBarbersData);
      setSelectedEndDate(null);
    } else if (days === 1) {
      // Para "Hoy", usar fecha actual
      const today = getTodayLocalDate();
      await applyFilter('Hoy', today, activeBarbersData);
      setSelectedEndDate(today);
    } else if (days === 7) {
      // Para "Últimos 7 días", configurar rango real
      const today = getTodayLocalDate();
      const endDate = today;
      const todayDate = new Date(today + 'T12:00:00');
      const startDate = new Date(todayDate);
      startDate.setDate(todayDate.getDate() - 6); // 7 días incluyendo hoy
      
      await applyFilter('7 días', endDate, activeBarbersData);
      setSelectedEndDate(endDate);
    } else if (days === 30) {
      // Para "Últimos 30 días", configurar rango real
      const today = getTodayLocalDate();
      const endDate = today;
      const todayDate = new Date(today + 'T12:00:00');
      const startDate = new Date(todayDate);
      startDate.setDate(todayDate.getDate() - 29); // 30 días incluyendo hoy
      
      await applyFilter('30 días', endDate, activeBarbersData);
      setSelectedEndDate(endDate);
    } else if (days === 15) {
      // Para "Últimos 15 días", configurar rango específico
      const today = getTodayLocalDate();
      const endDate = today;
      const todayDate = new Date(today + 'T12:00:00');
      const startDate = new Date(todayDate);
      startDate.setDate(todayDate.getDate() - 14); // 15 días incluyendo hoy
      
      await applyFilter('15 días', endDate, activeBarbersData);
      setSelectedEndDate(endDate);
    } else {
      // Para otros rangos personalizados
      const today = getTodayLocalDate();
      const endDate = today;
      const todayDate = new Date(today + 'T12:00:00');
      const startDate = new Date(todayDate);
      startDate.setDate(todayDate.getDate() - (days - 1));
      
      let filterTypeForHook = days <= 7 ? '7 días' : days <= 15 ? '15 días' : '30 días';
      await applyFilter(filterTypeForHook, endDate, activeBarbersData);
      setSelectedEndDate(endDate);
    }
  };

  const handleEndDateChange = async (dateString) => {
    logger.debug(`🎯 [AdminBarbers] Cambiando fecha a: ${dateString}`, { 
      barbersLength: barbers?.length || 0,
      barbersDataLength: barbersData?.length || 0
    });
    
    // Usar barbersData del hook como fallback si barbers está vacío
    const activeBarbersData = (barbers?.length > 0) ? barbers : (barbersData || []);

    // Si no hay barberos disponibles, esperar un poco y reintentar
    if (!activeBarbersData || activeBarbersData.length === 0) {
      logger.debug('⚠️ [AdminBarbers] No hay barberos disponibles para cambio de fecha, esperando...');
      setTimeout(() => {
        if (barbers?.length > 0 || barbersData?.length > 0) {
          handleEndDateChange(dateString); // Reintentar
        }
      }, 500);
      return;
    }
    
    setSelectedEndDate(dateString);
    if (dateString) {
      // Determinar el tipo de filtro basado en el selectedDayRange actual
      let filterTypeForDate = 'Hoy';
      if (selectedDayRange === 1) {
        filterTypeForDate = 'Hoy';
      } else if (selectedDayRange === 7) {
        filterTypeForDate = '7 días';
      } else if (selectedDayRange === 15) {
        filterTypeForDate = '15 días';
      } else if (selectedDayRange === 30) {
        filterTypeForDate = '30 días';
      }
      
      await applyFilter(filterTypeForDate, dateString, activeBarbersData);
    }
  };

  // LEGACY: getFilteredStatsByDays - No longer needed with SimpleDateFilter
  // Keeping for backward compatibility, but using dateRange instead
  const getFilteredStatsByDays = useMemo(() => {
    if (!statistics || !barbers.length) return {};

    const filtered = {};
    barbers.forEach(barber => {
      const barberStats = statistics[barber._id];
      if (barberStats) {
        // Using filteredStats from hook instead of local filtering
        filtered[barber._id] = filteredStats[barber._id] || { sales: [], appointments: [], walkIns: [] };
      } else {
        // Asegurar que siempre haya un objeto con arrays vacíos
        filtered[barber._id] = { sales: [], appointments: [], walkIns: [] };
      }
    });
    return filtered;
  }, [statistics, filteredStats, barbers, dateRange.preset]);

  // Effect para asegurar que siempre haya scroll disponible
  useEffect(() => {
    const ensureScroll = () => {
      // Asegurar que el body tenga scroll disponible
      document.body.style.overflowY = 'auto';
      document.documentElement.style.overflowY = 'auto';
      
      // Si el contenido es muy pequeño, agregar altura mínima
      const mainContent = document.querySelector('.admin-barbers-container');
      if (mainContent) {
        mainContent.style.minHeight = '100vh';
      }
    };

    ensureScroll();
    
    // Asegurar scroll después de cambios de filtro
    const timer = setTimeout(ensureScroll, 100);
    
    return () => {
      clearTimeout(timer);
    };
  }, [dateRange.preset, dateRange.startDate, dateRange.endDate, barbers]);

  // Helper para formatear fecha YYYY-MM-DD a DD/MM/YYYY de forma segura
  const formatDateSafe = (dateStr) => {
    if (!dateStr) return '';
    
    // Extraer año, mes, día directamente del string YYYY-MM-DD
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
  };

  // Función para formatear el rango de fechas (simplificada para nuevo sistema)
  const formatDateRange = () => {
    if (dateRange.preset === 'all') return 'Todos los registros disponibles';
    
    if (dateRange.preset === 'today') {
      return formatDateSafe(dateRange.startDate || getTodayLocalDate());
    }
    
    if (dateRange.preset === 'yesterday') {
      return formatDateSafe(dateRange.startDate);
    }
    
    if (dateRange.preset === 'custom' && dateRange.startDate && dateRange.endDate) {
      const formattedStart = formatDateSafe(dateRange.startDate);
      const formattedEnd = formatDateSafe(dateRange.endDate);
      return `${formattedStart} - ${formattedEnd}`;
    }
    
    // Fallback
    return 'Rango personalizado';
  };

  // Funciones para abrir modales con reportes detallados
  const openSalesModal = async (barberId) => {
    logger.debug('🚨 INICIANDO openSalesModal - FUNCIÓN PERSONALIZADA');
    logger.debug('🚨 barberId recibido:', barberId);
    
    const barber = barbers.find(b => b._id === barberId);
    const barberName = barber?.user?.name || barber?.name || 'Barbero';
    const dateRangeStr = formatDateRange();
    
    logger.debug('🛒 Abriendo modal de ventas detalladas:', { barberId, dateRangeStr, dateRange });
    logger.debug('🔍 Fechas calculadas para el modal:', { 
      dateRange, 
      todayStr: getTodayLocalDate(),
      filterType: filterType || 'ninguno'
    });
    
    // DEBUG: Comparar datos de card vs modal
    const barberStats = statistics[barberId] || filteredStats[barberId];
    logger.debug('📊 COMPARACIÓN CARD vs MODAL para', barberName, ':', {
      dateRange: dateRange.preset,
      filterType: filterType,
      cardStats: barberStats,
      salesFromCard: barberStats?.sales,
      aboutToFetchModalData: { startDateStr: 'calculando...', endDateStr: 'calculando...' }
    });
    
    let startDateStr, endDateStr;
    
    if (dateRange.preset === 'all') {
      // Para filtro General, NO pasar fechas (igual que useBarberStats)
      startDateStr = undefined;
      endDateStr = undefined;
    } else {
      // Usar fechas directamente del estado dateRange
      startDateStr = dateRange.startDate;
      endDateStr = dateRange.endDate;
    }
    
    logger.debug('📅 Fechas finales para el backend:', { 
      startDateStr, 
      endDateStr, 
      barberId,
      modalDateRange: `${startDateStr} a ${endDateStr}`,
      currentPreset: dateRange.preset
    });
    
    // Abrir modal inmediatamente con loading state
    setModalData(prev => ({
      ...prev,
      sales: {
        isOpen: true,
        data: null,
        barber: barberName,
        dateRange: dateRangeStr,
        loading: true,
        error: null
      }
    }));
    
    try {
      // Obtener datos detallados
      const salesData = await fetchDetailedSales(barberId, startDateStr, endDateStr);
      
      // DEBUG: Comparar resultados
      const modalTotalAmount = salesData?.reduce((sum, day) => sum + (day.totalAmount || 0), 0) || 0;
      const modalTotalProducts = salesData?.reduce((sum, day) => sum + (day.totalProducts || 0), 0) || 0;
      
      logger.debug('🔍 COMPARACIÓN FINAL CARD vs MODAL para', barberName, ':', {
        cardSales: barberStats?.sales?.total || 0,
        cardSalesCount: barberStats?.sales?.totalQuantity || 0, // Cambiar a totalQuantity
        modalSales: modalTotalAmount,
        modalSalesCount: modalTotalProducts,
        diferenciaMonto: (barberStats?.sales?.total || 0) - modalTotalAmount,
        diferenciaCount: (barberStats?.sales?.totalQuantity || 0) - modalTotalProducts, // Cambiar a totalQuantity
        salesDataDays: salesData?.length || 0
      });
      
      // Actualizar modal con datos
      setModalData(prev => ({
        ...prev,
        sales: {
          ...prev.sales,
          data: salesData,
          loading: false
        }
      }));
    } catch (error) {
      console.error('❌ Error cargando ventas detalladas:', error);
      setModalData(prev => ({
        ...prev,
        sales: {
          ...prev.sales,
          data: [],
          loading: false,
          error: 'Error al cargar las ventas detalladas'
        }
      }));
    }
  };

  const openServicesModal = async (barberId) => {
    const barber = barbers.find(b => b._id === barberId);
    const barberName = barber?.user?.name || barber?.name || 'Barbero';
    const dateRange = formatDateRange();
    
    logger.debug('✂️ Abriendo modal de cortes detallados:', { barberId, dateRange, selectedDayRange });
    
    let startDateStr, endDateStr;
    
    if (selectedDayRange === 'general') {
      // Para filtro General, NO pasar fechas (igual que useBarberStats)
      startDateStr = undefined;
      endDateStr = undefined;
    } else {
      // Calcular fechas de inicio y fin para filtros específicos
      const todayStr = getTodayLocalDate();
      const endDate = selectedEndDate ? new Date(selectedEndDate + 'T12:00:00') : new Date(todayStr + 'T12:00:00');
      const startDate = new Date(endDate);
      startDate.setDate(endDate.getDate() - (selectedDayRange - 1));
      
      startDateStr = startDate.toISOString().split('T')[0];
      endDateStr = endDate.toISOString().split('T')[0];
    }
    
    // Abrir modal inmediatamente con loading state
    setModalData(prev => ({
      ...prev,
      services: {
        isOpen: true,
        data: null,
        barber: barberName,
        dateRange: dateRange,
        loading: true,
        error: null
      }
    }));
    
    try {
      // Obtener datos detallados de cortes
      const cutsData = await fetchDetailedCuts(barberId, startDateStr, endDateStr);
      
      // Actualizar modal con datos
      setModalData(prev => ({
        ...prev,
        services: {
          ...prev.services,
          data: cutsData,
          loading: false
        }
      }));
    } catch (error) {
      console.error('❌ Error cargando cortes detallados:', error);
      setModalData(prev => ({
        ...prev,
        services: {
          ...prev.services,
          data: [],
          loading: false,
          error: 'Error al cargar los cortes detallados'
        }
      }));
    }
  };

  const openAppointmentsModal = async (barberId) => {
    const barber = barbers.find(b => b._id === barberId);
    const barberName = barber?.user?.name || barber?.name || 'Barbero';
    const dateRange = formatDateRange();
    
    logger.debug('📅 Abriendo modal de citas detalladas:', { barberId, dateRange, selectedDayRange });
    
    let startDateStr, endDateStr;
    
    if (selectedDayRange === 'general') {
      // Para filtro General, NO pasar fechas (igual que useBarberStats)
      startDateStr = undefined;
      endDateStr = undefined;
    } else {
      // Calcular fechas de inicio y fin para filtros específicos
      const todayStr = getTodayLocalDate();
      const endDate = selectedEndDate ? new Date(selectedEndDate + 'T12:00:00') : new Date(todayStr + 'T12:00:00');
      const startDate = new Date(endDate);
      startDate.setDate(endDate.getDate() - (selectedDayRange - 1));
      
      startDateStr = startDate.toISOString().split('T')[0];
      endDateStr = endDate.toISOString().split('T')[0];
    }
    
    // Abrir modal inmediatamente con loading state
    setModalData(prev => ({
      ...prev,
      appointments: {
        isOpen: true,
        data: null,
        barber: barberName,
        dateRange: dateRange,
        loading: true,
        error: null
      }
    }));
    
    try {
      // Obtener datos detallados
      const appointmentsData = await fetchCompletedAppointments(barberId, startDateStr, endDateStr);
      
      // Actualizar modal con datos
      setModalData(prev => ({
        ...prev,
        appointments: {
          ...prev.appointments,
          data: appointmentsData,
          loading: false
        }
      }));
    } catch (error) {
      console.error('❌ Error cargando citas detalladas:', error);
      setModalData(prev => ({
        ...prev,
        appointments: {
          ...prev.appointments,
          data: [],
          loading: false,
          error: 'Error al cargar las citas detalladas'
        }
      }));
    }
  };

  // Funciones para cerrar modales
  const closeSalesModal = () => setModalData(prev => ({
    ...prev,
    sales: { isOpen: false, data: null, barber: null, dateRange: null, loading: false, error: null }
  }));

  const closeAppointmentsModal = () => setModalData(prev => ({
    ...prev,
    appointments: { isOpen: false, data: null, barber: null, dateRange: null, loading: false, error: null }
  }));

  const closeServicesModal = () => setModalData(prev => ({
    ...prev,
    services: { isOpen: false, data: null, barber: null, dateRange: null, loading: false, error: null }
  }));

  // Función para generar factura consolidada del período filtrado
  const handleGenerateConsolidatedInvoice = async (barberId) => {
    // ⚠️ VALIDACIÓN: No permitir factura con filtro "General"
    if (dateRange.preset === 'all') {
      showError('No se puede generar factura consolidada con el filtro General. Por favor selecciona un período específico (Hoy, Ayer o Personalizado).');
      return;
    }
    
    const barber = barbers.find(b => b._id === barberId);
    const barberName = barber?.user?.name || barber?.name || 'Barbero';
    
    logger.debug('🧾 Generando factura consolidada:', { 
      barberId, 
      barberName,
      dateRange,
      filterType
    });
    
    try {
      const { startDate, endDate } = dateRange;
      
      // Validar que haya fechas definidas
      if (!startDate || !endDate) {
        showError('Por favor selecciona un rango de fechas válido antes de generar la factura.');
        return;
      }
      
      logger.debug('📅 Rango de fechas para factura:', { startDate, endDate });
      
      // Abrir factura consolidada en nueva ventana
      const invoiceUrl = `/api/v1/invoices/consolidated/${barberId}?startDate=${startDate}&endDate=${endDate}`;
      showInfo(`Generando factura de ${barberName} desde ${startDate} hasta ${endDate}...`);
      window.open(invoiceUrl, '_blank');
      
    } catch (error) {
      console.error('❌ Error generando factura consolidada:', error);
      showError('Error al generar la factura consolidada');
    }
  };

  // Función simplificada para calcular totales
  const calculateTotals = (barberId) => {
    // Usar filteredStats si hay un filtro aplicado, sino usar statistics
    const statsToUse = (filterType && filterType !== 'General') ? filteredStats : statistics;
    const barberStats = statsToUse[barberId];
    
    // Debug específico para filtro General
    if (filterType === 'General') {
      logger.debug(`🔍 GENERAL FILTER DEBUG para ${barberId}:`, {
        filterType,
        statisticsKeys: Object.keys(statistics),
        filteredStatsKeys: Object.keys(filteredStats),
        usingStats: 'statistics',
        barberStats: barberStats,
        hasBarberStats: !!barberStats
      });
    }
    
    if (!barberStats) {
      logger.debug(`⚠️ No hay estadísticas para barbero ${barberId} (filterType: ${filterType})`);
      return { sales: 0, appointments: 0, services: 0, total: 0, salesCount: 0, appointmentsCount: 0, servicesCount: 0 };
    }

    const totals = {
      sales: barberStats.sales?.total || 0,
      salesCount: barberStats.sales?.totalQuantity || 0, // Usar totalQuantity para contar productos
      appointments: barberStats.appointments?.total || 0,
      appointmentsCount: barberStats.appointments?.completed || 0,
      services: barberStats.cortes?.total || 0,
      servicesCount: barberStats.cortes?.count || 0,
      total: (barberStats.sales?.total || 0) + (barberStats.appointments?.total || 0) + (barberStats.cortes?.total || 0)
    };
    
    if (filterType === 'General') {
      logger.debug(`📊 GENERAL TOTALS calculados para ${barberId}:`, totals);
    }
    
    return totals;
  };

  // Función para formatear moneda
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  if (loading) {
    return (
      <PageContainer>
        <div className="flex flex-col items-center justify-center min-h-64">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-400 mb-4" />
          <p className="text-gray-400">Cargando estadísticas de barberos...</p>
        </div>
      </PageContainer>
    );
  }

  if (error) {
    return (
      <PageContainer>
        <div className="flex flex-col items-center justify-center min-h-64">
          <AlertTriangle className="w-8 h-8 text-red-400 mb-4" />
          <p className="text-red-400 text-center">{error}</p>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="admin-barbers-container relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-6 space-y-8 min-h-screen overflow-y-auto">
        {/* Título principal */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-xl border border-blue-500/20 shadow-xl shadow-blue-500/20">
              <Users className="w-6 h-6 sm:w-8 sm:h-8 text-blue-400" />
            </div>
            <GradientText className="text-xl sm:text-2xl lg:text-3xl font-bold">
              Estadísticas de Barberos
            </GradientText>
          </div>
          <p className="text-gray-400 text-sm sm:text-base max-w-2xl mx-auto">
            Panel completo de rendimiento con métricas detalladas de ventas, citas y servicios por barbero
          </p>
        </div>

        {/* Filtro de días */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-2 bg-gradient-to-r from-purple-600/20 to-blue-600/20 rounded-xl border border-purple-500/20 shadow-xl shadow-blue-500/20">
              <Filter className="w-5 h-5 text-purple-400" />
            </div>
            <h3 className="text-lg font-semibold text-white">Filtrar por Período</h3>
          </div>
          <SimpleDateFilter
            dateRange={dateRange}
            onPresetChange={handlePresetChange}
            onCustomDateChange={handleCustomDateChange}
            loading={loading || filterLoading}
          />
        </div>

        {/* Grid de barberos */}
        {barbers.length === 0 ? (
          <div className="text-center py-12 min-h-96">
            <div className="p-4 rounded-full bg-blue-500/10 border border-blue-500/20 mb-4 inline-block">
              <Users className="w-8 h-8 text-blue-400" />
            </div>
            <p className="text-gray-400">No hay barberos registrados</p>
          </div>
        ) : Object.keys(statistics).length === 0 && !loading && !filterLoading ? (
          // Mostrar loading cuando tenemos barberos pero no estadísticas (cargando filtros)
          <div className="text-center py-12 min-h-96">
            {(() => {
              logger.debug('🔄 ESTADO LOADING DEL FILTRO:', {
                statisticsKeysCount: Object.keys(statistics).length,
                filteredStatsKeysCount: Object.keys(filteredStats).length,
                loading,
                filterLoading,
                filterType,
                barbersCount: barbers.length,
                timestamp: new Date().toLocaleTimeString("es-CO", { timeZone: "America/Bogota" })
              });
              return null;
            })()}
            <RefreshCw className="w-8 h-8 animate-spin text-blue-400 mb-4 mx-auto" />
            <p className="text-gray-400">Cargando datos del filtro...</p>
            <p className="text-xs text-gray-500 mt-2">
              Debug: stats={Object.keys(statistics).length}, filtered={Object.keys(filteredStats).length}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 min-h-96 pb-20">
            {/* Debug completo antes del mapeo - SOLO para General */}
            {(() => {
              if (filterType === 'General' && !window.debugShown) {
                logger.debug(`🎯 PRE-MAPEO - Estado completo para filtro General:`, {
                  barbersCount: barbers.length,
                  statisticsKeys: Object.keys(statistics),
                  filteredStatsKeys: Object.keys(filteredStats),
                  filterType,
                  loading,
                  filterLoading
                });
                window.debugShown = true; // Evitar spam
              }
              return null;
            })()}
            {barbers.map(barber => {
              const totals = calculateTotals(barber._id);
              const statsToUse = (filterType && filterType !== 'General') ? filteredStats : statistics;
              const hasData = statsToUse[barber._id] || false;
              const barberLoadingStatus = loadingStatus[barber._id] || null;
              
              // Determinar si está cargando: solo si está aplicando filtro Y totals es nulo/vacío
              const isCardLoading = filterLoading && (!totals || totals.total === 0) && !hasData;
              
              // Debug temporal para General filter - REDUCIDO
              if (filterType === 'General' && !barber._debugShown) {
                logger.debug(`🎨 RENDERIZANDO CARD para ${barber.user?.name}:`, {
                  totals,
                  isCardLoading,
                  hasData: !!hasData,
                  filterLoading,
                  totalAmount: totals?.total
                });
                
                // Debug específico para header del barbero
                logger.debug(`👤 DATOS BARBERO HEADER para ${barber.user?.name}:`, {
                  profilePicture: barber.user?.profilePicture,
                  name: barber.user?.name,
                  email: barber.user?.email,
                  specialty: barber.specialty,
                  barberObject: barber
                });
                
                barber._debugShown = true; // Evitar spam por barbero
              }
              
              return (
                <BarberStatsCard
                  key={barber._id}
                  barber={barber}
                  totals={totals}
                  isLoading={isCardLoading}
                  loadingStatus={barberLoadingStatus}
                  onSalesClick={openSalesModal}
                  onAppointmentsClick={openAppointmentsModal}
                  onServicesClick={openServicesModal}
                  formatCurrency={formatCurrency}
                  navigate={navigate} // ✅ Pasamos navigate como prop
                  dateRange={dateRange} // ✅ Nuevo sistema de filtros (dateRange object)
                  onGenerateInvoice={handleGenerateConsolidatedInvoice} // ✅ Función para factura
                />
              );
            })}
          </div>
        )}

        {/* Modales detallados */}
        <DetailedSalesModal
          isOpen={modalData.sales.isOpen}
          onClose={closeSalesModal}
          salesData={modalData.sales.data}
          barberName={modalData.sales.barber}
          dateRange={modalData.sales.dateRange}
          loading={modalData.sales.loading}
          error={modalData.sales.error}
        />
        
        <DetailedCutsModal
          isOpen={modalData.services.isOpen}
          onClose={closeServicesModal}
          cutsData={modalData.services.data}
          barberName={modalData.services.barber}
          dateRange={modalData.services.dateRange}
          loading={modalData.services.loading}
          error={modalData.services.error}
        />
        
        <DetailedAppointmentsModal
          isOpen={modalData.appointments.isOpen}
          onClose={closeAppointmentsModal}
          appointmentsData={modalData.appointments.data}
          barberName={modalData.appointments.barber}
          dateRange={modalData.appointments.dateRange}
          loading={modalData.appointments.loading}
          error={modalData.appointments.error}
        />
      </div>
    </PageContainer>
  );
};

export default AdminBarbers;

