// services/attendanceService.js
// Servicio para manejo de asistencia usando PostgreSQL con Prisma

const databaseService = require('./databaseService');

class AttendanceService {
  constructor() {
    this.prisma = databaseService.getClient();
  }

  /**
   * Exportar datos de asistencia a CSV
   */
  async exportToCSV() {
    try {
      const attendanceRecords = await this.getTodayAttendanceRecords();

      // Crear contenido CSV
      const csvHeaders = 'ID,Nombre,Apellido,Estado,Hora de Asistencia,Fecha\n';
      const csvRows = attendanceRecords.map(record => {
        const time = record.attendanceTime.toLocaleTimeString('es-ES', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        });
        const date = record.attendanceDate.toLocaleDateString('es-ES');
        return `${record.student.id},"${record.student.nombre}","${record.student.apellido}",${record.status},${time},${date}`;
      });

      const csv = csvHeaders + csvRows.join('\n');

      // Generar nombre de archivo con fecha
      const dateStr = this.getTodayDate().toISOString().split('T')[0];
      const filename = `asistencia_${dateStr}.csv`;

      return { ok: true, csv, filename };
    } catch (error) {
      console.error('Error generando CSV:', error);
      throw new Error('Error interno al generar CSV');
    }
  }

  /**
   * Función auxiliar para obtener la fecha de hoy
   */
  getTodayDate() {
    return new Date(new Date().toISOString().split('T')[0]);
  }

  /**
   * Función auxiliar para obtener registros de asistencia de hoy
   */
  async getTodayAttendanceRecords() {
    const today = this.getTodayDate();
    return await this.prisma.attendance.findMany({
      where: { attendanceDate: today },
      include: { student: true },
      orderBy: { attendanceTime: 'desc' }
    });
  }

  /**
   * Leer estudiantes con asistencia registrada hoy desde la base de datos
   */
  async getAllStudents() {
    try {
      const attendanceRecords = await this.getTodayAttendanceRecords();

      // Transformar datos para mantener compatibilidad con el frontend
      const alumnos = attendanceRecords.map(record => ({
        id: record.student.id,
        nombre: record.student.nombre,
        apellido: record.student.apellido,
        estado: record.status,
        lastUpdated: record.attendanceTime.toISOString()
      }));

      return { ok: true, alumnos };
    } catch (error) {
      console.error('Error leyendo la base de datos:', error);
      throw new Error('Error interno al leer la base de datos');
    }
  }

  /**
   * Obtener todos los alumnos registrados con sus códigos QR
   */
  async getAllStudentsWithQR() {
    try {
      const students = await this.prisma.student.findMany({
        orderBy: { nombre: 'asc' }
      });

      // Transformar datos incluyendo códigos QR
      const alumnos = students.map(student => ({
        id: student.id,
        nombre: student.nombre,
        apellido: student.apellido,
        matricula: student.matricula,
        grupo: student.grupo,
        qrCode: student.id // Usar el ID como código QR
      }));

      return { ok: true, alumnos };
    } catch (error) {
      console.error('Error obteniendo todos los alumnos:', error);
      throw new Error('Error interno al obtener alumnos');
    }
  }

  /**
   * Función auxiliar para crear objeto alumno
   */
  createAlumnoObject(student, status, lastUpdated) {
    return {
      id: student.id,
      nombre: student.nombre,
      apellido: student.apellido,
      estado: status,
      lastUpdated: lastUpdated.toISOString()
    };
  }

  /**
   * Registrar asistencia de un estudiante
   */
  async registerAttendance(id) {
    try {
      const student = await this.prisma.student.findUnique({ where: { id } });
      if (!student) {
        return { ok: false, alumno: { nombre: "Error", estado: "No registrado" } };
      }

      const today = this.getTodayDate();
      const existingAttendance = await this.prisma.attendance.findFirst({
        where: { studentId: id, attendanceDate: today }
      });

      if (existingAttendance) {
        if (existingAttendance.status !== "Presente") {
          await this.prisma.attendance.update({
            where: { id: existingAttendance.id },
            data: { status: "Presente", attendanceTime: new Date() }
          });
          return {
            ok: true,
            alumno: this.createAlumnoObject(student, "Presente", new Date()),
            mensaje: "Asistencia registrada exitosamente"
          };
        } else {
          return {
            ok: true,
            alumno: this.createAlumnoObject(student, "Presente", existingAttendance.attendanceTime),
            mensaje: "Alumno ya estaba marcado como presente"
          };
        }
      } else {
        await this.prisma.attendance.create({
          data: { studentId: id, status: "Presente", attendanceDate: today, attendanceTime: new Date() }
        });
        return {
          ok: true,
          alumno: this.createAlumnoObject(student, "Presente", new Date()),
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
      const student = await this.prisma.student.findUnique({ where: { id } });
      if (!student) return { ok: false, mensaje: "Estudiante no encontrado" };

      const today = this.getTodayDate();
      let attendance = await this.prisma.attendance.findFirst({
        where: { studentId: id, attendanceDate: today }
      });

      if (attendance) {
        attendance = await this.prisma.attendance.update({
          where: { id: attendance.id },
          data: { status, attendanceTime: new Date() }
        });
      } else {
        attendance = await this.prisma.attendance.create({
          data: { studentId: id, status, attendanceDate: today, attendanceTime: new Date() }
        });
      }

      return {
        ok: true,
        alumno: this.createAlumnoObject(student, attendance.status, attendance.attendanceTime),
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
      const today = this.getTodayDate();
      const [total, todayAttendance] = await Promise.all([
        this.prisma.student.count(),
        this.prisma.attendance.findMany({ where: { attendanceDate: today } })
      ]);

      const presente = todayAttendance.filter(a => a.status === 'Presente').length;
      const tarde = todayAttendance.filter(a => a.status === 'Tarde').length;
      const presenteOrTarde = presente + tarde;

      return {
        total,
        presente,
        ausente: total - presenteOrTarde,
        tarde,
        attendanceRate: total > 0 ? ((presenteOrTarde / total * 100).toFixed(2)) : 0
      };
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
            where: { attendanceDate: this.getTodayDate() },
            orderBy: { attendanceTime: 'desc' },
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
   * Crear estudiante
   */
  async createStudent(data) {
    try {
      const student = await this.prisma.student.create({
        data
      });

      return {
        ok: true,
        alumno: {
          id: student.id,
          nombre: student.nombre,
          apellido: student.apellido,
          matricula: student.matricula,
          grupo: student.grupo,
          photoUrl: student.photoUrl
        },
        mensaje: "Estudiante creado exitosamente"
      };
    } catch (error) {
      console.error('Error creando estudiante:', error);
      throw new Error('Error interno al crear estudiante');
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
