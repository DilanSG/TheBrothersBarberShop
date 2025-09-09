// Fixed version of main server
console.log('🚀 Starting fixed main server...');
console.log('📍 Port:', process.env.PORT || 5000);
console.log('🌍 Environment:', process.env.NODE_ENV || 'development');

// First, start the server to bind the port
import express from 'express';

const app = express();
const port = process.env.PORT || 5000;

// Basic middleware
app.use(express.json());

// Essential routes
app.get('/', (req, res) => {
  res.json({
    message: 'The Brothers Barber Shop API - Fixed Version',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    status: 'running'
  });
});

app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'The Brothers Barber Shop API',
    time: new Date().toISOString(),
    uptime: process.uptime()
  });
});

console.log('📍 Binding to port', port);
const server = app.listen(port, '0.0.0.0', () => {
  console.log(`✅ Server bound to port ${port}`);
  console.log(`📡 Available at http://0.0.0.0:${port}`);
  
  // Now load the full app after port is bound
  loadFullApp();
});

async function loadFullApp() {
  try {
    console.log('📍 Loading full application...');
    
    // Import fixed app
    const { default: fullApp } = await import('./app.js');
    
    // Add all routes from full app to our basic app
    console.log('📍 Mounting full app routes...');
    app.use('/', fullApp);
    
    console.log('✅ Full application loaded successfully');
    
  } catch (error) {
    console.error('❌ Error loading full app:', error.message);
    console.log('⚠️ Continuing with basic server...');
  }
}

process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
});

process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Rejection:', err);
});
