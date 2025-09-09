// Debug version of index.js
console.log('🚀 Starting debug server...');

try {
  console.log('📍 Step 1: Importing express...');
  import('express').then(async (express) => {
    console.log('✅ Express imported successfully');
    
    const app = express.default();
    const port = process.env.PORT || 5000;
    
    console.log('📍 Step 2: Setting up basic route...');
    app.get('/', (req, res) => {
      res.json({ message: 'Debug server working', timestamp: new Date().toISOString() });
    });
    
    console.log('📍 Step 3: Starting server on port', port);
    app.listen(port, '0.0.0.0', () => {
      console.log(`✅ Debug server started on port ${port}`);
      console.log(`📡 Available at http://0.0.0.0:${port}`);
    });
  }).catch(err => {
    console.error('❌ Error importing express:', err);
    process.exit(1);
  });
} catch (error) {
  console.error('❌ Critical error:', error);
  process.exit(1);
}

// Error handlers
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Rejection:', err);
  process.exit(1);
});
