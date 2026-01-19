const mongoose = require('mongoose');

/**
 * Trip Schema
 * Represents a planned trip in the system
 */
const tripSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    destination: {
      type: String,
      required: true,
      trim: true
    },
    startDate: {
      type: Date,
      required: true
    },
    endDate: {
      type: Date,
      required: true
    },
    budget: {
      type: Number,
      min: 0
    },
    description: {
      type: String,
      trim: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    collection: 'trips',
    timestamps: false
  }
);

// Indexes for performance
tripSchema.index({ userId: 1 });
tripSchema.index({ startDate: 1, endDate: 1 });
tripSchema.index({ createdAt: -1 });

// Virtual for trip duration in days
tripSchema.virtual('durationDays').get(function() {
  if (this.startDate && this.endDate) {
    const diffTime = Math.abs(this.endDate - this.startDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }
  return 0;
});

module.exports = mongoose.model('Trip', tripSchema);
