import React from 'react';
import { AlertTriangle, X, Trash2 } from 'lucide-react';

// Formatear precio
const formatPrice = (price) => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(price || 0);
};

const DeleteServiceModal = ({ 
  isOpen, 
  onClose, 
  service, 
  onDelete,
  isLoading = false 
}) => {
  const handleDelete = async () => {
    if (service) {
      await onDelete(service._id);
    }
  };

  if (!isOpen || !service) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-xl border border-gray-700 max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-500" />
            </div>
            <h3 className="text-xl font-semibold text-white">
              Eliminar Servicio
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-gray-300 mb-4">
            ¿Estás seguro de que deseas eliminar el servicio{' '}
            <span className="font-semibold text-white">"{service.name}"</span>?
          </p>
          
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-red-200">
                <p className="font-medium mb-1">Esta acción no se puede deshacer</p>
                <ul className="list-disc list-inside space-y-1 text-red-300">
                  <li>Se eliminará permanentemente de la base de datos</li>
                  <li>Las citas futuras con este servicio serán afectadas</li>
                  <li>Se removerá automáticamente de la página principal</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Service Info */}
          <div className="bg-gray-700/50 rounded-lg p-4 mb-6">
            <h4 className="text-white font-medium mb-2">Información del servicio:</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Nombre:</span>
                <span className="text-white">{service.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Precio:</span>
                <span className="text-white">{formatPrice(service.price)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Duración:</span>
                <span className="text-white">{service.duration} min</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Estado:</span>
                <span className={`${service.isActive ? 'text-green-400' : 'text-red-400'}`}>
                  {service.isActive ? 'Activo' : 'Inactivo'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">En Home:</span>
                <span className={`${service.showInHome ? 'text-blue-400' : 'text-gray-400'}`}>
                  {service.showInHome ? 'Sí' : 'No'}
                </span>
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 px-4 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              onClick={handleDelete}
              disabled={isLoading}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
              {isLoading ? 'Eliminando...' : 'Eliminar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteServiceModal;