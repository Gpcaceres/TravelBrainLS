const mongoose = require('mongoose');
const crypto = require('crypto');

/**
 * Facial Biometric Schema
 * Almacena datos biométricos faciales cifrados
 * 
 * Seguridad:
 * - Encodings cifrados con AES-256-GCM
 * - Salt único por usuario
 * - IV (Initialization Vector) único por cifrado
 * - No almacena imágenes
 */
const facialBiometricSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true
    },
    // Encoding facial cifrado (128 dimensiones convertidas a buffer cifrado)
    encryptedEncoding: {
      type: Buffer,
      required: true
    },
    // IV (Initialization Vector) para el cifrado AES-GCM
    iv: {
      type: Buffer,
      required: true
    },
    // Authentication tag para verificar integridad (GCM)
    authTag: {
      type: Buffer,
      required: true
    },
    // Salt único para derivación de clave
    salt: {
      type: Buffer,
      required: true
    },
    // Metadatos de calidad (NO sensibles)
    qualityScore: {
      type: Number,
      min: 0,
      max: 1,
      required: true
    },
    livenessScore: {
      type: Number,
      min: 0,
      max: 1,
      required: true
    },
    // Registro de auditoría
    registeredAt: {
      type: Date,
      default: Date.now
    },
    lastUpdated: {
      type: Date,
      default: Date.now
    },
    // Número de intentos de verificación fallidos (prevención de ataques de fuerza bruta)
    failedAttempts: {
      type: Number,
      default: 0
    },
    lastFailedAttempt: {
      type: Date
    },
    // Timestamp hasta cuando la cuenta está bloqueada
    lockedUntil: {
      type: Date,
      default: null
    },
    // Estado de la biometría
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true,
    collection: 'facial_biometrics'
  }
);

/**
 * Índices para optimización y seguridad
 */
facialBiometricSchema.index({ userId: 1, isActive: 1 });
facialBiometricSchema.index({ registeredAt: -1 });

/**
 * Método estático: Cifrar encoding facial
 * 
 * @param {Array<number>} encoding - Vector de 128 dimensiones
 * @param {string} masterKey - Clave maestra del sistema (de variable de entorno)
 * @returns {Object} - Objeto con datos cifrados
 */
facialBiometricSchema.statics.encryptEncoding = function(encoding, masterKey) {
  try {
    // Generar salt único
    const salt = crypto.randomBytes(32);
    
    // Derivar clave usando PBKDF2 (más seguro que usar la clave directamente)
    const key = crypto.pbkdf2Sync(
      masterKey,
      salt,
      100000, // 100k iteraciones
      32, // 256 bits
      'sha512'
    );
    
    // Generar IV único
    const iv = crypto.randomBytes(16);
    
    // Convertir encoding a buffer JSON
    const encodingBuffer = Buffer.from(JSON.stringify(encoding), 'utf8');
    
    // Cifrar con AES-256-GCM
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
    
    let encrypted = cipher.update(encodingBuffer);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    
    // Obtener authentication tag (para verificar integridad)
    const authTag = cipher.getAuthTag();
    
    return {
      encryptedEncoding: encrypted,
      iv: iv,
      authTag: authTag,
      salt: salt
    };
  } catch (error) {
    throw new Error(`Error cifrando encoding: ${error.message}`);
  }
};

/**
 * Método estático: Descifrar encoding facial
 * 
 * @param {Buffer} encryptedEncoding - Encoding cifrado
 * @param {Buffer} iv - Initialization Vector
 * @param {Buffer} authTag - Authentication tag
 * @param {Buffer} salt - Salt usado en derivación de clave
 * @param {string} masterKey - Clave maestra del sistema
 * @returns {Array<number>} - Vector de 128 dimensiones
 */
facialBiometricSchema.statics.decryptEncoding = function(
  encryptedEncoding,
  iv,
  authTag,
  salt,
  masterKey
) {
  try {
    // Derivar la misma clave usando el salt
    const key = crypto.pbkdf2Sync(
      masterKey,
      salt,
      100000,
      32,
      'sha512'
    );
    
    // Descifrar con AES-256-GCM
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encryptedEncoding);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    
    // Parsear JSON
    const encoding = JSON.parse(decrypted.toString('utf8'));
    
    return encoding;
  } catch (error) {
    throw new Error(`Error descifrando encoding: ${error.message}`);
  }
};

/**
 * Método de instancia: Incrementar contador de intentos fallidos
 * Si alcanza 3 intentos fallidos, bloquear por 15 minutos
 */
facialBiometricSchema.methods.incrementFailedAttempts = async function() {
  this.failedAttempts += 1;
  
  if (this.failedAttempts >= 3) {
    this.lockedUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 minutos desde ahora
    console.log(`[Security] Usuario bloqueado hasta: ${this.lockedUntil}`);
  }
  
  await this.save();
};

/**
 * Método de instancia: Resetear contador de intentos fallidos
 */
facialBiometricSchema.methods.resetFailedAttempts = async function() {
  this.failedAttempts = 0;
  this.lastFailedAttempt = null;
  this.lockedUntil = null;
  this.isActive = true;
  await this.save();
};

/**
 * Método de instancia: Verificar si la cuenta está bloqueada
 * @returns {boolean} - True si está bloqueada
 */
facialBiometricSchema.methods.isLocked = function() {
  // Si no hay lockedUntil, no está bloqueada
  if (!this.lockedUntil) {
    return false;
  }
  
  // Si lockedUntil ya pasó, desbloquear automáticamente
  if (this.lockedUntil < new Date()) {
    return false;
  }
  
  // Está bloqueada
  return true;
};

/**
 * Método de instancia: Obtener tiempo restante de bloqueo en segundos
 * @returns {number} - Segundos restantes de bloqueo, 0 si no está bloqueada
 */
facialBiometricSchema.methods.getRemainingLockTime = function() {
  if (!this.isLocked()) {
    return 0;
  }
  
  const remaining = Math.ceil((this.lockedUntil - new Date()) / 1000);
  return remaining > 0 ? remaining : 0;
};

/**
 * Middleware: Actualizar lastUpdated antes de guardar
 */
facialBiometricSchema.pre('save', function(next) {
  if (this.isModified('encryptedEncoding')) {
    this.lastUpdated = new Date();
  }
  next();
});

const FacialBiometric = mongoose.model('FacialBiometric', facialBiometricSchema);

module.exports = FacialBiometric;
