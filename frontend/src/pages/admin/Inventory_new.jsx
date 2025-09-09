import React, { useState, useEffect } from 'react';
import { 
  Plus, Edit, Trash2, Search, Package2, AlertTriangle, CheckCircle, 
  TrendingUp, TrendingDown, BarChart3, Calculator, RotateCcw, 
  ShoppingCart, Minus, ChevronDown, ChevronUp, User, Users, 
  DollarSign, Activity, Eye, Calendar, Clock 
} from 'lucide-react';
import { inventoryService } from '../../services';
import { useAuth } from '../../contexts/AuthContext';
import { PageContainer } from '../../components/layout/PageContainer';
import { GradientButton } from '../../components/ui/GradientButton';
import { GradientText } from '../../components/ui/GradientText';

/**
 * Componente moderno de gestión de inventario para The Brothers Barber Shop
 * Diseño moderno con fondo de puntos, gradient text y diseño tipo lista lateral
 */
const Inventory = () => {
  const { user } = useAuth();
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedSection, setExpandedSection] = useState(null); // 'form', 'movement', 'sale'
  const [formData, setFormData] = useState({
    name: '',
    category: 'insumos',
    initialStock: '',
    entries: '',
    exits: '',
    currentStock: '',
    minStock: '',
    price: '',
    description: ''
  });
  const [editingItem, setEditingItem] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [movementData, setMovementData] = useState({
    type: 'entry',
    quantity: '',
    reason: '',
    notes: ''
  });
  const [saleData, setSaleData] = useState({
    quantity: '',
    customerName: '',
    barberId: '',
    notes: ''
  });
  const [barbers, setBarbers] = useState([]);

  const categories = [
    'cannabicos', 'gorras', 'insumos', 'productos_pelo', 'lociones',
    'ceras', 'geles', 'maquinas', 'accesorios', 'otros'
  ];

  useEffect(() => {
    loadInventory();
    loadBarbers();
  }, []);

  const loadBarbers = async () => {
    try {
      const response = await fetch('/api/v1/barbers');
      const data = await response.json();
      if (data.success) {
        setBarbers(data.data || []);
      }
    } catch (error) {
      console.error('Error al cargar barberos:', error);
    }
  };

  const loadInventory = async () => {
    try {
      setLoading(true);
      const response = await inventoryService.getInventory();
      
      let inventoryData = [];
      if (response && response.data && Array.isArray(response.data)) {
        inventoryData = response.data;
      } else if (response && Array.isArray(response.success)) {
        inventoryData = response.success;
      }
      
      setInventory(inventoryData);
    } catch (error) {
      console.error('Error al cargar inventario:', error);
      setError('Error al cargar el inventario');
      setInventory([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const processedData = {
        ...formData,
        initialStock: formData.initialStock ? parseInt(formData.initialStock, 10) : 0,
        entries: formData.entries ? parseInt(formData.entries, 10) : 0,
        exits: formData.exits ? parseInt(formData.exits, 10) : 0,
        stock: formData.currentStock ? parseInt(formData.currentStock, 10) : parseInt(formData.initialStock, 10) || 0,
        minStock: formData.minStock ? parseInt(formData.minStock, 10) : 0,
        price: formData.price ? parseFloat(formData.price) : 0
      };

      if (editingItem) {
        await inventoryService.updateInventoryItem(editingItem._id, processedData);
        setSuccess('Producto actualizado exitosamente');
      } else {
        await inventoryService.createInventoryItem(processedData);
        setSuccess('Producto creado exitosamente');
      }
      
      resetForm();
      setExpandedSection(null);
      loadInventory();
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error al guardar producto:', error);
      setError(error.message || 'Error al guardar el producto');
      setTimeout(() => setError(''), 3000);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      category: 'insumos',
      initialStock: '',
      entries: '',
      exits: '',
      currentStock: '',
      minStock: '',
      price: '',
      description: ''
    });
    setEditingItem(null);
  };

  const handleEdit = (item) => {
    setFormData({
      name: item.name,
      category: item.category,
      initialStock: item.initialStock?.toString() || '',
      entries: item.entries?.toString() || '',
      exits: item.exits?.toString() || '',
      currentStock: item.stock?.toString() || item.currentStock?.toString() || item.quantity?.toString() || '',
      minStock: item.minStock?.toString() || '',
      price: item.price?.toString() || '',
      description: item.description || ''
    });
    setEditingItem(item);
    setExpandedSection('form');
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este producto?')) {
      try {
        await inventoryService.deleteInventoryItem(id);
        setSuccess('Producto eliminado exitosamente');
        loadInventory();
        setTimeout(() => setSuccess(''), 3000);
      } catch (error) {
        console.error('Error al eliminar producto:', error);
        setError('Error al eliminar el producto');
        setTimeout(() => setError(''), 3000);
      }
    }
  };

  const handleNewProduct = () => {
    resetForm();
    setExpandedSection('form');
  };

  const handleMovement = (item) => {
    setSelectedItem(item);
    setMovementData({ type: 'entry', quantity: '', reason: '', notes: '' });
    setExpandedSection('movement');
  };

  const handleSale = (item) => {
    setSelectedItem(item);
    setSaleData({ quantity: '', customerName: '', barberId: '', notes: '' });
    setExpandedSection('sale');
  };

  const getStockStatus = (item) => {
    const currentStock = item.stock || item.currentStock || item.quantity || 0;
    const minStock = item.minStock || 0;
    
    if (currentStock <= 0) return { status: 'out', label: 'Sin stock', color: 'text-red-400', bgColor: 'bg-red-500/10' };
    if (currentStock <= minStock) return { status: 'low', label: 'Stock bajo', color: 'text-yellow-400', bgColor: 'bg-yellow-500/10' };
    return { status: 'good', label: 'Stock normal', color: 'text-green-400', bgColor: 'bg-green-500/10' };
  };

  const filteredInventory = Array.isArray(inventory) ? inventory.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.category.toLowerCase().includes(searchTerm.toLowerCase())
  ) : [];

  const handleMovementSubmit = async (e) => {
    e.preventDefault();
    try {
      const quantity = parseInt(movementData.quantity);
      const currentStock = selectedItem.stock || selectedItem.currentStock || selectedItem.quantity || 0;
      
      let newCurrentStock;
      let newEntries = selectedItem.entries || 0;
      let newExits = selectedItem.exits || 0;
      
      if (movementData.type === 'entry') {
        newCurrentStock = currentStock + quantity;
        newEntries += quantity;
      } else {
        newCurrentStock = Math.max(0, currentStock - quantity);
        newExits += quantity;
      }
      
      const updateData = {
        ...selectedItem,
        stock: newCurrentStock,
        entries: newEntries,
        exits: newExits,
        quantity: newCurrentStock
      };
      
      await inventoryService.updateInventoryItem(selectedItem._id, updateData);
      setSuccess(`Movimiento registrado exitosamente: ${movementData.type === 'entry' ? 'Entrada' : 'Salida'} de ${quantity} unidades`);
      
      setMovementData({ type: 'entry', quantity: '', reason: '', notes: '' });
      setExpandedSection(null);
      loadInventory();
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error al registrar movimiento:', error);
      setError('Error al registrar el movimiento');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleSaleSubmit = async (e) => {
    e.preventDefault();
    try {
      const quantity = parseInt(saleData.quantity);
      const currentStock = selectedItem.stock || selectedItem.currentStock || selectedItem.quantity || 0;
      
      if (quantity > currentStock) {
        setError('No hay suficiente stock para realizar esta venta');
        setTimeout(() => setError(''), 3000);
        return;
      }
      
      const salePayload = {
        productId: selectedItem._id,
        quantity: quantity,
        barberId: saleData.barberId,
        customerName: saleData.customerName,
        notes: saleData.notes
      };
      
      const response = await fetch('/api/v1/sales', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(salePayload)
      });
      
      if (!response.ok) {
        throw new Error('Error al registrar la venta');
      }
      
      const newCurrentStock = currentStock - quantity;
      const newExits = (selectedItem.exits || 0) + quantity;
      
      const updateData = {
        ...selectedItem,
        stock: newCurrentStock,
        exits: newExits,
        quantity: newCurrentStock
      };
      
      await inventoryService.updateInventoryItem(selectedItem._id, updateData);
      
      setSuccess(`Venta registrada exitosamente: ${quantity} unidades`);
      setSaleData({ quantity: '', customerName: '', barberId: '', notes: '' });
      setExpandedSection(null);
      loadInventory();
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error al registrar venta:', error);
      setError('Error al registrar la venta');
      setTimeout(() => setError(''), 3000);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Fondo de puntos */}
      <div className="absolute inset-0 bg-gray-900">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.15) 1px, transparent 0)`,
          backgroundSize: '20px 20px'
        }} />
      </div>
      
      <PageContainer>
        <div className="relative z-10 space-y-8">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              <GradientText>
                <Package2 className="w-12 h-12 mx-auto mb-4" />
                Gestión de Inventario
              </GradientText>
            </h1>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Administra tu inventario de productos y suministros con herramientas modernas y eficientes
            </p>
          </div>

          {/* Mensajes de error y éxito */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl backdrop-blur-sm flex items-center gap-3">
              <AlertTriangle className="w-5 h-5" />
              {error}
            </div>
          )}
          
          {success && (
            <div className="bg-green-500/10 border border-green-500/30 text-green-400 px-4 py-3 rounded-xl backdrop-blur-sm flex items-center gap-3">
              <CheckCircle className="w-5 h-5" />
              {success}
            </div>
          )}

          {/* Layout principal - 2 columnas */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Panel lateral izquierdo - Formularios */}
            <div className="lg:col-span-1 space-y-6">
              {/* Controles principales */}
              <div className="bg-gray-800/30 border border-gray-700/30 rounded-2xl p-6 backdrop-blur-sm">
                <div className="space-y-4">
                  <GradientButton
                    onClick={handleNewProduct}
                    className="w-full flex items-center justify-center gap-2"
                  >
                    <Plus className="w-5 h-5" />
                    Nuevo Producto
                  </GradientButton>

                  {/* Búsqueda */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      placeholder="Buscar productos..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-700/30 rounded-xl text-white placeholder-gray-400 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Formulario de Producto */}
              {expandedSection === 'form' && (
                <div className="bg-gray-800/30 border border-gray-700/30 rounded-2xl p-6 backdrop-blur-sm">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-semibold">
                      <GradientText>
                        {editingItem ? 'Editar Producto' : 'Nuevo Producto'}
                      </GradientText>
                    </h3>
                    <button
                      onClick={() => setExpandedSection(null)}
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      <ChevronUp className="w-5 h-5" />
                    </button>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Nombre del Producto</label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700/30 rounded-xl text-white placeholder-gray-400 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Categoría</label>
                      <select
                        value={formData.category}
                        onChange={(e) => setFormData({...formData, category: e.target.value})}
                        className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700/30 rounded-xl text-white focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all"
                      >
                        {categories.map(cat => (
                          <option key={cat} value={cat}>
                            {cat.replace('_', ' ').toUpperCase()}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Stock Inicial</label>
                        <input
                          type="number"
                          value={formData.initialStock}
                          onChange={(e) => setFormData({...formData, initialStock: e.target.value})}
                          className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700/30 rounded-xl text-white placeholder-gray-400 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all"
                          min="0"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Stock Actual</label>
                        <input
                          type="number"
                          value={formData.currentStock}
                          onChange={(e) => setFormData({...formData, currentStock: e.target.value})}
                          className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700/30 rounded-xl text-white placeholder-gray-400 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all"
                          min="0"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Stock Mínimo</label>
                        <input
                          type="number"
                          value={formData.minStock}
                          onChange={(e) => setFormData({...formData, minStock: e.target.value})}
                          className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700/30 rounded-xl text-white placeholder-gray-400 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all"
                          min="0"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Precio</label>
                        <input
                          type="number"
                          step="0.01"
                          value={formData.price}
                          onChange={(e) => setFormData({...formData, price: e.target.value})}
                          className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700/30 rounded-xl text-white placeholder-gray-400 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all"
                          min="0"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Descripción</label>
                      <textarea
                        value={formData.description}
                        onChange={(e) => setFormData({...formData, description: e.target.value})}
                        className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700/30 rounded-xl text-white placeholder-gray-400 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all"
                        rows="3"
                      />
                    </div>

                    <div className="flex gap-3 pt-4">
                      <GradientButton type="submit" className="flex-1">
                        {editingItem ? 'Actualizar' : 'Crear'} Producto
                      </GradientButton>
                      <button
                        type="button"
                        onClick={() => {
                          resetForm();
                          setExpandedSection(null);
                        }}
                        className="px-4 py-2 bg-gray-700/50 text-gray-300 rounded-xl hover:bg-gray-700 transition-colors"
                      >
                        Cancelar
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Formulario de Movimientos */}
              {expandedSection === 'movement' && selectedItem && (
                <div className="bg-gray-800/30 border border-gray-700/30 rounded-2xl p-6 backdrop-blur-sm">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-semibold">
                      <GradientText>
                        Registrar Movimiento
                      </GradientText>
                    </h3>
                    <button
                      onClick={() => setExpandedSection(null)}
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      <ChevronUp className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="mb-4 p-3 bg-gray-800/50 rounded-xl">
                    <p className="text-sm text-gray-300">
                      <span className="font-medium">Producto:</span> {selectedItem.name}
                    </p>
                    <p className="text-sm text-gray-300">
                      <span className="font-medium">Stock actual:</span> {selectedItem.stock || selectedItem.currentStock || selectedItem.quantity || 0}
                    </p>
                  </div>

                  <form onSubmit={handleMovementSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Tipo de Movimiento</label>
                      <select
                        value={movementData.type}
                        onChange={(e) => setMovementData({...movementData, type: e.target.value})}
                        className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700/30 rounded-xl text-white focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all"
                      >
                        <option value="entry">Entrada (Agregar stock)</option>
                        <option value="exit">Salida (Reducir stock)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Cantidad</label>
                      <input
                        type="number"
                        value={movementData.quantity}
                        onChange={(e) => setMovementData({...movementData, quantity: e.target.value})}
                        className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700/30 rounded-xl text-white placeholder-gray-400 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all"
                        min="1"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Motivo</label>
                      <input
                        type="text"
                        value={movementData.reason}
                        onChange={(e) => setMovementData({...movementData, reason: e.target.value})}
                        className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700/30 rounded-xl text-white placeholder-gray-400 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all"
                        placeholder="Ej: Compra, Pérdida, Ajuste..."
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Notas (Opcional)</label>
                      <textarea
                        value={movementData.notes}
                        onChange={(e) => setMovementData({...movementData, notes: e.target.value})}
                        className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700/30 rounded-xl text-white placeholder-gray-400 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all"
                        rows="2"
                      />
                    </div>

                    <div className="flex gap-3 pt-4">
                      <GradientButton type="submit" className="flex-1">
                        Registrar Movimiento
                      </GradientButton>
                      <button
                        type="button"
                        onClick={() => setExpandedSection(null)}
                        className="px-4 py-2 bg-gray-700/50 text-gray-300 rounded-xl hover:bg-gray-700 transition-colors"
                      >
                        Cancelar
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Formulario de Ventas */}
              {expandedSection === 'sale' && selectedItem && (
                <div className="bg-gray-800/30 border border-gray-700/30 rounded-2xl p-6 backdrop-blur-sm">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-semibold">
                      <GradientText>
                        Registrar Venta
                      </GradientText>
                    </h3>
                    <button
                      onClick={() => setExpandedSection(null)}
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      <ChevronUp className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="mb-4 p-3 bg-gray-800/50 rounded-xl">
                    <p className="text-sm text-gray-300">
                      <span className="font-medium">Producto:</span> {selectedItem.name}
                    </p>
                    <p className="text-sm text-gray-300">
                      <span className="font-medium">Stock disponible:</span> {selectedItem.stock || selectedItem.currentStock || selectedItem.quantity || 0}
                    </p>
                    <p className="text-sm text-gray-300">
                      <span className="font-medium">Precio:</span> ${selectedItem.price || 0}
                    </p>
                  </div>

                  <form onSubmit={handleSaleSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Cantidad a Vender</label>
                      <input
                        type="number"
                        value={saleData.quantity}
                        onChange={(e) => setSaleData({...saleData, quantity: e.target.value})}
                        className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700/30 rounded-xl text-white placeholder-gray-400 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all"
                        min="1"
                        max={selectedItem.stock || selectedItem.currentStock || selectedItem.quantity || 0}
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Barbero</label>
                      <select
                        value={saleData.barberId}
                        onChange={(e) => setSaleData({...saleData, barberId: e.target.value})}
                        className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700/30 rounded-xl text-white focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all"
                        required
                      >
                        <option value="">Seleccionar barbero</option>
                        {barbers.map(barber => (
                          <option key={barber._id} value={barber._id}>
                            {barber.user?.name || barber.name || 'Barbero sin nombre'}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Cliente (Opcional)</label>
                      <input
                        type="text"
                        value={saleData.customerName}
                        onChange={(e) => setSaleData({...saleData, customerName: e.target.value})}
                        className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700/30 rounded-xl text-white placeholder-gray-400 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all"
                        placeholder="Nombre del cliente"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Notas (Opcional)</label>
                      <textarea
                        value={saleData.notes}
                        onChange={(e) => setSaleData({...saleData, notes: e.target.value})}
                        className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700/30 rounded-xl text-white placeholder-gray-400 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all"
                        rows="2"
                      />
                    </div>

                    <div className="flex gap-3 pt-4">
                      <GradientButton type="submit" className="flex-1">
                        Registrar Venta
                      </GradientButton>
                      <button
                        type="button"
                        onClick={() => setExpandedSection(null)}
                        className="px-4 py-2 bg-gray-700/50 text-gray-300 rounded-xl hover:bg-gray-700 transition-colors"
                      >
                        Cancelar
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>

            {/* Lista principal de inventario */}
            <div className="lg:col-span-3">
              <div className="bg-gray-800/30 border border-gray-700/30 rounded-2xl backdrop-blur-sm">
                <div className="p-6 border-b border-gray-700/30">
                  <h2 className="text-2xl font-bold">
                    <GradientText>
                      Lista de Productos
                    </GradientText>
                  </h2>
                </div>

                {loading ? (
                  <div className="p-8 text-center">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                    <p className="mt-4 text-gray-400">Cargando inventario...</p>
                  </div>
                ) : filteredInventory.length === 0 ? (
                  <div className="p-8 text-center">
                    <Package2 className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400 mb-2">No hay productos en el inventario</p>
                    <p className="text-sm text-gray-500">Agrega tu primer producto para comenzar</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-700/30">
                    {filteredInventory.map((item) => {
                      const stockStatus = getStockStatus(item);
                      const currentStock = item.stock || item.currentStock || item.quantity || 0;
                      
                      return (
                        <div key={item._id} className="p-6 hover:bg-gray-800/20 transition-colors">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-4 mb-3">
                                <div className="flex-1">
                                  <h3 className="text-lg font-semibold">
                                    <GradientText className="text-lg">
                                      {item.name}
                                    </GradientText>
                                  </h3>
                                  <p className="text-sm text-gray-400 capitalize">
                                    {item.category?.replace('_', ' ')}
                                  </p>
                                </div>
                                
                                <div className={`px-3 py-1 rounded-full text-sm font-medium ${stockStatus.bgColor} ${stockStatus.color}`}>
                                  {stockStatus.label}
                                </div>
                              </div>

                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                                <div className="text-center">
                                  <p className="text-2xl font-bold text-blue-400">{currentStock}</p>
                                  <p className="text-xs text-gray-400">Stock Actual</p>
                                </div>
                                <div className="text-center">
                                  <p className="text-lg font-semibold text-gray-300">{item.minStock || 0}</p>
                                  <p className="text-xs text-gray-400">Stock Mínimo</p>
                                </div>
                                <div className="text-center">
                                  <p className="text-lg font-semibold text-green-400">${item.price || 0}</p>
                                  <p className="text-xs text-gray-400">Precio</p>
                                </div>
                                <div className="text-center">
                                  <p className="text-lg font-semibold text-purple-400">{(item.entries || 0) - (item.exits || 0)}</p>
                                  <p className="text-xs text-gray-400">Movimientos</p>
                                </div>
                              </div>

                              {item.description && (
                                <p className="text-sm text-gray-400 mb-3">{item.description}</p>
                              )}
                            </div>

                            <div className="flex flex-col gap-2 ml-6">
                              <button
                                onClick={() => handleEdit(item)}
                                className="flex items-center gap-2 px-4 py-2 bg-blue-600/20 text-blue-400 rounded-xl hover:bg-blue-600/30 transition-colors"
                              >
                                <Edit className="w-4 h-4" />
                                Editar
                              </button>
                              
                              <button
                                onClick={() => handleMovement(item)}
                                className="flex items-center gap-2 px-4 py-2 bg-purple-600/20 text-purple-400 rounded-xl hover:bg-purple-600/30 transition-colors"
                              >
                                <RotateCcw className="w-4 h-4" />
                                Movimiento
                              </button>
                              
                              <button
                                onClick={() => handleSale(item)}
                                className="flex items-center gap-2 px-4 py-2 bg-green-600/20 text-green-400 rounded-xl hover:bg-green-600/30 transition-colors"
                              >
                                <ShoppingCart className="w-4 h-4" />
                                Venta
                              </button>
                              
                              {user?.role === 'admin' && (
                                <button
                                  onClick={() => handleDelete(item._id)}
                                  className="flex items-center gap-2 px-4 py-2 bg-red-600/20 text-red-400 rounded-xl hover:bg-red-600/30 transition-colors"
                                >
                                  <Trash2 className="w-4 h-4" />
                                  Eliminar
                                </button>
                              )}
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
      </PageContainer>
    </div>
  );
};

export default Inventory;
