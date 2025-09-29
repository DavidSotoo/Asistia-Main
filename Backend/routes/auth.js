// Rutas para autenticación

const express = require('express');
const router = express.Router();
const authService = require('../services/authService');

// Login endpoint
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({
        ok: false,
        mensaje: "Username y password son requeridos"
      });
    }

    const result = await authService.authenticateUser(username, password);
    
    res.json({
      ok: true,
      mensaje: "Login exitoso",
      data: result
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(401).json({
      ok: false,
      mensaje: error.message
    });
  }
});

// Verificar token
router.get('/verify', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        ok: false,
        mensaje: "Token requerido"
      });
    }

    const decoded = authService.verifyToken(token);
    
    res.json({
      ok: true,
      data: decoded
    });
  } catch (error) {
    console.error('Error verificando token:', error);
    res.status(401).json({
      ok: false,
      mensaje: "Token inválido"
    });
  }
});

module.exports = router;
