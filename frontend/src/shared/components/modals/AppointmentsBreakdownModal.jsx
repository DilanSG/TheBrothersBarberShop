import React, { useState, useEffect } from 'react';
import { X, Calendar, CreditCard, Filter, DollarSign, TrendingUp } from 'lucide-react';

const AppointmentsBreakdownModal = ({ isOpen, onClose, revenueData, dashboardData, dateRange, formatCurrency: externalFormatCurrency }) => {
  const [appointments, setAppointments] = useState([]);
  const [filteredAppointments, setFilteredAppointments] = useState([]);
  const [paymentMethodFilter, setPaymentMethodFilter] = useState('all');
  const [loading, setLoading] = useState(false);
  const [availablePaymentMethods, setAvailablePaymentMethods] = useState([]);
  const [filtersExpanded, setFiltersExpanded] = useState(true);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  // Bloquear scroll del body
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = 'unset'; };
    }
  }, [isOpen]);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-CO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getPaymentMethodDisplayName = (method) => {
    const methodNames = {
      'efectivo': 'Efectivo',
      'cash': 'Efectivo',

      'tarjeta': 'Tarjeta',
      'nequi': 'Nequi',
      'daviplata': 'Daviplata',
      'bancolombia': 'Bancolombia',
      'transferencia': 'Transferencia',
      'digital': 'Digital',
      'nu': 'Nu',
      'sin-metodo': 'Sin método de pago'
    };
    
    // Si no hay método o es null/undefined/vacío, retornar "Sin método"
    if (!method || method === null || method === '' || method === 'sin-metodo') {
      return 'Sin método de pago';
    }
    
    return methodNames[method] || method || 'Sin método';
  };

  const getPaymentMethodColor = (method) => {
    const colors = {
      'efectivo': {
        bg: 'bg-green-500/10',
        border: 'border-green-500/30',
        text: 'text-green-300'
      },
      'cash': {
        bg: 'bg-green-500/10',
        border: 'border-green-500/30',
        text: 'text-green-300'
      },
      'transferencia': {
        bg: 'bg-purple-500/10',
        border: 'border-purple-500/30',
        text: 'text-purple-300'
      },
      'digital': {
        bg: 'bg-purple-500/10',
        border: 'border-purple-500/30',
        text: 'text-purple-300'
      },
      'nequi': {
        bg: 'bg-yellow-500/10',
        border: 'border-yellow-500/30',
        text: 'text-yellow-300'
      },
      'daviplata': {
        bg: 'bg-red-500/10',
        border: 'border-red-500/30',
        text: 'text-red-300'
      },
      'bancolombia': {
        bg: 'bg-indigo-500/10',
        border: 'border-indigo-500/30',
        text: 'text-indigo-300'
      },
      'nu': {
        bg: 'bg-orange-500/10',
        border: 'border-orange-500/30',
        text: 'text-orange-300'
      },
      'tarjeta': {
        bg: 'bg-blue-500/10',
        border: 'border-blue-500/30',
        text: 'text-blue-300'
      },
      'sin-metodo': {
        bg: 'bg-gray-500/10',
        border: 'border-gray-500/30',
        text: 'text-gray-300'
      }
    };
    
    // Si no hay método o es null/undefined/vacío, usar el color de "sin-metodo"
    if (!method || method === null || method === '' || method === 'sin-metodo') {
      return colors['sin-metodo'];
    }
    
    return colors[method] || colors['sin-metodo'];
  };

  useEffect(() => {
    if (isOpen) {
      fetchAppointments();
    }
  }, [isOpen, dateRange, dashboardData]); // ✅ Agregar dashboardData como dependencia

  useEffect(() => {
    filterAppointments();
  }, [appointments, paymentMethodFilter]);

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      console.log('📅 Cargando citas individuales...');
      
      const token = localStorage.getItem('token');
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';
      
      // ✅ Construir URL con filtros de fecha si están disponibles
      let apiUrl = `${baseUrl}/appointments?status=completed`;
      
      if (dateRange) {
        const searchParams = new URLSearchParams();
        searchParams.append('startDate', dateRange.startDate);
        searchParams.append('endDate', dateRange.endDate);
        apiUrl += `&${searchParams.toString()}`;
      }
      
      const response = await fetch(apiUrl, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        
        // Tomar TODAS las citas completadas, sin filtrar por método de pago
        const completedAppointments = data.data || [];
        
        setAppointments(completedAppointments);
        
        // Extraer métodos de pago únicos (incluyendo null/undefined como "Sin método")
        const methods = [...new Set(completedAppointments.map(appointment => appointment.paymentMethod || 'sin-metodo').filter(Boolean))];
        setAvailablePaymentMethods(methods);
      } else {
        const errorText = await response.text();
        console.error('❌ Failed to fetch appointments:', response.status, response.statusText);
        console.error('❌ Error response:', errorText);
      }
    } catch (error) {
      console.error('❌ Error fetching appointments:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterAppointments = () => {
    let filtered = [...appointments];
    
    if (paymentMethodFilter !== 'all') {
      filtered = filtered.filter(appointment => {
        // Manejar el caso especial "sin-metodo"
        if (paymentMethodFilter === 'sin-metodo') {
          return !appointment.paymentMethod || appointment.paymentMethod === null || appointment.paymentMethod === '';
        }
        return appointment.paymentMethod === paymentMethodFilter;
      });
    }
    
    setFilteredAppointments(filtered);
  };

  const getPaymentMethodCounts = () => {
    const counts = {};
    appointments.forEach(appointment => {
      const method = appointment.paymentMethod;
      if (method) {
        counts[method] = (counts[method] || 0) + 1;
      }
    });
    return counts;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[9999] p-2 sm:p-4 lg:p-8 pt-8 sm:pt-10">
      <div className="relative w-full max-w-xs sm:max-w-md lg:max-w-2xl mx-auto h-[85vh] sm:h-[80vh] lg:h-[75vh] flex flex-col">
        <div className="relative bg-blue-500/5 backdrop-blur-md border border-blue-500/20 rounded-2xl shadow-2xl shadow-blue-500/20 h-full flex flex-col overflow-hidden">
          {/* Header fijo */}
          <div className="relative z-10 flex-shrink-0 p-2 sm:p-3 lg:p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <div className="p-1 sm:p-1.5 rounded-lg bg-blue-500/20 border border-blue-500/30">
                  <Calendar className="w-3 h-3 sm:w-4 sm:h-4 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm lg:text-base font-semibold text-white">
                    Reservas Completadas
                  </h3>
                  {dateRange ? (
                    <p className="text-xs text-blue-300">
                      {dateRange.startDate} - {dateRange.endDate}
                    </p>
                  ) : (
                    <p className="text-xs text-blue-300">
                      Desglose por método de pago
                    </p>
                  )}
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-1 sm:p-1.5 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 hover:bg-red-500/30 transition-colors duration-200 touch-manipulation"
              >
                <X className="w-3 h-3 sm:w-4 sm:h-4" />
              </button>
            </div>
            {/* Resumen */}
            <div className="mt-2 sm:mt-3 p-2 sm:p-3 bg-blue-500/10 rounded-xl border border-blue-500/20">
              <div className="grid grid-cols-2 gap-2 sm:gap-3">
                <div className="text-center">
                  <p className="text-xs text-blue-300">Total Citas</p>
                  <p className="text-sm sm:text-base font-bold text-white">{filteredAppointments.length}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-blue-300">Total Ingresos</p>
                  <p className="text-sm sm:text-base font-bold text-blue-400">
                    {formatCurrency(
                      filteredAppointments.reduce((sum, appointment) => 
                        sum + (appointment.totalRevenue || appointment.price || 0), 0
                      )
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex-1 overflow-hidden flex flex-col">
            {/* Filtros */}
            <div className="p-2 sm:p-3 border-b border-blue-500/10 flex-shrink-0">
              <div className="flex items-center justify-between mb-1 sm:mb-2">
                <h4 className="text-xs sm:text-sm font-medium text-blue-300 flex items-center gap-1 sm:gap-2">
                  <Filter className="w-3 h-3 sm:w-4 sm:h-4" />
                  Filtros
                </h4>
                <button
                  onClick={() => setFiltersExpanded(!filtersExpanded)}
                  className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                >
                  {filtersExpanded ? 'Ocultar' : 'Mostrar'}
                </button>
              </div>

              {filtersExpanded && (
                <div className="space-y-2">
                  <div>
                    <label className="block text-xs text-blue-300 mb-1">Método de Pago:</label>
                    <div className="flex flex-wrap gap-1">
                      <button
                        onClick={() => setPaymentMethodFilter('all')}
                        className={`px-2 py-1 rounded text-xs border transition-all duration-300 ${
                          paymentMethodFilter === 'all'
                            ? 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                            : 'bg-white/5 text-gray-300 border-white/20 hover:border-blue-500/40'
                        }`}
                      >
                        Todos ({appointments.length})
                      </button>
                      {Object.entries(getPaymentMethodCounts()).map(([method, count]) => {
                        const colors = getPaymentMethodColor(method);
                        return (
                          <button
                            key={method}
                            onClick={() => setPaymentMethodFilter(method)}
                            className={`px-2 py-1 rounded text-xs border transition-all duration-300 ${
                              paymentMethodFilter === method
                                ? `${colors.bg} ${colors.text} ${colors.border}`
                                : 'bg-white/5 text-gray-300 border-white/20 hover:border-blue-500/40'
                            }`}
                          >
                            {getPaymentMethodDisplayName(method)} ({count})
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Lista de citas */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-2 sm:p-3">
              {loading ? (
                <div className="text-center py-6 sm:py-8">
                  <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-blue-500 mx-auto"></div>
                  <p className="text-xs sm:text-sm text-blue-300 mt-2">Cargando citas...</p>
                </div>
              ) : filteredAppointments.length === 0 ? (
                <div className="text-center py-6 sm:py-8">
                  <Calendar className="w-8 h-8 sm:w-12 sm:h-12 text-blue-400 mx-auto mb-2 sm:mb-3" />
                  <p className="text-xs sm:text-sm text-blue-300">No hay citas completadas</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {paymentMethodFilter !== 'all' 
                      ? `con el método de pago: ${getPaymentMethodDisplayName(paymentMethodFilter)}`
                      : 'para mostrar'
                    }
                  </p>
                </div>
              ) : (
                <div className="space-y-2 sm:space-y-3">
                  {filteredAppointments.map((appointment, index) => {
                    const methodColor = getPaymentMethodColor(appointment.paymentMethod);
                    return (
                      <div
                        key={appointment._id || index}
                        className={`group relative p-3 sm:p-4 ${methodColor.bg} border ${methodColor.border} rounded-lg sm:rounded-xl hover:scale-[1.02] transition-all duration-300`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-2 sm:gap-3 flex-1 min-w-0">
                            <div className={`p-1.5 sm:p-2 ${methodColor.bg} rounded-lg border ${methodColor.border} flex-shrink-0`}>
                              <Calendar className={`w-3 h-3 sm:w-4 sm:h-4 ${methodColor.text}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-1">
                                <h4 className="font-medium text-white text-xs sm:text-sm truncate">
                                  {appointment.service?.name || 'Servicio no especificado'}
                                </h4>
                                <div className="flex gap-1 flex-wrap">
                                  <span className={`px-1.5 sm:px-2 py-0.5 ${methodColor.bg} ${methodColor.text} border ${methodColor.border} rounded-full text-xs font-medium self-start flex-shrink-0`}>
                                    {getPaymentMethodDisplayName(appointment.paymentMethod)}
                                  </span>
                                </div>
                              </div>
                              <p className={`text-xs ${methodColor.text} mb-1 sm:mb-2`}>
                                Cliente: {appointment.user?.name || 'Cliente'} • {formatDate(appointment.date)}
                              </p>
                              <p className="text-xs text-gray-400">
                                Barbero: {appointment.barber?.user?.name || 'Barbero no especificado'}
                              </p>
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <div className={`text-sm sm:text-base font-bold ${methodColor.text}`}>
                              {formatCurrency(appointment.totalRevenue || appointment.price || 0)}
                            </div>
                            <div className="text-xs text-gray-400">
                              Cita
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppointmentsBreakdownModal;