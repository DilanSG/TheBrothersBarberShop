/**
 * Índice de Implementaciones Repository
 * Exportación centralizada de todas las implementaciones de repositorio
 * Capa de Infrastructure - Database Layer
 */

import UserRepositoryImpl from './UserRepositoryImpl.js';
import AppointmentRepositoryImpl from './AppointmentRepositoryImpl.js';
import ExpenseRepositoryImpl from './ExpenseRepositoryImpl.js';
import SaleRepositoryImpl from './SaleRepositoryImpl.js';
import InventoryRepositoryImpl from './InventoryRepositoryImpl.js';
import BarberRepositoryImpl from './BarberRepositoryImpl.js';

// Exportar todas las implementaciones
export {
  UserRepositoryImpl,
  AppointmentRepositoryImpl,
  ExpenseRepositoryImpl,
  SaleRepositoryImpl,
  InventoryRepositoryImpl,
  BarberRepositoryImpl
};

// Exportación por defecto para el contenedor de dependencias
export default {
  UserRepositoryImpl,
  AppointmentRepositoryImpl,
  ExpenseRepositoryImpl,
  SaleRepositoryImpl,
  InventoryRepositoryImpl,
  BarberRepositoryImpl
};