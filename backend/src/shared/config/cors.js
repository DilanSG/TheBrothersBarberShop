import cors from 'cors';

// Lista de dominios permitidos
const allowedOrigins = [
  // Desarrollo local
  'http://localhost:5173',          
  'http://localhost:5174',
  'http://localhost:3000',
  
  // Producción - Vercel
  'https://the-brothers-barbershop-frontend.vercel.app',
  'https://thebrothersbarbershop.vercel.app',
  
  // GitHub Pages (backup)
  'https://dilansg.github.io',
  
  // Variable de entorno personalizada
  process.env.FRONTEND_URL,
  process.env.ALLOWED_ORIGINS?.split(',')
].flat().filter(Boolean);

// Función para verificar si es una IP local válida en puerto 5173/5174
const isValidLocalIP = (origin) => {
  if (!origin) return false;
  
  console.log('🔍 Verificando IP local:', origin);
  
  // Patrón más simple y robusto para IPs locales con puertos 5173/5174
  const patterns = [
    /^http:\/\/10\.\d{1,3}\.\d{1,3}\.\d{1,3}:(5173|5174)$/,           // 10.x.x.x
    /^http:\/\/172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}:(5173|5174)$/, // 172.16-31.x.x
    /^http:\/\/192\.168\.\d{1,3}\.\d{1,3}:(5173|5174)$/,             // 192.168.x.x
    /^http:\/\/127\.\d{1,3}\.\d{1,3}\.\d{1,3}:(5173|5174)$/          // 127.x.x.x
  ];
  
  const isValid = patterns.some(pattern => pattern.test(origin));
  console.log(`🎯 IP ${origin} es válida:`, isValid);
  
  return isValid;
};

// Configuración de CORS
export const corsOptions = {
  origin: function (origin, callback) {
    console.log('🌐 CORS: Verificando origen:', origin);
    
    // Permitir requests sin origin (como mobile apps, postman o desarrollo local)
    if (!origin) {
      console.log('✅ CORS: Permitiendo request sin origin');
      callback(null, true);
      return;
    }
    
    // Verificar orígenes explícitamente permitidos
    if (allowedOrigins.includes(origin)) {
      console.log('✅ CORS: Origen en lista permitida:', origin);
      callback(null, true);
      return;
    }
    
    // Verificar IPs locales dinámicamente
    if (isValidLocalIP(origin)) {
      console.log('✅ CORS: Permitiendo acceso desde IP local válida:', origin);
      callback(null, true);
      return;
    }
    
    // Debug para orígenes rechazados
    console.log('❌ CORS: Origen no permitido:', origin);
    console.log('📝 CORS: Orígenes permitidos:', allowedOrigins);
    callback(new Error('No permitido por CORS'));
  },
  credentials: true, // Permitir cookies y autenticación
  optionsSuccessStatus: 200, // Para navegadores legacy
  exposedHeaders: ['Authorization'], // Exponer headers personalizados
};

// Middleware de CORS
export const corsMiddleware = cors(corsOptions);

// Función para configurar CORS dinámicamente
export const configureCors = (app) => {
  app.use(corsMiddleware);

  // Manejar preflight requests
  app.options('*', corsMiddleware);
};
