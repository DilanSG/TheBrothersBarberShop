import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';
import { fileURLToPath } from 'url';

// Obtener __dirname en ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuración de logging (no depende de config para evitar dependencia circular)
const loggingConfig = {
  level: process.env.LOG_LEVEL || 'info',
  dirname: process.env.LOG_DIR || path.join(__dirname, '../../../logs'),
  maxFiles: process.env.LOG_MAX_FILES || '30d',
  maxSize: process.env.LOG_MAX_SIZE || '20m',
};

const appConfig = {
  nodeEnv: process.env.NODE_ENV || 'development'
};

// Niveles de log personalizados
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4
};

// Colores para cada nivel
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'cyan'
};

// Añadir colores a Winston
winston.addColors(colors);

// Función para serialización segura de objetos circulares
const safeStringify = (obj, space) => {
  const seen = new WeakSet();
  return JSON.stringify(obj, (key, val) => {
    if (val != null && typeof val === 'object') {
      if (seen.has(val)) {
        return '[Circular]';
      }
      seen.add(val);
    }
    return val;
  }, space);
};

// Formato para los logs
const formats = {
  // Formato para consola con colores y emojis
  console: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.colorize({ all: true }),
    winston.format.printf(info => {
      // Mostrar símbolos solo si LOG_EMOJIS !== 'false' y en desarrollo
      const useSymbols = (process.env.LOG_EMOJIS ?? 'true') !== 'false' && appConfig.nodeEnv === 'development';
      const symbolSet = (process.env.LOG_SYMBOL_SET || 'ascii').toLowerCase();

      const symbolMaps = {
        ascii:   { error: '[ERR]', warn: '[WARN]', info: '[INFO]', http: '[HTTP]', debug: '[DBG]' },
        unicode: { error: '✖',     warn: '⚠',      info: 'ℹ',      http: '⇄',       debug: '🔎'    },
        initials:{ error: 'E',     warn: 'W',      info: 'I',      http: 'H',       debug: 'D'      },
        arrows:  { error: '>>',    warn: '!!',     info: '->',     http: '<>',      debug: '??'     },
        none:    { error: '',      warn: '',       info: '',       http: '',        debug: ''       }
      };

      const symbol = useSymbols ? (symbolMaps[symbolSet] || symbolMaps.ascii) : symbolMaps.none;
      const label = info.label || 'app';
      const levelSymbol = symbol[info.level] || '';
      return `${info.timestamp} [${label}] ${levelSymbol} ${info.message}`;
    })
  ),

  // Formato para archivos (JSON estructurado)
  file: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
  ),

  // Formato para logs de HTTP
  http: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.printf(info => {
      const { timestamp, level, message } = info;
      return `${timestamp} ${level}: ${message}`;
    })
  )
};

// Transports configurables
const createTransports = () => {
  const transports = [];

  // Transport para todos los logs
  transports.push(
    new DailyRotateFile({
      filename: `${loggingConfig.dirname}/%DATE%-combined.log`,
      datePattern: 'YYYY-MM-DD',
      maxFiles: loggingConfig.maxFiles,
      maxSize: loggingConfig.maxSize,
      format: formats.file
    })
  );

  // Transport específico para errores
  transports.push(
    new DailyRotateFile({
      filename: `${loggingConfig.dirname}/%DATE%-error.log`,
      datePattern: 'YYYY-MM-DD',
      level: 'error',
      maxFiles: loggingConfig.maxFiles,
      maxSize: loggingConfig.maxSize,
      format: formats.file
    })
  );

  // Transport específico para logs HTTP
  transports.push(
    new DailyRotateFile({
      filename: `${loggingConfig.dirname}/%DATE%-http.log`,
      datePattern: 'YYYY-MM-DD',
      level: 'http',
      maxFiles: loggingConfig.maxFiles,
      maxSize: loggingConfig.maxSize,
      format: formats.http
    })
  );

  // En desarrollo, añadir transport de consola
  if (appConfig.nodeEnv === 'development') {
    transports.push(
      new winston.transports.Console({
        level: 'debug',
        format: formats.console
      })
    );
  } else {
    // En producción, solo errores y warnings a consola
    transports.push(
      new winston.transports.Console({
        level: 'warn',
        format: formats.console
      })
    );
  }

  return transports;
};

// Crear el logger
const logger = winston.createLogger({
  level: loggingConfig.level,
  levels,
  defaultMeta: { 
    service: 'the-brothers-barbershop-api',
    environment: appConfig.nodeEnv
  },
  transports: createTransports(),
  // Manejo de excepciones y rechazos no capturados
  exceptionHandlers: [
    new DailyRotateFile({
      filename: `${loggingConfig.dirname}/%DATE%-exceptions.log`,
      datePattern: 'YYYY-MM-DD',
      maxFiles: loggingConfig.maxFiles,
      format: formats.file
    })
  ],
  rejectionHandlers: [
    new DailyRotateFile({
      filename: `${loggingConfig.dirname}/%DATE%-rejections.log`,
      datePattern: 'YYYY-MM-DD',
      maxFiles: loggingConfig.maxFiles,
      format: formats.file
    })
  ],
  exitOnError: false
});

// Métodos de utilidad
logger.logRequest = (req, res, responseTime) => {
  const meta = {
    requestId: req.id,
    method: req.method,
    url: req.originalUrl,
    status: res.statusCode,
    responseTime: `${responseTime}ms`,
    userAgent: req.get('user-agent'),
    ip: req.ip,
    user: req.user ? req.user._id : 'anonymous'
  };

  const message = `${req.method} ${req.originalUrl} ${res.statusCode} ${responseTime}ms`;
  logger.http(message, meta);
};

logger.logError = (error, req = null) => {
  const meta = {
    name: error.name,
    stack: error.stack,
    ...((req && {
      requestId: req.id,
      method: req.method,
      url: req.originalUrl,
      user: req.user ? req.user._id : 'anonymous',
      ip: req.ip
    }))
  };

  logger.error(error.message, meta);
};

logger.startupLog = () => {
  logger.info('=================================');
  logger.info('Servidor iniciado');
  logger.info(`Ambiente: ${config.app.nodeEnv}`);
  logger.info(`Puerto: ${config.app.port}`);
  logger.info('=================================');
};

// Stream para Morgan
logger.stream = {
  write: (message) => logger.http(message.trim())
};

// Funciones auxiliares para logging
export const requestLogger = (req, res, next) => {
  const start = Date.now();
  const requestId = Math.random().toString(36).substring(7);
  
  // Agregar requestId al request para tracking
  req.requestId = requestId;

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
export const errorLogger = (error, req, res, next) => {
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

export { logger };