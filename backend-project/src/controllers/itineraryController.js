const Itinerary = require('../models/Itinerary');
const Trip = require('../models/Trip');
const axios = require('axios');
const config = require('../config/env');
const { invalidateCache } = require('../utils/cache');

/**
 * Fetch weather forecast for destination
 */
const fetchWeatherForecast = async (destination, startDate, days) => {
  try {
    // Use WeatherAPI.com forecast endpoint (supports up to 14 days)
    const apiKey = config.weatherApiKey;
    
    if (!apiKey || apiKey === 'demo_key') {
      console.warn('[WeatherForecast] No API key configured');
      return null;
    }

    // WeatherAPI.com free tier supports forecast
    const url = `https://api.weatherapi.com/v1/forecast.json?key=${apiKey}&q=${encodeURIComponent(destination)}&days=${Math.min(days, 14)}&aqi=no`;
    
    console.log('[WeatherForecast] Fetching forecast from:', url.replace(apiKey, 'API_KEY'));
    
    const response = await axios.get(url);
    const data = response.data;
    
    // Calculate average temperature
    const avgTemp = data.forecast.forecastday.reduce((sum, day) => sum + day.day.avgtemp_c, 0) / data.forecast.forecastday.length;
    
    // Get most common condition
    const conditions = data.forecast.forecastday.map(day => day.day.condition.text);
    const mostCommonCondition = conditions.sort((a, b) =>
      conditions.filter(v => v === a).length - conditions.filter(v => v === b).length
    ).pop();
    
    // Format daily forecasts
    const dailyForecasts = data.forecast.forecastday.map((day, index) => ({
      date: new Date(day.date),
      temp: Math.round(day.day.avgtemp_c),
      condition: day.day.condition.text,
      icon: day.day.condition.icon,
      maxTemp: Math.round(day.day.maxtemp_c),
      minTemp: Math.round(day.day.mintemp_c),
      humidity: day.day.avghumidity,
      chanceOfRain: day.day.daily_chance_of_rain
    }));
    
    return {
      averageTemp: Math.round(avgTemp),
      conditions: mostCommonCondition,
      dailyForecasts: dailyForecasts
    };
  } catch (error) {
    console.error('[WeatherForecast] Error fetching weather:', error.message);
    if (error.response) {
      console.error('[WeatherForecast] Response status:', error.response.status);
      console.error('[WeatherForecast] Response data:', error.response.data);
    }
    return null;
  }
};

/**
 * Generate new itinerary
 * @route POST /api/itineraries/generate
 */
