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
 * Permite registrar ventas de productos y servicios walk-in
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

  // Agregar servicio walk-in al carrito
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

      // Procesar servicios walk-in si hay
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
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-500/20 to-blue-500/20 rounded-2xl mb-4">
            <ShoppingCart className="w-8 h-8 text-green-400" />
          </div>
          <h1 className="text-3xl font-bold mb-2">
            <GradientText>Punto de Venta</GradientText>
          </h1>
          <p className="text-gray-400 text-lg">
            Registra ventas de productos y servicios walk-in
          </p>
          {user && (
            <div className="mt-3 inline-flex items-center px-4 py-2 bg-blue-500/20 text-blue-300 rounded-full text-sm">
              <User className="w-4 h-4 mr-2" />
              Barbero: {user.name || user.email}
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-4 text-red-300">
            <div className="flex items-center">
              <X className="h-5 w-5 mr-2" />
              {error}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Panel de productos y servicios */}
          <div className="lg:col-span-2 space-y-6">
            {/* Selector de tipo de venta */}
            <div className="bg-gray-900/50 rounded-xl p-4 border border-gray-700/50">
              <div className="flex space-x-4">
                <button
                  onClick={() => setSaleType('product')}
                  className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
                    saleType === 'product' 
                      ? 'bg-blue-500/80 text-white' 
                      : 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50'
                  }`}
                >
                  <Package className="w-4 h-4 mr-2" />
                  Productos
                </button>
                <button
                  onClick={() => setSaleType('walkIn')}
                  className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
                    saleType === 'walkIn' 
                      ? 'bg-blue-500/80 text-white' 
                      : 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50'
                  }`}
                >
                  <Scissors className="w-4 h-4 mr-2" />
                  Servicios Walk-in
                </button>
              </div>
            </div>

            {/* Contenido según tipo de venta */}
            {saleType === 'product' ? (
              <>
                {/* Filtros de productos */}
                <div className="bg-gray-900/50 rounded-xl p-4 border border-gray-700/50">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Búsqueda */}
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        type="text"
                        placeholder="Buscar productos..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    {/* Filtro por categoría */}
                    <div className="relative">
                      <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <select
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
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
                </div>

                {/* Grid de productos */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {filteredProducts.length === 0 ? (
                    <div className="col-span-full text-center py-8">
                      <Package className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                      <p className="text-gray-400">
                        {searchTerm || categoryFilter !== 'all' 
                          ? 'No se encontraron productos con los filtros aplicados' 
                          : 'No hay productos disponibles'}
                      </p>
                    </div>
                  ) : (
                    filteredProducts.map((product) => (
                      <div
                        key={product._id}
                        className="bg-gray-900/50 rounded-xl p-4 border border-gray-700/50 hover:border-blue-500/50 transition-colors"
                      >
                        <div className="space-y-3">
                          <div>
                            <h3 className="font-semibold text-white text-sm">{product.name}</h3>
                            {product.description && (
                              <p className="text-gray-400 text-xs mt-1">{product.description}</p>
                            )}
                            {product.category && (
                              <span className="inline-block mt-2 px-2 py-1 bg-blue-500/20 text-blue-300 text-xs rounded-full">
                                {product.category}
                              </span>
                            )}
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-green-400 font-bold">{formatPrice(product.price)}</p>
                              <p className="text-gray-500 text-xs">Stock: {product.quantity || product.stock || 0}</p>
                            </div>
                            <button
                              onClick={() => addToCart(product)}
                              disabled={(product.quantity || product.stock || 0) === 0}
                              className="p-2 bg-blue-500/80 hover:bg-blue-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </>
            ) : (
              /* Panel de servicios walk-in */
              <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-700/50">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                  <Scissors className="w-5 h-5 mr-2 text-green-400" />
                  Agregar Servicio Walk-in
                </h3>
                
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
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                        className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  {/* Botón agregar */}
                  <button
                    onClick={addWalkInService}
                    disabled={!selectedService || !servicePrice}
                    className="w-full py-2 bg-green-500/80 hover:bg-green-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center justify-center"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Agregar al Carrito
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Panel del carrito */}
          <div className="space-y-6">
            {/* Carrito */}
            <div className="bg-gray-900/50 rounded-xl p-4 border border-gray-700/50">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                <ShoppingCart className="w-5 h-5 mr-2 text-green-400" />
                Carrito ({cart.length})
              </h3>

              {cart.length === 0 ? (
                <div className="text-center py-8">
                  <ShoppingCart className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-400">El carrito está vacío</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {cart.map((item, index) => (
                    <div
                      key={`${item.id}-${item.type}-${index}`}
                      className="bg-gray-800/50 rounded-lg p-3 border border-gray-600/50"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-sm font-medium truncate">
                            {item.name}
                          </p>
                          <p className="text-gray-400 text-xs">
                            {formatPrice(item.price)} 
                            {item.type === 'product' && ` • Stock: ${item.stock}`}
                          </p>
                        </div>
                        
                        <div className="flex items-center space-x-2 ml-3">
                          {item.type === 'product' ? (
                            <>
                              <button
                                onClick={() => updateCartQuantity(item.id, item.type, item.quantity - 1)}
                                className="p-1 text-gray-400 hover:text-white"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="text-white text-sm w-8 text-center">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() => updateCartQuantity(item.id, item.type, item.quantity + 1)}
                                className="p-1 text-gray-400 hover:text-white"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </>
                          ) : (
                            <span className="text-white text-sm">x1</span>
                          )}
                          
                          <button
                            onClick={() => removeFromCart(item.id, item.type)}
                            className="p-1 text-red-400 hover:text-red-300 ml-2"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-xs text-gray-500">
                          {item.type === 'product' ? 'Producto' : 'Servicio Walk-in'}
                        </span>
                        <span className="text-green-400 font-semibold text-sm">
                          {formatPrice(item.price * item.quantity)}
                        </span>
                      </div>
                    </div>
                  ))}

                  {/* Total */}
                  <div className="border-t border-gray-600 pt-3 mt-3">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-semibold text-white">Total:</span>
                      <span className="text-lg font-bold text-green-400">
                        {formatPrice(cartTotal)}
                      </span>
                    </div>
                  </div>

                  {/* Botón procesar venta */}
                  <button
                    onClick={processSale}
                    disabled={processingSale || cart.length === 0 || saleCompleted}
                    className={`w-full mt-4 py-3 rounded-lg transition-all duration-300 flex items-center justify-center font-semibold ${
                      saleCompleted 
                        ? 'bg-green-600 text-white' 
                        : processingSale 
                        ? 'bg-blue-500 text-white' 
                        : cart.length === 0 
                        ? 'bg-gray-600 cursor-not-allowed text-gray-300'
                        : 'bg-green-500/80 hover:bg-green-500 text-white hover:scale-105'
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
      </div>
    </PageContainer>
  );
};

export default BarberSales;
