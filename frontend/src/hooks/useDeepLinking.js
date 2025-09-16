import { useEffect, useCallback, useRef, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

/**
 * Sistema de deep linking avanzado
 * Preserva estado completo de la aplicación en URLs compartibles
 */
class DeepLinkManager {
  constructor() {
    this.stateCache = new Map();
    this.urlPatterns = new Map();
    this.defaultStates = new Map();
    
    this.initializePatterns();
  }

  initializePatterns() {
    // Patrones de URL para diferentes rutas
    this.urlPatterns.set('/appointment', {
      preserveParams: ['barberId', 'serviceId', 'date', 'time', 'step'],
      stateKeys: ['selectedBarber', 'selectedService', 'selectedDate', 'selectedTime', 'currentStep'],
      generateUrl: (state) => {
        const params = new URLSearchParams();
        if (state.selectedBarber) params.set('barberId', state.selectedBarber);
        if (state.selectedService) params.set('serviceId', state.selectedService);
        if (state.selectedDate) params.set('date', state.selectedDate);
        if (state.selectedTime) params.set('time', state.selectedTime);
        if (state.currentStep) params.set('step', state.currentStep);
        return params.toString();
      }
    });

    this.urlPatterns.set('/admin/reports', {
      preserveParams: ['startDate', 'endDate', 'type', 'barberId', 'view'],
      stateKeys: ['dateRange', 'reportType', 'selectedBarber', 'viewMode'],
      generateUrl: (state) => {
        const params = new URLSearchParams();
        if (state.dateRange?.start) params.set('startDate', state.dateRange.start);
        if (state.dateRange?.end) params.set('endDate', state.dateRange.end);
        if (state.reportType) params.set('type', state.reportType);
        if (state.selectedBarber) params.set('barberId', state.selectedBarber);
        if (state.viewMode) params.set('view', state.viewMode);
        return params.toString();
      }
    });

    this.urlPatterns.set('/services', {
      preserveParams: ['category', 'sort', 'filter', 'search'],
      stateKeys: ['selectedCategory', 'sortOrder', 'filterOptions', 'searchTerm'],
      generateUrl: (state) => {
        const params = new URLSearchParams();
        if (state.selectedCategory) params.set('category', state.selectedCategory);
        if (state.sortOrder) params.set('sort', state.sortOrder);
        if (state.filterOptions) params.set('filter', JSON.stringify(state.filterOptions));
        if (state.searchTerm) params.set('search', state.searchTerm);
        return params.toString();
      }
    });

    this.urlPatterns.set('/barbers', {
      preserveParams: ['speciality', 'available', 'rating', 'location'],
      stateKeys: ['filterSpeciality', 'showAvailableOnly', 'minRating', 'selectedLocation'],
      generateUrl: (state) => {
        const params = new URLSearchParams();
        if (state.filterSpeciality) params.set('speciality', state.filterSpeciality);
        if (state.showAvailableOnly) params.set('available', 'true');
        if (state.minRating) params.set('rating', state.minRating.toString());
        if (state.selectedLocation) params.set('location', state.selectedLocation);
        return params.toString();
      }
    });

    this.urlPatterns.set('/profile', {
      preserveParams: ['tab', 'edit'],
      stateKeys: ['activeTab', 'editMode'],
      generateUrl: (state) => {
        const params = new URLSearchParams();
        if (state.activeTab) params.set('tab', state.activeTab);
        if (state.editMode) params.set('edit', 'true');
        return params.toString();
      }
    });
  }

  // Guardar estado en URL
  saveStateToUrl(path, state, navigate) {
    const pattern = this.urlPatterns.get(path);
    if (!pattern) return;

    try {
      const queryString = pattern.generateUrl(state);
      const newUrl = queryString ? `${path}?${queryString}` : path;
      
      // Solo actualizar si la URL ha cambiado
      const currentUrl = `${window.location.pathname}${window.location.search}`;
      if (newUrl !== currentUrl) {
        navigate(newUrl, { replace: true });
        console.log(`🔗 Deep link: State saved to URL - ${path}`);
      }
    } catch (error) {
      console.warn('Failed to save state to URL:', error);
    }
  }

  // Restaurar estado desde URL
  restoreStateFromUrl(path, searchParams) {
    const pattern = this.urlPatterns.get(path);
    if (!pattern) return null;

    try {
      const state = {};
      
      // Mapear parámetros URL a estado
      if (path === '/appointment') {
        if (searchParams.get('barberId')) state.selectedBarber = searchParams.get('barberId');
        if (searchParams.get('serviceId')) state.selectedService = searchParams.get('serviceId');
        if (searchParams.get('date')) state.selectedDate = searchParams.get('date');
        if (searchParams.get('time')) state.selectedTime = searchParams.get('time');
        if (searchParams.get('step')) state.currentStep = parseInt(searchParams.get('step'));
      } else if (path === '/admin/reports') {
        if (searchParams.get('startDate') && searchParams.get('endDate')) {
          state.dateRange = {
            start: searchParams.get('startDate'),
            end: searchParams.get('endDate')
          };
        }
        if (searchParams.get('type')) state.reportType = searchParams.get('type');
        if (searchParams.get('barberId')) state.selectedBarber = searchParams.get('barberId');
        if (searchParams.get('view')) state.viewMode = searchParams.get('view');
      } else if (path === '/services') {
        if (searchParams.get('category')) state.selectedCategory = searchParams.get('category');
        if (searchParams.get('sort')) state.sortOrder = searchParams.get('sort');
        if (searchParams.get('filter')) {
          try {
            state.filterOptions = JSON.parse(searchParams.get('filter'));
          } catch (e) {
            console.warn('Failed to parse filter options:', e);
          }
        }
        if (searchParams.get('search')) state.searchTerm = searchParams.get('search');
      } else if (path === '/barbers') {
        if (searchParams.get('speciality')) state.filterSpeciality = searchParams.get('speciality');
        if (searchParams.get('available')) state.showAvailableOnly = searchParams.get('available') === 'true';
        if (searchParams.get('rating')) state.minRating = parseFloat(searchParams.get('rating'));
        if (searchParams.get('location')) state.selectedLocation = searchParams.get('location');
      } else if (path === '/profile') {
        if (searchParams.get('tab')) state.activeTab = searchParams.get('tab');
        if (searchParams.get('edit')) state.editMode = searchParams.get('edit') === 'true';
      }

      // Solo devolver estado si tiene al menos una propiedad
      const hasState = Object.keys(state).length > 0;
      if (hasState) {
        console.log(`🔗 Deep link: State restored from URL - ${path}`, state);
        return state;
      }
    } catch (error) {
      console.warn('Failed to restore state from URL:', error);
    }

    return null;
  }

  // Generar URL compartible con estado completo
  generateShareableUrl(path, state) {
    const pattern = this.urlPatterns.get(path);
    if (!pattern) return `${window.location.origin}${path}`;

    const queryString = pattern.generateUrl(state);
    const fullUrl = queryString 
      ? `${window.location.origin}${path}?${queryString}`
      : `${window.location.origin}${path}`;

    return fullUrl;
  }

  // Validar si una URL es válida para restaurar estado
  isValidDeepLink(path, searchParams) {
    const pattern = this.urlPatterns.get(path);
    if (!pattern) return false;

    // Verificar que al menos un parámetro esperado está presente
    return pattern.preserveParams.some(param => searchParams.has(param));
  }

  // Cache temporal para mejorar performance
  cacheState(path, state) {
    this.stateCache.set(path, {
      state,
      timestamp: Date.now(),
      ttl: 5 * 60 * 1000 // 5 minutos
    });
  }

  getCachedState(path) {
    const cached = this.stateCache.get(path);
    if (!cached) return null;

    const isExpired = Date.now() - cached.timestamp > cached.ttl;
    if (isExpired) {
      this.stateCache.delete(path);
      return null;
    }

    return cached.state;
  }
}

// Instancia singleton
const deepLinkManager = new DeepLinkManager();

/**
 * Hook principal para deep linking
 */
export const useDeepLinking = (initialState = {}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const currentPath = location.pathname;
  const hasRestoredState = useRef(false);

  // Restaurar estado desde URL al montar el componente
  const restoreState = useCallback(() => {
    if (hasRestoredState.current) return null;

    // Verificar caché primero
    const cachedState = deepLinkManager.getCachedState(currentPath);
    if (cachedState) {
      console.log('🔗 Deep link: Using cached state');
      return cachedState;
    }

    // Restaurar desde URL
    const restoredState = deepLinkManager.restoreStateFromUrl(currentPath, searchParams);
    if (restoredState) {
      hasRestoredState.current = true;
      deepLinkManager.cacheState(currentPath, restoredState);
      return restoredState;
    }

    return null;
  }, [currentPath, searchParams]);

  // Guardar estado en URL
  const saveState = useCallback((state) => {
    deepLinkManager.saveStateToUrl(currentPath, state, navigate);
    deepLinkManager.cacheState(currentPath, state);
  }, [currentPath, navigate]);

  // Generar URL compartible
  const generateShareableUrl = useCallback((state) => {
    return deepLinkManager.generateShareableUrl(currentPath, state);
  }, [currentPath]);

  // Verificar si la URL actual es un deep link válido
  const isValidDeepLink = useCallback(() => {
    return deepLinkManager.isValidDeepLink(currentPath, searchParams);
  }, [currentPath, searchParams]);

  // Reset al cambiar de ruta
  useEffect(() => {
    hasRestoredState.current = false;
  }, [currentPath]);

  return {
    restoreState,
    saveState,
    generateShareableUrl,
    isValidDeepLink,
    hasUrlParams: searchParams.toString().length > 0
  };
};

/**
 * Hook especializado para formularios con deep linking
 */
export const useFormDeepLinking = (formId, defaultState = {}) => {
  const { restoreState, saveState, generateShareableUrl } = useDeepLinking();
  const [currentState, setCurrentState] = useState(defaultState);
  const hasInitialized = useRef(false);

  // Inicializar estado del formulario
  useEffect(() => {
    if (!hasInitialized.current) {
      const restoredState = restoreState();
      if (restoredState) {
        setCurrentState(prev => ({ ...prev, ...restoredState }));
      }
      hasInitialized.current = true;
    }
  }, [restoreState]);

  // Actualizar estado y URL
  const updateState = useCallback((updates) => {
    const newState = { ...currentState, ...updates };
    setCurrentState(newState);
    
    // Debounce para evitar demasiadas actualizaciones de URL
    const timeoutId = setTimeout(() => {
      saveState(newState);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [currentState, saveState]);

  // Generar URL para compartir el estado actual del formulario
  const getShareableUrl = useCallback(() => {
    return generateShareableUrl(currentState);
  }, [currentState, generateShareableUrl]);

  return {
    formState: currentState,
    updateState,
    getShareableUrl,
    resetState: () => setCurrentState(defaultState)
  };
};

/**
 * Hook para navegación con preservación de estado
 */
export const useStatefulNavigation = () => {
  const navigate = useNavigate();
  const { saveState } = useDeepLinking();

  const navigateWithState = useCallback((path, state = {}, options = {}) => {
    // Guardar estado antes de navegar
    if (Object.keys(state).length > 0) {
      deepLinkManager.cacheState(path, state);
    }

    navigate(path, options);
  }, [navigate]);

  return {
    navigateWithState,
    navigate
  };
};

export default deepLinkManager;
