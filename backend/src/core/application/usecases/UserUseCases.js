import { User, Barber } from '../../domain/entities/index.js';
import { AppError, logger } from '../../../barrel.js';
import DIContainer from '../../../shared/container/index.js';

/**
 * UserUseCases - Casos de uso para gestión de usuarios
 * ✅ MIGRACIÓN COMPLETA A REPOSITORY PATTERN
 * 
 * ESTADO DE MIGRACIÓN:
 * ✅ getUserById - Migrado a Repository Pattern
 * ✅ getAllUsers - Migrado a Repository Pattern 
 * ✅ updateUser - Migrado a Repository Pattern
 * ✅ deleteUser - Migrado a Repository Pattern  
 * ✅ changePassword - Migrado a Repository Pattern (híbrido)
 * ✅ getUserStats - Migrado a Repository Pattern (híbrido)
 */
class UserUseCases {
  constructor() {
    // Obtener repositorios del contenedor DI
    this.userRepository = DIContainer.get('UserRepository');
    this.barberRepository = DIContainer.get('BarberRepository');
    logger.debug('UserUseCases: Repositorios inyectados correctamente');
  }

  // Método estático para obtener instancia con DI
  static getInstance() {
    return new UserUseCases();
  }

  // ========================================================================
  // MÉTODOS COMPLETAMENTE MIGRADOS A REPOSITORY PATTERN (✅)
  // ========================================================================

  /**
   * Obtener todos los usuarios (✅ MIGRADO)
   * Usa Repository Pattern con filtros y paginación
   */
  async getAllUsers(filters = {}, select = '-password') {
    try {
      // Por defecto, solo mostrar usuarios activos (no desactivados)
      const query = { 
        isActive: { $ne: false }, // Incluye usuarios sin isActive definido y con isActive: true
        ...filters 
      };
      
      logger.debug('UserUseCases: Obteniendo lista de usuarios con filtros:', query);
      
      const result = await this.userRepository.findAll({ 
        filter: query,
        select: select,
        limit: filters.limit || 100, // Límite por defecto
        page: filters.page || 1
      });
      
      const users = result.data || result; // Compatibilidad con diferentes formatos de respuesta
      logger.debug(`UserUseCases: Recuperados ${users.length} usuarios activos`);
      return users;
    } catch (error) {
      logger.error('UserUseCases: Error al obtener usuarios:', error);
      throw new AppError('Error al obtener la lista de usuarios', 500);
    }
  }

  /**
   * Obtener usuario por ID (✅ MIGRADO)
   * Usa Repository Pattern con validación mejorada
   */
  async getUserById(userId, select = '-password') {
    try {
      logger.debug(`UserUseCases: Buscando usuario por ID: ${userId}`);
      
      const user = await this.userRepository.findById(userId);
      if (!user) {
        throw new AppError('Usuario no encontrado', 404);
      }
      
      logger.debug(`UserUseCases: Usuario encontrado: ${user._id}`);
      return user;
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error(`UserUseCases: Error al obtener usuario ${userId}:`, error);
      throw new AppError('Error al obtener usuario', 500);
    }
  }

  /**
   * Actualizar usuario (✅ MIGRADO)
   * Usa Repository Pattern con validación mejorada
   */
  async updateUser(userId, updateData, adminAction = false) {
    try {
      logger.debug(`UserUseCases: Iniciando actualización de usuario ${userId}`);
      
      // Verificar que el usuario existe usando repository
      const existingUser = await this.userRepository.findById(userId);
      if (!existingUser) {
        throw new AppError('Usuario no encontrado', 404);
      }

      // Lista de campos permitidos para actualización
      const allowedUpdates = ['name', 'email', 'phone', 'birthdate', 'profilePicture', 'preferences'];
      const adminAllowedUpdates = [...allowedUpdates, 'role', 'isActive'];

      // Filtrar actualizaciones permitidas
      const updates = {};
      Object.keys(updateData).forEach(key => {
        if ((adminAction && adminAllowedUpdates.includes(key)) || 
            (!adminAction && allowedUpdates.includes(key))) {
          updates[key] = updateData[key];
        }
      });

      logger.info(`UserUseCases: Campos a actualizar: ${Object.keys(updates).join(', ')}`);

      // Validar que hay actualizaciones
      if (Object.keys(updates).length === 0) {
        logger.warn('UserUseCases: No hay campos válidos para actualizar');
        return existingUser;
      }

      // Usar repository para actualizar
      const startTime = Date.now();
      const updatedUser = await this.userRepository.update(userId, updates);
      const duration = Date.now() - startTime;
      
      logger.info(`UserUseCases: Usuario actualizado exitosamente - ID: ${updatedUser._id}, Duración: ${duration}ms`);
      
      return updatedUser;
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error(`UserUseCases: Error actualizando usuario ${userId}:`, error);
      throw new AppError('Error al actualizar usuario', 500);
    }
  }

