const mongoose = require('mongoose');

/**
 * Destination Schema
 * Represents a travel destination in the system
 */
const destinationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    country: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      trim: true
    },
    lat: {
      type: Number,
      required: true,
      min: -90,
      max: 90
    },
    lng: {
      type: Number,
      required: true,
      min: -180,
      max: 180
    },
    img: {
      type: String,
      trim: true
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    collection: 'destinations',
    timestamps: false
  }
);

// Indexes for performance
destinationSchema.index({ name: 1, country: 1 });
destinationSchema.index({ userId: 1 });
destinationSchema.index({ lat: 1, lng: 1 });

module.exports = mongoose.model('Destination', destinationSchema);
