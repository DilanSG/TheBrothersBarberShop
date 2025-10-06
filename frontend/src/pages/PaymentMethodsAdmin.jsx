import React, { useState, useEffect } from 'react';
import { 
  CreditCard, 
  Plus, 
  Edit2, 
  Trash2, 
  Settings, 
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Database,
  Zap
} from 'lucide-react';
import { usePaymentMethodsNew } from '../shared/contexts/PaymentMethodsNewContext';
import { useAuth } from '../shared/contexts/AuthContext';
import GradientText from '../shared/components/ui/GradientText';
import GradientButton from '../shared/components/ui/GradientButton';
import { toast } from 'react-toastify';

const PaymentMethodsAdmin = () => {
  const { user } = useAuth();
  const {
    paymentMethods,
    loading,
    error,
    fetchPaymentMethods,
    createPaymentMethod,
    updatePaymentMethod,
    deletePaymentMethod,
    initializeSystemMethods,
    normalizeExistingMethods,
    isReady
  } = usePaymentMethodsNew();

  // Estados locales
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingMethod, setEditingMethod] = useState(null);
  const [operationLoading, setOperationLoading] = useState(false);

  // Estado del formulario
  const [formData, setFormData] = useState({
    backendId: '',
    name: '',
    description: '',
    color: '#3b82f6',
    emoji: '💳',
    category: 'digital'
  });

  // Verificar permisos de admin
  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-gray-900 to-purple-900 p-4">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <AlertTriangle className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h2 className="text-xl text-white mb-2">Acceso Restringido</h2>
            <p className="text-gray-400">Solo los administradores pueden acceder a esta sección</p>
          </div>
        </div>
      </div>
    );
  }

  // Colores disponibles
  const availableColors = [
    { name: 'Azul', value: '#3b82f6', class: 'bg-blue-500' },
    { name: 'Verde', value: '#10b981', class: 'bg-green-500' },
    { name: 'Púrpura', value: '#8b5cf6', class: 'bg-purple-500' },
    { name: 'Rojo', value: '#ef4444', class: 'bg-red-500' },
    { name: 'Amarillo', value: '#f59e0b', class: 'bg-yellow-500' },
    { name: 'Rosa', value: '#ec4899', class: 'bg-pink-500' },
    { name: 'Gris', value: '#6b7280', class: 'bg-gray-500' }
  ];

  // Categorías disponibles
  const availableCategories = [
    { value: 'cash', label: 'Efectivo' },
    { value: 'card', label: 'Tarjeta' },
    { value: 'digital', label: 'Digital' },
    { value: 'transfer', label: 'Transferencia' },
    { value: 'other', label: 'Otro' }
  ];

  // Emojis disponibles
  const availableEmojis = ['💵', '💳', '📱', '🏛️', '💻', '🔄', '💰'];

  // Generar backendId automáticamente
  const generateBackendId = (name) => {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s]/g, '')
      .trim()
      .replace(/\s+/g, '_');
  };

  // Manejar creación
  const handleCreate = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('El nombre es requerido');
      return;
    }

    setOperationLoading(true);
    try {
      const backendId = generateBackendId(formData.name);
      
      await createPaymentMethod({
        ...formData,
        backendId
      });
      
      toast.success('Método de pago creado exitosamente');
      setShowCreateModal(false);
      resetForm();
    } catch (error) {
      toast.error(error.message || 'Error creando método de pago');
    } finally {
      setOperationLoading(false);
    }
  };

  // Manejar edición
  const handleEdit = async (e) => {
    e.preventDefault();
    
    if (!editingMethod || !formData.name.trim()) {
      toast.error('Datos inválidos para editar');
      return;
    }

    setOperationLoading(true);
    try {
      await updatePaymentMethod(editingMethod.backendId, {
        name: formData.name,
        description: formData.description,
        color: formData.color,
        emoji: formData.emoji,
        category: formData.category
      });
      
      toast.success('Método de pago actualizado exitosamente');
      setEditingMethod(null);
      resetForm();
    } catch (error) {
      toast.error(error.message || 'Error actualizando método de pago');
    } finally {
      setOperationLoading(false);
    }
  };

  // Manejar eliminación
  const handleDelete = async (method) => {
    if (!confirm(`¿Estás seguro de eliminar "${method.name}"?`)) {
      return;
    }

    setOperationLoading(true);
    try {
      await deletePaymentMethod(method.backendId, false);
      toast.success('Método de pago eliminado exitosamente');
    } catch (error) {
      if (error.message.includes('método en uso')) {
        // Preguntar si quiere forzar la eliminación
        const forceDelete = confirm(
          `El método está en uso. ${error.message}\n\n¿Deseas eliminarlo de todas formas? Esto puede afectar registros existentes.`
        );
        
        if (forceDelete) {
          try {
            await deletePaymentMethod(method.backendId, true);
            toast.success('Método de pago eliminado forzosamente');
          } catch (forceError) {
            toast.error(forceError.message || 'Error eliminando método de pago');
          }
        }
      } else {
        toast.error(error.message || 'Error eliminando método de pago');
      }
    } finally {
      setOperationLoading(false);
    }
  };

  // Inicializar métodos del sistema
  const handleInitializeSystem = async () => {
    if (!confirm('¿Inicializar métodos del sistema? Esto creará los métodos de pago predeterminados.')) {
      return;
    }

    setOperationLoading(true);
    try {
      await initializeSystemMethods();
      toast.success('Métodos del sistema inicializados exitosamente');
    } catch (error) {
      toast.error(error.message || 'Error inicializando métodos del sistema');
    } finally {
      setOperationLoading(false);
    }
  };

  // Normalizar métodos existentes
  const handleNormalizeExisting = async () => {
    if (!confirm('¿Normalizar métodos existentes? Esto unificará métodos duplicados en la base de datos.')) {
      return;
    }

    setOperationLoading(true);
    try {
      const result = await normalizeExistingMethods();
      toast.success(`Métodos normalizados exitosamente: ${result.data.normalizedCount} cambios`);
    } catch (error) {
      toast.error(error.message || 'Error normalizando métodos');
    } finally {
      setOperationLoading(false);
    }
  };

  // Resetear formulario
  const resetForm = () => {
    setFormData({
      backendId: '',
      name: '',
      description: '',
      color: '#3b82f6',
      emoji: '💳',
      category: 'digital'
    });
  };

  // Preparar edición
  const prepareEdit = (method) => {
    setEditingMethod(method);
    setFormData({
      backendId: method.backendId,
      name: method.name,
      description: method.description || '',
      color: method.color || '#3b82f6',
      emoji: method.emoji || '💳',
      category: method.category || 'digital'
    });
    setShowCreateModal(true);
  };

  // Cancelar edición/creación
  const handleCancel = () => {
    setShowCreateModal(false);
    setEditingMethod(null);
    resetForm();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-gray-900 to-purple-900 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-xl border border-blue-500/20">
                <Settings className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <GradientText className="text-2xl lg:text-3xl font-bold">
                  Administrar Métodos de Pago
                </GradientText>
                <p className="text-gray-400 text-sm">
                  Gestión centralizada de todos los métodos de pago del sistema
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => fetchPaymentMethods(true)}
                disabled={loading || operationLoading}
                className="p-2 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 rounded-lg transition-colors duration-200"
              >
                <RefreshCw className={`w-4 h-4 text-blue-400 ${loading ? 'animate-spin' : ''}`} />
              </button>
              
              <GradientButton
                onClick={() => setShowCreateModal(true)}
                disabled={operationLoading}
                className="flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Nuevo Método
              </GradientButton>
            </div>
          </div>

          {/* Acciones administrativas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-4">
              <div className="flex items-center gap-3 mb-2">
                <Database className="w-5 h-5 text-blue-400" />
                <h3 className="text-white font-medium">Inicializar Sistema</h3>
              </div>
              <p className="text-gray-400 text-sm mb-3">
                Crear métodos de pago predeterminados del sistema
              </p>
              <button
                onClick={handleInitializeSystem}
                disabled={operationLoading}
                className="px-3 py-2 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 rounded-lg text-blue-400 text-sm transition-colors duration-200"
              >
                Inicializar
              </button>
            </div>

            <div className="bg-purple-500/5 border border-purple-500/20 rounded-xl p-4">
              <div className="flex items-center gap-3 mb-2">
                <Zap className="w-5 h-5 text-purple-400" />
                <h3 className="text-white font-medium">Normalizar Métodos</h3>
              </div>
              <p className="text-gray-400 text-sm mb-3">
                Unificar métodos duplicados en la base de datos
              </p>
              <button
                onClick={handleNormalizeExisting}
                disabled={operationLoading}
                className="px-3 py-2 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 rounded-lg text-purple-400 text-sm transition-colors duration-200"
              >
                Normalizar
              </button>
            </div>
          </div>
        </div>

        {/* Estado de carga/error */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <RefreshCw className="w-8 h-8 text-blue-400 animate-spin mx-auto mb-4" />
              <p className="text-gray-400">Cargando métodos de pago...</p>
            </div>
          </div>
        )}

        {error && !loading && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-6">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-red-400" />
              <div>
                <h3 className="text-red-400 font-medium">Error al cargar métodos de pago</h3>
                <p className="text-gray-400 text-sm">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Lista de métodos de pago */}
        {isReady && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {paymentMethods.map((method) => (
              <div
                key={method.backendId}
                className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-colors duration-200"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-10 h-10 rounded-lg flex items-center justify-center text-lg"
                      style={{ backgroundColor: method.color + '20', border: `1px solid ${method.color}40` }}
                    >
                      {method.emoji}
                    </div>
                    <div>
                      <h3 className="text-white font-medium">{method.name}</h3>
                      <p className="text-gray-400 text-xs">{method.backendId}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    {method.isSystem ? (
                      <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded-full border border-blue-500/30">
                        Sistema
                      </span>
                    ) : (
                      <span className="px-2 py-1 bg-purple-500/20 text-purple-400 text-xs rounded-full border border-purple-500/30">
                        Usuario
                      </span>
                    )}
                  </div>
                </div>

                {method.description && (
                  <p className="text-gray-400 text-sm mb-4">{method.description}</p>
                )}

                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500 capitalize">
                    {method.category || 'digital'}
                  </span>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => prepareEdit(method)}
                      disabled={operationLoading}
                      className="p-2 text-gray-400 hover:text-blue-400 hover:bg-blue-500/20 rounded-lg transition-colors duration-200"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    
                    {method.backendId !== 'cash' && (
                      <button
                        onClick={() => handleDelete(method)}
                        disabled={operationLoading}
                        className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/20 rounded-lg transition-colors duration-200"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal de creación/edición */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-blue-500/5 backdrop-blur-md border border-blue-500/20 rounded-2xl p-6 w-full max-w-md">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-white">
                  {editingMethod ? 'Editar Método de Pago' : 'Crear Método de Pago'}
                </h3>
              </div>

              <form onSubmit={editingMethod ? handleEdit : handleCreate} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Nombre
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="glassmorphism-input w-full"
                    placeholder="Ej: PayPal"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Descripción
                  </label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    className="glassmorphism-input w-full"
                    placeholder="Ej: Pagos por PayPal"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Categoría
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                    className="glassmorphism-select w-full"
                  >
                    {availableCategories.map((category) => (
                      <option key={category.value} value={category.value}>
                        {category.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Color
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {availableColors.map((color) => (
                      <button
                        key={color.value}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, color: color.value }))}
                        className={`
                          p-2 rounded-lg border-2 transition-all duration-200
                          ${formData.color === color.value 
                            ? 'border-white scale-110' 
                            : 'border-white/20 hover:border-white/40'
                          }
                        `}
                      >
                        <div className={`w-full h-4 rounded ${color.class}`}></div>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Emoji
                  </label>
                  <div className="grid grid-cols-7 gap-2">
                    {availableEmojis.map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, emoji }))}
                        className={`
                          p-2 rounded-lg border-2 text-lg transition-all duration-200
                          ${formData.emoji === emoji 
                            ? 'border-white/50 scale-110' 
                            : 'border-white/20 hover:border-white/40'
                          }
                        `}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>

                {!editingMethod && formData.name && (
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      ID generado automáticamente
                    </label>
                    <div className="px-3 py-2 bg-gray-500/10 border border-gray-500/20 rounded-lg text-gray-300 text-sm">
                      {generateBackendId(formData.name)}
                    </div>
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="flex-1 px-4 py-2 bg-gray-500/20 border border-gray-500/30 rounded-lg text-gray-300 hover:bg-gray-500/30 transition-colors duration-200"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={operationLoading}
                    className="flex-1 px-4 py-2 bg-blue-500/20 border border-blue-500/30 rounded-lg text-blue-300 hover:bg-blue-500/30 transition-colors duration-200 disabled:opacity-50"
                  >
                    {operationLoading ? 'Guardando...' : (editingMethod ? 'Guardar' : 'Crear')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentMethodsAdmin;