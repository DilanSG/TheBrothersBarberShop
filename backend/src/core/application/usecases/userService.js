import { User, Barber } from '../../domain/entities/index.js';
import { AppError } from '../../../shared/utils/errors.js';
import { logger } from '../../../shared/utils/logger.js';

class UserService {
  static async getAllUsers(filters = {}, select = '-password') {
    try {
      // Por defecto, solo mostrar usuarios activos (no desactivados)
      const query = { 
        isActive: { $ne: false }, // Incluye usuarios sin isActive definido y con isActive: true
        ...filters 
      };
      const users = await User.find(query).select(select);
      
      logger.debug(`Recuperados ${users.length} usuarios activos`);
      return users;
    } catch (error) {
      logger.error('Error al obtener usuarios:', error);
      throw new AppError('Error al obtener la lista de usuarios', 500);
    }
  }

  static async getUserById(userId, select = '-password') {
    try {
      const user = await User.findById(userId).select(select);
      if (!user) {
        throw new AppError('Usuario no encontrado', 404);
      }
      return user;
    } catch (error) {
      logger.error(`Error al obtener usuario ${userId}:`, error);
      throw error;
    }
  }

  static async updateUser(userId, updateData, adminAction = false) {
    const startTime = Date.now();
    try {
      logger.info(`Iniciando actualización de usuario ${userId}`);
      
      // Verificar existencia del usuario
      const user = await this.getUserById(userId);
      logger.info(`Usuario encontrado en ${Date.now() - startTime}ms`);

      // Lista de campos permitidos para actualización
      const allowedUpdates = ['name', 'email', 'phone', 'birthdate', 'profilePicture', 'preferences'];
      // Campos adicionales permitidos para admin
      const adminAllowedUpdates = [...allowedUpdates, 'role', 'isActive'];

      // Filtrar actualizaciones permitidas
      const updates = {};
      Object.keys(updateData).forEach(key => {
        if ((adminAction && adminAllowedUpdates.includes(key)) || 
            (!adminAction && allowedUpdates.includes(key))) {
          updates[key] = updateData[key];
        }
      });

      logger.info(`Campos a actualizar: ${Object.keys(updates).join(', ')}`);
      // Debug: console.log('=== DATOS RECIBIDOS ===');
      // Debug: console.log(updateData);
      // Debug: console.log('=== ACTUALIZACIONES FILTRADAS ===');
      console.log(updates);
      // Debug: console.log('=== FIN DEBUG ===');

      // Validar que hay actualizaciones
      if (Object.keys(updates).length === 0) {
        logger.warn('No hay campos válidos para actualizar');
        return user;
      }

      // Debug específico para birthdate
      if (updates.birthdate) {
        logger.info(`BIRTHDATE DEBUG - Recibido: ${updateData.birthdate}, Tipo: ${typeof updateData.birthdate}`);
        logger.info(`BIRTHDATE DEBUG - Filtrado: ${updates.birthdate}, Tipo: ${typeof updates.birthdate}`);
        if (updateData.birthdate) {
          const date = new Date(updateData.birthdate);
          logger.info(`BIRTHDATE DEBUG - Como Date: ${date.toISOString()}, Válido: ${!isNaN(date.getTime())}`);
        }
      }

      // Si se está cambiando el rol a barbero, crear perfil de barbero
      if (adminAction && 
          updateData.role === 'barber' && 
          user.role !== 'barber') {
        await this.createBarberProfile(user);
      }

      // Si se está cambiando el rol de barbero a otro, desactivar perfil
      if (adminAction && 
          user.role === 'barber' && 
          updateData.role !== 'barber') {
        await this.deactivateBarberProfile(userId);
      }

      // Actualizar usuario
      const dbStartTime = Date.now();
      // Debug: console.log('=== EJECUTANDO UPDATE EN DB ===');
      console.log('Updates para DB:', updates);
      console.log('User ID:', userId);
      
      const updatedUser = await User.findByIdAndUpdate(
        userId,
        { $set: updates },
        { new: true, runValidators: true }
      ).select('-password');
      
      // Debug: console.log('=== USUARIO ACTUALIZADO ===');
      console.log('Resultado:', {
        id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        profilePicture: updatedUser.profilePicture,
        phone: updatedUser.phone,
        birthdate: updatedUser.birthdate
      });
      
      const totalTime = Date.now() - startTime;
      const dbTime = Date.now() - dbStartTime;
      
      logger.info(`Usuario ${userId} actualizado por ${adminAction ? 'admin' : 'usuario'} - Total: ${totalTime}ms, DB: ${dbTime}ms`);
      return updatedUser;
    } catch (error) {
      logger.error(`Error actualizando usuario ${userId}:`, error);
      throw error;
    }
  }

