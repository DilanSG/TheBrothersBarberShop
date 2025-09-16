import Barber from '../models/Barber.js';
import User from '../models/User.js';
import { AppError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';

export default class BarberService {
  static async getBarbers() {
    try {
      logger.debug('🚀 [OPTIMIZED] Buscando barberos con consulta optimizada...');
      const startTime = Date.now();
      
      // 🚀 CONSULTA OPTIMIZADA: Una sola query con populate eficiente
      const barbers = await Barber.find({ 
        isActive: true 
      })
      .populate({
        path: 'user',
        select: 'name email phone profilePicture role isActive',
        match: { isActive: true, role: 'barber' }
      })
      .select('specialty experience description services schedule rating isActive photo isMainBarber user')
      .sort({ isMainBarber: -1, createdAt: 1 }) // Principales primero, luego por fecha
      .lean(); // Usar lean() para mejor performance

      // Filtrar barberos que tienen usuario válido (después del populate match)
      const validBarbers = barbers.filter(barber => barber.user !== null);

      // Populate services de forma eficiente
      if (validBarbers.length > 0) {
        await Barber.populate(validBarbers, { 
          path: 'services', 
          select: 'name price duration',
          options: { lean: true }
        });
      }

      const endTime = Date.now();
      logger.debug(`⚡ [OPTIMIZED] Consulta completada en ${endTime - startTime}ms - ${validBarbers.length} barberos`);
      
      return validBarbers;
    } catch (error) {
      logger.error('❌ [OPTIMIZED] Error al obtener barberos:', error);
      throw new AppError('Error al obtener la lista de barberos', 500);
    }
  }

  static async getBarberByUserId(userId) {
    try {
      logger.debug(`Buscando barbero por userId: ${userId}`);
      
      const barber = await Barber.findOne({ 
        user: userId,
        isActive: true 
      })
      .populate({
        path: 'user',
        select: 'name email phone profilePicture role',
        match: { isActive: true, role: 'barber' }
      })
      .populate('services', 'name price duration')
      .lean();

      if (!barber) {
        logger.warn(`No se encontró barbero activo para userId: ${userId}`);
        throw new AppError('Perfil de barbero no encontrado', 404);
      }

      logger.debug(`Barbero encontrado: ${barber._id}`);
      return barber;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error(`Error al buscar barbero por userId ${userId}:`, error);
      throw new AppError('Error al buscar el perfil del barbero', 500);
    }
  }

  static async updateBarberProfile(barberId, userId, userRole, updates) {
    const barber = await Barber.findById(barberId);
    if (!barber) {
      throw new AppError('Barbero no encontrado', 404);
    }

    if (userRole !== 'admin' && barber.user.toString() !== userId.toString()) {
      throw new AppError('No tienes permisos para editar este perfil', 403);
    }

    try {
      Object.entries(updates).forEach(([key, value]) => {
        if (['schedule', 'specialty', 'experience', 'description', 'services'].includes(key)) {
          // Parsear JSON strings si es necesario
          if (key === 'schedule' && typeof value === 'string') {
            try {
              barber[key] = JSON.parse(value);
            } catch (e) {
              barber[key] = value; // Si no es JSON válido, usar el valor original
            }
          } else if (key === 'services' && typeof value === 'string') {
            try {
              const parsedServices = JSON.parse(value);
              // Extraer solo los IDs si son objetos completos
              barber[key] = parsedServices.map(service => 
                typeof service === 'object' && service._id ? service._id : service
              );
            } catch (e) {
              barber[key] = value; // Si no es JSON válido, usar el valor original
            }
          } else {
            barber[key] = value;
          }
        }
      });

      if (updates.photo) {
        barber.photo = {
          public_id: updates.photo.public_id,
          url: updates.photo.url
        };
      }

      await barber.save();
      await barber.populate('user', 'name email phone profilePicture');
      
      logger.debug(`Perfil de barbero ${barberId} actualizado exitosamente`);
      return barber;
    } catch (error) {
      logger.error(`Error actualizando perfil de barbero ${barberId}:`, error);
      throw new AppError('Error al actualizar el perfil del barbero', 500);
    }
  }

  static async removeBarber(barberId) {
    const barber = await Barber.findById(barberId).populate('user');
    if (!barber) {
      throw new AppError('Barbero no encontrado', 404);
    }

    const user = await User.findById(barber.user._id);
    if (!user) {
      throw new AppError('Usuario no encontrado', 404);
    }

    try {
      user.role = 'user';
      await user.save();

      barber.isActive = false;
      await barber.save();

      logger.debug(`Barbero ${barberId} removido exitosamente`);
      return { barber, user };
    } catch (error) {
      logger.error(`Error removiendo barbero ${barberId}:`, error);
      throw new AppError('Error al remover el barbero', 500);
    }
  }
}
