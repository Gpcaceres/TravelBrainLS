const axios = require('axios');
const FormData = require('form-data');
const User = require('../models/User');
const FacialBiometric = require('../models/FacialBiometric');
const BiometricChallenge = require('../models/BiometricChallenge');
const BiometricAuditLog = require('../models/BiometricAuditLog');
const jwt = require('jsonwebtoken');

/**
 * Controlador de Autenticación Biométrica
 * 
 * Implementa el flujo de seguridad en 4 pasos:
 * 1. Solicitud de desafío (nonce)
 * 2. Captura con prueba de vida
 * 3. Análisis en microservicio Python
 * 4. Verificación y comparación
 */

// URL del microservicio Python (red interna Docker)
const FACIAL_SERVICE_URL = process.env.FACIAL_SERVICE_URL || 'http://facial-recognition:8001';
const INTERNAL_SERVICE_TOKEN = process.env.INTERNAL_SERVICE_TOKEN || 'CHANGE_THIS_IN_PRODUCTION_INTERNAL_TOKEN_123';
const BIOMETRIC_MASTER_KEY = process.env.BIOMETRIC_MASTER_KEY || 'CHANGE_THIS_MASTER_KEY_IN_PRODUCTION_256BITS';

// Umbral de similitud para verificación (0.6 = 60% de similitud mínima)
const VERIFICATION_THRESHOLD = parseFloat(process.env.VERIFICATION_THRESHOLD || '0.6');

/**
 * Paso 1: Solicitar desafío para iniciar flujo biométrico
 * 
 * @route POST /api/biometric/challenge
 * @access Public
 */
const requestChallenge = async (req, res) => {
  const startTime = Date.now();
  
  try {
    const { email, operation = 'LOGIN' } = req.body;
    
    // Validar entrada
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'El email es requerido'
      });
    }
    
    // Validar que el usuario existe (para LOGIN)
    if (operation === 'LOGIN') {
      const user = await User.findOne({ email: email.toLowerCase() });
      if (!user) {
        // Por seguridad, no revelar si el usuario existe
        return res.status(400).json({
          success: false,
          message: 'Credenciales inválidas'
        });
      }
      
      // Verificar que tenga biometría registrada
      const biometric = await FacialBiometric.findOne({ 
        userId: user._id,
        isActive: true 
      });
      
      if (!biometric) {
        return res.status(400).json({
          success: false,
          message: 'No hay biometría registrada para este usuario'
        });
      }
    }
    
    // Obtener información del cliente
    const clientIp = req.ip || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'];
    
    // Generar desafío
    const challenge = await BiometricChallenge.generateChallenge(
      email.toLowerCase(),
      operation,
      clientIp,
      userAgent
    );
    
    const processingTime = Date.now() - startTime;
    
    res.json({
      success: true,
      data: {
        challengeToken: challenge.token,
        expiresIn: 120, // segundos
        operation: operation
      },
      message: 'Desafío generado. Por favor, capture su rostro.'
    });
    
  } catch (error) {
    console.error('Error generando desafío:', error);
    res.status(500).json({
      success: false,
      message: 'Error generando desafío de autenticación'
    });
  }
};

/**
 * Paso 2-4: Verificar identidad biométrica y autenticar
 * 
 * @route POST /api/biometric/verify
 * @access Public
 */
