// services/attendanceService.js
// Servicio para manejo de asistencia usando PostgreSQL con Prisma

const databaseService = require('./databaseService');

class AttendanceService {
  constructor() {
    this.prisma = databaseService.getClient();
  }

  /**
   * Leer estudiantes con asistencia registrada hoy desde la base de datos
   */
  async getAllStudents() {
    try {
      const today = new Date(new Date().toISOString().split('T')[0]);

      // Obtener registros de asistencia de hoy con información del estudiante
      const attendanceRecords = await this.prisma.attendance.findMany({
        where: {
          attendanceDate: today
        },
        include: {
          student: true
        },
        orderBy: {
          attendanceTime: 'desc'
        }
      });

      // Transformar datos para mantener compatibilidad con el frontend
      const alumnos = attendanceRecords.map(record => ({
        id: record.student.id,
        nombre: record.student.nombre,
        apellido: record.student.apellido,
        estado: record.status,
        lastUpdated: record.attendanceTime.toISOString()
      }));

      return {
        ok: true,
        alumnos
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
      const student = await this.prisma.student.findUnique({
        where: { id }
      });

      if (!student) {
        return {
          ok: false,
          alumno: { nombre: "Error", estado: "No registrado" },
        };
      }

      const today = new Date(new Date().toISOString().split('T')[0]);

      // Verificar si ya tiene asistencia registrada hoy
      const existingAttendance = await this.prisma.attendance.findFirst({
        where: {
          studentId: id,
          attendanceDate: today
        }
      });

      if (existingAttendance) {
        if (existingAttendance.status !== "Presente") {
          // Actualizar estado a Presente
          await this.prisma.attendance.update({
            where: { id: existingAttendance.id },
            data: {
              status: "Presente",
              attendanceTime: new Date()
            }
          });

          const alumno = {
            id: student.id,
            nombre: student.nombre,
            apellido: student.apellido,
            estado: "Presente",
            lastUpdated: new Date().toISOString()
          };

          return { 
            ok: true, 
            alumno,
            mensaje: "Asistencia registrada exitosamente"
          };
        } else {
          // Ya estaba presente
          const alumno = {
            id: student.id,
            nombre: student.nombre,
            apellido: student.apellido,
            estado: "Presente",
            lastUpdated: existingAttendance.attendanceTime.toISOString()
          };

          return {
            ok: true,
            alumno,
            mensaje: "Alumno ya estaba marcado como presente",
          };
        }
      } else {
        // Crear nuevo registro de asistencia
        await this.prisma.attendance.create({
          data: {
            studentId: id,
            status: "Presente",
            attendanceDate: today,
            attendanceTime: new Date()
          }
        });

        const alumno = {
          id: student.id,
          nombre: student.nombre,
          apellido: student.apellido,
          estado: "Presente",
          lastUpdated: new Date().toISOString()
        };

        return { 
          ok: true, 
          alumno,
          mensaje: "Asistencia registrada exitosamente"
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
      const student = await this.prisma.student.findUnique({
        where: { id }
      });

      if (!student) {
        return {
          ok: false,
          mensaje: "Estudiante no encontrado"
        };
      }

      const today = new Date(new Date().toISOString().split('T')[0]);

      // Buscar o crear registro de asistencia para hoy
      let attendance = await this.prisma.attendance.findFirst({
        where: {
          studentId: id,
          attendanceDate: today
        }
      });

      if (attendance) {
        // Actualizar registro existente
        attendance = await this.prisma.attendance.update({
          where: { id: attendance.id },
          data: {
            status,
            attendanceTime: new Date()
          }
        });
      } else {
        // Crear nuevo registro
        attendance = await this.prisma.attendance.create({
          data: {
            studentId: id,
            status,
            attendanceDate: today,
            attendanceTime: new Date()
          }
        });
      }

      const alumno = {
        id: student.id,
        nombre: student.nombre,
        apellido: student.apellido,
        estado: attendance.status,
        lastUpdated: attendance.attendanceTime.toISOString()
      };

      return {
        ok: true,
        alumno,
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
      const today = new Date(new Date().toISOString().split('T')[0]);

      // Contar total de estudiantes
      const total = await this.prisma.student.count();

      // Contar asistencia de hoy
      const todayAttendance = await this.prisma.attendance.findMany({
        where: {
          attendanceDate: today
        }
      });

      const stats = {
        total,
        presente: todayAttendance.filter(a => a.status === 'Presente').length,
        ausente: total - todayAttendance.filter(a => a.status === 'Presente' || a.status === 'Tarde').length,
        tarde: todayAttendance.filter(a => a.status === 'Tarde').length
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
      const student = await this.prisma.student.findUnique({
        where: { id },
        include: {
          attendance: {
            where: {
              attendanceDate: new Date(new Date().toISOString().split('T')[0])
            },
            orderBy: {
              attendanceTime: 'desc'
            },
            take: 1
          }
        }
      });

      if (!student) return null;

      const todayAttendance = student.attendance[0];
      return {
        id: student.id,
        nombre: student.nombre,
        apellido: student.apellido,
        estado: todayAttendance ? todayAttendance.status : 'Ausente',
        lastUpdated: todayAttendance ? todayAttendance.attendanceTime.toISOString() : null
      };
    } catch (error) {
      console.error('Error buscando estudiante:', error);
      throw new Error('Error interno al buscar estudiante');
    }
  }

  /**
   * Actualizar estudiante
   */
  async updateStudent(id, data) {
    try {
      const student = await this.prisma.student.update({
        where: { id },
        data
      });

      return {
        ok: true,
        alumno: {
          id: student.id,
          nombre: student.nombre,
          apellido: student.apellido,
          grupo: student.grupo
        },
        mensaje: "Estudiante actualizado exitosamente"
      };
    } catch (error) {
      console.error('Error actualizando estudiante:', error);
      throw new Error('Error interno al actualizar estudiante');
    }
  }

  /**
   * Eliminar estudiante
   */
  async deleteStudent(id) {
    try {
      await this.prisma.student.delete({
        where: { id }
      });

      return {
        ok: true,
        mensaje: "Estudiante eliminado exitosamente"
      };
    } catch (error) {
      console.error('Error eliminando estudiante:', error);
      throw new Error('Error interno al eliminar estudiante');
    }
  }
}

module.exports = new AttendanceService();