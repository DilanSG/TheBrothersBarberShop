import React, { useState, useEffect } from 'react';
import { 
  Plus, Edit, Trash2, Search, Package2, AlertTriangle, CheckCircle, 
  TrendingUp, TrendingDown, BarChart3, Calculator, RotateCcw, 
  ShoppingCart, Minus, ChevronDown, ChevronUp, User, Users, 
  DollarSign, Activity, Eye, Calendar, Clock, Download, Camera, FileText, XCircle
} from 'lucide-react';
import ExcelJS from 'exceljs';
import { inventoryService } from '@services/api';
import { useInventoryRefresh } from '@contexts/InventoryContext';
import { useAuth } from '@contexts/AuthContext';
import { usePaymentMethods } from '@shared/config/paymentMethods';
import { PageContainer } from '@components/layout/PageContainer';
import GradientButton from '@components/ui/GradientButton';
import GradientText from '@components/ui/GradientText';
import InventorySnapshot from '@components/inventory/InventorySnapshot';
import SavedInventoriesModal from '@components/modals/SavedInventoriesModal';
import InventoryLogsModal from '@components/modals/InventoryLogsModal';

import logger from '@utils/logger';
/**
 * Componente moderno de gestión de inventario para The Brothers Barber Shop
 * Diseño moderno con fondo de puntos, gradient text y diseño tipo lista lateral
 */
