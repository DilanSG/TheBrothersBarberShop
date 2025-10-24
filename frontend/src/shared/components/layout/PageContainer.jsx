import React from 'react';

export const PageContainer = ({ children, className = '' }) => {
  return (
    <div className={`relative min-h-screen w-full pt-10 sm:pt-12 bg-gradient-to-b from-black via-gray-900 to-black overflow-auto ${className}`} style={{ isolation: 'isolate' }}>
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
        {children}
      </div>
    </div>
  );
};
