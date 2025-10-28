// routes/attendance.js
// Rutas para manejo de asistencia

const express = require('express');
const router = express.Router();
const attendanceService = require('../services/attendanceService');

// Endpoint principal: registrar asistencia (mantiene compatibilidad)
router.post('/asistencia', async (req, res) => {
  try {
    const { id } = req.body;

    if (!id) {
      return res.status(400).json({
        ok: false,
        mensaje: "El cuerpo de la solicitud debe incluir un id",
      });
    }

    const result = await attendanceService.registerAttendance(id);
    res.json(result);
  } catch (error) {
    console.error('Error en /api/asistencia:', error);
    res.status(500).json({
      ok: false,
      mensaje: "Error interno del servidor",
    });
  }
});

// Endpoint para obtener listado completo (mantiene compatibilidad)
router.get('/listado', async (req, res) => {
  try {
    const result = await attendanceService.getAllStudents();
    res.json(result);
  } catch (error) {
    console.error('Error en /api/listado:', error);
    res.status(500).json({
      ok: false,
      mensaje: "Error interno del servidor",
    });
  }
});

// Nuevo endpoint: estadísticas de asistencia
router.get('/stats', async (req, res) => {
  try {
    const stats = await attendanceService.getAttendanceStats();
    res.json({
      ok: true,
      stats
    });
  } catch (error) {
    console.error('Error en /api/stats:', error);
    res.status(500).json({
      ok: false,
      mensaje: "Error interno del servidor",
    });
  }
});

// Nuevo endpoint: actualizar estado de estudiante
router.put('/student/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !['Presente', 'Ausente', 'Tarde'].includes(status)) {
      return res.status(400).json({
        ok: false,
        mensaje: "Status válido requerido: Presente, Ausente, o Tarde"
      });
    }

    const result = await attendanceService.updateStudentStatus(id, status);
    res.json(result);
  } catch (error) {
    console.error('Error actualizando estado:', error);
    res.status(500).json({
      ok: false,
      mensaje: "Error interno del servidor",
    });
  }
});

// Nuevo endpoint: exportar a CSV
router.get('/export/csv', async (req, res) => {
  try {
    const result = await attendanceService.exportToCSV();

    if (!result.ok) {
      return res.status(500).json({
        ok: false,
        mensaje: "Error generando CSV"
      });
    }

    // Configurar headers para descarga de archivo
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);

    // Enviar el CSV
    res.send('\ufeff' + result.csv); // BOM para compatibilidad con Excel
  } catch (error) {
    console.error('Error en /api/export/csv:', error);
    res.status(500).json({
      ok: false,
      mensaje: "Error interno del servidor",
    });
  }
});

// Nuevo endpoint: mensaje de bienvenida con logging
router.get('/welcome', async (req, res) => {
  try {
    // Log request metadata
    console.log(`Request received: ${req.method} ${req.path}`);
    res.json({ message: 'Welcome to the Asistia API Service!' });
  } catch (error) {
    console.error('Error en /api/welcome:', error);
    res.status(500).json({
      ok: false,
      mensaje: "Error interno del servidor",
    });
  }
});

// CRUD endpoints para alumnos
router.get('/alumnos', async (req, res) => {
  try {
    const result = await attendanceService.getAllStudentsWithQR();
    res.json(result);
  } catch (error) {
    console.error('Error en /api/alumnos:', error);
    res.status(500).json({
      ok: false,
      mensaje: "Error interno del servidor",
    });
  }
});

router.put('/alumnos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, apellido, grupo } = req.body;
    const result = await attendanceService.updateStudent(id, { nombre, apellido, grupo });
    res.json(result);
  } catch (error) {
    console.error('Error actualizando alumno:', error);
    res.status(500).json({
      ok: false,
      mensaje: "Error interno del servidor",
    });
  }
});

router.delete('/alumnos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await attendanceService.deleteStudent(id);
    res.json(result);
  } catch (error) {
    console.error('Error eliminando alumno:', error);
    res.status(500).json({
      ok: false,
      mensaje: "Error interno del servidor",
    });
  }
});

module.exports = router;