const Inventory = () => {
  const { user } = useAuth();
  const { refreshTrigger, needsRefresh, markRefreshed } = useInventoryRefresh();
  const { paymentMethods, getOptions: getPaymentMethodOptions, mapToBackend: mapPaymentMethodToBackend } = usePaymentMethods();
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [lastRefreshTime, setLastRefreshTime] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('alphabetical'); // 'alphabetical', 'createdAt'
  const [expandedSection, setExpandedSection] = useState(null); // 'form', 'movement', 'sale'
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    category: 'insumos',
    initialStock: '',
    entries: '',
    exits: '',
    minStock: '',
    realStock: '',
    price: '',
    description: ''
  });
  const [editingItem, setEditingItem] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [movementData, setMovementData] = useState({
    type: 'entry',
    quantity: '',
    reason: '',
    notes: '',
    cost: '',
    paymentMethod: 'efectivo'
  });
  const [saleData, setSaleData] = useState({
    quantity: '1'
  });
  const [countData, setCountData] = useState({
    realStock: '',
    entries: '',
    exits: '',
    notes: ''
  });
  const [showSnapshotModal, setShowSnapshotModal] = useState(false);
  const [showSavedInventoriesModal, setShowSavedInventoriesModal] = useState(false);
  const [showLogsModal, setShowLogsModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [deletionReason, setDeletionReason] = useState('');

  const categories = [
    'cannabicos', 'gorras', 'insumos', 'productos_pelo', 'lociones',
    'ceras', 'geles', 'maquinas', 'accesorios', 'otros'
  ];

  useEffect(() => {
    loadInventory();
  }, []);

  // Auto-recarga cuando hay ventas nuevas
  useEffect(() => {
    logger.debug('🔄 InventoryAdmin: useEffect trigger -', { 
      refreshTrigger, 
      lastRefreshTime, 
      needsRefresh: needsRefresh(lastRefreshTime) 
    });
    
    if (needsRefresh(lastRefreshTime)) {
      logger.debug('🔄 InventoryAdmin: Detectada venta nueva, recargando...');
      loadInventory();
    }
  }, [refreshTrigger, lastRefreshTime, needsRefresh]);

  // También agregar un useEffect que se ejecute al montar el componente
  useEffect(() => {
    logger.debug('🔄 InventoryAdmin: Componente montado, verificando si necesita recarga...');
    if (needsRefresh(lastRefreshTime)) {
      logger.debug('🔄 InventoryAdmin: Necesita recarga al montar, ejecutando...');
      loadInventory();
    }
  }, []);

  const loadInventory = async () => {
    try {
      setLoading(true);
      logger.debug('🔄 InventoryAdmin: Cargando inventario...');
      
      // Añadir timestamp para evitar caché
      const timestamp = Date.now();
      const response = await inventoryService.getInventory({ _t: timestamp });
      
      let inventoryData = [];
      if (response && response.data && Array.isArray(response.data)) {
        inventoryData = response.data;
      } else if (response && Array.isArray(response.success)) {
        inventoryData = response.success;
      }
      
      setInventory(inventoryData);
      setLastRefreshTime(markRefreshed());
      logger.debug('✅ InventoryAdmin: Inventario cargado, productos:', inventoryData.length);
    } catch (error) {
      console.error('❌ InventoryAdmin: Error al cargar inventario:', error);
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
        stock: formData.initialStock ? parseInt(formData.initialStock, 10) : 0, // Stock calculado = inicial
        minStock: formData.minStock ? parseInt(formData.minStock, 10) : 0,
        realStock: formData.realStock ? parseInt(formData.realStock, 10) : undefined,
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
      code: '',
      category: 'insumos',
      initialStock: '',
      entries: '',
      exits: '',
      minStock: '',
      realStock: '',
      price: '',
      description: ''
    });
    setEditingItem(null);
  };

  const handleEdit = (item) => {
    setFormData({
      name: item.name,
      code: item.code || '',
      category: item.category,
      initialStock: item.initialStock?.toString() || '',
      entries: item.entries?.toString() || '',
      exits: item.exits?.toString() || '',
      minStock: item.minStock?.toString() || '',
      realStock: item.realStock?.toString() || '',
      price: item.price?.toString() || '',
      description: item.description || ''
    });
    setEditingItem(item);
    setExpandedSection('form');
  };

  const handleDelete = (item) => {
    setItemToDelete(item);
    setDeletionReason('');
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    
    try {
      await inventoryService.deleteInventoryItem(itemToDelete._id);
      setSuccess('Producto eliminado exitosamente');
      loadInventory();
      setShowDeleteModal(false);
      setItemToDelete(null);
      setDeletionReason('');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error al eliminar producto:', error);
      setError('Error al eliminar el producto');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteModal(false);
    setItemToDelete(null);
    setDeletionReason('');
  };

  const handleNewProduct = () => {
    resetForm();
    setExpandedSection('form');
  };

  const handleMovement = (item) => {
    setSelectedItem(item);
    setMovementData({ type: 'entry', quantity: '', reason: '', notes: '', cost: '', paymentMethod: 'efectivo' });
    setExpandedSection('movement');
  };

  const handleSale = (item) => {
    setSelectedItem(item);
    setSaleData({ quantity: '1' });
    setExpandedSection('sale');
  };

  const handleCount = (item) => {
    setSelectedItem(item);
    setCountData({
      realStock: item.realStock || item.stock || '',
      entries: '',
      exits: '',
      notes: ''
    });
    setExpandedSection('count');
  };

  const handleSnapshotCreated = () => {
    setShowSnapshotModal(false);
    loadInventory(); // Recargar inventario después de crear snapshot
  };

  const getStockStatus = (item) => {
    const realStock = item.realStock || item.stock || item.currentStock || item.quantity || 0;
    const minStock = item.minStock || 0;
    
    if (realStock <= 0) return { status: 'out', label: 'Sin stock', color: 'text-red-400', bgColor: 'bg-red-500/10' };
    if (realStock <= minStock) return { status: 'low', label: 'Stock bajo', color: 'text-yellow-400', bgColor: 'bg-yellow-500/10' };
    return { status: 'good', label: 'Stock normal', color: 'text-green-400', bgColor: 'bg-green-500/10' };
  };

  // Función para filtrar y ordenar el inventario
  const filteredAndSortedInventory = () => {
    let filtered = Array.isArray(inventory) ? inventory.filter(item =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category.toLowerCase().includes(searchTerm.toLowerCase())
    ) : [];

    // Ordenamiento
    switch (sortBy) {
      case 'alphabetical':
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'createdAt':
        filtered.sort((a, b) => new Date(b.createdAt || b._id) - new Date(a.createdAt || a._id));
        break;
      case 'category':
        filtered.sort((a, b) => a.category.localeCompare(b.category));
        break;
      case 'stock':
        filtered.sort((a, b) => {
          const stockA = a.realStock || a.stock || a.currentStock || a.quantity || 0;
          const stockB = b.realStock || b.stock || b.currentStock || b.quantity || 0;
          return stockB - stockA; // Mayor stock primero
        });
        break;
      default:
        break;
    }

    return filtered;
  };

  const filteredInventory = filteredAndSortedInventory();

  const handleMovementSubmit = async (e) => {
    e.preventDefault();
    try {
      const quantity = parseInt(movementData.quantity);
      
      // Preparar datos para el ajuste de stock
      const adjustmentData = {
        quantity,
        type: movementData.type === 'entry' ? 'add' : 'remove',
        reason: movementData.reason,
        notes: movementData.notes
      };

      // Si es una entrada y tiene costo, agregar campos de costo
      if (movementData.type === 'entry' && movementData.cost && parseFloat(movementData.cost) > 0) {
        adjustmentData.cost = parseFloat(movementData.cost);
        adjustmentData.paymentMethod = mapPaymentMethodToBackend(movementData.paymentMethod);
      }

      await inventoryService.adjustStock(selectedItem._id, adjustmentData);
      
      const successMessage = movementData.type === 'entry' && movementData.cost && parseFloat(movementData.cost) > 0
        ? `Entrada de ${quantity} unidades registrada exitosamente y gasto de $${parseFloat(movementData.cost).toFixed(2)} agregado`
        : `Movimiento registrado exitosamente: ${movementData.type === 'entry' ? 'Entrada' : 'Salida'} de ${quantity} unidades`;
      
      setSuccess(successMessage);
      
      setMovementData({ type: 'entry', quantity: '', reason: '', notes: '', cost: '', paymentMethod: 'efectivo' });
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
        barberId: user._id, // Usar el ID del usuario actual
        customerName: `Venta directa - ${user.name}`, // Asignar automáticamente
        notes: `Venta registrada por ${user.name} desde inventario`
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
      const newSales = (selectedItem.sales || 0) + quantity; // Agregar a ventas también
      
      const updateData = {
        ...selectedItem,
        stock: newCurrentStock,
        exits: newExits,
        sales: newSales, // Incluir campo de ventas
        quantity: newCurrentStock
      };
      
      await inventoryService.updateInventoryItem(selectedItem._id, updateData);
      
      setSuccess(`Venta registrada exitosamente: ${quantity} unidades`);
      setSaleData({ quantity: '1' });
      setExpandedSection(null);
      loadInventory();
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error al registrar venta:', error);
      setError('Error al registrar la venta');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleCountSubmit = async (e) => {
    e.preventDefault();
    try {
      const realStock = parseInt(countData.realStock) || 0;
      const entries = parseInt(countData.entries) || 0;
      const exits = parseInt(countData.exits) || 0;
      
      const updateData = {
        ...selectedItem,
        realStock: realStock,
        entries: (selectedItem.entries || 0) + entries,
        exits: (selectedItem.exits || 0) + exits,
        notes: countData.notes
      };
      
      await inventoryService.updateInventoryItem(selectedItem._id, updateData);
      
      setSuccess(`Conteo registrado exitosamente para ${selectedItem.name}`);
      setCountData({ realStock: '', entries: '', exits: '', notes: '' });
      setExpandedSection(null);
      loadInventory();
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error al registrar conteo:', error);
      setError('Error al registrar el conteo');
      setTimeout(() => setError(''), 3000);
    }
  };

  // Función para exportar inventario a Excel
  const exportToExcel = async () => {
    try {
      // Preparar datos para Excel
      const excelData = filteredInventory.map(item => {
        const initialStock = item.initialStock || 0;
        const entries = item.entries || 0;
        const exits = item.exits || 0;
        const sales = item.sales || 0;
        const currentStock = item.stock || item.currentStock || item.quantity || 0;
        const realStock = item.realStock !== undefined ? item.realStock : currentStock;
        const expectedStock = initialStock + entries - exits - sales;
        const difference = realStock - expectedStock;

        return {
          'Producto': item.name || '',
          'Categoría': item.category ? item.category.replace('_', ' ').toUpperCase() : '',
          'Código': item.code || '',
          'Stock Inicial': initialStock,
          'Entradas': entries,
          'Salidas': exits,
          'Ventas': sales,
          'Stock Sistema': expectedStock,
          'Stock Real': realStock,
          'Diferencia': difference,
          'Stock Mínimo': item.minStock || 0,
          'Estado': realStock <= 0 ? 'Sin Stock' : realStock <= (item.minStock || 0) ? 'Stock Bajo' : 'Normal',
          'Precio': item.price ? `$${item.price.toLocaleString('es-CO')}` : '$0',
          'Descripción': item.description || ''
        };
      });

      // Crear workbook
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Inventario');

      // Definir columnas con anchos calculados
      const headers = Object.keys(excelData[0] || {});
      worksheet.columns = headers.map(header => {
        const maxWidth = Math.max(
          header.length,
          ...excelData.map(row => (row[header] || '').toString().length)
        );
        return {
          header: header,
          key: header,
          width: Math.min(Math.max(maxWidth + 2, 10), 50)
        };
      });

      // Agregar datos
      excelData.forEach(row => {
        const addedRow = worksheet.addRow(row);
        
        // Colorear diferencias negativas en rojo
        const diffCell = addedRow.getCell('Diferencia');
        if (row['Diferencia'] < 0) {
          diffCell.font = { color: { argb: 'FFFF0000' }, bold: true };
        } else if (row['Diferencia'] > 0) {
          diffCell.font = { color: { argb: 'FF008000' } };
        }

        // Colorear estado
        const statusCell = addedRow.getCell('Estado');
        if (row['Estado'] === 'Sin Stock') {
          statusCell.font = { color: { argb: 'FFFF0000' }, bold: true };
        } else if (row['Estado'] === 'Stock Bajo') {
          statusCell.font = { color: { argb: 'FFFF8800' } };
        }
      });

      // Estilo para header
      worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
      worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF4472C4' }
      };
      worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };

      // Generar y descargar
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      
      const now = new Date();
      const fileName = `inventario_${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}.xlsx`;
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      setSuccess(`Inventario exportado exitosamente: ${fileName}`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error al exportar inventario:', error);
      setError('Error al exportar el inventario');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleFixConsistency = async () => {
    if (!window.confirm('¿Estás seguro de que deseas corregir las inconsistencias del inventario?\n\nEsto ajustará los stocks para que coincidan con las ventas registradas.')) {
      return;
    }

    try {
      setLoading(true);
      setSuccess('Corrigiendo inconsistencias del inventario...');
      
      const response = await inventoryService.fixConsistency();
      
      if (response.success) {
        setSuccess(`✅ Inconsistencias corregidas: ${response.fixed || 0} productos actualizados`);
        loadInventory(); // Recargar inventario para ver los cambios
      } else {
        setError('Error al corregir inconsistencias');
      }
      
      setTimeout(() => setSuccess(''), 5000);
    } catch (error) {
      console.error('Error al corregir inconsistencias:', error);
      setError(error.message || 'Error al corregir inconsistencias');
      setTimeout(() => setError(''), 3000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <PageContainer>
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-6 space-y-8">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="flex items-center justify-center gap-3 mb-2">
              <div className="p-3 bg-gradient-to-r from-purple-600/20 to-blue-600/20 rounded-xl border border-purple-500/20 shadow-xl shadow-blue-500/20">
                <Package2 className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-purple-400" />
              </div>
              <GradientText className="text-xl sm:text-2xl lg:text-3xl font-bold">
                Gestión de Inventario
              </GradientText>
            </div>
          </div>

        {/* Mensajes de error y éxito */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-2 rounded-xl backdrop-blur-sm flex items-center gap-2 shadow-xl shadow-blue-500/20">
            <AlertTriangle className="w-4 h-4" />
            {error}
          </div>
        )}
        
        {success && (
          <div className="bg-green-500/10 border border-green-500/30 text-green-400 px-4 py-2 rounded-xl backdrop-blur-sm flex items-center gap-2 shadow-xl shadow-blue-500/20">
            <CheckCircle className="w-4 h-4" />
            {success}
          </div>
        )}        {/* Container principal transparente */}
        <div className="bg-transparent border border-white/10 rounded-2xl backdrop-blur-sm shadow-2xl shadow-blue-500/20 relative">
          
          {/* Botón de corrección discreto en esquina superior derecha */}
          {user?.role === 'admin' && (
            <button
              onClick={handleFixConsistency}
              className="absolute top-2 right-2 p-1 bg-red-500/5 hover:bg-red-500/20 text-red-400/40 hover:text-red-400 rounded transition-all opacity-30 hover:opacity-100 z-10"
              title="Corregir inconsistencias en el inventario"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
          )}
          
          {/* Header de controles */}
          <div className="p-4 sm:p-6 border-b border-white/10 space-y-4">
            {/* Botones de acción - Responsivos */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center sm:justify-start">
              {user?.role === 'admin' && (
                <GradientButton
                  onClick={handleNewProduct}
                  className="text-sm px-6 py-3 w-full sm:w-auto min-w-[160px] shadow-xl shadow-blue-500/20"
                >
                  <div className="flex items-center justify-center gap-2">
                    <Plus className="w-4 h-4" />
                    <span>Nuevo Producto</span>
                  </div>
                </GradientButton>
              )}
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 w-full sm:w-auto">
                {user?.role === 'admin' && (
                  <button
                    onClick={exportToExcel}
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-500/30 rounded-lg transition-colors text-sm shadow-xl shadow-blue-500/20"
                    disabled={filteredInventory.length === 0}
                  >
                    <Download className="w-4 h-4" />
                    <span>Exportar Excel</span>
                  </button>
                )}
                
                {user?.role === 'admin' && (
                  <button
                    onClick={() => setShowSnapshotModal(true)}
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 border border-blue-500/30 rounded-lg transition-colors text-sm shadow-xl shadow-blue-500/20"
                    disabled={filteredInventory.length === 0}
                  >
                    <Camera className="w-4 h-4" />
                    <span className="hidden sm:inline">Guardar</span>
                    <span className="sm:hidden">Inventario</span>
                  </button>
                )}
                
                {user?.role === 'admin' && (
                  <button
                    onClick={() => setShowSavedInventoriesModal(true)}
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 border border-purple-500/30 rounded-lg transition-colors text-sm shadow-xl shadow-blue-500/20"
                  >
                    <Calendar className="w-4 h-4" />
                    <span className="hidden sm:inline">Ver</span>
                    <span className="sm:hidden">Inventarios</span>
                  </button>
                )}

                {user?.role === 'admin' && (
                  <button
                    onClick={() => setShowLogsModal(true)}
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 border border-orange-500/30 rounded-lg transition-colors text-sm shadow-xl shadow-blue-500/20"
                  >
                    <FileText className="w-4 h-4" />
                    <span className="hidden sm:inline">Historial</span>
                    <span className="sm:hidden">Logs</span>
                  </button>
                )}
              </div>
            </div>

            {/* Búsqueda y Ordenamiento */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center sm:justify-end items-center">
              {/* Selector de Ordenamiento */}
              <div className="w-full sm:w-40">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="glassmorphism-select w-full shadow-xl shadow-blue-500/20"
                >
                  <option value="alphabetical">Alfabético (A-Z)</option>
                  <option value="createdAt">Fecha de Creación</option>
                  <option value="category">Por Categoría</option>
                  <option value="stock">Por Stock</option>
                </select>
              </div>
              
              {/* Campo de Búsqueda */}
              <div className="relative w-full sm:w-44">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Buscar productos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="glassmorphism-input pl-9 pr-4 w-full shadow-xl shadow-blue-500/20"
                />
              </div>
            </div>
          </div>

              {/* Formularios expandibles en el lugar correcto - Solo Admin */}
              {expandedSection === 'form' && user?.role === 'admin' && (
                <div className="mx-4 mt-4 bg-white/5 border border-white/10 rounded-xl p-6 backdrop-blur-md shadow-2xl shadow-blue-500/20">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">
                      <GradientText className="text-lg font-semibold">
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

                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Fila 1: Información básica */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Nombre</label>
                        <input
                          type="text"
                          value={formData.name}
                          onChange={(e) => setFormData({...formData, name: e.target.value})}
                          className="glassmorphism-input w-full shadow-xl shadow-blue-500/20"
                          placeholder="Nombre del producto"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Código</label>
                        <input
                          type="text"
                          value={formData.code}
                          onChange={(e) => setFormData({...formData, code: e.target.value})}
                          className="glassmorphism-input w-full shadow-xl shadow-blue-500/20"
                          placeholder="Ej: PRD001"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Categoría</label>
                        <select
                          value={formData.category}
                          onChange={(e) => setFormData({...formData, category: e.target.value})}
                          className="glassmorphism-select w-full shadow-xl shadow-blue-500/20"
                        >
                          {categories.map(cat => (
                            <option key={cat} value={cat}>
                              {cat.replace('_', ' ').toUpperCase()}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Fila 2: Stocks */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Stock Inicial</label>
                        <input
                          type="number"
                          value={formData.initialStock}
                          onChange={(e) => setFormData({...formData, initialStock: e.target.value})}
                          className="glassmorphism-input w-full shadow-xl shadow-blue-500/20"
                          min="0"
                          placeholder="0"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Stock Mínimo</label>
                        <input
                          type="number"
                          value={formData.minStock}
                          onChange={(e) => setFormData({...formData, minStock: e.target.value})}
                          className="glassmorphism-input w-full shadow-xl shadow-blue-500/20"
                          min="0"
                          placeholder="0"
                        />
                      </div>

                      {/* Campo Stock Real - Solo para administradores */}
                      {user?.role === 'admin' && (
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">Stock Real (Conteo)</label>
                          <input
                            type="number"
                            value={formData.realStock || ''}
                            onChange={(e) => setFormData({...formData, realStock: e.target.value})}
                            className="glassmorphism-input w-full shadow-xl shadow-blue-500/20"
                            min="0"
                            placeholder="Stock físico contado"
                          />
                          <p className="text-xs text-blue-400/70 mt-1">Stock físico verificado por conteo manual</p>
                        </div>
                      )}
                    </div>

                    {/* Fila 3: Precio y Descripción */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Precio</label>
                        <input
                          type="number"
                          step="0.01"
                          value={formData.price}
                          onChange={(e) => setFormData({...formData, price: e.target.value})}
                          className="glassmorphism-input w-full shadow-xl shadow-blue-500/20"
                          min="0"
                          placeholder="0.00"
                        />
                      </div>

                      <div className="lg:col-span-2">
                        <label className="block text-sm font-medium text-gray-300 mb-2">Descripción</label>
                        <input
                          type="text"
                          value={formData.description}
                          onChange={(e) => setFormData({...formData, description: e.target.value})}
                          className="glassmorphism-input w-full shadow-xl shadow-blue-500/20"
                          placeholder="Descripción del producto (opcional)"
                        />
                      </div>
                    </div>

                    {/* Botones de acción */}
                    <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-white/10">
                      <GradientButton type="submit" className="text-sm px-6 py-3 w-full sm:w-auto shadow-xl shadow-blue-500/20">
                        {editingItem ? 'Actualizar Producto' : 'Crear Producto'}
                      </GradientButton>
                      <button
                        type="button"
                        onClick={() => {
                          resetForm();
                          setExpandedSection(null);
                        }}
                        className="px-6 py-3 w-full sm:w-auto bg-white/5 text-gray-300 rounded-lg hover:bg-white/10 transition-colors text-sm backdrop-blur-sm shadow-xl shadow-blue-500/20"
                      >
                        Cancelar
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Formulario de Movimientos - Solo Admin */}
              {expandedSection === 'movement' && selectedItem && user?.role === 'admin' && (
                <div className="mx-4 mt-4 bg-white/5 border border-white/10 rounded-xl p-6 backdrop-blur-md shadow-2xl shadow-blue-500/20">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">
                      <GradientText className="text-lg font-semibold">
                        Movimiento - {selectedItem.name}
                      </GradientText>
                    </h3>
                    <button
                      onClick={() => setExpandedSection(null)}
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      <ChevronUp className="w-5 h-5" />
                    </button>
                  </div>

                  <form onSubmit={handleMovementSubmit} className="space-y-6">
                    {/* Información del movimiento */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Tipo de Movimiento</label>
                        <select
                          value={movementData.type}
                          onChange={(e) => setMovementData({...movementData, type: e.target.value})}
                          className="glassmorphism-select w-full shadow-xl shadow-blue-500/20"
                        >
                          <option value="entry">Entrada</option>
                          <option value="exit">Salida</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Cantidad</label>
                        <input
                          type="number"
                          value={movementData.quantity}
                          onChange={(e) => setMovementData({...movementData, quantity: e.target.value})}
                          className="glassmorphism-input w-full shadow-xl shadow-blue-500/20"
                          min="1"
                          placeholder="0"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Motivo</label>
                        <input
                          type="text"
                          value={movementData.reason}
                          onChange={(e) => setMovementData({...movementData, reason: e.target.value})}
                          className="glassmorphism-input w-full shadow-xl shadow-blue-500/20"
                          placeholder="Ej: Compra, Devolución, Ajuste"
                          required
                        />
                      </div>
                    </div>

                    {/* Campos de costo - solo para entradas */}
                    {movementData.type === 'entry' && (
                      <div className="bg-green-500/5 border border-green-500/20 rounded-lg p-4 space-y-4">
                        <h4 className="text-sm font-medium text-green-300 mb-2 flex items-center gap-2">
                          <DollarSign size={16} />
                          Información de Costo (Opcional)
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                              Costo Total
                              <span className="text-gray-500 text-xs ml-1">(Se registrará como gasto automáticamente)</span>
                            </label>
                            <input
                              type="number"
                              value={movementData.cost}
                              onChange={(e) => setMovementData({...movementData, cost: e.target.value})}
                              className="glassmorphism-input w-full shadow-xl shadow-blue-500/20"
                              min="0"
                              step="0.01"
                              placeholder="0.00"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Método de Pago</label>
                            <select
                              value={movementData.paymentMethod}
                              onChange={(e) => setMovementData({...movementData, paymentMethod: e.target.value})}
                              className="glassmorphism-select w-full shadow-xl shadow-blue-500/20"
                            >
                              {paymentMethods.map(method => (
                                <option key={method.id} value={method.id}>
                                  {method.emoji} {method.name}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Notas adicionales */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Notas Adicionales 
                        <span className="text-gray-500 text-xs ml-1">(Opcional)</span>
                      </label>
                      <textarea
                        value={movementData.notes}
                        onChange={(e) => setMovementData({...movementData, notes: e.target.value})}
                        className="glassmorphism-textarea w-full shadow-xl shadow-blue-500/20"
                        rows="3"
                        placeholder="Observaciones adicionales del movimiento..."
                      />
                    </div>

                    {/* Información del producto seleccionado */}
                    <div className="bg-blue-500/5 border border-blue-500/20 rounded-lg p-4">
                      <h4 className="text-sm font-medium text-blue-300 mb-2">Producto Seleccionado</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
                        <div>
                          <span className="text-gray-400">Nombre:</span>
                          <span className="text-white ml-2">{selectedItem.name}</span>
                        </div>
                        <div>
                          <span className="text-gray-400">Stock Actual:</span>
                          <span className="text-white ml-2">{selectedItem.stock}</span>
                        </div>
                        <div>
                          <span className="text-gray-400">Categoría:</span>
                          <span className="text-white ml-2">{selectedItem.category?.replace('_', ' ').toUpperCase()}</span>
                        </div>
                      </div>
                    </div>

                    {/* Botones de acción */}
                    <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-white/10">
                      <GradientButton type="submit" className="text-sm px-6 py-3 w-full sm:w-auto shadow-xl shadow-blue-500/20">
                        Registrar Movimiento
                      </GradientButton>
                      <button
                        type="button"
                        onClick={() => setExpandedSection(null)}
                        className="px-6 py-3 w-full sm:w-auto bg-white/5 text-gray-300 rounded-lg hover:bg-white/10 transition-colors text-sm backdrop-blur-sm shadow-xl shadow-blue-500/20"
                      >
                        Cancelar
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Formulario de Ventas - Solo Admin */}
              {expandedSection === 'sale' && selectedItem && user?.role === 'admin' && (
                <div className="mx-4 mt-4 bg-white/5 border border-white/10 rounded-xl p-6 backdrop-blur-md shadow-2xl shadow-blue-500/20">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-6 gap-4">
                    <div>
                      <h3 className="text-lg font-semibold">
                        <GradientText className="text-lg font-semibold">
                          Venta - {selectedItem.name}
                        </GradientText>
                      </h3>
                      <div className="mt-2">
                        <span className="text-3xl font-bold text-green-400">
                          ${selectedItem.price || 0}
                        </span>
                        <span className="text-sm text-gray-400 ml-2">por unidad</span>
                      </div>
                    </div>
                    <button
                      onClick={() => setExpandedSection(null)}
                      className="text-gray-400 hover:text-white transition-colors lg:self-start"
                    >
                      <ChevronUp className="w-5 h-5" />
                    </button>
                  </div>

                  <form onSubmit={handleSaleSubmit} className="space-y-6">
                    {/* Información de la venta */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">Cantidad a Vender</label>
                          <input
                            type="number"
                            value={saleData.quantity}
                            onChange={(e) => setSaleData({...saleData, quantity: e.target.value})}
                            className="glassmorphism-input w-full text-lg text-center font-semibold shadow-xl shadow-blue-500/20"
                            min="1"
                            max={selectedItem.stock || selectedItem.currentStock || selectedItem.quantity || 0}
                            placeholder="0"
                            required
                          />
                          <p className="text-xs text-gray-400 mt-2 text-center">
                            Stock disponible: <span className="text-green-400 font-medium">{selectedItem.stock || selectedItem.currentStock || selectedItem.quantity || 0}</span> unidades
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-col justify-center">
                        <label className="block text-sm font-medium text-gray-300 mb-2">Total a Pagar</label>
                        <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/30 rounded-xl p-6 text-center backdrop-blur-sm shadow-xl shadow-green-500/20">
                          <div className="text-xs text-green-300 mb-1">Total</div>
                          <span className="text-4xl font-bold text-green-400">
                            ${((parseFloat(saleData.quantity) || 0) * (parseFloat(selectedItem.price) || 0)).toFixed(2)}
                          </span>
                          <div className="text-xs text-gray-400 mt-2">
                            {saleData.quantity || 0} × ${selectedItem.price || 0}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Información del producto */}
                    <div className="bg-blue-500/5 border border-blue-500/20 rounded-lg p-4">
                      <h4 className="text-sm font-medium text-blue-300 mb-3">Detalles del Producto</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
                        <div>
                          <span className="text-gray-400">Precio unitario:</span>
                          <span className="text-green-400 ml-2 font-semibold">${selectedItem.price || 0}</span>
                        </div>
                        <div>
                          <span className="text-gray-400">Categoría:</span>
                          <span className="text-white ml-2">{selectedItem.category?.replace('_', ' ').toUpperCase()}</span>
                        </div>
                        <div>
                          <span className="text-gray-400">Stock después:</span>
                          <span className="text-blue-400 ml-2 font-semibold">
                            {(selectedItem.stock || 0) - (parseInt(saleData.quantity) || 0)} unidades
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Botones de acción */}
                    <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-white/10">
                      <GradientButton type="submit" className="text-sm px-6 py-3 w-full sm:w-auto shadow-xl shadow-green-500/20">
                        <div className="flex items-center justify-center gap-2">
                          <Package2 className="w-4 h-4" />
                          <span>Registrar Venta</span>
                        </div>
                      </GradientButton>
                      <button
                        type="button"
                        onClick={() => setExpandedSection(null)}
                        className="px-6 py-3 w-full sm:w-auto bg-white/5 text-gray-300 rounded-lg hover:bg-white/10 transition-colors text-sm backdrop-blur-sm shadow-xl shadow-blue-500/20"
                      >
                        Cancelar
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Formulario de Conteo */}
              {expandedSection === 'count' && selectedItem && (
                <div className="mx-4 mt-4 bg-white/5 border border-white/10 rounded-xl p-6 backdrop-blur-md shadow-2xl shadow-yellow-500/20">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-6 gap-4">
                    <div>
                      <h3 className="text-lg font-semibold">
                        <GradientText className="text-lg font-semibold">
                          Conteo de Stock - {selectedItem.name}
                        </GradientText>
                      </h3>
                      <div className="mt-2 text-sm text-gray-400">
                        <div>Stock Esperado: <span className="text-purple-400 font-medium">{selectedItem.initialStock + (selectedItem.entries || 0) - (selectedItem.exits || 0) - (selectedItem.sales || 0)}</span></div>
                        <div>Stock Actual: <span className="text-blue-400 font-medium">{selectedItem.realStock || selectedItem.stock || 0}</span></div>
                      </div>
                    </div>
                    <button
                      onClick={() => setExpandedSection(null)}
                      className="text-gray-400 hover:text-white transition-colors lg:self-start"
                    >
                      <ChevronUp className="w-5 h-5" />
                    </button>
                  </div>

                  <form onSubmit={handleCountSubmit} className="space-y-6">
                    {/* Información del conteo */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Stock Físico Contado</label>
                        <input
                          type="number"
                          value={countData.realStock}
                          onChange={(e) => setCountData({...countData, realStock: e.target.value})}
                          className="glassmorphism-input w-full text-lg text-center font-semibold shadow-xl shadow-blue-500/20"
                          min="0"
                          placeholder="Ingrese stock real"
                          required
                        />
                        <p className="text-xs text-gray-400 mt-1 text-center">Stock verificado físicamente</p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Entradas Adicionales</label>
                        <input
                          type="number"
                          value={countData.entries}
                          onChange={(e) => setCountData({...countData, entries: e.target.value})}
                          className="glassmorphism-input w-full text-lg text-center shadow-xl shadow-blue-500/20"
                          min="0"
                          placeholder="0"
                        />
                        <p className="text-xs text-gray-400 mt-1 text-center">Productos recibidos</p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Salidas Adicionales</label>
                        <input
                          type="number"
                          value={countData.exits}
                          onChange={(e) => setCountData({...countData, exits: e.target.value})}
                          className="glassmorphism-input w-full text-lg text-center shadow-xl shadow-blue-500/20"
                          min="0"
                          placeholder="0"
                        />
                        <p className="text-xs text-gray-400 mt-1 text-center">Productos enviados</p>
                      </div>
                    </div>

                    {/* Comparativa de stocks */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4 bg-yellow-500/5 border border-yellow-500/20 rounded-lg">
                      <div className="text-center">
                        <div className="text-xs text-gray-400 mb-1">Stock Esperado</div>
                        <div className="text-lg font-bold text-purple-400">
                          {selectedItem.initialStock + (selectedItem.entries || 0) - (selectedItem.exits || 0) - (selectedItem.sales || 0)}
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs text-gray-400 mb-1">Stock Actual</div>
                        <div className="text-lg font-bold text-blue-400">
                          {selectedItem.realStock || selectedItem.stock || 0}
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs text-gray-400 mb-1">Diferencia</div>
                        <div className={`text-lg font-bold ${
                          ((selectedItem.realStock || selectedItem.stock || 0) - (selectedItem.initialStock + (selectedItem.entries || 0) - (selectedItem.exits || 0) - (selectedItem.sales || 0))) >= 0 
                            ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {((selectedItem.realStock || selectedItem.stock || 0) - (selectedItem.initialStock + (selectedItem.entries || 0) - (selectedItem.exits || 0) - (selectedItem.sales || 0))) >= 0 ? '+' : ''}
                          {(selectedItem.realStock || selectedItem.stock || 0) - (selectedItem.initialStock + (selectedItem.entries || 0) - (selectedItem.exits || 0) - (selectedItem.sales || 0))}
                        </div>
                      </div>
                    </div>

                    {/* Notas del conteo */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Notas del Conteo 
                        <span className="text-gray-500 text-xs ml-1">(Opcional)</span>
                      </label>
                      <textarea
                        value={countData.notes}
                        onChange={(e) => setCountData({...countData, notes: e.target.value})}
                        className="glassmorphism-textarea w-full shadow-xl shadow-blue-500/20"
                        rows="3"
                        placeholder="Observaciones del conteo, discrepancias encontradas, etc."
                      />
                    </div>

                    {/* Botones de acción */}
                    <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-white/10">
                      <GradientButton type="submit" className="text-sm px-6 py-3 w-full sm:w-auto shadow-xl shadow-yellow-500/20">
                        <div className="flex items-center justify-center gap-2">
                          <Calculator className="w-4 h-4" />
                          <span>Guardar Conteo</span>
                        </div>
                      </GradientButton>
                      <button
                        type="button"
                        onClick={() => setExpandedSection(null)}
                        className="px-6 py-3 w-full sm:w-auto bg-white/5 text-gray-300 rounded-lg hover:bg-white/10 transition-colors text-sm backdrop-blur-sm shadow-xl shadow-blue-500/20"
                      >
                        Cancelar
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Header de tabla tipo Excel */}
              <div className="px-4 py-3 bg-gradient-to-r from-white/10 to-white/5 border-b border-white/20 backdrop-blur-sm shadow-xl shadow-blue-500/20">
                {/* Desktop Header */}
                <div className="hidden md:grid grid-cols-12 gap-2 text-xs font-semibold text-gray-200 uppercase tracking-wide">
                  <div className="col-span-2 text-purple-300">Producto</div>
                  <div className="col-span-1 text-center text-gray-300">Inicial</div>
                  <div className="col-span-1 text-center text-green-300">Entradas</div>
                  <div className="col-span-1 text-center text-red-300">Salidas</div>
                  <div className="col-span-1 text-center text-orange-300">Ventas</div>
                  <div className="col-span-1 text-center text-purple-300">Esperado</div>
                  <div className="col-span-1 text-center text-blue-300">Real</div>
                  <div className="col-span-1 text-center text-yellow-300">Diferencia</div>
                  <div className="col-span-1 text-center text-cyan-300">Estado</div>
                  <div className="col-span-2 text-center text-pink-300">Acciones</div>
                </div>
                {/* Mobile Header */}
                <div className="block md:hidden text-center">
                  <GradientText className="text-sm font-semibold">
                    Inventario de Productos
                  </GradientText>
                </div>
              </div>

              {/* Lista de productos */}
              {loading ? (
                <div className="p-8 text-center">
                  <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                  <p className="mt-2 text-gray-400 text-sm">Cargando...</p>
                </div>
              ) : filteredInventory.length === 0 ? (
                <div className="p-8 text-center">
                  <Package2 className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-400 text-sm">No hay productos en el inventario</p>
                </div>
              ) : (
                <div className="space-y-4 p-4">
                  {filteredInventory.map((item) => {
                    const stockStatus = getStockStatus(item);
                    const currentStock = item.stock || item.currentStock || item.quantity || 0;
                    const initialStock = item.initialStock || 0;
                    const entries = item.entries || 0;
                    const exits = item.exits || 0;
                    const sales = item.sales || 0; 
                    const minStock = item.minStock || 0;
                    const realStock = item.realStock || currentStock; // Stock real ingresado por barbero
                    // Stock esperado: lo que debería haber para diferencia = 0
                    const expectedStock = initialStock + entries - exits - sales;
                    // Diferencia: Stock real - Stock esperado
                    const difference = realStock - expectedStock;
                    
                    return (
                      <div key={item._id} className="bg-white/5 border border-white/10 rounded-xl px-4 py-4 md:py-3 hover:bg-white/10 hover:border-white/20 transition-all duration-300 backdrop-blur-sm shadow-lg shadow-blue-500/10 group">
                        {/* Desktop Layout */}
                        <div className="hidden md:grid grid-cols-12 gap-2 items-center">
                          {/* Producto */}
                          <div className="col-span-2">
                            <div className="space-y-1">
                              <GradientText className="font-semibold text-sm group-hover:text-purple-300 transition-colors">
                                {item.name}
                              </GradientText>
                              <p className="text-xs text-gray-400 capitalize">
                                {item.category?.replace('_', ' ')}
                              </p>
                            </div>
                          </div>
                          
                          {/* Stock Inicial */}
                          <div className="col-span-1 text-center">
                            <span className="px-2 py-1 bg-gray-600/20 text-gray-300 font-semibold text-sm rounded-md">{initialStock}</span>
                          </div>
                          
                          {/* Entradas */}
                          <div className="col-span-1 text-center">
                            <span className="px-2 py-1 bg-green-600/20 text-green-400 font-semibold text-sm rounded-md">{entries}</span>
                          </div>
                          
                          {/* Salidas */}
                          <div className="col-span-1 text-center">
                            <span className="px-2 py-1 bg-red-600/20 text-red-400 font-semibold text-sm rounded-md">{exits}</span>
                          </div>
                          
                          {/* Ventas */}
                          <div className="col-span-1 text-center">
                            <span className="px-2 py-1 bg-orange-600/20 text-orange-400 font-semibold text-sm rounded-md">{sales}</span>
                          </div>
                          
                          {/* Stock Esperado */}
                          <div className="col-span-1 text-center">
                            <span className="px-2 py-1 bg-purple-600/20 text-purple-400 font-semibold text-sm rounded-md">{expectedStock}</span>
                          </div>
                          
                          {/* Stock Real */}
                          <div className="col-span-1 text-center">
                            <span className="px-2 py-1 bg-blue-600/20 text-blue-400 font-semibold text-sm rounded-md">
                              {realStock}
                            </span>
                          </div>
                          
                          {/* Diferencia */}
                          <div className="col-span-1 text-center">
                            <span 
                              className={`px-2 py-1 font-semibold text-sm rounded-md cursor-help ${
                                difference === 0 ? 'bg-gray-600/20 text-gray-300' :
                                difference > 0 ? 'bg-green-600/20 text-green-400' : 
                                'bg-red-600/20 text-red-400'
                              }`}
                              title={
                                difference === 0 ? 'Inventario consistente' :
                                difference > 0 ? `Sobrante de ${difference} unidades` :
                                `Faltante de ${Math.abs(difference)} unidades. Puede deberse a reembolsos o conteos manuales.`
                              }
                            >
                              {difference === 0 ? 'OK' : 
                               difference > 0 ? `+${difference}` : 
                               `${difference}`}
                            </span>
                          </div>
                          
                          {/* Estado */}
                          <div className="col-span-1 text-center">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${stockStatus.bgColor} ${stockStatus.color}`}>
                              {stockStatus.status === 'out' ? 'Sin' : 
                               stockStatus.status === 'low' ? 'Bajo' : 'OK'}
                            </span>
                          </div>
                          
                          {/* Acciones */}
                          <div className="col-span-2 flex justify-center gap-1">
                            {user?.role === 'admin' ? (
                              <>
                                <button
                                  onClick={() => handleEdit(item)}
                                  className="p-2 bg-blue-600/20 text-blue-400 rounded-lg hover:bg-blue-600/30 transition-all duration-200 shadow-lg shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-500/30"
                                  title="Editar"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                
                                <button
                                  onClick={() => handleMovement(item)}
                                  className="p-2 bg-purple-600/20 text-purple-400 rounded-lg hover:bg-purple-600/30 transition-all duration-200 shadow-lg shadow-purple-500/20 hover:shadow-xl hover:shadow-purple-500/30"
                                  title="Movimiento"
                                >
                                  <RotateCcw className="w-4 h-4" />
                                </button>
                                
                                <button
                                  onClick={() => handleSale(item)}
                                  className="p-2 bg-green-600/20 text-green-400 rounded-lg hover:bg-green-600/30 transition-all duration-200 shadow-lg shadow-green-500/20 hover:shadow-xl hover:shadow-green-500/30"
                                  title="Venta"
                                >
                                  <ShoppingCart className="w-4 h-4" />
                                </button>
                                
                                <button
                                  onClick={() => handleDelete(item)}
                                  className="p-2 bg-red-600/20 text-red-400 rounded-lg hover:bg-red-600/30 transition-all duration-200 shadow-lg shadow-red-500/20 hover:shadow-xl hover:shadow-red-500/30"
                                  title="Eliminar"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </>
                            ) : (
                              <button
                                onClick={() => handleCount(item)}
                                className="p-2 bg-yellow-600/20 text-yellow-400 rounded-lg hover:bg-yellow-600/30 transition-all duration-200 shadow-lg shadow-yellow-500/20 hover:shadow-xl hover:shadow-yellow-500/30"
                                title="Conteo de Stock"
                              >
                                <Calculator className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Mobile Layout - Card Style */}
                        <div className="block md:hidden space-y-4">
                          {/* Producto Header */}
                          <div className="flex items-center justify-between pb-3 border-b border-white/10">
                            <div className="flex-1">
                              <GradientText className="font-semibold text-base group-hover:text-purple-300 transition-colors">
                                {item.name}
                              </GradientText>
                              <p className="text-sm text-gray-400 capitalize mt-1">
                                {item.category?.replace('_', ' ')}
                              </p>
                            </div>
                            <div className="ml-4">
                              <span className={`px-3 py-1.5 rounded-full text-sm font-medium ${stockStatus.bgColor} ${stockStatus.color}`}>
                                {stockStatus.status === 'out' ? 'Sin Stock' : 
                                 stockStatus.status === 'low' ? 'Stock Bajo' : 'En Stock'}
                              </span>
                            </div>
                          </div>

                          {/* Stock Information Grid */}
                          <div className="grid grid-cols-3 gap-3">
                            {/* Primera fila */}
                            <div>
                              <label className="text-xs font-medium text-gray-400 uppercase tracking-wide block text-center">Inicial</label>
                              <div className="mt-1">
                                <span className="px-2 py-1.5 bg-gray-600/20 text-gray-300 font-semibold text-xs rounded block text-center">{initialStock}</span>
                              </div>
                            </div>
                            <div>
                              <label className="text-xs font-medium text-green-400 uppercase tracking-wide block text-center">Entradas</label>
                              <div className="mt-1">
                                <span className="px-2 py-1.5 bg-green-600/20 text-green-400 font-semibold text-xs rounded block text-center">{entries}</span>
                              </div>
                            </div>
                            <div>
                              <label className="text-xs font-medium text-red-400 uppercase tracking-wide block text-center">Salidas</label>
                              <div className="mt-1">
                                <span className="px-2 py-1.5 bg-red-600/20 text-red-400 font-semibold text-xs rounded block text-center">{exits}</span>
                              </div>
                            </div>
                            
                            {/* Segunda fila */}
                            <div>
                              <label className="text-xs font-medium text-orange-400 uppercase tracking-wide block text-center">Ventas</label>
                              <div className="mt-1">
                                <span className="px-2 py-1.5 bg-orange-600/20 text-orange-400 font-semibold text-xs rounded block text-center">{sales}</span>
                              </div>
                            </div>
                            <div>
                              <label className="text-xs font-medium text-purple-400 uppercase tracking-wide block text-center">Esperado</label>
                              <div className="mt-1">
                                <span className="px-2 py-1.5 bg-purple-600/20 text-purple-400 font-semibold text-xs rounded block text-center">{expectedStock}</span>
                              </div>
                            </div>
                            <div>
                              <label className="text-xs font-medium text-blue-400 uppercase tracking-wide block text-center">Real</label>
                              <div className="mt-1">
                                <span className="px-2 py-1.5 bg-blue-600/20 text-blue-400 font-semibold text-xs rounded block text-center">{realStock}</span>
                              </div>
                            </div>
                          </div>

                          {/* Difference Row */}
                          <div className="pt-3 border-t border-white/10 flex justify-center">
                            <div className="text-center">
                              <label className="text-xs font-medium text-yellow-400 uppercase tracking-wide block">Diferencia</label>
                              <div className="mt-1">
                                <span className={`px-3 py-1.5 font-semibold text-xs rounded block text-center ${difference >= 0 ? 'bg-green-600/20 text-green-400' : 'bg-red-600/20 text-red-400'}`}>
                                  {difference > 0 ? '+' : ''}{difference}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="pt-4 border-t border-white/10">
                            <label className="text-xs font-medium text-pink-400 uppercase tracking-wide mb-3 block">Acciones</label>
                            <div className="flex justify-center gap-2">
                              {user?.role === 'admin' ? (
                                <>
                                  <button
                                    onClick={() => handleEdit(item)}
                                    className="p-2 bg-blue-600/20 text-blue-400 rounded-lg hover:bg-blue-600/30 transition-all duration-200 shadow-lg shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-500/30"
                                    title="Editar"
                                  >
                                    <Edit className="w-4 h-4" />
                                  </button>
                                  
                                  <button
                                    onClick={() => handleMovement(item)}
                                    className="p-2 bg-purple-600/20 text-purple-400 rounded-lg hover:bg-purple-600/30 transition-all duration-200 shadow-lg shadow-purple-500/20 hover:shadow-xl hover:shadow-purple-500/30"
                                    title="Movimiento"
                                  >
                                    <RotateCcw className="w-4 h-4" />
                                  </button>
                                  
                                  <button
                                    onClick={() => handleSale(item)}
                                    className="p-2 bg-green-600/20 text-green-400 rounded-lg hover:bg-green-600/30 transition-all duration-200 shadow-lg shadow-green-500/20 hover:shadow-xl hover:shadow-green-500/30"
                                    title="Venta"
                                  >
                                    <ShoppingCart className="w-4 h-4" />
                                  </button>
                                  
                                  <button
                                    onClick={() => handleDelete(item)}
                                    className="p-2 bg-red-600/20 text-red-400 rounded-lg hover:bg-red-600/30 transition-all duration-200 shadow-lg shadow-red-500/20 hover:shadow-xl hover:shadow-red-500/30"
                                    title="Eliminar"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </>
                              ) : (
                                <button
                                  onClick={() => handleCount(item)}
                                  className="p-2 bg-yellow-600/20 text-yellow-400 rounded-lg hover:bg-yellow-600/30 transition-all duration-200 shadow-lg shadow-yellow-500/20 hover:shadow-xl hover:shadow-yellow-500/30"
                                  title="Conteo de Stock"
                                >
                                  <Calculator className="w-4 h-4" />
                                </button>
                              )}
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
      </PageContainer>

      {/* Modal de Snapshot */}
      <InventorySnapshot
        isOpen={showSnapshotModal}
        onClose={() => setShowSnapshotModal(false)}
        inventory={inventory}
        onSnapshotCreated={handleSnapshotCreated}
        onInventoryReset={loadInventory}
      />

      {/* Modal de Inventarios Guardados */}
      <SavedInventoriesModal
        isOpen={showSavedInventoriesModal}
        onClose={() => setShowSavedInventoriesModal(false)}
      />

      {/* Modal de Historial de Inventario */}
      <InventoryLogsModal
        isOpen={showLogsModal}
        onClose={() => setShowLogsModal(false)}
        onRefresh={loadInventory}
      />

      {/* Modal de Confirmación de Eliminación */}
      {showDeleteModal && itemToDelete && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 sm:p-6 lg:p-8">
          <div className="relative w-full max-w-sm sm:max-w-md lg:max-w-lg mx-auto">
            <div className="relative backdrop-blur-md bg-red-500/5 border border-red-500/20 shadow-red-500/20 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
              {/* Header del modal */}
              <div className="relative z-10 flex-shrink-0 p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="p-1.5 sm:p-2 rounded-lg bg-red-500/20">
                      <XCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-400" />
                    </div>
                    <h3 className="text-base sm:text-lg font-semibold text-white">Eliminar Producto</h3>
                  </div>
                  <button
                    onClick={handleCancelDelete}
                    className="p-1 text-gray-400 hover:text-white transition-colors duration-200"
                  >
                    <XCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                </div>
              </div>

              {/* Contenido */}
              <div className="flex-1 px-4 sm:px-6 pb-4 sm:pb-6">
                <div className="space-y-3 sm:space-y-4">
                  {/* Información del producto */}
                  <div className="p-3 sm:p-4 bg-white/5 rounded-lg border border-white/10">
                    <p className="text-white/80 text-sm sm:text-base leading-relaxed mb-2">
                      ¿Estás seguro de que quieres eliminar este producto?
                    </p>
                    <div className="bg-white/10 rounded-lg p-3 border border-white/20">
                      <div className="flex items-center gap-3">
                        <Package2 className="w-5 h-5 text-blue-400 flex-shrink-0" />
                        <div>
                          <p className="text-white font-medium">{itemToDelete.name}</p>
                          <p className="text-white/60 text-sm">
                            {itemToDelete.category} • Stock: {itemToDelete.realStock || itemToDelete.stock || itemToDelete.currentStock || 0}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Textarea opcional para razón */}
                  <div className="relative">
                    <label className="block text-white/80 text-sm font-medium mb-2">
                      Motivo de eliminación (opcional)
                    </label>
                    <textarea
                      value={deletionReason}
                      onChange={(e) => setDeletionReason(e.target.value)}
                      placeholder="Escriba el motivo de la eliminación..."
                      className="glassmorphism-textarea h-20 sm:h-24 text-xs sm:text-sm shadow-xl shadow-red-500/20"
                      maxLength={200}
                    />
                    <div className="text-right text-xs text-white/60 mt-1">
                      {deletionReason.length}/200 caracteres
                    </div>
                  </div>
                  
                  <div className="flex justify-end gap-2 sm:gap-3 pt-2 sm:pt-4">
                    <button
                      onClick={handleCancelDelete}
                      className="px-3 sm:px-4 py-2 text-white/80 hover:text-white transition-all duration-200 text-xs sm:text-sm font-medium"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleConfirmDelete}
                      className="px-4 sm:px-6 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl hover:from-red-600 hover:to-red-700 transition-all duration-200 text-xs sm:text-sm font-medium shadow-lg"
                    >
                      Confirmar Eliminación
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Inventory;

