import { createContext, useContext, useReducer, useCallback } from 'react';
import { useUI } from './UIContext';

// Definir tipos de acciones
const ActionTypes = {
  SET_SERVICES: 'SET_SERVICES',
  SET_BARBERS: 'SET_BARBERS',
  UPDATE_BARBER: 'UPDATE_BARBER',
  SET_APPOINTMENTS: 'SET_APPOINTMENTS',
  UPDATE_APPOINTMENT: 'UPDATE_APPOINTMENT',
  SET_INVENTORY: 'SET_INVENTORY',
  UPDATE_INVENTORY_ITEM: 'UPDATE_INVENTORY_ITEM',
  CLEAR_STATE: 'CLEAR_STATE'
};

// Estado inicial
const initialState = {
  services: [],
  barbers: [],
  appointments: [],
  inventory: [],
  lastUpdated: {
    services: null,
    barbers: null,
    appointments: null,
    inventory: null
  }
};

// Reducer
function appReducer(state, action) {
  switch (action.type) {
    case ActionTypes.SET_SERVICES:
      return {
        ...state,
        services: action.payload,
        lastUpdated: { ...state.lastUpdated, services: Date.now() }
      };
    case ActionTypes.SET_BARBERS:
      return {
        ...state,
        barbers: action.payload,
        lastUpdated: { ...state.lastUpdated, barbers: Date.now() }
      };
    case ActionTypes.UPDATE_BARBER:
      return {
        ...state,
        barbers: state.barbers.map(barber => 
          barber._id === action.payload._id ? action.payload : barber
        )
      };
    case ActionTypes.SET_APPOINTMENTS:
      return {
        ...state,
        appointments: action.payload,
        lastUpdated: { ...state.lastUpdated, appointments: Date.now() }
      };
    case ActionTypes.UPDATE_APPOINTMENT:
      return {
        ...state,
        appointments: state.appointments.map(appointment =>
          appointment._id === action.payload._id ? action.payload : appointment
        )
      };
    case ActionTypes.SET_INVENTORY:
      return {
        ...state,
        inventory: action.payload,
        lastUpdated: { ...state.lastUpdated, inventory: Date.now() }
      };
    case ActionTypes.UPDATE_INVENTORY_ITEM:
      return {
        ...state,
        inventory: state.inventory.map(item =>
          item._id === action.payload._id ? action.payload : item
        )
      };
    case ActionTypes.CLEAR_STATE:
      return initialState;
    default:
      return state;
  }
}

const AppContext = createContext();

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const { handleError } = useUI();

  // Acciones
  const setServices = useCallback((services) => {
    dispatch({ type: ActionTypes.SET_SERVICES, payload: services });
  }, []);

  const setBarbers = useCallback((barbers) => {
    dispatch({ type: ActionTypes.SET_BARBERS, payload: barbers });
  }, []);

  const updateBarber = useCallback((barber) => {
    dispatch({ type: ActionTypes.UPDATE_BARBER, payload: barber });
  }, []);

  const setAppointments = useCallback((appointments) => {
    dispatch({ type: ActionTypes.SET_APPOINTMENTS, payload: appointments });
  }, []);

  const updateAppointment = useCallback((appointment) => {
    dispatch({ type: ActionTypes.UPDATE_APPOINTMENT, payload: appointment });
  }, []);

  const setInventory = useCallback((inventory) => {
    dispatch({ type: ActionTypes.SET_INVENTORY, payload: inventory });
  }, []);

  const updateInventoryItem = useCallback((item) => {
    dispatch({ type: ActionTypes.UPDATE_INVENTORY_ITEM, payload: item });
  }, []);

  const clearState = useCallback(() => {
    dispatch({ type: ActionTypes.CLEAR_STATE });
  }, []);

  // Helpers
  const needsUpdate = useCallback((key, maxAge = 300000) => {
    const lastUpdate = state.lastUpdated[key];
    return !lastUpdate || Date.now() - lastUpdate > maxAge;
  }, [state.lastUpdated]);

  const value = {
    // Estado
    services: state.services,
    barbers: state.barbers,
    appointments: state.appointments,
    inventory: state.inventory,
    // Acciones
    setServices,
    setBarbers,
    updateBarber,
    setAppointments,
    updateAppointment,
    setInventory,
    updateInventoryItem,
    clearState,
    // Helpers
    needsUpdate
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp debe ser usado dentro de un AppProvider');
  }
  return context;
}