exports.generateItinerary = async (req, res) => {
  try {
    console.log('[GenerateItinerary] User:', req.user.id);
    console.log('[GenerateItinerary] Body:', req.body);

    const { tripId, interestType, budgetType, dailyActivities, weatherInfo, budgetBreakdown } = req.body;

    // Verify trip exists and belongs to user
    const trip = await Trip.findById(tripId);
    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'Trip not found'
      });
    }

    // Calculate budget breakdown based on trip budget and budget type
    const tripBudget = trip.budget || 0;
    let calculatedBudgetBreakdown = budgetBreakdown || {};
    
    if (tripBudget > 0 && !budgetBreakdown) {
      // Different distributions based on budget type
      const distributions = {
        'Económico': {
          accommodation: 0.35,  // 35% alojamiento
          food: 0.25,          // 25% comida
          activities: 0.15,    // 15% actividades
          transport: 0.20,     // 20% transporte
          extras: 0.05         // 5% extras
        },
        'Medio': {
          accommodation: 0.40,
          food: 0.25,
          activities: 0.20,
          transport: 0.10,
          extras: 0.05
        },
        'Alto': {
          accommodation: 0.45,
          food: 0.20,
          activities: 0.25,
          transport: 0.05,
          extras: 0.05
        }
      };

      const distribution = distributions[budgetType] || distributions['Medio'];
      
      calculatedBudgetBreakdown = {
        accommodation: Math.round(tripBudget * distribution.accommodation),
        food: Math.round(tripBudget * distribution.food),
        activities: Math.round(tripBudget * distribution.activities),
        transport: Math.round(tripBudget * distribution.transport),
        extras: Math.round(tripBudget * distribution.extras),
        total: tripBudget
      };
    }

    // Generate daily activities based on trip duration
    const startDate = new Date(trip.startDate);
    const endDate = new Date(trip.endDate);
    const days = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
    
    // Fetch weather forecast for the destination
    let weatherForecast = weatherInfo;
    if (!weatherInfo || Object.keys(weatherInfo).length === 0) {
      console.log('[GenerateItinerary] Fetching weather forecast for:', trip.destination);
      weatherForecast = await fetchWeatherForecast(trip.destination, startDate, days);
      if (weatherForecast) {
        console.log('[GenerateItinerary] ✅ Weather forecast obtained');
      } else {
        console.log('[GenerateItinerary] ⚠️ Could not fetch weather forecast');
        weatherForecast = {};
      }
    }
    
    let generatedActivities = dailyActivities || [];
    
    if (!dailyActivities || dailyActivities.length === 0) {
      // Generate simple daily structure
      generatedActivities = [];
      for (let i = 0; i < days; i++) {
        const currentDate = new Date(startDate);
        currentDate.setDate(startDate.getDate() + i);
        
        const dayActivities = {
          day: i + 1,
          date: currentDate,
          activities: [
            {
              time: '09:00',
              title: 'Desayuno',
              description: 'Inicio del día con desayuno local',
              cost: Math.round((calculatedBudgetBreakdown.food / days) * 0.3)
            },
            {
              time: '11:00',
              title: 'Actividad matutina',
              description: `Actividad relacionada con ${interestType}`,
              cost: Math.round(calculatedBudgetBreakdown.activities / days / 2)
            },
            {
              time: '14:00',
              title: 'Almuerzo',
              description: 'Comida típica del destino',
              cost: Math.round((calculatedBudgetBreakdown.food / days) * 0.4)
            },
            {
              time: '16:00',
              title: 'Actividad vespertina',
              description: `Exploración y actividades de ${interestType}`,
              cost: Math.round(calculatedBudgetBreakdown.activities / days / 2)
            },
            {
              time: '20:00',
              title: 'Cena',
              description: 'Cena en restaurante local',
              cost: Math.round((calculatedBudgetBreakdown.food / days) * 0.3)
            }
          ]
        };
        
        generatedActivities.push(dayActivities);
      }
    }

    // Create itinerary
    const itinerary = new Itinerary({
      tripId,
      userId: req.user.id,
      interestType,
      budgetType,
      dailyActivities: generatedActivities,
      weatherInfo: weatherForecast || {},
      budgetBreakdown: calculatedBudgetBreakdown
    });

    const savedItinerary = await itinerary.save();
    console.log('[GenerateItinerary] ✅ Itinerary created:', savedItinerary._id);

    // Invalidate cache after creating
    invalidateCache('/itineraries');
    invalidateCache('itineraries');

    res.status(201).json({
      success: true,
      data: savedItinerary
    });
  } catch (error) {
    console.error('[GenerateItinerary] ❌ Error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Get all itineraries for current user
 * @route GET /api/itineraries
 */
exports.getUserItineraries = async (req, res) => {
  try {
    console.log('[GetUserItineraries] User:', req.user.id);

    const itineraries = await Itinerary.find({ userId: req.user.id })
      .populate('tripId')
      .sort({ generatedAt: -1 });

    console.log('[GetUserItineraries] Found:', itineraries.length);

    res.json({
      success: true,
      data: itineraries
    });
  } catch (error) {
    console.error('[GetUserItineraries] ❌ Error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Get itinerary by ID
 * @route GET /api/itineraries/:id
 */
exports.getItineraryById = async (req, res) => {
  try {
    const itinerary = await Itinerary.findById(req.params.id)
      .populate('tripId')
      .populate('userId', 'name email');

    if (!itinerary) {
      return res.status(404).json({
        success: false,
        message: 'Itinerary not found'
      });
    }

    res.json({
      success: true,
      data: itinerary
    });
  } catch (error) {
    console.error('[GetItineraryById] ❌ Error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Get itinerary by trip ID
 * @route GET /api/itineraries/trip/:tripId
 */
exports.getItineraryByTripId = async (req, res) => {
  try {
    const itinerary = await Itinerary.findOne({ tripId: req.params.tripId })
      .populate('tripId')
      .sort({ generatedAt: -1 });

    if (!itinerary) {
      return res.status(404).json({
        success: false,
        message: 'No itinerary found for this trip'
      });
    }

    res.json({
      success: true,
      data: itinerary
    });
  } catch (error) {
    console.error('[GetItineraryByTripId] ❌ Error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Delete itinerary
 * @route DELETE /api/itineraries/:id
 */
exports.deleteItinerary = async (req, res) => {
  try {
    const itinerary = await Itinerary.findById(req.params.id);

    if (!itinerary) {
      return res.status(404).json({
        success: false,
        message: 'Itinerary not found'
      });
    }

    // Verify ownership
    if (itinerary.userId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this itinerary'
      });
    }

    await Itinerary.findByIdAndDelete(req.params.id);

    // Invalidate cache after deleting
    invalidateCache('/itineraries');
    invalidateCache('itineraries');

    res.json({
      success: true,
      message: 'Itinerary deleted successfully'
    });
  } catch (error) {
    console.error('[DeleteItinerary] ❌ Error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
