// cloudinary.js - The Brothers Barber Shop Cloudinary Integration
// Optimized configuration for Docker and production environments

import { v2 as cloudinary } from 'cloudinary';
import { logger } from '../../shared/utils/logger.js';

class CloudinaryService {
  constructor() {
    this.isInitialized = false;
    this.uploadStats = {
      uploads: 0,
      errors: 0,
      totalSize: 0
    };
  }

  /**
   * Initialize Cloudinary with environment-specific configuration
   */
  initialize() {
    try {
      if (this.isInitialized) {
        logger.warn('[CLOUDINARY] Already initialized');
        return;
      }

      const config = {
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
        // Production optimizations
        secure: process.env.NODE_ENV === 'production',
        // Upload defaults
        upload_preset: process.env.CLOUDINARY_UPLOAD_PRESET || 'barbershop_default',
        // API optimization
        timeout: 60000, // 60 seconds
        max_file_size: 10 * 1024 * 1024, // 10MB
        // Quality settings
        quality: 'auto:good',
        format: 'auto'
      };

      cloudinary.config(config);
      this.isInitialized = true;

      logger.info('[CLOUDINARY] Successfully initialized', {
        cloud_name: config.cloud_name,
        environment: process.env.NODE_ENV
      });

    } catch (error) {
      logger.error('[CLOUDINARY] Initialization failed:', error);
      throw new Error('Cloudinary initialization failed');
    }
  }

  /**
   * Upload image with optimizations
   */
  async uploadImage(fileBuffer, options = {}) {
    try {
      if (!this.isInitialized) {
        this.initialize();
      }

      const uploadOptions = {
        resource_type: 'image',
        folder: 'barbershop',
        // Optimization settings
        quality: 'auto:good',
        format: 'auto',
        transformation: [
          { quality: 'auto' },
          { fetch_format: 'auto' }
        ],
        // Overrides
        ...options
      };

      const startTime = Date.now();
      const result = await cloudinary.uploader.upload(
        `data:image/png;base64,${fileBuffer.toString('base64')}`,
        uploadOptions
      );
      const duration = Date.now() - startTime;

      // Update statistics
      this.uploadStats.uploads++;
      this.uploadStats.totalSize += result.bytes || 0;

      logger.info('[CLOUDINARY] Image uploaded successfully', {
        public_id: result.public_id,
        size: result.bytes,
        format: result.format,
        duration
      });

      return {
        public_id: result.public_id,
        url: result.secure_url,
        width: result.width,
        height: result.height,
        format: result.format,
        size: result.bytes
      };

    } catch (error) {
      this.uploadStats.errors++;
      logger.error('[CLOUDINARY] Upload failed:', error);
      throw new Error(`Image upload failed: ${error.message}`);
    }
  }

  /**
   * Upload multiple images concurrently
   */
  async uploadMultiple(files, options = {}) {
    try {
      const uploadPromises = files.map(file => 
        this.uploadImage(file.buffer, {
          ...options,
          public_id: file.public_id || undefined
        })
      );

      const results = await Promise.allSettled(uploadPromises);
      
      const successful = results
        .filter(result => result.status === 'fulfilled')
        .map(result => result.value);
        
      const failed = results
        .filter(result => result.status === 'rejected')
        .map(result => result.reason);

      logger.info('[CLOUDINARY] Bulk upload completed', {
        successful: successful.length,
        failed: failed.length,
        total: files.length
      });

      return {
        successful,
        failed,
        total: files.length
      };

    } catch (error) {
      logger.error('[CLOUDINARY] Bulk upload failed:', error);
      throw error;
    }
  }

  /**
   * Delete image from Cloudinary
   */
  async deleteImage(publicId) {
    try {
      if (!this.isInitialized) {
        this.initialize();
      }

      const result = await cloudinary.uploader.destroy(publicId);
      
      logger.info('[CLOUDINARY] Image deleted', {
        public_id: publicId,
        result: result.result
      });

      return result.result === 'ok';

    } catch (error) {
      logger.error('[CLOUDINARY] Delete failed:', error);
      throw new Error(`Image deletion failed: ${error.message}`);
    }
  }

  /**
   * Generate optimized URL with transformations
   */
  generateOptimizedUrl(publicId, options = {}) {
    try {
      if (!this.isInitialized) {
        this.initialize();
      }

      const defaultTransformations = {
        quality: 'auto:good',
        format: 'auto',
        ...options
      };

      return cloudinary.url(publicId, defaultTransformations);

    } catch (error) {
      logger.error('[CLOUDINARY] URL generation failed:', error);
      return null;
    }
  }

  /**
   * Get image details
   */
  async getImageDetails(publicId) {
    try {
      if (!this.isInitialized) {
        this.initialize();
      }

      const result = await cloudinary.api.resource(publicId);
      
      return {
        public_id: result.public_id,
        url: result.secure_url,
        width: result.width,
        height: result.height,
        format: result.format,
        size: result.bytes,
        created_at: result.created_at
      };

    } catch (error) {
      logger.error('[CLOUDINARY] Failed to get image details:', error);
      throw error;
    }
  }

  /**
   * Health check for monitoring
   */
  async healthCheck() {
    try {
      if (!this.isInitialized) {
        this.initialize();
      }

      // Test with a simple API call
      const result = await cloudinary.api.ping();
      
      return {
        status: 'healthy',
        ...this.uploadStats,
        response_time: Date.now()
      };

    } catch (error) {
      logger.error('[CLOUDINARY] Health check failed:', error);
      return {
        status: 'unhealthy',
        error: error.message
      };
    }
  }

  /**
   * Get upload statistics
   */
  getStats() {
    return {
      ...this.uploadStats,
      initialized: this.isInitialized,
      average_size: this.uploadStats.uploads > 0 
        ? Math.round(this.uploadStats.totalSize / this.uploadStats.uploads)
        : 0
    };
  }

  /**
   * Reset statistics
   */
  resetStats() {
    this.uploadStats = {
      uploads: 0,
      errors: 0,
      totalSize: 0
    };
    
    logger.info('[CLOUDINARY] Statistics reset');
  }
}

// Create and export singleton instance
const cloudinaryService = new CloudinaryService();

export default cloudinaryService;