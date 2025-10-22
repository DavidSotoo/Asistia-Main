// services/authService.js
// Servicio para autenticación usando PostgreSQL con Prisma

const jwt = require('jsonwebtoken');
const databaseService = require('./databaseService');

const JWT_SECRET = process.env.JWT_SECRET || 'asistia-secret-key-2024';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

class AuthService {
  constructor() {
    this.prisma = databaseService.getClient();
  }

  /**
   * Autenticar usuario
   */
  async authenticateUser(username, password) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { username }
      });
      
      if (!user) {
        throw new Error('Usuario no encontrado');
      }

      if (user.password !== password) {
        throw new Error('Contraseña incorrecta');
      }

      // Generar token JWT
      const token = this.generateToken({
        id: user.id,
        username: user.username,
        role: user.role,
        name: user.name
      });

      return {
        user: {
          id: user.id,
          username: user.username,
          name: user.name,
          role: user.role
        },
        token
      };
    } catch (error) {
      console.error('Error en autenticación:', error);
      throw error;
    }
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
  async getUserByUsername(username) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { username }
      });
      return user;
    } catch (error) {
      console.error('Error obteniendo usuario:', error);
      return null;
    }
  }

  /**
   * Obtener usuario por ID
   */
  async getUserById(id) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id }
      });
      return user;
    } catch (error) {
      console.error('Error obteniendo usuario por ID:', error);
      return null;
    }
  }

  /**
   * Crear nuevo usuario
   */
  async createUser(userData) {
    try {
      const user = await this.prisma.user.create({
        data: {
          username: userData.username,
          password: userData.password,
          name: userData.name,
          email: userData.email || null,
          role: userData.role || 'operador'
        }
      });
      return user;
    } catch (error) {
      console.error('Error creando usuario:', error);
      throw new Error('Error al crear usuario');
    }
  }

  /**
   * Actualizar usuario
   */
  async updateUser(id, userData) {
    try {
      const user = await this.prisma.user.update({
        where: { id },
        data: {
          ...userData,
          updatedAt: new Date()
        }
      });
      return user;
    } catch (error) {
      console.error('Error actualizando usuario:', error);
      throw new Error('Error al actualizar usuario');
    }
  }

  /**
   * Eliminar usuario
   */
  async deleteUser(id) {
    try {
      await this.prisma.user.delete({
        where: { id }
      });
      return true;
    } catch (error) {
      console.error('Error eliminando usuario:', error);
      throw new Error('Error al eliminar usuario');
    }
  }

  /**
   * Obtener todos los usuarios
   */
  async getAllUsers() {
    try {
      const users = await this.prisma.user.findMany({
        select: {
          id: true,
          username: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
          updatedAt: true
        },
        orderBy: {
          createdAt: 'desc'
        }
      });
      return users;
    } catch (error) {
      console.error('Error obteniendo usuarios:', error);
      throw new Error('Error al obtener usuarios');
    }
  }
}

module.exports = new AuthService();