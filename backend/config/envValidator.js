// config/envValidator.js
const requiredEnvVars = {
  development: [
    'MONGODB_URI',
    'JWT_SECRET',
    'PORT'
  ],
  production: [
    'MONGODB_URI',
    'JWT_SECRET',
    'JWT_REFRESH_SECRET',
    'EMAIL_HOST',
    'EMAIL_USER',
    'EMAIL_PASS',
    'CLOUDINARY_NAME',
    'CLOUDINARY_API_KEY',
    'CLOUDINARY_API_SECRET'
  ],
  test: [
    'MONGODB_URI_TEST',
    'JWT_SECRET'
  ]
};

export const validateEnvironment = () => {
  const env = process.env.NODE_ENV || 'development';
  const required = requiredEnvVars[env] || requiredEnvVars.development;
  
  const missing = required.filter(varName => !process.env[varName]);
  
  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:');
    missing.forEach(varName => {
      console.error(`   - ${varName}`);
    });
    console.error('\n💡 Check your .env file and .env.example for reference');
    process.exit(1);
  }
  
  console.log('✅ Environment variables validated successfully');
};
