import React, { useState, useEffect } from 'react';
import { Camera, Save, X, AlertTriangle, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import { inventorySnapshotService, inventoryService } from '../../services/api';
import GradientButton from '../ui/GradientButton';
import GradientText from '../ui/GradientText';

import logger from '../../utils/logger';
const InventorySnapshot = ({ 
  isOpen, 
  onClose, 
  inventory = [],
  onSnapshotCreated,
  onInventoryReset // Nuevo callback para notificar que se reinició el inventario
}) => {
  const { user } = useAuth();
  const { showSuccess, showError, showWarning } = useNotification();
  
  const [snapshotData, setSnapshotData] = useState({
    items: []
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Inicializar datos del snapshot cuando se abre el modal
  useEffect(() => {
    if (isOpen && inventory.length > 0) {
      const items = inventory.map(item => {
        const initialStock = item.initialStock || 0;
        const entries = item.entries || 0;
        const exits = item.exits || 0;
        const sales = item.sales || 0;
        const expectedStock = initialStock + entries - exits - sales;
        // Usar EXACTAMENTE la misma lógica que en el inventario principal
        const currentStock = item.stock || item.currentStock || item.quantity || 0;
        const realStock = item.realStock || currentStock;
        
        return {
          productId: item._id,
          productName: item.name || 'Sin nombre',
          category: item.category || 'Sin categoría',
          initialStock: initialStock,
          entries: entries,
          exits: exits,
          sales: sales,
          expectedStock: expectedStock,
          realStock: realStock,
          difference: realStock - expectedStock
        };
      });

      setSnapshotData({
        items
      });
    }
  }, [isOpen, inventory]);

  // Función para reiniciar el inventario después de guardar
  const resetInventoryAfterSnapshot = async () => {
    try {
      logger.debug('🔄 Reiniciando inventario después del snapshot...');
      // Mapear los datos originales del inventario para asegurar todos los campos obligatorios
      const resetData = snapshotData.items.map(item => {
        // Buscar el producto original en el inventario por _id
        const original = inventory.find(prod => prod._id === item.productId);
        if (!original) return null;
        return {
          productId: item.productId,
          name: original.name,
          code: original.code,
          category: original.category,
          price: original.price,
          description: original.description,
          minStock: original.minStock,
          unit: original.unit,
          // Reinicio de campos
          initialStock: item.realStock, // El stock real se convierte en el nuevo stock inicial
          entries: 0,
          exits: 0,
          sales: 0,
          realStock: item.realStock,
          stock: item.realStock // stock y realStock igualados
        };
      }).filter(Boolean);

      logger.debug('📦 Datos para reiniciar inventario:', resetData);

      // Llamar al servicio para actualizar todos los productos
      for (const item of resetData) {
        await inventoryService.updateInventoryItem(item.productId, {
          name: item.name,
          code: item.code,
          category: item.category,
          price: item.price,
          description: item.description,
          minStock: item.minStock,
          unit: item.unit,
          initialStock: item.initialStock,
          entries: item.entries,
          exits: item.exits,
          sales: item.sales,
          realStock: item.realStock,
          stock: item.stock
        });
      }

      logger.debug('✅ Inventario reiniciado exitosamente');
      
    } catch (error) {
      console.error('❌ Error al reiniciar inventario:', error);
      showError('Error al reiniciar el inventario: ' + error.message);
      throw error; // Re-lanzar para que el caller pueda manejar el error
    }
  };

  const handleSaveSnapshot = async () => {
    try {
      setSaving(true);

      // Validar que hay items
      if (snapshotData.items.length === 0) {
        showWarning('No hay productos para guardar en el snapshot');
        return;
      }

      logger.debug('📸 Guardando snapshot de inventario:', snapshotData);

      // 1. Primero guardar el snapshot
      const response = await inventorySnapshotService.createSnapshot(snapshotData);

      if (response.success) {
        logger.debug('✅ Snapshot guardado, ahora reiniciando inventario...');
        
        // 2. Después reiniciar el inventario
        await resetInventoryAfterSnapshot();
        
        showSuccess('Inventario guardado y reiniciado exitosamente');
        onSnapshotCreated && onSnapshotCreated();
        onInventoryReset && onInventoryReset(); // Notificar que se reinició el inventario
        onClose();
      }

    } catch (error) {
      console.error('❌ Error al guardar snapshot o reiniciar inventario:', error);
      showError(error.message || 'Error al guardar el snapshot de inventario');
    } finally {
      setSaving(false);
    }
  };

  const getDifferenceDisplay = (difference) => {
    if (difference > 0) {
      return {
        icon: <TrendingUp className="w-4 h-4 text-green-400" />,
        text: `+${difference}`,
        className: 'text-green-400 bg-green-900/30'
      };
    } else if (difference < 0) {
      return {
        icon: <TrendingDown className="w-4 h-4 text-red-400" />,
        text: difference.toString(),
        className: 'text-red-400 bg-red-900/30'
      };
    } else {
      return {
        icon: <Minus className="w-4 h-4 text-gray-400" />,
        text: '0',
        className: 'text-gray-400 bg-gray-900/30'
      };
    }
  };

  const totalDifference = snapshotData.items.reduce((sum, item) => sum + item.difference, 0);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Estilos CSS personalizados para scrollbar blanca con sombra azul */}
      <style>
        {`
          .custom-scrollbar::-webkit-scrollbar {
            width: 6px;
          }
          
          .custom-scrollbar::-webkit-scrollbar-track {
            background: transparent;
          }
          
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: #ffffff;
            border-radius: 3px;
            box-shadow: 0 0 6px rgba(59, 130, 246, 0.6), 0 0 12px rgba(59, 130, 246, 0.4);
          }
          
          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: #f3f4f6;
            box-shadow: 0 0 8px rgba(59, 130, 246, 0.8), 0 0 16px rgba(59, 130, 246, 0.5);
          }
          
          .custom-scrollbar {
            scrollbar-width: thin;
            scrollbar-color: #ffffff transparent;
          }
        `}
      </style>
      
      {/* Backdrop con el mismo fondo exacto de la página de inventario */}
      <div className="fixed inset-0 bg-gradient-to-b from-black via-gray-900 to-black overflow-hidden" onClick={onClose}>
        {/* Background con efectos de gradientes */}
        <div className="absolute inset-0 bg-gradient-to-r from-red-900/8 via-blue-900/8 to-red-900/8"></div>
        
        {/* Efectos de puntos en toda la página - múltiples capas */}
        <div className="absolute inset-0 opacity-40" style={{
          backgroundImage: `radial-gradient(circle, rgba(59, 130, 246, 0.3) 1px, transparent 1px)`,
          backgroundSize: '30px 30px',
          backgroundPosition: '0 0, 15px 15px'
        }}></div>
        
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: `radial-gradient(circle, rgba(239, 68, 68, 0.4) 1px, transparent 1px)`,
          backgroundSize: '20px 20px',
          backgroundPosition: '10px 10px'
        }}></div>
        
        <div className="absolute inset-0 opacity-15" style={{
          backgroundImage: `radial-gradient(circle, rgba(168, 85, 247, 0.5) 0.8px, transparent 0.8px)`,
          backgroundSize: '40px 40px',
          backgroundPosition: '20px 0'
        }}></div>
      </div>
      
      {/* Modal */}
      <div className="relative z-10 flex min-h-full items-center justify-center p-2 sm:p-4">
        <div className="bg-transparent border border-white/10 rounded-2xl backdrop-blur-sm shadow-2xl shadow-blue-500/20 w-full max-w-sm sm:max-w-md md:max-w-4xl lg:max-w-6xl h-[95vh] sm:h-[90vh] flex flex-col"
             onClick={(e) => e.stopPropagation()}>
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-6 border-b border-white/10 gap-4 sm:gap-0">
          <div className="flex items-center gap-3">
            <Camera className="w-5 h-5 sm:w-6 sm:h-6 text-blue-400" />
            <div>
              <GradientText className="text-lg sm:text-xl font-semibold">
                Guardar Inventario
              </GradientText>
              <p className="text-xs sm:text-sm text-gray-300">
                Registra el estado actual del inventario
              </p>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="text-xs sm:text-sm text-gray-300 order-2 sm:order-1">
              Total diferencia: 
              <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                totalDifference > 0 ? 'text-green-300 bg-green-900/30' :
                totalDifference < 0 ? 'text-red-300 bg-red-900/30' :
                'text-gray-300 bg-gray-900/30'
              }`}>
                {totalDifference > 0 ? '+' : ''}{totalDifference}
              </span>
            </div>
            
            <button
              onClick={onClose}
              className="p-1.5 sm:p-2 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-white order-1 sm:order-2 self-end sm:self-auto"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          
          {/* Desktop Table */}
          <div className="hidden md:block h-full overflow-auto custom-scrollbar">
            <table className="w-full">
              <thead className="bg-white/5 sticky top-0 backdrop-blur-sm">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Producto
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Inicial
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Entradas
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Salidas
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Ventas
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Stock Sistema
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Stock Real
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Diferencia
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {snapshotData.items.map((item, index) => {
                  const diff = getDifferenceDisplay(item.difference);
                  
                  return (
                    <tr key={item.productId} className="hover:bg-white/5 transition-colors">
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="font-medium text-white">
                          {item.productName}
                        </div>
                        <div className="text-xs text-gray-400 capitalize">
                          {item.category}
                        </div>
                      </td>
                      
                      <td className="px-4 py-4 whitespace-nowrap text-center">
                        <span className="font-medium text-gray-300">
                          {item.initialStock}
                        </span>
                      </td>
                      
                      <td className="px-4 py-4 whitespace-nowrap text-center">
                        <span className="font-medium text-green-400">
                          {item.entries}
                        </span>
                      </td>
                      
                      <td className="px-4 py-4 whitespace-nowrap text-center">
                        <span className="font-medium text-red-400">
                          {item.exits}
                        </span>
                      </td>
                      
                      <td className="px-4 py-4 whitespace-nowrap text-center">
                        <span className="font-medium text-orange-400">
                          {item.sales}
                        </span>
                      </td>
                      
                      <td className="px-4 py-4 whitespace-nowrap text-center">
                        <span className="font-medium text-purple-400">
                          {item.expectedStock}
                        </span>
                      </td>
                      
                      <td className="px-4 py-4 whitespace-nowrap text-center">
                        <span className="font-medium text-blue-400">
                          {item.realStock}
                        </span>
                      </td>
                      
                      <td className="px-4 py-4 whitespace-nowrap text-center">
                        <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${diff.className}`}>
                          {diff.icon}
                          {diff.text}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="block md:hidden h-full overflow-auto custom-scrollbar p-4 space-y-4">
            {snapshotData.items.map((item, index) => {
              const diff = getDifferenceDisplay(item.difference);
              
              return (
                <div key={item.productId} className="bg-white/5 border border-white/10 rounded-xl p-4 backdrop-blur-sm">
                  {/* Product Header */}
                  <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-3">
                    <div>
                      <h3 className="font-medium text-white text-sm">
                        {item.productName}
                      </h3>
                      <p className="text-xs text-gray-400 capitalize mt-1">
                        {item.category}
                      </p>
                    </div>
                    <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${diff.className}`}>
                      {diff.icon}
                      {diff.text}
                    </div>
                  </div>

                  {/* Stock Information Grid */}
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div>
                      <label className="text-xs font-medium text-gray-400 uppercase tracking-wide block">Inicial</label>
                      <div className="mt-1">
                        <span className="px-2 py-1 bg-gray-600/20 text-gray-300 font-semibold text-xs rounded block">{item.initialStock}</span>
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-green-400 uppercase tracking-wide block">Entradas</label>
                      <div className="mt-1">
                        <span className="px-2 py-1 bg-green-600/20 text-green-400 font-semibold text-xs rounded block">{item.entries}</span>
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-red-400 uppercase tracking-wide block">Salidas</label>
                      <div className="mt-1">
                        <span className="px-2 py-1 bg-red-600/20 text-red-400 font-semibold text-xs rounded block">{item.exits}</span>
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-orange-400 uppercase tracking-wide block">Ventas</label>
                      <div className="mt-1">
                        <span className="px-2 py-1 bg-orange-600/20 text-orange-400 font-semibold text-xs rounded block">{item.sales}</span>
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-purple-400 uppercase tracking-wide block">Sistema</label>
                      <div className="mt-1">
                        <span className="px-2 py-1 bg-purple-600/20 text-purple-400 font-semibold text-xs rounded block">{item.expectedStock}</span>
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-blue-400 uppercase tracking-wide block">Real</label>
                      <div className="mt-1">
                        <span className="px-2 py-1 bg-blue-600/20 text-blue-400 font-semibold text-xs rounded block">{item.realStock}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 sm:p-6 border-t border-white/10 bg-white/5 backdrop-blur-sm gap-4 sm:gap-0">
          <div className="text-xs sm:text-sm text-gray-300 order-2 sm:order-1">
            {snapshotData.items.length} productos • Registro del {new Date().toLocaleDateString('es-ES')}
          </div>
          
          <div className="flex items-center gap-3 order-1 sm:order-2 w-full sm:w-auto">
            <GradientButton
              onClick={onClose}
              variant="secondary"
              className="px-4 py-2 text-gray-200 flex-1 sm:flex-none"
            >
              Cancelar
            </GradientButton>
            
            <GradientButton
              onClick={handleSaveSnapshot}
              disabled={saving || snapshotData.items.length === 0}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 flex-1 sm:flex-none"
            >
              <div className="flex items-center gap-2">
                <Save className="w-4 h-4 flex-shrink-0" />
                <span className="hidden sm:inline">{saving ? 'Guardando...' : 'Guardar Inventario'}</span>
                <span className="sm:hidden">{saving ? 'Guardando...' : 'Guardar'}</span>
              </div>
            </GradientButton>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
};

export default InventorySnapshot;

