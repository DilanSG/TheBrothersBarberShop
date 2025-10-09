/**
 * User Use Cases - Repository Pattern Implementation
 * Casos de uso para gestión de usuarios usando Clean Architecture
 * Usa Repository Pattern para desacoplar la lógica de negocio del acceso a datos
 */

import { AppError } from '../../../shared/utils/errors.js';
import { logger } from '../../../shared/utils/logger.js';
import DIContainer from '../../../shared/container/index.js';

class UserUseCasesRepository {
  constructor() {
    // Inyección de dependencia del repositorio
    this.userRepository = DIContainer.get('UserRepository');
  }

  /**
   * Obtener todos los usuarios con filtros y paginación
   * @param {Object} options - Opciones de consulta
   * @returns {Promise<Object>} Lista paginada de usuarios
   */
  async getAllUsers(options = {}) {
    try {
      logger.info('Getting all users with repository pattern');
      
      const {
        page = 1,
        limit = 10,
        filters = {},
        sort = { createdAt: -1 }
      } = options;

      // Por defecto, solo mostrar usuarios activos
      const queryFilters = {
        isActive: { $ne: false },
        ...filters
      };

      const result = await this.userRepository.findAll({
        page,
        limit,
        sort,
        filters: queryFilters
      });

      logger.info(`Retrieved ${result.users.length} users out of ${result.total} total`);
      return result;
    } catch (error) {
      logger.error('Error getting all users:', error);
      throw new AppError('Error al obtener la lista de usuarios', 500);
    }
  }

  /**
   * Obtener usuario por ID
   * @param {string} userId - ID del usuario
   * @returns {Promise<User>} Usuario encontrado
   */
  async getUserById(userId) {
    try {
      logger.info(`Getting user by ID: ${userId}`);
      
      const user = await this.userRepository.findById(userId);
      
      if (!user) {
        throw new AppError('Usuario no encontrado', 404);
      }

      logger.info(`User found: ${user.email}`);
      return user;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      
      logger.error(`Error getting user by ID ${userId}:`, error);
      throw new AppError('Error al obtener usuario', 500);
    }
  }

  /**
   * Obtener usuario por email
   * @param {string} email - Email del usuario
   * @returns {Promise<User>} Usuario encontrado
   */
  async getUserByEmail(email) {
    try {
      logger.info(`Getting user by email: ${email}`);
      
      const user = await this.userRepository.findByEmail(email);
      
      if (!user) {
        throw new AppError('Usuario no encontrado', 404);
      }

      return user;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      
      logger.error(`Error getting user by email ${email}:`, error);
      throw new AppError('Error al obtener usuario por email', 500);
    }
  }

  /**
   * Crear nuevo usuario
   * @param {Object} userData - Datos del usuario
   * @returns {Promise<User>} Usuario creado
   */
  async createUser(userData) {
    try {
      logger.info(`Creating new user: ${userData.email}`);

      // Validar que el email no exista
      const existingUser = await this.userRepository.findByEmail(userData.email);
      if (existingUser) {
        throw new AppError('Ya existe un usuario con este email', 400);
      }

      // Validar username si se proporciona
      if (userData.username) {
        const existingUsername = await this.userRepository.findByUsername(userData.username);
        if (existingUsername) {
          throw new AppError('Ya existe un usuario con este nombre de usuario', 400);
        }
      }

      // Crear usuario usando repositorio
      const user = await this.userRepository.create(userData);

      logger.info(`User created successfully: ${user._id}`);
      return user;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      
      logger.error('Error creating user:', error);
      throw new AppError('Error al crear usuario', 500);
    }
  }

  /**
   * Actualizar usuario existente
   * @param {string} userId - ID del usuario
   * @param {Object} updateData - Datos a actualizar
   * @param {boolean} adminAction - Si es acción administrativa
   * @returns {Promise<User>} Usuario actualizado
   */
  async updateUser(userId, updateData, adminAction = false) {
    const startTime = Date.now();
    
    try {
      logger.info(`Updating user: ${userId}`);

      // Verificar que el usuario existe
      const existingUser = await this.getUserById(userId);

      // Lista de campos permitidos para actualización
      const allowedUpdates = ['name', 'email', 'phone', 'birthdate', 'profilePicture', 'preferences'];
      const adminAllowedUpdates = [...allowedUpdates, 'role', 'isActive'];

      // Filtrar actualizaciones permitidas
      const allowedFields = adminAction ? adminAllowedUpdates : allowedUpdates;
      const filteredData = {};

      for (const key in updateData) {
        if (allowedFields.includes(key)) {
          filteredData[key] = updateData[key];
        }
      }

      // Validar email único si se está actualizando
      if (filteredData.email && filteredData.email !== existingUser.email) {
        const emailExists = await this.userRepository.findByEmail(filteredData.email);
        if (emailExists) {
          throw new AppError('Ya existe un usuario con este email', 400);
        }
      }

      // Actualizar usuario usando repositorio
      const updatedUser = await this.userRepository.update(userId, filteredData);

      const duration = Date.now() - startTime;
      logger.info(`User updated successfully in ${duration}ms: ${userId}`);
      
      return updatedUser;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      
      logger.error(`Error updating user ${userId}:`, error);
      throw new AppError('Error al actualizar usuario', 500);
    }
  }

