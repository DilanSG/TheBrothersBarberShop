import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, Info, CheckCircle, XCircle } from 'lucide-react';
import config from '../config/api.js';

const ConnectionStatus = ({ isVisible = false }) => {
  const [connectionInfo, setConnectionInfo] = useState(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [apiStatus, setApiStatus] = useState('checking');

  useEffect(() => {
    // Obtener información de conexión
    setConnectionInfo(config.getConnectionInfo());

    // Verificar conectividad del API
    const checkApiConnection = async () => {
      try {
        const response = await fetch(`${config.apiUrl}/health`, {
          method: 'GET',
          timeout: 5000
        });
        setApiStatus(response.ok ? 'connected' : 'error');
      } catch (error) {
        setApiStatus('error');
      }
    };

    checkApiConnection();

    // Listeners para cambios de conectividad
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!isVisible || !connectionInfo) return null;

  const getApiStatusIcon = () => {
    switch (apiStatus) {
      case 'connected':
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-400" />;
      default:
        return <Info className="w-4 h-4 text-yellow-400" />;
    }
  };

  const getApiStatusText = () => {
    switch (apiStatus) {
      case 'connected':
        return 'Conectado';
      case 'error':
        return 'Error de conexión';
      default:
        return 'Verificando...';
    }
  };

  return (
    <div className="fixed bottom-4 right-4 bg-gray-800/95 backdrop-blur-sm text-white p-4 rounded-lg shadow-lg max-w-sm z-50">
      <div className="flex items-center gap-2 mb-3">
        {isOnline ? (
          <Wifi className="w-5 h-5 text-green-400" />
        ) : (
          <WifiOff className="w-5 h-5 text-red-400" />
        )}
        <h3 className="font-medium">Estado de Conexión</h3>
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span>Internet:</span>
          <span className={isOnline ? 'text-green-400' : 'text-red-400'}>
            {isOnline ? 'Conectado' : 'Desconectado'}
          </span>
        </div>

        <div className="flex justify-between items-center">
          <span>API:</span>
          <div className="flex items-center gap-1">
            {getApiStatusIcon()}
            <span className={
              apiStatus === 'connected' ? 'text-green-400' : 
              apiStatus === 'error' ? 'text-red-400' : 'text-yellow-400'
            }>
              {getApiStatusText()}
            </span>
          </div>
        </div>

        <div className="border-t border-gray-600 pt-2 mt-2">
          <div className="text-xs text-gray-400">
            <div>Host: {connectionInfo.currentHost}</div>
            <div>Puerto: {connectionInfo.currentPort || '5173'}</div>
            <div>API URL: {connectionInfo.apiUrl}</div>
            <div>Tipo: {connectionInfo.isLocalhost ? 'Local' : 'Red'}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConnectionStatus;