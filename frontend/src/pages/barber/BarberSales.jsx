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
  User
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import { PageContainer } from '../../components/layout/PageContainer';
import GradientText from '../../components/ui/GradientText';
import { inventoryService, salesService, serviceService } from '../../services/api';
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

  // Obtener barberId correctamente
  const getBarberId = () => {
    console.log('🔍 Datos del usuario:', user);
    console.log('🔍 Role:', user.role);
    console.log('🔍 user._id:', user._id);
    console.log('🔍 user.barberId:', user.barberId);
    
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
    // Si es admin, usar su ID (por ahora)
    console.log('👤 Usuario admin, usando user._id:', user._id);
    return user._id;
  };

  // Cargar datos iniciales
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
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
        stock: availableStock
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
      quantity: 1
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

  // Calcular total del carrito
  const cartTotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);

  // Procesar venta
  const processSale = async () => {
    if (cart.length === 0) {
      showError('El carrito está vacío');
      return;
    }

    setProcessingSale(true);

    try {
      // Separar productos y servicios
      const productSales = cart.filter(item => item.type === 'product');
      const walkInServices = cart.filter(item => item.type === 'walkIn');

      const salePromises = [];

      // Procesar venta de productos si hay
      if (productSales.length > 0) {
        const productSaleData = {
          barberId: getBarberId(),
          items: productSales.map(item => ({
            productId: item.id,
            quantity: item.quantity,
            price: item.price
          })),
          total: productSales.reduce((sum, item) => sum + (item.price * item.quantity), 0),
          type: 'product'
        };

        salePromises.push(salesService.createSale(productSaleData));
      }

      // Procesar servicios de corte si hay
      if (walkInServices.length > 0) {
        for (const service of walkInServices) {
          const walkInData = {
            barberId: getBarberId(),
            serviceId: service.serviceId,
            serviceName: service.name,
            price: service.price,
            total: service.price,
            type: 'walkIn'
          };

          salePromises.push(salesService.createWalkInSale(walkInData));
        }
      }

      await Promise.all(salePromises);

      // Obtener detalles de la venta para el mensaje
      const totalItems = cart.length;
      const productCount = cart.filter(item => item.type === 'product').length;
      const serviceCount = cart.filter(item => item.type === 'service').length;

      // Mensaje detallado de éxito
      let successMessage = `✅ Venta completada exitosamente\n`;
      successMessage += `💰 Total: $${cartTotal.toLocaleString()}\n`;
      successMessage += `📦 Items vendidos: ${totalItems}`;
      
      if (productCount > 0) {
        successMessage += `\n🛍️ Productos: ${productCount}`;
      }
      if (serviceCount > 0) {
        successMessage += `\n✂️ Servicios: ${serviceCount}`;
      }
      
      successMessage += `\n📊 Inventario actualizado automáticamente`;

      showSuccess(successMessage);
      
      // Mostrar estado de venta completada temporalmente
      setSaleCompleted(true);
      setTimeout(() => setSaleCompleted(false), 3000); // Ocultar después de 3 segundos
      
      // Limpiar carrito y formulario completamente
      setCart([]);
      setSelectedService(null);
      setServicePrice('');
      setSaleType('product');
      
      // Notificar que se hizo una venta para que otros componentes recarguen
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
      }, 1500); // Aumentar a 1.5 segundos para asegurar que el backend procese completamente

    } catch (error) {
      console.error('Error procesando venta:', error);
      showError('Error al procesar la venta');
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
              Barbero: {user.name || user.email}
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-500/5 backdrop-blur-sm border border-red-500/20 rounded-xl p-4 shadow-xl shadow-red-500/20">
            <div className="flex items-center">
              <X className="h-5 w-5 mr-2 text-red-400" />
              <span className="text-red-300">{error}</span>
            </div>
          </div>
        )}

        {/* Grid principal responsivo - Carrito + Contenido */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          {/* Carrito - Siempre visible - Arriba en móvil, lateral en desktop */}
          <div className="order-1 xl:order-1 space-y-4 sm:space-y-6 lg:space-y-8">
            <div className="group relative bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-3 sm:p-4 lg:p-6 shadow-xl shadow-blue-500/20 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[2.5%] to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out rounded-xl"></div>
              <div className="relative">
                <h3 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4 flex items-center">
                  <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-green-400" />
                  <span className="hidden sm:inline">Carrito </span>({cart.length})
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
                              <p className="text-gray-400 text-xs">
                                {formatPrice(item.price)} 
                                {item.type === 'product' && (
                                  <span className="hidden sm:inline"> • Stock: {item.stock}</span>
                                )}
                              </p>
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

          {/* Contenido principal - Tabs, búsquedas y productos/servicios */}
          <div className="order-2 xl:order-2 xl:col-span-2 space-y-4 sm:space-y-6 lg:space-y-8">
          {/* Selector de tipo de venta - Tabs flotantes */}
          <div className="flex justify-center">
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

            {/* Contenido según tipo de venta */}
            {saleType === 'product' ? (
              <>
                {/* Filtros de productos - Inputs flotantes responsivos */}
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

                {/* Grid de productos responsivo */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
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
    </PageContainer>
  );
};

export default BarberSales;
