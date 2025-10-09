/**
 * Índice de Interfaces Repository
 * Exportación centralizada de todas las interfaces de repositorio
 * Implementa el patrón Repository de Clean Architecture
 */

import IUserRepository from './IUserRepository.js';
import IAppointmentRepository from './IAppointmentRepository.js';
import IExpenseRepository from './IExpenseRepository.js';
import ISaleRepository from './ISaleRepository.js';
import IInventoryRepository from './IInventoryRepository.js';
import IBarberRepository from './IBarberRepository.js';

// Exportar todas las interfaces
export {
  IUserRepository,
  IAppointmentRepository,
  IExpenseRepository,
  ISaleRepository,
  IInventoryRepository,
  IBarberRepository
};

// Exportación por defecto
export default {
  IUserRepository,
  IAppointmentRepository,
  IExpenseRepository,
  ISaleRepository,
  IInventoryRepository,
  IBarberRepository
};