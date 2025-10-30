import { createContext, useContext, useState, useEffect } from 'react';
import { CreditCard } from 'lucide-react';
import { PAYMENT_METHODS } from '../config/paymentMethods';

const PaymentMethodsContext = createContext();

export const PaymentMethodsProvider = ({ children }) => {
  // Estado para métodos de pago dinámicos (agregados por el usuario)
  const [dynamicPaymentMethods, setDynamicPaymentMethods] = useState([]);
  // Estado para métodos estáticos ocultos (eliminados por el usuario)
  const [hiddenStaticMethods, setHiddenStaticMethods] = useState([]);

  // Cargar métodos dinámicos y ocultos desde localStorage al inicializar
  useEffect(() => {
    // Cargar métodos dinámicos
    const savedMethods = localStorage.getItem('dynamicPaymentMethods');
    if (savedMethods) {
      try {
        const parsed = JSON.parse(savedMethods);
        // Restaurar iconos perdidos en la serialización
        const methodsWithIcons = parsed.map(method => ({
          ...method,
          icon: CreditCard // Restaurar icono por defecto
        }));
        setDynamicPaymentMethods(methodsWithIcons);
      } catch (error) {
        console.error('❌ Error al cargar métodos dinámicos:', error);
        setDynamicPaymentMethods([]); // Asegurar que se inicialice como array vacío
      }
    } else {
      // Si no hay datos guardados, inicializar como array vacío
      setDynamicPaymentMethods([]);
    }

    // Cargar métodos estáticos ocultos
    const hiddenMethods = localStorage.getItem('hiddenStaticMethods');
    if (hiddenMethods) {
      try {
        const parsed = JSON.parse(hiddenMethods);
        setHiddenStaticMethods(parsed);
      } catch (error) {
        console.error('❌ Error al cargar métodos ocultos:', error);
      }
    }
  }, []);

  // Guardar métodos dinámicos en localStorage cuando cambien
  useEffect(() => {
    // Siempre guardar, incluso si la lista está vacía
    const methodsToSave = dynamicPaymentMethods.map(({ icon, ...method }) => method);
    localStorage.setItem('dynamicPaymentMethods', JSON.stringify(methodsToSave));
  }, [dynamicPaymentMethods]);

  // Guardar métodos ocultos en localStorage cuando cambien
  useEffect(() => {
    if (hiddenStaticMethods.length >= 0) {
      localStorage.setItem('hiddenStaticMethods', JSON.stringify(hiddenStaticMethods));
    }
  }, [hiddenStaticMethods]);

  // Combinar métodos estáticos (excluyendo ocultos) con dinámicos
  const visibleStaticMethods = PAYMENT_METHODS.filter(method => 
    !hiddenStaticMethods.includes(method.backendId)
  );
  const allPaymentMethods = [...visibleStaticMethods, ...dynamicPaymentMethods];

  // Función para agregar un nuevo método de pago
  const addPaymentMethod = (newMethod) => {
    console.log('🆕 Agregando método de pago al contexto global:', newMethod);
    // Asegurar que tiene un icono válido
    const methodWithIcon = {
      ...newMethod,
      icon: CreditCard // Forzar icono válido
    };
    setDynamicPaymentMethods(prev => [...prev, methodWithIcon]);
  };

  // Función para actualizar un método de pago existente
  const updatePaymentMethod = (originalBackendId, updatedMethod) => {
    console.log('✏️ Actualizando método de pago en contexto global:', { originalBackendId, updatedMethod });
    
    // Verificar si es un método estático (no se puede editar)
    const isStaticMethod = PAYMENT_METHODS.some(m => m.backendId === originalBackendId);
    if (isStaticMethod) {
      console.warn('⚠️ No se pueden editar métodos de pago estáticos');
      return false;
    }

    // Actualizar en métodos dinámicos
    setDynamicPaymentMethods(prev => 
      prev.map(method => 
        method.backendId === originalBackendId ? updatedMethod : method
      )
    );
    return true;
  };

  // Función para eliminar un método de pago
  const removePaymentMethod = (backendId) => {
    console.log('🗑️ Eliminando método de pago del contexto global:', backendId);
    
    // Solo proteger el efectivo como método esencial
    if (backendId === 'cash') {
      console.warn('⚠️ No se puede eliminar el efectivo - método de pago esencial');
      return false;
    }

    // Verificar si es un método estático
    const isStaticMethod = PAYMENT_METHODS.some(m => m.backendId === backendId);
    
    if (isStaticMethod) {
      // Para métodos estáticos, agregarlos a la lista de ocultos
      console.log('🙈 Ocultando método de pago estático:', backendId);
      const updatedHidden = hiddenStaticMethods.includes(backendId) 
        ? hiddenStaticMethods 
        : [...hiddenStaticMethods, backendId];
      setHiddenStaticMethods(updatedHidden);
      
      // Guardar inmediatamente en localStorage
      localStorage.setItem('hiddenStaticMethods', JSON.stringify(updatedHidden));
      console.log('🙈 Lista de ocultos actualizada inmediatamente:', updatedHidden);
    } else {
      // Para métodos dinámicos, eliminar completamente
      console.log('🗑️ Eliminando método de pago dinámico:', backendId);
      const updatedMethods = dynamicPaymentMethods.filter(method => method.backendId !== backendId);
      setDynamicPaymentMethods(updatedMethods);
      
      // Guardar inmediatamente en localStorage
      const methodsToSave = updatedMethods.map(({ icon, ...method }) => method);
      localStorage.setItem('dynamicPaymentMethods', JSON.stringify(methodsToSave));
      console.log('💾 Lista actualizada guardada inmediatamente:', methodsToSave);
    }
    
    console.log('✅ Método eliminado/ocultado exitosamente:', backendId);
    return true;
  };

  // Función para obtener un método de pago por backendId
  const getPaymentMethodByBackendId = (backendId) => {
    return allPaymentMethods.find(method => method.backendId === backendId);
  };

  // Función para restaurar un método estático oculto
  const restorePaymentMethod = (backendId) => {
    console.log('♻️ Restaurando método de pago estático:', backendId);
    setHiddenStaticMethods(prev => prev.filter(id => id !== backendId));
    console.log('✅ Método restaurado exitosamente:', backendId);
    return true;
  };

  // Función para limpiar todos los métodos dinámicos (para testing)
  const clearDynamicMethods = () => {
    setDynamicPaymentMethods([]);
    localStorage.removeItem('dynamicPaymentMethods');
    console.log('🧹 Métodos de pago dinámicos limpiados');
  };

  // Función para restaurar todos los métodos estáticos ocultos
  const restoreAllHiddenMethods = () => {
    setHiddenStaticMethods([]);
    localStorage.removeItem('hiddenStaticMethods');
    console.log('♻️ Todos los métodos estáticos restaurados');
  };

  // Función para depuración - limpiar todo el localStorage de métodos de pago
  const clearAllPaymentMethodsData = () => {
    setDynamicPaymentMethods([]);
    setHiddenStaticMethods([]);
    localStorage.removeItem('dynamicPaymentMethods');
    localStorage.removeItem('hiddenStaticMethods');
    console.log('🧹 Todos los datos de métodos de pago limpiados (dinámicos y ocultos)');
  };

  const value = {
    // Datos
    staticPaymentMethods: PAYMENT_METHODS,
    dynamicPaymentMethods,
    allPaymentMethods,
    hiddenStaticMethods,
    
    // Funciones
    addPaymentMethod,
    updatePaymentMethod,
    removePaymentMethod,
    restorePaymentMethod,
    getPaymentMethodByBackendId,
    clearDynamicMethods,
    restoreAllHiddenMethods,
    clearAllPaymentMethodsData,
    
    // Utilidades
    isStaticMethod: (backendId) => PAYMENT_METHODS.some(m => m.backendId === backendId),
    isDynamicMethod: (backendId) => dynamicPaymentMethods.some(m => m.backendId === backendId),
    isHiddenMethod: (backendId) => hiddenStaticMethods.includes(backendId)
  };

  return (
    <PaymentMethodsContext.Provider value={value}>
      {children}
    </PaymentMethodsContext.Provider>
  );
};

// Hook personalizado para usar el contexto
export const usePaymentMethodsContext = () => {
  const context = useContext(PaymentMethodsContext);
  if (!context) {
    throw new Error('usePaymentMethodsContext must be used within a PaymentMethodsProvider');
  }
  return context;
};

export default PaymentMethodsContext;