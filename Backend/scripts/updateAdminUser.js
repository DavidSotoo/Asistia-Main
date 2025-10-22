// Script para actualizar usuario administrador existente
// Ejecutar con: node scripts/updateAdminUser.js

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function updateAdminUser() {
  try {
    console.log('🔄 Actualizando usuario administrador...');
    
    // Buscar usuario admin
    const adminUser = await prisma.user.findUnique({
      where: { username: 'admin' }
    });
    
    if (!adminUser) {
      console.log('❌ No se encontró usuario admin');
      return;
    }
    
    // Actualizar usuario admin
    const updatedUser = await prisma.user.update({
      where: { username: 'admin' },
      data: {
        role: 'admin',
        email: 'admin@asistia.com'
      }
    });
    
    console.log('✅ Usuario administrador actualizado exitosamente:');
    console.log('   Usuario: admin');
    console.log('   Contraseña: admin123 (sin cambios)');
    console.log('   Email: admin@asistia.com');
    console.log('   Rol: admin');
    
  } catch (error) {
    console.error('❌ Error actualizando usuario administrador:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar el script
updateAdminUser();
