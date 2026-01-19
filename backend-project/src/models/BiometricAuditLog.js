const mongoose = require('mongoose');

/**
 * Biometric Audit Log Schema
 * Registro de auditoría para intentos de autenticación biométrica
 * 
 * Cumple con requisitos de seguridad y compliance:
 * - Registro de todos los intentos (exitosos y fallidos)
 * - NO almacena imágenes
 * - Retención de logs por 90 días
 */
const biometricAuditLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    email: {
      type: String,
      required: true,
      lowercase: true
    },
    // Tipo de operación
    operation: {
      type: String,
      enum: ['LOGIN_ATTEMPT', 'REGISTER_BIOMETRIC', 'UPDATE_BIOMETRIC', 'VERIFY_IDENTITY'],
      required: true
    },
    // Resultado
    result: {
      type: String,
      enum: ['SUCCESS', 'FAILURE', 'ERROR'],
      required: true
    },
    // Razón del resultado
    reason: {
      type: String,
      required: true
    },
    // Métricas (NO datos biométricos sensibles)
    metrics: {
      livenessScore: {
        type: Number,
        min: 0,
        max: 1
      },
      qualityScore: {
        type: Number,
        min: 0,
        max: 1
      },
      confidence: {
        type: Number,
        min: 0,
        max: 1
      },
      matchDistance: {
        type: Number
      }
    },
    // Información del cliente (para detectar patrones sospechosos)
    clientInfo: {
      ip: String,
      userAgent: String,
      location: {
        country: String,
        city: String
      }
    },
    // Timestamp
    timestamp: {
      type: Date,
      default: Date.now,
      index: true
    },
    // Duración del proceso (en milisegundos)
    processingTime: {
      type: Number
    }
  },
  {
    timestamps: false,
    collection: 'biometric_audit_logs'
  }
);

/**
 * Índices para consultas y análisis
 */
biometricAuditLogSchema.index({ userId: 1, timestamp: -1 });
biometricAuditLogSchema.index({ email: 1, timestamp: -1 });
biometricAuditLogSchema.index({ result: 1, timestamp: -1 });
biometricAuditLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 7776000 }); // 90 días

/**
 * Método estático: Registrar intento de autenticación
 */
biometricAuditLogSchema.statics.logAttempt = async function(data) {
  try {
    await this.create({
      userId: data.userId,
      email: data.email,
      operation: data.operation,
      result: data.result,
      reason: data.reason,
      metrics: data.metrics || {},
      clientInfo: data.clientInfo || {},
      processingTime: data.processingTime
    });
  } catch (error) {
    // No fallar la operación principal si el log falla
    console.error('Error registrando log de auditoría:', error.message);
  }
};

/**
 * Método estático: Detectar patrones sospechosos
 */
biometricAuditLogSchema.statics.detectSuspiciousActivity = async function(
  userId,
  timeWindowMinutes = 15
) {
  const since = new Date(Date.now() - timeWindowMinutes * 60 * 1000);
  
  const recentFailures = await this.countDocuments({
    userId,
    result: 'FAILURE',
    timestamp: { $gte: since }
  });
  
  // Si hay más de 5 fallos en 15 minutos, es sospechoso
  return {
    isSuspicious: recentFailures >= 5,
    failureCount: recentFailures,
    timeWindow: timeWindowMinutes
  };
};

/**
 * Método estático: Obtener estadísticas de usuario
 */
biometricAuditLogSchema.statics.getUserStats = async function(userId, days = 30) {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  
  const stats = await this.aggregate([
    {
      $match: {
        userId: mongoose.Types.ObjectId(userId),
        timestamp: { $gte: since }
      }
    },
    {
      $group: {
        _id: '$result',
        count: { $sum: 1 },
        avgProcessingTime: { $avg: '$processingTime' },
        avgConfidence: { $avg: '$metrics.confidence' }
      }
    }
  ]);
  
  return stats;
};

const BiometricAuditLog = mongoose.model('BiometricAuditLog', biometricAuditLogSchema);

module.exports = BiometricAuditLog;
