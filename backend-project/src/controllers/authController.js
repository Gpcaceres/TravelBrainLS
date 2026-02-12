const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const User = require('../models/User');
const config = require('../config/env');

const SALT_ROUNDS = 10;

/**
 * Verify JWT Token
 * @route GET /api/auth/verify
 */
exports.verifyToken = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'Token no proporcionado' 
      });
    }

    const decoded = jwt.verify(token, config.jwtSecret);
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Usuario no encontrado' 
      });
    }

    res.json({
      success: true,
      user: {
        id: user._id.toString(),
        email: user.email,
        username: user.username,
        name: user.name,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Error al verificar token:', error);
    res.status(401).json({ 
      success: false, 
      message: 'Token inválido o expirado' 
    });
  }
};

/**
 * Validate Credentials (Step 1 of MFA)
 * Validates email and password without generating full token
 * @route POST /api/auth/validate-credentials
 */
exports.validateCredentials = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email y contraseña son requeridos'
      });
    }

    // Buscar usuario existente
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas'
      });
    }

    // Verificar si el usuario está activo
    if (user.status !== 'ACTIVE') {
      return res.status(403).json({
        success: false,
        message: 'Tu cuenta ha sido desactivada. Contacta al administrador.'
      });
    }

    // Verificar contraseña con bcrypt
    if (!user.passwordHash) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas. Por favor, restablece tu contraseña.'
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas'
      });
    }

    // Verificar si tiene biometría registrada
    const FacialBiometric = require('../models/FacialBiometric');
    const biometric = await FacialBiometric.findOne({ 
      userId: user._id,
      isActive: true 
    });

    res.json({
      success: true,
      message: 'Credenciales válidas. Procede con reconocimiento facial.',
      hasBiometric: !!biometric,
      requiresBiometric: true
    });

  } catch (error) {
    console.error('Error al validar credenciales:', error);
    res.status(500).json({
      success: false,
      message: 'Error al validar credenciales',
      error: error.message
    });
  }
};

/**
 * Simple Login - DISABLED (Use MFA flow instead)
 * Login biométrico es ahora obligatorio para todos los usuarios
 * @route POST /api/auth/login
 * @deprecated Use /api/auth/validate-credentials + /api/biometric/verify instead
 */
exports.simpleLogin = async (req, res) => {
  try {
    return res.status(403).json({
      success: false,
      message: 'El inicio de sesión directo está deshabilitado. Por favor, use el flujo MFA: valide credenciales y luego reconocimiento facial.',
      requiresBiometric: true,
      requiresMFA: true
    });

  } catch (error) {
    console.error('Error en simple login:', error);
    res.status(500).json({
      success: false,
      message: 'Error al iniciar sesión',
      error: error.message
    });
  }
};

/**
 * Register new user with biometric
 * @route POST /api/auth/register
 */
