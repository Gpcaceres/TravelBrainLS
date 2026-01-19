const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

/**
 * Authentication Routes
 * Note: These routes are mounted at /api/auth in app.js
 */

// POST /api/auth/register - Register new user
router.post('/register', authController.register);

// POST /api/auth/login - Simple login
router.post('/login', authController.simpleLogin);

// GET /api/auth/verify - Verify JWT token
router.get('/verify', authController.verifyToken);

module.exports = router;
