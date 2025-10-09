// connection.js - The Brothers Barber Shop Database Connection Manager
// Optimizado para Docker, MongoDB Atlas y production environments

import mongoose from 'mongoose';
import { logger } from '../../shared/utils/logger.js';
import config from '../../shared/config/index.js';

class DatabaseConnection {
  constructor() {
    this.isConnected = false;
    this.connectionAttempts = 0;
    this.maxRetries = 5;
    this.retryDelay = 5000; // 5 seconds
  }

  /**
   * Connect to MongoDB with retry logic
   */
  async connect() {
    try {
      if (this.isConnected) {
        logger.warn('[DATABASE] Already connected to MongoDB');
        return mongoose.connection;
      }

      logger.info('[DATABASE] Connecting to MongoDB Atlas...');
      
      await mongoose.connect(config.database.uri, {
        ...config.database.options,
        // Production optimizations
        maxPoolSize: process.env.NODE_ENV === 'production' ? 10 : 5,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        bufferCommands: false,
        bufferMaxEntries: 0,
        // Connection monitoring
        heartbeatFrequencyMS: 10000,
        // Atlas-specific optimizations
        retryWrites: true,
        w: 'majority'
      });

      this.isConnected = true;
      this.connectionAttempts = 0;
      
      logger.info(`[DATABASE] Successfully connected to MongoDB Atlas in ${process.env.NODE_ENV} mode`);
      this.setupEventHandlers();
      
      return mongoose.connection;

    } catch (error) {
      this.connectionAttempts++;
      logger.error(`[DATABASE] Connection attempt ${this.connectionAttempts} failed:`, {
        error: error.message,
        attempt: this.connectionAttempts,
        maxRetries: this.maxRetries
      });

      if (this.connectionAttempts < this.maxRetries) {
        logger.info(`[DATABASE] Retrying connection in ${this.retryDelay / 1000} seconds...`);
        await this.delay(this.retryDelay);
        return this.connect();
      }

      logger.error('[DATABASE] Max connection attempts reached. Exiting...');
      throw error;
    }
  }

  /**
   * Setup event handlers for connection monitoring
   */
  setupEventHandlers() {
    const db = mongoose.connection;

    // Connection events
    db.on('connected', () => {
      logger.info('[DATABASE] Mongoose connected to MongoDB Atlas');
    });

    db.on('error', (err) => {
      logger.error('[DATABASE] MongoDB connection error:', err);
      this.isConnected = false;
    });

    db.on('disconnected', () => {
      logger.warn('[DATABASE] MongoDB disconnected');
      this.isConnected = false;
      
      // Auto-reconnect in development
      if (process.env.NODE_ENV === 'development') {
        logger.info('[DATABASE] Attempting to reconnect...');
        setTimeout(() => this.connect(), this.retryDelay);
      }
    });

    // Graceful shutdown
    process.on('SIGINT', () => this.gracefulShutdown('SIGINT'));
    process.on('SIGTERM', () => this.gracefulShutdown('SIGTERM'));

    // MongoDB Atlas specific events
    db.on('reconnected', () => {
      logger.info('[DATABASE] MongoDB reconnected');
      this.isConnected = true;
    });

    db.on('timeout', () => {
      logger.warn('[DATABASE] MongoDB connection timeout');
    });

    db.on('close', () => {
      logger.info('[DATABASE] MongoDB connection closed');
      this.isConnected = false;
    });
  }

  /**
   * Graceful shutdown handler
   */
  async gracefulShutdown(signal) {
    logger.info(`[DATABASE] Received ${signal}. Closing MongoDB connection...`);
    
    try {
      await this.disconnect();
      logger.info('[DATABASE] MongoDB connection closed gracefully');
      process.exit(0);
    } catch (error) {
      logger.error('[DATABASE] Error during graceful shutdown:', error);
      process.exit(1);
    }
  }

  /**
   * Disconnect from MongoDB
   */
  async disconnect() {
    if (this.isConnected) {
      await mongoose.connection.close();
      this.isConnected = false;
      logger.info('[DATABASE] MongoDB connection closed');
    }
  }

  /**
   * Health check for Docker and monitoring
   */
  isHealthy() {
    return this.isConnected && mongoose.connection.readyState === 1;
  }

  /**
   * Get connection status for monitoring
   */
  getConnectionStatus() {
    const states = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting'
    };

    return {
      isConnected: this.isConnected,
      readyState: mongoose.connection.readyState,
      status: states[mongoose.connection.readyState] || 'unknown',
      host: mongoose.connection.host,
      port: mongoose.connection.port,
      database: mongoose.connection.name,
      connectionAttempts: this.connectionAttempts
    };
  }

  /**
   * Get database statistics
   */
  async getStats() {
    if (!this.isHealthy()) {
      throw new Error('Database not connected');
    }

    try {
      const admin = mongoose.connection.db.admin();
      const stats = await admin.serverStatus();
      
      return {
        uptime: stats.uptime,
        connections: stats.connections,
        memory: stats.mem,
        operations: stats.opcounters,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error('[DATABASE] Error getting stats:', error);
      throw error;
    }
  }

  /**
   * Utility delay function
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Test connection with detailed diagnostics
   */
  async testConnection() {
    try {
      logger.info('[DATABASE] Testing connection...');
      
      await mongoose.connection.db.admin().ping();
      logger.info('[DATABASE] Connection test successful');
      
      return {
        success: true,
        latency: Date.now(),
        status: this.getConnectionStatus()
      };
    } catch (error) {
      logger.error('[DATABASE] Connection test failed:', error);
      throw error;
    }
  }
}

// Create singleton instance
const databaseConnection = new DatabaseConnection();

export default databaseConnection;