const verifyBiometric = async (req, res) => {
  const startTime = Date.now();
  let userId = null;
  let email = null;
  
  try {
    const { challengeToken, email: userEmail } = req.body;
    email = userEmail?.toLowerCase();
    
    // Validar entrada
    if (!challengeToken || !email) {
      return res.status(400).json({
        success: false,
        message: 'Token de desafío y email son requeridos'
      });
    }
    
    // Validar que se envió una imagen
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Se requiere una imagen del rostro'
      });
    }
    
    // Paso 1: Validar desafío
    let challenge;
    try {
      challenge = await BiometricChallenge.validateAndUse(challengeToken, email);
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    
    // Buscar usuario
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'No se pudo verificar la identidad'
      });
    }
    
    userId = user._id;
    
    // Buscar biometría registrada
    const storedBiometric = await FacialBiometric.findOne({ 
      userId: user._id,
      isActive: true 
    });
    
    if (!storedBiometric) {
      await BiometricAuditLog.logAttempt({
        userId: user._id,
        email,
        operation: 'LOGIN_ATTEMPT',
        result: 'FAILURE',
        reason: 'No hay biometría registrada',
        clientInfo: {
          ip: req.ip,
          userAgent: req.headers['user-agent']
        },
        processingTime: Date.now() - startTime
      });
      
      return res.status(401).json({
        success: false,
        message: 'No se pudo verificar la identidad'
      });
    }
    
    // Verificar que no esté bloqueado por múltiples intentos fallidos
    if (!storedBiometric.isActive) {
      await BiometricAuditLog.logAttempt({
        userId: user._id,
        email,
        operation: 'LOGIN_ATTEMPT',
        result: 'FAILURE',
        reason: 'Cuenta bloqueada por múltiples intentos fallidos',
        clientInfo: {
          ip: req.ip,
          userAgent: req.headers['user-agent']
        },
        processingTime: Date.now() - startTime
      });
      
      return res.status(403).json({
        success: false,
        message: 'Cuenta temporalmente bloqueada. Contacte al administrador.'
      });
    }
    
    // Verificar bloqueo temporal por intentos fallidos (3 intentos)
    if (storedBiometric.isLocked()) {
      const remainingSeconds = storedBiometric.getRemainingLockTime();
      const remainingMinutes = Math.ceil(remainingSeconds / 60);
      
      await BiometricAuditLog.logAttempt({
        userId: user._id,
        email,
        operation: 'LOGIN_ATTEMPT',
        result: 'FAILURE',
        reason: `Cuenta bloqueada temporalmente. ${remainingMinutes} minuto(s) restantes`,
        metrics: {
          failedAttempts: storedBiometric.failedAttempts,
          remainingLockSeconds: remainingSeconds
        },
        clientInfo: {
          ip: req.ip,
          userAgent: req.headers['user-agent']
        },
        processingTime: Date.now() - startTime
      });
      
      return res.status(423).json({ // 423 Locked
        success: false,
        message: `Demasiados intentos fallidos. Cuenta bloqueada por ${remainingMinutes} minuto(s).`,
        lockedUntil: storedBiometric.lockedUntil,
        remainingSeconds: remainingSeconds,
        failedAttempts: storedBiometric.failedAttempts
      });
    }
    
    // Si el bloqueo expiró, resetear intentos fallidos
    if (storedBiometric.lockedUntil && storedBiometric.lockedUntil < new Date()) {
      storedBiometric.failedAttempts = 0;
      storedBiometric.lockedUntil = null;
      await storedBiometric.save();
      console.log(`[Security] Bloqueo expirado para usuario ${email}. Intentos reseteados.`);
    }
    
    // Paso 2: Enviar imagen al microservicio Python para extracción de características
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
          timeout: 10000 // 10 segundos
        }
      );
    } catch (error) {
      console.error('Error comunicándose con servicio de reconocimiento facial:', error.message);
      
      await BiometricAuditLog.logAttempt({
        userId: user._id,
        email,
        operation: 'LOGIN_ATTEMPT',
        result: 'ERROR',
        reason: 'Error de comunicación con servicio de reconocimiento',
        clientInfo: {
          ip: req.ip,
          userAgent: req.headers['user-agent']
        },
        processingTime: Date.now() - startTime
      });
      
      return res.status(500).json({
        success: false,
        message: 'Error procesando imagen. Por favor, inténtelo de nuevo.'
      });
    }
    
    const extractionData = extractionResponse.data;
    
    // Verificar que se detectó un rostro
    if (!extractionData.face_detected) {
      await storedBiometric.incrementFailedAttempts();
      
      await BiometricAuditLog.logAttempt({
        userId: user._id,
        email,
        operation: 'LOGIN_ATTEMPT',
        result: 'FAILURE',
        reason: extractionData.message,
        metrics: {
          livenessScore: extractionData.liveness_score,
          qualityScore: extractionData.quality_score,
          confidence: extractionData.confidence
        },
        clientInfo: {
          ip: req.ip,
          userAgent: req.headers['user-agent']
        },
        processingTime: Date.now() - startTime
      });
      
      return res.status(401).json({
        success: false,
        message: 'No se pudo verificar la identidad'
      });
    }
    
    // Verificar prueba de vida (liveness detection)
    if (extractionData.liveness_score < 0.5) {
      await storedBiometric.incrementFailedAttempts();
      
      await BiometricAuditLog.logAttempt({
        userId: user._id,
        email,
        operation: 'LOGIN_ATTEMPT',
        result: 'FAILURE',
        reason: 'Fallo en detección de vida (anti-spoofing)',
        metrics: {
          livenessScore: extractionData.liveness_score,
          qualityScore: extractionData.quality_score,
          confidence: extractionData.confidence
        },
        clientInfo: {
          ip: req.ip,
          userAgent: req.headers['user-agent']
        },
        processingTime: Date.now() - startTime
      });
      
      return res.status(401).json({
        success: false,
        message: 'No se pudo verificar la identidad'
      });
    }
    
    // Verificar calidad de imagen
    if (extractionData.quality_score < 0.4) {
      await storedBiometric.incrementFailedAttempts();
      
      await BiometricAuditLog.logAttempt({
        userId: user._id,
        email,
        operation: 'LOGIN_ATTEMPT',
        result: 'FAILURE',
        reason: 'Calidad de imagen insuficiente',
        metrics: {
          livenessScore: extractionData.liveness_score,
          qualityScore: extractionData.quality_score,
          confidence: extractionData.confidence
        },
        clientInfo: {
          ip: req.ip,
          userAgent: req.headers['user-agent']
        },
        processingTime: Date.now() - startTime
      });
      
      return res.status(400).json({
        success: false,
        message: 'La calidad de la imagen es insuficiente. Por favor, mejore la iluminación.'
      });
    }
    
    // Paso 3: Descifrar encoding almacenado
    let storedEncoding;
    try {
      storedEncoding = FacialBiometric.decryptEncoding(
        storedBiometric.encryptedEncoding,
        storedBiometric.iv,
        storedBiometric.authTag,
        storedBiometric.salt,
        BIOMETRIC_MASTER_KEY
      );
    } catch (error) {
      console.error('Error descifrando encoding:', error.message);
      
      await BiometricAuditLog.logAttempt({
        userId: user._id,
        email,
        operation: 'LOGIN_ATTEMPT',
        result: 'ERROR',
        reason: 'Error descifrando datos biométricos',
        clientInfo: {
          ip: req.ip,
          userAgent: req.headers['user-agent']
        },
        processingTime: Date.now() - startTime
      });
      
      return res.status(500).json({
        success: false,
        message: 'Error procesando autenticación'
      });
    }
    
    // Paso 4: Comparar encodings
    let comparisonResponse;
    try {
      comparisonResponse = await axios.post(
        `${FACIAL_SERVICE_URL}/compare-faces`,
        {
          encoding1: extractionData.encoding,
          encoding2: storedEncoding,
          threshold: VERIFICATION_THRESHOLD
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'X-Internal-Token': INTERNAL_SERVICE_TOKEN
          },
          timeout: 5000
        }
      );
    } catch (error) {
      console.error('Error comparando rostros:', error.message);
      
      await BiometricAuditLog.logAttempt({
        userId: user._id,
        email,
        operation: 'LOGIN_ATTEMPT',
        result: 'ERROR',
        reason: 'Error en comparación de rostros',
        clientInfo: {
          ip: req.ip,
          userAgent: req.headers['user-agent']
        },
        processingTime: Date.now() - startTime
      });
      
      return res.status(500).json({
        success: false,
        message: 'Error procesando autenticación'
      });
    }
    
    const comparisonData = comparisonResponse.data;
    
    // Verificar si hay coincidencia
    if (!comparisonData.match) {
      await storedBiometric.incrementFailedAttempts();
      
      await BiometricAuditLog.logAttempt({
        userId: user._id,
        email,
        operation: 'LOGIN_ATTEMPT',
        result: 'FAILURE',
        reason: 'Identidad no verificada - sin coincidencia',
        metrics: {
          livenessScore: extractionData.liveness_score,
          qualityScore: extractionData.quality_score,
          confidence: comparisonData.confidence,
          matchDistance: comparisonData.distance
        },
        clientInfo: {
          ip: req.ip,
          userAgent: req.headers['user-agent']
        },
        processingTime: Date.now() - startTime
      });
      
      return res.status(401).json({
        success: false,
        message: 'No se pudo verificar la identidad'
      });
    }
    
    // ¡ÉXITO! Resetear intentos fallidos
    await storedBiometric.resetFailedAttempts();
    
    // Registrar intento exitoso
    await BiometricAuditLog.logAttempt({
      userId: user._id,
      email,
      operation: 'LOGIN_ATTEMPT',
      result: 'SUCCESS',
      reason: 'Identidad verificada exitosamente',
      metrics: {
        livenessScore: extractionData.liveness_score,
        qualityScore: extractionData.quality_score,
        confidence: comparisonData.confidence,
        matchDistance: comparisonData.distance
      },
      clientInfo: {
        ip: req.ip,
        userAgent: req.headers['user-agent']
      },
      processingTime: Date.now() - startTime
    });
    
    // Generar JWT token
    const token = jwt.sign(
      { 
        userId: user._id,  // Cambiado de "id" a "userId" para consistencia con middleware
        email: user.email,
        role: user.role,
        authMethod: 'biometric'
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );
    
    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          role: user.role
        },
        verification: {
          confidence: comparisonData.confidence,
          method: 'facial-biometric'
        }
      },
      message: 'Autenticación biométrica exitosa'
    });
    
  } catch (error) {
    console.error('Error en verificación biométrica:', error);
    
    if (userId && email) {
      await BiometricAuditLog.logAttempt({
        userId,
        email,
        operation: 'LOGIN_ATTEMPT',
        result: 'ERROR',
        reason: `Error inesperado: ${error.message}`,
        clientInfo: {
          ip: req.ip,
          userAgent: req.headers['user-agent']
        },
        processingTime: Date.now() - startTime
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error procesando autenticación biométrica'
    });
  }
};

