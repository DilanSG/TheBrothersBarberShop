import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '@components/layout/Navbar';
import Breadcrumbs from '@components/navigation/Breadcrumbs';
import { useRoutePreloader, useNavigationPerformance } from '@hooks/useRoutePreloader';
import { useCacheMonitor } from '@components/dev/CacheMonitor';
import { useAnalyticsDashboard } from '@components/dev/AnalyticsDashboard';
import { useNavigationAnalytics } from '@hooks/useNavigationAnalytics';
import { usePWA } from '@hooks/usePWA';

const MainLayout = () => {
  // Hooks para optimización de navegación
  useRoutePreloader(); // Activa el preloading automático
  useNavigationPerformance(); // Mide performance de navegación
  useNavigationAnalytics(); // Activa el sistema de analytics
  
  // PWA y funcionalidades offline
  const { isOnline, isInstallable, installPWA } = usePWA();
  
  // Monitores de desarrollo
  const { CacheMonitorComponent } = useCacheMonitor();
  const { AnalyticsDashboardComponent } = useAnalyticsDashboard();
  return (
    <div className="relative min-h-screen bg-gradient-to-b from-black via-gray-900 to-black overflow-hidden">
      {/* Background con efectos de gradientes sutiles */}
      <div className="absolute inset-0 bg-gradient-to-r from-red-900/3 via-blue-900/3 to-red-900/3"></div>
      
      {/* Efectos de puntos muy transparentes en toda la página */}
      <div className="absolute inset-0 opacity-10" style={{
        backgroundImage: `radial-gradient(circle, rgba(59, 130, 246, 0.15) 1px, transparent 1px)`,
        backgroundSize: '30px 30px',
        backgroundPosition: '0 0, 15px 15px'
      }}></div>
      
      <div className="absolute inset-0 opacity-8" style={{
        backgroundImage: `radial-gradient(circle, rgba(239, 68, 68, 0.12) 1px, transparent 1px)`,
        backgroundSize: '20px 20px',
        backgroundPosition: '10px 10px'
      }}></div>
      
      <div className="absolute inset-0 opacity-6" style={{
        backgroundImage: `radial-gradient(circle, rgba(168, 85, 247, 0.1) 0.8px, transparent 0.8px)`,
        backgroundSize: '40px 40px',
        backgroundPosition: '20px 0'
      }}></div>

      <div className="relative z-10">
        <Navbar />
        
        {/* Breadcrumbs */}
        <div className="container mx-auto px-4 pt-4">
          <Breadcrumbs />
        </div>
        
        <main className="container mx-auto px-4 py-8 shadow-lg shadow-blue-500/20 rounded-lg">
          <Outlet />
        </main>
        
        {/* Indicador de estado de conexión */}
        {!isOnline && (
          <div className="fixed bottom-4 right-1/2 transform translate-x-1/2 z-40 bg-red-500/90 backdrop-blur-md border border-red-400/50 rounded-xl px-4 py-2 text-white text-sm font-medium shadow-2xl">
            📵 Sin conexión - Trabajando offline
          </div>
        )}
        
        {/* Botón de instalación PWA */}
        {isInstallable && (
          <div className="fixed bottom-4 left-4 z-40">
            <button
              onClick={installPWA}
              className="bg-blue-500/90 hover:bg-blue-600/90 backdrop-blur-md border border-blue-400/50 rounded-xl px-4 py-2 text-white text-sm font-medium shadow-2xl transition-all duration-300 hover:scale-105"
            >
              📱 Instalar App
            </button>
          </div>
        )}
        
        {/* Monitores de desarrollo */}
        <CacheMonitorComponent />
        <AnalyticsDashboardComponent />
      </div>
    </div>
  );
};

export default MainLayout;
