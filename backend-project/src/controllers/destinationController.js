const Destination = require('../models/Destination');

/**
 * Get all destinations
 * @route GET /destinations
 */
exports.getAllDestinations = async (req, res) => {
  try {
    console.log('Fetching all destinations...');
    const destinations = await Destination.find();
    console.log(`Found ${destinations.length} destination records`);
    res.json(destinations);
  } catch (error) {
    console.error('Error fetching destinations:', error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * Get destination by ID
 * @route GET /destinations/:id
 */
exports.getDestinationById = async (req, res) => {
  try {
    const destination = await Destination.findById(req.params.id);
    if (!destination) {
      return res.status(404).json({ message: 'Destination not found' });
    }
    res.json(destination);
  } catch (error) {
    console.error('Error fetching destination:', error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * Create new destination
 * @route POST /destinations
 */
exports.createDestination = async (req, res) => {
  try {
    const destination = new Destination({
      name: req.body.name,
      country: req.body.country,
      description: req.body.description,
      lat: req.body.lat,
      lng: req.body.lng,
      img: req.body.img,
      userId: req.body.userId,
      createdAt: req.body.createdAt || new Date()
    });

    const savedDestination = await destination.save();
    res.status(201).json(savedDestination);
  } catch (error) {
    console.error('Error creating destination:', error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * Update destination by ID
 * @route PUT /destinations/:id
 */
exports.updateDestination = async (req, res) => {
  try {
    console.log(`Updating destination with id: ${req.params.id}`);
    const destination = await Destination.findById(req.params.id);
    
    if (!destination) {
      console.log('Destination not found');
      return res.status(404).json({ message: 'Destination not found' });
    }

    // Update fields if provided
    if (req.body.name != null) destination.name = req.body.name;
    if (req.body.country != null) destination.country = req.body.country;
    if (req.body.description != null) destination.description = req.body.description;
    if (req.body.lat != null) destination.lat = req.body.lat;
    if (req.body.lng != null) destination.lng = req.body.lng;
    if (req.body.img != null) destination.img = req.body.img;
    if (req.body.userId != null) destination.userId = req.body.userId;

    const updatedDestination = await destination.save();
    console.log('Destination updated successfully');
    res.json(updatedDestination);
  } catch (error) {
    console.error('Error updating destination:', error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * Delete destination by ID
 * @route DELETE /destinations/:id
 */
exports.deleteDestination = async (req, res) => {
  try {
    console.log(`Deleting destination with id: ${req.params.id}`);
    const destination = await Destination.findById(req.params.id);
    
    if (!destination) {
      console.log('Destination not found');
      return res.status(404).json({ message: 'Destination not found' });
    }

    await destination.deleteOne();
    console.log('Destination deleted successfully');
    res.json({ message: 'Destination deleted successfully', deletedId: req.params.id });
  } catch (error) {
    console.error('Error deleting destination:', error);
    res.status(500).json({ message: error.message });
  }
};
