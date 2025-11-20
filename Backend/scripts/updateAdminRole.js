// Script para actualizar el rol del usuario administrador a 'administrador'
// Ejecutar con: node scripts/updateAdminRole.js

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function updateAdminRole() {
  try {
    console.log('🔄 Buscando usuario administrador...');

    // Buscar usuario con username 'admin'
    const adminUser = await prisma.user.findUnique({
      where: { username: 'admin' }
    });

    if (!adminUser) {
      console.log('❌ No se encontró el usuario administrador');
      return;
    }

    if (adminUser.role === 'administrador') {
      console.log('ℹ️  El usuario administrador ya tiene el rol correcto');
      return;
    }

    // Actualizar el rol
    await prisma.user.update({
      where: { username: 'admin' },
      data: { role: 'administrador' }
    });

    console.log('✅ Rol del usuario administrador actualizado exitosamente');
    console.log('   Usuario: admin');
    console.log('   Nuevo rol: administrador');

  } catch (error) {
    console.error('❌ Error actualizando rol del administrador:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar el script
updateAdminRole();
