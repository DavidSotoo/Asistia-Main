// Script para agregar el campo email a la tabla users
// Ejecutar con: node scripts/addEmailToUsers.js

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function addEmailField() {
  try {
    console.log('🔄 Iniciando migración para agregar campo email...');
    
    // Verificar si ya existe el campo email
    const result = await prisma.$queryRaw`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'email';
    `;
    
    if (result.length > 0) {
      console.log('✅ El campo email ya existe en la tabla users');
      return;
    }
    
    // Agregar el campo email
    await prisma.$executeRaw`
      ALTER TABLE users ADD COLUMN email VARCHAR(255);
    `;
    
    console.log('✅ Campo email agregado exitosamente a la tabla users');
    
    // Crear un usuario admin por defecto si no existe
    const existingAdmin = await prisma.user.findFirst({
      where: { role: 'admin' }
    });
    
    if (!existingAdmin) {
      await prisma.user.create({
        data: {
          username: 'admin',
          password: 'admin123',
          name: 'Administrador',
          email: 'admin@asistia.com',
          role: 'admin'
        }
      });
      console.log('✅ Usuario administrador creado por defecto (admin/admin123)');
    } else {
      console.log('ℹ️  Ya existe un usuario administrador');
    }
    
    console.log('🎉 Migración completada exitosamente');
    
  } catch (error) {
    console.error('❌ Error durante la migración:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar la migración
addEmailField();
