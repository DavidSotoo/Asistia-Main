// Script para verificar usuarios existentes
// Ejecutar con: node scripts/checkUsers.js

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkUsers() {
  try {
    console.log('🔄 Verificando usuarios existentes...');
    
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        name: true,
        email: true,
        role: true,
        createdAt: true
      }
    });
    
    if (users.length === 0) {
      console.log('ℹ️  No hay usuarios en la base de datos');
    } else {
      console.log(`✅ Se encontraron ${users.length} usuarios:`);
      users.forEach(user => {
        console.log(`   - ${user.username} (${user.name}) - Rol: ${user.role} - Email: ${user.email || 'No especificado'}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error verificando usuarios:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar el script
checkUsers();
