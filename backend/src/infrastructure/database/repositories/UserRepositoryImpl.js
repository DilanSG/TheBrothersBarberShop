/**
 * User Repository Implementation
 * Implementación concreta del repositorio de usuarios usando Mongoose
 * Implementa IUserRepository de Clean Architecture
 */

import IUserRepository from '../../../core/domain/repositories/IUserRepository.js';
import { User, logger, AppError } from '../../../barrel.js';

class UserRepositoryImpl extends IUserRepository {
  /**
   * Buscar usuario por ID
   * @param {string} id - ID del usuario
   * @returns {Promise<User|null>}
   */
  async findById(id) {
    try {
      logger.database(`Searching user by ID: ${id}`);
      const user = await User.findById(id).select('-password');
      
      if (user) {
        logger.database(`User found: ${user.email}`);
      }
      
      return user;
    } catch (error) {
      logger.error(`Error finding user by ID ${id}:`, error);
      throw new AppError(`Error al buscar usuario: ${error.message}`, 500);
    }
  }

  /**
   * Buscar usuario por email
   * @param {string} email - Email del usuario
   * @returns {Promise<User|null>}
   */
  async findByEmail(email) {
    try {
      logger.database(`Searching user by email: ${email}`);
      const user = await User.findOne({ email: email.toLowerCase() });
      
      if (user) {
        logger.database(`User found by email: ${email}`);
      }
      
      return user;
    } catch (error) {
      logger.error(`Error finding user by email ${email}:`, error);
      throw new AppError(`Error al buscar usuario: ${error.message}`, 500);
    }
  }

  /**
   * Buscar todos los usuarios con filtros, paginación y ordenamiento
   * @param {Object} options - Opciones de búsqueda
   * @returns {Promise<Object>} - Objeto con datos y metadatos de paginación
   */
  async findAll(options = {}) {
    try {
      const {
        filter = {},
        limit = 10,
        page = 1,
        sort = { createdAt: -1 },
        select = '-password'
      } = options;

      logger.database(`Finding users with options:`, { filter, limit, page, sort });

      const skip = (page - 1) * limit;

      const [users, total] = await Promise.all([
        User.find(filter)
          .select(select)
          .sort(sort)
          .limit(limit)
          .skip(skip),
        User.countDocuments(filter)
      ]);

      const result = {
        data: users,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };

      logger.database(`Found ${users.length} users out of ${total} total`);
      return result;
    } catch (error) {
      logger.error('Error finding users:', error);
      throw new AppError(`Error al buscar usuarios: ${error.message}`, 500);
    }
  }

  /**
   * Crear nuevo usuario
   * @param {Object} userData - Datos del usuario
   * @returns {Promise<User>}
   */
  async create(userData) {
    try {
      logger.database(`Creating user with email: ${userData.email}`);
      
      // Verificar que el email no existe
      const existingUser = await this.findByEmail(userData.email);
      if (existingUser) {
        throw new AppError('El email ya está registrado', 400);
      }

      const newUser = new User(userData);
      const savedUser = await newUser.save();

      // Retornar sin contraseña
      const userResponse = await User.findById(savedUser._id).select('-password');
      
      logger.database(`User created successfully: ${userResponse.email}`);
      return userResponse;
    } catch (error) {
      logger.error(`Error creating user:`, error);
      
      if (error instanceof AppError) {
        throw error;
      }
      
      if (error.code === 11000) {
        throw new AppError('El email ya está registrado', 400);
      }
      
      throw new AppError(`Error al crear usuario: ${error.message}`, 500);
    }
  }

  /**
   * Actualizar usuario
   * @param {string} id - ID del usuario
   * @param {Object} updateData - Datos a actualizar
   * @returns {Promise<User>}
   */
  async update(id, updateData) {
    try {
      logger.database(`Updating user: ${id}`);

      // Si se está actualizando el email, verificar que no existe
      if (updateData.email) {
        const existingUser = await User.findOne({ 
          email: updateData.email.toLowerCase(),
          _id: { $ne: id }
        });
        
        if (existingUser) {
          throw new AppError('El email ya está registrado por otro usuario', 400);
        }
      }

      const updatedUser = await User.findByIdAndUpdate(
        id,
        { $set: updateData },
        { 
          new: true, 
          runValidators: true,
          select: '-password'
        }
      );

      if (!updatedUser) {
        throw new AppError('Usuario no encontrado', 404);
      }

      logger.database(`User updated successfully: ${updatedUser.email}`);
      return updatedUser;
    } catch (error) {
      logger.error(`Error updating user ${id}:`, error);
      
      if (error instanceof AppError) {
        throw error;
      }
      
      if (error.code === 11000) {
        throw new AppError('El email ya está registrado', 400);
      }
      
      throw new AppError(`Error al actualizar usuario: ${error.message}`, 500);
    }
  }

