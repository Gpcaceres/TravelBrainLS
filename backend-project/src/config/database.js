const mongoose = require('mongoose');

// Configure mongoose
mongoose.set('strictQuery', false);

/**
 * Connect to MongoDB database
 * @returns {Promise<void>}
 */
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGO_URI;
    const mongoDB = process.env.MONGO_DB || 'travel_brain';
    
    const fullURI = `${mongoURI}${mongoDB}?retryWrites=true&w=majority`;
    
    await mongoose.connect(fullURI, {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
    });

    console.log('✅ System connected to MongoDB Database:', mongoDB);
    
    // Event listeners
    mongoose.connection.on('error', (error) => {
      console.error('❌ MongoDB error:', error);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('⚠️  MongoDB disconnected');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('✅ MongoDB reconnected');
    });

  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

/**
 * Disconnect from MongoDB
 * @returns {Promise<void>}
 */
const disconnectDB = async () => {
  try {
    await mongoose.connection.close();
    console.log('✅ MongoDB connection closed');
  } catch (error) {
    console.error('❌ Error closing MongoDB connection:', error);
  }
};

module.exports = {
  connectDB,
  disconnectDB
};
