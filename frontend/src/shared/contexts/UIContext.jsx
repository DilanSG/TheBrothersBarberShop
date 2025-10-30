import { createContext, useContext, useState, useCallback } from 'react';
import { toast } from 'react-toastify';

const UIContext = createContext();

export function UIProvider({ children }) {
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState({});
  const [modals, setModals] = useState({});

  // Manejo de temas
  const toggleTheme = useCallback(() => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.classList.toggle('dark');
  }, [theme]);

  // Manejo de loading states
  const setLoadingState = useCallback((key, isLoading) => {
    setLoading(prev => ({ ...prev, [key]: isLoading }));
  }, []);

  // Manejo de modales
  const openModal = useCallback((modalId, data = {}) => {
    setModals(prev => ({ ...prev, [modalId]: { isOpen: true, data } }));
  }, []);

  const closeModal = useCallback((modalId) => {
    setModals(prev => ({ ...prev, [modalId]: { isOpen: false, data: {} } }));
  }, []);

  // Notificaciones mejoradas
  const notify = useCallback(({ type = 'info', message, title, duration = 3000 }) => {
    toast[type](
      <div className="flex flex-col">
        {title && <span className="font-semibold mb-1">{title}</span>}
        <span>{message}</span>
      </div>,
      {
        position: "top-right",
        autoClose: duration,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        className: `${theme === 'dark' ? 'dark-toast' : ''}`
      }
    );
  }, [theme]);

  // Error boundaries
  const handleError = useCallback((error, context = '') => {
    console.error(`Error en ${context}:`, error);
    notify({
      type: 'error',
      title: 'Error',
      message: error.message || 'Ha ocurrido un error inesperado'
    });
  }, [notify]);

  const value = {
    // Theme
    theme,
    toggleTheme,
    // Loading
    loading,
    setLoadingState,
    // Modals
    modals,
    openModal,
    closeModal,
    // Sidebar
    sidebarOpen,
    setSidebarOpen,
    // Notifications
    notify,
    handleError
  };

  return (
    <UIContext.Provider value={value}>
      {children}
    </UIContext.Provider>
  );
}

export function useUI() {
  const context = useContext(UIContext);
  if (!context) {
    throw new Error('useUI debe ser usado dentro de un UIProvider');
  }
  return context;
}
