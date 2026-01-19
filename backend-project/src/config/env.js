require('dotenv').config();

/**
 * Environment configuration
 * Centralizes all environment variables with validation and defaults
 */
const config = {
  // Server
  port: process.env.PORT || 3004,
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // Database
  mongoURI: process.env.MONGO_URI || 'mongodb+srv://SrJCBM:bdd2025@cluster0.tjvfmrk.mongodb.net/',
  mongoDB: process.env.MONGO_DB || 'travel_brain',
  
  // API Keys
  openWeatherApiKey: process.env.OPENWEATHER_API_KEY || '51355211649b0894257fe06250faa40d',
  mapboxToken: process.env.MAPBOX_TOKEN || 'pk.eyJ1Ijoic3JqY2JtIiwiYSI6ImNtZ3g0eGV5NDAwZzYya3BvdmFveWU2dnEifQ.yYCrLmlo9lW-AJf56akVCw',
  
  // Google OAuth
  googleClientId: process.env.GOOGLE_CLIENT_ID || '713160370468-sb3jjg16idaaakn3n6fe870nu6cn2h4b.apps.googleusercontent.com',
  
  // JWT
  jwtSecret: process.env.JWT_SECRET || 'development-secret-key-change-in-production',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  
  // Timezone
  appTimezone: process.env.APP_TIMEZONE || process.env.TZ || 'America/Guayaquil',
  
  // Currency
  currencyProvider: process.env.CURRENCY_PROVIDER || 'erapi',
  
  // CORS
  corsOrigins: process.env.CORS_ORIGINS 
    ? process.env.CORS_ORIGINS.split(',')
    : ['http://localhost:8000', 'http://localhost:3004', 'https://travelbrain-3tfv.onrender.com'],
};

/**
 * Validate required environment variables
 */
const validateConfig = () => {
  const required = ['mongoURI', 'mongoDB'];
  const missing = required.filter(key => !config[key]);
  
  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:', missing);
    process.exit(1);
  }
  
  if (config.nodeEnv === 'production' && config.jwtSecret === 'development-secret-key-change-in-production') {
    console.warn('⚠️  WARNING: Using default JWT secret in production!');
  }
};

// Validate on module load
validateConfig();

module.exports = config;
