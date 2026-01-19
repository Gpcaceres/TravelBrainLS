const express = require('express');
const router = express.Router();
const weatherController = require('../controllers/weatherController');
const { cacheMiddleware } = require('../middlewares/cache');
const { authenticate } = require('../middlewares/auth');

/**
 * Weather Routes
 */

// GET /weathers - Get all weather searches for authenticated user (with cache)
router.get('/weathers', authenticate, cacheMiddleware(600), weatherController.getAllWeathers);

// GET /weathers/:id - Get weather by ID (with cache)
router.get('/weathers/:id', authenticate, cacheMiddleware(600), weatherController.getWeatherById);

// POST /weather - Create new weather search
router.post('/weather', authenticate, weatherController.createWeather);

// PUT /weathers/:id - Update weather by ID
router.put('/weathers/:id', authenticate, weatherController.updateWeather);

// DELETE /weathers/:id - Delete weather by ID
router.delete('/weathers/:id', authenticate, weatherController.deleteWeather);

module.exports = router;
