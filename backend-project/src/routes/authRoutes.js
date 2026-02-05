const express = require('express');
const router = express.Router();
const multer = require('multer');
const authController = require('../controllers/authController');

/**
 * Configuración de Multer para registro con biometría
 */
const storage = multer.memoryStorage();
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Solo se permiten archivos de imagen'), false);
  }
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: fileFilter
});

/**
 * Authentication Routes
 * Note: These routes are mounted at /api/auth in app.js
 */

// POST /api/auth/register - Register new user with biometric
router.post('/register', upload.single('face'), authController.register);

// POST /api/auth/validate-credentials - Validate credentials (Step 1 of MFA)
router.post('/validate-credentials', authController.validateCredentials);

// POST /api/auth/login - Simple login (DEPRECATED - use MFA flow)
router.post('/login', authController.simpleLogin);

// GET /api/auth/verify - Verify JWT token
router.get('/verify', authController.verifyToken);

module.exports = router;
