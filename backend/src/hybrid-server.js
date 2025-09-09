// Hybrid server - combining working minimal server with main app features
console.log('🚀 Starting hybrid server...');
console.log('📍 Port:', process.env.PORT || 5000);
console.log('🌍 Environment:', process.env.NODE_ENV || 'development');

import express from 'express';

const app = express();
const port = process.env.PORT || 5000;

// Basic middleware
app.use(express.json());

// Basic routes that we know work
app.get('/', (req, res) => {
  console.log('📞 Root route called');
  res.json({
    message: 'The Brothers Barber Shop API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    status: 'running'
  });
});

app.get('/health', (req, res) => {
  console.log('🏥 Health check called');
  res.json({
    status: 'healthy',
    service: 'The Brothers Barber Shop API',
    time: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Start server FIRST - this is critical
console.log('📍 Starting server on port', port);
const server = app.listen(port, '0.0.0.0', () => {
  console.log(`✅ Hybrid server started successfully on port ${port}`);
  console.log(`📡 Server listening at http://0.0.0.0:${port}`);
});

// Now try to load additional modules step by step
setTimeout(async () => {
  try {
    console.log('📍 Loading database connection...');
    const { connectDB } = await import('./config/database.js');
    await connectDB();
    console.log('✅ Database connected');
  } catch (err) {
    console.log('⚠️ Database connection failed:', err.message);
  }

  try {
    console.log('📍 Loading API routes...');
    const { default: routes } = await import('./routes/index.js');
    app.use('/api/v1', routes);
    console.log('✅ API routes loaded');
  } catch (err) {
    console.log('⚠️ API routes failed to load:', err.message);
  }
}, 2000);

// Error handling
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
});

process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Rejection:', err);
});
