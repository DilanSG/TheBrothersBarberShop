import multer from 'multer';
import path from 'path';
import { cloudinary } from '../config/cloudinary.js';
import { AppError } from '../utils/errors.js';
import fs from 'fs';

// Función para asegurar que el directorio existe
const ensureUploadDirectory = () => {
  if (process.env.NODE_ENV !== 'production') {
    const uploadDir = 'uploads/temp/';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
  }
};

// Asegurar que el directorio existe al importar el módulo
ensureUploadDirectory();

// Configuración de multer para subida temporal
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Usar /tmp en producción (Render) o uploads/temp/ en desarrollo
    const uploadPath = process.env.NODE_ENV === 'production' ? '/tmp' : 'uploads/temp/';
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// Filtro de archivos
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new AppError('Solo se permiten imágenes', 400), false);
  }
};

// Multer para subida temporal
export const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  },
  fileFilter: fileFilter
});

// Middleware para subir una sola imagen
export const uploadImage = upload.single('image');

// Middleware para subir imagen a Cloudinary
export const uploadToCloudinary = async (req, res, next) => {
  try {
    if (!req.file) {
      return next();
    }

    // Subir imagen a Cloudinary
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: 'the_brothers_barbershop',
      transformation: [
        { width: 800, height: 800, crop: 'limit' },
        { quality: 'auto' },
        { format: 'auto' }
      ]
    });

    // Agregar información de la imagen al request
    req.image = {
      public_id: result.public_id,
      url: result.secure_url,
      width: result.width,
      height: result.height,
      format: result.format
    };

    // Eliminar archivo temporal
    fs.unlinkSync(req.file.path);

    next();
  } catch (error) {
    next(new AppError('Error al subir la imagen', 500));
  }
};

// Middleware para eliminar imagen de Cloudinary
export const deleteFromCloudinary = async (publicId) => {
  try {
    if (!publicId) return;
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    console.error('Error eliminando imagen de Cloudinary:', error);
    throw error;
  }
};

// Middleware para validar tipo de archivo (solo para endpoints que requieren imagen)
export const validateImageRequired = (req, res, next) => {
  if (!req.file) {
    return next(new AppError('Por favor sube una imagen', 400));
  }

  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (!allowedTypes.includes(req.file.mimetype)) {
    return next(new AppError('Formato de imagen no válido. Use JPEG, PNG, GIF o WEBP', 400));
  }

  next();
};

// Middleware para validar tipo de archivo (opcional para endpoints de actualización)
export const validateImage = (req, res, next) => {
  // Si no hay archivo, continúa sin error
  if (!req.file) {
    return next();
  }

  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (!allowedTypes.includes(req.file.mimetype)) {
    return next(new AppError('Formato de imagen no válido. Use JPEG, PNG, GIF o WEBP', 400));
  }

  next();
};