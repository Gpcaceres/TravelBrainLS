const mongoose = require('mongoose');

/**
 * User Schema
 * Represents a user in the TravelBrain system
 */
const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: false,
      trim: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
      sparse: true,
      lowercase: true,
      trim: true
    },
    passwordHash: {
      type: String,
      required: false
    },
    name: {
      type: String,
      trim: true
    },
    role: {
      type: String,
      enum: ['ADMIN', 'REGISTERED', 'USER'],
      default: 'USER'
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'INACTIVE'],
      default: 'ACTIVE'
    },
    tz: {
      type: String,
      default: 'America/Guayaquil'
    },
    googleId: {
      type: String,
      unique: true,
      sparse: true
    },
    picture: {
      type: String
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    collection: 'users',
    timestamps: false
  }
);

// Indexes are automatically created for unique fields
// Additional composite indexes can be added here if needed

module.exports = mongoose.model('User', userSchema);
