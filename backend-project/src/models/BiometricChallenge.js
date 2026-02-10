const mongoose = require('mongoose');

/**
 * Biometric Challenge Schema
 * Almacena desafíos temporales para autenticación biométrica
 * 
 * Implementa prevención de ataques de repetición (replay attacks)
 * mediante tokens de un solo uso con expiración
 */
const biometricChallengeSchema = new mongoose.Schema(
  {
    // Token único (nonce)
    token: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    // Email del usuario que solicita el desafío
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true
    },
    // Tipo de operación
    operation: {
      type: String,
      enum: ['LOGIN', 'REGISTER', 'UPDATE'],
      required: true
    },
    // Estado del desafío
    status: {
      type: String,
      enum: ['PENDING', 'USED', 'EXPIRED'],
      default: 'PENDING'
    },
    // Timestamp de creación
    createdAt: {
      type: Date,
      default: Date.now,
      expires: 300 // Auto-eliminar después de 300 segundos (5 minutos)
    },
    // Timestamp de uso
    usedAt: {
      type: Date
    },
    // IP del cliente (para auditoría)
    clientIp: {
      type: String
    },
    // User agent (para auditoría)
    userAgent: {
      type: String
    }
  },
  {
    collection: 'biometric_challenges'
  }
);

/**
 * Índices
 */
biometricChallengeSchema.index({ token: 1, status: 1 });
biometricChallengeSchema.index({ email: 1, createdAt: -1 });
biometricChallengeSchema.index({ createdAt: 1 }, { expireAfterSeconds: 300 });

/**
 * Método estático: Generar un nuevo desafío
 */
biometricChallengeSchema.statics.generateChallenge = async function(
  email,
  operation,
  clientIp,
  userAgent
) {
  const crypto = require('crypto');
  
  // Generar token único (32 bytes = 256 bits)
  const token = crypto.randomBytes(32).toString('hex');
  
  // Crear desafío
  const challenge = await this.create({
    token,
    email,
    operation,
    clientIp,
    userAgent
  });
  
  return challenge;
};

/**
 * Método estático: Validar y marcar como usado
 */
biometricChallengeSchema.statics.validateAndUse = async function(token, email) {
  const challenge = await this.findOne({
    token,
    email,
    status: 'PENDING'
  });
  
  if (!challenge) {
    throw new Error('Desafío inválido o expirado');
  }
  
  // Verificar que no haya expirado (300 segundos = 5 minutos)
  const now = new Date();
  const elapsed = (now - challenge.createdAt) / 1000;
  
  if (elapsed > 300) {
    challenge.status = 'EXPIRED';
    await challenge.save();
    throw new Error('El desafío ha expirado');
  }
  
  // Marcar como usado
  challenge.status = 'USED';
  challenge.usedAt = now;
  await challenge.save();
  
  return challenge;
};

const BiometricChallenge = mongoose.model('BiometricChallenge', biometricChallengeSchema);

module.exports = BiometricChallenge;
