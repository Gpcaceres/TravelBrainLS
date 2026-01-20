const mongoose = require('mongoose');

/**
 * Itinerary Schema
 * Represents a generated itinerary for a trip
 */
const itinerarySchema = new mongoose.Schema(
  {
    tripId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Trip',
      required: true
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false
    },
    interestType: {
      type: String,
      enum: ['Cultura e Historia', 'Naturaleza y Aventura', 'Gastronomía', 'Deportes y Aventura'],
      required: true
    },
    budgetType: {
      type: String,
      enum: ['Económico', 'Medio', 'Alto'],
      required: true
    },
    dailyActivities: [
      {
        day: {
          type: Number,
          required: true
        },
        date: {
          type: Date,
          required: true
        },
        activities: [
          {
            time: {
              type: String,
              required: true
            },
            title: {
              type: String,
              required: true
            },
            description: {
              type: String
            },
            cost: {
              type: Number,
              min: 0
            }
          }
        ]
      }
    ],
    weatherInfo: {
      averageTemp: Number,
      conditions: String,
      dailyForecasts: [
        {
          date: Date,
          temp: Number,
          condition: String,
          icon: String,
          maxTemp: Number,
          minTemp: Number,
          humidity: Number,
          chanceOfRain: Number
        }
      ]
    },
    budgetBreakdown: {
      accommodation: {
        type: Number,
        default: 0
      },
      food: {
        type: Number,
        default: 0
      },
      activities: {
        type: Number,
        default: 0
      },
      transport: {
        type: Number,
        default: 0
      },
      extras: {
        type: Number,
        default: 0
      },
      total: {
        type: Number,
        default: 0
      }
    },
    pdfUrl: {
      type: String
    },
    generatedAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    collection: 'itineraries',
    timestamps: true
  }
);

// Indexes for performance
itinerarySchema.index({ tripId: 1 });
itinerarySchema.index({ userId: 1 });
itinerarySchema.index({ generatedAt: -1 });

// Calculate total budget before saving
itinerarySchema.pre('save', function(next) {
  if (this.budgetBreakdown) {
    this.budgetBreakdown.total = 
      (this.budgetBreakdown.accommodation || 0) +
      (this.budgetBreakdown.food || 0) +
      (this.budgetBreakdown.activities || 0) +
      (this.budgetBreakdown.transport || 0) +
      (this.budgetBreakdown.extras || 0);
  }
  next();
});

module.exports = mongoose.model('Itinerary', itinerarySchema);