  /**
   * Eliminar usuario
   * @param {string} id - ID del usuario
   * @returns {Promise<boolean>}
   */
  async delete(id) {
    try {
      logger.database(`Deleting user: ${id}`);
      
      const deletedUser = await User.findByIdAndDelete(id);
      
      if (!deletedUser) {
        throw new AppError('Usuario no encontrado', 404);
      }

      logger.database(`User deleted successfully: ${deletedUser.email}`);
      return true;
    } catch (error) {
      logger.error(`Error deleting user ${id}:`, error);
      
      if (error instanceof AppError) {
        throw error;
      }
      
      throw new AppError(`Error al eliminar usuario: ${error.message}`, 500);
    }
  }

  /**
   * Buscar usuarios por rol
   * @param {string} role - Rol de usuario
   * @param {Object} options - Opciones adicionales
   * @returns {Promise<Array>}
   */
  async findByRole(role, options = {}) {
    try {
      const {
        limit = 50,
        select = '-password',
        sort = { createdAt: -1 }
      } = options;

      logger.database(`Finding users by role: ${role}`);
      
      const users = await User.find({ role })
        .select(select)
        .sort(sort)
        .limit(limit);

      logger.database(`Found ${users.length} users with role: ${role}`);
      return users;
    } catch (error) {
      logger.error(`Error finding users by role ${role}:`, error);
      throw new AppError(`Error al buscar usuarios por rol: ${error.message}`, 500);
    }
  }

  /**
   * Contar usuarios por estado
   * @param {Object} filters - Filtros adicionales
   * @returns {Promise<Object>}
   */
  async countByStatus(filters = {}) {
    try {
      logger.database('Counting users by status');
      
      const [total, active, inactive, clients, barbers, admins] = await Promise.all([
        User.countDocuments(filters),
        User.countDocuments({ ...filters, isActive: true }),
        User.countDocuments({ ...filters, isActive: false }),
        User.countDocuments({ ...filters, role: 'client' }),
        User.countDocuments({ ...filters, role: 'barber' }),
        User.countDocuments({ ...filters, role: 'admin' })
      ]);

      const stats = {
        total,
        active,
        inactive,
        byRole: {
          client: clients,
          barber: barbers,
          admin: admins
        }
      };

      logger.database('User stats calculated:', stats);
      return stats;
    } catch (error) {
      logger.error('Error counting users by status:', error);
      throw new AppError(`Error al obtener estadísticas de usuarios: ${error.message}`, 500);
    }
  }

  /**
   * Validar contraseña de usuario
   * @param {string} id - ID del usuario
   * @param {string} password - Contraseña a validar
   * @returns {Promise<boolean>}
   */
  async validatePassword(id, password) {
    try {
      logger.database(`Validating password for user: ${id}`);
      const user = await User.findById(id).select('+password');
      
      if (!user) {
        throw new AppError('Usuario no encontrado', 404);
      }

      const isValid = await user.comparePassword(password);
      logger.database(`Password validation result for user ${id}: ${isValid}`);
      
      return isValid;
    } catch (error) {
      logger.error(`Error validating password for user ${id}:`, error);
      
      if (error instanceof AppError) {
        throw error;
      }
      
      throw new AppError(`Error al validar contraseña: ${error.message}`, 500);
    }
  }

  /**
   * Actualizar contraseña de usuario
   * @param {string} id - ID del usuario
   * @param {string} newPassword - Nueva contraseña
   * @returns {Promise<boolean>}
   */
  async updatePassword(id, newPassword) {
    try {
      logger.database(`Updating password for user: ${id}`);
      
      const user = await User.findById(id);
      if (!user) {
        throw new AppError('Usuario no encontrado', 404);
      }

      user.password = newPassword;
      await user.save();

      logger.database(`Password updated successfully for user: ${id}`);
      return true;
    } catch (error) {
      logger.error(`Error updating password for user ${id}:`, error);
      
      if (error instanceof AppError) {
        throw error;
      }
      
      throw new AppError(`Error al actualizar contraseña: ${error.message}`, 500);
    }
  }
}

export default UserRepositoryImpl;