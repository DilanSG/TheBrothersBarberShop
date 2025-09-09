// Servidor mínimo para testing en Render
import express from 'express';

const app = express();
const port = process.env.PORT || 5000;

console.log('🚀 Starting minimal server...');
console.log('📍 Port:', port);
console.log('🌍 Environment:', process.env.NODE_ENV || 'development');

// Middleware básico
app.use(express.json());

// Ruta raíz
app.get('/', (req, res) => {
  console.log('📞 Root route called');
  res.json({
    message: 'The Brothers Barber Shop API - Minimal Version',
    port: port,
    timestamp: new Date().toISOString(),
    status: 'running'
  });
});

// Health check
app.get('/health', (req, res) => {
  console.log('🏥 Health check called');
  res.json({
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// Iniciar servidor
app.listen(port, '0.0.0.0', () => {
  console.log(`✅ Minimal server started on port ${port}`);
  console.log(`📡 Server is listening on http://0.0.0.0:${port}`);
});

// Error handling
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Rejection:', err);
  process.exit(1);
});
