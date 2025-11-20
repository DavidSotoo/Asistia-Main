// Rutas para gestión de maestros

const express = require('express');
const router = express.Router();
const authService = require('../services/authService');
const { authenticateToken } = require('../middleware/auth');

// Middleware para verificar que el usuario es admin o maestro
const requireAdminOrTeacher = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({
        ok: false,
        mensaje: "Token requerido"
      });
    }

    const decoded = authService.verifyToken(token);

    if (decoded.role !== 'administrador' && decoded.role !== 'maestro') {
      return res.status(403).json({
        ok: false,
        mensaje: "Acceso denegado. Se requiere rol de administrador o maestro"
      });
    }

    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      ok: false,
      mensaje: "Token inválido"
    });
  }
};

// Middleware para verificar que el usuario es admin (solo para eliminación)
const requireAdmin = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({
        ok: false,
        mensaje: "Token requerido"
      });
    }

    const decoded = authService.verifyToken(token);

    if (decoded.role !== 'admin') {
      return res.status(403).json({
        ok: false,
        mensaje: "Acceso denegado. Se requiere rol de administrador"
      });
    }

    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      ok: false,
      mensaje: "Token inválido"
    });
  }
};

// Crear nuevo maestro (admin o maestro)
router.post('/create', requireAdminOrTeacher, async (req, res) => {
  try {
    const { username, password, name, email } = req.body;
    
    // Validaciones básicas
    if (!username || !password || !name) {
      return res.status(400).json({
        ok: false,
        mensaje: "Username, password y name son requeridos"
      });
    }

    // Verificar si el username ya existe
    const existingUser = await authService.getUserByUsername(username);
    if (existingUser) {
      return res.status(400).json({
        ok: false,
        mensaje: "El nombre de usuario ya existe"
      });
    }

    // Crear el maestro
    const teacherData = {
      username,
      password,
      name,
      role: 'maestro',
      email: email || null
    };

    const newTeacher = await authService.createUser(teacherData);
    
    // No devolver la contraseña en la respuesta
    const { password: _, ...teacherResponse } = newTeacher;

    res.status(201).json({
      ok: true,
      mensaje: "Maestro creado exitosamente",
      data: teacherResponse
    });
  } catch (error) {
    console.error('Error creando maestro:', error);
    res.status(500).json({
      ok: false,
      mensaje: error.message || "Error interno del servidor"
    });
  }
});

// Obtener lista de maestros (admin o maestro)
router.get('/list', requireAdminOrTeacher, async (req, res) => {
  try {
    const users = await authService.getAllUsers();
    
    // Filtrar solo maestros
    const teachers = users.filter(user => user.role === 'maestro');
    
    res.json({
      ok: true,
      mensaje: "Lista de maestros obtenida exitosamente",
      data: teachers
    });
  } catch (error) {
    console.error('Error obteniendo lista de maestros:', error);
    res.status(500).json({
      ok: false,
      mensaje: "Error interno del servidor"
    });
  }
});

// Obtener información de un maestro específico
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const teacherId = req.params.id;
    const currentUser = req.user;
    
    // Solo el admin o el propio maestro pueden ver la información
    if (currentUser.role !== 'administrador' && currentUser.id !== teacherId) {
      return res.status(403).json({
        ok: false,
        mensaje: "Acceso denegado"
      });
    }

    const teacher = await authService.getUserById(teacherId);
    
    if (!teacher) {
      return res.status(404).json({
        ok: false,
        mensaje: "Maestro no encontrado"
      });
    }

    // No devolver la contraseña
    const { password: _, ...teacherResponse } = teacher;

    res.json({
      ok: true,
      mensaje: "Información del maestro obtenida exitosamente",
      data: teacherResponse
    });
  } catch (error) {
    console.error('Error obteniendo información del maestro:', error);
    res.status(500).json({
      ok: false,
      mensaje: "Error interno del servidor"
    });
  }
});

// Actualizar información de un maestro
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const teacherId = req.params.id;
    const currentUser = req.user;
    const { name, email, password } = req.body;
    
    // Solo el admin o el propio maestro pueden actualizar
    if (currentUser.role !== 'administrador' && currentUser.id !== teacherId) {
      return res.status(403).json({
        ok: false,
        mensaje: "Acceso denegado"
      });
    }

    // Verificar que el maestro existe
    const existingTeacher = await authService.getUserById(teacherId);
    if (!existingTeacher) {
      return res.status(404).json({
        ok: false,
        mensaje: "Maestro no encontrado"
      });
    }

    // Preparar datos para actualizar
    const updateData = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (password) updateData.password = password;

    const updatedTeacher = await authService.updateUser(teacherId, updateData);
    
    // No devolver la contraseña en la respuesta
    const { password: _, ...teacherResponse } = updatedTeacher;

    res.json({
      ok: true,
      mensaje: "Maestro actualizado exitosamente",
      data: teacherResponse
    });
  } catch (error) {
    console.error('Error actualizando maestro:', error);
    res.status(500).json({
      ok: false,
      mensaje: error.message || "Error interno del servidor"
    });
  }
});

// Eliminar maestro (solo admin)
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const teacherId = req.params.id;
    
    // Verificar que el maestro existe
    const existingTeacher = await authService.getUserById(teacherId);
    if (!existingTeacher) {
      return res.status(404).json({
        ok: false,
        mensaje: "Maestro no encontrado"
      });
    }

    // No permitir que el admin se elimine a sí mismo
    if (req.user.id === teacherId) {
      return res.status(400).json({
        ok: false,
        mensaje: "No puedes eliminarte a ti mismo"
      });
    }

    await authService.deleteUser(teacherId);

    res.json({
      ok: true,
      mensaje: "Maestro eliminado exitosamente"
    });
  } catch (error) {
    console.error('Error eliminando maestro:', error);
    res.status(500).json({
      ok: false,
      mensaje: "Error interno del servidor"
    });
  }
});

module.exports = router;
