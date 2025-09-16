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
  Smartphone
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import { PageContainer } from '../../components/layout/PageContainer';
import GradientText from '../../components/ui/GradientText';
import { inventoryService, salesService, serviceService, barberService } from '../../services/api';
import { useInventoryRefresh } from '../../contexts/InventoryContext';

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
  const [saleType, setSaleType] = useState('product'); // 'product' | 'walkIn'
  const [selectedService, setSelectedService] = useState(null);
  const [servicePrice, setServicePrice] = useState('');

  // Estados de filtros y búsqueda
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [processingSale, setProcessingSale] = useState(false);
  const [saleCompleted, setSaleCompleted] = useState(false);

  // Estados para métodos de pago
  const [paymentMethodModal, setPaymentMethodModal] = useState({ show: false, item: null });

  // Estados para selección de barbero (solo para admins)
  const [selectedBarberId, setSelectedBarberId] = useState(null);
  const [availableBarbers, setAvailableBarbers] = useState([]);
  const [loadingBarbers, setLoadingBarbers] = useState(false);

  // Configuración de métodos de pago
  const paymentMethods = [
    { id: 'efectivo', name: 'Efectivo', icon: Banknote, color: 'green' },
    { id: 'nequi', name: 'Nequi', icon: Smartphone, color: 'purple' },
    { id: 'nu', name: 'Nu', icon: CreditCard, color: 'violet' },
    { id: 'daviplata', name: 'Daviplata', icon: Smartphone, color: 'red' },
    { id: 'tarjeta', name: 'Tarjeta', icon: CreditCard, color: 'blue' },
    { id: 'transferencia', name: 'Otra Transferencia', icon: CreditCard, color: 'gray' }
  ];

  // Obtener barberId correctamente
  const getBarberId = () => {
    console.log('🔍 Datos del usuario:', user);
    console.log('🔍 Role:', user.role);
    console.log('🔍 user._id:', user._id);
    console.log('🔍 user.barberId:', user.barberId);
    console.log('🔍 selectedBarberId:', selectedBarberId);
    
    // Si el usuario es admin, usar el barbero seleccionado
    if (user.role === 'admin') {
      if (selectedBarberId) {
        console.log('👤 Usuario admin usando barbero seleccionado:', selectedBarberId);
        return selectedBarberId;
      } else {
        console.log('⚠️ Usuario admin sin barbero seleccionado');
        return null;
      }
    }
    
    // Si el usuario es barbero, necesitamos obtener el ID del perfil de barbero
    if (user.role === 'barber') {
      // Primero intentar con barberId si existe
      if (user.barberId) {
        console.log('✅ Usando user.barberId:', user.barberId);
        return user.barberId;
      }
      // Si no, usar el _id del usuario (necesitaremos buscar el perfil de barbero)
      console.log('⚠️ No hay barberId, usando user._id:', user._id);
      return user._id;
    }
    
    console.log('❌ Tipo de usuario no reconocido');
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
      console.log('👥 Cargando lista de barberos...');
      const response = await barberService.getAllBarbers();
      console.log('👥 Respuesta de barberos:', response);
      
      if (response.success && response.data) {
        setAvailableBarbers(response.data);
        console.log('👥 Barberos disponibles:', response.data.length);
        
        // Seleccionar el primer barbero por defecto
        if (response.data.length > 0 && !selectedBarberId) {
          setSelectedBarberId(response.data[0]._id);
          console.log('👥 Barbero seleccionado por defecto:', response.data[0]._id);
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
      console.log('🔄 Cargando datos iniciales...');
      
      // Añadir timestamp para evitar caché después de ventas
      const timestamp = Date.now();
      
      const [productsResp, servicesResp] = await Promise.all([
        inventoryService.getInventory({ _t: timestamp }),
        serviceService.getAllServices()
      ]);

      console.log('📦 Respuesta de inventario:', productsResp);

      // Procesar productos
      let productsData = [];
      if (productsResp?.success && productsResp?.data) {
        productsData = Array.isArray(productsResp.data) 
          ? productsResp.data 
          : [productsResp.data];
      } else if (Array.isArray(productsResp)) {
        productsData = productsResp;
      }

      console.log('📦 Productos procesados:', productsData.length);

      // Filtrar solo productos disponibles (stock > 0)
      const availableProducts = productsData.filter(product => {
        const stock = product.currentStock || product.stock || product.quantity || 0;
        console.log(`📦 ${product.name}: stock=${stock}`);
        return product && stock > 0;
      });

      console.log('📦 Productos disponibles:', availableProducts.length);

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
      
      console.log('✅ Datos cargados - Productos:', availableProducts.length, 'Servicios:', activeServices.length);

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

  // Agregar producto al carrito
  const addToCart = (product, quantity = 1) => {
    const existingItem = cart.find(item => item.id === product._id && item.type === 'product');
    
    if (existingItem) {
      // Verificar stock disponible
      const newQuantity = existingItem.quantity + quantity;
      const availableStock = product.quantity || product.stock || 0;
      
      if (newQuantity > availableStock) {
        showError(`Solo hay ${availableStock} unidades disponibles`);
        return;
      }
      
      setCart(cart.map(item => 
        item.id === product._id && item.type === 'product'
          ? { ...item, quantity: newQuantity }
          : item
      ));
    } else {
      // Verificar stock antes de agregar
      const availableStock = product.quantity || product.stock || 0;
      if (quantity > availableStock) {
        showError(`Solo hay ${availableStock} unidades disponibles`);
        return;
      }
      
      setCart([...cart, {
        id: product._id,
        type: 'product',
        name: product.name,
        price: product.price,
        quantity: quantity,
        stock: availableStock,
        paymentMethod: 'efectivo' // Método de pago por defecto
      }]);
    }
    
    showInfo(`${product.name} agregado al carrito`);
  };

  // Agregar servicio de corte al carrito
  const addWalkInService = () => {
    if (!selectedService || !servicePrice) {
      showError('Selecciona un servicio y establece el precio');
      return;
    }

    const price = parseFloat(servicePrice);
    if (isNaN(price) || price <= 0) {
      showError('Ingresa un precio válido');
      return;
    }

    setCart([...cart, {
      id: `walkin-${Date.now()}`,
      type: 'walkIn',
      name: selectedService.name,
      serviceId: selectedService._id,
      price: price,
      quantity: 1,
      paymentMethod: 'efectivo' // Método de pago por defecto
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
        if (item.type === 'product' && newQuantity > item.stock) {
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
      const method = item.paymentMethod || 'efectivo';
      const total = item.price * item.quantity;
      summary[method] = (summary[method] || 0) + total;
    });
    return summary;
  };

  // Obtener información del método de pago
  const getPaymentMethodInfo = (methodId) => {
    return paymentMethods.find(method => method.id === methodId) || paymentMethods[0];
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
      // Enviar todo el carrito con métodos de pago a la nueva API
      const cartSaleData = {
        cart: cart.map(item => ({
          id: item.id,
          type: item.type,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          paymentMethod: item.paymentMethod || 'efectivo',
          serviceId: item.serviceId // Para servicios walk-in
        })),
        barberId: barberId,
        notes: `Venta desde carrito - ${cart.length} items`
      };

      console.log('🛒 Enviando datos del carrito:', cartSaleData);

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
      console.log('🔄 Recargando inventario para mostrar stock actualizado...');
      setTimeout(async () => {
        try {
          console.log('🔄 Iniciando recarga de inventario después de venta...');
          await loadInitialData();
          console.log('✅ Inventario recargado exitosamente después de venta');
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
                    <option key={barber._id} value={barber._id}>
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
              onClick={() => setSaleType('product')}
              className={`group relative px-3 py-2.5 rounded-xl border cursor-pointer transition-all duration-300 hover:scale-105 overflow-hidden backdrop-blur-sm flex items-center justify-center gap-1.5 ${
                saleType === 'product' 
                  ? 'border-blue-500/50 bg-blue-500/10 shadow-xl shadow-blue-500/20' 
                  : 'border-white/20 bg-white/5 hover:border-white/40 hover:bg-white/10'
              }`}
            >
              <Package size={14} className={`transition-all duration-300 ${
                saleType === 'product' ? 'text-blue-300' : 'text-white'
              }`} />
              <span className={`font-medium text-xs whitespace-nowrap ${
                saleType === 'product' ? 'text-blue-300' : 'text-white'
              }`}>Productos</span>
            </button>
            <button
              onClick={() => setSaleType('walkIn')}
              className={`group relative px-3 py-2.5 rounded-xl border cursor-pointer transition-all duration-300 hover:scale-105 overflow-hidden backdrop-blur-sm flex items-center justify-center gap-1.5 ${
                saleType === 'walkIn' 
                  ? 'border-green-500/50 bg-green-500/10 shadow-xl shadow-green-500/20' 
                  : 'border-white/20 bg-white/5 hover:border-white/40 hover:bg-white/10'
              }`}
            >
              <Scissors size={14} className={`transition-all duration-300 ${
                saleType === 'walkIn' ? 'text-green-300' : 'text-white'
              }`} />
              <span className={`font-medium text-xs whitespace-nowrap ${
                saleType === 'walkIn' ? 'text-green-300' : 'text-white'
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
                  <div className="space-y-2 sm:space-y-3">
                    {cart.map((item, index) => (
                      <div
                        key={`${item.id}-${item.type}-${index}`}
                        className="group relative backdrop-blur-sm border rounded-lg p-2 sm:p-3 transition-all duration-300 overflow-hidden hover:scale-[1.002] hover:-translate-y-0.5 cursor-pointer ml-1 mr-1 border-blue-500/30 bg-blue-500/5 shadow-sm shadow-blue-500/20"
                        style={{ zIndex: cart.length - index }}
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[2.5%] to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out rounded-lg"></div>
                        <div className="relative">
                          <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                              <p className="text-white text-xs sm:text-sm font-medium truncate">
                                {item.name}
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                <p className="text-gray-400 text-xs">
                                  {formatPrice(item.price)} 
                                  {item.type === 'product' && (
                                    <span className="hidden sm:inline"> • Stock: {item.stock}</span>
                                  )}
                                </p>
                                {/* Método de pago actual */}
                                <div className="flex items-center gap-1">
                                  {(() => {
                                    const methodInfo = getPaymentMethodInfo(item.paymentMethod);
                                    const IconComponent = methodInfo.icon;
                                    return (
                                      <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border ${
                                        methodInfo.color === 'green' ? 'bg-green-500/10 border-green-500/30 text-green-300' :
                                        methodInfo.color === 'purple' ? 'bg-purple-500/10 border-purple-500/30 text-purple-300' :
                                        methodInfo.color === 'violet' ? 'bg-violet-500/10 border-violet-500/30 text-violet-300' :
                                        methodInfo.color === 'red' ? 'bg-red-500/10 border-red-500/30 text-red-300' :
                                        methodInfo.color === 'blue' ? 'bg-blue-500/10 border-blue-500/30 text-blue-300' :
                                        'bg-gray-500/10 border-gray-500/30 text-gray-300'
                                      }`}>
                                        <IconComponent size={10} />
                                        <span className="hidden sm:inline">{methodInfo.name}</span>
                                      </div>
                                    );
                                  })()}
                                  <button
                                    onClick={() => openPaymentMethodModal(item)}
                                    className="p-1 text-gray-400 hover:text-blue-300 transition-colors duration-300"
                                    title="Cambiar método de pago"
                                  >
                                    <Edit3 className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex items-center space-x-1 sm:space-x-2 ml-2 sm:ml-3">
                              {item.type === 'product' ? (
                                <>
                                  <button
                                    onClick={() => updateCartQuantity(item.id, item.type, item.quantity - 1)}
                                    className="p-1 text-gray-400 hover:text-white transition-colors duration-300"
                                  >
                                    <Minus className="w-3 h-3" />
                                  </button>
                                  <span className="text-white text-xs sm:text-sm w-6 sm:w-8 text-center">
                                    {item.quantity}
                                  </span>
                                  <button
                                    onClick={() => updateCartQuantity(item.id, item.type, item.quantity + 1)}
                                    disabled={item.quantity >= item.stock}
                                    className="p-1 text-gray-400 hover:text-white transition-colors duration-300 disabled:opacity-50"
                                  >
                                    <Plus className="w-3 h-3" />
                                  </button>
                                </>
                              ) : (
                                <span className="text-white text-sm">1</span>
                              )}
                              <button
                                onClick={() => removeFromCart(item.id, item.type)}
                                className="p-1 text-red-400 hover:text-red-300 transition-colors duration-300"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}

                    {/* Resumen por métodos de pago */}
                    {cart.length > 0 && (
                      <div className="border-t border-blue-500/20 pt-3 sm:pt-4 mt-3 sm:mt-4">
                        <p className="text-sm font-medium text-white mb-2">Desglose por método de pago:</p>
                        <div className="space-y-1">
                          {Object.entries(getPaymentMethodSummary()).map(([methodId, total]) => {
                            const methodInfo = getPaymentMethodInfo(methodId);
                            const IconComponent = methodInfo.icon;
                            return (
                              <div key={methodId} className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <IconComponent size={14} className={`${
                                    methodInfo.color === 'green' ? 'text-green-400' :
                                    methodInfo.color === 'purple' ? 'text-purple-400' :
                                    methodInfo.color === 'violet' ? 'text-violet-400' :
                                    methodInfo.color === 'red' ? 'text-red-400' :
                                    methodInfo.color === 'blue' ? 'text-blue-400' :
                                    'text-gray-400'
                                  }`} />
                                  <span className="text-sm text-gray-300">{methodInfo.name}:</span>
                                </div>
                                <span className="text-sm font-medium text-white">
                                  {formatPrice(total)}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Total responsivo */}
                    <div className="border-t border-blue-500/20 pt-3 sm:pt-4 mt-3 sm:mt-4">
                      <div className="flex justify-between items-center">
                        <span className="text-base sm:text-lg font-semibold text-white">Total:</span>
                        <span className="text-base sm:text-lg font-bold text-green-400">
                          {formatPrice(cartTotal)}
                        </span>
                      </div>
                    </div>

                    {/* Botón procesar venta responsivo */}
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
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Contenido principal - Segundo en móvil, primero en desktop */}
          <div className="order-2 lg:order-1 lg:col-span-2 space-y-4 sm:space-y-6 lg:space-y-8">
            {/* Contenido según tipo de venta */}
            {saleType === 'product' ? (
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
                              onClick={() => updateCartQuantity(product._id, 'product', getCartQuantity(product._id, 'product') - 1)}
                              disabled={getCartQuantity(product._id, 'product') === 0}
                              className="group relative p-1.5 sm:p-2 bg-gradient-to-r from-red-600/20 to-blue-600/20 rounded-lg border border-red-500/30 hover:border-blue-500/40 transition-all duration-300 backdrop-blur-sm hover:bg-gradient-to-r hover:from-red-600/30 hover:to-blue-600/30 transform hover:scale-110 shadow-xl shadow-blue-500/20 disabled:opacity-50 disabled:hover:scale-100"
                            >
                              <Minus className="w-3 h-3 sm:w-4 sm:h-4 text-red-400 group-hover:text-blue-400 transition-colors duration-300" />
                            </button>
                            
                            <span className="min-w-[2rem] sm:min-w-[2.5rem] text-center text-sm sm:text-base text-white font-semibold">
                              {getCartQuantity(product._id, 'product')}
                            </span>
                            
                            <button
                              onClick={() => addToCart(product)}
                              disabled={product.stock <= getCartQuantity(product._id, 'product')}
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
                        setServicePrice(service?.price || '');
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
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="relative w-full max-w-md mx-auto">
            <div className="relative bg-blue-500/5 backdrop-blur-md border border-blue-500/20 rounded-2xl p-6 shadow-2xl shadow-blue-500/20">
              <div className="relative z-10">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
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

                {/* Opciones de método de pago */}
                <div className="space-y-3">
                  {paymentMethods.map((method) => {
                    const IconComponent = method.icon;
                    const isSelected = paymentMethodModal.item?.paymentMethod === method.id;
                    
                    return (
                      <button
                        key={method.id}
                        onClick={() => updatePaymentMethod(method.id)}
                        className={`w-full p-3 rounded-xl border transition-all duration-300 flex items-center gap-3 ${
                          isSelected
                            ? `${
                                method.color === 'green' ? 'bg-green-500/10 border-green-500/30 shadow-green-500/20' :
                                method.color === 'purple' ? 'bg-purple-500/10 border-purple-500/30 shadow-purple-500/20' :
                                method.color === 'violet' ? 'bg-violet-500/10 border-violet-500/30 shadow-violet-500/20' :
                                method.color === 'red' ? 'bg-red-500/10 border-red-500/30 shadow-red-500/20' :
                                method.color === 'blue' ? 'bg-blue-500/10 border-blue-500/30 shadow-blue-500/20' :
                                'bg-gray-500/10 border-gray-500/30 shadow-gray-500/20'
                              } shadow-lg`
                            : 'bg-white/5 border-white/10 hover:border-white/30 hover:bg-white/10'
                        }`}
                      >
                        <IconComponent className={`w-5 h-5 ${
                          isSelected
                            ? method.color === 'green' ? 'text-green-300' :
                              method.color === 'purple' ? 'text-purple-300' :
                              method.color === 'violet' ? 'text-violet-300' :
                              method.color === 'red' ? 'text-red-300' :
                              method.color === 'blue' ? 'text-blue-300' :
                              'text-gray-300'
                            : 'text-gray-400'
                        }`} />
                        <span className={`font-medium ${
                          isSelected ? 'text-white' : 'text-gray-300'
                        }`}>
                          {method.name}
                        </span>
                        {isSelected && (
                          <Check className="w-4 h-4 text-green-400 ml-auto" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  );
};

export default BarberSales;
