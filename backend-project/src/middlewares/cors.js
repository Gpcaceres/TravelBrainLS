const config = require('../config/env');

/**
 * CORS Middleware
 * Configures Cross-Origin Resource Sharing
 */
const corsMiddleware = (req, res, next) => {
  const origin = req.headers.origin;
  
  if (config.corsOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  
  next();
};

module.exports = corsMiddleware;
