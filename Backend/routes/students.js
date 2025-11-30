// Rutas para gestión de estudiantes

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const attendanceService = require('../services/attendanceService');
const cloudinaryService = require('../services/cloudinaryService');
const { authenticateToken } = require('../middleware/auth');

// Configuración de multer para manejar archivos en memoria (para Cloudinary)
const upload = multer({
  storage: multer.memoryStorage(),
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
  console.log('✅ POST /api/alumnos/create recibido');
  console.log('Body:', req.body);
  console.log('File:', req.file ? 'Foto recibida' : 'Sin foto');
  try {
    const { nombre, apellido, matricula, grupo, email, telefono } = req.body;

    // Validaciones básicas
    if (!nombre || !apellido || !matricula || !grupo) {
      return res.status(400).json({
        ok: false,
        mensaje: "Nombre, apellido, matrícula y grupo son requeridos"
      });
    }

    // Verificar si la matrícula o el ID ya existe
    const prisma = require('../services/databaseService').getClient();
    const matriculaTrimmed = matricula.trim();
    
    console.log('🔍 Verificando si existe estudiante con ID/matrícula:', matriculaTrimmed);
    
    // Verificar por ID (que es la matrícula) - el ID es único y requerido
    // Usar findFirst en lugar de findUnique por si hay problemas de índice
    try {
      const existingById = await prisma.student.findUnique({
        where: { id: matriculaTrimmed }
      });
      
      if (existingById) {
        console.log('⚠️ Ya existe un estudiante con ID:', matriculaTrimmed);
        return res.status(400).json({
          ok: false,
          mensaje: "Ya existe un estudiante con esta matrícula"
        });
      }
      
      // Doble verificación: también buscar por matricula field si existe y es diferente
      if (matriculaTrimmed) {
        const existingByMatricula = await prisma.student.findFirst({
          where: { 
            matricula: matriculaTrimmed
          }
        });
        
        if (existingByMatricula) {
          console.log('⚠️ Ya existe un estudiante con matrícula:', matriculaTrimmed);
          return res.status(400).json({
            ok: false,
            mensaje: "Ya existe un estudiante con esta matrícula"
          });
        }
      }
      
      console.log('✅ No se encontró estudiante duplicado, procediendo con la creación');
    } catch (checkError) {
      console.error('❌ Error verificando estudiante existente:', checkError);
      // Si hay error en la verificación, continuar - Prisma lanzará error si realmente existe
      console.warn('⚠️ Continuando con creación, Prisma validará duplicados');
    }

    // Subir foto a Cloudinary si existe
    let photoUrl = null;
    if (req.file) {
      try {
        // Cloudinary acepta directamente el buffer o un data URI
        // Usaremos el buffer directamente con formato data URI
        const dataUri = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
        
        // Subir a Cloudinary con prefijo basado en la matrícula
        const uploadResult = await cloudinaryService.create(dataUri, {
          folder: 'asistia/students',
          prefix: `student_${matricula}`,
          overwrite: false
        });

        if (uploadResult && uploadResult.ok) {
          photoUrl = uploadResult.url;
          console.log('✅ Foto subida a Cloudinary:', uploadResult.url);
        } else {
          console.warn('⚠️ Error al subir foto a Cloudinary, continuando sin foto');
        }
      } catch (cloudinaryError) {
        console.error('❌ Error subiendo foto a Cloudinary:', cloudinaryError);
        // Continuar sin foto en caso de error
        console.warn('⚠️ Continuando la creación del estudiante sin foto');
      }
    }

    // Preparar datos del estudiante
    // Asegurar que todos los campos requeridos estén presentes y validar formato
    const studentData = {
      id: matricula.trim(), // Usar matrícula como ID único (requerido)
      nombre: nombre.trim(), // Requerido
      apellido: apellido.trim(), // Requerido
      matricula: matricula.trim(), // Opcional pero único
      grupo: grupo ? grupo.trim() : null,
      email: email ? email.trim() : null,
      telefono: telefono ? telefono.trim() : null,
      photoUrl: photoUrl || null
    };
    
    console.log('📋 Datos del estudiante validados:', JSON.stringify(studentData, null, 2));
    const result = await attendanceService.createStudent(studentData);

    res.status(201).json(result);
  } catch (error) {
    console.error('❌ Error en POST /api/alumnos/create:', error);
    console.error('❌ Error stack:', error.stack);
    
    // Determinar código de estado HTTP según el tipo de error
    let statusCode = 500;
    let errorMessage = error.message || "Error interno del servidor";
    
    // Errores de validación o duplicados (400)
    if (error.message && (
      error.message.toLowerCase().includes('ya existe') ||
      error.message.toLowerCase().includes('requerido') ||
      error.message.toLowerCase().includes('requeridos') ||
      error.message.toLowerCase().includes('duplicado') ||
      error.code === 'P2002' // Error de Prisma por duplicado
    )) {
      statusCode = 400;
    }
    
    res.status(statusCode).json({
      ok: false,
      mensaje: errorMessage
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

    // Subir nueva foto a Cloudinary si existe
    if (req.file) {
      try {
        // Obtener estudiante actual para eliminar foto anterior si existe
        const prisma = require('../services/databaseService').getClient();
        const currentStudent = await prisma.student.findUnique({
          where: { id: studentId }
        });

        // Si hay foto anterior, extraer publicId y eliminarla
        if (currentStudent && currentStudent.photoUrl) {
          const oldPublicId = cloudinaryService.extractPublicIdFromUrl(currentStudent.photoUrl);
          if (oldPublicId) {
            try {
              await cloudinaryService.delete(oldPublicId);
              console.log('✅ Foto anterior eliminada de Cloudinary');
            } catch (deleteError) {
              console.warn('⚠️ No se pudo eliminar la foto anterior:', deleteError.message);
            }
          }
        }

        // Convertir el buffer a data URI para Cloudinary
        const dataUri = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
        
        // Subir nueva foto a Cloudinary
        const uploadResult = await cloudinaryService.create(dataUri, {
          folder: 'asistia/students',
          prefix: `student_${matricula || studentId}`,
          overwrite: false
        });

        if (uploadResult && uploadResult.ok) {
          updateData.photoUrl = uploadResult.url;
          console.log('✅ Nueva foto subida a Cloudinary:', uploadResult.url);
        }
      } catch (cloudinaryError) {
        console.error('❌ Error subiendo foto a Cloudinary:', cloudinaryError);
        // Continuar sin actualizar la foto en caso de error
      }
    }

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
