// Step-by-step import debugging
console.log('🚀 Starting server with step-by-step imports...');

const port = process.env.PORT || 5000;
console.log('📍 Port:', port);
console.log('🌍 Environment:', process.env.NODE_ENV || 'development');

async function startServerStepByStep() {
  try {
    console.log('📍 Step 1: Importing mongoose...');
    const mongoose = await import('mongoose');
    console.log('✅ mongoose imported');

    console.log('📍 Step 2: Importing config...');
    const { config } = await import('./config/index.js');
    console.log('✅ config imported, port:', config.app.port);

    console.log('📍 Step 3: Importing logger...');
    const { logger } = await import('./utils/logger.js');
    console.log('✅ logger imported');

    console.log('📍 Step 4: Importing database...');
    const { connectDB } = await import('./config/database.js');
    console.log('✅ database imported');

    console.log('📍 Step 5: Importing app...');
    const appModule = await import('./app.js');
    const app = appModule.default;
    console.log('✅ app imported');

    console.log('📍 Step 6: Starting server on port', config.app.port);
    const server = app.listen(config.app.port, '0.0.0.0', () => {
      console.log(`✅ Server started successfully on port ${config.app.port}`);
      console.log(`📡 Server listening at http://0.0.0.0:${config.app.port}`);
    });

    console.log('📍 Step 7: Attempting database connection...');
    try {
      await connectDB();
      console.log('✅ Database connected');
    } catch (dbError) {
      console.log('⚠️ Database connection failed, but server is running:', dbError.message);
    }

    return server;
  } catch (error) {
    console.error('❌ Error at step:', error.message);
    console.error('❌ Full error:', error);
    process.exit(1);
  }
}

startServerStepByStep();

process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Rejection:', err);
  process.exit(1);
});
