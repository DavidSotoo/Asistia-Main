// middleware/auth.js
// Middleware de autenticación

const authService = require('../services/authService');

/**
 * Middleware para verificar autenticación
 */
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({
      ok: false,
      mensaje: 'Token de acceso requerido'
    });
  }

  try {
    const decoded = authService.verifyToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({
      ok: false,
      mensaje: 'Token inválido o expirado'
    });
  }
};

/**
 * Middleware opcional para autenticación (no falla si no hay token)
 */
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    try {
      const decoded = authService.verifyToken(token);
      req.user = decoded;
    } catch (error) {
      // Token inválido, pero continuamos sin usuario
      req.user = null;
    }
  }

  next();
};

module.exports = {
  authenticateToken,
  optionalAuth
};
