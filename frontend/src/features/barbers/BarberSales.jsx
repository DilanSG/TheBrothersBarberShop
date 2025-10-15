import React, { useState, useEffect } from 'react';
import { 
  ShoppingCart, 
  Scissors, 
  Plus, 
  Minus, 
  DollarSign, 
  Package,
  Check,
  X,
  Search,
  Filter,
  User,
  Edit3,
  CreditCard,
  Banknote,
  Smartphone,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '@contexts/AuthContext';
import { useNotification } from '@contexts/NotificationContext';
import { PageContainer } from '@components/layout/PageContainer';
import GradientText from '@components/ui/GradientText';
import RefundSaleModal from '@components/common/RefundSaleModal';
import { inventoryService, salesService, serviceService, barberService } from '@services/api';
import { useInventoryRefresh } from '@contexts/InventoryContext';
import { usePaymentMethodsContext } from '@contexts/PaymentMethodsContext';
import { 
  SALE_TYPES, 
  SALE_TYPE_LABELS,
  PAYMENT_METHODS,
  PAYMENT_METHOD_LABELS 
} from '@shared/constants/salesConstants';

import logger from '@utils/logger';

// Función para obtener colores por método de pago - Estilo AdminBarbers
const getPaymentMethodColor = (methodId) => {
  const colors = {
    cash: { bg: 'bg-green-500/10', border: 'border-green-500/30', text: 'text-green-300', dot: 'bg-green-400' },
    efectivo: { bg: 'bg-green-500/10', border: 'border-green-500/30', text: 'text-green-300', dot: 'bg-green-400' }, // Alias para cash
    nequi: { bg: 'bg-pink-500/10', border: 'border-pink-500/30', text: 'text-pink-300', dot: 'bg-pink-400' },
    nu: { bg: 'bg-purple-500/10', border: 'border-purple-500/30', text: 'text-purple-300', dot: 'bg-purple-400' },
    daviplata: { bg: 'bg-red-500/10', border: 'border-red-500/30', text: 'text-red-300', dot: 'bg-red-400' },
    debit: { bg: 'bg-blue-500/10', border: 'border-blue-500/30', text: 'text-blue-300', dot: 'bg-blue-400' },
    bancolombia: { bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', text: 'text-yellow-300', dot: 'bg-yellow-400' },
    digital: { bg: 'bg-cyan-500/10', border: 'border-cyan-500/30', text: 'text-cyan-300', dot: 'bg-cyan-400' }
  };
  
  // Si no existe el método, usar colores por defecto basados en un hash simple del ID
  if (!colors[methodId]) {
    const defaultColors = [
      { bg: 'bg-indigo-500/10', border: 'border-indigo-500/30', text: 'text-indigo-300', dot: 'bg-indigo-400' },
      { bg: 'bg-orange-500/10', border: 'border-orange-500/30', text: 'text-orange-300', dot: 'bg-orange-400' },
      { bg: 'bg-teal-500/10', border: 'border-teal-500/30', text: 'text-teal-300', dot: 'bg-teal-400' },
      { bg: 'bg-rose-500/10', border: 'border-rose-500/30', text: 'text-rose-300', dot: 'bg-rose-400' },
      { bg: 'bg-violet-500/10', border: 'border-violet-500/30', text: 'text-violet-300', dot: 'bg-violet-400' }
    ];
    
    // Generar un índice basado en el hash del methodId
    const hash = methodId.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
    const colorIndex = hash % defaultColors.length;
    return defaultColors[colorIndex];
  }
  
  return colors[methodId];
};

/**
 * Página de ventas para barberos
 * Permite registrar ventas de productos y cortes
 */
const BarberSales = () => {
  const { user } = useAuth();
  const { showSuccess, showError, showInfo } = useNotification();
  const { notifySale } = useInventoryRefresh();

  // Estados principales
  const [products, setProducts] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingInventory, setLoadingInventory] = useState(true);
  const [error, setError] = useState('');

  // Estados del carrito
  const [cart, setCart] = useState([]);
  const [saleType, setSaleType] = useState(SALE_TYPES.PRODUCT); // Usar constante estandarizada
  const [selectedService, setSelectedService] = useState(null);
  const [servicePrice, setServicePrice] = useState('');

  // Estados de filtros y búsqueda
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [processingSale, setProcessingSale] = useState(false);
  const [saleCompleted, setSaleCompleted] = useState(false);

  // Hook para métodos de pago centralizados
  const { allPaymentMethods, getPaymentMethodByBackendId } = usePaymentMethodsContext();

  // Estados para métodos de pago
  const [paymentMethodModal, setPaymentMethodModal] = useState({ show: false, item: null });

  // Estados para selección de barbero (solo para admins)
  const [selectedBarberId, setSelectedBarberId] = useState(null);
  const [availableBarbers, setAvailableBarbers] = useState([]);
  const [loadingBarbers, setLoadingBarbers] = useState(false);

  // Estado para modal de reembolso
  const [refundModalOpen, setRefundModalOpen] = useState(false);

  // Obtener barberId correctamente
  const getBarberId = () => {
    logger.debug('🔍 Datos del usuario:', user);
    logger.debug('🔍 Role:', user.role);
    logger.debug('🔍 user._id:', user._id);
    logger.debug('🔍 user.barberId:', user.barberId);
    logger.debug('🔍 selectedBarberId:', selectedBarberId);
    
    // Si el usuario es admin, usar el barbero seleccionado
    if (user.role === 'admin') {
      if (selectedBarberId) {
        logger.debug('👤 Usuario admin usando barbero seleccionado:', selectedBarberId);
        return selectedBarberId;
      } else {
        logger.debug('⚠️ Usuario admin sin barbero seleccionado');
        return null;
      }
    }
    
    // Si el usuario es barbero, necesitamos obtener el ID del perfil de barbero
    if (user.role === 'barber') {
      // Primero intentar con barberId si existe
      if (user.barberId) {
        logger.debug('✅ Usando user.barberId:', user.barberId);
        return user.barberId;
      }
      // Si no, usar el _id del usuario (necesitaremos buscar el perfil de barbero)
      logger.debug('⚠️ No hay barberId, usando user._id:', user._id);
      return user._id;
    }
    
    logger.debug('❌ Tipo de usuario no reconocido');
    return null;
  };

  // Cargar datos iniciales
  useEffect(() => {
    loadInitialData();
    // Si el usuario es admin, cargar la lista de barberos
    if (user?.role === 'admin') {
      loadBarbers();
    }
  }, [user]);

  // Cargar lista de barberos disponibles (solo para admins)
  const loadBarbers = async () => {
    setLoadingBarbers(true);
    try {
      logger.debug('👥 Cargando lista de barberos...');
      const response = await barberService.getAllBarbers();
      logger.debug('👥 Respuesta de barberos:', response);
      
      if (response.success && response.data) {
        setAvailableBarbers(response.data);
        logger.debug('👥 Barberos disponibles:', response.data.length);
        
        // Seleccionar el primer barbero por defecto (con validación)
        if (response.data.length > 0 && !selectedBarberId) {
          const firstBarber = response.data[0];
          if (firstBarber && firstBarber.user?._id) {
            setSelectedBarberId(firstBarber.user._id);
            logger.debug('👥 Barbero seleccionado por defecto:', firstBarber.user._id, firstBarber.user.name);
          }
        }
        
        // Validar que el barbero actualmente seleccionado aún existe
        if (selectedBarberId) {
          const selectedBarberExists = response.data.some(barber => barber.user?._id === selectedBarberId);
          if (!selectedBarberExists) {
            logger.warn('⚠️ Barbero seleccionado no existe en la lista, seleccionando el primero disponible');
            if (response.data.length > 0 && response.data[0].user?._id) {
              setSelectedBarberId(response.data[0].user._id);
            } else {
              setSelectedBarberId(null);
            }
          }
        }
      }
    } catch (error) {
      console.error('❌ Error cargando barberos:', error);
      showError('Error al cargar la lista de barberos');
    } finally {
      setLoadingBarbers(false);
    }
  };

  const loadInitialData = async () => {
    setLoading(true);
    setLoadingInventory(true);
    setError('');
    
    try {
      logger.debug('🔄 Cargando datos iniciales...');
      
      // Añadir timestamp para evitar caché después de ventas
      const timestamp = Date.now();
      
      const [productsResp, servicesResp] = await Promise.all([
        inventoryService.getInventory({ _t: timestamp }),
        serviceService.getAllServices()
      ]);

      logger.debug('📦 Respuesta de inventario:', productsResp);

      // Procesar productos
      let productsData = [];
      if (productsResp?.success && productsResp?.data) {
        productsData = Array.isArray(productsResp.data) 
          ? productsResp.data 
          : [productsResp.data];
      } else if (Array.isArray(productsResp)) {
        productsData = productsResp;
      }

      logger.debug('📦 Productos procesados:', productsData.length);

      // Filtrar solo productos disponibles (stock > 0)
      const availableProducts = productsData.filter(product => {
        const stock = product.currentStock || product.stock || product.quantity || 0;
        logger.debug(`📦 ${product.name}: stock=${stock}`);
        return product && stock > 0;
      });

      logger.debug('📦 Productos disponibles:', availableProducts.length);

      // Procesar servicios
      let servicesData = [];
      if (servicesResp?.success && servicesResp?.data) {
        servicesData = Array.isArray(servicesResp.data) 
          ? servicesResp.data 
          : [servicesResp.data];
      } else if (Array.isArray(servicesResp)) {
        servicesData = servicesResp;
      }

      // Filtrar solo servicios activos
      const activeServices = servicesData.filter(service => 
        service && service.isActive !== false
      );

      setProducts(availableProducts);
      setServices(activeServices);
      
      logger.debug('✅ Datos cargados - Productos:', availableProducts.length, 'Servicios:', activeServices.length);

    } catch (error) {
      console.error('❌ Error cargando datos:', error);
      setError('Error al cargar los productos y servicios');
      showError('Error al cargar los datos iniciales');
    } finally {
      setLoading(false);
      setLoadingInventory(false);
    }
  };

  // Filtrar productos según búsqueda y categoría
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = categoryFilter === 'all' || 
                           product.category?.toLowerCase() === categoryFilter.toLowerCase();
    
    return matchesSearch && matchesCategory;
  });

  // Obtener categorías únicas
  const categories = [...new Set(products.map(p => p.category).filter(Boolean))];

  // Limpiar carrito solo cuando cambien los métodos de pago disponibles
  // Solo si realmente hay items con métodos de pago inválidos
  useEffect(() => {
    if (allPaymentMethods.length > 0 && cart.length > 0) {
      // Usar los IDs del frontend, no los backendId
      const validPaymentMethods = allPaymentMethods.map(method => method.id);
      
      // Solo limpiar si hay items con paymentMethod pero que no esté en la lista válida
      const itemsWithInvalidPaymentMethods = cart.filter(item => {
        return item.paymentMethod && !validPaymentMethods.includes(item.paymentMethod);
      });
      
      if (itemsWithInvalidPaymentMethods.length > 0) {
        console.log('🧹 Limpiando items con métodos de pago inválidos:', itemsWithInvalidPaymentMethods);
        const validItems = cart.filter(item => {
          return item.type && 
                 item.quantity && typeof item.quantity === 'number' && item.quantity > 0 &&
                 item.price && typeof item.price === 'number' && item.price > 0 &&
                 (!item.paymentMethod || validPaymentMethods.includes(item.paymentMethod));
        });
        
        setCart(validItems);
      }
    }
  }, [allPaymentMethods]); // Solo dependemos de allPaymentMethods, no de cart

  // Agregar producto al carrito
  const addToCart = (product, quantity = 1) => {
    // Validaciones básicas del producto
    if (!product || !product._id) {
      showError('Producto inválido');
      return;
    }
    
    if (!product.name || product.name.trim() === '') {
      showError('El producto debe tener un nombre');
      return;
    }
    
    if (!product.price || typeof product.price !== 'number' || product.price <= 0) {
      showError(`Precio inválido para ${product.name}`);
      return;
    }
    
    if (!quantity || typeof quantity !== 'number' || quantity <= 0) {
      showError('La cantidad debe ser mayor a 0');
      return;
    }

    const existingItem = cart.find(item => item.id === product._id && item.type === SALE_TYPES.PRODUCT);
    
    if (existingItem) {
      // Verificar stock disponible
      const newQuantity = existingItem.quantity + quantity;
      const availableStock = product.quantity || product.stock || 0;
      
      if (newQuantity > availableStock) {
        showError(`Solo hay ${availableStock} unidades disponibles de ${product.name}`);
        return;
      }
      
      setCart(cart.map(item => 
        item.id === product._id && item.type === SALE_TYPES.PRODUCT
          ? { ...item, quantity: newQuantity }
          : item
      ));
    } else {
      // Verificar stock antes de agregar
      const availableStock = product.quantity || product.stock || 0;
      if (quantity > availableStock) {
        showError(`Solo hay ${availableStock} unidades disponibles de ${product.name}`);
        return;
      }
      
      setCart([...cart, {
        id: product._id,
        type: SALE_TYPES.PRODUCT,
        name: product.name.trim(),
        price: Number(product.price), // Asegurar que sea número
        quantity: Number(quantity), // Asegurar que sea número
        stock: availableStock,
        paymentMethod: 'efectivo' // El backend espera 'efectivo', no 'cash'
      }]);
    }
    
    showInfo(`${product.name} agregado al carrito`);
  };

  // Agregar servicio de corte al carrito
  const addWalkInService = () => {
    // Validar servicio seleccionado
    if (!selectedService) {
      showError('Selecciona un servicio');
      return;
    }
    
    if (!selectedService._id || !selectedService.name) {
      showError('Servicio inválido');
      return;
    }
    
    // Convertir servicePrice a string si es necesario
    const servicePriceStr = String(servicePrice || '');
    
    if (!servicePriceStr || servicePriceStr.trim() === '') {
      showError('Establece el precio del servicio');
      return;
    }

    const price = parseFloat(servicePriceStr.trim());
    if (isNaN(price) || price <= 0) {
      showError('Ingresa un precio válido mayor a 0');
      return;
    }

    // Validar que el nombre del servicio no esté vacío
    if (!selectedService.name.trim()) {
      showError('El servicio debe tener un nombre válido');
      return;
    }

    setCart([...cart, {
      id: `walkin-${Date.now()}`,
      type: SALE_TYPES.SERVICE, // Usar constante estandarizada
      name: selectedService.name.trim(),
      serviceId: selectedService._id,
      price: Number(price), // Asegurar que sea número
      quantity: 1,
      paymentMethod: 'efectivo' // El backend espera 'efectivo', no 'cash'
    }]);

    setSelectedService(null);
    setServicePrice('');
    showInfo(`Servicio ${selectedService.name} agregado`);
  };

  // Remover item del carrito
  const removeFromCart = (itemId, itemType) => {
    setCart(cart.filter(item => !(item.id === itemId && item.type === itemType)));
  };

  // Actualizar cantidad en carrito
  const updateCartQuantity = (itemId, itemType, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(itemId, itemType);
      return;
    }

    setCart(cart.map(item => {
      if (item.id === itemId && item.type === itemType) {
        // Verificar stock para productos
        if (item.type === SALE_TYPES.PRODUCT && newQuantity > item.stock) {
          showError(`Solo hay ${item.stock} unidades disponibles`);
          return item;
        }
        return { ...item, quantity: newQuantity };
      }
      return item;
    }));
  };

  // Obtener cantidad de un producto en el carrito
  const getCartQuantity = (itemId, itemType) => {
    const cartItem = cart.find(item => item.id === itemId && item.type === itemType);
    return cartItem ? cartItem.quantity : 0;
  };

  // Funciones para métodos de pago
  const openPaymentMethodModal = (item) => {
    setPaymentMethodModal({ show: true, item });
  };

  const closePaymentMethodModal = () => {
    setPaymentMethodModal({ show: false, item: null });
  };

  const updatePaymentMethod = (paymentMethodId) => {
    const { item } = paymentMethodModal;
    setCart(cart.map(cartItem => 
      cartItem.id === item.id && cartItem.type === item.type
        ? { ...cartItem, paymentMethod: paymentMethodId }
        : cartItem
    ));
    closePaymentMethodModal();
    showInfo('Método de pago actualizado');
  };

  // Calcular totales por método de pago
  const getPaymentMethodSummary = () => {
    const summary = {};
    cart.forEach(item => {
      const method = item.paymentMethod || 'cash';
      const total = item.price * item.quantity;
      summary[method] = (summary[method] || 0) + total;
    });
    return summary;
  };

  // Obtener información del método de pago
  const getPaymentMethodInfo = (methodId) => {
    const method = getPaymentMethodByBackendId(methodId);
    // Si no se encuentra el método, devolver un fallback
    if (!method) {
      return {
        backendId: methodId,
        name: methodId,
        icon: CreditCard, // Icono por defecto
        color: 'gray'
      };
    }
    return method;
  };

  // Calcular total del carrito
  const cartTotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);

  // Procesar venta
  const processSale = async () => {
    if (cart.length === 0) {
      showError('El carrito está vacío');
      return;
    }

    // Validar que se haya seleccionado un barbero (especialmente para admins)
    const barberId = getBarberId();
    if (!barberId) {
      if (user.role === 'admin') {
        showError('Selecciona un barbero para realizar la venta');
      } else {
        showError('Error: No se pudo determinar el barbero');
      }
      return;
    }

    setProcessingSale(true);

    try {
      // Validar carrito antes de enviar
      if (cart.length === 0) {
        showError('El carrito está vacío');
        return;
      }

      // Validar que todos los items tienen los campos requeridos
      const validPaymentMethods = ['efectivo', 'tarjeta', 'transferencia']; // Métodos que acepta el backend
      const invalidItems = cart.filter(item => 
        !item.type || 
        !item.quantity || 
        typeof item.quantity !== 'number' || 
        item.quantity <= 0 ||
        !item.price || 
        typeof item.price !== 'number' || 
        item.price <= 0 ||
        !item.paymentMethod ||
        !validPaymentMethods.includes(item.paymentMethod)
      );

      if (invalidItems.length > 0) {
        console.error('❌ Items inválidos en el carrito:', invalidItems);
        
        // Log detallado para debugging
        invalidItems.forEach(item => {
          console.error('Item inválido:', {
            name: item.name,
            type: item.type,
            price: item.price,
            quantity: item.quantity,
            paymentMethod: item.paymentMethod,
            hasPaymentMethod: !!item.paymentMethod,
            validPaymentMethods: validPaymentMethods
          });
        });
        
        const errorDetails = invalidItems.map(item => {
          const errors = [];
          if (!item.type) errors.push('tipo faltante');
          if (!item.quantity || typeof item.quantity !== 'number' || item.quantity <= 0) errors.push('cantidad inválida');
          if (!item.price || typeof item.price !== 'number' || item.price <= 0) errors.push('precio inválido');
          if (!item.paymentMethod) errors.push('método de pago faltante');
          else if (!validPaymentMethods.includes(item.paymentMethod)) errors.push(`método de pago inválido: "${item.paymentMethod}"`);
          return `${item.name || 'Item sin nombre'}: ${errors.join(', ')}`;
        }).join('\n');
        
        // Limpiar items inválidos del carrito automáticamente
        const validItems = cart.filter(item => {
          return item.type && 
                 item.quantity && typeof item.quantity === 'number' && item.quantity > 0 &&
                 item.price && typeof item.price === 'number' && item.price > 0 &&
                 item.paymentMethod && validPaymentMethods.includes(item.paymentMethod);
        });
        
        setCart(validItems);
        showError(`Se encontraron items inválidos que fueron removidos del carrito:\n${errorDetails}`);
        return;
      }

      // Enviar todo el carrito con métodos de pago a la nueva API
      const cartSaleData = {
        cart: cart.map(item => {
          // Asegurar que todos los campos requeridos estén presentes
          const cartItem = {
            id: item.id,
            type: item.type, // Usar constantes estandarizadas: SALE_TYPES.PRODUCT o SALE_TYPES.SERVICE
            name: item.name,
            price: Number(item.price), // Asegurar que sea número
            quantity: Number(item.quantity), // Asegurar que sea número
            paymentMethod: item.paymentMethod || 'efectivo' // Backend espera 'efectivo', no 'cash'
          };

          // Agregar serviceId solo para servicios
          if (item.type === SALE_TYPES.SERVICE && item.serviceId) {
            cartItem.serviceId = item.serviceId;
          }

          return cartItem;
        }),
        barberId: barberId,
        notes: `Venta desde carrito - ${cart.length} items`
      };

      logger.debug('🛒 Enviando datos del carrito:', cartSaleData);

      const result = await salesService.createCartSale(cartSaleData);

      // Mensaje detallado de éxito
      const paymentSummary = getPaymentMethodSummary();
      let successMessage = `✅ Venta completada exitosamente\n`;
      successMessage += `💰 Total: ${formatPrice(cartTotal)}\n`;
      successMessage += `📦 Items vendidos: ${cart.length}\n`;
      
      // Mostrar resumen por método de pago
      Object.entries(paymentSummary).forEach(([methodId, total]) => {
        if (total > 0) {
          const methodInfo = getPaymentMethodInfo(methodId);
          successMessage += `💳 ${methodInfo.name}: ${formatPrice(total)}\n`;
        }
      });

      showSuccess(successMessage);

      // Limpiar carrito
      setCart([]);
      setSaleCompleted(true);

      // Reiniciar estado después de 3 segundos
      setTimeout(() => {
        setSaleCompleted(false);
      }, 3000);

      // Notificar cambios de inventario para actualizar la lista
      notifySale();

      // Recargar productos para mostrar stock actualizado
      logger.debug('🔄 Recargando inventario para mostrar stock actualizado...');
      setTimeout(async () => {
        try {
          logger.debug('🔄 Iniciando recarga de inventario después de venta...');
          await loadInitialData();
          logger.debug('✅ Inventario recargado exitosamente después de venta');
        } catch (error) {
          console.error('❌ Error recargando inventario:', error);
        }
      }, 1500);

    } catch (error) {
      console.error('Error procesando venta:', error);
      showError(error.response?.data?.message || 'Error al procesar la venta');
    } finally {
      setProcessingSale(false);
    }
  };

  // Formatear precio
  const formatPrice = (price) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price || 0);
  };

  if (loading) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-4"></div>
            <p className="text-gray-400">Cargando productos y servicios...</p>
          </div>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-6 space-y-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-r from-green-600/20 to-blue-600/20 rounded-xl border border-green-500/20 shadow-xl shadow-blue-500/20">
              <ShoppingCart className="w-6 h-6 sm:w-8 sm:h-8 text-green-400" />
            </div>
            <GradientText className="text-xl sm:text-2xl lg:text-3xl font-bold">
              Punto de Venta
            </GradientText>
          </div>
          <p className="text-gray-400 text-sm sm:text-base lg:text-lg mb-4">
            Registra ventas de productos y cortes
          </p>
          
          {/* Botón de reembolso/gestión de ventas */}
          <div className="flex justify-center mb-4">
            <button
              onClick={() => setRefundModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-red-600/20 border border-red-500/30 rounded-xl text-red-400 hover:bg-red-600/30 hover:text-red-300 transition-colors shadow-lg shadow-red-500/20"
            >
              <RefreshCw className="w-4 h-4" />
              <span className="text-sm font-medium">
                {user?.role === 'admin' ? 'Gestionar Ventas' : 'Reembolsar Venta'}
              </span>
            </button>
          </div>

          {user && (
            <div className="inline-flex items-center px-4 py-2 bg-blue-500/10 backdrop-blur-sm border border-blue-500/20 text-blue-300 rounded-xl text-sm shadow-lg shadow-blue-500/20">
              <User className="w-4 h-4 mr-2" />
              {user.role === 'admin' ? 'Administrador' : 'Barbero'}: {user.name || user.email}
            </div>
          )}
        </div>

        {/* Selector de barbero (solo para admins) */}
        {user?.role === 'admin' && (
          <div className="max-w-md mx-auto mb-6">
            <div className="bg-white/5 border border-white/10 rounded-xl backdrop-blur-sm shadow-lg p-4">
              <label className="block text-sm font-medium text-gray-300 mb-3">
                <User className="w-4 h-4 inline mr-2" />
                Seleccionar Barbero para la Venta
              </label>
              {loadingBarbers ? (
                <div className="flex items-center justify-center py-3">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
                  <span className="ml-2 text-sm text-gray-400">Cargando barberos...</span>
                </div>
              ) : (
                <select
                  value={selectedBarberId || ''}
                  onChange={(e) => setSelectedBarberId(e.target.value)}
                  className="glassmorphism-select w-full"
                  required
                >
                  <option value="">Selecciona un barbero</option>
                  {availableBarbers.map((barber) => (
                    <option key={barber._id} value={barber.user?._id || barber._id}>
                      {barber.user?.name || barber.specialty} - {barber.specialty}
                    </option>
                  ))}
                </select>
              )}
              {!selectedBarberId && availableBarbers.length > 0 && (
                <p className="text-xs text-yellow-400 mt-2">
                  ⚠️ Debes seleccionar un barbero antes de procesar ventas
                </p>
              )}
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-500/5 backdrop-blur-sm border border-red-500/20 rounded-xl p-4 shadow-xl shadow-red-500/20">
            <div className="flex items-center">
              <X className="h-5 w-5 mr-2 text-red-400" />
              <span className="text-red-300">{error}</span>
            </div>
          </div>
        )}

        {/* Selector de tipo de venta - Tabs centrales */}
        <div className="flex justify-center mb-6">
          <div className="bg-white/5 border border-white/10 rounded-xl backdrop-blur-sm shadow-lg p-1 flex gap-1 w-fit">
            <button
              onClick={() => setSaleType(SALE_TYPES.PRODUCT)}
              className={`group relative px-3 py-2.5 rounded-xl border cursor-pointer transition-all duration-300 hover:scale-105 overflow-hidden backdrop-blur-sm flex items-center justify-center gap-1.5 ${
                saleType === SALE_TYPES.PRODUCT 
                  ? 'border-blue-500/50 bg-blue-500/10 shadow-xl shadow-blue-500/20' 
                  : 'border-white/20 bg-white/5 hover:border-white/40 hover:bg-white/10'
              }`}
            >
              <Package size={14} className={`transition-all duration-300 ${
                saleType === SALE_TYPES.PRODUCT ? 'text-blue-300' : 'text-white'
              }`} />
              <span className={`font-medium text-xs whitespace-nowrap ${
                saleType === SALE_TYPES.PRODUCT ? 'text-blue-300' : 'text-white'
              }`}>Productos</span>
            </button>
            <button
              onClick={() => setSaleType(SALE_TYPES.SERVICE)}
              className={`group relative px-3 py-2.5 rounded-xl border cursor-pointer transition-all duration-300 hover:scale-105 overflow-hidden backdrop-blur-sm flex items-center justify-center gap-1.5 ${
                saleType === SALE_TYPES.SERVICE 
                  ? 'border-green-500/50 bg-green-500/10 shadow-xl shadow-green-500/20' 
                  : 'border-white/20 bg-white/5 hover:border-white/40 hover:bg-white/10'
              }`}
            >
              <Scissors size={14} className={`transition-all duration-300 ${
                saleType === SALE_TYPES.SERVICE ? 'text-green-300' : 'text-white'
              }`} />
              <span className={`font-medium text-xs whitespace-nowrap ${
                saleType === SALE_TYPES.SERVICE ? 'text-green-300' : 'text-white'
              }`}>Servicios de Corte</span>
            </button>
          </div>
        </div>

        {/* Layout principal: Carrito arriba en móvil, lado a lado en desktop */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 min-h-screen">
          {/* Carrito - Primero en móvil, último en desktop */}
          <div className="order-1 lg:order-2 lg:col-span-1">
            <div className="group relative bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-3 sm:p-4 lg:p-6 shadow-xl shadow-blue-500/20 overflow-hidden lg:sticky lg:top-4">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[2.5%] to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out rounded-xl"></div>
              <div className="relative">
                <h3 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4 flex items-center">
                  <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-green-400" />
                  <span>Carrito </span>({cart.length})
                </h3>

                {cart.length === 0 ? (
                  <div className="text-center py-4 sm:py-8">
                    <ShoppingCart className="w-8 h-8 sm:w-12 sm:h-12 text-gray-600 mx-auto mb-2 sm:mb-3" />
                    <p className="text-gray-400 text-sm sm:text-base">El carrito está vacío</p>
                  </div>
                ) : (
                  <>
                    {/* Lista de productos con scroll limitado */}
                    <div 
                      className="space-y-2 custom-scrollbar"
                      style={{ 
                        maxHeight: 'calc(2.7 * 84px)', // Reducido de 4 a 2.7 cards (1/3 menos)
                        overflowY: cart.length > 2 ? 'auto' : 'visible'
                      }}
                    >
                      {cart.map((item, index) => (
                        <div
                          key={`${item.id}-${item.type}-${index}`}
                          className="group relative backdrop-blur-sm border rounded-lg p-3 transition-all duration-300 overflow-hidden hover:scale-[1.005] hover:-translate-y-0.5 cursor-default border-blue-500/30 bg-blue-500/5 shadow-sm shadow-blue-500/20"
                          style={{ zIndex: cart.length - index }}
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[2.5%] to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out rounded-lg"></div>
                          <div className="relative">
                            {/* Header compacto con nombre y método de pago */}
                            <div className="flex items-center justify-between gap-2 mb-2">
                              <h4 className="text-white text-sm font-medium leading-tight flex-1 truncate">
                                {item.name}
                              </h4>
                              
                              {/* Método de pago compacto */}
                              <div className="flex items-center gap-1 flex-shrink-0">
                                {(() => {
                                  const methodInfo = getPaymentMethodInfo(item.paymentMethod);
                                  
                                  // Validar que el icono sea un componente React válido
                                  let IconComponent = CreditCard; // Default
                                  if (methodInfo?.icon && typeof methodInfo.icon === 'function') {
                                    IconComponent = methodInfo.icon;
                                  }
                                  
                                  // Obtener colores específicos para este método
                                  const colors = getPaymentMethodColor(item.paymentMethod);
                                  
                                  return (
                                    <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs border ${colors.bg} ${colors.border}`}>
                                      <IconComponent size={12} className={colors.text} />
                                      <span className={`${colors.text} whitespace-nowrap hidden sm:inline`}>{methodInfo?.name || item.paymentMethod}</span>
                                    </div>
                                  );
                                })()}
                                <button
                                  onClick={() => openPaymentMethodModal(item)}
                                  className="p-1 text-gray-400 hover:text-blue-300 transition-colors duration-300 rounded hover:bg-white/5 touch-manipulation"
                                  title="Cambiar método de pago"
                                >
                                  <Edit3 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>

                            {/* Información compacta en una sola línea */}
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <p className="text-blue-300 text-sm font-semibold">
                                  {formatPrice(item.price)}
                                </p>
                                {item.type === SALE_TYPES.PRODUCT && (
                                  <p className="text-gray-400 text-xs">
                                    Stock: {item.stock}
                                  </p>
                                )}
                              </div>
                              
                              {/* Controles compactos */}
                              <div className="flex items-center gap-2">
                                {item.type === SALE_TYPES.PRODUCT ? (
                                  <div className="flex items-center gap-1 bg-white/5 rounded px-2 py-1">
                                    <button
                                      onClick={() => updateCartQuantity(item.id, item.type, item.quantity - 1)}
                                      className="p-1 text-gray-300 hover:text-white transition-colors duration-300 rounded hover:bg-white/10 touch-manipulation"
                                    >
                                      <Minus className="w-3 h-3" />
                                    </button>
                                    <span className="text-white text-sm font-medium min-w-[1.5rem] text-center">
                                      {item.quantity}
                                    </span>
                                    <button
                                      onClick={() => updateCartQuantity(item.id, item.type, item.quantity + 1)}
                                      disabled={item.quantity >= item.stock}
                                      className="p-1 text-gray-300 hover:text-white transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed rounded hover:bg-white/10 touch-manipulation"
                                    >
                                      <Plus className="w-3 h-3" />
                                    </button>
                                  </div>
                                ) : (
                                  <div className="bg-white/5 rounded px-3 py-1">
                                    <span className="text-white text-sm font-medium">1</span>
                                  </div>
                                )}
                                <button
                                  onClick={() => removeFromCart(item.id, item.type)}
                                  className="p-1 text-red-400 hover:text-red-300 transition-colors duration-300 rounded hover:bg-red-500/10 touch-manipulation"
                                  title="Eliminar del carrito"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Resumen por métodos de pago - Siempre visible */}
                    <div className="border-t border-blue-500/20 pt-3 sm:pt-4 mt-3 sm:mt-4">
                      <p className="text-sm font-medium text-white mb-2">Desglose por método de pago:</p>
                      <div className="space-y-1">
                        {Object.entries(getPaymentMethodSummary()).map(([methodId, total]) => {
                          const methodInfo = getPaymentMethodInfo(methodId);
                          
                          // Validar que el icono sea un componente React válido
                          let IconComponent = CreditCard; // Default
                          if (methodInfo?.icon && typeof methodInfo.icon === 'function') {
                            IconComponent = methodInfo.icon;
                          }
                          
                          // Obtener colores específicos para este método
                          const colors = getPaymentMethodColor(methodId);
                          
                          return (
                            <div key={methodId} className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <IconComponent size={14} className={colors.text} />
                                <span className={`text-sm ${colors.text}`}>{methodInfo?.name || methodId}:</span>
                              </div>
                              <span className="text-sm font-medium text-white">
                                {formatPrice(total)}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Total - Siempre visible */}
                    <div className="border-t border-blue-500/20 pt-3 sm:pt-4 mt-3 sm:mt-4">
                      <div className="flex justify-between items-center">
                        <span className="text-base sm:text-lg font-semibold text-white">Total:</span>
                        <span className="text-base sm:text-lg font-bold text-green-400">
                          {formatPrice(cartTotal)}
                        </span>
                      </div>
                    </div>

                    {/* Botón procesar venta - Siempre visible */}
                    <button
                      onClick={processSale}
                      disabled={processingSale || cart.length === 0 || saleCompleted}
                      className={`w-full mt-3 sm:mt-4 py-2.5 sm:py-3 rounded-xl transition-all duration-300 flex items-center justify-center font-semibold shadow-xl text-sm sm:text-base ${
                        saleCompleted 
                          ? 'bg-green-500/10 border border-green-500/30 text-green-300 shadow-green-500/20' 
                          : processingSale 
                          ? 'bg-blue-500/10 border border-blue-500/30 text-blue-300 shadow-blue-500/20' 
                          : cart.length === 0 
                          ? 'bg-gray-600/10 border border-gray-600/30 cursor-not-allowed text-gray-400'
                          : 'bg-gradient-to-r from-green-600/20 to-blue-600/20 border border-green-500/30 hover:border-blue-500/40 text-white hover:bg-gradient-to-r hover:from-green-600/30 hover:to-blue-600/30 transform hover:scale-105 shadow-blue-500/20'
                      }`}
                    >
                      {saleCompleted ? (
                        <>
                          <Check className="w-4 h-4 mr-2" />
                          ¡Venta Completada!
                        </>
                      ) : processingSale ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Procesando Venta...
                        </>
                      ) : (
                        <>
                          <DollarSign className="w-4 h-4 mr-2" />
                          Procesar Venta
                        </>
                      )}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Contenido principal - Segundo en móvil, primero en desktop */}
          <div className="order-2 lg:order-1 lg:col-span-2 space-y-4 sm:space-y-6 lg:space-y-8">
            {/* Contenido según tipo de venta */}
            {saleType === SALE_TYPES.PRODUCT ? (
              <>
                {/* Filtros de productos */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 lg:gap-6">
                  {/* Búsqueda */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
                    <input
                      type="text"
                      placeholder="Buscar productos..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="glassmorphism-input pl-10 sm:pl-12"
                    />
                  </div>

                  {/* Filtro por categoría */}
                  <div className="relative">
                    <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5 z-10" />
                    <select
                      value={categoryFilter}
                      onChange={(e) => setCategoryFilter(e.target.value)}
                      className="glassmorphism-select pl-10 sm:pl-12"
                    >
                      <option value="all">Todas las categorías</option>
                      {categories.map(category => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Grid de productos que fluye alrededor del carrito */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
                  {filteredProducts.length === 0 ? (
                    <div className="col-span-full text-center py-6 sm:py-8">
                      <Package className="w-8 h-8 sm:w-12 sm:h-12 text-gray-600 mx-auto mb-2 sm:mb-3" />
                      <p className="text-gray-400 text-xs sm:text-sm lg:text-base">
                        {searchTerm || categoryFilter !== 'all' 
                          ? 'No se encontraron productos con los filtros aplicados' 
                          : 'No hay productos disponibles'}
                      </p>
                    </div>
                  ) : (
                    filteredProducts.map((product) => (
                      <div
                        key={product._id}
                        className="group relative backdrop-blur-sm border rounded-lg p-3 sm:p-4 transition-all duration-300 overflow-hidden hover:scale-[1.002] hover:-translate-y-0.5 cursor-pointer ml-1 mr-1 border-blue-500/30 bg-blue-500/5 shadow-sm shadow-blue-500/20"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[2.5%] to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out rounded-lg"></div>
                        <div className="relative space-y-2 sm:space-y-3">
                          <div>
                            <h3 className="font-semibold text-white text-xs sm:text-sm lg:text-base">{product.name}</h3>
                            {product.description && (
                              <p className="text-gray-400 text-xs mt-1 line-clamp-2">{product.description}</p>
                            )}
                            {product.category && (
                              <span className="inline-block mt-1 sm:mt-2 px-2 py-1 bg-blue-500/20 text-blue-300 text-xs rounded-full border border-blue-500/30">
                                {product.category}
                              </span>
                            )}
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-green-400 font-bold text-xs sm:text-sm lg:text-base">{formatPrice(product.price)}</p>
                              <p className="text-gray-500 text-xs">Stock: {product.quantity || product.stock || 0}</p>
                            </div>
                            <button
                              onClick={() => addToCart(product)}
                              disabled={(product.quantity || product.stock || 0) === 0}
                              className="group relative p-1.5 sm:p-2 bg-gradient-to-r from-blue-600/20 to-green-600/20 rounded-lg border border-blue-500/30 hover:border-green-500/40 transition-all duration-300 backdrop-blur-sm hover:bg-gradient-to-r hover:from-blue-600/30 hover:to-green-600/30 transform hover:scale-110 shadow-xl shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                            >
                              <Plus className="w-3 h-3 sm:w-4 sm:h-4 text-blue-400 group-hover:text-green-400 transition-colors duration-300" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Grid de productos que fluye alrededor del carrito */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
                  {loadingInventory ? (
                    Array.from({ length: 6 }).map((_, index) => (
                      <div key={index} className="group relative backdrop-blur-sm border border-white/10 rounded-lg p-3 sm:p-4 transition-all duration-300 overflow-hidden">
                        <div className="animate-pulse">
                          <div className="h-4 bg-gray-700 rounded mb-2"></div>
                          <div className="h-3 bg-gray-700 rounded mb-3"></div>
                          <div className="h-8 bg-gray-700 rounded"></div>
                        </div>
                      </div>
                    ))
                  ) : (
                    filteredProducts.map((product) => (
                      <div
                        key={product._id}
                        className="group relative backdrop-blur-sm border border-white/20 rounded-lg p-3 sm:p-4 transition-all duration-300 overflow-hidden hover:scale-105 bg-white/5 hover:border-white/40 hover:bg-white/10"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[2.5%] to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out rounded-lg"></div>
                        <div className="relative">
                          <div className="flex items-center justify-between mb-2 sm:mb-3">
                            <h4 className="text-sm sm:text-base font-semibold text-white truncate flex-1">
                              {product.name}
                            </h4>
                            <div className={`px-1.5 sm:px-2 py-1 rounded text-xs ${
                              product.stock > 10 
                                ? 'bg-green-500/20 text-green-300' 
                                : product.stock > 0 
                                ? 'bg-yellow-500/20 text-yellow-300' 
                                : 'bg-red-500/20 text-red-300'
                            }`}>
                              {product.stock}
                            </div>
                          </div>
                          
                          <div className="space-y-1 sm:space-y-2 mb-3 sm:mb-4">
                            <p className="text-xs sm:text-sm text-gray-400">
                              {product.category}
                            </p>
                            <p className="text-sm sm:text-base font-semibold text-green-400">
                              {formatPrice(product.price)}
                            </p>
                          </div>

                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => updateCartQuantity(product._id, SALE_TYPES.PRODUCT, getCartQuantity(product._id, SALE_TYPES.PRODUCT) - 1)}
                              disabled={getCartQuantity(product._id, SALE_TYPES.PRODUCT) === 0}
                              className="group relative p-1.5 sm:p-2 bg-gradient-to-r from-red-600/20 to-blue-600/20 rounded-lg border border-red-500/30 hover:border-blue-500/40 transition-all duration-300 backdrop-blur-sm hover:bg-gradient-to-r hover:from-red-600/30 hover:to-blue-600/30 transform hover:scale-110 shadow-xl shadow-blue-500/20 disabled:opacity-50 disabled:hover:scale-100"
                            >
                              <Minus className="w-3 h-3 sm:w-4 sm:h-4 text-red-400 group-hover:text-blue-400 transition-colors duration-300" />
                            </button>
                            
                            <span className="min-w-[2rem] sm:min-w-[2.5rem] text-center text-sm sm:text-base text-white font-semibold">
                              {getCartQuantity(product._id, SALE_TYPES.PRODUCT)}
                            </span>
                            
                            <button
                              onClick={() => addToCart(product)}
                              disabled={product.stock <= getCartQuantity(product._id, SALE_TYPES.PRODUCT)}
                              className="group relative p-1.5 sm:p-2 bg-gradient-to-r from-blue-600/20 to-green-600/20 rounded-lg border border-blue-500/30 hover:border-green-500/40 transition-all duration-300 backdrop-blur-sm hover:bg-gradient-to-r hover:from-blue-600/30 hover:to-green-600/30 transform hover:scale-110 shadow-xl shadow-blue-500/20 disabled:opacity-50 disabled:hover:scale-100"
                            >
                              <Plus className="w-3 h-3 sm:w-4 sm:h-4 text-blue-400 group-hover:text-green-400 transition-colors duration-300" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </>
            ) : (
              /* Panel de servicios de corte - Inputs flotantes responsivo */
              <div className="space-y-4 sm:space-y-6">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                    <div className="p-2 sm:p-3 bg-gradient-to-r from-green-600/20 to-blue-600/20 rounded-xl border border-green-500/20 shadow-xl shadow-blue-500/20">
                      <Scissors className="w-4 h-4 sm:w-5 sm:h-5 text-green-400" />
                    </div>
                    <h3 className="text-base sm:text-lg font-semibold text-white">Agregar Servicio de Corte</h3>
                  </div>
                </div>
                
                <div className="space-y-4">
                  {/* Selector de servicio */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Servicio
                    </label>
                    <select
                      value={selectedService?._id || ''}
                      onChange={(e) => {
                        const service = services.find(s => s._id === e.target.value);
                        setSelectedService(service);
                        setServicePrice(service?.price ? String(service.price) : '');
                      }}
                      className="glassmorphism-select"
                    >
                      <option value="">Selecciona un servicio</option>
                      {services.map(service => (
                        <option key={service._id} value={service._id}>
                          {service.name} - {formatPrice(service.price)}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Precio personalizado */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Precio (puedes ajustarlo)
                    </label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        type="number"
                        value={servicePrice}
                        onChange={(e) => setServicePrice(e.target.value)}
                        placeholder="0"
                        min="0"
                        step="1000"
                        className="glassmorphism-input pl-10"
                      />
                    </div>
                  </div>

                  {/* Botón agregar responsivo */}
                  <button
                    onClick={addWalkInService}
                    disabled={!selectedService || !servicePrice}
                    className="w-full py-2.5 sm:py-3 bg-gradient-to-r from-green-600/20 to-blue-600/20 border border-green-500/30 hover:border-blue-500/40 rounded-xl text-white transition-all duration-300 backdrop-blur-sm hover:bg-gradient-to-r hover:from-green-600/30 hover:to-blue-600/30 transform hover:scale-105 shadow-xl shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center font-medium text-sm sm:text-base"
                  >
                    <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                    Agregar al Carrito
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal para editar método de pago */}
      {paymentMethodModal.show && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 sm:p-6">
          <div className="relative w-full max-w-md mx-auto max-h-[90vh] flex flex-col">
            <div className="relative bg-blue-500/5 backdrop-blur-md border border-blue-500/20 rounded-2xl shadow-2xl shadow-blue-500/20 flex flex-col overflow-hidden">
              {/* Header fijo */}
              <div className="flex-shrink-0 p-4 sm:p-6 border-b border-blue-500/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-xl border border-blue-500/20">
                      <CreditCard className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">Método de pago</h3>
                      <p className="text-sm text-gray-300">{paymentMethodModal.item?.name}</p>
                    </div>
                  </div>
                  <button
                    onClick={closePaymentMethodModal}
                    className="p-1 text-gray-400 hover:text-white transition-colors duration-300"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Contenido con scroll */}
              <div className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-6">
                <div className="space-y-3">
                  {allPaymentMethods && allPaymentMethods.length > 0 ? allPaymentMethods.map((method) => {
                    if (!method) return null;
                    
                    // Validar que el icono sea un componente React válido
                    let IconComponent = CreditCard; // Default
                    if (method?.icon && typeof method.icon === 'function') {
                      IconComponent = method.icon;
                    } else if (method?.icon && typeof method.icon === 'object') {
                      IconComponent = CreditCard;
                    }
                    
                    const isSelected = paymentMethodModal.item?.paymentMethod === method.backendId;
                    
                    // Obtener colores específicos para este método
                    const colors = getPaymentMethodColor(method.backendId);
                    
                    return (
                      <button
                        key={method.backendId || method.id}
                        onClick={() => updatePaymentMethod(method.backendId)}
                        className={`w-full p-3 sm:p-4 rounded-xl border transition-all duration-300 flex items-center gap-3 hover:scale-105 ${colors.bg} ${colors.border} ${
                          isSelected
                            ? 'shadow-lg ring-2 ring-white/20'
                            : 'hover:shadow-md'
                        }`}
                      >
                        <IconComponent className={`w-5 h-5 ${colors.text}`} />
                        <span className={`font-medium ${colors.text}`}>
                          {method?.name || method?.backendId}
                        </span>
                        {isSelected && (
                          <Check className="w-4 h-4 text-white ml-auto" />
                        )}
                      </button>
                    );
                  }) : (
                    <div className="text-center text-gray-400 py-4">
                      No hay métodos de pago disponibles
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Reembolso */}
      <RefundSaleModal
        isOpen={refundModalOpen}
        onClose={() => {
          setRefundModalOpen(false);
          // Recargar inventario después de cerrar el modal (en caso de reembolso)
          loadInitialData();
        }}
        selectedBarberId={user?.role === 'admin' ? selectedBarberId : null}
      />
    </PageContainer>
  );
};

export default BarberSales;

