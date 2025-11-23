// services/subjectService.js
// Servicio para gestión de materias usando PostgreSQL con Prisma

const databaseService = require('./databaseService');

class SubjectService {
  constructor() {
    this.prisma = databaseService.getClient();
  }

  /**
   * Crear una nueva materia
   */
  async createSubject(subjectData) {
    try {
      const { name, code, description, teacherId, schedules } = subjectData;

      // Verificar que el maestro existe
      const teacher = await this.prisma.user.findUnique({
        where: { id: teacherId }
      });

      if (!teacher) {
        throw new Error('Maestro no encontrado');
      }

      // Crear la materia con sus horarios
      const subject = await this.prisma.subject.create({
        data: {
          name,
          code,
          description,
          teacherId,
          schedules: schedules ? {
            create: schedules.map(schedule => ({
              dayOfWeek: schedule.dayOfWeek,
              startTime: schedule.startTime,
              endTime: schedule.endTime,
              classroom: schedule.classroom || null
            }))
          } : undefined
        },
        include: {
          teacher: {
            select: {
              id: true,
              name: true,
              username: true,
              email: true
            }
          },
          schedules: true
        }
      });

      return subject;
    } catch (error) {
      console.error('Error creando materia:', error);
      throw error;
    }
  }

  /**
   * Obtener todas las materias
   */
  async getAllSubjects() {
    try {
      const subjects = await this.prisma.subject.findMany({
        include: {
          teacher: {
            select: {
              id: true,
              name: true,
              username: true,
              email: true
            }
          },
          schedules: {
            orderBy: [
              { dayOfWeek: 'asc' },
              { startTime: 'asc' }
            ]
          }
        },
        orderBy: {
          name: 'asc'
        }
      });

      return subjects;
    } catch (error) {
      console.error('Error obteniendo materias:', error);
      throw error;
    }
  }

  /**
   * Obtener una materia por ID
   */
  async getSubjectById(subjectId) {
    try {
      const subject = await this.prisma.subject.findUnique({
        where: { id: subjectId },
        include: {
          teacher: {
            select: {
              id: true,
              name: true,
              username: true,
              email: true
            }
          },
          schedules: {
            orderBy: [
              { dayOfWeek: 'asc' },
              { startTime: 'asc' }
            ]
          }
        }
      });

      return subject;
    } catch (error) {
      console.error('Error obteniendo materia:', error);
      throw error;
    }
  }

  /**
   * Actualizar una materia
   */
  async updateSubject(subjectId, subjectData) {
    try {
      const { name, code, description, teacherId, schedules } = subjectData;

      // Verificar que la materia existe
      const existingSubject = await this.prisma.subject.findUnique({
        where: { id: subjectId }
      });

      if (!existingSubject) {
        throw new Error('Materia no encontrada');
      }

      // Si se cambia el maestro, verificar que existe
      if (teacherId) {
        const teacher = await this.prisma.user.findUnique({
          where: { id: teacherId }
        });

        if (!teacher) {
          throw new Error('Maestro no encontrado');
        }
      }

      // Actualizar la materia
      const updateData = {};
      if (name) updateData.name = name;
      if (code !== undefined) updateData.code = code;
      if (description !== undefined) updateData.description = description;
      if (teacherId) updateData.teacherId = teacherId;

      // Si se proporcionan horarios, actualizarlos
      if (schedules) {
        // Eliminar horarios existentes
        await this.prisma.schedule.deleteMany({
          where: { subjectId }
        });

        // Crear nuevos horarios
        updateData.schedules = {
          create: schedules.map(schedule => ({
            dayOfWeek: schedule.dayOfWeek,
            startTime: schedule.startTime,
            endTime: schedule.endTime,
            classroom: schedule.classroom || null
          }))
        };
      }

      const subject = await this.prisma.subject.update({
        where: { id: subjectId },
        data: updateData,
        include: {
          teacher: {
            select: {
              id: true,
              name: true,
              username: true,
              email: true
            }
          },
          schedules: {
            orderBy: [
              { dayOfWeek: 'asc' },
              { startTime: 'asc' }
            ]
          }
        }
      });

      return subject;
    } catch (error) {
      console.error('Error actualizando materia:', error);
      throw error;
    }
  }

  /**
   * Eliminar una materia
   */
  async deleteSubject(subjectId) {
    try {
      // Verificar que la materia existe
      const existingSubject = await this.prisma.subject.findUnique({
        where: { id: subjectId }
      });

      if (!existingSubject) {
        throw new Error('Materia no encontrada');
      }

      // Eliminar la materia (los horarios se eliminan en cascada)
      await this.prisma.subject.delete({
        where: { id: subjectId }
      });

      return true;
    } catch (error) {
      console.error('Error eliminando materia:', error);
      throw error;
    }
  }

  /**
   * Obtener materias de un maestro específico
   */
  async getSubjectsByTeacher(teacherId) {
    try {
      const subjects = await this.prisma.subject.findMany({
        where: { teacherId },
        include: {
          teacher: {
            select: {
              id: true,
              name: true,
              username: true,
              email: true
            }
          },
          schedules: {
            orderBy: [
              { dayOfWeek: 'asc' },
              { startTime: 'asc' }
            ]
          }
        },
        orderBy: {
          name: 'asc'
        }
      });

      return subjects;
    } catch (error) {
      console.error('Error obteniendo materias del maestro:', error);
      throw error;
    }
  }
}

module.exports = new SubjectService();

