// services/authService.js
// Servicio para autenticación

const jwt = require('jsonwebtoken');

// Configuración de usuarios (en producción esto debería estar en una base de datos)
const users = {
  "admin": { 
    password: "admin123", 
    role: "administrador", 
    name: "Administrador" 
  },
  "profesor": { 
    password: "prof123", 
    role: "profesor", 
    name: "Profesor" 
  },
  "operador": { 
    password: "oper123", 
    role: "operador", 
    name: "Operador" 
  }
};

const JWT_SECRET = process.env.JWT_SECRET || 'asistia-secret-key-2024';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

class AuthService {
  /**
   * Autenticar usuario
   */
  async authenticateUser(username, password) {
    const user = users[username];
    
    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    if (user.password !== password) {
      throw new Error('Contraseña incorrecta');
    }

    // Generar token JWT
    const token = this.generateToken({
      username,
      role: user.role,
      name: user.name
    });

    return {
      user: {
        username,
        name: user.name,
        role: user.role
      },
      token
    };
  }

  /**
   * Generar token JWT
   */
  generateToken(payload) {
    return jwt.sign(payload, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN
    });
  }

  /**
   * Verificar token JWT
   */
  verifyToken(token) {
    try {
      return jwt.verify(token, JWT_SECRET);
    } catch (error) {
      throw new Error('Token inválido o expirado');
    }
  }

  /**
   * Obtener usuario por username
   */
  getUserByUsername(username) {
    return users[username] || null;
  }
}

module.exports = new AuthService();
