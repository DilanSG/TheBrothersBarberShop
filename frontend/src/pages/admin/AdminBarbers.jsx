import React from 'react';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import {
  Users, AlertTriangle, Crown, Shield,
  TrendingUp, Scissors, Package, Download, X, CalendarDays, FileText
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import { PageContainer } from '../../components/layout/PageContainer';
import GradientText from '../../components/ui/GradientText';
import { useBarberStats } from '../../hooks/useBarberStats';
import { useBarberUI } from '../../hooks/useBarberUI';

// Estilos personalizados para el calendario
const calendarStyles = `
  .compact-calendar {
    font-size: 11px;
    color: #e5e7eb;
  }
  
  .compact-calendar .rdp-months {
    width: 100%;
    max-width: 280px;
  }
  
  .compact-calendar .rdp-day {
    color: #9ca3af;
    width: 28px;
    height: 28px;
    font-size: 11px;
  }
  
  .compact-calendar .rdp-day_button {
    width: 28px !important;
    height: 28px !important;
    border-radius: 50% !important;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
    border: 1px solid transparent !important;
  }
  
  .compact-calendar .rdp-day_button:hover {
    background-color: rgba(59, 130, 246, 0.3) !important;
    border-radius: 50% !important;
  }
  
  .compact-calendar .available-day .rdp-day_button {
    background-color: rgba(34, 197, 94, 0.25) !important;
    color: #86efac !important;
    border: 1px solid rgba(34, 197, 94, 0.4) !important;
    border-radius: 50% !important;
  }
  
  .compact-calendar .rdp-day_selected .rdp-day_button,
  .compact-calendar .selected-day .rdp-day_button {
    background-color: #2563eb !important;
    color: white !important;
    font-weight: bold !important;
    border: 2px solid #60a5fa !important;
    border-radius: 50% !important;
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.3) !important;
  }
  
  .compact-calendar .highlight-day .rdp-day_button {
    background-color: #1d4ed8 !important;
    color: white !important;
    font-weight: bold !important;
    border: 2px solid #93c5fd !important;
    border-radius: 50% !important;
    box-shadow: 0 2px 4px rgba(59, 130, 246, 0.4) !important;
  }
  
  .compact-calendar .rdp-caption {
    color: #e5e7eb;
    font-size: 12px;
    font-weight: 600;
  }
  
  .compact-calendar .rdp-nav {
    color: #e5e7eb;
  }
  
  .compact-calendar .rdp-head_cell {
    color: #9ca3af;
    font-size: 10px;
    font-weight: 500;
  }
  
  /* Asegurar que los estilos de selección tengan prioridad */
  .compact-calendar .rdp-day_selected {
    background-color: #2563eb !important;
    border-radius: 50% !important;
  }
  
  .compact-calendar .rdp-day_selected .rdp-day_button {
    background-color: #2563eb !important;
    color: white !important;
  }
`;

// Inyectar estilos
if (typeof document !== 'undefined') {
  const styleId = 'compact-calendar-styles';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = calendarStyles;
    document.head.appendChild(style);
  }
}

/**
 * Página de estadísticas y reportes de barberos
 * Dashboard con métricas de rendimiento y generación de reportes
 */