exports.register = async (req, res) => {
  const axios = require('axios');
  const FormData = require('form-data');
  const FacialBiometric = require('../models/FacialBiometric');
  const BiometricAuditLog = require('../models/BiometricAuditLog');
  
  const FACIAL_SERVICE_URL = process.env.FACIAL_SERVICE_URL || 'http://facial-recognition:8001';
  const INTERNAL_SERVICE_TOKEN = process.env.INTERNAL_SERVICE_TOKEN || 'CHANGE_THIS_IN_PRODUCTION_INTERNAL_TOKEN_123';
  const BIOMETRIC_MASTER_KEY = process.env.BIOMETRIC_MASTER_KEY || 'CHANGE_THIS_MASTER_KEY_IN_PRODUCTION_256BITS';

  try {
    const { email, username, name, password } = req.body;

    // Validar campos requeridos
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email es requerido'
      });
    }

    if (!password || password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'La contraseña debe tener al menos 6 caracteres'
      });
    }

    // Validar que se envió la imagen biométrica
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Se requiere una imagen del rostro para completar el registro'
      });
    }

    // Verificar si el usuario ya existe
    const existingUser = await User.findOne({ 
      $or: [
        { email: email.toLowerCase() },
        { username: username }
      ]
    });

    if (existingUser) {
      // Verificar si el usuario tiene biometría registrada
      const existingBiometric = await FacialBiometric.findOne({ userId: existingUser._id });
      
      if (existingBiometric) {
        // Usuario completamente registrado - mensaje específico
        const conflictField = existingUser.email === email.toLowerCase() ? 'correo electrónico' : 'nombre de usuario';
        const conflictValue = existingUser.email === email.toLowerCase() ? email : username;
        
        console.log(`[Register] ❌ Usuario ya registrado completamente - ${conflictField}: ${conflictValue}`);
        
        return res.status(409).json({
          success: false,
          message: `El ${conflictField} "${conflictValue}" ya está registrado en el sistema`,
          errorType: 'DUPLICATE_USER',
          field: conflictField === 'correo electrónico' ? 'email' : 'username',
          registeredAt: existingUser.createdAt
        });
      }
      
      // Usuario existe pero sin biometría - permitir completar el registro
      console.log('[Register] ℹ️ Usuario existe sin biometría, permitiendo completar registro:', existingUser.email);
    }

    // Procesar imagen biométrica ANTES de guardar el usuario
    console.log('[Register] Procesando imagen biométrica...');
    const formData = new FormData();
    formData.append('file', req.file.buffer, {
      filename: 'face.jpg',
      contentType: req.file.mimetype
    });

    let extractionResponse;
    try {
      extractionResponse = await axios.post(
        `${FACIAL_SERVICE_URL}/extract-features`,
        formData,
        {
          headers: {
            ...formData.getHeaders(),
            'X-Internal-Token': INTERNAL_SERVICE_TOKEN
          },
          timeout: 10000
        }
      );
    } catch (error) {
      console.error('[Register] Error comunicándose con servicio facial:', error.message);
      return res.status(500).json({
        success: false,
        message: 'Error procesando imagen facial. Por favor, inténtelo nuevamente.'
      });
    }

    const extractionData = extractionResponse.data;

    if (!extractionData.face_detected) {
      return res.status(400).json({
        success: false,
        message: 'No se detectó un rostro en la imagen. Por favor, intenta nuevamente.'
      });
    }

    if (extractionData.liveness_score < 0.5) {
      return res.status(400).json({
        success: false,
        message: 'La imagen no pasó la verificación de prueba de vida. Por favor, usa una foto en vivo.'
      });
    }

    if (extractionData.quality_score < 0.4) {
      return res.status(400).json({
        success: false,
        message: 'La calidad de la imagen es insuficiente. Por favor, mejora la iluminación.'
      });
    }

    // Verificar que no haya un rostro duplicado
    console.log('[Register] Verificando unicidad del rostro...');
    const existingBiometrics = await FacialBiometric.find({ isActive: true });
    
    for (const existingBio of existingBiometrics) {
      try {
        const storedEncoding = FacialBiometric.decryptEncoding(
          existingBio.encryptedEncoding,
          existingBio.iv,
          existingBio.authTag,
          existingBio.salt,
          BIOMETRIC_MASTER_KEY
        );

        const comparisonResponse = await axios.post(
          `${FACIAL_SERVICE_URL}/compare-faces`,
          {
            encoding1: extractionData.encoding,
            encoding2: storedEncoding,
            threshold: 0.6
          },
          {
            headers: {
              'Content-Type': 'application/json',
              'X-Internal-Token': INTERNAL_SERVICE_TOKEN
            },
            timeout: 5000
          }
        );

        if (comparisonResponse.data.match) {
          // Rostro duplicado encontrado - obtener información del usuario propietario
          const ownerUser = await User.findById(existingBio.userId);
          
          if (ownerUser) {
            const registrationDate = new Date(existingBio.registeredAt).toLocaleDateString('es-EC', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            });
            
            console.log(`[Register] ⚠️ Rostro duplicado detectado! Pertenece a: ${ownerUser.email}`);
            
            return res.status(409).json({
              success: false,
              message: `Este rostro ya está registrado en el sistema`,
              errorType: 'DUPLICATE_FACE',
              details: {
                ownerEmail: ownerUser.email.replace(/(.{2})(.*)(@.*)/, '$1***$3'), // Censurado parcialmente
                ownerName: ownerUser.name,
                registeredAt: registrationDate,
                similarity: (1 - comparisonResponse.data.distance).toFixed(2)
              },
              isDuplicate: true
            });
          } else {
            console.log('[Register] ⚠️ Rostro duplicado detectado!');
            return res.status(409).json({
              success: false,
              message: 'Este rostro ya está registrado en el sistema',
              errorType: 'DUPLICATE_FACE',
              isDuplicate: true
            });
          }
        }
      } catch (compareError) {
        console.error('[Register] Error al comparar con biometría existente:', compareError.message);
      }
    }

    console.log('[Register] ✅ Rostro único verificado. Creando usuario...');

    let user;
    
    if (existingUser) {
      // Usar usuario existente que no tiene biometría
      user = existingUser;
      console.log('[Register] Usando usuario existente:', user.email);
    } else {
      // Hashear la contraseña
      const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

      // Crear nuevo usuario
      const newUsername = username || email.split('@')[0];
      user = new User({
        email: email.toLowerCase(),
        username: newUsername,
        name: name || newUsername,
        passwordHash: passwordHash,
        role: 'USER',
        status: 'ACTIVE'
      });

      await user.save();
      console.log('[Register] Nuevo usuario guardado:', user.email);
    }

    // Guardar biometría
    const { encryptedEncoding, iv, authTag, salt } = FacialBiometric.encryptEncoding(
      extractionData.encoding,
      BIOMETRIC_MASTER_KEY
    );

    const biometric = new FacialBiometric({
      userId: user._id,
      encryptedEncoding,
      iv,
      authTag,
      salt,
      isActive: true,
      registeredAt: new Date(),
      qualityScore: extractionData.quality_score,
      livenessScore: extractionData.liveness_score
    });

    await biometric.save();
    console.log('[Register] ✅ Biometría guardada para usuario:', user.email);

    // Registrar en auditoría
    await BiometricAuditLog.logAttempt({
      userId: user._id,
      email: user.email,
      operation: 'REGISTER_BIOMETRIC',
      result: 'SUCCESS',
      reason: 'Registro exitoso con biometría',
      metrics: {
        qualityScore: extractionData.quality_score,
        livenessScore: extractionData.liveness_score,
        confidence: extractionData.confidence
      },
      clientInfo: {
        ip: req.ip,
        userAgent: req.headers['user-agent']
      }
    });

    res.status(201).json({
      success: true,
      message: `Cuenta creada exitosamente con biometría registrada. Bienvenido ${user.name}`,
      user: {
        _id: user._id.toString(),
        email: user.email,
        username: user.username,
        name: user.name,
        role: user.role
      },
      biometricRegistered: true
    });

  } catch (error) {
    console.error('[Register] Error en registro:', error);
    res.status(500).json({
      success: false,
      message: 'Error al registrar usuario',
      error: error.message
    });
  }
};