  /**
   * Eliminar usuario (soft delete)
   * @param {string} userId - ID del usuario
   * @returns {Promise<boolean>} Resultado de la operación
   */
  async deleteUser(userId) {
    try {
      logger.info(`Deleting user: ${userId}`);

      // Verificar que el usuario existe
      await this.getUserById(userId);

      // Realizar soft delete (marcar como inactivo)
      await this.userRepository.update(userId, { isActive: false });

      logger.info(`User soft deleted successfully: ${userId}`);
      return true;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      
      logger.error(`Error deleting user ${userId}:`, error);
      throw new AppError('Error al eliminar usuario', 500);
    }
  }

  /**
   * Eliminar usuario permanentemente (hard delete)
   * @param {string} userId - ID del usuario
   * @returns {Promise<boolean>} Resultado de la operación
   */
  async permanentDeleteUser(userId) {
    try {
      logger.info(`Permanently deleting user: ${userId}`);

      // Verificar que el usuario existe
      await this.getUserById(userId);

      // Eliminar permanentemente usando repositorio
      const result = await this.userRepository.delete(userId);

      logger.info(`User permanently deleted: ${userId}`);
      return result;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      
      logger.error(`Error permanently deleting user ${userId}:`, error);
      throw new AppError('Error al eliminar permanentemente el usuario', 500);
    }
  }

  /**
   * Verificar si un usuario existe
   * @param {string} userId - ID del usuario
   * @returns {Promise<boolean>} True si existe, false si no
   */
  async userExists(userId) {
    try {
      return await this.userRepository.exists(userId);
    } catch (error) {
      logger.error(`Error checking user existence ${userId}:`, error);
      return false;
    }
  }

  /**
   * Contar usuarios con filtros
   * @param {Object} filters - Filtros de búsqueda
   * @returns {Promise<number>} Cantidad de usuarios
   */
  async countUsers(filters = {}) {
    try {
      const queryFilters = {
        isActive: { $ne: false },
        ...filters
      };

      return await this.userRepository.count(queryFilters);
    } catch (error) {
      logger.error('Error counting users:', error);
      throw new AppError('Error al contar usuarios', 500);
    }
  }

  /**
   * Actualizar contraseña del usuario
   * @param {string} userId - ID del usuario
   * @param {string} newPassword - Nueva contraseña
   * @returns {Promise<boolean>} Resultado de la operación
   */
  async updatePassword(userId, newPassword) {
    try {
      logger.info(`Updating password for user: ${userId}`);

      // Verificar que el usuario existe
      await this.getUserById(userId);

      // Actualizar contraseña usando repositorio
      const result = await this.userRepository.updatePassword(userId, newPassword);

      logger.info(`Password updated successfully for user: ${userId}`);
      return result;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      
      logger.error(`Error updating password for user ${userId}:`, error);
      throw new AppError('Error al actualizar contraseña', 500);
    }
  }

  /**
   * Buscar usuarios por email (con contraseña para autenticación)
   * @param {string} email - Email del usuario
   * @returns {Promise<User>} Usuario con contraseña
   */
  async findUserForAuthentication(email) {
    try {
      logger.info(`Finding user for authentication: ${email}`);
      
      // Usar método especial que incluye contraseña
      const user = await this.userRepository.findByEmailWithPassword(email);
      
      if (!user) {
        throw new AppError('Usuario no encontrado', 404);
      }

      return user;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      
      logger.error(`Error finding user for authentication ${email}:`, error);
      throw new AppError('Error al buscar usuario para autenticación', 500);
    }
  }
}

// Exportar instancia singleton
const userUseCasesRepository = new UserUseCasesRepository();
export default userUseCasesRepository;