/**
 * Registrar biometría facial para un usuario
 * 
 * @route POST /api/biometric/register
 * @access Private (requiere JWT token)
 */
const registerBiometric = async (req, res) => {
  const startTime = Date.now();
  
  try {
    const userId = req.user.id; // Del middleware de autenticación
    const email = req.user.email;
    
    // Validar que se envió una imagen
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Se requiere una imagen del rostro'
      });
    }
    
    // Extraer características de la imagen
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
      console.error('Error en servicio de reconocimiento:', error.message);
      return res.status(500).json({
        success: false,
        message: 'Error procesando imagen'
      });
    }
    
    const extractionData = extractionResponse.data;
    
    // Validaciones
    if (!extractionData.face_detected) {
      return res.status(400).json({
        success: false,
        message: extractionData.message
      });
    }
    
    // Ajustado a 0.6 para permitir capturas desde canvas que tienen scores de texture/moiré más bajos
    // pero siguen siendo legítimas capturas en vivo de webcam
    if (extractionData.liveness_score < 0.6) {
      return res.status(400).json({
        success: false,
        message: 'La imagen no pasó las pruebas de autenticidad. Use una cámara en vivo.'
      });
    }
    
    if (extractionData.quality_score < 0.6) {
      return res.status(400).json({
        success: false,
        message: 'La calidad de la imagen es insuficiente. Mejore la iluminación y enfoque.'
      });
    }

    // === NUEVA VALIDACIÓN: Verificar que el rostro no esté ya registrado ===
    console.log('[BiometricRegister] Verificando unicidad del rostro...');
    
    try {
      // Obtener todas las biometrías activas (excepto la del usuario actual, si existe)
      const existingBiometrics = await FacialBiometric.find({ 
        userId: { $ne: userId },
        isActive: true 
      });
      
      console.log(`[BiometricRegister] Comparando con ${existingBiometrics.length} rostros registrados...`);
      
      // Comparar con cada rostro existente
      for (const existingBio of existingBiometrics) {
        try {
          // Descifrar el encoding almacenado
          const decryptedEncoding = FacialBiometric.decryptEncoding(
            existingBio.encryptedEncoding,
            existingBio.iv,
            existingBio.authTag,
            existingBio.salt,
            BIOMETRIC_MASTER_KEY
          );
          
          // Comparar con el nuevo encoding usando el microservicio
          const comparisonResponse = await axios.post(
            `${FACIAL_SERVICE_URL}/compare-faces`,
            {
              encoding1: extractionData.encoding,
              encoding2: decryptedEncoding,
              threshold: 0.45  // Umbral ajustado: distancia < 0.45 = mismo rostro
            },
            {
              headers: {
                'Content-Type': 'application/json',
                'X-Internal-Token': INTERNAL_SERVICE_TOKEN
              },
              timeout: 5000
            }
          );
          
          const comparison = comparisonResponse.data;
          
          // Si hay match, rechazar el registro
          if (comparison.match) {
            console.log(`[BiometricRegister] ⚠️ Rostro duplicado detectado! Distancia: ${comparison.distance}`);
            
            // Log de auditoría
            await BiometricAuditLog.logAttempt({
              userId,
              email,
              operation: 'REGISTER_BIOMETRIC',
              result: 'FAILURE',
              reason: `Rostro ya registrado en otra cuenta (similitud: ${(comparison.confidence * 100).toFixed(1)}%)`,
              metrics: {
                distance: comparison.distance,
                confidence: comparison.confidence,
                livenessScore: extractionData.liveness_score,
                qualityScore: extractionData.quality_score
              },
              clientInfo: {
                ip: req.ip,
                userAgent: req.headers['user-agent']
              },
              processingTime: Date.now() - startTime
            });
            
            return res.status(409).json({
              success: false,
              message: '⚠️ Este rostro ya está registrado en otra cuenta. Cada persona solo puede registrar su rostro una vez.',
              isDuplicate: true,
              similarityScore: (comparison.confidence * 100).toFixed(1)
            });
          }
          
        } catch (decryptError) {
          console.error('[BiometricRegister] Error al comparar con una biometría existente:', decryptError.message);
          // Continuar con la siguiente comparación
          continue;
        }
      }
      
      console.log('[BiometricRegister] ✅ Rostro único verificado');
      
    } catch (uniquenessError) {
      console.error('[BiometricRegister] Error verificando unicidad del rostro:', uniquenessError);
      // En caso de error en la verificación de unicidad, continuar con el registro
      // pero loguearlo para análisis posterior
    }
    
    // === FIN DE VALIDACIÓN DE UNICIDAD ===
    
    // Cifrar encoding
    const encryptedData = FacialBiometric.encryptEncoding(
      extractionData.encoding,
      BIOMETRIC_MASTER_KEY
    );
    
    // Guardar o actualizar biometría
    const biometric = await FacialBiometric.findOneAndUpdate(
      { userId },
      {
        userId,
        encryptedEncoding: encryptedData.encryptedEncoding,
        iv: encryptedData.iv,
        authTag: encryptedData.authTag,
        salt: encryptedData.salt,
        qualityScore: extractionData.quality_score,
        livenessScore: extractionData.liveness_score,
        isActive: true,
        failedAttempts: 0
      },
      { 
        upsert: true, 
        new: true,
        setDefaultsOnInsert: true
      }
    );
    
    // Log de auditoría
    await BiometricAuditLog.logAttempt({
      userId,
      email,
      operation: 'REGISTER_BIOMETRIC',
      result: 'SUCCESS',
      reason: 'Biometría registrada exitosamente',
      metrics: {
        livenessScore: extractionData.liveness_score,
        qualityScore: extractionData.quality_score,
        confidence: extractionData.confidence
      },
      clientInfo: {
        ip: req.ip,
        userAgent: req.headers['user-agent']
      },
      processingTime: Date.now() - startTime
    });
    
    res.json({
      success: true,
      data: {
        registered: true,
        qualityScore: extractionData.quality_score,
        livenessScore: extractionData.liveness_score
      },
      message: 'Biometría facial registrada exitosamente'
    });
    
  } catch (error) {
    console.error('Error registrando biometría:', error);
    
    if (req.user) {
      await BiometricAuditLog.logAttempt({
        userId: req.user.id,
        email: req.user.email,
        operation: 'REGISTER_BIOMETRIC',
        result: 'ERROR',
        reason: `Error: ${error.message}`,
        clientInfo: {
          ip: req.ip,
          userAgent: req.headers['user-agent']
        },
        processingTime: Date.now() - startTime
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error registrando biometría facial'
    });
  }
};

