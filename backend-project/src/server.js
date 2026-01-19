require('dotenv').config();
const createApp = require('./app');
const { connectDB } = require('./config/database');
const config = require('./config/env');

/**
 * Start Server
 */
const startServer = async () => {
  try {
    // Connect to database
    await connectDB();

    // Create Express app
    const app = createApp();

    // Start listening
    const server = app.listen(config.port, '0.0.0.0', () => {
      console.log('\n' + '='.repeat(50));
      console.log('🚀 TravelBrain Backend Server Started');
      console.log('='.repeat(50));
      console.log(`📡 Server running on: http://localhost:${config.port}`);
      console.log(`🌍 Environment: ${config.nodeEnv}`);
      console.log(`🗄️  Database: ${config.mongoDB}`);
      console.log(`⏰ Timezone: ${config.appTimezone}`);
      console.log('='.repeat(50) + '\n');
    });

    // Graceful shutdown
    const gracefulShutdown = async (signal) => {
      console.log(`\n⚠️  ${signal} received. Starting graceful shutdown...`);
      
      server.close(async () => {
        console.log('👋 HTTP server closed');
        
        try {
          const { disconnectDB } = require('./config/database');
          await disconnectDB();
          console.log('✅ Graceful shutdown completed');
          process.exit(0);
        } catch (error) {
          console.error('❌ Error during shutdown:', error);
          process.exit(1);
        }
      });

      // Force close after 10 seconds
      setTimeout(() => {
        console.error('❌ Forced shutdown after timeout');
        process.exit(1);
      }, 10000);
    };

    // Handle signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Handle uncaught errors
    process.on('uncaughtException', (error) => {
      console.error('❌ Uncaught Exception:', error);
      gracefulShutdown('uncaughtException');
    });

    process.on('unhandledRejection', (reason, promise) => {
      console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
      gracefulShutdown('unhandledRejection');
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server
startServer();
