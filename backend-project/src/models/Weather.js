const mongoose = require('mongoose');

/**
 * Weather Schema
 * Represents weather search data
 */
const weatherSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false
    },
    label: {
      type: String,
      trim: true
    },
    lat: {
      type: Number,
      required: true,
      min: -90,
      max: 90
    },
    lon: {
      type: Number,
      required: true,
      min: -180,
      max: 180
    },
    temp: {
      type: Number,
      required: true
    },
    condition: {
      type: String,
      trim: true
    },
    humidity: {
      type: Number,
      min: 0,
      max: 100
    },
    windSpeed: {
      type: Number,
      min: 0
    },
    pressure: {
      type: Number,
      min: 0
    },
    precipitation: {
      type: Number,
      min: 0
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    collection: 'weather_searches',
    timestamps: false
  }
);

// Indexes for performance
weatherSchema.index({ userId: 1 });
weatherSchema.index({ lat: 1, lon: 1 });
weatherSchema.index({ createdAt: -1 });

// Virtual for temperature in Fahrenheit
weatherSchema.virtual('tempF').get(function() {
  if (this.temp) {
    return (this.temp * 9/5) + 32;
  }
  return null;
});

module.exports = mongoose.model('Weather', weatherSchema);
