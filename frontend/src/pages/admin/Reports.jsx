import React, { useState, useEffect } from 'react';
import { Calendar, Users, Package, DollarSign, TrendingUp, BarChart3, Scissors, ShoppingCart, Filter } from 'lucide-react';
import { PageContainer } from '../../components/layout/PageContainer';

/**
 * Componente de reportes para administradores
 * Muestra ventas de productos y servicios por barbero
 * Soporta reportes diarios, semanales y mensuales
 */
const Reports = () => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [reportType, setReportType] = useState('daily');
  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [reportInfo, setReportInfo] = useState({
    period: '',
    dateRange: ''
  });
  const [summary, setSummary] = useState({
    totalRevenue: 0,
    totalCuts: 0,
    totalProducts: 0,
    activeBarbers: 0
  });

  const reportTypes = [
    { value: 'daily', label: 'Diario', icon: Calendar },
    { value: 'weekly', label: 'Semanal', icon: BarChart3 },
    { value: 'monthly', label: 'Mensual', icon: TrendingUp }
  ];

  useEffect(() => {
    loadReport();
  }, [selectedDate, reportType]);

  const loadReport = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await fetch(`/api/v1/sales/reports?type=${reportType}&date=${selectedDate}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Error al cargar el reporte');
      }

      const data = await response.json();
      setReportData(data.data || []);
      setReportInfo({
        period: data.period || '',
        dateRange: data.dateRange || ''
      });
      
      // Calcular resumen
      const summary = (data.data || []).reduce((acc, barber) => {
        acc.totalRevenue += barber.totalRevenue;
        acc.totalCuts += barber.totalCuts;
        acc.totalProducts += barber.totalProducts;
        acc.activeBarbers = data.data?.length || 0;
        return acc;
      }, { totalRevenue: 0, totalCuts: 0, totalProducts: 0, activeBarbers: 0 });
      
      setSummary(summary);
    } catch (error) {
      console.error('Error al cargar reporte:', error);
      setError(`Error al cargar el reporte ${reportTypes.find(t => t.value === reportType)?.label?.toLowerCase()}`);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP'
    }).format(amount);
  };

  const formatDate = (date) => {
    // Crear la fecha con la zona horaria local para evitar problemas de UTC
    const localDate = new Date(date + 'T00:00:00');
    return localDate.toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Función para calcular y mostrar el rango de fechas según el tipo de reporte
  const getDateRangeText = () => {
    const date = new Date(selectedDate + 'T00:00:00'); // Evitar problemas de zona horaria
    
    switch (reportType) {
      case 'daily':
        return `Reporte del día: ${formatDate(selectedDate)}`;
        
      case 'weekly':
        const weekStart = new Date(date);
        weekStart.setDate(weekStart.getDate() - 6);
        const weekStartStr = weekStart.toISOString().split('T')[0];
        return `Reporte semanal: ${formatDate(weekStartStr)} - ${formatDate(selectedDate)}`;
        
      case 'monthly':
        const monthStart = new Date(date);
        monthStart.setDate(monthStart.getDate() - 29);
        const monthStartStr = monthStart.toISOString().split('T')[0];
        return `Reporte mensual: ${formatDate(monthStartStr)} - ${formatDate(selectedDate)}`;
        
      default:
        return `Reporte: ${formatDate(selectedDate)}`;
    }
  };

  if (loading) {
    return (
      <PageContainer>
        <div className="min-h-screen bg-gray-900 flex items-center justify-center">
          <div className="relative z-10 text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-400 mx-auto mb-4"></div>
            <p className="text-white text-lg">Cargando reporte...</p>
          </div>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="min-h-screen bg-gray-900 text-white">
        {/* Background decorativo */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-green-500/10 rounded-full blur-3xl"></div>
          <div className="absolute top-3/4 left-3/4 w-64 h-64 bg-purple-500/10 rounded-full blur-2xl"></div>
        </div>

        <div className="relative z-10 container mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 via-green-400 to-purple-400 bg-clip-text text-transparent mb-2">
              Reportes
            </h1>
            <p className="text-gray-300 text-lg">Análisis de ventas y servicios por barbero</p>
            <p className="text-blue-400 mt-2 font-medium">{getDateRangeText()}</p>
            {reportInfo.dateRange && (
              <p className="text-gray-500 text-sm mt-1">Datos del servidor: {reportInfo.dateRange}</p>
            )}
          </div>

          {/* Controles de filtro */}
          <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Selector de tipo de reporte */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Filter className="h-5 w-5 text-blue-400" />
                <label className="text-gray-300 font-medium">Tipo:</label>
              </div>
              <div className="flex gap-2">
                {reportTypes.map((type) => {
                  const IconComponent = type.icon;
                  return (
                    <button
                      key={type.value}
                      onClick={() => setReportType(type.value)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300 ${
                        reportType === type.value
                          ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                          : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                      }`}
                    >
                      <IconComponent className="h-4 w-4" />
                      {type.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Selector de fecha */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-blue-400" />
                <label className="text-gray-300 font-medium">
                  {reportType === 'daily' ? 'Fecha:' : 'Fecha final:'}
                </label>
              </div>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-4 py-2 bg-gray-800/50 border border-gray-700/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              />
              <span className="text-gray-400">({formatDate(selectedDate)})</span>
              {(reportType === 'weekly' || reportType === 'monthly') && (
                <span className="text-xs text-gray-500 italic">
                  {reportType === 'weekly' ? '(7 días hacia atrás)' : '(30 días hacia atrás)'}
                </span>
              )}
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-900/30 border border-red-500/50 rounded-lg text-red-300">
              {error}
            </div>
          )}

          {/* Resumen general */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-gray-800/40 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Ingresos Totales</p>
                  <p className="text-2xl font-bold text-green-400">{formatCurrency(summary.totalRevenue)}</p>
                </div>
                <DollarSign className="h-8 w-8 text-green-400" />
              </div>
            </div>

            <div className="bg-gray-800/40 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Total Cortes</p>
                  <p className="text-2xl font-bold text-blue-400">{summary.totalCuts}</p>
                </div>
                <Scissors className="h-8 w-8 text-blue-400" />
              </div>
            </div>

            <div className="bg-gray-800/40 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Productos Vendidos</p>
                  <p className="text-2xl font-bold text-purple-400">{summary.totalProducts}</p>
                </div>
                <ShoppingCart className="h-8 w-8 text-purple-400" />
              </div>
            </div>

            <div className="bg-gray-800/40 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Barberos Activos</p>
                  <p className="text-2xl font-bold text-orange-400">{summary.activeBarbers}</p>
                </div>
                <Users className="h-8 w-8 text-orange-400" />
              </div>
            </div>
          </div>

          {/* Reportes por barbero */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white mb-4">Detalle por Barbero</h2>
            
            {reportData.length === 0 ? (
              <div className="text-center py-12">
                <BarChart3 className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-400 mb-2">No hay datos</h3>
                <p className="text-gray-500">No se registraron ventas ni servicios para esta fecha</p>
              </div>
            ) : (
              reportData.map((barber, index) => (
                <div
                  key={barber.barberId}
                  className="bg-gray-800/40 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6 hover:bg-gray-800/60 transition-all duration-200"
                >
                  {/* Header del barbero */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full flex items-center justify-center">
                        <span className="text-xl font-bold text-blue-400">#{index + 1}</span>
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-white">{barber.barberName}</h3>
                        <p className="text-gray-400">Total: {formatCurrency(barber.totalRevenue)}</p>
                      </div>
                    </div>
                    <div className="flex gap-4 text-sm">
                      <div className="text-center">
                        <div className="text-blue-400 font-semibold">{barber.totalCuts}</div>
                        <div className="text-gray-400">Cortes</div>
                      </div>
                      <div className="text-center">
                        <div className="text-purple-400 font-semibold">{barber.totalProducts}</div>
                        <div className="text-gray-400">Productos</div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Servicios/Cortes */}
                    <div>
                      <h4 className="text-lg font-semibold text-blue-400 mb-3 flex items-center gap-2">
                        <Scissors className="h-5 w-5" />
                        Servicios ({barber.totalCuts})
                      </h4>
                      {barber.cuts.length === 0 ? (
                        <p className="text-gray-500 text-sm">No se registraron cortes</p>
                      ) : (
                        <div className="space-y-2">
                          {barber.cuts.map((cut, idx) => (
                            <div key={idx} className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
                              <div className="flex justify-between items-start">
                                <div>
                                  <p className="font-medium text-blue-300">{cut.serviceName}</p>
                                  <p className="text-gray-400 text-sm">{cut.customerName}</p>
                                </div>
                                <span className="text-blue-400 font-semibold">{formatCurrency(cut.servicePrice)}</span>
                              </div>
                            </div>
                          ))}
                          <div className="text-right pt-2 border-t border-blue-500/30">
                            <span className="text-blue-400 font-bold">Subtotal: {formatCurrency(barber.totalCutsRevenue)}</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Productos */}
                    <div>
                      <h4 className="text-lg font-semibold text-purple-400 mb-3 flex items-center gap-2">
                        <Package className="h-5 w-5" />
                        Productos ({barber.totalProducts})
                      </h4>
                      {barber.productSales.length === 0 ? (
                        <p className="text-gray-500 text-sm">No se vendieron productos</p>
                      ) : (
                        <div className="space-y-2">
                          {barber.productSales.map((sale, idx) => (
                            <div key={idx} className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-3">
                              <div className="flex justify-between items-start">
                                <div>
                                  <p className="font-medium text-purple-300">{sale.productName}</p>
                                  <p className="text-gray-400 text-sm">
                                    {sale.quantity} x {formatCurrency(sale.unitPrice)}
                                    {sale.customerName && ` - ${sale.customerName}`}
                                  </p>
                                </div>
                                <span className="text-purple-400 font-semibold">{formatCurrency(sale.totalAmount)}</span>
                              </div>
                            </div>
                          ))}
                          <div className="text-right pt-2 border-t border-purple-500/30">
                            <span className="text-purple-400 font-bold">Subtotal: {formatCurrency(barber.totalProductRevenue)}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </PageContainer>
  );
};

export default Reports;