const AdminBarbers = () => {
  const { user } = useAuth();
  const { showError } = useNotification();

  // Hook personalizado para manejar estadísticas y datos
  const {
    barbers,
    statistics,
    filteredStats,
    loading,
    error,
    globalAvailableDates,
    allAvailableDates,
    availableDates,
    filterType,
    filterDate,
    filterLoading,
    reportData,
    loadingReport,
    selectedBarber,
    setFilterType,
    setFilterDate,
    getHighlightedRange,
    loadBarberAvailableDates,
    generateBarberReport,
    setReportData
  } = useBarberStats();

  // Hook personalizado para manejar UI
  const {
    showReportModal,
    barberMenus,
    calendarMonth,
    setCalendarMonth,
    toggleBarberMenu,
    closeReportModal,
    handleGenerateReport,
    generateQuickReport,
    handleManualDateSelect,
    isDateDisabled,
    handleDateSelect
  } = useBarberUI();

  // Funciones auxiliares
  const getBarberIcon = (barber) => {
    return barber.user?.role === 'admin' ? (
      <Crown className="h-6 w-6 text-yellow-400" />
    ) : (
      <Shield className="h-6 w-6 text-blue-400" />
    );
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  // Función para descargar reporte
  const downloadReport = () => {
    if (!reportData) return;

    const reportContent = generateReportHTML(reportData);
    const blob = new Blob([reportContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reporte-${reportData.date}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Función para generar HTML del reporte
  const generateReportHTML = (data) => {
    if (!data) return '<p>No hay datos disponibles para el reporte</p>';
    
    // Asegurar que todos los arrays existen con validación estricta
    const sales = Array.isArray(data.sales) ? data.sales : [];
    const appointments = Array.isArray(data.appointments) ? data.appointments : [];
    const walkIns = Array.isArray(data.walkIns) ? data.walkIns : [];

    const formatDate = (dateStr) => {
      return new Date(dateStr).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    };

    const formatCurrency = (amount) => {
      return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(amount);
    };

    const calculateTotals = () => {
      const productTotal = sales.reduce((sum, sale) => sum + (sale.total || 0), 0);
      const appointmentTotal = appointments.reduce((sum, apt) => sum + (apt.total || 0), 0);
      const walkInTotal = walkIns.reduce((sum, walkIn) => sum + (walkIn.total || 0), 0);
      return { productTotal, appointmentTotal, walkInTotal, grandTotal: productTotal + appointmentTotal + walkInTotal };
    };

    const totals = calculateTotals();

    return `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reporte Diario - ${formatDate(data.date)}</title>
    <style>
        body {
            font-family: 'Courier New', monospace;
            background-color: white;
            color: black;
            margin: 0;
            padding: 20px;
            font-size: 12px;
            line-height: 1.4;
        }
        .header {
            text-align: center;
            border-block-end: 2px solid #000;
            padding-block-end: 10px;
            margin-block-end: 20px;
        }
        .shop-name {
            font-size: 18px;
            font-weight: bold;
            margin-block-end: 5px;
        }
        .report-title {
            font-size: 14px;
            margin-block-end: 5px;
        }
        .date {
            font-size: 12px;
        }
        .section {
            margin-block-end: 25px;
        }
        .section-title {
            font-size: 14px;
            font-weight: bold;
            border-block-end: 1px solid #000;
            padding-block-end: 5px;
            margin-block-end: 10px;
        }
        .item {
            display: flex;
            justify-content: space-between;
            padding: 2px 0;
            border-block-end: 1px dotted #ccc;
        }
        .item-name {
            flex: 1;
            padding-inline-end: 10px;
        }
        .item-price {
            font-weight: bold;
        }
        .subtotal {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-block-start: 1px solid #000;
            font-weight: bold;
        }
        .total {
            display: flex;
            justify-content: space-between;
            padding: 10px 0;
            border-block-start: 2px solid #000;
            font-weight: bold;
            font-size: 14px;
        }
        .footer {
            text-align: center;
            margin-block-start: 30px;
            padding-block-start: 10px;
            border-block-start: 1px solid #000;
            font-size: 10px;
        }
        @media print {
            body { margin: 0; padding: 10px; }
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="shop-name">THE BROTHERS BARBER SHOP</div>
        <div class="report-title">REPORTE DIARIO</div>
        <div class="date">${formatDate(data.date)}</div>
    </div>

    <!-- PRODUCTOS VENDIDOS -->
    <div class="section">
        <div class="section-title">PRODUCTOS VENDIDOS</div>
        ${sales.length === 0 ? '<div>No hay ventas registradas</div>' : ''}
        ${sales.map(sale => `
            <div class="item">
                <div class="item-name">${sale.products?.map(p => `${p.product?.name || 'Producto'} x${p.quantity}`).join(', ') || 'Venta'}</div>
                <div class="item-price">${formatCurrency(sale.total)}</div>
            </div>
        `).join('')}
        ${sales.length > 0 ? `
            <div class="subtotal">
                <div>SUBTOTAL PRODUCTOS:</div>
                <div>${formatCurrency(totals.productTotal)}</div>
            </div>
        ` : ''}
    </div>

    <!-- CORTES SIN CITA -->
    <div class="section">
        <div class="section-title">CORTES SIN CITA (WALK-INS)</div>
        ${walkIns.length === 0 ? '<div>No hay cortes sin cita registrados</div>' : ''}
        ${walkIns.map(walkIn => `
            <div class="item">
                <div class="item-name">${walkIn.service?.name || 'Servicio'} - ${walkIn.barber?.user?.name || 'Barbero'}</div>
                <div class="item-price">${formatCurrency(walkIn.total)}</div>
            </div>
        `).join('')}
        ${walkIns.length > 0 ? `
            <div class="subtotal">
                <div>SUBTOTAL WALK-INS:</div>
                <div>${formatCurrency(totals.walkInTotal)}</div>
            </div>
        ` : ''}
    </div>

    <!-- CITAS COMPLETADAS -->
    <div class="section">
        <div class="section-title">CITAS COMPLETADAS</div>
        ${appointments.length === 0 ? '<div>No hay citas completadas</div>' : ''}
        ${appointments.map(apt => `
            <div class="item">
                <div class="item-name">${apt.service?.name || 'Servicio'} - ${apt.barber?.user?.name || 'Barbero'} - ${apt.user?.name || 'Cliente'}</div>
                <div class="item-price">${formatCurrency(apt.total || 0)}</div>
            </div>
        `).join('')}
        ${appointments.length > 0 ? `
            <div class="subtotal">
                <div>SUBTOTAL CITAS:</div>
                <div>${formatCurrency(totals.appointmentTotal)}</div>
            </div>
        ` : ''}
    </div>

    <div class="total">
        <div>TOTAL GENERAL:</div>
        <div>${formatCurrency(totals.grandTotal)}</div>
    </div>

    <div class="footer">
        Reporte generado el ${new Date().toLocaleString('es-ES')}
    </div>
</body>
</html>
    `.trim();
  };

  return (
    <PageContainer>
      <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-black text-white relative overflow-hidden">
        {/* Background con efectos de gradientes */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-900/8 via-purple-900/8 to-blue-900/8"></div>
        
        {/* Efectos de puntos en toda la página - múltiples capas */}
        <div className="absolute inset-0 opacity-40" style={{
          backgroundImage: `radial-gradient(circle, rgba(59, 130, 246, 0.3) 1px, transparent 1px)`,
          backgroundSize: '30px 30px',
          backgroundPosition: '0 0, 15px 15px'
        }}></div>
        
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: `radial-gradient(circle, rgba(168, 85, 247, 0.4) 1px, transparent 1px)`,
          backgroundSize: '20px 20px',
          backgroundPosition: '10px 10px'
        }}></div>
        
        <div className="absolute inset-0 opacity-15" style={{
          backgroundImage: `radial-gradient(circle, rgba(59, 130, 246, 0.5) 0.8px, transparent 0.8px)`,
          backgroundSize: '40px 40px',
          backgroundPosition: '20px 0'
        }}></div>

        <div className="relative z-10 container mx-auto px-4 py-8">

          {/* Selector de rango de fechas */}
          <div className="mb-8 flex flex-col items-center gap-2">
            <div className="flex gap-2 bg-white/5 rounded-lg p-1 border border-white/10">
              {['General', 'Día', 'Semana', 'Mes'].map(opt => (
                <button
                  key={opt}
                  className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${filterType === opt ? 'bg-blue-500/80 text-white' : 'text-blue-200 hover:bg-blue-500/30'}`}
                  onClick={() => { setFilterType(opt); if(opt==='General') setFilterDate(''); }}
                >
                  {opt}
                </button>
              ))}
            </div>
            
            {/* Indicador de estado de datos */}
            <div className="text-xs text-center">
              {globalAvailableDates.length > 0 ? (
                <div className="text-green-400 bg-green-500/10 px-3 py-1 rounded-full border border-green-500/20">
                  ✅ {globalAvailableDates.length} días con datos disponibles
                </div>
              ) : (
                <div className="text-yellow-400 bg-yellow-500/10 px-3 py-1 rounded-full border border-yellow-500/20">
                  ⏳ Cargando fechas con datos...
                </div>
              )}
              
              {/* Indicador de filtro activo */}
              {filterType !== 'General' && filterDate && (
                <div className="mt-2 text-blue-400 bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20">
                  🔍 Filtro activo: {filterType} - {filterDate}
                  {filterLoading && <span className="ml-2 animate-pulse">⏳</span>}
                </div>
              )}
              
              {filterType !== 'General' && !filterDate && (
                <div className="mt-2 text-yellow-400 bg-yellow-500/10 px-3 py-1 rounded-full border border-yellow-500/20">
                  ⚠️ Selecciona una fecha para aplicar el filtro {filterType}
                </div>
              )}
            </div>
            
            {filterType !== 'General' && (
              <div className="flex flex-col items-center gap-2 mt-2">
                <span className="text-xs text-gray-300">Selecciona fecha base:</span>
                <div className="bg-gray-900/80 rounded-lg p-3 border border-gray-700/40 max-w-xs">
                  <DayPicker
                    mode="single"
                    selected={filterDate ? new Date(filterDate + 'T12:00:00') : undefined}
                    onSelect={date => handleDateSelect(date, allAvailableDates, setFilterDate)}
                    month={calendarMonth}
                    onMonthChange={setCalendarMonth}
                    disabled={date => isDateDisabled(date, allAvailableDates)}
                    modifiers={{
                      highlight: getHighlightedRange(),
                      available: allAvailableDates.map(date => new Date(date + 'T12:00:00')),
                      selected: filterDate ? [new Date(filterDate + 'T12:00:00')] : []
                    }}
                    modifiersClassNames={{
                      highlight: 'highlight-day',
                      available: 'available-day',
                      selected: 'selected-day',
                    }}
                    showOutsideDays={false}
                    className="compact-calendar"
                  />
                  <div className="text-xs text-gray-600 bg-gray-800/30 rounded px-2 py-1 mt-2">
                    💡 Solo los días con datos están habilitados (verde). El rango {filterType.toLowerCase()} se resalta en azul.
                    {allAvailableDates.length > 0 && (
                      <div className="mt-1 text-green-400">
                        📊 {allAvailableDates.length} días con datos disponibles
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Mensajes de error */}
          {error && (
            <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-xl text-red-300 backdrop-blur-sm shadow-2xl shadow-red-500/20">
              <div className="flex items-center">
                <AlertTriangle className="h-5 w-5 mr-2" />
                {error}
              </div>
            </div>
          )}

          {/* Container principal transparente */}
          <div className="bg-transparent border border-white/10 rounded-2xl backdrop-blur-sm shadow-2xl shadow-blue-500/20">
            {/* Lista de barberos con estadísticas */}
            {loading ? (
              <div className="p-8 text-center">
                <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                <p className="mt-2 text-gray-400 text-sm">Cargando estadísticas...</p>
              </div>
            ) : barbers.length === 0 ? (
              <div className="p-8 text-center">
                <Users className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400 text-sm">No hay barberos registrados</p>
              </div>
            ) : (
              <div className="divide-y divide-white/10">
                {barbers.map((barber) => {
                  // Determinar si usar estadísticas filtradas o generales
                  const hasFilterDate = filterType !== 'General' && filterDate;
                  const hasFilteredData = Object.keys(filteredStats).length > 0;
                  const useFiltered = hasFilterDate && hasFilteredData && filteredStats[barber._id];
                  
                  const stats = useFiltered ? filteredStats[barber._id] : (statistics[barber._id] || {});
                  
                  // Debug info SIEMPRE para identificar el problema
                  console.log(`� DEBUG ${barber.user?.name}:`, {
                    filterType,
                    filterDate,
                    hasFilterDate,
                    hasFilteredData,
                    useFiltered,
                    filteredStatsKeys: Object.keys(filteredStats),
                    barberFilteredStats: filteredStats[barber._id],
                    barberGeneralStats: statistics[barber._id],
                    finalStats: stats
                  });
                  
                  return (
                    <div key={barber._id} className="px-4 py-6 hover:bg-white/5 transition-colors backdrop-blur-sm">
                      <div className="flex flex-col lg:flex-row gap-6 items-start">
                        {/* Información del barbero */}
                        <div className="flex items-start gap-4 flex-1">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                            {getBarberIcon(barber)}
                          </div>
                          
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="text-xl font-semibold">
                                <GradientText className="text-xl font-semibold">
                                  {barber.user?.name || 'Sin nombre'}
                                </GradientText>
                              </h4>
                              <span className={`text-xs px-2 py-1 rounded-full ${barber.isActive ? 'text-green-400' : 'text-red-400'} bg-current/10`}>
                                {barber.isActive ? 'Activo' : 'Inactivo'}
                              </span>
                            </div>
                            <p className="text-sm text-gray-400 mb-1">{barber.specialty}</p>
                            <p className="text-sm text-blue-400">{barber.experience} años de experiencia</p>
                          </div>
                        </div>

                        {/* Estadísticas */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 w-full lg:w-auto">
                          {filterLoading ? (
                            <div className="col-span-4 text-center py-4 text-xs text-blue-300">Cargando datos del rango seleccionado...</div>
                          ) : null}
                          {/* Ventas de productos */}
                          <div className="bg-white/5 rounded-lg p-2 text-center border border-white/10">
                            <Package className="w-5 h-5 text-green-400 mx-auto mb-1" />
                            <div className="text-base font-bold text-green-400">{formatCurrency(stats.sales?.total || 0)}</div>
                            <div className="text-[11px] text-gray-400">{stats.sales?.count || 0} ventas</div>
                          </div>

                          {/* Cortes */}
                          <div className="bg-white/5 rounded-lg p-2 text-center border border-white/10">
                            <Scissors className="w-5 h-5 text-purple-400 mx-auto mb-1" />
                            <div className="text-base font-bold text-purple-400">{stats.cortes?.count || 0}</div>
                            <div className="text-[11px] text-gray-400">cortes</div>
                          </div>

                          {/* Citas completadas (valor total y cantidad) */}
                          <div className="bg-white/5 rounded-lg p-2 text-center border border-white/10">
                            <CalendarDays className="w-5 h-5 text-blue-400 mx-auto mb-1" />
                            <div className="text-base font-bold text-blue-400">{formatCurrency(stats.appointments?.total || 0)}</div>
                            <div className="text-[10px] text-gray-500">{stats.appointments?.completed || 0} citas</div>
                          </div>

                          {/* Ingresos totales */}
                          <div className="bg-white/5 rounded-lg p-2 text-center border border-white/10">
                            <TrendingUp className="w-5 h-5 text-yellow-400 mx-auto mb-1" />
                            <div className="text-base font-bold text-yellow-400">{formatCurrency((stats.sales?.total || 0) + (stats.appointments?.total || 0))}</div>
                            <div className="text-[11px] text-gray-400">ingresos totales</div>
                          </div>
                        </div>

                        {/* Botón de reportes por barbero */}
                        <div className="relative">
                          <button
                            onClick={() => toggleBarberMenu(barber._id, loadBarberAvailableDates)}
                            className="p-2 bg-blue-600/20 text-blue-400 rounded-lg hover:bg-blue-600/30 transition-colors flex items-center justify-center"
                            disabled={loadingReport}
                          >
                            {loadingReport && selectedBarber === barber._id ? (
                              <div className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <FileText className="w-5 h-5" />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Sección expandible de reportes */}
                      {barberMenus[barber._id] && (
                        <div className="mt-4 bg-white/5 rounded-lg border border-white/10 p-4 transition-all duration-300 ease-in-out">
                          <h5 className="text-sm font-medium text-gray-300 mb-3">
                            Generar Reporte - {barber.user?.name || 'Barbero'}
                          </h5>
                          
                          <div className="space-y-3">
                            {/* Reporte diario actual */}
                            <button
                              onClick={() => handleGenerateReport(barber._id, null, generateBarberReport, () => toggleBarberMenu(barber._id))}
                              className="w-full text-left px-3 py-2 text-sm bg-blue-600/20 text-blue-400 rounded-lg hover:bg-blue-600/30 transition-colors flex items-center gap-2"
                            >
                              <CalendarDays className="w-4 h-4" />
                              Reporte del día actual
                            </button>

                            {/* Separador */}
                            <div className="border-t border-gray-700/50"></div>

                            {/* Fechas disponibles */}
                            <div>
                              <div className="text-xs text-gray-500 font-medium mb-2">
                                Seleccionar fecha específica:
                              </div>
                              
                              {availableDates[barber._id]?.length > 0 ? (
                                <div className="space-y-3">
                                  {/* Acceso rápido por períodos */}
                                  <div>
                                    <div className="text-xs text-gray-500 font-medium mb-2">
                                      Períodos rápidos:
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                      <button
                                        onClick={() => generateQuickReport(barber._id, 1, availableDates, generateBarberReport, showError)}
                                        className="px-2 py-1.5 text-xs bg-green-600/20 text-green-400 rounded-md hover:bg-green-600/30 transition-colors"
                                      >
                                        <div className="text-center">
                                          <div className="font-medium">Ayer</div>
                                          <div className="text-[10px] opacity-75">
                                            {(() => {
                                              const yesterday = new Date();
                                              yesterday.setDate(yesterday.getDate() - 1);
                                              return yesterday.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' });
                                            })()}
                                          </div>
                                        </div>
                                      </button>
                                      <button
                                        onClick={() => generateQuickReport(barber._id, 2, availableDates, generateBarberReport, showError)}
                                        className="px-2 py-1.5 text-xs bg-yellow-600/20 text-yellow-400 rounded-md hover:bg-yellow-600/30 transition-colors"
                                      >
                                        <div className="text-center">
                                          <div className="font-medium">Anteayer</div>
                                          <div className="text-[10px] opacity-75">
                                            {(() => {
                                              const dayBeforeYesterday = new Date();
                                              dayBeforeYesterday.setDate(dayBeforeYesterday.getDate() - 2);
                                              return dayBeforeYesterday.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' });
                                            })()}
                                          </div>
                                        </div>
                                      </button>
                                    </div>
                                  </div>

                                  {/* Selector de fecha manual */}
                                  <div>
                                    <div className="text-xs text-gray-500 font-medium mb-2">
                                      Fecha específica:
                                    </div>
                                    <div className="relative">
                                      <input
                                        type="date"
                                        className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600/50 rounded-lg text-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50"
                                        onChange={(e) => {
                                          const selectedDate = e.target.value;
                                          if (selectedDate) {
                                            handleManualDateSelect(selectedDate, barber._id, availableDates, generateBarberReport, showError).then(() => {
                                              e.target.value = '';
                                            });
                                          }
                                        }}
                                        min={availableDates[barber._id]?.length > 0 ? availableDates[barber._id][availableDates[barber._id].length - 1] : ''}
                                        max={availableDates[barber._id]?.length > 0 ? availableDates[barber._id][0] : ''}
                                        placeholder="Seleccionar fecha..."
                                      />
                                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                        <CalendarDays className="w-4 h-4 text-gray-500" />
                                      </div>
                                    </div>
                                    
                                    <div className="text-xs text-gray-600 bg-gray-800/30 rounded px-2 py-1 mt-1">
                                      💡 Solo las fechas con datos están disponibles
                                    </div>
                                  </div>
                                  
                                  {/* Fechas recientes como botones rápidos */}
                                  <div className="text-xs text-gray-500 font-medium mb-1">
                                    Acceso rápido (últimas 5 fechas):
                                  </div>
                                  <div className="grid grid-cols-1 gap-1 max-h-24 overflow-y-auto">
                                    {availableDates[barber._id].slice(0, 5).map(date => (
                                      <button
                                        key={date}
                                        onClick={() => handleGenerateReport(barber._id, date, generateBarberReport, () => toggleBarberMenu(barber._id))}
                                        className="text-left px-3 py-1.5 text-xs text-gray-300 hover:bg-white/10 rounded-md transition-colors flex items-center gap-2"
                                      >
                                        <CalendarDays className="w-3 h-3" />
                                        {new Date(date).toLocaleDateString('es-ES', {
                                          weekday: 'short',
                                          day: 'numeric',
                                          month: 'short',
                                          year: 'numeric'
                                        })}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              ) : (
                                <div className="px-3 py-2 text-xs text-gray-500 text-center">
                                  No hay fechas disponibles
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal de Reporte */}
      {showReportModal && reportData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={closeReportModal}
          ></div>
          <div className="relative bg-gray-800/95 backdrop-blur-md border border-gray-700/50 rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-700/50">
              <h3 className="text-xl font-bold">
                <GradientText className="text-xl font-bold">
                  Reporte del {new Date(reportData.date).toLocaleDateString('es-ES')}
                </GradientText>
              </h3>
              <div className="flex gap-2">
                <button
                  onClick={downloadReport}
                  className="px-4 py-2 bg-blue-600/20 text-blue-400 rounded-lg hover:bg-blue-600/30 transition-colors flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Descargar
                </button>
                <button
                  onClick={closeReportModal}
                  className="p-2 text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              {reportData && (
                <div 
                  className="bg-white text-black p-6 rounded-lg font-mono text-sm"
                  dangerouslySetInnerHTML={{ __html: generateReportHTML(reportData).replace(/<!DOCTYPE.*?<body[^>]*>/, '').replace(/<\/body>.*?<\/html>/, '') }}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  );
};

export default AdminBarbers;
