const jwt = require('jsonwebtoken');
const User = require('../models/User');
const config = require('../config/env');

/**
 * Middleware to verify JWT token and authenticate user
 */
exports.authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    console.log('[Auth Middleware] Authorization header:', authHeader ? authHeader.substring(0, 30) + '...' : 'NO HEADER');
    
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      console.log('[Auth Middleware] ❌ No token provided');
      return res.status(401).json({
        success: false,
        message: 'Token de autenticación requerido'
      });
    }

    console.log('[Auth Middleware] Token recibido (primeros 20 chars):', token.substring(0, 20) + '...');

    // Verify token
    const decoded = jwt.verify(token, config.jwtSecret);
    console.log('[Auth Middleware] Token decodificado - userId:', decoded.userId);
    
    const user = await User.findById(decoded.userId);

    if (!user) {
      console.log('[Auth Middleware] ❌ Usuario no encontrado para userId:', decoded.userId);
      return res.status(401).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    console.log('[Auth Middleware] ✅ Usuario autenticado:', user.email);

    // Check if user is active
    if (user.status !== 'ACTIVE') {
      return res.status(403).json({
        success: false,
        message: 'Tu cuenta ha sido desactivada. Contacta al administrador.'
      });
    }

    // Attach user to request
    req.user = {
      id: user._id.toString(),
      email: user.email,
      username: user.username,
      name: user.name,
      role: user.role,
      status: user.status
    };

    next();
  } catch (error) {
    console.error('[Auth Middleware] ❌ Error en autenticación:', error.message);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Token inválido'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expirado'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error de autenticación'
    });
  }
};

/**
 * Middleware to verify if user is admin
 */
exports.isAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Autenticación requerida'
    });
  }

  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({
      success: false,
      message: 'Acceso denegado. Se requieren permisos de administrador.'
    });
  }

  next();
};

/**
 * Middleware to verify if user is admin or the same user
 */
exports.isAdminOrOwner = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Autenticación requerida'
    });
  }

  const isAdmin = req.user.role === 'ADMIN';
  const isOwner = req.user.id === req.params.id;

  if (!isAdmin && !isOwner) {
    return res.status(403).json({
      success: false,
      message: 'Acceso denegado. No tienes permisos para realizar esta acción.'
    });
  }

  next();
};
