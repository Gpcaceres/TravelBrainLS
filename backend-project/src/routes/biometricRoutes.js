const express = require('express');
const router = express.Router();
const multer = require('multer');
const biometricController = require('../controllers/biometricController');
const { authenticate } = require('../middlewares/auth');

/**
 * Configuración de Multer para manejo de imágenes en memoria
 * 
 * Seguridad:
 * - No se guardan archivos en disco
 * - Límite de tamaño: 5MB
 * - Solo formatos de imagen permitidos
 * - Los buffers se eliminan después del procesamiento
 */
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  // Permitir solo imágenes
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Solo se permiten archivos de imagen'), false);
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  },
  fileFilter: fileFilter
});

/**
 * @route   POST /api/biometric/challenge
 * @desc    Solicitar desafío temporal para autenticación biométrica
 * @access  Public
 * @body    { email: string, operation: 'LOGIN' | 'REGISTER' | 'UPDATE' }
 */
router.post('/challenge', biometricController.requestChallenge);

/**
 * @route   POST /api/biometric/verify
 * @desc    Verificar identidad biométrica y autenticar usuario
 * @access  Public
 * @body    FormData { challengeToken: string, email: string, file: File }
 */
router.post(
  '/verify',
  upload.single('face'),
  biometricController.verifyBiometric
);

/**
 * @route   POST /api/biometric/register
 * @desc    Registrar biometría facial para usuario autenticado
 * @access  Private (requiere JWT token)
 * @body    FormData { file: File }
 */
router.post(
  '/register',
  authenticate,
  upload.single('face'),
  biometricController.registerBiometric
);

/**
 * @route   POST /api/biometric/validate-face
 * @desc    Validar rostro sin registrar (para pre-registro)
 * @access  Public
 * @body    FormData { file: File }
 */
router.post(
  '/validate-face',
  upload.single('face'),
  biometricController.validateFace
);

/**
 * @route   GET /api/biometric/status
 * @desc    Obtener estado de biometría del usuario
 * @access  Private
 */
router.get('/status', authenticate, biometricController.getBiometricStatus);

/**
 * Manejo de errores de Multer
 */
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'El archivo es demasiado grande. Máximo 5MB.'
      });
    }
    return res.status(400).json({
      success: false,
      message: `Error al subir archivo: ${error.message}`
    });
  }
  
  if (error) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
  
  next();
});

module.exports = router;
