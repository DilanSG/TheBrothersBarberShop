const winston = require('winston');
const path = require('path');

// Formato de log personalizado
const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Logger para desarrollo (consola)
const developmentLogger = winston.createLogger({
  level: 'debug',
  format: winston.format.combine(
    winston.format.colorize(),
    winston.format.printf(({ timestamp, level, message, stack }) => {
      return `${timestamp} ${level}: ${stack || message}`;
    })
  ),
  transports: [new winston.transports.Console()]
});

// Logger para producción (archivo)
const productionLogger = winston.createLogger({
  level: 'info',
  format: logFormat,
  defaultMeta: { service: 'the-brothers-barbershop-api' },
  transports: [
    new winston.transports.File({ 
      filename: path.join('logs', 'error.log'), 
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    new winston.transports.File({ 
      filename: path.join('logs', 'combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5
    })
  ]
});

// Elegir logger según entorno
const logger = process.env.NODE_ENV === 'production' ? productionLogger : developmentLogger;

// Middleware de logging de requests
const requestLogger = (req, res, next) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    const logData = {
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      userId: req.user ? req.user._id : 'anonymous'
    };

    if (res.statusCode >= 400) {
      logger.error('HTTP Request Error', logData);
    } else {
      logger.info('HTTP Request', logData);
    }
  });

  next();
};

// Middleware de logging de errores
const errorLogger = (error, req, res, next) => {
  logger.error('Unhandled Error', {
    message: error.message,
    stack: error.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userId: req.user ? req.user._id : 'anonymous'
  });

  next(error);
};

module.exports = {
  logger,
  requestLogger,
  errorLogger
};