/**
 * Obtener estado de biometría del usuario
 * 
 * @route GET /api/biometric/status
 * @access Private
 */
const getBiometricStatus = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const biometric = await FacialBiometric.findOne({ userId });
    
    if (!biometric) {
      return res.json({
        success: true,
        data: {
          registered: false,
          isActive: false
        }
      });
    }
    
    res.json({
      success: true,
      data: {
        registered: true,
        isActive: biometric.isActive,
        qualityScore: biometric.qualityScore,
        registeredAt: biometric.registeredAt,
        lastUpdated: biometric.lastUpdated
      }
    });
    
  } catch (error) {
    console.error('Error obteniendo estado biométrico:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo estado'
    });
  }
};

/**
 * Validar rostro sin registrar (para verificación pre-registro)
 * 
 * @route POST /api/biometric/validate-face
 * @access Public
 */
const validateFace = async (req, res) => {
  const startTime = Date.now();
  
  try {
    // Validar que se envió una imagen
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Se requiere una imagen del rostro'
      });
    }
    
    // Extraer características de la imagen
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
      console.error('[ValidateFace] Error en servicio de reconocimiento:', error.message);
      return res.status(500).json({
        success: false,
        message: 'Error procesando imagen'
      });
    }
    
    const extractionData = extractionResponse.data;
    
    // Validaciones
    if (!extractionData.face_detected) {
      return res.status(400).json({
        success: false,
        message: extractionData.message || 'No se detectó un rostro en la imagen'
      });
    }
    
    if (extractionData.liveness_score < 0.6) {
      return res.status(400).json({
        success: false,
        message: 'La imagen no pasó las pruebas de autenticidad. Use una cámara en vivo.'
      });
    }
    
    if (extractionData.quality_score < 0.6) {
      return res.status(400).json({
        success: false,
        message: 'La calidad de la imagen es insuficiente. Mejore la iluminación y enfoque.'
      });
    }

    // Verificar que el rostro no esté ya registrado
    console.log('[ValidateFace] Verificando unicidad del rostro...');
    
    try {
      const existingBiometrics = await FacialBiometric.find({ isActive: true });
      console.log(`[ValidateFace] Comparando con ${existingBiometrics.length} rostros registrados...`);
      
      for (const existingBio of existingBiometrics) {
        try {
          const decryptedEncoding = FacialBiometric.decryptEncoding(
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
              encoding2: decryptedEncoding,
              threshold: 0.45
            },
            {
              headers: {
                'Content-Type': 'application/json',
                'X-Internal-Token': INTERNAL_SERVICE_TOKEN
              },
              timeout: 5000
            }
          );
          
          const comparison = comparisonResponse.data;
          
          if (comparison.match) {
            console.log(`[ValidateFace] ⚠️ Rostro duplicado detectado! Distancia: ${comparison.distance}`);
            return res.status(409).json({
              success: false,
              message: '⚠️ Este rostro ya está registrado en otra cuenta. Cada persona solo puede registrar su rostro una vez.',
              isDuplicate: true,
              similarityScore: (comparison.confidence * 100).toFixed(1)
            });
          }
        } catch (decryptError) {
          console.error('[ValidateFace] Error al comparar:', decryptError.message);
          continue;
        }
      }
      
      console.log('[ValidateFace] ✅ Rostro único verificado');
      
    } catch (uniquenessError) {
      console.error('[ValidateFace] Error verificando unicidad:', uniquenessError);
      return res.status(500).json({
        success: false,
        message: 'Error validando imagen. Por favor, inténtelo nuevamente.'
      });
    }
    
    // Todo OK
    res.json({
      success: true,
      message: 'Rostro validado correctamente',
      metrics: {
        qualityScore: extractionData.quality_score,
        livenessScore: extractionData.liveness_score,
        confidence: extractionData.confidence
      },
      processingTime: Date.now() - startTime
    });
    
  } catch (error) {
    console.error('[ValidateFace] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error validando rostro'
    });
  }
};

module.exports = {
  requestChallenge,
  verifyBiometric,
  registerBiometric,
  validateFace,
  getBiometricStatus
};
