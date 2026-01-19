const Weather = require('../models/Weather');
const { invalidateCache } = require('../utils/cache');

/**
 * Get all weather searches
 * @route GET /weathers
 */
exports.getAllWeathers = async (req, res) => {
  try {
    console.log('Fetching weathers for user:', req.user._id);
    // Filter by authenticated user
    const weathers = await Weather.find({ userId: req.user._id })
      .sort({ createdAt: -1 }); // Most recent first
    console.log(`Found ${weathers.length} weather records for user ${req.user._id}`);
    res.json(weathers);
  } catch (error) {
    console.error('Error fetching weathers:', error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * Get weather by ID
 * @route GET /weathers/:id
 */
exports.getWeatherById = async (req, res) => {
  try {
    const weather = await Weather.findById(req.params.id);
    if (!weather) {
      return res.status(404).json({ message: 'Weather not found' });
    }
    res.json(weather);
  } catch (error) {
    console.error('Error fetching weather:', error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * Create new weather search
 * @route POST /weather
 */
exports.createWeather = async (req, res) => {
  try {
    console.log('Creating weather for user:', req.user._id);
    const weather = new Weather({
      userId: req.user._id, // Use authenticated user ID
      label: req.body.label,
      lat: req.body.lat,
      lon: req.body.lon,
      temp: req.body.temp,
      condition: req.body.condition,
      humidity: req.body.humidity,
      windSpeed: req.body.windSpeed,
      pressure: req.body.pressure,
      precipitation: req.body.precipitation
    });

    const savedWeather = await weather.save();
    console.log('Weather saved successfully:', savedWeather._id);
    
    // Invalidate all weather-related cache
    invalidateCache('/weathers');
    invalidateCache('weathers'); // Also try without leading slash
    
    res.status(201).json(savedWeather);
  } catch (error) {
    console.error('Error creating weather:', error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * Update weather by ID
 * @route PUT /weathers/:id
 */
exports.updateWeather = async (req, res) => {
  try {
    console.log(`Updating weather with id: ${req.params.id}`);
    const weather = await Weather.findById(req.params.id);
    
    if (!weather) {
      console.log('Weather not found');
      return res.status(404).json({ message: 'Weather not found' });
    }

    // Update fields if provided
    if (req.body.userId != null) weather.userId = req.body.userId;
    if (req.body.label != null) weather.label = req.body.label;
    if (req.body.lat != null) weather.lat = req.body.lat;
    if (req.body.lon != null) weather.lon = req.body.lon;
    if (req.body.temp != null) weather.temp = req.body.temp;
    if (req.body.condition != null) weather.condition = req.body.condition;
    if (req.body.humidity != null) weather.humidity = req.body.humidity;
    if (req.body.windSpeed != null) weather.windSpeed = req.body.windSpeed;
    if (req.body.pressure != null) weather.pressure = req.body.pressure;
    if (req.body.precipitation != null) weather.precipitation = req.body.precipitation;

    const updatedWeather = await weather.save();
    console.log('Weather updated successfully');
    
    // Invalidate all weather-related cache
    invalidateCache('/weathers');
    invalidateCache('weathers'); // Also try without leading slash
    
    res.json(updatedWeather);
  } catch (error) {
    console.error('Error updating weather:', error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * Delete weather by ID
 * @route DELETE /weathers/:id
 */
exports.deleteWeather = async (req, res) => {
  try {
    console.log(`Deleting weather with id: ${req.params.id} for user: ${req.user._id}`);
    // Find weather and verify it belongs to the authenticated user
    const weather = await Weather.findOne({ 
      _id: req.params.id, 
      userId: req.user._id 
    });
    
    if (!weather) {
      console.log('Weather not found or does not belong to user');
      return res.status(404).json({ message: 'Weather not found' });
    }

    await weather.deleteOne();
    console.log('Weather deleted successfully');
    
    // Invalidate all weather-related cache
    invalidateCache('/weathers');
    invalidateCache('weathers'); // Also try without leading slash
    
    res.json({ message: 'Weather deleted successfully', deletedId: req.params.id });
  } catch (error) {
    console.error('Error deleting weather:', error);
    res.status(500).json({ message: error.message });
  }
};
