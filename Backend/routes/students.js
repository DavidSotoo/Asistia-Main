// Rutas para gestión de estudiantes

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const attendanceService = require('../services/attendanceService');
const { authenticateToken } = require('../middleware/auth');

// Configuración de multer para subida de fotos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/photos/');
  },
  filename: (req, file, cb) => {
    // Generar nombre único: matricula_timestamp.ext
    const matricula = req.body.matricula || 'unknown';
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    cb(null, `${matricula}_${timestamp}${ext}`);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB límite
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos de imagen'));
    }
  }
});

// Crear estudiante con foto
router.post('/create', authenticateToken, upload.single('photo'), async (req, res) => {
  try {
    const { nombre, apellido, matricula, grupo, email, telefono } = req.body;

    // Validaciones básicas
    if (!nombre || !apellido || !matricula || !grupo) {
      return res.status(400).json({
        ok: false,
        mensaje: "Nombre, apellido, matrícula y grupo son requeridos"
      });
    }

    // Verificar si la matrícula ya existe
    const prisma = require('../services/databaseService').getClient();
    const existingStudent = await prisma.student.findUnique({
      where: { matricula }
    });

    if (existingStudent) {
      return res.status(400).json({
        ok: false,
        mensaje: "Ya existe un estudiante con esta matrícula"
      });
    }

    // Preparar datos del estudiante
    const studentData = {
      id: matricula, // Usar matrícula como ID único
      nombre,
      apellido,
      matricula,
      grupo,
      email: email || null,
      telefono: telefono || null,
      photoUrl: req.file ? `/uploads/photos/${req.file.filename}` : null
    };

    const result = await attendanceService.createStudent(studentData);

    res.status(201).json(result);
  } catch (error) {
    console.error('Error creando estudiante:', error);
    res.status(500).json({
      ok: false,
      mensaje: error.message || "Error interno del servidor"
    });
  }
});

// Obtener lista de estudiantes
router.get('/list', authenticateToken, async (req, res) => {
  try {
    const result = await attendanceService.getAllStudentsWithQR();
    res.json(result);
  } catch (error) {
    console.error('Error obteniendo lista de estudiantes:', error);
    res.status(500).json({
      ok: false,
      mensaje: "Error interno del servidor"
    });
  }
});

// Obtener estudiante por ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const studentId = req.params.id;
    const result = await attendanceService.findStudentById(studentId);

    if (!result) {
      return res.status(404).json({
        ok: false,
        mensaje: "Estudiante no encontrado"
      });
    }

    res.json({
      ok: true,
      alumno: result
    });
  } catch (error) {
    console.error('Error obteniendo estudiante:', error);
    res.status(500).json({
      ok: false,
      mensaje: "Error interno del servidor"
    });
  }
});

// Actualizar estudiante
router.put('/:id', authenticateToken, upload.single('photo'), async (req, res) => {
  try {
    const studentId = req.params.id;
    const { nombre, apellido, matricula, grupo, email, telefono } = req.body;

    const updateData = {};
    if (nombre) updateData.nombre = nombre;
    if (apellido) updateData.apellido = apellido;
    if (matricula) updateData.matricula = matricula;
    if (grupo) updateData.grupo = grupo;
    if (email !== undefined) updateData.email = email;
    if (telefono !== undefined) updateData.telefono = telefono;
    if (req.file) updateData.photoUrl = `/uploads/photos/${req.file.filename}`;

    const result = await attendanceService.updateStudent(studentId, updateData);
    res.json(result);
  } catch (error) {
    console.error('Error actualizando estudiante:', error);
    res.status(500).json({
      ok: false,
      mensaje: error.message || "Error interno del servidor"
    });
  }
});

// Eliminar estudiante
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const studentId = req.params.id;
    const result = await attendanceService.deleteStudent(studentId);
    res.json(result);
  } catch (error) {
    console.error('Error eliminando estudiante:', error);
    res.status(500).json({
      ok: false,
      mensaje: "Error interno del servidor"
    });
  }
});

module.exports = router;
