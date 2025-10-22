// Script para crear usuario administrador por defecto
// Ejecutar con: node scripts/createAdminUser.js

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createAdminUser() {
  try {
    console.log('🔄 Verificando usuario administrador...');
    
    // Verificar si ya existe un admin
    const existingAdmin = await prisma.user.findFirst({
      where: { role: 'admin' }
    });
    
    if (existingAdmin) {
      console.log('ℹ️  Ya existe un usuario administrador:', existingAdmin.username);
      return;
    }
    
    // Crear usuario administrador
    const adminUser = await prisma.user.create({
      data: {
        username: 'admin',
        password: 'admin123',
        name: 'Administrador',
        email: 'admin@asistia.com',
        role: 'admin'
      }
    });
    
    console.log('✅ Usuario administrador creado exitosamente:');
    console.log('   Usuario: admin');
    console.log('   Contraseña: admin123');
    console.log('   Email: admin@asistia.com');
    
  } catch (error) {
    console.error('❌ Error creando usuario administrador:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar el script
createAdminUser();
