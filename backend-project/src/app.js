const express = require('express');
const cors = require('cors');
const config = require('./config/env');
const {
  requestLogger,
  notFoundHandler,
  errorHandler
} = require('./middlewares');

// Import routes
const {
  authRoutes,
  userRoutes,
  destinationRoutes,
  tripRoutes,
  favoriteRouteRoutes,
  weatherRoutes
} = require('./routes');

/**
 * Create Express Application
 */
const createApp = () => {
  const app = express();

  // ===== Middlewares =====
  
  // Body parser
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // CORS
  app.use(cors({
    origin: config.corsOrigins,
    credentials: true
  }));

  // Request logger
  app.use(requestLogger);

  // ===== Health Check =====
  app.get('/health', (req, res) => {
    res.json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: config.nodeEnv
    });
  });

  // ===== API Routes =====
  app.use('/api/auth', authRoutes);
  app.use('/', userRoutes);
  app.use('/', destinationRoutes);
  app.use('/', tripRoutes);
  app.use('/', favoriteRouteRoutes);
  app.use('/', weatherRoutes);

  // Root endpoint
  app.get('/', (req, res) => {
    res.json({
      message: 'TravelBrain Backend API',
      version: '1.0.0',
      status: 'Running',
      endpoints: {
        health: '/health',
        auth: {
          googleLogin: 'POST /api/auth/google-login',
          verify: 'GET /api/auth/verify'
        },
        users: {
          getAll: 'GET /users',
          getOne: 'GET /users/:id',
          create: 'POST /users',
          update: 'PUT /users/:id',
          delete: 'DELETE /users/:id'
        },
        destinations: {
          getAll: 'GET /destinations',
          getOne: 'GET /destinations/:id',
          create: 'POST /destinations',
          update: 'PUT /destinations/:id',
          delete: 'DELETE /destinations/:id'
        },
        trips: {
          getAll: 'GET /trips',
          getOne: 'GET /trips/:id',
          create: 'POST /trips',
          update: 'PUT /trips/:id',
          delete: 'DELETE /trips/:id'
        },
        favoriteRoutes: {
          getAll: 'GET /favorite-routes',
          getOne: 'GET /favorite-routes/:id',
          create: 'POST /favorite-routes',
          update: 'PUT /favorite-routes/:id',
          delete: 'DELETE /favorite-routes/:id'
        },
        weather: {
          getAll: 'GET /weathers',
          getOne: 'GET /weathers/:id',
          create: 'POST /weather',
          update: 'PUT /weathers/:id',
          delete: 'DELETE /weathers/:id'
        }
      }
    });
  });

  // ===== Error Handlers =====
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};

module.exports = createApp;
