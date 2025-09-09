import React, { useState, useEffect } from 'react';
import { 
  X, 
  Download,
  FileText,
  Calendar,
  User,
  BarChart3,
  Trash2
} from 'lucide-react';
import { inventorySnapshotService } from '../services/api';
import GradientButton from './ui/GradientButton';
import GradientText from './ui/GradientText';
import { useNotification } from '../contexts/NotificationContext';

const SavedInventoriesModal = ({ isOpen, onClose }) => {
  const [snapshots, setSnapshots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState({});
  const [deleting, setDeleting] = useState({});
  const { showSuccess, showError } = useNotification();

  useEffect(() => {
    if (isOpen) {
      fetchSnapshots();
    }
  }, [isOpen]);

  const fetchSnapshots = async () => {
    try {
      setLoading(true);
      const response = await inventorySnapshotService.getSnapshots({ 
        limit: 50, 
        page: 1 
      });
      setSnapshots(response.data || []);
    } catch (error) {
      console.error('Error al cargar inventarios guardados:', error);
      showError('Error al cargar los inventarios guardados');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (snapshot) => {
    try {
      setDownloading(prev => ({ ...prev, [snapshot._id]: true }));
      
      const blob = await inventorySnapshotService.downloadSnapshot(snapshot._id);
      
      // Crear URL temporal para la descarga
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // Formatear fecha para el nombre del archivo
      const formattedDate = new Date(snapshot.date).toLocaleDateString('es-ES').replace(/\//g, '-');
      link.download = `inventario-guardado-${formattedDate}.xlsx`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Limpiar URL temporal
      window.URL.revokeObjectURL(url);
      
      showSuccess('Inventario descargado exitosamente');
    } catch (error) {
      console.error('Error al descargar inventario:', error);
      showError('Error al descargar el inventario');
    } finally {
      setDownloading(prev => ({ ...prev, [snapshot._id]: false }));
    }
  };

  const handleDelete = async (snapshot) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar este inventario guardado? Esta acción no se puede deshacer.')) {
      return;
    }

    try {
      setDeleting(prev => ({ ...prev, [snapshot._id]: true }));
      
      await inventorySnapshotService.deleteSnapshot(snapshot._id);
      
      // Actualizar la lista local removiendo el elemento eliminado
      setSnapshots(prev => prev.filter(s => s._id !== snapshot._id));
      
      showSuccess('Inventario eliminado exitosamente');
    } catch (error) {
      console.error('Error al eliminar inventario:', error);
      showError('Error al eliminar el inventario');
    } finally {
      setDeleting(prev => ({ ...prev, [snapshot._id]: false }));
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDifference = (difference) => {
    if (difference === 0) return { text: '0', color: 'text-gray-600' };
    if (difference > 0) return { text: `+${difference}`, color: 'text-green-600' };
    return { text: difference.toString(), color: 'text-red-600' };
  };

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
      <div className="relative z-10 flex min-h-full items-center justify-center p-4 py-8">
        <div className="relative w-full max-w-4xl max-h-[85vh] bg-transparent border border-white/10 rounded-2xl backdrop-blur-sm shadow-2xl shadow-blue-500/20 flex flex-col"
             onClick={(e) => e.stopPropagation()}>
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-white/10">
            <div className="flex items-center space-x-3">
              <FileText className="h-8 w-8 text-blue-400" />
              <div>
                <GradientText className="text-lg font-medium">
                  Inventarios Guardados
                </GradientText>
                <p className="text-sm text-gray-300">
                  Historial de inventarios registrados
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-hidden p-6 pt-2">{/* Reducir padding top para evitar overlap */}
            {/* Loading */}
            {loading && (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
                <span className="ml-2 text-gray-300">Cargando inventarios...</span>
              </div>
            )}

            {/* Empty State */}
            {!loading && snapshots.length === 0 && (
              <div className="text-center py-12">
                <FileText className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-white">
                  No hay inventarios guardados
                </h3>
                <p className="mt-1 text-sm text-gray-400">
                  Aún no se han registrado inventarios.
                </p>
              </div>
            )}

            {/* Snapshots List */}
            {!loading && snapshots.length > 0 && (
              <div 
                className="space-y-4 max-h-80 overflow-y-auto custom-scrollbar"
              >
                {snapshots.map((snapshot) => {
                  const difference = formatDifference(snapshot.totalDifference);
                  const isDownloading = downloading[snapshot._id];
                  const isDeleting = deleting[snapshot._id];
                  
                  return (
                    <div 
                      key={snapshot._id}
                      className="bg-white/5 rounded-lg p-4 border border-white/10 hover:bg-white/10 transition-colors backdrop-blur-sm"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-4 mb-2">
                            <div className="flex items-center text-sm text-gray-300">
                              <Calendar className="h-4 w-4 mr-1" />
                              {formatDate(snapshot.date)}
                            </div>
                            <div className="flex items-center text-sm text-gray-300">
                              <User className="h-4 w-4 mr-1" />
                              {snapshot.createdBy?.name || 'Usuario'}
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-6">
                            <div className="flex items-center text-sm">
                              <BarChart3 className="h-4 w-4 mr-1 text-blue-400" />
                              <span className="text-white font-medium">
                                {snapshot.totalItems} productos
                              </span>
                            </div>
                            
                            <div className="flex items-center text-sm">
                              <span className="text-white font-medium mr-1">Diferencia:</span>
                              <span className={`font-semibold ${difference.color === 'text-gray-600' ? 'text-gray-300' : difference.color === 'text-green-600' ? 'text-green-300' : 'text-red-300'}`}>
                                {difference.text}
                              </span>
                            </div>
                          </div>
                          
                          {snapshot.notes && (
                            <p className="text-sm text-gray-300 mt-2 italic">
                              "{snapshot.notes}"
                            </p>
                          )}
                        </div>
                        
                        <div className="ml-4 flex items-center gap-3">
                          <GradientButton
                            onClick={() => handleDownload(snapshot)}
                            disabled={isDownloading}
                            className="inline-flex items-center justify-center px-3 py-2 text-sm leading-4 font-medium"
                          >
                            {isDownloading ? (
                              <div className="flex items-center">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                <span>Descargando...</span>
                              </div>
                            ) : (
                              <div className="flex items-center">
                                <Download className="h-4 w-4 mr-2 flex-shrink-0" />
                                <span>Descargar</span>
                              </div>
                            )}
                          </GradientButton>
                          
                          <button
                            onClick={() => handleDelete(snapshot)}
                            disabled={isDeleting}
                            className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Eliminar inventario"
                          >
                            {isDeleting ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-400"></div>
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-end p-6 border-t border-white/10">
            <GradientButton
              type="button"
              onClick={onClose}
              variant="secondary"
              className="px-4 py-2 text-sm font-medium"
            >
              Cerrar
            </GradientButton>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SavedInventoriesModal;
