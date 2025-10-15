import { v2 as cloudinary } from 'cloudinary';
import { logger } from './logger.js';

// Elimina una imagen de Cloudinary por su public_id
export const deleteFromCloudinary = async (publicId) => {
	try {
		const result = await cloudinary.uploader.destroy(publicId);
		return result;
	} catch (error) {
		logger.error('Error eliminando imagen de Cloudinary:', error);
		throw error;
	}
};
