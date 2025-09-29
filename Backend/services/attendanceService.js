// services/attendanceService.js
// Servicio para manejo de asistencia

const fs = require('fs').promises;
const path = require('path');

const DB_PATH = path.join(__dirname, '../database.json');

class AttendanceService {
  /**
   * Leer todos los estudiantes desde la base de datos
   */
  async getAllStudents() {
    try {
      const data = await fs.readFile(DB_PATH, 'utf8');
      const estudiantes = JSON.parse(data);
      
      return {
        ok: true,
        alumnos: estudiantes
      };
    } catch (error) {
      console.error('Error leyendo la base de datos:', error);
      throw new Error('Error interno al leer la base de datos');
    }
  }

  /**
   * Registrar asistencia de un estudiante
   */
  async registerAttendance(id) {
    try {
      const data = await fs.readFile(DB_PATH, 'utf8');
      let estudiantes = JSON.parse(data);

      const alumno = estudiantes.find((e) => e.id === id);

      if (!alumno) {
        return {
          ok: false,
          alumno: { nombre: "Error", estado: "No registrado" },
        };
      }

      if (alumno.estado !== "Presente") {
        alumno.estado = "Presente";
        alumno.lastUpdated = new Date().toISOString();
        
        await fs.writeFile(DB_PATH, JSON.stringify(estudiantes, null, 2));
        
        return { 
          ok: true, 
          alumno,
          mensaje: "Asistencia registrada exitosamente"
        };
      } else {
        return {
          ok: true,
          alumno,
          mensaje: "Alumno ya estaba marcado como presente",
        };
      }
    } catch (error) {
      console.error('Error registrando asistencia:', error);
      throw new Error('Error interno al procesar asistencia');
    }
  }

  /**
   * Actualizar estado de un estudiante
   */
  async updateStudentStatus(id, status) {
    try {
      const data = await fs.readFile(DB_PATH, 'utf8');
      let estudiantes = JSON.parse(data);

      const alumnoIndex = estudiantes.findIndex((e) => e.id === id);

      if (alumnoIndex === -1) {
        return {
          ok: false,
          mensaje: "Estudiante no encontrado"
        };
      }

      estudiantes[alumnoIndex].estado = status;
      estudiantes[alumnoIndex].lastUpdated = new Date().toISOString();
      
      await fs.writeFile(DB_PATH, JSON.stringify(estudiantes, null, 2));
      
      return {
        ok: true,
        alumno: estudiantes[alumnoIndex],
        mensaje: "Estado actualizado exitosamente"
      };
    } catch (error) {
      console.error('Error actualizando estado:', error);
      throw new Error('Error interno al actualizar estado');
    }
  }

  /**
   * Obtener estadísticas de asistencia
   */
  async getAttendanceStats() {
    try {
      const data = await fs.readFile(DB_PATH, 'utf8');
      const estudiantes = JSON.parse(data);

      const stats = {
        total: estudiantes.length,
        presente: estudiantes.filter(s => s.estado === 'Presente').length,
        ausente: estudiantes.filter(s => s.estado === 'Ausente').length,
        tarde: estudiantes.filter(s => s.estado === 'Tarde').length
      };

      stats.attendanceRate = stats.total > 0 ? 
        ((stats.presente + stats.tarde) / stats.total * 100).toFixed(2) : 0;

      return stats;
    } catch (error) {
      console.error('Error obteniendo estadísticas:', error);
      throw new Error('Error interno al obtener estadísticas');
    }
  }

  /**
   * Buscar estudiante por ID
   */
  async findStudentById(id) {
    try {
      const data = await fs.readFile(DB_PATH, 'utf8');
      const estudiantes = JSON.parse(data);
      
      return estudiantes.find((e) => e.id === id) || null;
    } catch (error) {
      console.error('Error buscando estudiante:', error);
      throw new Error('Error interno al buscar estudiante');
    }
  }
}

module.exports = new AttendanceService();
