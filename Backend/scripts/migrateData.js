// scripts/migrateData.js
// Script para migrar datos del JSON a PostgreSQL

const fs = require('fs').promises;
const path = require('path');
const databaseService = require('../services/databaseService');

const DB_PATH = path.join(__dirname, '../database.json');

async function migrateData() {
  try {
    console.log('🚀 Iniciando migración de datos...');
    
    // Conectar a la base de datos
    await databaseService.connect();
    const prisma = databaseService.getClient();

    // Leer datos del JSON
    console.log('📖 Leyendo datos del archivo JSON...');
    const data = await fs.readFile(DB_PATH, 'utf8');
    const estudiantes = JSON.parse(data);

    console.log(`📊 Encontrados ${estudiantes.length} estudiantes para migrar`);

    // Migrar estudiantes
    for (const estudiante of estudiantes) {
      try {
        // Verificar si el estudiante ya existe
        const existingStudent = await prisma.student.findUnique({
          where: { id: estudiante.id }
        });

        if (!existingStudent) {
          // Crear estudiante
          await prisma.student.create({
            data: {
              id: estudiante.id,
              nombre: estudiante.nombre,
              apellido: estudiante.apellido,
              grupo: 'Grupo A' // Valor por defecto
            }
          });
          console.log(`✅ Estudiante ${estudiante.id} migrado`);
        } else {
          console.log(`⚠️  Estudiante ${estudiante.id} ya existe`);
        }

        // Crear registro de asistencia si el estado no es "Ausente"
        if (estudiante.estado !== 'Ausente') {
          const today = new Date();
          const todayString = today.toISOString().split('T')[0];

          // Verificar si ya existe asistencia para hoy
          const existingAttendance = await prisma.attendance.findFirst({
            where: {
              studentId: estudiante.id,
              attendanceDate: new Date(todayString)
            }
          });

          if (!existingAttendance) {
            await prisma.attendance.create({
              data: {
                studentId: estudiante.id,
                status: estudiante.estado,
                attendanceDate: new Date(todayString),
                attendanceTime: estudiante.lastUpdated ? new Date(estudiante.lastUpdated) : new Date()
              }
            });
            console.log(`📝 Asistencia de ${estudiante.id} migrada`);
          }
        }
      } catch (error) {
        console.error(`❌ Error migrando estudiante ${estudiante.id}:`, error.message);
      }
    }

    console.log('🎉 Migración completada exitosamente!');
    
    // Mostrar resumen
    const totalStudents = await prisma.student.count();
    const totalAttendance = await prisma.attendance.count();
    const todayAttendance = await prisma.attendance.count({
      where: {
        attendanceDate: new Date(new Date().toISOString().split('T')[0])
      }
    });

    console.log('\n📊 Resumen de la migración:');
    console.log(`- Total estudiantes: ${totalStudents}`);
    console.log(`- Total registros de asistencia: ${totalAttendance}`);
    console.log(`- Asistencia de hoy: ${todayAttendance}`);

  } catch (error) {
    console.error('❌ Error durante la migración:', error);
  } finally {
    // Desconectar de la base de datos
    await databaseService.disconnect();
  }
}

// Ejecutar migración si se llama directamente
if (require.main === module) {
  migrateData();
}

module.exports = { migrateData };
