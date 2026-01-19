const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { cacheMiddleware } = require('../middlewares/cache');
const { authenticate, isAdmin, isAdminOrOwner } = require('../middlewares/auth');

/**
 * User Routes
 */

// GET /users/stats - Get user statistics (Admin only)
router.get('/users/stats', authenticate, isAdmin, userController.getUserStats);

// GET /users - Get all users (Admin only, with cache)
router.get('/users', authenticate, isAdmin, cacheMiddleware(300), userController.getAllUsers);

// GET /users/:id - Get user by ID (Admin or Owner, with cache)
router.get('/users/:id', authenticate, isAdminOrOwner, cacheMiddleware(300), userController.getUserById);

// POST /users - Create new user (Admin only)
router.post('/users', authenticate, isAdmin, userController.createUser);

// PUT /users/:id - Update user by ID (Admin or Owner)
router.put('/users/:id', authenticate, isAdminOrOwner, userController.updateUser);

// DELETE /users/:id - Delete user by ID (Admin only)
router.delete('/users/:id', authenticate, isAdmin, userController.deleteUser);

// PATCH /users/:id/activate - Activate user (Admin only)
router.patch('/users/:id/activate', authenticate, isAdmin, userController.activateUser);

// PATCH /users/:id/deactivate - Deactivate user (Admin only)
router.patch('/users/:id/deactivate', authenticate, isAdmin, userController.deactivateUser);

// PATCH /users/:id/role - Change user role (Admin only)
router.patch('/users/:id/role', authenticate, isAdmin, userController.changeUserRole);

module.exports = router;
