import React, { useState } from 'react';
import { 
  Plus, 
  DollarSign, 
  TrendingUp, 
  Calendar, 
  Filter,
  Download,
  RefreshCw,
  CreditCard,
  PieChart,
  BarChart3
} from 'lucide-react';
import { PageContainer } from '../../components/layout/PageContainer';
import GradientText from '../../components/ui/GradientText';
import GradientButton from '../../components/ui/GradientButton';
import { FinancialDashboard } from '../../components/common/FinancialDashboard';
import { DateRangeFilter, CategoryFilter, PaymentMethodFilter } from '../../components/common/ReportFilters';
import { ExpenseModal, RecurringExpensesList } from '../../components/common/ExpenseManagement';
import useFinancialReports from '../../hooks/useFinancialReports';
import useExpenses from '../../hooks/useExpenses';

/**
 * Página de reportes financieros completa
 * Sistema integral de análisis financiero y gestión de gastos
 */
const Reports = () => {
  // Estados principales
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);

  // Hooks principales
  const {
    data: financialData,
    loading: financialLoading,
    error: financialError,
    dateRange,
    datePresets,
    setDateRangePreset,
    setCustomDateRange,
    refreshData,
    calculations,
    formatCurrency,
    formatDate
  } = useFinancialReports();

  const {
    expenses,
    recurringExpenses,
    loading: expensesLoading,
    error: expensesError,
    expenseCategories,
    paymentMethods,
    frequencies,
    createExpense,
    createRecurringExpense,
    updateExpense,
    deleteExpense,
    toggleRecurringExpense,
    processAutomaticExpenses,
    formatCurrency: formatExpenseCurrency,
    getNextRecurringDate
  } = useExpenses();

  // Estados para filtros
  const [categoryFilters, setCategoryFilters] = useState([]);
  const [paymentMethodFilters, setPaymentMethodFilters] = useState([]);

  // Tabs de navegación
  const tabs = [
    { 
      id: 'dashboard', 
      label: 'Dashboard', 
      icon: BarChart3,
      description: 'Métricas financieras principales'
    },
    { 
      id: 'expenses', 
      label: 'Gastos', 
      icon: DollarSign,
      description: 'Gestión de gastos únicos y recurrentes'
    },
    { 
      id: 'analysis', 
      label: 'Análisis', 
      icon: PieChart,
      description: 'Análisis detallado y tendencias'
    }
  ];

  // Handlers para gastos
  const handleSaveExpense = async (expenseData) => {
    try {
      if (expenseData.isRecurring) {
        await createRecurringExpense(expenseData);
      } else {
        await createExpense(expenseData);
      }
      setShowExpenseModal(false);
      setEditingExpense(null);
      refreshData();
    } catch (error) {
      console.error('Error saving expense:', error);
    }
  };

  const handleEditExpense = (expense) => {
    setEditingExpense(expense);
    setShowExpenseModal(true);
  };

  const handleDeleteExpense = async (expenseId) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este gasto?')) {
      try {
        await deleteExpense(expenseId);
        refreshData();
      } catch (error) {
        console.error('Error deleting expense:', error);
      }
    }
  };

  const handleToggleRecurring = async (expenseId, isActive) => {
    try {
      await toggleRecurringExpense(expenseId, isActive);
    } catch (error) {
      console.error('Error toggling recurring expense:', error);
    }
  };

  // Handlers para filtros
  const handleCategoryToggle = (category) => {
    setCategoryFilters(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const handlePaymentMethodToggle = (method) => {
    setPaymentMethodFilters(prev => 
      prev.includes(method) 
        ? prev.filter(m => m !== method)
        : [...prev, method]
    );
  };

  const handleRefreshAll = async () => {
    try {
      await Promise.all([
        refreshData(),
        processAutomaticExpenses()
      ]);
    } catch (error) {
      console.error('Error refreshing data:', error);
    }
  };

  // Renderizar contenido por tab
  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <div className="space-y-8">
            {/* Dashboard principal */}
            <FinancialDashboard
              data={financialData}
              calculations={calculations}
              formatCurrency={formatCurrency}
              loading={financialLoading}
            />

            {/* Datos adicionales */}
            {!financialLoading && financialData.dailyData?.length > 0 && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
                {/* Gráfico de tendencias diarias */}
                <div className="group relative bg-white/5 border border-white/10 rounded-2xl p-6 lg:p-8 backdrop-blur-sm shadow-2xl shadow-blue-500/20 overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[2.5%] to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out rounded-2xl"></div>
                  
                  <div className="relative">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="p-3 bg-gradient-to-r from-green-600/20 to-blue-600/20 rounded-xl border border-green-500/20 shadow-xl shadow-blue-500/20">
                        <TrendingUp className="w-6 h-6 text-green-400" />
                      </div>
                      <h3 className="text-xl font-bold text-white">Tendencias Diarias</h3>
                    </div>
                    
                    <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar">
                      {financialData.dailyData.slice(0, 10).map((day, index) => (
                        <div key={day.date} className="flex justify-between items-center p-3 bg-blue-500/5 border border-blue-500/20 rounded-lg">
                          <span className="text-gray-300 text-sm">{formatDate(day.date)}</span>
                          <span className="text-green-400 font-semibold">{formatCurrency(day.totalRevenue)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Top servicios/productos */}
                <div className="group relative bg-white/5 border border-white/10 rounded-2xl p-6 lg:p-8 backdrop-blur-sm shadow-2xl shadow-blue-500/20 overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[2.5%] to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out rounded-2xl"></div>
                  
                  <div className="relative">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="p-3 bg-gradient-to-r from-purple-600/20 to-blue-600/20 rounded-xl border border-purple-500/20 shadow-xl shadow-blue-500/20">
                        <BarChart3 className="w-6 h-6 text-purple-400" />
                      </div>
                      <h3 className="text-xl font-bold text-white">Top Servicios</h3>
                    </div>
                    
                    <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar">
                      {financialData.serviceBreakdown?.slice(0, 10).map((service, index) => (
                        <div key={service.serviceId || index} className="flex justify-between items-center p-3 bg-purple-500/5 border border-purple-500/20 rounded-lg">
                          <span className="text-gray-300 text-sm">{service.serviceName}</span>
                          <span className="text-purple-400 font-semibold">{formatCurrency(service.totalRevenue)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      case 'expenses':
        return (
          <div className="space-y-8">
            {/* Header de gastos */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">Gestión de Gastos</h2>
                <p className="text-gray-400">Administra gastos únicos y recurrentes de la barbería</p>
              </div>
              
              <div className="flex gap-3">
                <GradientButton
                  variant="secondary"
                  size="md"
                  onClick={processAutomaticExpenses}
                  disabled={expensesLoading}
                  className="shadow-xl shadow-blue-500/20"
                >
                  <div className="flex items-center gap-2">
                    <RefreshCw className="w-4 h-4" />
                    <span>Procesar Automáticos</span>
                  </div>
                </GradientButton>
                
                <GradientButton
                  variant="primary"
                  size="md"
                  onClick={() => {
                    setEditingExpense(null);
                    setShowExpenseModal(true);
                  }}
                  className="shadow-xl shadow-blue-500/20"
                >
                  <div className="flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    <span>Nuevo Gasto</span>
                  </div>
                </GradientButton>
              </div>
            </div>

            {/* Lista de gastos recurrentes */}
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-r from-orange-600/20 to-red-600/20 rounded-xl border border-orange-500/20 shadow-xl shadow-blue-500/20">
                  <Calendar className="w-6 h-6 text-orange-400" />
                </div>
                <GradientText className="text-xl font-bold">
                  Gastos Recurrentes
                </GradientText>
              </div>

              <RecurringExpensesList
                expenses={recurringExpenses}
                onEdit={handleEditExpense}
                onToggle={handleToggleRecurring}
                onDelete={handleDeleteExpense}
                formatCurrency={formatExpenseCurrency}
                getNextRecurringDate={getNextRecurringDate}
                loading={expensesLoading}
              />
            </div>

            {/* Lista de gastos recientes */}
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-xl border border-blue-500/20 shadow-xl shadow-blue-500/20">
                  <DollarSign className="w-6 h-6 text-blue-400" />
                </div>
                <GradientText className="text-xl font-bold">
                  Gastos Recientes
                </GradientText>
              </div>

              <div className="space-y-4">
                {expensesLoading ? (
                  [...Array(5)].map((_, i) => (
                    <div key={i} className="animate-pulse bg-white/5 border border-white/10 rounded-lg p-4 h-20"></div>
                  ))
                ) : expenses.length === 0 ? (
                  <div className="text-center py-12">
                    <DollarSign className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-400 mb-2">No hay gastos registrados</h3>
                    <p className="text-gray-500">Crea el primer gasto para comenzar</p>
                  </div>
                ) : (
                  expenses.slice(0, 10).map((expense) => (
                    <div
                      key={expense._id}
                      className="group relative bg-white/5 border border-white/10 rounded-lg p-4 backdrop-blur-sm shadow-xl shadow-blue-500/20 hover:bg-white/10 transition-all duration-300 overflow-hidden"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[2.5%] to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out rounded-lg"></div>
                      
                      <div className="relative flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className="font-semibold text-white">{expense.description}</h4>
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-500/20 text-blue-300 border border-blue-500/30">
                              {expenseCategories.find(c => c.value === expense.category)?.label || expense.category}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-4 text-sm text-gray-300">
                            <span className="font-medium text-red-400">
                              {formatExpenseCurrency(expense.amount)}
                            </span>
                            <span>{formatDate(expense.date)}</span>
                            <span className="text-gray-400">
                              {paymentMethods.find(p => p.value === expense.paymentMethod)?.label || expense.paymentMethod}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        );

      case 'analysis':
        return (
          <div className="space-y-8">
            {/* Análisis avanzado */}
            <div className="text-center">
              <h2 className="text-2xl font-bold text-white mb-2">Análisis Financiero Avanzado</h2>
              <p className="text-gray-400">Próximamente: Gráficos interactivos y análisis predictivo</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
              {/* Placeholder para gráficos */}
              <div className="group relative bg-white/5 border border-white/10 rounded-2xl p-6 lg:p-8 backdrop-blur-sm shadow-2xl shadow-blue-500/20 overflow-hidden min-h-64 flex items-center justify-center">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[2.5%] to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out rounded-2xl"></div>
                
                <div className="relative text-center">
                  <PieChart className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-400 mb-2">Gráficos Interactivos</h3>
                  <p className="text-gray-500">Análisis visual de tendencias y patrones</p>
                </div>
              </div>

              <div className="group relative bg-white/5 border border-white/10 rounded-2xl p-6 lg:p-8 backdrop-blur-sm shadow-2xl shadow-blue-500/20 overflow-hidden min-h-64 flex items-center justify-center">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[2.5%] to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out rounded-2xl"></div>
                
                <div className="relative text-center">
                  <TrendingUp className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-400 mb-2">Análisis Predictivo</h3>
                  <p className="text-gray-500">Proyecciones y recomendaciones</p>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <PageContainer>
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-6 space-y-8">
        {/* Header principal */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-3 mb-2">
            <div className="p-3 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-xl border border-blue-500/20 shadow-xl shadow-blue-500/20">
              <BarChart3 className="w-6 h-6 text-blue-400" />
            </div>
            <GradientText className="text-xl lg:text-2xl font-bold">
              Centro de Reportes Financieros
            </GradientText>
          </div>
          <p className="text-gray-400 text-sm lg:text-base">
            Sistema integral de análisis financiero y gestión de gastos
          </p>
        </div>

        {/* Filtros de fecha */}
        <DateRangeFilter
          dateRange={dateRange}
          datePresets={datePresets}
          onPresetChange={setDateRangePreset}
          onCustomDateChange={setCustomDateRange}
          loading={financialLoading}
        />

        {/* Navegación por tabs */}
        <div className="flex justify-center mb-6">
          <div className="bg-white/5 border border-white/10 rounded-xl backdrop-blur-sm shadow-lg p-1 flex gap-1 overflow-x-auto">
            {tabs.map((tab) => {
              const IconComponent = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`group relative px-4 sm:px-6 py-3 rounded-xl border transition-all duration-300 backdrop-blur-sm flex items-center gap-2 whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-blue-500/50 bg-blue-500/10 shadow-xl shadow-blue-500/20'
                      : 'border-white/20 bg-white/5 hover:border-blue-500/30 hover:bg-blue-500/5'
                  }`}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[2.5%] to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out rounded-xl"></div>
                  
                  <div className="relative flex items-center gap-2">
                    <IconComponent className={`w-4 h-4 sm:w-5 sm:h-5 transition-colors duration-300 ${
                      activeTab === tab.id ? 'text-blue-300' : 'text-white'
                    }`} />
                    <div className="text-left">
                      <div className={`font-medium text-sm transition-colors duration-300 ${
                        activeTab === tab.id ? 'text-blue-300' : 'text-white'
                      }`}>
                        {tab.label}
                      </div>
                      <div className="text-xs text-gray-400 hidden sm:block">
                        {tab.description}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Botones de acción globales */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            {(financialError || expensesError) && (
              <div className="px-4 py-2 bg-red-500/20 border border-red-500/30 rounded-lg text-red-300 text-sm">
                {financialError || expensesError}
              </div>
            )}
          </div>
          
          <div className="flex gap-3">
            <GradientButton
              variant="secondary"
              size="md"
              onClick={handleRefreshAll}
              disabled={financialLoading || expensesLoading}
              className="shadow-xl shadow-blue-500/20"
            >
              <div className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4" />
                <span>Actualizar</span>
              </div>
            </GradientButton>
            
            <GradientButton
              variant="primary"
              size="md"
              onClick={() => {/* TODO: Implementar exportación */}}
              className="shadow-xl shadow-blue-500/20"
            >
              <div className="flex items-center gap-2">
                <Download className="w-4 h-4" />
                <span>Exportar</span>
              </div>
            </GradientButton>
          </div>
        </div>

        {/* Contenido de la tab activa */}
        {renderTabContent()}

        {/* Modal de gastos */}
        <ExpenseModal
          isOpen={showExpenseModal}
          onClose={() => {
            setShowExpenseModal(false);
            setEditingExpense(null);
          }}
          expense={editingExpense}
          expenseCategories={expenseCategories}
          paymentMethods={paymentMethods}
          frequencies={frequencies}
          onSave={handleSaveExpense}
          loading={expensesLoading}
        />
      </div>
    </PageContainer>
  );
};

export default Reports;
