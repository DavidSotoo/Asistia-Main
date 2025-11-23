// Rutas para gestión de materias

const express = require('express');
const router = express.Router();
const subjectService = require('../services/subjectService');
const authService = require('../services/authService');

// Middleware para verificar que el usuario es administrador
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
    
    // Aceptar tanto 'administrador' como 'admin'
    const isAdmin = decoded.role === 'administrador' || decoded.role === 'admin';
    
    if (!isAdmin) {
      return res.status(403).json({
        ok: false,
        mensaje: "Acceso denegado. Se requiere rol de administrador"
      });
    }

    req.user = decoded;
    next();
  } catch (error) {
    console.error('Error en requireAdmin middleware:', error);
    return res.status(401).json({
      ok: false,
      mensaje: error.message || "Token inválido"
    });
  }
};

// Crear nueva materia (solo admin)
router.post('/create', requireAdmin, async (req, res) => {
  try {
    const { name, code, description, teacherId, schedules } = req.body;

    // Validaciones básicas
    if (!name || !teacherId) {
      return res.status(400).json({
        ok: false,
        mensaje: "Nombre y maestro son requeridos"
      });
    }

    // Validar horarios si se proporcionan
    if (schedules && Array.isArray(schedules)) {
      for (const schedule of schedules) {
        if (schedule.dayOfWeek === undefined || !schedule.startTime || !schedule.endTime) {
          return res.status(400).json({
            ok: false,
            mensaje: "Cada horario debe tener día de la semana, hora de inicio y hora de fin"
          });
        }
      }
    }

    const subject = await subjectService.createSubject({
      name,
      code,
      description,
      teacherId,
      schedules
    });

    res.status(201).json({
      ok: true,
      mensaje: "Materia creada exitosamente",
      data: subject
    });
  } catch (error) {
    console.error('Error creando materia:', error);
    res.status(500).json({
      ok: false,
      mensaje: error.message || "Error interno del servidor"
    });
  }
});

// Obtener todas las materias (admin)
router.get('/list', requireAdmin, async (req, res) => {
  try {
    const subjects = await subjectService.getAllSubjects();

    res.json({
      ok: true,
      mensaje: "Lista de materias obtenida exitosamente",
      data: subjects
    });
  } catch (error) {
    console.error('Error obteniendo lista de materias:', error);
    res.status(500).json({
      ok: false,
      mensaje: "Error interno del servidor"
    });
  }
});

// Obtener una materia por ID (admin)
router.get('/:id', requireAdmin, async (req, res) => {
  try {
    const subjectId = req.params.id;
    const subject = await subjectService.getSubjectById(subjectId);

    if (!subject) {
      return res.status(404).json({
        ok: false,
        mensaje: "Materia no encontrada"
      });
    }

    res.json({
      ok: true,
      mensaje: "Materia obtenida exitosamente",
      data: subject
    });
  } catch (error) {
    console.error('Error obteniendo materia:', error);
    res.status(500).json({
      ok: false,
      mensaje: "Error interno del servidor"
    });
  }
});

// Actualizar una materia (admin)
router.put('/:id', requireAdmin, async (req, res) => {
  try {
    const subjectId = req.params.id;
    const { name, code, description, teacherId, schedules } = req.body;

    // Validar horarios si se proporcionan
    if (schedules && Array.isArray(schedules)) {
      for (const schedule of schedules) {
        if (schedule.dayOfWeek === undefined || !schedule.startTime || !schedule.endTime) {
          return res.status(400).json({
            ok: false,
            mensaje: "Cada horario debe tener día de la semana, hora de inicio y hora de fin"
          });
        }
      }
    }

    const subject = await subjectService.updateSubject(subjectId, {
      name,
      code,
      description,
      teacherId,
      schedules
    });

    res.json({
      ok: true,
      mensaje: "Materia actualizada exitosamente",
      data: subject
    });
  } catch (error) {
    console.error('Error actualizando materia:', error);
    res.status(500).json({
      ok: false,
      mensaje: error.message || "Error interno del servidor"
    });
  }
});

// Eliminar una materia (admin)
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const subjectId = req.params.id;

    await subjectService.deleteSubject(subjectId);

    res.json({
      ok: true,
      mensaje: "Materia eliminada exitosamente"
    });
  } catch (error) {
    console.error('Error eliminando materia:', error);
    res.status(500).json({
      ok: false,
      mensaje: error.message || "Error interno del servidor"
    });
  }
});

module.exports = router;

