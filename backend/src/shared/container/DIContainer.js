import { logger } from '../utils/logger.js';
import UserRepositoryImpl from '../../infrastructure/database/repositories/UserRepositoryImpl.js';
import AppointmentRepositoryImpl from '../../infrastructure/database/repositories/AppointmentRepositoryImpl.js';
import ExpenseRepositoryImpl from '../../infrastructure/database/repositories/ExpenseRepositoryImpl.js';
import SaleRepositoryImpl from '../../infrastructure/database/repositories/SaleRepositoryImpl.js';
import InventoryRepositoryImpl from '../../infrastructure/database/repositories/InventoryRepositoryImpl.js';
import BarberRepositoryImpl from '../../infrastructure/database/repositories/BarberRepositoryImpl.js';

class DIContainer {
  constructor() {
    this.dependencies = new Map();
    this._initialized = false;
  }
  
  _ensureInitialized() {
    if (!this._initialized) {
      this._registerRepositories();
      this._initialized = true;
      logger.info('DI Container inicializado (6 repositorios)');
    }
  }

  _registerRepositories() {
    try {
      this.dependencies.set('UserRepository', new UserRepositoryImpl());
      this.dependencies.set('AppointmentRepository', new AppointmentRepositoryImpl());
      this.dependencies.set('ExpenseRepository', new ExpenseRepositoryImpl());
      this.dependencies.set('SaleRepository', new SaleRepositoryImpl());
      this.dependencies.set('InventoryRepository', new InventoryRepositoryImpl());
      this.dependencies.set('BarberRepository', new BarberRepositoryImpl());
    } catch (error) {
      logger.error('Error registrando repositorios:', error);
      throw error;
    }
  }

  get(name) {
    this._ensureInitialized();
    
    if (!this.dependencies.has(name)) {
      logger.warn(`Dependencia '${name}' no encontrada en el contenedor DI`);
      throw new Error(`Dependencia '${name}' no está registrada`);
    }
    
    const dependency = this.dependencies.get(name);
    return dependency;
  }

  register(name, useCase) {
    this.dependencies.set(name, useCase);
  }

  list() {
    this._ensureInitialized();
    return Array.from(this.dependencies.keys());
  }

  has(name) {
    this._ensureInitialized();
    return this.dependencies.has(name);
  }

  clear() {
    this.dependencies.clear();
    this._initialized = false;
    logger.debug('Contenedor DI limpiado');
  }
}

const container = new DIContainer();
export default container;
