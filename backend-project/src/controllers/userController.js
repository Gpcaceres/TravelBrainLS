const User = require('../models/User');
const { invalidateCache } = require('../utils/cache');

/**
 * Get all users with pagination and search
 * @route GET /users?page=1&limit=10&search=query&status=ACTIVE&role=USER
 */
exports.getAllUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const status = req.query.status || '';
    const role = req.query.role || '';
    const skip = (page - 1) * limit;

    console.log(`Fetching users - Page: ${page}, Limit: ${limit}, Search: "${search}"`);

    // Build query
    const query = {};

    // Search in email, username, and name
    if (search) {
      query.$or = [
        { email: { $regex: search, $options: 'i' } },
        { username: { $regex: search, $options: 'i' } },
        { name: { $regex: search, $options: 'i' } }
      ];
    }

    // Filter by status
    if (status && ['ACTIVE', 'INACTIVE'].includes(status)) {
      query.status = status;
    }

    // Filter by role
    if (role && ['ADMIN', 'REGISTERED', 'USER'].includes(role)) {
      query.role = role;
    }

    // Get total count for pagination
    const totalUsers = await User.countDocuments(query);
    const totalPages = Math.ceil(totalUsers / limit);

    // Fetch users with pagination
    const users = await User.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    console.log(`Found ${users.length} users out of ${totalUsers} total`);

    res.json({
      success: true,
      data: users,
      pagination: {
        currentPage: page,
        totalPages: totalPages,
        totalUsers: totalUsers,
        limit: limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error al obtener usuarios',
      error: error.message 
    });
  }
};

/**
 * Get user by ID
 * @route GET /users/:id
 */
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * Create new user
 * @route POST /users
 */
exports.createUser = async (req, res) => {
  try {
    const user = new User({
      username: req.body.username,
      email: req.body.email,
      passwordHash: req.body.passwordHash,
      name: req.body.name,
      role: req.body.role,
      status: req.body.status,
      tz: req.body.tz,
      createdAt: req.body.createdAt
    });

    const savedUser = await user.save();
    invalidateCache('/users');
    res.status(201).json(savedUser);
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * Update user by ID
 * @route PUT /users/:id
 */
exports.updateUser = async (req, res) => {
  try {
    console.log(`Updating user with id: ${req.params.id}`);
    const user = await User.findById(req.params.id);
    
    if (!user) {
      console.log('User not found');
      return res.status(404).json({ message: 'User not found' });
    }

    // Update fields if provided
    if (req.body.username != null) user.username = req.body.username;
    if (req.body.email != null) user.email = req.body.email;
    if (req.body.passwordHash != null) user.passwordHash = req.body.passwordHash;
    if (req.body.name != null) user.name = req.body.name;
    if (req.body.role != null) user.role = req.body.role;
    if (req.body.status != null) user.status = req.body.status;
    if (req.body.tz != null) user.tz = req.body.tz;

    const updatedUser = await user.save();
    console.log('User updated successfully');
    invalidateCache('/users');
    res.json(updatedUser);
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * Delete user by ID
 * @route DELETE /users/:id
 */
exports.deleteUser = async (req, res) => {
  try {
    console.log(`Deleting user with id: ${req.params.id}`);
    const user = await User.findById(req.params.id);
    
    if (!user) {
      console.log('User not found');
      return res.status(404).json({ message: 'User not found' });
    }

    await user.deleteOne();
    console.log('User deleted successfully');
    invalidateCache('/users');
    res.json({ message: 'User deleted successfully', deletedId: req.params.id });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * Activate user (Admin only)
 * @route PATCH /users/:id/activate
 */
exports.activateUser = async (req, res) => {
  try {
    console.log(`Activating user with id: ${req.params.id}`);
    const user = await User.findById(req.params.id);
    
    if (!user) {
      console.log('User not found');
      return res.status(404).json({ 
        success: false,
        message: 'Usuario no encontrado' 
      });
    }

    user.status = 'ACTIVE';
    await user.save();
    
    console.log('User activated successfully');
    invalidateCache('/users');
    
    res.json({ 
      success: true,
      message: 'Usuario activado exitosamente',
      user: {
        _id: user._id,
        email: user.email,
        username: user.username,
        name: user.name,
        role: user.role,
        status: user.status
      }
    });
  } catch (error) {
    console.error('Error activating user:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error al activar usuario',
      error: error.message 
    });
  }
};

/**
 * Deactivate user (Admin only)
 * @route PATCH /users/:id/deactivate
 */
exports.deactivateUser = async (req, res) => {
  try {
    console.log(`Deactivating user with id: ${req.params.id}`);
    const user = await User.findById(req.params.id);
    
    if (!user) {
      console.log('User not found');
      return res.status(404).json({ 
        success: false,
        message: 'Usuario no encontrado' 
      });
    }

    // No permitir que un admin se desactive a sí mismo
    if (req.user && req.user.id === req.params.id) {
      return res.status(400).json({
        success: false,
        message: 'No puedes desactivar tu propia cuenta'
      });
    }

    user.status = 'INACTIVE';
    await user.save();
    
    console.log('User deactivated successfully');
    invalidateCache('/users');
    
    res.json({ 
      success: true,
      message: 'Usuario desactivado exitosamente',
      user: {
        _id: user._id,
        email: user.email,
        username: user.username,
        name: user.name,
        role: user.role,
        status: user.status
      }
    });
  } catch (error) {
    console.error('Error deactivating user:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error al desactivar usuario',
      error: error.message 
    });
  }
};

/**
 * Change user role (Admin only)
 * @route PATCH /users/:id/role
 */
exports.changeUserRole = async (req, res) => {
  try {
    console.log(`Changing role for user with id: ${req.params.id}`);
    const { role } = req.body;
    
    if (!role || !['ADMIN', 'REGISTERED', 'USER'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Rol inválido. Debe ser ADMIN, REGISTERED o USER'
      });
    }

    const user = await User.findById(req.params.id);
    
    if (!user) {
      console.log('User not found');
      return res.status(404).json({ 
        success: false,
        message: 'Usuario no encontrado' 
      });
    }

    user.role = role;
    await user.save();
    
    console.log(`User role changed to ${role} successfully`);
    invalidateCache('/users');
    
    res.json({ 
      success: true,
      message: `Rol de usuario cambiado a ${role} exitosamente`,
      user: {
        _id: user._id,
        email: user.email,
        username: user.username,
        name: user.name,
        role: user.role,
        status: user.status
      }
    });
  } catch (error) {
    console.error('Error changing user role:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error al cambiar rol de usuario',
      error: error.message 
    });
  }
};

/**
 * Get user statistics (Admin only)
 * @route GET /users/stats
 */
exports.getUserStats = async (req, res) => {
  try {
    console.log('Fetching user statistics...');
    
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ status: 'ACTIVE' });
    const inactiveUsers = await User.countDocuments({ status: 'INACTIVE' });
    const adminUsers = await User.countDocuments({ role: 'ADMIN' });
    const registeredUsers = await User.countDocuments({ role: 'REGISTERED' });
    const regularUsers = await User.countDocuments({ role: 'USER' });
    
    const stats = {
      total: totalUsers,
      byStatus: {
        active: activeUsers,
        inactive: inactiveUsers
      },
      byRole: {
        admin: adminUsers,
        registered: registeredUsers,
        user: regularUsers
      }
    };
    
    console.log('User statistics fetched successfully');
    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Error fetching user statistics:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error al obtener estadísticas de usuarios',
      error: error.message 
    });
  }
};
