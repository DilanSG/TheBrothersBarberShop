import { createContext, useContext, useState, useEffect } from 'react';
import { paymentMethodsApi } from '../services/api';
import { useAuth } from './AuthContext';
import { CreditCard } from 'lucide-react';

const PaymentMethodsNewContext = createContext();

/**
 * Proveedor del nuevo sistema centralizado de métodos de pago
 * Integra con la nueva API del backend para gestión completa
 */
export const PaymentMethodsNewProvider = ({ children }) => {
  const { user } = useAuth();
  
  // Estados
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastFetch, setLastFetch] = useState(null);

  // Función para cargar métodos de pago desde la API
  const fetchPaymentMethods = async (force = false) => {
    try {
      // Verificar caché (solo si no es forzado y ha pasado menos de 5 minutos)
      const now = Date.now();
      if (!force && lastFetch && (now - lastFetch) < 300000 && paymentMethods.length > 0) {
        console.log('💾 Usando métodos de pago en caché');
        return;
      }

      setLoading(true);
      setError(null);
      
      console.log('🔄 Obteniendo métodos de pago desde API...');
      const response = await paymentMethodsApi.getAll();
      
      if (response.success && response.data) {
        console.log(`✅ Métodos de pago obtenidos: ${response.data.length}`);
        setPaymentMethods(response.data);
        setLastFetch(now);
      } else {
        throw new Error('Respuesta inválida del servidor');
      }
    } catch (error) {
      console.error('❌ Error obteniendo métodos de pago:', error);
      setError(error.message);
      
      // Fallback a métodos por defecto si falla la API
      const fallbackMethods = [
        {
          backendId: 'cash',
          name: 'Efectivo',
          color: '#10b981',
          emoji: '💵',
          isSystem: true
        },
        {
          backendId: 'tarjeta',
          name: 'Tarjeta',
          color: '#3b82f6',
          emoji: '💳',
          isSystem: true
        }
      ];
      
      setPaymentMethods(fallbackMethods);
      console.log('🔄 Usando métodos de fallback debido al error');
    } finally {
      setLoading(false);
    }
  };

  // Cargar métodos al montar el componente
  useEffect(() => {
    if (user) {
      fetchPaymentMethods();
    }
  }, [user]);

  // Función para crear un método de pago
  const createPaymentMethod = async (methodData) => {
    try {
      console.log('🆕 Creando método de pago:', methodData);
      
      const response = await paymentMethodsApi.create({
        backendId: methodData.backendId,
        name: methodData.name,
        description: methodData.description || '',
        color: methodData.color || '#6b7280',
        emoji: methodData.emoji || '💳',
        category: methodData.category || 'digital'
      });
      
      if (response.success) {
        console.log('✅ Método de pago creado exitosamente');
        await fetchPaymentMethods(true); // Recargar lista
        return { success: true, data: response.data };
      }
      
      throw new Error(response.message || 'Error creando método de pago');
    } catch (error) {
      console.error('❌ Error creando método de pago:', error);
      throw error;
    }
  };

  // Función para actualizar un método de pago
  const updatePaymentMethod = async (backendId, updateData) => {
    try {
      console.log('✏️ Actualizando método de pago:', backendId, updateData);
      
      const response = await paymentMethodsApi.update(backendId, updateData);
      
      if (response.success) {
        console.log('✅ Método de pago actualizado exitosamente');
        await fetchPaymentMethods(true); // Recargar lista
        return { success: true, data: response.data };
      }
      
      throw new Error(response.message || 'Error actualizando método de pago');
    } catch (error) {
      console.error('❌ Error actualizando método de pago:', error);
      throw error;
    }
  };

  // Función para eliminar un método de pago
  const deletePaymentMethod = async (backendId, force = false) => {
    try {
      console.log(`🗑️ Eliminando método de pago: ${backendId} (force: ${force})`);
      
      const response = await paymentMethodsApi.delete(backendId, force);
      
      if (response.success) {
        console.log('✅ Método de pago eliminado exitosamente');
        await fetchPaymentMethods(true); // Recargar lista
        return { success: true, data: response.data };
      }
      
      throw new Error(response.message || 'Error eliminando método de pago');
    } catch (error) {
      console.error('❌ Error eliminando método de pago:', error);
      throw error;
    }
  };

  // Función para obtener método por backendId
  const getPaymentMethodByBackendId = (backendId) => {
    return paymentMethods.find(method => method.backendId === backendId);
  };

  // Función para obtener nombre de display
  const getPaymentMethodDisplayName = (backendId) => {
    const method = getPaymentMethodByBackendId(backendId);
    return method?.name || backendId || 'Desconocido';
  };

  // Función para obtener color
  const getPaymentMethodColor = (backendId) => {
    const method = getPaymentMethodByBackendId(backendId);
    return method?.color || '#6b7280';
  };

  // Función para obtener emoji
  const getPaymentMethodEmoji = (backendId) => {
    const method = getPaymentMethodByBackendId(backendId);
    return method?.emoji || '💳';
  };

  // Función para normalizar datos para componentes
  const getPaymentMethodsForSelect = () => {
    return paymentMethods.map(method => ({
      value: method.backendId,
      label: method.name,
      color: method.color,
      emoji: method.emoji,
      isSystem: method.isSystem
    }));
  };

  // Función para validar si un método existe
  const isValidPaymentMethod = (backendId) => {
    return paymentMethods.some(method => method.backendId === backendId);
  };

  // Funciones administrativas (solo para admin)
  const initializeSystemMethods = async () => {
    try {
      console.log('🚀 Inicializando métodos del sistema...');
      const response = await paymentMethodsApi.initialize();
      
      if (response.success) {
        console.log('✅ Métodos del sistema inicializados');
        await fetchPaymentMethods(true);
        return { success: true };
      }
      
      throw new Error(response.message || 'Error inicializando métodos');
    } catch (error) {
      console.error('❌ Error inicializando métodos del sistema:', error);
      throw error;
    }
  };

  const normalizeExistingMethods = async () => {
    try {
      console.log('🔄 Normalizando métodos existentes...');
      const response = await paymentMethodsApi.normalize();
      
      if (response.success) {
        console.log('✅ Métodos normalizados exitosamente');
        await fetchPaymentMethods(true);
        return { success: true, data: response.data };
      }
      
      throw new Error(response.message || 'Error normalizando métodos');
    } catch (error) {
      console.error('❌ Error normalizando métodos:', error);
      throw error;
    }
  };

  const value = {
    // Datos
    paymentMethods,
    loading,
    error,
    
    // Funciones principales
    fetchPaymentMethods,
    createPaymentMethod,
    updatePaymentMethod,
    deletePaymentMethod,
    
    // Utilidades
    getPaymentMethodByBackendId,
    getPaymentMethodDisplayName,
    getPaymentMethodColor,
    getPaymentMethodEmoji,
    getPaymentMethodsForSelect,
    isValidPaymentMethod,
    
    // Funciones administrativas
    initializeSystemMethods,
    normalizeExistingMethods,
    
    // Estado
    isReady: !loading && !error && paymentMethods.length > 0,
    isEmpty: !loading && paymentMethods.length === 0,
    hasError: !!error
  };

  return (
    <PaymentMethodsNewContext.Provider value={value}>
      {children}
    </PaymentMethodsNewContext.Provider>
  );
};

// Hook personalizado para usar el contexto
export const usePaymentMethodsNew = () => {
  const context = useContext(PaymentMethodsNewContext);
  if (!context) {
    throw new Error('usePaymentMethodsNew must be used within a PaymentMethodsNewProvider');
  }
  return context;
};

export default PaymentMethodsNewContext;