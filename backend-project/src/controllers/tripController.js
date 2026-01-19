const Trip = require('../models/Trip');

/**
 * Get all trips
 * @route GET /trips
 */
exports.getAllTrips = async (req, res) => {
  try {
    console.log('Fetching all trips...');
    const trips = await Trip.find();
    console.log(`Found ${trips.length} trip records`);
    res.json(trips);
  } catch (error) {
    console.error('Error fetching trips:', error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * Get trip by ID
 * @route GET /trips/:id
 */
exports.getTripById = async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id);
    if (!trip) {
      return res.status(404).json({ message: 'Trip not found' });
    }
    res.json(trip);
  } catch (error) {
    console.error('Error fetching trip:', error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * Create new trip
 * @route POST /trips
 */
exports.createTrip = async (req, res) => {
  try {
    const trip = new Trip({
      userId: req.body.userId,
      title: req.body.title,
      destination: req.body.destination,
      startDate: req.body.startDate,
      endDate: req.body.endDate,
      budget: req.body.budget,
      description: req.body.description
    });

    const savedTrip = await trip.save();
    res.status(201).json(savedTrip);
  } catch (error) {
    console.error('Error creating trip:', error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * Update trip by ID
 * @route PUT /trips/:id
 */
exports.updateTrip = async (req, res) => {
  try {
    console.log(`Updating trip with id: ${req.params.id}`);
    const trip = await Trip.findById(req.params.id);
    
    if (!trip) {
      console.log('Trip not found');
      return res.status(404).json({ message: 'Trip not found' });
    }

    // Update fields if provided
    if (req.body.userId != null) trip.userId = req.body.userId;
    if (req.body.title != null) trip.title = req.body.title;
    if (req.body.destination != null) trip.destination = req.body.destination;
    if (req.body.startDate != null) trip.startDate = req.body.startDate;
    if (req.body.endDate != null) trip.endDate = req.body.endDate;
    if (req.body.budget != null) trip.budget = req.body.budget;
    if (req.body.description != null) trip.description = req.body.description;

    const updatedTrip = await trip.save();
    console.log('Trip updated successfully');
    res.json(updatedTrip);
  } catch (error) {
    console.error('Error updating trip:', error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * Delete trip by ID
 * @route DELETE /trips/:id
 */
exports.deleteTrip = async (req, res) => {
  try {
    console.log(`Deleting trip with id: ${req.params.id}`);
    const trip = await Trip.findById(req.params.id);
    
    if (!trip) {
      console.log('Trip not found');
      return res.status(404).json({ message: 'Trip not found' });
    }

    await trip.deleteOne();
    console.log('Trip deleted successfully');
    res.json({ message: 'Trip deleted successfully', deletedId: req.params.id });
  } catch (error) {
    console.error('Error deleting trip:', error);
    res.status(500).json({ message: error.message });
  }
};
