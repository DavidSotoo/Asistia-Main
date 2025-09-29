// middleware/errorHandler.js
// Middleware para manejo de errores

/**
 * Middleware para manejar errores
 */
const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // Error de validación
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      ok: false,
      mensaje: 'Error de validación',
      detalles: err.message
    });
  }

  // Error de JWT
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      ok: false,
      mensaje: 'Token inválido'
    });
  }

  // Error de token expirado
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      ok: false,
      mensaje: 'Token expirado'
    });
  }

  // Error por defecto
  res.status(500).json({
    ok: false,
    mensaje: 'Error interno del servidor'
  });
};

/**
 * Middleware para rutas no encontradas
 */
const notFound = (req, res, next) => {
  res.status(404).json({
    ok: false,
    mensaje: `Ruta ${req.originalUrl} no encontrada`
  });
};

module.exports = {
  errorHandler,
  notFound
};