  /**
   * Eliminar usuario (✅ MIGRADO)
   * Usa Repository Pattern para desactivación
   */
  async deleteUser(userId) {
    try {
      logger.debug(`UserUseCases: Desactivando usuario ${userId}`);
      
      // Verificar que el usuario existe
      const existingUser = await this.userRepository.findById(userId);
      if (!existingUser) {
        throw new AppError('Usuario no encontrado', 404);
      }

      // En lugar de eliminar, desactivamos usando repository
      const deactivatedUser = await this.userRepository.update(userId, {
        isActive: false,
        deactivatedAt: new Date()
      });

      // Si es barbero, desactivar su perfil usando barber repository
      if (existingUser.role === 'barber') {
        await this.deactivateBarberProfile(userId);
      }

      logger.info(`UserUseCases: Usuario desactivado: ${userId}`);
      return deactivatedUser;
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error(`UserUseCases: Error desactivando usuario ${userId}:`, error);
      throw new AppError('Error al desactivar usuario', 500);
    }
  }

  /**
   * Cambiar contraseña (✅ MIGRADO HÍBRIDO)
   * Usa Repository Pattern para actualización, modelo para validación
   */
  async changePassword(userId, currentPassword, newPassword) {
    try {
      logger.debug(`UserUseCases: Cambiando contraseña para usuario ${userId}`);
      
      // Verificar que el usuario existe usando repository
      const user = await this.userRepository.findById(userId);
      if (!user) {
        throw new AppError('Usuario no encontrado', 404);
      }

      // Validar contraseña usando repository
      const isCurrentPasswordValid = await this.userRepository.validatePassword(userId, currentPassword);
      if (!isCurrentPasswordValid) {
        throw new AppError('La contraseña actual es incorrecta', 400);
      }

      // Actualizar la contraseña usando repository
      await this.userRepository.update(userId, { password: newPassword });

      logger.info(`UserUseCases: Contraseña actualizada para usuario ${userId}`);
      return true;
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error(`UserUseCases: Error cambiando contraseña del usuario ${userId}:`, error);
      throw new AppError('Error al cambiar contraseña', 500);
    }
  }

  /**
   * Obtener estadísticas de usuarios (✅ MIGRADO HÍBRIDO)
   * Usa Repository Pattern donde es posible, agregaciones directas donde es necesario
   */
  async getUserStats() {
    try {
      logger.debug('UserUseCases: Obteniendo estadísticas de usuarios');
      
      // Usar repository para conteos básicos
      const totalUsersResult = await this.userRepository.findAll({ 
        filter: { isActive: { $ne: false } }, 
        limit: 0 // Solo contar, no retornar datos
      });
      const totalUsers = totalUsersResult.total || 0;

      const activeUsersResult = await this.userRepository.findAll({ 
        filter: { 
          isActive: { $ne: false },
          lastActivity: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
        }, 
        limit: 0
      });
      const activeUsers = activeUsersResult.total || 0;
      
      // Para agregaciones complejas, usar modelo directamente (temporal)
      // TODO: Implementar método getStatsByRole en repository
      const usersByRole = await User.aggregate([
        { $match: { isActive: { $ne: false } } },
        { $group: { _id: '$role', count: { $sum: 1 } } }
      ]);

      const stats = {
        total: totalUsers,
        active: activeUsers,
        byRole: usersByRole.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {})
      };

      logger.debug('UserUseCases: Estadísticas obtenidas:', stats);
      return stats;
    } catch (error) {
      logger.error('UserUseCases: Error al obtener estadísticas:', error);
      throw new AppError('Error al obtener estadísticas', 500);
    }
  }

  // ========================================================================
  // ADAPTADORES DE COMPATIBILIDAD HACIA ATRÁS
  // ========================================================================

  static async getAllUsers(filters = {}, select = '-password') {
    const instance = UserUseCases.getInstance();
    return await instance.getAllUsers(filters, select);
  }

  static async getUserById(userId, select = '-password') {
    const instance = UserUseCases.getInstance();
    return await instance.getUserById(userId, select);
  }

  static async updateUser(userId, updateData, adminAction = false) {
    const instance = UserUseCases.getInstance();
    return await instance.updateUser(userId, updateData, adminAction);
  }

  static async deleteUser(userId) {
    const instance = UserUseCases.getInstance();
    return await instance.deleteUser(userId);
  }

  static async changePassword(userId, currentPassword, newPassword) {
    const instance = UserUseCases.getInstance();
    return await instance.changePassword(userId, currentPassword, newPassword);
  }

  static async getUserStats() {
    const instance = UserUseCases.getInstance();
    return await instance.getUserStats();
  }

  // ========================================================================
  // MÉTODOS AUXILIARES
  // ========================================================================

  /**
   * Desactivar perfil de barbero (✅ MIGRADO)
   * Usa BarberRepository para desactivación
   */
  async deactivateBarberProfile(userId) {
    try {
      logger.debug(`UserUseCases: Desactivando perfil de barbero para usuario ${userId}`);
      
      // Buscar barbero por userId usando repository
      const barbers = await this.barberRepository.findAll({ 
        filter: { userId },
        limit: 1
      });
      
      if (barbers.data && barbers.data.length > 0) {
        const barber = barbers.data[0];
        await this.barberRepository.update(barber._id, {
          isActive: false,
          deactivatedAt: new Date()
        });
        
        logger.info(`UserUseCases: Perfil de barbero desactivado para usuario ${userId}`);
      }
    } catch (error) {
      logger.error(`UserUseCases: Error desactivando perfil de barbero para usuario ${userId}:`, error);
      // No lanzamos error aquí para no bloquear la desactivación del usuario
    }
  }

  // Mantener versión estática por compatibilidad
  static async deactivateBarberProfile(userId) {
    const instance = UserUseCases.getInstance();
    return await instance.deactivateBarberProfile(userId);
  }
}

export default UserUseCases;