const FavoriteRoute = require('../models/FavoriteRoute');

/**
 * Get all favorite routes
 * @route GET /favorite-routes
 */
exports.getAllFavoriteRoutes = async (req, res) => {
  try {
    console.log('Fetching all favorite routes...');
    const favoriteRoutes = await FavoriteRoute.find();
    console.log(`Found ${favoriteRoutes.length} favorite route records`);
    res.json(favoriteRoutes);
  } catch (error) {
    console.error('Error fetching favorite routes:', error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * Get favorite route by ID
 * @route GET /favorite-routes/:id
 */
exports.getFavoriteRouteById = async (req, res) => {
  try {
    const favoriteRoute = await FavoriteRoute.findById(req.params.id);
    if (!favoriteRoute) {
      return res.status(404).json({ message: 'Favorite route not found' });
    }
    res.json(favoriteRoute);
  } catch (error) {
    console.error('Error fetching favorite route:', error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * Create new favorite route
 * @route POST /favorite-routes
 */
exports.createFavoriteRoute = async (req, res) => {
  try {
    const favoriteRoute = new FavoriteRoute({
      userId: req.body.userId,
      name: req.body.name,
      origin: {
        lat: req.body.origin?.lat,
        lon: req.body.origin?.lon,
        label: req.body.origin?.label
      },
      destination: {
        lat: req.body.destination?.lat,
        lon: req.body.destination?.lon,
        label: req.body.destination?.label
      },
      distanceKm: req.body.distanceKm,
      durationSec: req.body.durationSec,
      mode: req.body.mode,
      createdAt: req.body.createdAt || new Date()
    });

    const savedFavoriteRoute = await favoriteRoute.save();
    res.status(201).json(savedFavoriteRoute);
  } catch (error) {
    console.error('Error creating favorite route:', error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * Update favorite route by ID
 * @route PUT /favorite-routes/:id
 */
exports.updateFavoriteRoute = async (req, res) => {
  try {
    console.log(`Updating favorite route with id: ${req.params.id}`);
    const favoriteRoute = await FavoriteRoute.findById(req.params.id);
    
    if (!favoriteRoute) {
      console.log('Favorite route not found');
      return res.status(404).json({ message: 'Favorite route not found' });
    }

    // Update fields if provided
    if (req.body.userId != null) favoriteRoute.userId = req.body.userId;
    if (req.body.name != null) favoriteRoute.name = req.body.name;
    
    if (req.body.origin != null) {
      if (req.body.origin.lat != null) favoriteRoute.origin.lat = req.body.origin.lat;
      if (req.body.origin.lon != null) favoriteRoute.origin.lon = req.body.origin.lon;
      if (req.body.origin.label != null) favoriteRoute.origin.label = req.body.origin.label;
    }
    
    if (req.body.destination != null) {
      if (req.body.destination.lat != null) favoriteRoute.destination.lat = req.body.destination.lat;
      if (req.body.destination.lon != null) favoriteRoute.destination.lon = req.body.destination.lon;
      if (req.body.destination.label != null) favoriteRoute.destination.label = req.body.destination.label;
    }
    
    if (req.body.distanceKm != null) favoriteRoute.distanceKm = req.body.distanceKm;
    if (req.body.durationSec != null) favoriteRoute.durationSec = req.body.durationSec;
    if (req.body.mode != null) favoriteRoute.mode = req.body.mode;

    const updatedFavoriteRoute = await favoriteRoute.save();
    console.log('Favorite route updated successfully');
    res.json(updatedFavoriteRoute);
  } catch (error) {
    console.error('Error updating favorite route:', error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * Delete favorite route by ID
 * @route DELETE /favorite-routes/:id
 */
exports.deleteFavoriteRoute = async (req, res) => {
  try {
    console.log(`Deleting favorite route with id: ${req.params.id}`);
    const favoriteRoute = await FavoriteRoute.findById(req.params.id);
    
    if (!favoriteRoute) {
      console.log('Favorite route not found');
      return res.status(404).json({ message: 'Favorite route not found' });
    }

    await favoriteRoute.deleteOne();
    console.log('Favorite route deleted successfully');
    res.json({ message: 'Favorite route deleted successfully', deletedId: req.params.id });
  } catch (error) {
    console.error('Error deleting favorite route:', error);
    res.status(500).json({ message: error.message });
  }
};