  static async deleteUser(userId) {
    try {
      // En lugar de eliminar, desactivamos el usuario
      const user = await User.findByIdAndUpdate(
        userId,
        { 
          $set: { 
            isActive: false,
            deactivatedAt: new Date()
          } 
        },
        { new: true }
      );

      if (!user) {
        throw new AppError('Usuario no encontrado', 404);
      }

      // Si es barbero, desactivar su perfil
      if (user.role === 'barber') {
        await this.deactivateBarberProfile(userId);
      }

      logger.info(`Usuario ${userId} desactivado`);
      return { message: 'Usuario eliminado correctamente' };
    } catch (error) {
      logger.error(`Error eliminando usuario ${userId}:`, error);
      throw error;
    }
  }

  static async activateUser(userId) {
    try {
      const user = await User.findByIdAndUpdate(
        userId,
        { 
          $set: { 
            isActive: true,
            deactivatedAt: null
          } 
        },
        { new: true }
      );

      if (!user) {
        throw new AppError('Usuario no encontrado', 404);
      }

      logger.info(`Usuario ${userId} activado`);
      return { message: 'Usuario activado correctamente' };
    } catch (error) {
      logger.error(`Error activando usuario ${userId}:`, error);
      throw error;
    }
  }

  // Métodos auxiliares
  static async createBarberProfile(user) {
    try {
      // Verificar si ya existe un perfil de barbero
      const existingProfile = await Barber.findOne({ user: user._id });
      if (existingProfile) {
        // Si existe pero está inactivo, reactivarlo
        if (!existingProfile.isActive) {
          existingProfile.isActive = true;
          await existingProfile.save();
          return existingProfile;
        }
        return existingProfile;
      }

      // Crear nuevo perfil de barbero
      const newBarber = new Barber({
        user: user._id,
        specialty: 'Barbero General',
        experience: 0,
        description: `Barbero profesional ${user.name}`,
        isActive: true,
        schedule: {
          monday: { start: '07:00', end: '19:00', available: true },
          tuesday: { start: '07:00', end: '19:00', available: true },
          wednesday: { start: '07:00', end: '19:00', available: true },
          thursday: { start: '07:00', end: '19:00', available: true },
          friday: { start: '07:00', end: '19:00', available: true },
          saturday: { start: '07:00', end: '19:00', available: true },
          sunday: { start: '07:00', end: '19:00', available: false }
        }
      });

      await newBarber.save();
      logger.info(`Perfil de barbero creado para usuario ${user._id}`);
      return newBarber;
    } catch (error) {
      logger.error(`Error creando perfil de barbero para usuario ${user._id}:`, error);
      throw new AppError('Error al crear perfil de barbero', 500);
    }
  }

  static async deactivateBarberProfile(userId) {
    try {
      const barber = await Barber.findOneAndUpdate(
        { user: userId },
        { $set: { isActive: false } },
        { new: true }
      );

      if (barber) {
        logger.info(`Perfil de barbero desactivado para usuario ${userId}`);
      }
      return barber;
    } catch (error) {
      logger.error(`Error desactivando perfil de barbero para usuario ${userId}:`, error);
      throw new AppError('Error al desactivar perfil de barbero', 500);
    }
  }

  static async getUserStats() {
    try {
      const stats = await User.aggregate([
        {
          $group: {
            _id: '$role',
            count: { $sum: 1 },
            active: {
              $sum: { $cond: ['$isActive', 1, 0] }
            }
          }
        }
      ]);

      const total = stats.reduce((acc, curr) => acc + curr.count, 0);
      const active = stats.reduce((acc, curr) => acc + curr.active, 0);

      return {
        total,
        active,
        inactive: total - active,
        byRole: stats
      };
    } catch (error) {
      logger.error('Error obteniendo estadísticas de usuarios:', error);
      throw new AppError('Error al obtener estadísticas', 500);
    }
  }

  static async changePassword(userId, currentPassword, newPassword) {
    try {
      // Obtener el usuario con la contraseña
      const user = await User.findById(userId).select('+password');
      if (!user) {
        throw new AppError('Usuario no encontrado', 404);
      }

      // Verificar la contraseña actual
      const isCurrentPasswordValid = await user.comparePassword(currentPassword);
      if (!isCurrentPasswordValid) {
        throw new AppError('La contraseña actual es incorrecta', 400);
      }

      // Actualizar la contraseña
      user.password = newPassword;
      await user.save();

      logger.info(`Contraseña actualizada para usuario ${userId}`);
      return true;
    } catch (error) {
      logger.error(`Error cambiando contraseña del usuario ${userId}:`, error);
      throw error;
    }
  }
}

export default UserService;

