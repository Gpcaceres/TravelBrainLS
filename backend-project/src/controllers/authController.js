const jwt = require('jsonwebtoken');
const User = require('../models/User');
const config = require('../config/env');

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
 * Simple Login for Development/Testing
 * @route POST /api/auth/login
 */
exports.simpleLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email es requerido'
      });
    }

    // Buscar usuario existente
    let user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no encontrado. Por favor, crea una cuenta primero.'
      });
    }

    // Verificar si el usuario está activo
    if (user.status !== 'ACTIVE') {
      return res.status(403).json({
        success: false,
        message: 'Tu cuenta ha sido desactivada. Contacta al administrador.'
      });
    }

    // Generar JWT token
    const token = jwt.sign(
      {
        userId: user._id.toString(),
        email: user.email,
        role: user.role
      },
      config.jwtSecret,
      { expiresIn: config.jwtExpiresIn }
    );

    res.json({
      success: true,
      token,
      user: {
        _id: user._id.toString(),
        email: user.email,
        username: user.username,
        name: user.name,
        role: user.role
      },
      msg: `Bienvenido ${user.name}`
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
 * Register new user
 * @route POST /api/auth/register
 */
exports.register = async (req, res) => {
  try {
    const { email, username, name, password } = req.body;

    // Validar campos requeridos
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email es requerido'
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
      return res.status(409).json({
        success: false,
        message: 'El email o username ya está registrado'
      });
    }

    // Crear nuevo usuario
    const newUsername = username || email.split('@')[0];
    const user = new User({
      email: email.toLowerCase(),
      username: newUsername,
      name: name || newUsername,
      role: 'USER',
      status: 'ACTIVE'
    });

    await user.save();
    console.log('Nuevo usuario registrado:', user.email);

    // Generar JWT token
    const token = jwt.sign(
      {
        userId: user._id.toString(),
        email: user.email,
        role: user.role
      },
      config.jwtSecret,
      { expiresIn: config.jwtExpiresIn }
    );

    res.status(201).json({
      success: true,
      token,
      user: {
        _id: user._id.toString(),
        email: user.email,
        username: user.username,
        name: user.name,
        role: user.role
      },
      msg: `Cuenta creada exitosamente. Bienvenido ${user.name}`
    });

  } catch (error) {
    console.error('Error en registro:', error);
    res.status(500).json({
      success: false,
      message: 'Error al registrar usuario',
      error: error.message
    });
  }
};
